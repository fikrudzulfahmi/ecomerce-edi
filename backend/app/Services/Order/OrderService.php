<?php

declare(strict_types=1);

namespace App\Services\Order;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Exceptions\BusinessException;
use App\Models\Address;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\Payment\PaymentProviderInterface;
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

        if (! $hasPhysical && $method !== PaymentMethod::Gdc) {
            throw new BusinessException('Produk digital hanya bisa dibayar online (GDC).');
        }

        return DB::transaction(function () use ($user, $address, $method, $shipping, $items, $hasPhysical): Order {
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

                $subtotal += $item->qty * $product->price;

                $orderItems[] = [
                    'product_id' => $product->id,
                    'name_snapshot' => $product->name,
                    'price_snapshot' => $product->price,
                    'qty' => $item->qty,
                ];

                if (! $product->isEbook()) {
                    $stockItems[] = ['product_id' => $product->id, 'qty' => $item->qty];
                }
            }

            $shippingCost = $shipping?->cost ?? 0;
            $total = $subtotal + $shippingCost;

            $order = $user->orders()->create([
                'code' => $this->generateCode(),
                'status' => $method === PaymentMethod::Gdc
                    ? OrderStatus::PendingPayment
                    : OrderStatus::CodPending,
                'subtotal' => $subtotal,
                'shipping_cost' => $shippingCost,
                'total' => $total,
                'payment_method' => $method,
                'address_snapshot' => $address ? $this->snapshotAddress($address) : null,
                'expires_at' => $method === PaymentMethod::Gdc ? now()->addHours(2) : null,
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

            if ($method === PaymentMethod::Gdc) {
                $this->payment->createTransaction($order);
            }

            return $order->load('items.product', 'payment', 'shipment');
        });
    }

    public function cancel(Order $order): void
    {
        if (! in_array($order->status, [OrderStatus::PendingPayment, OrderStatus::CodPending], true)) {
            throw new BusinessException('Pesanan tidak dapat dibatalkan.');
        }

        DB::transaction(function () use ($order): void {
            $order->update(['status' => OrderStatus::Cancelled]);
            $this->restock($order);
        });
    }

    public function markPaid(Order $order): void
    {
        if ($order->status !== OrderStatus::PendingPayment) {
            return;
        }

        DB::transaction(function () use ($order): void {
            $order->payment()->update(['status' => 'paid', 'paid_at' => now()]);
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
        });
    }

    private function isDigitalOnly(Order $order): bool
    {
        return $order->address_snapshot === null;
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
