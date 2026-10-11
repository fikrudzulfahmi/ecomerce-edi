<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Requests\Product\ProductIndexRequest;
use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;

class ProductController
{
    public function index(ProductIndexRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $query = Product::query()
            ->with(['category', 'bookDetail'])
            ->where('status', 'active');

        if ($q = $validated['q'] ?? null) {
            $query->where(function ($builder) use ($q): void {
                $builder->where('name', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%")
                    ->orWhereHas('bookDetail', function ($b) use ($q): void {
                        $b->where('author', 'like', "%{$q}%")
                            ->orWhere('publisher', 'like', "%{$q}%");
                    });
            });
        }

        if ($categorySlug = $validated['category'] ?? null) {
            $category = Category::where('slug', $categorySlug)->first();
            if ($category) {
                $categoryIds = $category->children()->pluck('id')->push($category->id);
                $query->whereIn('category_id', $categoryIds);
            }
        }

        if ($type = $validated['type'] ?? null) {
            $query->where('type', $type);
        }

        if ($min = $validated['min_price'] ?? null) {
            $query->where('price', '>=', $min);
        }

        if ($max = $validated['max_price'] ?? null) {
            $query->where('price', '<=', $max);
        }

        $sort = $validated['sort'] ?? 'latest';
        if ($sort === 'price_asc') {
            $query->orderBy('price', 'asc');
        } elseif ($sort === 'price_desc') {
            $query->orderBy('price', 'desc');
        } elseif ($sort === 'name_asc') {
            $query->orderBy('name', 'asc');
        } elseif ($sort === 'rating') {
            $query->orderByDesc('rating_avg')->orderByDesc('rating_count');
        } else {
            $query->latest('created_at');
        }

        $products = $query->paginate($validated['per_page'] ?? 12);

        return response()->json([
            'data' => ProductResource::collection($products->items()),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $product = Product::query()
            ->with(['category', 'bookDetail'])
            ->where('slug', $slug)
            ->where('status', 'active')
            ->firstOrFail();

        $related = Product::query()
            ->with('bookDetail')
            ->where('status', 'active')
            ->where('category_id', $product->category_id)
            ->whereKeyNot($product->id)
            ->latest('created_at')
            ->limit(4)
            ->get();

        return response()->json([
            'data' => new ProductResource($product),
            'related' => ProductResource::collection($related),
        ]);
    }
}
