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

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function bundlePhysical(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'bundle_physical_id');
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
