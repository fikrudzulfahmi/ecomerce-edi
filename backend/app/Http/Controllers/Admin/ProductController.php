<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\ProductType;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController
{
    public function index(Request $request): JsonResponse
    {
        $products = Product::with('category')
            ->when($request->filled('q'), fn ($q) => $q->where('name', 'like', '%'.$request->string('q').'%'))
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->string('type')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->latest()
            ->paginate(15);

        return response()->json([
            'data' => ProductResource::collection($products->items()),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $data = $request->validated();
        $bookDetail = $data['book_detail'] ?? null;
        unset($data['book_detail']);

        $data['slug'] = $this->uniqueSlug($data['name']);
        $data['images'] = $data['images'] ?? [];
        $data['status'] = $data['status'] ?? 'active';
        $data['weight_gram'] = $data['weight_gram'] ?? 0;

        $product = Product::create($data);

        if ($product->type === ProductType::Book && $bookDetail) {
            $product->bookDetail()->create($bookDetail);
        }

        return response()->json([
            'data' => new ProductResource($product->load(['category', 'bookDetail'])),
        ], 201);
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $data = $request->validated();
        $bookDetail = $data['book_detail'] ?? null;
        unset($data['book_detail']);

        if (isset($data['name']) && $data['name'] !== $product->name) {
            $data['slug'] = $this->uniqueSlug($data['name'], $product->id);
        }

        $product->update($data);

        if ($bookDetail !== null && $product->type === ProductType::Book) {
            $product->bookDetail()->updateOrCreate(['product_id' => $product->id], $bookDetail);
        }

        return response()->json([
            'data' => new ProductResource($product->load(['category', 'bookDetail'])),
        ]);
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json(['message' => 'Produk dihapus.']);
    }

    public function toggleActive(Product $product): JsonResponse
    {
        $product->update(['status' => $product->status === 'active' ? 'inactive' : 'active']);

        return response()->json(['data' => new ProductResource($product)]);
    }

    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $slug = Str::slug($name);
        $original = $slug;
        $i = 1;

        while (Product::where('slug', $slug)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists()
        ) {
            $slug = $original.'-'.++$i;
        }

        return $slug;
    }
}
