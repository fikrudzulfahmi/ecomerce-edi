# PRODUCTION SETUP — Edi's Journal Store

Checklist sebelum/ketika go-live. Kerjakan berurutan saat sudah siap produksi.

## 1. Mengaktifkan Webhook Mengantar (update status otomatis)

Tanpa ini ongkir tetap jalan, tapi status pengiriman tidak ter-update otomatis (harus polling manual).

1. Login dashboard Mengantar → **Settings → Account → Integrasi Public API**.
2. Isi **Webhook URL**:
   ```
   https://domain-kamu.com/api/v1/webhooks/mengantar
   ```
   - Wajib `https`, bukan alamat internal/localhost.
3. Klik **Simpan** → Mengantar generate **Webhook Secret** (muncul sekali, salin).
4. Masukkan secret ke `.env` di server produksi:
   ```
   MENGANTAR_WEBHOOK_SECRET=<secret-dari-dashboard>
   ```
5. Restart worker/queue + verifikasi: buat 1 order → cek `webhook_logs` ada entri dengan `signature_valid=1`.

> Verifikasi signature: `HMAC-SHA256(secret, "{x-timestamp}.{raw_body}")` — sudah diimplementasi di `MengantarWebhookService`. Uji vektor resmi lolos test.

## 2. Konfigurasi `.env` produksi

```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://domain-kamu.com
FRONTEND_URL=https://domain-kamu.com
SANCTUM_STATEFUL_DOMAINS=domain-kamu.com

DB_*                        # kredensial MySQL produksi
MAIL_*                      # SMTP asli (untuk verifikasi email & reset password)
QUEUE_CONNECTION=database   # + jalankan php artisan queue:work

SHIPPING_DRIVER=mengantar
MENGANTAR_API_KEY=<key-asli>
MENGANTAR_WEBHOOK_SECRET=<secret-dari-langkah-1>
# opsional (fallback otomatis dari GET /address & /time):
# MENGANTAR_ORIGIN_ID, MENGANTAR_PICKUP_ADDRESS_ID, MENGANTAR_PICKUP_TIME_ID

PAYMENT_DRIVER=mock         # ganti ke gdc setelah Fase 8 (dokumen GDC masuk)
```

## 3. Tugas berkala (scheduler)

Pastikan scheduler berjalan (cron setiap menit):
```
* * * * * cd /path/backend && php artisan schedule:run >> /dev/null 2>&1
```
→ menjalankan `ExpireUnpaidOrders` (batalkan order tak dibayar) tiap 5 menit.

## 4. Data awal produksi

- Admin: ubah `ADMIN_EMAIL`/`ADMIN_PASSWORD` di `.env` lalu `php artisan migrate --seed` (jangan pakai password default).
- Gambar produk: ganti placeholder `picsum.photos` dengan gambar asli (upload via panel admin / storage).
- Alamat gudang (origin) Mengantar sudah terdaftar ("Toko MPJ", Blitar) — diverifikasi otomatis via `GET /address`.
