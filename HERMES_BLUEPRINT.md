# HERMES_BLUEPRINT.md: Edi's Journal Store

> File ini adalah SUMBER KEBENARAN utama untuk Hermes Agent.
> Letakkan di root repo (boleh juga disalin sebagai `AGENTS.md`).
> Baca bagian 0 dan 1 di setiap awal sesi. Bagian lain dibaca saat dibutuhkan saja.

---

## 0. PERAN & ATURAN HEMAT TOKEN (WAJIB)

### Pembagian model
| Peran | Model | Tugas |
|---|---|---|
| **Agent utama** | DeepSeek (berbayar) | Semua penulisan kode, logika bisnis, keputusan arsitektur, review, commit |
| **Sub agent** | Gemini (GRATIS, kuota terbatas) | HANYA pekerjaan baca/ringkas yang murah (lihat di bawah) |

### Gemini (sub agent) HANYA boleh untuk
1. Membaca file/folder besar lalu merangkum (maks 10 baris).
2. Mencari lokasi kode: "di file mana fungsi X dipakai?", "daftar route yang ada".
3. Membaca dan merangkum dokumentasi API eksternal (Mengantar.id, GDC Payment) menjadi poin-poin.
4. Membaca log error / output test panjang, lalu menyebut penyebab utamanya.
5. Merangkum `git diff` / `git log` sebelum direview.
6. Memeriksa konsistensi sederhana (nama kolom di migration vs model vs API doc).

### Gemini TIDAK boleh
- Menulis atau mengubah kode, migration, atau file apa pun (read-only).
- Memegang logika kritis: stok, order, pembayaran, webhook, auth.
- Menerima riwayat percakapan atau secret (`.env`, API key).

### Aturan hemat token untuk agent utama
1. Jangan membaca file besar utuh. Pakai grep/pencarian + baca rentang baris. Jika file > 300 baris atau hasil pencarian panjang, delegasikan baca ke Gemini.
2. Gunakan edit/patch untuk perubahan kecil. Jangan menulis ulang file utuh.
3. Jangan mengulang isi blueprint ini di jawaban atau di delegasi. Cukup rujuk nomor bagian.
4. Satu fase pada satu waktu. Berhenti dan minta konfirmasi di akhir tiap fase.
5. Verifikasi lewat test/lint/`git diff --stat`, bukan membaca ulang semua file.
6. Update `docs/PROGRESS.md` (centang + 1-2 baris catatan) setelah tiap tugas selesai.
7. Jawaban ke pengguna singkat: apa yang selesai, apa berikutnya, apa yang butuh keputusan.
8. **Fallback**: jika Gemini kena limit/error, JANGAN retry berulang. Kerjakan sendiri dengan cara paling hemat (grep + rentang baris).

### Template delegasi ke Gemini
```
TUGAS: <satu kalimat, hanya baca/ringkas>
BACA: <path file/folder spesifik>
CARI: <apa yang perlu ditemukan>
BALAS: maks 10 baris. Format: poin-poin, sertakan path:baris. Tanpa kode panjang.
LARANGAN: jangan ubah file apa pun.
```

---

## 1. RINGKASAN PROYEK

**Edi's Journal Store** adalah e-commerce toko buku. Buku adalah produk utama, tetapi katalog juga bisa berisi produk lain (alat tulis, merchandise, dll).

**Repo (monorepo, satu repo):** `https://github.com/fikrudzulfahmi/ecomerce-edi.git`

**Aturan bisnis inti**
- Tamu boleh melihat katalog dan detail produk tanpa login.
- **Tambah ke keranjang WAJIB login/daftar.** Tamu yang klik "Tambah ke Keranjang" diarahkan ke login/daftar, lalu kembali ke produk dan item otomatis ditambahkan.
- Pengiriman terintegrasi **Mengantar.id** (asumsi: yang dimaksud klien "antar id"; konfirmasi ke klien), mendukung **COD**.
- Pembayaran non-COD lewat **GDC Payment**. Statusnya **masih menunggu verifikasi**, jadi dikerjakan dengan interface + `MockPaymentProvider` dulu.
- **JANGAN mengarang endpoint, header, atau format signature GDC.** Beri tanda `// TODO(GDC)` dan tunggu dokumentasi resmi.

