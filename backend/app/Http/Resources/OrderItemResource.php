<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name_snapshot,
            'price' => $this->price_snapshot,
            'qty' => $this->qty,
            'subtotal' => $this->price_snapshot * $this->qty,
            'product' => new ProductResource($this->whenLoaded('product')),
        ];
    }
}
