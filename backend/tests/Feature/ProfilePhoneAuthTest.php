<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfilePhoneAuthTest extends TestCase
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

    public function test_phone_otp_registers_and_logs_in(): void
    {
        $code = $this->postJson('/api/v1/auth/phone/request', ['phone' => '081234567890'])
            ->assertOk()
            ->json('otp');

        $this->assertNotNull($code);

        $this->postJson('/api/v1/auth/phone/verify', ['phone' => '081234567890', 'code' => $code])
            ->assertOk()
            ->assertJsonStructure(['data' => ['id'], 'token']);

        // nomor dinormalisasi ke format 62xx
        $this->assertDatabaseHas('users', ['phone' => '6281234567890']);

        // login kembali dengan nomor yang sama (tanpa membuat user baru)
        $this->postJson('/api/v1/auth/phone/request', ['phone' => '081234567890'])->assertOk();
        $code2 = $this->postJson('/api/v1/auth/phone/request', ['phone' => '081234567890'])->assertOk()->json('otp');
        $this->postJson('/api/v1/auth/phone/verify', ['phone' => '081234567890', 'code' => $code2])
            ->assertOk();

        $this->assertDatabaseCount('users', 1);
    }

    public function test_phone_otp_rejects_wrong_code(): void
    {
        $this->postJson('/api/v1/auth/phone/request', ['phone' => '081234567890'])->assertOk();

        $this->postJson('/api/v1/auth/phone/verify', ['phone' => '081234567890', 'code' => '000000'])
            ->assertStatus(422);
    }
}