---

## 2. TECH STACK

| Lapisan | Pilihan |
|---|---|
| Backend | Laravel 12, PHP 8.3 (REST API, JSON only) |
| Auth | Laravel Sanctum (token untuk SPA), verifikasi email, reset password |
| Database | MySQL 8 (alternatif: PostgreSQL; putuskan di Fase 0, catat di DECISIONS.md) |
| Queue/Scheduler | Database queue + Laravel Scheduler (expiry order, polling resi) |
| Frontend | Vite + React + TypeScript |
| Routing/State | React Router, TanStack Query (data server), Zustand (auth/cart ringan) |
| UI | Tailwind CSS (token warna di bagian 3) |
| Validasi | FormRequest (BE), Zod + React Hook Form (FE) |
| Test | Pest/PHPUnit (BE), Vitest + Testing Library (FE) |
| Kualitas | Laravel Pint, PHPStan (larastan), ESLint, Prettier |

---

## 3. TEMA WARNA (Cozy & Trustworthy)

Rasio 60/30/10.

| Peran | Nama | HEX | Dipakai untuk |
|---|---|---|---|
| Utama 60% | Soft Cream | `#F8F6F2` | Latar website, kartu produk |
| Sekunder 30% | Deep Navy | `#1E3A8A` | Navbar, judul, teks utama, link |
| Aksen 10% | Warm Orange | `#F97316` | Tombol "Beli Sekarang" / "Tambah ke Keranjang", badge promo |

**Warna pendukung (turunan, boleh ditambah agent bila perlu)**
| Token | HEX | Fungsi |
|---|---|---|
| `navy-dark` | `#172554` | Hover navy, teks di atas tombol orange |
| `orange-dark` | `#EA580C` | Hover tombol orange |
| `cream-dark` | `#EFEBE3` | Border, divider, input background |
| `ink-muted` | `#475569` | Teks sekunder |
| `success` / `danger` | `#15803D` / `#B91C1C` | Status sukses / error |

**Tailwind (`frontend/tailwind.config.js`)**
```js
theme: {
  extend: {
    colors: {
      cream: { DEFAULT: '#F8F6F2', dark: '#EFEBE3' },
      navy: { DEFAULT: '#1E3A8A', dark: '#172554' },
      accent: { DEFAULT: '#F97316', dark: '#EA580C' },
      ink: { muted: '#475569' },
    },
    fontFamily: {
      heading: ['"Merriweather"', 'serif'],   // kesan buku/klasik
      sans: ['"Inter"', 'system-ui', 'sans-serif'],
    },
  },
}
```

**Aturan penggunaan**
- Body: `bg-cream text-navy`. Navbar: `bg-navy text-cream`.
- Tombol CTA: `bg-accent hover:bg-accent-dark text-navy-dark font-semibold`. Teks putih di atas `#F97316` kontrasnya kurang (sekitar 2.8:1), jadi pakai teks navy gelap.
- Orange HANYA untuk aksi utama dan highlight. Jangan dipakai sebagai warna teks paragraf.
- Fokus input/tombol harus terlihat jelas (`ring-2 ring-navy`).

---

## 4. STRUKTUR REPO

