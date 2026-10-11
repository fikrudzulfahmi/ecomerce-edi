<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_update(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        Sanctum::actingAs($user);

        $this->putJson('/api/v1/profile', [
            'name' => 'Nama Baru',
            'phone' => '081234567890',
        ])->assertOk()->assertJsonPath('data.name', 'Nama Baru');

        $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'Nama Baru', 'phone' => '081234567890']);
    }

    public function test_change_password_requires_current_password(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/profile/password', [
            'current_password' => 'password',
            'new_password' => 'passwordbaru',
            'new_password_confirmation' => 'passwordbaru',
        ])->assertOk();

        $this->postJson('/api/v1/profile/password', [
            'current_password' => 'salah',
            'new_password' => 'passwordbaru2',
            'new_password_confirmation' => 'passwordbaru2',
        ])->assertStatus(422);
    }
}
