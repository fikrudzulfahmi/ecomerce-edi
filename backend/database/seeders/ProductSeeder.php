<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\ProductType;
use App\Models\BookDetail;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $categories = Category::whereNotNull('parent_id')->get()->keyBy('slug');

        foreach ($this->books() as [$name, $catSlug, $price, $author, $publisher, $year, $pages]) {
            $product = Product::create([
                'category_id' => $categories[$catSlug]->id,
                'type' => ProductType::Book,
                'name' => $name,
                'slug' => Str::slug($name),
                'description' => sprintf(
                    '"%s" karya %s, diterbitkan oleh %s pada tahun %d.',
                    $name,
                    $author,
                    $publisher,
                    $year,
                ),
                'price' => $price,
                'weight_gram' => 400,
                'stock' => random_int(10, 80),
                'status' => 'active',
                'images' => [sprintf('https://picsum.photos/seed/%s/640/640', Str::slug($name))],
            ]);

            BookDetail::create([
                'product_id' => $product->id,
                'isbn' => fake()->isbn13(),
                'author' => $author,
                'publisher' => $publisher,
                'year' => $year,
                'pages' => $pages,
                'language' => 'Indonesia',
            ]);
        }

        foreach ($this->others() as [$name, $catSlug, $price]) {
            Product::create([
                'category_id' => $categories[$catSlug]->id,
                'type' => ProductType::Other,
                'name' => $name,
                'slug' => Str::slug($name),
                'description' => fake()->paragraph(),
                'price' => $price,
                'weight_gram' => 300,
                'stock' => random_int(15, 100),
                'status' => 'active',
                'images' => [sprintf('https://picsum.photos/seed/%s/640/640', Str::slug($name))],
            ]);
        }
    }

    /**
     * @return array<int, array{0:string,1:string,2:int,3:string,4:string,5:int,6:int}>
     */
    private function books(): array
    {
        return [
            ['Laskar Pelangi', 'novel-sastra', 85_000, 'Andrea Hirata', 'Bentang Pustaka', 2005, 534],
            ['Bumi Manusia', 'novel-sastra', 110_000, 'Pramoedya Ananta Toer', 'Lentera Dipantara', 1980, 535],
            ['Pulang', 'novel-sastra', 92_000, 'Tere Liye', 'Republika', 2015, 400],
            ['Hujan', 'novel-sastra', 85_000, 'Tere Liye', 'Gramedia Pustaka Utama', 2016, 320],
            ['Cantik Itu Luka', 'novel-sastra', 95_000, 'Eka Kurniawan', 'Gramedia Pustaka Utama', 2002, 537],
            ['Perahu Kertas', 'novel-sastra', 88_000, 'Dee Lestari', 'Bentang Pustaka', 2009, 444],
            ['Supernova: Ksatria, Puteri, dan Bintang Jatuh', 'novel-sastra', 90_000, 'Dee Lestari', 'Truedee Books', 2001, 348],
            ['Sang Pemimpi', 'novel-sastra', 75_000, 'Andrea Hirata', 'Bentang Pustaka', 2006, 292],
            ['Sirah Nabawiyah', 'agama-spiritual', 135_000, 'Syaikh Shafiyyurrahman Al-Mubarakfuri', 'Ummul Qura', 2012, 700],
            ['Riyadhus Shalihin', 'agama-spiritual', 150_000, 'Imam An-Nawawi', 'Akbar Media', 2010, 950],
            ['La Tahzan', 'agama-spiritual', 78_000, 'Aidh al-Qarni', 'Qisthi Press', 2004, 500],
            ['Mukhtashar Shahih Muslim', 'agama-spiritual', 120_000, 'Imam Al-Mundziri', 'Darul Haq', 2015, 600],
            ['Kamus Besar Bahasa Indonesia Edisi V', 'pendidikan-referensi', 320_000, 'Badan Pengembangan Bahasa', 'Balai Pustaka', 2016, 2_000],
            ['Metodologi Penelitian Kuantitatif & Kualitatif', 'pendidikan-referensi', 88_000, 'Sugiyono', 'Alfabeta', 2017, 464],
            ['Matematika Diskrit', 'pendidikan-referensi', 120_000, 'Rinaldi Munir', 'Informatika', 2010, 496],
            ['Kamus Inggris-Indonesia', 'pendidikan-referensi', 95_000, 'John M. Echols', 'Gramedia Pustaka Utama', 1990, 600],
            ['Negeri 5 Menara', 'anak-remaja', 75_000, 'Ahmad Fuadi', 'Gramedia Pustaka Utama', 2009, 423],
            ['Si Anak Spesial', 'anak-remaja', 82_000, 'Tere Liye', 'Republika', 2018, 360],
            ['Kisah-Kisah Teladan 25 Nabi', 'anak-remaja', 65_000, 'Tim Penerbit', 'Ziyad Books', 2019, 200],
            ['Cerita Rakyat Nusantara', 'anak-remaja', 58_000, 'Tim Penerbit', 'Bhuana Ilmu Populer', 2018, 180],
            ['Rich Dad Poor Dad', 'bisnis-pengembangan-diri', 90_000, 'Robert T. Kiyosaki', 'Gramedia Pustaka Utama', 1997, 336],
            ['Atomic Habits', 'bisnis-pengembangan-diri', 115_000, 'James Clear', 'Gramedia Pustaka Utama', 2018, 352],
            ['Berani Tidak Disukai', 'bisnis-pengembangan-diri', 85_000, 'Ichiro Kishimi & Fumitake Koga', 'Gramedia Pustaka Utama', 2013, 296],
            ['Filosofi Teras', 'bisnis-pengembangan-diri', 78_000, 'Henry Manampiring', 'Penerbit Buku Kompas', 2019, 320],
            ['Start with Why', 'bisnis-pengembangan-diri', 95_000, 'Simon Sinek', 'Gramedia Pustaka Utama', 2009, 256],
            ['Sapiens: Riwayat Singkat Umat Manusia', 'bisnis-pengembangan-diri', 135_000, 'Yuval Noah Harari', 'Kepustakaan Populer Gramedia', 2011, 512],
        ];
    }

    /**
     * @return array<int, array{0:string,1:string,2:int}>
     */
    private function others(): array
    {
        return [
            ['Pulpen Gel InkJoy 0.5 (isi 3)', 'pulpen-pensil', 25_000],
            ['Pensil 2B Faber-Castell (isi 12)', 'pulpen-pensil', 38_000],
            ['Spidol Snowman Whiteboard (isi 4)', 'pulpen-pensil', 30_000],
            ['Buku Tulis Sinar Dunia 38 Lembar (isi 10)', 'buku-tulis-kertas', 42_000],
            ['Tas Ransel Laptop 15.6 inch Anti Air', 'tas-dompet', 185_000],
            ['Dompet Kulit Pria Slim', 'tas-dompet', 120_000],
            ['Tumbler Stainless 750ml', 'gadget-elektronik', 65_000],
            ['Earphone Bluetooth TWS Pro', 'gadget-elektronik', 150_000],
        ];
    }
}
