<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Seeder produksi — HANYA akun admin.
 * Katalog, kategori, voucher, banner, ulasan, dll. dikelola lewat panel admin.
 */
class ProductionSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AdminSeeder::class,
        ]);
    }
}
