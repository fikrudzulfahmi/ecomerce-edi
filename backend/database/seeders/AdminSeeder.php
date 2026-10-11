<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => config('admin.email', 'admin@example.com')],
            [
                'name' => config('admin.name', 'Administrator'),
                'phone' => config('admin.phone'),
                'password' => Hash::make((string) config('admin.password', 'password')),
                'role' => Role::Admin,
                'email_verified_at' => now(),
            ],
        );
    }
}
