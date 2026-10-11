<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AddressTest extends TestCase
{
    use RefreshDatabase;

    private function addressPayload(): array
    {
        return [
            'recipient' => 'Budi',
            'phone' => '0812345678',
            'province' => 'Jawa Timur',
            'city' => 'Surabaya',
            'district' => 'Gubeng',
            'postal_code' => '60281',
            'detail' => 'Jl. Raya No. 1',
        ];
    }

    public function test_guest_cannot_access_addresses(): void
    {
        $this->getJson('/api/v1/addresses')->assertUnauthorized();
    }

    public function test_first_address_becomes_default(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/v1/addresses', $this->addressPayload())
            ->assertCreated()
            ->assertJsonPath('data.is_default', true);
    }

    public function test_second_address_does_not_override_default(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/v1/addresses', $this->addressPayload());
        $this->postJson('/api/v1/addresses', array_merge($this->addressPayload(), ['recipient' => 'Ani']))
            ->assertJsonPath('data.is_default', false);
    }

    public function test_user_can_update_and_delete_address(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $address = $user->addresses()->create($this->addressPayload() + ['is_default' => true]);

        $this->patchJson("/api/v1/addresses/{$address->id}", ['recipient' => 'Budi Updated'])
            ->assertOk()
            ->assertJsonPath('data.recipient', 'Budi Updated');

        $this->deleteJson("/api/v1/addresses/{$address->id}")->assertOk();
        $this->assertDatabaseMissing('addresses', ['id' => $address->id]);
    }
}
