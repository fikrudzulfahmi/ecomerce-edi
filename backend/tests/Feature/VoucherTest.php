<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VoucherTest extends TestCase
{
    use RefreshDatabase;

    private function placeOrder(User $user, string $voucherCode): TestResponse
    {
        $product = Product::factory()->create([
            'type' => 'book',
            'price' => 50000,
            'weight_gram' => 500,
            'stock' => 10,
        ]);

        $address = $user->addresses()->create([
            'recipient' => 'Budi',
            'phone' => '0812',
            'province' => 'Jawa Timur',
            'city' => 'Surabaya',
            'district' => 'Gubeng',
            'postal_code' => '60281',
            'detail' => 'Jl. Raya 1',
        ]);

        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'qty' => 1]);

        return $this->postJson('/api/v1/checkout', [
            'address_id' => $address->id,
            'payment_method' => 'gdc',
            'courier' => 'JNE',
            'service' => 'REG',
            'voucher_code' => $voucherCode,
        ]);
    }

    public function test_free_shipping_voucher_waives_shipping(): void
    {
        Setting::set('handling_fee', 1000);
        Voucher::create(['code' => 'GRATIS', 'name' => 'Gratis Ongkir', 'type' => 'free_shipping', 'value' => 0]);

        $user = User::factory()->create(['email_verified_at' => now()]);
        Sanctum::actingAs($user);

        $this->placeOrder($user, 'GRATIS')
            ->assertCreated()
            ->assertJsonPath('data.voucher_code', 'GRATIS')
            ->assertJsonPath('data.shipping_cost', 12000)
            ->assertJsonPath('data.handling_fee', 1000)
            ->assertJsonPath('data.discount_amount', 12000)
            ->assertJsonPath('data.total', 51000); // 50000 + 12000 + 1000 - 12000
    }

    public function test_discount_fixed_voucher(): void
    {
        Setting::set('handling_fee', 1000);
        Voucher::create(['code' => 'POTONG5', 'name' => 'Potongan 5rb', 'type' => 'discount_fixed', 'value' => 5000]);

        $user = User::factory()->create(['email_verified_at' => now()]);
        Sanctum::actingAs($user);

        $this->placeOrder($user, 'POTONG5')
            ->assertCreated()
            ->assertJsonPath('data.discount_amount', 5000)
            ->assertJsonPath('data.total', 58000); // 50000 + 12000 + 1000 - 5000
    }

    public function test_invalid_voucher_rejected(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        Sanctum::actingAs($user);

        $this->placeOrder($user, 'TIDAKADA')->assertStatus(422);
    }

    public function test_voucher_usage_limit_enforced(): void
    {
        Setting::set('handling_fee', 0);
        Voucher::create([
            'code' => 'SEKALI',
            'name' => 'Sekali Pakai',
            'type' => 'discount_fixed',
            'value' => 5000,
            'usage_limit' => 1,
        ]);

        $user = User::factory()->create(['email_verified_at' => now()]);
        Sanctum::actingAs($user);

        $this->placeOrder($user, 'SEKALI')->assertCreated();
        $this->assertDatabaseHas('vouchers', ['code' => 'SEKALI', 'used_count' => 1]);

        $product = Product::factory()->create([
            'type' => 'book',
            'price' => 30000,
            'weight_gram' => 500,
            'stock' => 10,
        ]);
        $address = $user->addresses()->first();
        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'qty' => 1]);
        $this->postJson('/api/v1/checkout', [
            'address_id' => $address->id,
            'payment_method' => 'gdc',
            'courier' => 'JNE',
            'service' => 'REG',
            'voucher_code' => 'SEKALI',
        ])->assertStatus(422);
    }
}
