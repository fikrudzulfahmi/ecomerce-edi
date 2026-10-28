# PAYMENT-IPAYMU — Edi's Journal Store

Integrasi payment gateway **iPayMu** (Redirect Payment) menggantikan rencana GDC.
Mode saat ini: **sandbox** — `https://sandbox.ipaymu.com/api/v2`.

## Alur

1. Pembeli checkout dengan `payment_method = online`.
2. `CheckoutController` membuat order (`status = PENDING_PAYMENT`) lalu memanggil `OrderService::startPayment()`, yang meneruskan ke `PaymentProviderInterface` (driver `ipaymu`).
3. `IpaymuClient::createPayment()` memanggil `POST /api/v2/payment` dan menyimpan `SessionID` + `Url` ke `payments.raw_payload`, `external_ref = SessionID`.
4. Response checkout menyertakan `data.payment.redirect_url`; frontend langsung redirect ke halaman iPayMu (`window.location.assign`). Jika gagal, pembeli diarahkan ke `/payment/{code}` yang akan membuat ulang sesi.
5. Pembeli membayar di halaman iPayMu → iPayMu memanggil **notify URL** `POST /api/v1/webhooks/ipaymu` dengan header `X-Signature`.
6. `IpaymuWebhookService` memverifikasi signature, mencocokkan `reference_id` dengan `orders.code`, membandingkan nominal (`paid_off`) dengan `orders.total`, lalu `OrderService::markPaid()` (idempotent) mengubah order → `PAID` dan payment → `paid`.
7. Admin membuat resi lewat `POST /api/v1/admin/orders/{code}/create-shipment` (Mengantar) seperti biasa — alur pengiriman tidak berubah.
8. Cadangan bila callback tidak masuk: `POST /api/v1/orders/{code}/payment/sync` mengecek transaksi ke iPayMu (`/api/v2/transaction`, fallback `/api/v2/history`) agar status tetap sinkron. Frontend memanggil ini dari halaman pembayaran dan polling order tiap 10 detik selama `PENDING_PAYMENT`.

## Endpoint baru

| Method | Path | Keterangan |
| --- | --- | --- |
| POST | `/api/v1/webhooks/ipaymu` | Callback iPayMu (header `X-Signature`) |
| POST | `/api/v1/orders/{code}/payment` | Buat / pakai ulang sesi pembayaran → `{ data, redirect_url }` |
| POST | `/api/v1/orders/{code}/payment/sync` | Sinkronkan status dari iPayMu |

Route lama `/mock-pay` & `/mock-fail` hanya aktif bila `PAYMENT_DRIVER=mock`.

## Konfigurasi (.env)

```
PAYMENT_DRIVER=ipaymu
IPAYMU_BASE_URL=https://sandbox.ipaymu.com/api/v2
IPAYMU_VA=000000xxxxxxxxxxxx
IPAYMU_API_KEY=xxxxxxxx
IPAYMU_NOTIFY_URL=https://api-store.edisjournal.my.id/api/v1/webhooks/ipaymu
IPAYMU_EXPIRED_HOURS=2
```

- `IPAYMU_NOTIFY_URL` kosong → fallback `APP_URL/api/v1/webhooks/ipaymu`. **Isi eksplisit** karena `APP_URL` API berbeda dari domain store.
- `FRONTEND_URL` dipakai untuk `returnUrl`/`cancelUrl`, jadi harus `https://store.edisjournal.my.id`.
- Produksi: ganti `IPAYMU_BASE_URL` ke `https://my.ipaymu.com/api/v2` dan pakai VA/API key produksi.

## Signature (penting)

Request:

```
stringToSign = "POST:" + VA + ":" + sha256(jsonBody) + ":" + API_KEY
signature    = HMAC-SHA256(stringToSign, API_KEY)
```

`jsonBody` **wajib** `json_encode($payload, JSON_UNESCAPED_SLASHES)`.
Dengan escaping default (`\/`), iPaymu menolak dengan `401 unauthorized signature` — sudah diuji ke sandbox.

Callback: ambil seluruh payload, buang key `signature`, `ksort`, `json_encode`, lalu HMAC-SHA256 dengan **VA** sebagai key.

## Status & pemetaan

| Callback iPayMu | Aksi |
| --- | --- |
| `status_code = 1` + nominal cocok + order `PENDING_PAYMENT` | payment `paid`, order `PAID` (order digital-only langsung `DELIVERED`) |
| `status_code = 1` nominal beda | diabaikan (order tetap pending), dicatat di `webhook_logs` |
| `status_code = 0` (pending) | order tetap `PENDING_PAYMENT` |
| `status_code = -2` (expired) / `-1` (failed) | payment `expired`/`failed`, order tetap `PENDING_PAYMENT` agar pembeli bisa membuat sesi baru |
| Signature tidak valid | HTTP 401, tidak diproses |

## Uji

```bash
cd backend
php artisan test --filter=IpaymuPaymentTest   # 7 test: sesi, callback valid/invalid, idempotensi, nominal, expired
php artisan test                              # 77 test total
```

Uji manual ke sandbox (tanpa kredensial di source):

```bash
php artisan tinker
>>> app(App\Services\Payment\IpaymuClient::class)->createPayment([
... 'product' => ['Uji'], 'qty' => ['1'], 'price' => [10000],
... 'returnUrl' => 'https://store.edisjournal.my.id', 'notifyUrl' => config('ipaymu.notify_url'),
... 'referenceId' => 'PROBE-'.now()->format('YmdHis'),
... ]);
```

Hasil nyata: `SessionID` + `Url` `https://sandbox-payment.ipaymu.com/#/...` (HTTP 200).

## Checklist deploy

1. Set env iPayMu di server (lihat di atas) — tanpa ini checkout online gagal membuat sesi.
2. `php artisan config:clear && php artisan optimize` di server API.
3. Tidak ada migrasi baru; tabel `payments`/`webhook_logs` sudah ada.
4. Pastikan domain API bisa diakses publik (callback iPayMu) dan HTTPS.
5. Uji: checkout online → halaman iPayMu → bayar (sandbox) → order jadi `PAID` → admin buat resi Mengantar.
