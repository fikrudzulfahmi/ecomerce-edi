# PROGRESS — Edi's Journal Store

> Dibaca tiap awal sesi. Checklist fase + catatan terakhir.

## Status fase

- [x] **Fase 0** — Fondasi dokumen (PROGRESS, DECISIONS, API)
- [x] **Fase 1** — Setup proyek (backend Laravel 12 + frontend Vite React TS)
- [x] **Fase 2** — Database & seed
- [x] **Fase 3** — Auth
- [x] **Fase 4** — Katalog
- [x] **Fase 5** — Keranjang & alamat
- [x] **Fase 6** — Checkout & pesanan (mock payment)
- [x] **Fase 7** — Integrasi Mengantar.id
- [ ] **Fase 8** — Pembayaran GDC (tunggu verifikasi)
- [x] **Fase 9** — Panel admin
- [ ] **Fase 10** — Hardening & rilis

## Ringkasan per fase (sampai Fase 5)

- **Fase 2** — Schema lengkap (13 migration, 13 model, 4 enum), seeder 12 kategori + 34 produk (26 buku + 8 non-buku) + admin. DB MySQL `ecommerce_edi` (XAMPP, root tanpa password).
- **Fase 3** — Auth API (register/login/logout/me/verify/forgot/reset) + FE (login/daftar/verifikasi/reset), Zustand auth store, ProtectedRoute, guard keranjang (intent `returnTo`).
- **Fase 4** — Katalog API (filter q/kategori/tipe/harga, sort, paginate, detail+related) + FE (Beranda hero+kategori+grid, listing+filter, detail produk).
- **Fase 5** — Keranjang API (cek stok, batas qty 1–99) + CRUD alamat (default otomatis) + FE (halaman keranjang + alamat, badge navbar, intent auto-tambah setelah login).
- **Fase 6** — Checkout & pesanan: `OrderService` (transaksi + lock stok + snapshot), `StockService`, interface `PaymentProviderInterface`/`ShippingProviderInterface` (driver mock), checkout FE (alamat/kurir/metode bayar), riwayat + detail pesanan, batalkan, job expiry, simulasi bayar GDC (mock-pay).
- **Fase 7** — Integrasi Mengantar.id: `MengantarClient` (HTTP) + `MengantarProvider` (ongkir asli via `/order/estimate`, buat resi, tracking), `MengantarWebhookService` (verifikasi HMAC-SHA256 + idempotensi + pemetaan status → COD pelunasan), `ShippingDestination` (ongkir per tujuan), rute webhook publik, config `mengantar.php`.
- **Fase 9** — Panel admin: `DashboardController` (statistik), `Admin\ProductController` (CRUD + toggle), `Admin\OrderController` (list/detail/konfirmasi pembayaran/buat resi via Mengantar/ubah status), rute `role:admin`, FE admin (guard + sidebar layout + halaman dashboard/produk/pesanan/detail).
- **Fitur E-Book** — jenis produk `ebook` & `bundle`; checkout digital (tanpa alamat/ongkir, wajib GDC, `PAID → DELIVERED` instan); stok ebook dilewati (CartController + OrderService); download tertanda tangan (24 jam) via halaman **Pustaka** + detail pesanan; upload file PDF/EPUB + pilih buku fisik (bundle) di admin.
- **Voucher & biaya penanganan** — `vouchers` (free_shipping / discount_fixed / discount_percent, validasi + kuota + masa berlaku), `settings` (`handling_fee`), `VoucherService`; rumus total `subtotal + ongkir + handling − diskon`; endpoint `GET /checkout/meta` + `POST /checkout/voucher` (preview); admin kelola voucher + biaya penanganan. Refresh desain soft/glassy (shadow tokens, navbar glassy, kartu rounded-2xl).
- **Slideshow hero, rating/ulasan, & chat toko** — `banners` (slideshow hero, admin kelola promo/pengumuman), `reviews` (rating 1–5 + komentar setelah pesanan diterima, agregat `rating_avg`/`rating_count` di produk, sort `rating`), `conversations`+`messages` (chat buyer↔admin, polling); FE hero carousel + bintang rating + seksi "Rating Tertinggi" + form ulasan + widget chat + admin banner/pesan. Rombak tampilan gaya Tokopedia (navy).

## Catatan penting

- **DB dev** = MySQL via XAMPP (127.0.0.1, root, DB `ecommerce_edi`). Test pakai SQLite `:memory:`.
- **Auth** = Sanctum Bearer token (bukan cookie). Token disimpan di `localStorage` (key `edi.token`).
- **Verifikasi email & reset password** pakai mail driver `log` (dev) — link muncul di `storage/logs/laravel.log`.
- **Gambar produk** masih placeholder `picsum.photos` — ganti dengan gambar asli sebelum rilis.
- **"Terlaris"** belum diimplementasi (butuh data penjualan dari Fase 6). Home menampilkan "Produk Terbaru" + "Buku Pilihan".
- **Checkout** tombolnya di-disable — Fase 6.
- **Validasi server** berbahasa Indonesia (`APP_LOCALE=id`, `lang/id/`).

## Status git

Branch per fase (belum di-merge ke `main`):
- `phase-2-database` (8fc99f2)
- `phase-3-auth` (2787645, 01adf50)
- `phase-4-katalog` (4a35f44)
- `phase-5-cart-address` (e6e66b9)

## Berikutnya

Fase 8 — Pembayaran GDC asli (tunggu dokumentasi resmi + kredensial sandbox GDC; ganti `MockPaymentProvider` → `GdcPaymentProvider`, webhook pembayaran). Setelah itu Fase 10 — hardening & rilis (gambar produk asli, konten legal, uji beban, deploy).