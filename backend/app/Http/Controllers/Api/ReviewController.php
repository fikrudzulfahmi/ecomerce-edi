<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Exceptions\BusinessException;
use App\Http\Requests\Review\StoreReviewRequest;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\JsonResponse;

class ReviewController
{
    public function index(string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)->firstOrFail();

        $reviews = $product->reviews()
            ->with('user:id,name')
            ->latest()
            ->limit(30)
            ->get()
            ->map(fn (Review $r) => [
                'id' => $r->id,
                'rating' => $r->rating,
                'comment' => $r->comment,
                'user' => ['name' => $r->user->name],
                'created_at' => $r->created_at?->toISOString(),
            ]);

        return response()->json(['data' => $reviews]);
    }

    public function store(StoreReviewRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        $order = $user->orders()->findOrFail($data['order_id']);

        if (! in_array($order->status, [OrderStatus::Delivered, OrderStatus::CodCompleted], true)) {
            throw new BusinessException('Ulasan hanya bisa diberikan setelah pesanan diterima.');
        }

        if (! $order->items()->where('product_id', $data['product_id'])->exists()) {
            throw new BusinessException('Produk tidak ada di pesanan ini.');
        }

        if (Review::where('user_id', $user->id)
            ->where('product_id', $data['product_id'])
            ->where('order_id', $order->id)
            ->exists()) {
            throw new BusinessException('Produk ini sudah kamu ulas.');
        }

        $review = Review::create([
            'user_id' => $user->id,
            'product_id' => $data['product_id'],
            'order_id' => $order->id,
            'rating' => $data['rating'],
            'comment' => $data['comment'] ?? null,
        ]);

        $this->recalculateRating($data['product_id']);

        return response()->json(['data' => [
            'id' => $review->id,
            'rating' => $review->rating,
            'comment' => $review->comment,
        ]], 201);
    }

    private function recalculateRating(int $productId): void
    {
        $product = Product::find($productId);

        if ($product) {
            $product->update([
                'rating_avg' => $product->reviews()->avg('rating') ?? 0,
                'rating_count' => $product->reviews()->count(),
            ]);
        }
    }
}
