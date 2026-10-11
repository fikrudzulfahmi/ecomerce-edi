<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminCategoryTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => Role::Admin, 'email_verified_at' => now()]);
    }

    public function test_admin_can_manage_categories(): void
    {
        Sanctum::actingAs($this->admin());

        // buat induk
        $this->postJson('/api/v1/admin/categories', ['name' => 'Buku Novel'])
            ->assertStatus(201)
            ->assertJsonPath('data.name', 'Buku Novel')
            ->assertJsonPath('data.slug', 'buku-novel');

        // buat subkategori
        $this->postJson('/api/v1/admin/categories', ['name' => 'Fantasi', 'parent_id' => 1])
            ->assertStatus(201)
            ->assertJsonPath('data.parent_id', 1);

        // list: induk dengan children
        $this->getJson('/api/v1/admin/categories')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonCount(1, 'data.0.children');

        // update nama (slug ikut berubah)
        $this->putJson('/api/v1/admin/categories/1', ['name' => 'Novel'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Novel')
            ->assertJsonPath('data.slug', 'novel');

        // hapus subkategori
        $this->deleteJson('/api/v1/admin/categories/2')->assertOk();

        $this->getJson('/api/v1/admin/categories')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_non_admin_cannot_manage_categories(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => Role::Customer]));

        $this->postJson('/api/v1/admin/categories', ['name' => 'X'])->assertForbidden();
        $this->getJson('/api/v1/admin/categories')->assertForbidden();
    }
}
