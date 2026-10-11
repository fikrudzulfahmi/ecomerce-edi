<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\ProductType;
use App\Enums\Role;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RatingChatTest extends TestCase
{
    use RefreshDatabase;

    private function deliveredOrder(User $user, Product $product): Order
    {
        $order = Order::create([
            'code' => 'EDI'.now()->format('ymd').Str::upper(Str::random(4)),
            'user_id' => $user->id,
            'status' => OrderStatus::Delivered,
            'subtotal' => $product->price,
            'shipping_cost' => 0,
            'total' => $product->price,
            'payment_method' => PaymentMethod::Gdc,
            'address_snapshot' => ['recipient' => 'Budi', 'phone' => '0812'],
        ]);

        $order->items()->create([
            'product_id' => $product->id,
            'name_snapshot' => $product->name,
            'price_snapshot' => $product->price,
            'qty' => 1,
        ]);

        return $order;
    }

    public function test_user_can_review_delivered_product(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $product = Product::factory()->create();
        $order = $this->deliveredOrder($user, $product);
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/reviews', [
            'order_id' => $order->id,
            'product_id' => $product->id,
            'rating' => 5,
            'comment' => 'Bagus!',
        ])->assertCreated();

        $this->assertDatabaseHas('reviews', ['product_id' => $product->id, 'rating' => 5]);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'rating_count' => 1]);

        // duplikat ditolak
        $this->postJson('/api/v1/reviews', [
            'order_id' => $order->id,
            'product_id' => $product->id,
            'rating' => 4,
        ])->assertStatus(422);
    }

    public function test_cannot_review_undelivered_order(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $product = Product::factory()->create();
        $order = $this->deliveredOrder($user, $product);
        $order->update(['status' => OrderStatus::Paid]);
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/reviews', [
            'order_id' => $order->id,
            'product_id' => $product->id,
            'rating' => 5,
        ])->assertStatus(422);
    }

    public function test_reviews_listing_is_public(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $product = Product::factory()->create();
        $order = $this->deliveredOrder($user, $product);
        Sanctum::actingAs($user);
        $this->postJson('/api/v1/reviews', [
            'order_id' => $order->id,
            'product_id' => $product->id,
            'rating' => 4,
            'comment' => 'ok',
        ]);

        $this->getJson("/api/v1/products/{$product->slug}/reviews")
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_chat_flow(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        Sanctum::actingAs($user);

        $conversation = $this->postJson('/api/v1/chat/conversations', ['content' => 'Halo, stok ada?'])
            ->assertCreated()
            ->json('data');

        $this->postJson("/api/v1/chat/conversations/{$conversation['id']}/messages", ['content' => 'Tanya ongkir'])
            ->assertCreated();

        $admin = User::factory()->create(['role' => Role::Admin, 'email_verified_at' => now()]);
        Sanctum::actingAs($admin);
        $this->getJson('/api/v1/admin/conversations')->assertOk()->assertJsonCount(1, 'data');
        $this->postJson("/api/v1/admin/conversations/{$conversation['id']}/messages", ['content' => 'Ada kak'])
            ->assertCreated();

        Sanctum::actingAs($user);
        $this->getJson("/api/v1/chat/conversations/{$conversation['id']}/messages")
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_checkout_uses_discounted_sale_price(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $ebook = Product::factory()->create([
            'type' => ProductType::Ebook,
            'price' => 100000,
            'discount_percent' => 20,
            'stock' => 0,
        ]);
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/cart/items', ['product_id' => $ebook->id, 'qty' => 2])->assertCreated();

        $this->postJson('/api/v1/checkout', ['payment_method' => 'gdc'])
            ->assertCreated()
            ->assertJsonPath('data.subtotal', 160000)
            ->assertJsonPath('data.total', 160000);
    }

    public function test_banner_crud_and_public_listing(): void
    {
        $admin = User::factory()->create(['role' => Role::Admin, 'email_verified_at' => now()]);
        Sanctum::actingAs($admin);

        $this->postJson('/api/v1/admin/banners', [
            'title' => 'Promo Spesial',
            'subtitle' => 'Diskon hingga 50%',
            'is_active' => true,
        ])->assertCreated();

        $this->getJson('/api/v1/banners')->assertOk()->assertJsonCount(1, 'data');
    }
}
