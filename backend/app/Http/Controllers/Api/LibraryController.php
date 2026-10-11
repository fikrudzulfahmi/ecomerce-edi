<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;

class LibraryController
{
    public function index(Request $request): JsonResponse
    {
        $statuses = [
            OrderStatus::Paid,
            OrderStatus::Processing,
            OrderStatus::Shipped,
            OrderStatus::Delivered,
            OrderStatus::CodCompleted,
        ];

        $items = OrderItem::query()
            ->whereHas('order', fn ($q) => $q->where('user_id', $request->user()->id)->whereIn('status', $statuses))
            ->whereHas('product', fn ($q) => $q->whereNotNull('digital_file'))
            ->with(['order', 'product:id,name,type,digital_file,images'])
            ->latest('id')
            ->get()
            ->map(fn (OrderItem $item) => [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'name' => $item->name_snapshot,
                'type' => $item->product?->type?->value,
                'image' => $item->product?->images[0] ?? null,
                'order_code' => $item->order->code,
                'purchased_at' => $item->order->created_at?->toISOString(),
            ])
            ->values();

        return response()->json(['data' => $items]);
    }

    public function downloadUrl(Request $request, OrderItem $orderItem): JsonResponse
    {
        $this->authorizeDownload($request->user(), $orderItem);

        $url = URL::temporarySignedRoute(
            'downloads.show',
            now()->addHours(24),
            ['orderItem' => $orderItem->id],
        );

        return response()->json(['url' => $url]);
    }

    private function authorizeDownload(User $user, OrderItem $orderItem): void
    {
        $order = $orderItem->order;

        if ($order->user_id !== $user->id) {
            abort(403, 'Akses ditolak.');
        }

        if (! $orderItem->product?->digital_file || ! $order->isPaidForDownload()) {
            abort(403, 'Produk digital belum tersedia untuk diunduh.');
        }
    }
}
