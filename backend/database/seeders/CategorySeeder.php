<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $tree = [
            'Buku' => [
                'Novel & Sastra',
                'Agama & Spiritual',
                'Pendidikan & Referensi',
                'Anak & Remaja',
                'Bisnis & Pengembangan Diri',
            ],
            'Alat Tulis' => [
                'Pulpen & Pensil',
                'Buku Tulis & Kertas',
            ],
            'Aksesoris & Merchandise' => [
                'Tas & Dompet',
                'Gadget & Elektronik',
            ],
        ];

        foreach ($tree as $parent => $children) {
            $parentCategory = Category::create([
                'name' => $parent,
                'slug' => Str::slug($parent),
            ]);

            foreach ($children as $child) {
                Category::create([
                    'name' => $child,
                    'slug' => Str::slug($child),
                    'parent_id' => $parentCategory->id,
                ]);
            }
        }
    }
}
