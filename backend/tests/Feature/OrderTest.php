<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Jobs\ExpireUnpaidOrders;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\Order\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    private function makeOrder(User $user, OrderStatus $status, ?Product $product = null, int $qty = 2): Order
    {
        $product ??= Product::factory()->create(['stock' => 20, 'price' => 50_000]);

        $order = $user->orders()->create([
            'code' => 'EDI-'.Str::upper(Str::random(6)),
            'status' => $status,
            'subtotal' => 50_000 * $qty,
            'shipping_cost' => 12_000,
            'total' => 50_000 * $qty + 12_000,
            'payment_method' => 'gdc',
            'address_snapshot' => ['recipient' => 'Budi'],
        ]);

        $order->items()->create([
            'product_id' => $product->id,
            'name_snapshot' => $product->name,
            'price_snapshot' => 50_000,
            'qty' => $qty,
        ]);

        return $order;
    }

    public function test_user_can_list_own_orders(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $this->makeOrder($user, OrderStatus::Paid);

        $this->getJson('/api/v1/orders')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_cancel_pending_order_restores_stock(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $product = Product::factory()->create(['stock' => 20]);
        $order = $this->makeOrder($user, OrderStatus::PendingPayment, $product, 2);

        $this->postJson("/api/v1/orders/{$order->code}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', 'CANCELLED');

        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 22]);
    }

    public function test_cannot_cancel_paid_order(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $order = $this->makeOrder($user, OrderStatus::Paid);

        $this->postJson("/api/v1/orders/{$order->code}/cancel")->assertUnprocessable();
    }

    public function test_mock_pay_marks_order_paid(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $order = $this->makeOrder($user, OrderStatus::PendingPayment);
        $order->payment()->create(['provider' => 'gdc', 'status' => 'pending']);

        $this->postJson("/api/v1/orders/{$order->code}/mock-pay")
            ->assertOk()
            ->assertJsonPath('data.status', 'PAID');
    }

    public function test_expire_job_cancels_expired_orders_and_restores_stock(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['stock' => 20]);
        $order = $this->makeOrder($user, OrderStatus::PendingPayment, $product, 2);
        $order->update(['expires_at' => now()->subMinute()]);

        (new ExpireUnpaidOrders())->handle(app(OrderService::class));

        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'EXPIRED']);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 22]);
    }
}
