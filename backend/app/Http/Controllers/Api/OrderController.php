<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Resources\OrderResource;
use App\Services\Order\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController
{
    public function __construct(private readonly OrderService $orderService) {}

    public function index(Request $request): JsonResponse
    {
        $orders = $request->user()->orders()
            ->with(['items.product', 'payment', 'shipment'])
            ->latest()
            ->paginate(10);

        return response()->json([
            'data' => OrderResource::collection($orders->items()),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function show(Request $request, string $code): JsonResponse
    {
        $order = $request->user()->orders()
            ->where('code', $code)
            ->with(['items.product', 'payment', 'shipment'])
            ->firstOrFail();

        return response()->json(['data' => new OrderResource($order)]);
    }

    public function cancel(Request $request, string $code): JsonResponse
    {
        $order = $request->user()->orders()->where('code', $code)->firstOrFail();
        $this->orderService->cancel($order);

        return response()->json([
            'data' => new OrderResource($order->load(['items.product', 'payment', 'shipment'])),
        ]);
    }
}
