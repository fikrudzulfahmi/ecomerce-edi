<?php

declare(strict_types=1);

namespace App\Services\Order;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Exceptions\BusinessException;
use App\Models\Address;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use App\Models\Voucher;
use App\Services\Payment\PaymentProviderInterface;
use App\Services\Payment\PaymentResult;
use App\Services\Shipping\ShippingOption;
use App\Services\Stock\StockService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderService
{
    public function __construct(
        private readonly StockService $stock,
        private readonly PaymentProviderInterface $payment,
    ) {}

    public function createFromCart(
        User $user,
        ?Address $address,
        PaymentMethod $method,
        ?ShippingOption $shipping,
        ?Voucher $voucher = null,
        int $discount = 0,
    ): Order {
        $cart = $user->cart()->with('items.product')->first();
        $items = $cart?->items ?? collect();

        if ($items->isEmpty()) {
            throw new BusinessException('Keranjang kosong.');
        }

        $hasPhysical = $items->contains(fn ($item) => ! $item->product->isEbook());

        if ($hasPhysical && (! $address || ! $shipping)) {
            throw new BusinessException('Alamat dan kurir wajib untuk produk fisik.');
        }

        if (! $hasPhysical && ! $method->isOnline()) {
            throw new BusinessException('Produk digital hanya bisa dibayar online.');
        }

        return DB::transaction(function () use ($user, $address, $method, $shipping, $items, $hasPhysical, $voucher, $discount): Order {
            $subtotal = 0;
            $orderItems = [];
            $stockItems = [];

            foreach ($items as $item) {
                $product = Product::whereKey($item->product_id)->lockForUpdate()->first();

                if (! $product) {
                    throw new BusinessException('Produk tidak ditemukan.');
                }

                if (! $product->isEbook() && $product->stock < $item->qty) {
                    throw new BusinessException("Stok '{$product->name}' tidak mencukupi.");
                }

                $subtotal += $item->qty * $product->sale_price;

                $orderItems[] = [
                    'product_id' => $product->id,
                    'name_snapshot' => $product->name,
                    'price_snapshot' => $product->sale_price,
                    'qty' => $item->qty,
                ];

                $product->increment('sold_count', $item->qty);

                if (! $product->isEbook()) {
                    $stockItems[] = ['product_id' => $product->id, 'qty' => $item->qty];
                }
            }

            $shippingCost = $shipping?->cost ?? 0;
            $handlingFee = (int) Setting::get('handling_fee', 0);
            $total = $subtotal + $shippingCost + $handlingFee - $discount;

            $order = $user->orders()->create([
                'code' => $this->generateCode(),
                'status' => $method->isOnline()
                    ? OrderStatus::PendingPayment
                    : OrderStatus::CodPending,
                'subtotal' => $subtotal,
                'shipping_cost' => $shippingCost,
                'handling_fee' => $handlingFee,
                'voucher_id' => $voucher?->id,
                'voucher_code' => $voucher?->code,
                'discount_amount' => $discount,
                'total' => $total,
                'payment_method' => $method,
                'address_snapshot' => $address ? $this->snapshotAddress($address) : null,
                'expires_at' => $method->isOnline() ? now()->addHours(2) : null,
            ]);

            foreach ($orderItems as $data) {
                $order->items()->create($data);
            }

            foreach ($stockItems as $stock) {
                $this->stock->reduce($stock['product_id'], $stock['qty']);
            }

            $items->each->delete();

            if ($hasPhysical && $shipping) {
                $order->shipment()->create([
                    'courier' => $shipping->courier,
                    'service' => $shipping->service,
                    'status' => 'pending',
                    'cod_amount' => $method === PaymentMethod::Cod ? $total : 0,
                ]);
            }

            if ($voucher) {
                $voucher->increment('used_count');
            }

            return $order->load('items.product', 'payment', 'shipment');
        });
    }

    /**
     * Buat sesi pembayaran (dipanggil setelah order ter-commit, jadi gangguan
     * di gateway tidak membatalkan order/keranjang).
     */
    public function startPayment(Order $order): PaymentResult
    {
        if (! $order->payment_method?->isOnline()) {
            throw new BusinessException('Pesanan ini tidak memakai pembayaran online.');
        }

        if ($order->status !== OrderStatus::PendingPayment) {
            throw new BusinessException('Pesanan ini tidak menunggu pembayaran.');
        }

        $existing = $order->payment;
        $url = (string) ($existing?->raw_payload['url'] ?? '');
        $stillValid = $order->expires_at === null || $order->expires_at->isFuture();

        if ($existing && $existing->status === 'pending' && $url !== '' && $stillValid) {
            return new PaymentResult(payment: $existing, redirectUrl: $url);
        }

        $result = $this->payment->createTransaction($order);
        $order->setRelation('payment', $result->payment);

        return $result;
    }

    public function cancel(Order $order): void
    {
        if (! in_array($order->status, [OrderStatus::PendingPayment, OrderStatus::CodPending], true)) {
            throw new BusinessException('Pesanan tidak dapat dibatalkan.');
        }

        DB::transaction(function () use ($order): void {
            $order->update(['status' => OrderStatus::Cancelled]);
            $this->restock($order);
            $this->releaseVoucher($order);
        });
    }

    /**
     * @param  array<string, mixed>  $paymentPayload  Data tambahan (trx_id, channel, callback).
     */
    public function markPaid(Order $order, array $paymentPayload = []): void
    {
        if ($order->status !== OrderStatus::PendingPayment) {
            return;
        }

        DB::transaction(function () use ($order, $paymentPayload): void {
            $payment = $order->payment;
            $attributes = [
                'provider' => $payment?->provider ?? 'ipaymu',
                'status' => 'paid',
                'paid_at' => now(),
                'raw_payload' => array_merge($payment?->raw_payload ?? [], $paymentPayload),
            ];

            if ($payment) {
                $payment->update($attributes);
            } else {
                $order->payment()->create($attributes);
            }

            $order->update([
                'status' => $this->isDigitalOnly($order) ? OrderStatus::Delivered : OrderStatus::Paid,
            ]);
        });
    }

    public function markFailed(Order $order): void
    {
        if ($order->status !== OrderStatus::PendingPayment) {
            return;
        }

        DB::transaction(function () use ($order): void {
            $order->payment()->update(['status' => 'failed']);
            $order->update(['status' => OrderStatus::Cancelled]);
            $this->restock($order);
            $this->releaseVoucher($order);
        });
    }

    public function expire(Order $order): void
    {
        if ($order->status !== OrderStatus::PendingPayment) {
            return;
        }

        DB::transaction(function () use ($order): void {
            $order->update(['status' => OrderStatus::Expired]);
            $this->restock($order);
            $this->releaseVoucher($order);
        });
    }

    private function isDigitalOnly(Order $order): bool
    {
        return $order->address_snapshot === null;
    }

    private function releaseVoucher(Order $order): void
    {
        if (! $order->voucher_id) {
            return;
        }

        Voucher::whereKey($order->voucher_id)
            ->where('used_count', '>', 0)
            ->decrement('used_count');
    }

    private function restock(Order $order): void
    {
        $order->loadMissing('items.product');

        foreach ($order->items as $item) {
            if ($item->product_id === null || $item->product?->isEbook()) {
                continue;
            }

            $this->stock->increase($item->product_id, $item->qty);
        }
    }

    private function snapshotAddress(Address $address): array
    {
        return [
            'recipient' => $address->recipient,
            'phone' => $address->phone,
            'province' => $address->province,
            'city' => $address->city,
            'district' => $address->district,
            'postal_code' => $address->postal_code,
            'detail' => $address->detail,
        ];
    }

    private function generateCode(): string
    {
        do {
            $code = 'EDI'.now()->format('ymd').Str::upper(Str::random(5));
        } while (Order::where('code', $code)->exists());

        return $code;
    }
}
