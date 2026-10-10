<?php

declare(strict_types=1);

namespace App\Services\Stock;

use App\Exceptions\BusinessException;
use App\Models\Product;
use App\Models\StockMovement;

class StockService
{
    public function reduce(int $productId, int $qty): void
    {
        $affected = Product::whereKey($productId)
            ->where('stock', '>=', $qty)
            ->decrement('stock', $qty);

        if ($affected === 0) {
            throw new BusinessException('Stok tidak mencukupi.');
        }

        StockMovement::create([
            'product_id' => $productId,
            'delta' => -$qty,
            'reason' => 'order',
        ]);
    }

    public function increase(int $productId, int $qty): void
    {
        Product::whereKey($productId)->increment('stock', $qty);

        StockMovement::create([
            'product_id' => $productId,
            'delta' => $qty,
            'reason' => 'restock',
        ]);
    }
}
