# Deploy Edi's Journal Store — cPanel (Dewaweb)

Alur deploy **manual** untuk monorepo Laravel (API) + Vite SPA. Dua subdomain:

- **API**  : `https://api-store.edisjournal.my.id`  → Laravel (`backend/public`)
- **SPA**  : `https://store.edisjournal.my.id`      → build statis (`frontend/dist`)

---

## A. Build frontend (di laptop)

1. Buat file **`frontend/.env.production`** berisi:

   ```env
   VITE_API_BASE_URL=https://api-store.edisjournal.my.id
   ```

2. Build:

   ```bash
   cd frontend
   npm install
   npm run build
   ```

   Hasil: folder **`frontend/dist/`** (sudah termasuk `.htaccess` untuk SPA).

---

## B. Buat 2 subdomain di cPanel

3. **cPanel → Domains → Create A New Domain** (dua kali):
   - **Domain** = `edisjournal.my.id`, **Subdomain** = `api-store`
   - **Domain** = `edisjournal.my.id`, **Subdomain** = `store`

   > Kalau cPanel-mu pakai menu **Subdomains**, pilih domain induk `edisjournal.my.id`
   > lalu isi kolom Subdomain hanya `api-store` (tanpa titik) dan `store`.

---

## C. Upload backend (API)

4. **File Manager** → folder `home` → buat folder baru `api-store`.
5. Upload repo backend ke situ. Paling gampang:
   - ZIP folder `backend/` dari laptop → upload → **Extract**, sehingga isinya
     `~/api-store/app/`, `~/api-store/public/`, `~/api-store/routes/`, dst.
   - *atau* lewat **Terminal**: `git clone https://github.com/fikrudzulfahmi/ecomerce-edi.git`
     lalu pakai folder `ecomerce-edi/backend` sebagai root API.

6. **Set Document Root** subdomain `api-store`:
   - cPanel → **Domains → api-store.edisjournal.my.id → Manage → Document Root**
   - arahkan ke folder **`public`** di dalam backend, contoh: `/home/USER/api-store/public`
     (atau `/home/USER/ecomerce-edi/backend/public` kalau pakai git clone).

   > ⚠️ Ini langkah paling sering salah: docroot harus berakhiran **`/public`**.

7. **Buat `.env`** di folder backend (salin dari `.env.example`), lalu isi:
   - `APP_KEY=` → biarkan kosong dulu (di-generate nanti).
   - `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` → buat dulu di **cPanel → MySQL Databases** + tambahkan user.
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` → kredensial login adminmu.
   - `MENGANTAR_API_KEY`, `MENGANTAR_ORIGIN_ID`, dst → dari dashboard Mengantar.
   - `MAIL_*` → SMTP untuk email lupa password (isi belakangan boleh).

---

## D. Setup backend lewat Terminal (SSH cPanel)

8. **cPanel → Terminal** (atau SSH), lalu:

   ```bash
   cd ~/api-store
   composer install --no-dev --no-scripts
   php artisan package:discover
   php artisan key:generate
   php artisan migrate --force
   php artisan db:seed --class=ProductionSeeder
   php artisan config:clear && php artisan config:cache
   ```

   Catatan:
   - `--no-scripts` + `package:discover` manual dipakai karena hosting Dewaweb menonaktifkan
     beberapa fungsi (symlink/exec/escapeshellarg).
   - Seeder pakai **`ProductionSeeder`** → hanya membuat **akun admin**, tanpa data contoh.
   - Kalau `config:cache` sudah pernah jalan, jalankan `php artisan config:clear` **dulu**
     sebelum seeder agar `ADMIN_*` di `.env` terbaca.

9. **Cron** (agar pesanan tak terbayar otomatis kedaluwarsa tiap 5 menit):
   - **cPanel → Cron Jobs** → tambah (setiap menit):

     ```
     * * * * * /usr/local/bin/php /home/USER/api-store/artisan schedule:run >> /dev/null 2>&1
     ```

---

## E. Upload frontend (SPA)

10. **File Manager** → folder `home` → buat folder `store`.
11. Upload **seluruh isi `frontend/dist/`** (termasuk `.htaccess`) ke `~/store/`.

    > Jangan upload folder `dist`-nya, tapi **isinya** (ada `index.html` + `assets/` + `.htaccess`).

12. **Set Document Root** subdomain `store` → `/home/USER/store`.

---

## F. SSL

13. **cPanel → SSL/TLS Status → Run AutoSSL** untuk kedua subdomain.

---

## G. Verifikasi

14. Buka `https://store.edisjournal.my.id` → beranda tampil.
15. Cek API hidup: `https://api-store.edisjournal.my.id/` → JSON `{"app":"Edi's Journal Store","status":"ok",...}`.
16. Login admin di `https://store.edisjournal.my.id/login` → masuk, klik menu **Admin** → isi produk/kategori/voucher/banner.

---

## H. Google OAuth (SETELAH deploy)

17. Buat kredensial di **Google Cloud Console** (lihat `docs/GOOGLE-OAUTH.md` setelah siap), lalu isi di `.env`:

    ```
    GOOGLE_CLIENT_ID=...
    GOOGLE_CLIENT_SECRET=...
    GOOGLE_REDIRECT_URI=https://api-store.edisjournal.my.id/api/v1/auth/google/callback
    ```

18. `php artisan config:clear && php artisan config:cache`, lalu tes tombol "Lanjut dengan Google".

---

## Troubleshooting cepat

| Gejala | Kemungkinan | Cek |
|--------|-------------|-----|
| API 404 semua `/api/...` | docroot salah (bukan `.../public`) | Domains → Manage → Document Root |
| API 500 | `.env` DB salah / belum migrate | baca pesan error / `php artisan migrate:status` |
| SPA refresh `/produk/x` 404 | `.htaccess` tidak ter-upload | pastikan `dist/.htaccess` ada di server |
| Gambar/API beda host | `VITE_API_BASE_URL` salah saat build | rebuild frontend |
| Login admin gagal | `ADMIN_*` belum diisi saat seed | isi `.env` → `config:clear` → seed ulang |
| CORS error | `FRONTEND_URL` tidak cocok | set `FRONTEND_URL=https://store.edisjournal.my.id` |
