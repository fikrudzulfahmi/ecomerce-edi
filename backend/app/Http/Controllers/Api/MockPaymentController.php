<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\Order\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Simulasi pembayaran GDC (mock). Diganti webhook asli pada Fase 8.
 */
class MockPaymentController
{
    public function __construct(private readonly OrderService $orderService) {}

    public function success(Request $request, string $code): JsonResponse
    {
        $order = $this->ownerOrder($request, $code);
        $this->orderService->markPaid($order);

        return response()->json([
            'data' => new OrderResource($order->load(['items.product', 'payment', 'shipment'])),
        ]);
    }

    public function failure(Request $request, string $code): JsonResponse
    {
        $order = $this->ownerOrder($request, $code);
        $this->orderService->markFailed($order);

        return response()->json([
            'data' => new OrderResource($order->load(['items.product', 'payment', 'shipment'])),
        ]);
    }

    private function ownerOrder(Request $request, string $code): Order
    {
        return $request->user()->orders()->where('code', $code)->firstOrFail();
    }
}
