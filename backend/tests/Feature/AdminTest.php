<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => Role::Admin, 'email_verified_at' => now()]);
    }

    private function customer(): User
    {
        return User::factory()->create(['role' => Role::Customer]);
    }

    public function test_non_admin_cannot_access_admin_routes(): void
    {
        Sanctum::actingAs($this->customer());

        $this->getJson('/api/v1/admin/dashboard')->assertForbidden();
        $this->getJson('/api/v1/admin/products')->assertForbidden();
    }

    public function test_admin_can_view_dashboard(): void
    {
        Sanctum::actingAs($this->admin());
        Product::factory()->count(3)->create();

        $this->getJson('/api/v1/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.total_products', 3);
    }

    public function test_admin_can_create_product_with_book_detail(): void
    {
        Sanctum::actingAs($this->admin());
        $category = Category::factory()->create();

        $this->postJson('/api/v1/admin/products', [
            'name' => 'Buku Baru',
            'category_id' => $category->id,
            'type' => 'book',
            'price' => 50000,
            'stock' => 10,
            'weight_gram' => 500,
            'book_detail' => ['author' => 'Penulis', 'isbn' => '1234567890'],
        ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Buku Baru')
            ->assertJsonPath('data.book_detail.author', 'Penulis');

        $this->assertDatabaseHas('products', ['name' => 'Buku Baru', 'slug' => 'buku-baru']);
    }

    public function test_admin_can_toggle_product_status(): void
    {
        Sanctum::actingAs($this->admin());
        $product = Product::factory()->create(['status' => 'active']);

        $this->postJson("/api/v1/admin/products/{$product->id}/toggle")
            ->assertOk()
            ->assertJsonPath('data.status', 'inactive');
    }

    public function test_admin_can_confirm_payment(): void
    {
        Sanctum::actingAs($this->admin());
        $order = Order::factory()->create(['status' => OrderStatus::PendingPayment]);
        $order->payment()->create(['provider' => 'gdc', 'status' => 'pending']);

        $this->postJson("/api/v1/admin/orders/{$order->code}/confirm-payment")
            ->assertOk()
            ->assertJsonPath('data.status', 'PAID');

        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'PAID']);
    }

    public function test_admin_can_change_order_status(): void
    {
        Sanctum::actingAs($this->admin());
        $order = Order::factory()->create(['status' => OrderStatus::Paid]);

        $this->postJson("/api/v1/admin/orders/{$order->code}/status", ['status' => 'SHIPPED'])
            ->assertOk()
            ->assertJsonPath('data.status', 'SHIPPED');
    }

    public function test_admin_can_create_shipment(): void
    {
        Sanctum::actingAs($this->admin());

        Http::preventStrayRequests();
        Http::fake(function ($request) {
            $url = $request->url();

            if (str_contains($url, '/address/search')) {
                return Http::response(['success' => true, 'data' => [['_id' => 'dest-1']]]);
            }
            if (str_ends_with($url, '/address')) {
                return Http::response(['success' => true, 'data' => [['_id' => 'addr-1', 'PICKUP_AUTOFILL' => 'origin-1']]]);
            }
            if (str_contains($url, '/time')) {
                return Http::response(['success' => true, 'data' => [['_id' => 'time-1']]]);
            }
            if (str_contains($url, '/order') && $request->method() === 'POST') {
                return Http::response(['success' => true, 'data' => [['cnote_no' => 'JNE123456', 'ORDER_ID' => 'ORD-1', 'batch' => 'B-1']]]);
            }

            return Http::response(['success' => false, 'message' => 'unexpected'], 500);
        });

        $order = Order::factory()->create(['status' => OrderStatus::Paid]);
        $order->shipment()->create(['courier' => 'JNE', 'service' => 'REG', 'status' => 'pending']);

        $this->postJson("/api/v1/admin/orders/{$order->code}/create-shipment")
            ->assertOk()
            ->assertJsonPath('data.shipment.awb', 'JNE123456');

        $this->assertDatabaseHas('shipments', ['order_id' => $order->id, 'awb' => 'JNE123456']);
    }
}