```
ecomerce-edi/
├─ HERMES_BLUEPRINT.md      # file ini
├─ docs/
│  ├─ PROGRESS.md           # checklist + catatan terakhir (dibaca tiap sesi)
│  ├─ DECISIONS.md          # keputusan teknis singkat
│  ├─ API.md                # kontrak endpoint
│  ├─ PAYMENT-GDC.md        # diisi setelah dokumentasi resmi diterima
│  └─ SHIPPING-MENGANTAR.md # ringkasan dokumentasi Mengantar.id
├─ backend/                 # Laravel 12
│  ├─ app/
│  │  ├─ Http/Controllers/Api/   # Auth, Product, Category, Cart, Checkout, Order, Address, Admin/*
│  │  ├─ Http/Requests/
│  │  ├─ Http/Resources/
│  │  ├─ Models/
│  │  ├─ Services/
│  │  │  ├─ Order/OrderService.php, StockService.php
│  │  │  ├─ Payment/PaymentProviderInterface.php, MockPaymentProvider.php,
│  │  │  │          GdcPaymentProvider.php, CodPaymentProvider.php
│  │  │  └─ Shipping/ShippingProviderInterface.php, MengantarProvider.php
│  │  ├─ Jobs/ (ExpireUnpaidOrders, SyncShipmentStatus)
│  │  └─ Enums/ (OrderStatus, PaymentMethod, ProductType, Role)
│  ├─ database/ (migrations, seeders, factories)
│  ├─ routes/api.php
│  └─ tests/
└─ frontend/                # Vite + React + TS
   └─ src/
      ├─ api/ (axios client, hooks TanStack Query)
      ├─ components/ (ui/, layout/, product/)
      ├─ pages/ (Home, ProductList, ProductDetail, Cart, Checkout, Orders,
      │          Login, Register, Verify, admin/*)
      ├─ routes/ (ProtectedRoute, AdminRoute)
      ├─ store/ (auth, cart)
      └─ lib/ (format rupiah, zod schemas)
```

---

## 5. BLUEPRINT DATABASE

| Tabel | Kolom penting |
|---|---|
| `users` | name, email, phone, password, role (customer/admin), email_verified_at |
| `addresses` | user_id, recipient, phone, province, city, district, postal_code, detail, is_default |
| `categories` | name, slug, parent_id |
| `products` | category_id, type (book/other), name, slug, description, price, weight_gram, stock, status, images (json) |
| `book_details` | product_id (1:1), isbn, author, publisher, year, pages, language |
| `carts` / `cart_items` | user_id; cart_id, product_id, qty |
| `orders` | code, user_id, status, subtotal, shipping_cost, total, payment_method (gdc/cod), address_snapshot (json), expires_at |
| `order_items` | order_id, product_id, name_snapshot, price_snapshot, qty |
| `payments` | order_id, provider, external_ref, status, raw_payload (json), paid_at |
| `shipments` | order_id, courier, service, awb, status, cod_amount, tracking (json) |
| `stock_movements` | product_id, delta, reason, ref_id |
| `webhook_logs` | provider, payload, signature_valid, processed_at (idempotensi) |

**Status order:** `PENDING_PAYMENT → PAID → PROCESSING → SHIPPED → DELIVERED`.
Cabang: `CANCELLED`, `EXPIRED`, `COD_PENDING → COD_COMPLETED / COD_RETURNED`.

Aturan data: harga dan alamat disimpan sebagai **snapshot** di order. Uang disimpan integer (rupiah, tanpa desimal). Stok diubah hanya lewat `StockService` (dengan transaksi DB dan row lock).

---

## 6. KONTRAK API (ringkas, detail di docs/API.md)

Prefix `/api/v1`. Response JSON via API Resource. Error format konsisten `{message, errors?}`.

