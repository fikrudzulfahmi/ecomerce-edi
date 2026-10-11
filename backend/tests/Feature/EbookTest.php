<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\ProductType;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EbookTest extends TestCase
{
    use RefreshDatabase;

    private function ebook(): Product
    {
        return Product::factory()->create([
            'type' => ProductType::Ebook,
            'stock' => 0,
            'weight_gram' => 0,
            'digital_file' => 'ebooks/test.pdf',
        ]);
    }

    private function physical(): Product
    {
        return Product::factory()->create([
            'type' => ProductType::Book,
            'stock' => 10,
            'weight_gram' => 500,
        ]);
    }

    private function verifiedUser(): User
    {
        return User::factory()->create(['email_verified_at' => now()]);
    }

    public function test_digital_only_checkout_without_address_or_shipping(): void
    {
        $user = $this->verifiedUser();
        Sanctum::actingAs($user);
        $ebook = $this->ebook();

        $this->postJson('/api/v1/cart/items', ['product_id' => $ebook->id, 'qty' => 1]);

        $this->postJson('/api/v1/checkout', ['payment_method' => 'gdc'])
            ->assertCreated()
            ->assertJsonPath('data.status', 'PENDING_PAYMENT')
            ->assertJsonPath('data.shipping_cost', 0)
            ->assertJsonPath('data.address', null)
            ->assertJsonPath('data.shipment', null);

        // stok ebook tidak berkurang
        $this->assertDatabaseHas('products', ['id' => $ebook->id, 'stock' => 0]);
    }

    public function test_mixed_cart_ships_physical_and_skips_ebook_stock(): void
    {
        $user = $this->verifiedUser();
        Sanctum::actingAs($user);
        $ebook = $this->ebook();
        $book = $this->physical();

        $address = $user->addresses()->create([
            'recipient' => 'Budi',
            'phone' => '0812',
            'province' => 'Jawa Timur',
            'city' => 'Surabaya',
            'district' => 'Gubeng',
            'postal_code' => '60281',
            'detail' => 'Jl. Raya 1',
        ]);

        $this->postJson('/api/v1/cart/items', ['product_id' => $ebook->id, 'qty' => 1]);
        $this->postJson('/api/v1/cart/items', ['product_id' => $book->id, 'qty' => 1]);

        $this->postJson('/api/v1/checkout', [
            'address_id' => $address->id,
            'payment_method' => 'gdc',
            'courier' => 'JNE',
            'service' => 'REG',
        ])
            ->assertCreated()
            ->assertJsonPath('data.shipment.courier', 'JNE');

        $this->assertDatabaseHas('products', ['id' => $book->id, 'stock' => 9]);
        $this->assertDatabaseHas('products', ['id' => $ebook->id, 'stock' => 0]);
    }

    public function test_digital_order_marked_delivered_on_payment(): void
    {
        $user = $this->verifiedUser();
        Sanctum::actingAs($user);
        $ebook = $this->ebook();

        $this->postJson('/api/v1/cart/items', ['product_id' => $ebook->id, 'qty' => 1]);
        $order = $this->postJson('/api/v1/checkout', ['payment_method' => 'gdc'])->json('data');

        $this->postJson("/api/v1/orders/{$order['code']}/mock-pay")
            ->assertOk()
            ->assertJsonPath('data.status', 'DELIVERED');
    }

    public function test_library_lists_paid_ebooks_and_generates_download_url(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('ebooks/test.pdf', 'PDF');

        $user = $this->verifiedUser();
        Sanctum::actingAs($user);
        $ebook = $this->ebook();

        $this->postJson('/api/v1/cart/items', ['product_id' => $ebook->id, 'qty' => 1]);
        $this->postJson('/api/v1/checkout', ['payment_method' => 'gdc']);

        $order = Order::where('user_id', $user->id)->first();
        $this->postJson("/api/v1/orders/{$order->code}/mock-pay");

        $this->getJson('/api/v1/library')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'ebook');

        $itemId = OrderItem::where('order_id', $order->id)->first()->id;
        $this->getJson("/api/v1/library/items/{$itemId}/download-url")
            ->assertOk()
            ->assertJsonStructure(['url']);
    }

    public function test_unpaid_ebook_is_not_downloadable(): void
    {
        $user = $this->verifiedUser();
        Sanctum::actingAs($user);
        $ebook = $this->ebook();

        $this->postJson('/api/v1/cart/items', ['product_id' => $ebook->id, 'qty' => 1]);
        $this->postJson('/api/v1/checkout', ['payment_method' => 'gdc']);

        $order = Order::where('user_id', $user->id)->first();
        $itemId = OrderItem::where('order_id', $order->id)->first()->id;

        $this->getJson('/api/v1/library')->assertJsonCount(0, 'data');
        $this->getJson("/api/v1/library/items/{$itemId}/download-url")->assertForbidden();
    }
}
