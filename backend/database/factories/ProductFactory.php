<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ProductType;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(4, true);

        return [
            'category_id' => Category::factory(),
            'type' => ProductType::Book,
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => fake()->paragraphs(3, true),
            'price' => fake()->numberBetween(25_000, 300_000),
            'weight_gram' => fake()->numberBetween(100, 1_200),
            'stock' => fake()->numberBetween(5, 120),
            'status' => 'active',
            'images' => [],
        ];
    }

    public function book(): static
    {
        return $this->state(fn (array $attributes) => ['type' => ProductType::Book]);
    }

    public function other(): static
    {
        return $this->state(fn (array $attributes) => ['type' => ProductType::Other]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'inactive']);
    }
}
