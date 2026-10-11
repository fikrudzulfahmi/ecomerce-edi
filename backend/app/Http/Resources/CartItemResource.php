<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'qty' => $this->qty,
            'product' => new ProductResource($this->whenLoaded('product')),
            'subtotal' => $this->qty * ($this->product?->sale_price ?? 0),
        ];
    }
}
