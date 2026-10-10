<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\BookDetail;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductTest extends TestCase
{
    use RefreshDatabase;

    public function test_categories_list_returns_tree(): void
    {
        $parent = Category::create(['name' => 'Buku', 'slug' => 'buku']);
        Category::create(['name' => 'Novel', 'slug' => 'novel', 'parent_id' => $parent->id]);

        $this->getJson('/api/v1/categories')
            ->assertOk()
            ->assertJsonPath('data.0.slug', 'buku')
            ->assertJsonPath('data.0.children.0.slug', 'novel');
    }

    public function test_products_list_returns_active_products(): void
    {
        Product::factory()->count(3)->create();
        Product::factory()->inactive()->create();

        $this->getJson('/api/v1/products')
            ->assertOk()
            ->assertJsonPath('meta.total', 3);
    }

    public function test_products_can_be_filtered_by_category(): void
    {
        $category = Category::create(['name' => 'Buku', 'slug' => 'buku']);
        Product::factory()->count(2)->create(['category_id' => $category->id]);
        Product::factory()->create();

        $this->getJson('/api/v1/products?category=buku')
            ->assertOk()
            ->assertJsonPath('meta.total', 2);
    }

    public function test_products_can_be_searched_by_name(): void
    {
        Product::factory()->create(['name' => 'Laskar Pelangi']);
        Product::factory()->create(['name' => 'Matematika Diskrit']);

        $this->getJson('/api/v1/products?q=laskar')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.name', 'Laskar Pelangi');
    }

    public function test_product_detail_includes_book_details(): void
    {
        $product = Product::factory()->create();
        BookDetail::factory()->create([
            'product_id' => $product->id,
            'author' => 'Andrea Hirata',
        ]);

        $this->getJson("/api/v1/products/{$product->slug}")
            ->assertOk()
            ->assertJsonPath('data.book_detail.author', 'Andrea Hirata');
    }

    public function test_product_detail_returns_404_for_inactive_or_unknown(): void
    {
        $product = Product::factory()->inactive()->create();

        $this->getJson("/api/v1/products/{$product->slug}")->assertNotFound();
    }
}
