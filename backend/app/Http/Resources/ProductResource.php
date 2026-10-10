<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'type' => $this->type?->value,
            'price' => $this->price,
            'weight_gram' => $this->weight_gram,
            'stock' => $this->stock,
            'status' => $this->status,
            'images' => $this->images ?? [],
            'description' => $this->description,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'book_detail' => new BookDetailResource($this->whenLoaded('bookDetail')),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
