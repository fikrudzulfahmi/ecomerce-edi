# SHIPPING-MENGANTAR — Edi's Journal Store

## Status: TERINTEGRASI (Fase 7)

- **Base URL**: `https://app.mengantar.com` (dashboard: `app.mengantar.com`).
- **Auth**: API key ditaruh di **path URL** → `{BASE_URL}/api/public/{API_KEY}/...` (bukan header).
- **Gudang (origin)**: "Toko MPJ", Blitar — `PICKUP_AUTOFILL = 5fc6392ff8f44b34aa4c80f6`, `_id = 6726ea4f95e88d79aae8a92a` (dibaca otomatis dari `GET /address`).
- API key disimpan di `.env` (`MENGANTAR_API_KEY`), **tidak di-commit**.

## Konfigurasi (`.env`)

```
SHIPPING_DRIVER=mengantar
MENGANTAR_API_KEY=...
MENGANTAR_BASE_URL=https://app.mengantar.com
MENGANTAR_WEBHOOK_SECRET=...        # muncul setelah set Webhook URL di dashboard
MENGANTAR_ORIGIN_ID=                # opsional, fallback: GET /address[0].PICKUP_AUTOFILL
MENGANTAR_PICKUP_ADDRESS_ID=        # opsional, fallback: GET /address[0]._id
MENGANTAR_PICKUP_TIME_ID=           # opsional, fallback: GET /time[0]._id
MENGANTAR_COURIERS=JNE,SiCepat,SAP,JT,anteraja,lion,pos,spx,iDexpress
```

## Endpoint yang dipakai

| Fungsi | Endpoint |
|---|---|
| Cari kode alamat | `GET /api/public/{key}/address/search?keyword=...` |
| Cek ongkir | `GET /api/public/{key}/order/estimate?origin_id=&destination_id=&courier=all&weight=kg&COD_AMOUNT=` |
| Daftar alamat pickup (origin) | `GET /api/public/{key}/address` |
| Jadwal pickup | `GET /api/public/{key}/time` |
| Buat resi | `POST /api/public/{key}/order` |
| Lacak / get order | `GET /api/public/{key}/order?tracking_id=...` |

- `estimate` dengan `courier=all` → respons `data` adalah **map keyed courier** (termasuk varian `*Cargo` yang diskip). Setiap entri punya `price`, `estimatedPrice`, `estimatedSpecialPrice`, `unsupported`, `unsupported_cod`, `estimatedDate`.
- Kurir: `JNE`, `SiCepat`, `SAP`, `JT`, `lion`, `anteraja`, `pos`, `spx`, `iDexpress`. **Ninja discontinued per 1 Sep 2026.**

## Webhook (status order)

- Konfigurasi Webhook URL di dashboard → generate `Webhook Secret`.
- Mengantar `POST` JSON ke URL kita: `{ cnote_no, order_id, courier, status_category }`.
- Header: `x-timestamp` (ms epoch) + `x-signature`.
- **Signature**: `HMAC-SHA256(secret, "{x-timestamp}.{raw_body}")` hex. Tolak request > 5 menit.
- Endpoint kita: `POST /api/v1/webhooks/mengantar` (publik, tanpa throttle).

### Pemetaan `status_category` → status order

| status_category | Order (non-COD) | Order (COD) |
|---|---|---|
| `DELIVERED` | DELIVERED | COD_COMPLETED (pelunasan) |
| `RTS` | CANCELLED | COD_RETURNED |
| `CANCELED` / `CANCELLED` | CANCELLED | CANCELLED |
| `PICKED UP` / `ON DELIVERY` | SHIPPED | SHIPPED |
| `PENDING PICKUP` / `ACTIVE` / `WAITING NEXT PROCESS` | PROCESSING | PROCESSING |
| lainnya (`UNDELIVERED`, `PICKUP FAILED`, `ERROR`) | — (hanya update shipment.status) | — |

Idempotensi: log tiap webhook di `webhook_logs`; event sama (`cnote_no`+`status_category`) yang sudah diproses dilewati.

## Catatan penting

- `courier=all` hanya mengembalikan kurir yang aktif; skip `unsupported:true` dan varian `*Cargo`.
- `customerAddressDataId` (buat resi) = `_id` hasil `/address/search` (dicocokkan dari `district`+`city` alamat pelanggan).
- `COD_AMOUNT` pada estimate = nilai barang + ongkir (dipakai hitung `codFee`).
- Buat resi (`MengantarProvider::createShipment`) dipakai admin (Fase 9); mengembalikan `awb` = `cnote_no`.
