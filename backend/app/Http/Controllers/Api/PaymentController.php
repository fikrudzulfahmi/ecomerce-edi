<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Exceptions\BusinessException;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\Order\OrderService;
use App\Services\Payment\IpaymuPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController
{
    public function __construct(
        private readonly OrderService $orders,
        private readonly IpaymuPaymentService $ipaymu,
    ) {}

    /**
     * Buat / ambil ulang sesi pembayaran untuk order yang menunggu bayar.
     */
    public function store(Request $request, string $code): JsonResponse
    {
        $order = $this->find($request, $code);

        $result = $this->orders->startPayment($order);
        $order = $this->fresh($order);

        return response()->json([
            'data' => new OrderResource($order),
            'redirect_url' => $result->redirectUrl,
        ]);
    }

    /**
     * Rekonsiliasi status pembayaran langsung ke iPaymu.
     */
    public function sync(Request $request, string $code): JsonResponse
    {
        $order = $this->find($request, $code);

        if (! $order->payment_method?->isOnline()) {
            throw new BusinessException('Pesanan ini tidak memakai pembayaran online.');
        }

        $this->ipaymu->sync($order);

        return response()->json(['data' => new OrderResource($this->fresh($order))]);
    }

    private function find(Request $request, string $code): Order
    {
        return $request->user()->orders()
            ->where('code', $code)
            ->with(['items.product', 'payment', 'shipment'])
            ->firstOrFail();
    }

    private function fresh(Order $order): Order
    {
        return $order->fresh(['items.product', 'payment', 'shipment']);
    }
}
