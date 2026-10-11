<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\BookDetail;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BookDetail>
 */
class BookDetailFactory extends Factory
{
    protected $model = BookDetail::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'isbn' => fake()->isbn13(),
            'author' => fake()->name(),
            'publisher' => fake()->company(),
            'year' => fake()->numberBetween(1990, 2025),
            'pages' => fake()->numberBetween(100, 900),
            'language' => 'Indonesia',
        ];
    }
}
