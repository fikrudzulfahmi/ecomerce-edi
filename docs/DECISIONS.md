# DECISIONS — Edi's Journal Store

Keputusan teknis singkat. Tambahkan entri baru saat ada keputusan.

## Fase 0

- **Database: MySQL 8.** PostgreSQL tidak dipakai (alasan: konsisten dengan proyek lain & hosting yang tersedia).
- **Struktur monorepo**: `backend/` (Laravel 12 API) + `frontend/` (Vite React TS) dalam satu repo.
- **Uang disimpan integer rupiah** (tanpa desimal).
- **Snapshot** harga & alamat di order — tidak referensi data live (agar histori order tidak berubah).
- **Driver payment/shipping** lewat interface + binding service container; dipilih via `PAYMENT_DRIVER` / `SHIPPING_DRIVER` di `.env`. Kontroler tidak memanggil provider konkret langsung.

## Menunggu keputusan / info klien

- Konfirmasi "antar id" = Mengantar.id (akun, API key, dokumentasi API).
- GDC Payment (dokumentasi API, kredensial sandbox, format webhook/signature).
- Alamat asal pengiriman (gudang), berat default produk, daftar kurir aktif.
- Konten legal (kebijakan privasi, syarat, retur).
