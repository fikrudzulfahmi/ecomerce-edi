<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Exceptions\BusinessException;
use App\Http\Requests\Admin\ChangeOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\Order\OrderService;
use App\Services\Shipping\MengantarProvider;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController
{
    public function __construct(
        private readonly MengantarProvider $shipping,
        private readonly OrderService $orders,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $orders = Order::with(['user', 'items', 'payment', 'shipment'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('q'), fn ($q) => $q->where('code', 'like', '%'.$request->string('q').'%'))
            ->latest()
            ->paginate(15);

        return response()->json([
            'data' => OrderResource::collection($orders->items()),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function show(string $code): JsonResponse
    {
        $order = Order::where('code', $code)
            ->with(['user', 'items.product', 'payment', 'shipment'])
            ->firstOrFail();

        return response()->json(['data' => new OrderResource($order)]);
    }

    public function confirmPayment(string $code): JsonResponse
    {
        $order = Order::where('code', $code)->with('payment')->firstOrFail();

        if ($order->status !== OrderStatus::PendingPayment) {
            throw new BusinessException('Pesanan tidak menunggu pembayaran.');
        }

        $this->orders->markPaid($order, [
            'confirmed_by' => 'admin',
            'confirmed_at' => now()->toIso8601String(),
        ]);

        return response()->json(['data' => new OrderResource($order->fresh(['payment', 'shipment']))]);
    }

    public function createShipment(string $code): JsonResponse
    {
        $order = Order::where('code', $code)
            ->with(['items.product', 'shipment', 'payment'])
            ->firstOrFail();

        if ($order->shipment?->awb) {
            throw new BusinessException('Resi sudah dibuat.');
        }

        $result = $this->shipping->createShipment($order);

        $order->shipment->update([
            'awb' => $result['awb'],
            'status' => 'pickup_pending',
        ]);

        if ($order->payment_method?->value !== 'cod' && $order->status === OrderStatus::Paid) {
            $order->update(['status' => OrderStatus::Processing]);
        }

        return response()->json(['data' => new OrderResource($order->load(['shipment', 'payment']))]);
    }

    public function changeStatus(ChangeOrderStatusRequest $request, string $code): JsonResponse
    {
        $order = Order::where('code', $code)->firstOrFail();
        $order->update(['status' => $request->validated('status')]);

        return response()->json(['data' => new OrderResource($order->load(['shipment', 'payment']))]);
    }
}
