<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ProductType;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory;

    protected $fillable = [
        'category_id',
        'type',
        'name',
        'slug',
        'description',
        'price',
        'weight_gram',
        'stock',
        'status',
        'images',
    ];

    protected function casts(): array
    {
        return [
            'type' => ProductType::class,
            'price' => 'integer',
            'weight_gram' => 'integer',
            'stock' => 'integer',
            'images' => 'array',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function bookDetail(): HasOne
    {
        return $this->hasOne(BookDetail::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
