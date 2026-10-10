<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\PaymentMethod;
use App\Exceptions\BusinessException;
use App\Http\Requests\Checkout\CheckoutRequest;
use App\Http\Resources\OrderResource;
use App\Services\Order\OrderService;
use App\Services\Shipping\ShippingProviderInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckoutController
{
    public function __construct(
        private readonly OrderService $orderService,
        private readonly ShippingProviderInterface $shipping,
    ) {}

    public function shippingOptions(Request $request): JsonResponse
    {
        $cart = $request->user()->cart()->with('items.product')->first();
        $items = $cart?->items ?? collect();
        $weight = $items->sum(fn ($item) => $item->qty * $item->product->weight_gram);

        $options = $this->shipping->getOptions($weight);

        return response()->json([
            'data' => array_map(fn ($option) => $option->toArray(), $options),
            'total_weight_gram' => $weight,
        ]);
    }

    public function checkout(CheckoutRequest $request): JsonResponse
    {
        $user = $request->user();
        $address = $user->addresses()->findOrFail($request->validated('address_id'));
        $method = PaymentMethod::from($request->validated('payment_method'));

        $cart = $user->cart()->with('items.product')->first();
        $weight = $cart?->items->sum(fn ($item) => $item->qty * $item->product->weight_gram) ?? 0;

        $options = $this->shipping->getOptions($weight);
        $option = collect($options)->first(
            fn ($o) => $o->courier === $request->validated('courier')
                && $o->service === $request->validated('service'),
        );

        if (! $option) {
            throw new BusinessException('Opsi pengiriman tidak valid.');
        }

        $order = $this->orderService->createFromCart($user, $address, $method, $option);

        return response()->json(['data' => new OrderResource($order)], 201);
    }
}
