<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\BookDetailFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookDetail extends Model
{
    /** @use HasFactory<BookDetailFactory> */
    use HasFactory;

    protected $fillable = [
        'product_id',
        'isbn',
        'author',
        'publisher',
        'year',
        'pages',
        'language',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'pages' => 'integer',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
