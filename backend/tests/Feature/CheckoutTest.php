<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    private function verifiedUser(): User
    {
        return User::factory()->create(['email_verified_at' => now()]);
    }

    private function addressFor(User $user): Address
    {
        return $user->addresses()->create([
            'recipient' => 'Budi',
            'phone' => '0812',
            'province' => 'Jatim',
            'city' => 'Surabaya',
            'district' => 'Gubeng',
            'postal_code' => '60281',
            'detail' => 'Jl. Raya 1',
            'is_default' => true,
        ]);
    }

    public function test_checkout_requires_verified_email(): void
    {
        Sanctum::actingAs(User::factory()->create(['email_verified_at' => null]));

        $this->postJson('/api/v1/checkout', [])->assertForbidden();
    }

    public function test_shipping_options_returns_list(): void
    {
        $user = $this->verifiedUser();
        Sanctum::actingAs($user);
        Product::factory()->create(['weight_gram' => 500]);

        $this->postJson('/api/v1/cart/items', ['product_id' => 1, 'qty' => 1]);

        $this->postJson('/api/v1/checkout/shipping-options')
            ->assertOk()
            ->assertJsonStructure(['data' => [['courier', 'service', 'cost']]]);
    }

    public function test_checkout_with_online_payment_creates_pending_payment_session(): void
    {
        $user = $this->verifiedUser();
        Sanctum::actingAs($user);

        $product = Product::factory()->create(['stock' => 10, 'price' => 50_000, 'weight_gram' => 500]);
        $address = $this->addressFor($user);

        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'qty' => 2]);

        $this->postJson('/api/v1/checkout', [
            'address_id' => $address->id,
            'payment_method' => 'online',
            'courier' => 'JNE',
            'service' => 'REG',
        ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'PENDING_PAYMENT')
            ->assertJsonPath('data.payment_method', 'online')
            ->assertJsonPath('data.subtotal', 100_000)
            ->assertJsonPath('data.payment.status', 'pending')
            ->assertJsonStructure(['data' => ['payment' => ['redirect_url']]]);

        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 8]);
        $this->assertDatabaseHas('payments', ['provider' => 'mock', 'status' => 'pending']);
        $this->getJson('/api/v1/cart')->assertJsonPath('data.total_items', 0);
    }

    public function test_pending_order_can_request_payment_session_again(): void
    {
        $user = $this->verifiedUser();
        Sanctum::actingAs($user);

        $product = Product::factory()->create(['stock' => 5, 'price' => 20_000, 'weight_gram' => 500]);
        $address = $this->addressFor($user);
        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'qty' => 1]);

        $code = $this->postJson('/api/v1/checkout', [
            'address_id' => $address->id,
            'payment_method' => 'online',
            'courier' => 'JNE',
            'service' => 'REG',
        ])->json('data.code');

        $this->postJson("/api/v1/orders/{$code}/payment")
            ->assertOk()
            ->assertJsonPath('data.status', 'PENDING_PAYMENT')
            ->assertJsonStructure(['redirect_url']);

        // Sesi pending yang masih valid dipakai ulang, bukan duplikat.
        $this->assertSame(1, Payment::query()->where('order_id', $user->orders()->first()->id)->count());
    }

    public function test_checkout_with_cod_creates_shipment_with_cod_amount(): void
    {
        $user = $this->verifiedUser();
        Sanctum::actingAs($user);

        $product = Product::factory()->create(['stock' => 10, 'price' => 30_000, 'weight_gram' => 500]);
        $address = $this->addressFor($user);
        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'qty' => 1]);

        $response = $this->postJson('/api/v1/checkout', [
            'address_id' => $address->id,
            'payment_method' => 'cod',
            'courier' => 'JNE',
            'service' => 'REG',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'COD_PENDING')
            ->assertJsonPath('data.shipment.cod_amount', $response->json('data.total'));
    }

    public function test_checkout_fails_when_cart_empty(): void
    {
        $user = $this->verifiedUser();
        Sanctum::actingAs($user);
        $address = $this->addressFor($user);

        $this->postJson('/api/v1/checkout', [
            'address_id' => $address->id,
            'payment_method' => 'cod',
            'courier' => 'JNE',
            'service' => 'REG',
        ])->assertUnprocessable();
    }
}