| Area | Endpoint |
|---|---|
| Auth | `POST /register`, `/login`, `/logout`, `/email/verify/{id}/{hash}`, `/forgot-password`, `/reset-password`, `GET /me` |
| Katalog (publik) | `GET /categories`, `GET /products` (filter: q, category, type, price, sort, paginate), `GET /products/{slug}` |
| Keranjang (auth) | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/{id}`, `DELETE /cart/items/{id}` |
| Alamat (auth) | CRUD `/addresses` |
| Checkout (auth) | `POST /checkout/shipping-options`, `POST /checkout` |
| Pesanan (auth) | `GET /orders`, `GET /orders/{code}`, `POST /orders/{code}/cancel` |
| Webhook | `POST /webhooks/gdc`, `POST /webhooks/mengantar` (verifikasi signature, idempotent) |
| Admin | CRUD `/admin/products`, `/admin/categories`; `GET /admin/orders`, `POST /admin/orders/{code}/ship`, `PATCH /admin/orders/{code}/status`; `GET /admin/reports/summary` |

Middleware: `auth:sanctum`, `verified` (untuk checkout), `role:admin` (untuk admin), `throttle` (login, webhook).

---

## 7. ALUR KUNCI

1. **Guard keranjang (FE)**: tombol tambah keranjang untuk tamu menyimpan intent `{productId, qty, returnTo}` di sessionStorage, redirect ke `/login`. Setelah login sukses, panggil `POST /cart/items`, lalu kembali ke `returnTo`.
2. **Checkout**: validasi stok, hitung ongkir (ShippingProvider), buat Order dan kurangi/kunci stok dalam satu transaksi DB.
3. **Non-COD (GDC)**: `PaymentProvider::createTransaction()`, redirect ke halaman bayar, terima webhook, verifikasi signature, cek idempotensi lewat `webhook_logs`, ubah ke `PAID`. Selama belum terverifikasi memakai `MockPaymentProvider` (simulasi sukses/gagal/kedaluwarsa), dipilih lewat `PAYMENT_DRIVER=mock|gdc` di `.env`.
4. **COD**: Order langsung `COD_PENDING`, Shipment dibuat dengan `cod_amount = total`. Pelunasan dicatat saat status kurir `delivered`.
5. **Pengiriman**: admin klik "Buat resi", memanggil `ShippingProvider::createShipment()`, menyimpan AWB. Status diperbarui via webhook atau polling job.
6. **Expiry**: job terjadwal membatalkan order `PENDING_PAYMENT` yang lewat `expires_at` dan mengembalikan stok.

Seleksi driver lewat config (`config/payment.php`, `config/shipping.php`) dan service container binding. Kontroler tidak boleh memanggil provider konkret langsung.

---

## 8. TAHAPAN PENGERJAAN

Setiap fase diakhiri: jalankan test/lint, update `docs/PROGRESS.md`, commit, lalu **berhenti dan minta konfirmasi**.
Git: branch per fase (`phase-1-setup`, dst), commit kecil dan jelas, merge ke `main` setelah dikonfirmasi. Jangan commit `.env`, `vendor`, `node_modules`.

### Fase 0: Fondasi dokumen
- [ ] Clone repo, buat `docs/PROGRESS.md`, `DECISIONS.md`, `API.md` (dari bagian 5 dan 6)
- [ ] Putuskan DB (MySQL/PostgreSQL), catat di DECISIONS.md
- [ ] Gemini: ringkas dokumentasi Mengantar.id jika URL/PDF sudah ada, simpan ke `docs/SHIPPING-MENGANTAR.md`

### Fase 1: Setup proyek
- [ ] `backend/`: Laravel 12, `.env.example`, CORS untuk FE, Sanctum, Pint, larastan
- [ ] `frontend/`: Vite React TS, Tailwind dengan token warna bagian 3, ESLint/Prettier, axios client
- [ ] Layout dasar (navbar navy, footer, container cream), font heading/sans
- [ ] README: cara menjalankan lokal

### Fase 2: Database & seed
- [ ] Migration + model + factory + seeder (admin, kategori, ±30 produk campuran buku/non-buku)
- [ ] Enum status, relasi, indeks (slug, category_id, status)

### Fase 3: Auth
- [ ] Register, login, logout, verifikasi email, lupa/reset password, `GET /me`
- [ ] FE: halaman login/daftar/verifikasi, `ProtectedRoute`, store auth
- [ ] Guard keranjang + intent `returnTo` (alur 7.1)
- [ ] Test: auth dasar dan akses admin ditolak untuk customer

### Fase 4: Katalog
- [ ] API produk (filter, cari, sort, paginate), kategori, detail (+ `book_details`)
- [ ] FE: Beranda (banner, kategori, terbaru, terlaris), listing + filter, detail produk, kartu produk
- [ ] Skeleton loading, empty state, responsif mobile-first

### Fase 5: Keranjang & alamat
- [ ] API keranjang (cek stok, batas qty), CRUD alamat
- [ ] FE: halaman keranjang, ikon keranjang + badge di navbar, form alamat

### Fase 6: Checkout & pesanan (tanpa bayar asli)
- [ ] `OrderService` + `StockService` (transaksi, lock, snapshot)
- [ ] Interface `PaymentProviderInterface` dan `ShippingProviderInterface`, driver mock
- [ ] Checkout FE: alamat, kurir/ongkir, metode bayar (GDC/COD), ringkasan
- [ ] Riwayat dan detail pesanan, batalkan pesanan
- [ ] Job expiry order. Test logika stok dan order.

### Fase 7: Integrasi Mengantar.id
- [ ] Pastikan dulu ongkir, buat resi, tracking, dan COD tersedia via API atau hanya dashboard
- [ ] `MengantarProvider`: cek ongkir, buat shipment, tracking, webhook/polling
- [ ] COD: `cod_amount`, pencatatan pelunasan

### Fase 8: Pembayaran GDC (tunggu verifikasi)
- [ ] Webhook endpoint + verifikasi signature + idempotensi (pola sudah siap dengan mock)
- [ ] `GdcPaymentProvider` ditulis HANYA setelah dokumentasi resmi dan kredensial sandbox ada di `docs/PAYMENT-GDC.md`
- [ ] Uji sandbox end-to-end, lalu ganti `PAYMENT_DRIVER=gdc`

### Fase 9: Panel admin
- [ ] CRUD produk (upload gambar, atribut buku), kategori, stok
- [ ] Daftar pesanan, ubah status, tombol "Buat resi", cetak resi
- [ ] Laporan ringkas (penjualan harian/bulanan, produk terlaris)

### Fase 10: Hardening & rilis
- [ ] Test e2e alur inti, audit keamanan (rate limit, otorisasi per resource, validasi, CORS)
- [ ] Optimasi query (eager loading), cache katalog, kompres gambar
- [ ] Halaman kebijakan privasi, syarat, retur
- [ ] Deploy (VPS/hosting PHP 8.3), queue worker + cron scheduler, backup database

---

## 9. STANDAR KODE

- PHP: `declare(strict_types=1)`, PSR-12 via Pint, controller tipis, logika di Service.
- Setiap endpoint punya FormRequest dan API Resource. Otorisasi lewat Policy.
- Query: hindari N+1 (`with()`), index untuk kolom filter.
- React: komponen kecil, tipe TypeScript ketat, data server lewat TanStack Query, tidak ada `any`.
- Format rupiah lewat satu helper (`Intl.NumberFormat('id-ID')`). Teks UI berbahasa Indonesia.
- Keamanan: secret hanya `.env`; hash password bawaan Laravel; webhook wajib verifikasi signature; jangan log data sensitif.
- Setiap fitur logika kritis (stok, order, webhook) wajib punya test.

---

## 10. HAL YANG HARUS DIKONFIRMASI KE KLIEN

1. "antar id" = Mengantar.id? Minta akun, API key, dokumentasi API (ongkir, resi, COD, webhook).
2. GDC Payment: dokumentasi API, kredensial sandbox, format webhook/signature, metode bayar yang didukung.
3. Pilihan database dan hosting yang tersedia.
4. Alamat asal pengiriman (gudang), berat default produk, daftar kurir yang diaktifkan.
5. Konten legal: kebijakan privasi, syarat, retur.

---

## 11. PERINTAH MULAI

```
Baca HERMES_BLUEPRINT.md bagian 0 dan 1. Kerjakan Fase 0 saja.
Kerjakan semua penulisan sendiri (DeepSeek). Gunakan Gemini HANYA untuk membaca/merangkum
sesuai bagian 0. Setelah selesai, update docs/PROGRESS.md, laporkan singkat, lalu berhenti
dan minta konfirmasi sebelum Fase 1.
```
