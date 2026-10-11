<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\OrderStatus;
use App\Enums\ProductType;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;

class ReviewSeeder extends Seeder
{
    public function run(): void
    {
        $products = Product::where('type', ProductType::Book)->take(8)->get();

        if ($products->isEmpty()) {
            return;
        }

        $names = [
            'Budi Santoso', 'Siti Aminah', 'Rina Wati', 'Andi Pratama', 'Dewi Lestari',
            'Rizky Hidayat', 'Maya Putri', 'Agus Salim', 'Nina Rahma', 'Fajar Nugroho',
        ];
        $comments = [
            'Bukunya bagus, packing rapi dan cepat sampai!',
            'Sesuai deskripsi, kualitas cetakan bagus.',
            'Anak saya suka banget, pengiriman cepat.',
            'Rekomendasi buat yang suka genre ini.',
            'Harganya worth it, isinya menarik.',
            'Kertasnya tebal, nyaman dibaca.',
            'Pelayanan ramah, pengiriman aman.',
            'Udah langganan di sini, selalu puas.',
            'Cetakannya jelas, tidak ada halaman rusak.',
            'Pas banget buat hadiah, dikirim rapi.',
        ];

        for ($i = 0; $i < 10; $i++) {
            $product = $products[$i % $products->count()];
            $user = User::factory()->create([
                'name' => $names[$i % count($names)],
                'email' => "pembeli{$i}@contoh.com",
                'email_verified_at' => now(),
            ]);

            $order = Order::factory()->create([
                'user_id' => $user->id,
                'status' => OrderStatus::Delivered,
                'subtotal' => $product->sale_price,
                'total' => $product->sale_price + 10_000,
            ]);
            $order->items()->create([
                'product_id' => $product->id,
                'name_snapshot' => $product->name,
                'price_snapshot' => $product->sale_price,
                'qty' => 1,
            ]);

            Review::create([
                'user_id' => $user->id,
                'product_id' => $product->id,
                'order_id' => $order->id,
                'rating' => $i % 3 === 0 ? 4 : 5,
                'comment' => $comments[$i % count($comments)],
            ]);

            $product->increment('sold_count');
        }

        foreach (Product::has('reviews')->get() as $product) {
            $product->update([
                'rating_avg' => $product->reviews()->avg('rating') ?? 0,
                'rating_count' => $product->reviews()->count(),
            ]);
        }
    }
}
