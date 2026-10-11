<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\PaymentMethod;
use App\Exceptions\BusinessException;
use App\Http\Requests\Checkout\CheckoutRequest;
use App\Http\Resources\OrderResource;
use App\Models\Address;
use App\Models\Setting;
use App\Models\User;
use App\Services\Order\OrderService;
use App\Services\Shipping\ShippingDestination;
use App\Services\Shipping\ShippingProviderInterface;
use App\Services\Voucher\VoucherService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckoutController
{
    public function __construct(
        private readonly OrderService $orderService,
        private readonly ShippingProviderInterface $shipping,
        private readonly VoucherService $vouchers,
    ) {}

    public function shippingOptions(Request $request): JsonResponse
    {
        $user = $request->user();
        $cart = $user->cart()->with('items.product')->first();
        $items = $cart?->items ?? collect();

        $hasPhysical = $items->contains(fn ($item) => ! $item->product->isEbook());
        $weight = $items->sum(
            fn ($item) => $item->product->isEbook() ? 0 : $item->qty * $item->product->weight_gram,
        );

        if (! $hasPhysical) {
            return response()->json(['data' => [], 'total_weight_gram' => 0]);
        }

        $destination = $this->destinationFor($user, $request->integer('address_id'));
        $options = $this->shipping->getOptions($destination, $weight);

        return response()->json([
            'data' => array_map(fn ($option) => $option->toArray(), $options),
            'total_weight_gram' => $weight,
        ]);
    }

    public function checkout(CheckoutRequest $request): JsonResponse
    {
        $user = $request->user();
        $cart = $user->cart()->with('items.product')->first();
        $items = $cart?->items ?? collect();

        if ($items->isEmpty()) {
            throw new BusinessException('Keranjang kosong.');
        }

        $hasPhysical = $items->contains(fn ($item) => ! $item->product->isEbook());
        $subtotal = $items->sum(fn ($item) => $item->qty * $item->product->price);

        if ($hasPhysical) {
            $addressId = $request->integer('address_id');
            if (! $addressId) {
                throw new BusinessException('Alamat pengiriman wajib diisi.');
            }

            $address = $user->addresses()->findOrFail($addressId);
            $method = PaymentMethod::from($request->validated('payment_method') ?? 'gdc');

            $weight = $items->sum(
                fn ($item) => $item->product->isEbook() ? 0 : $item->qty * $item->product->weight_gram,
            );
            $destination = $this->destinationFromAddress($address);
            $options = $this->shipping->getOptions($destination, $weight);
            $option = collect($options)->first(
                fn ($o) => $o->courier === $request->validated('courier')
                    && $o->service === $request->validated('service'),
            );

            if (! $option) {
                throw new BusinessException('Opsi pengiriman tidak valid.');
            }

            $shippingCost = $option->cost;
        } else {
            $address = null;
            $method = PaymentMethod::Gdc;
            $option = null;
            $shippingCost = 0;
        }

        $voucher = null;
        $discount = 0;
        $voucherCode = $request->validated('voucher_code');
        if ($voucherCode) {
            $voucher = $this->vouchers->validate((string) $voucherCode, $subtotal);
            $discount = $this->vouchers->calculate($voucher, $subtotal, $shippingCost);
        }

        $order = $this->orderService->createFromCart($user, $address, $method, $option, $voucher, $discount);

        return response()->json(['data' => new OrderResource($order)], 201);
    }

    public function meta(): JsonResponse
    {
        return response()->json([
            'data' => [
                'handling_fee' => (int) Setting::get('handling_fee', 0),
            ],
        ]);
    }

    public function previewVoucher(Request $request): JsonResponse
    {
        $request->validate([
            'voucher_code' => ['required', 'string', 'max:50'],
            'shipping_cost' => ['nullable', 'integer', 'min:0'],
        ]);

        $user = $request->user();
        $cart = $user->cart()->with('items.product')->first();
        $items = $cart?->items ?? collect();
        $subtotal = $items->sum(fn ($item) => $item->qty * $item->product->price);
        $shippingCost = (int) ($request->input('shipping_cost') ?? 0);

        $voucher = $this->vouchers->validate((string) $request->input('voucher_code'), $subtotal);
        $discount = $this->vouchers->calculate($voucher, $subtotal, $shippingCost);

        return response()->json([
            'data' => [
                'discount_amount' => $discount,
                'voucher' => [
                    'code' => $voucher->code,
                    'name' => $voucher->name,
                    'type' => $voucher->type->value,
                ],
            ],
        ]);
    }

    private function destinationFor(User $user, ?int $addressId): ShippingDestination
    {
        $address = $addressId
            ? $user->addresses()->find($addressId)
            : $user->addresses()->where('is_default', true)->first();

        return $this->destinationFromAddress($address);
    }

    private function destinationFromAddress(?Address $address): ShippingDestination
    {
        return new ShippingDestination(
            province: $address?->province ?? '',
            city: $address?->city ?? '',
            district: $address?->district ?? '',
            postalCode: $address?->postal_code ?? '',
        );
    }
}
