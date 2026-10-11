<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CartTest extends TestCase
{
    use RefreshDatabase;

    private function auth(?User $user = null): User
    {
        $user ??= User::factory()->create();
        Sanctum::actingAs($user);

        return $user;
    }

    public function test_guest_cannot_access_cart(): void
    {
        $this->getJson('/api/v1/cart')->assertUnauthorized();
    }

    public function test_user_can_add_item_to_cart(): void
    {
        $this->auth();
        $product = Product::factory()->create(['stock' => 10]);

        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'qty' => 2])
            ->assertCreated()
            ->assertJsonPath('data.total_items', 2)
            ->assertJsonPath('data.subtotal', $product->price * 2);
    }

    public function test_adding_same_product_increments_qty(): void
    {
        $this->auth();
        $product = Product::factory()->create(['stock' => 10]);

        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'qty' => 2]);
        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'qty' => 3])
            ->assertJsonPath('data.total_items', 5);
    }

    public function test_cannot_add_more_than_stock(): void
    {
        $this->auth();
        $product = Product::factory()->create(['stock' => 3]);

        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'qty' => 5])
            ->assertUnprocessable();
    }

    public function test_user_can_update_and_remove_item(): void
    {
        $this->auth();
        $product = Product::factory()->create(['stock' => 10]);

        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'qty' => 2]);
        $cart = $this->getJson('/api/v1/cart')->json('data');
        $itemId = $cart['items'][0]['id'];

        $this->patchJson("/api/v1/cart/items/{$itemId}", ['qty' => 4])
            ->assertJsonPath('data.total_items', 4);

        $this->deleteJson("/api/v1/cart/items/{$itemId}")
            ->assertJsonPath('data.total_items', 0);
    }
}
