<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Requests\Cart\AddCartItemRequest;
use App\Http\Requests\Cart\UpdateCartItemRequest;
use App\Http\Resources\CartResource;
use App\Models\Cart;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CartController
{
    public function index(Request $request): JsonResponse
    {
        $cart = $this->getCart($request->user());
        $cart->load('items.product.bookDetail');

        return response()->json(['data' => new CartResource($cart)]);
    }

    public function addItem(AddCartItemRequest $request): JsonResponse
    {
        $user = $request->user();
        $product = Product::where('status', 'active')->findOrFail($request->validated('product_id'));
        $qty = (int) $request->validated('qty');

        if ($product->stock <= 0) {
            throw ValidationException::withMessages([
                'product_id' => ['Produk sedang kosong.'],
            ]);
        }

        $cart = $this->getCart($user);
        $item = $cart->items()->where('product_id', $product->id)->first();

        $newQty = $item ? $item->qty + $qty : $qty;

        if ($newQty > $product->stock) {
            throw ValidationException::withMessages([
                'qty' => ["Jumlah melebihi stok (tersisa {$product->stock})."],
            ]);
        }

        if ($item) {
            $item->update(['qty' => $newQty]);
        } else {
            $item = $cart->items()->create([
                'product_id' => $product->id,
                'qty' => $qty,
            ]);
        }

        $cart->load('items.product.bookDetail');

        return response()->json(['data' => new CartResource($cart)], 201);
    }

    public function updateItem(UpdateCartItemRequest $request, int $item): JsonResponse
    {
        $cart = $this->getCart($request->user());
        $cartItem = $cart->items()->with('product')->findOrFail($item);
        $qty = (int) $request->validated('qty');

        if ($qty > $cartItem->product->stock) {
            throw ValidationException::withMessages([
                'qty' => ["Jumlah melebihi stok (tersisa {$cartItem->product->stock})."],
            ]);
        }

        $cartItem->update(['qty' => $qty]);

        $cart->load('items.product.bookDetail');

        return response()->json(['data' => new CartResource($cart)]);
    }

    public function removeItem(Request $request, int $item): JsonResponse
    {
        $cart = $this->getCart($request->user());
        $cart->items()->whereKey($item)->delete();

        $cart->load('items.product.bookDetail');

        return response()->json(['data' => new CartResource($cart)]);
    }

    private function getCart(User $user): Cart
    {
        return Cart::firstOrCreate(['user_id' => $user->id]);
    }
}
