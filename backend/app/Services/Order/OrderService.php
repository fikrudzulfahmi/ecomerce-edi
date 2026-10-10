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
        Address $address,
        PaymentMethod $method,
        ShippingOption $shipping,
    ): Order {
        $cart = $user->cart()->with('items.product')->first();
        $items = $cart?->items ?? collect();

        if ($items->isEmpty()) {
            throw new BusinessException('Keranjang kosong.');
        }

        return DB::transaction(function () use ($user, $address, $method, $shipping, $items): Order {
            $subtotal = 0;
            $orderItems = [];

            foreach ($items as $item) {
                // Kunci baris produk agar stok tidak berubah selama checkout.
                $product = Product::whereKey($item->product_id)->lockForUpdate()->first();

                if (! $product || $product->stock < $item->qty) {
                    $productName = $product?->name ?? 'produk';
                    throw new BusinessException("Stok '{$productName}' tidak mencukupi.");
                }

                $subtotal += $item->qty * $product->price;

                $orderItems[] = [
                    'product_id' => $product->id,
                    'name_snapshot' => $product->name,
                    'price_snapshot' => $product->price,
                    'qty' => $item->qty,
                ];
            }

            $total = $subtotal + $shipping->cost;

            $order = $user->orders()->create([
                'code' => $this->generateCode(),
                'status' => $method === PaymentMethod::Gdc
                    ? OrderStatus::PendingPayment
                    : OrderStatus::CodPending,
                'subtotal' => $subtotal,
                'shipping_cost' => $shipping->cost,
                'total' => $total,
                'payment_method' => $method,
                'address_snapshot' => $this->snapshotAddress($address),
                'expires_at' => $method === PaymentMethod::Gdc ? now()->addHours(2) : null,
            ]);

            foreach ($orderItems as $data) {
                $order->items()->create($data);
                $this->stock->reduce($data['product_id'], $data['qty']);
            }

            // Kosongkan keranjang.
            $items->each->delete();

            // Kurir yang dipilih disimpan di shipment (resi dibuat di Fase 9).
            $order->shipment()->create([
                'courier' => $shipping->courier,
                'service' => $shipping->service,
                'status' => 'pending',
                'cod_amount' => $method === PaymentMethod::Cod ? $total : 0,
            ]);

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
            $order->update(['status' => OrderStatus::Paid]);
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

    private function restock(Order $order): void
    {
        foreach ($order->items as $item) {
            if ($item->product_id !== null) {
                $this->stock->increase($item->product_id, $item->qty);
            }
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
