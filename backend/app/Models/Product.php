<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ProductType;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
        'digital_file',
        'bundle_physical_id',
        'rating_avg',
        'rating_count',
        'discount_percent',
        'sold_count',
    ];

    protected function casts(): array
    {
        return [
            'type' => ProductType::class,
            'price' => 'integer',
            'weight_gram' => 'integer',
            'stock' => 'integer',
            'images' => 'array',
            'rating_avg' => 'float',
            'rating_count' => 'integer',
            'discount_percent' => 'integer',
            'sold_count' => 'integer',
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

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function bundlePhysical(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'bundle_physical_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function getSalePriceAttribute(): int
    {
        if (($this->discount_percent ?? 0) > 0) {
            return (int) round($this->price * (100 - $this->discount_percent) / 100);
        }

        return $this->price;
    }

    public function isEbook(): bool
    {
        return $this->type === ProductType::Ebook;
    }

    public function isDigital(): bool
    {
        return in_array($this->type, [ProductType::Ebook, ProductType::Bundle], true);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
