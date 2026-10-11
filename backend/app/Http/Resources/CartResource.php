<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $items = $this->items;

        return [
            'id' => $this->id,
            'items' => CartItemResource::collection($items),
            'subtotal' => $items->sum(fn ($item) => $item->qty * $item->product->sale_price),
            'total_items' => $items->sum('qty'),
        ];
    }
}
