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
        $email = env('ADMIN_EMAIL', 'admin@example.com');

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => env('ADMIN_NAME', 'Administrator'),
                'phone' => env('ADMIN_PHONE'),
                'password' => Hash::make(env('ADMIN_PASSWORD', 'password')),
                'role' => Role::Admin,
                'email_verified_at' => now(),
            ],
        );
    }
}
