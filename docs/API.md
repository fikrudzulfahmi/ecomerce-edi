# API — Edi's Journal Store

Prefix: `/api/v1`. Response JSON via API Resource. Format error konsisten: `{message, errors?}`.

## Auth
| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/register` | daftar |
| POST | `/login` | login (token Sanctum) |
| POST | `/logout` | logout |
| GET | `/me` | profil sendiri |
| GET | `/email/verify/{id}/{hash}` | verifikasi email |
| POST | `/forgot-password` | kirim tautan reset |
| POST | `/reset-password` | reset password |

## Katalog (publik, tanpa login)
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/categories` | daftar kategori |
| GET | `/products` | filter: q, category, type, price, sort, paginate |
| GET | `/products/{slug}` | detail produk (termasuk book_details) |

## Keranjang (auth)
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/cart` | lihat keranjang |
| POST | `/cart/items` | tambah item (cek stok, batas qty) |
| PATCH | `/cart/items/{id}` | ubah qty |
| DELETE | `/cart/items/{id}` | hapus item |

## Alamat (auth)
| Method | Endpoint |
|---|---|
| GET / POST | `/addresses` |
| GET / PATCH / DELETE | `/addresses/{id}` |

## Checkout (auth + `verified`)
| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/checkout/shipping-options` | hitung opsi ongkir |
| POST | `/checkout` | buat order (transaksi DB, kunci stok) |

## Pesanan (auth)
| Method | Endpoint |
|---|---|
| GET | `/orders` |
| GET | `/orders/{code}` |
| POST | `/orders/{code}/cancel` |

## Webhook
| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/webhooks/gdc` | verifikasi signature + idempotensi |
| POST | `/webhooks/mengantar` | update status pengiriman |

## Admin (`role:admin`)
| Method | Endpoint |
|---|---|
| CRUD | `/admin/products`, `/admin/categories` |
| GET | `/admin/orders` |
| POST | `/admin/orders/{code}/ship` (buat resi) |
| PATCH | `/admin/orders/{code}/status` |
| GET | `/admin/reports/summary` |

## Middleware
- `auth:sanctum` — harus login.
- `verified` — email terverifikasi (wajib untuk checkout).
- `role:admin` — khusus admin.
- `throttle` — pada login & webhook.

## Enum status order

`PENDING_PAYMENT → PAID → PROCESSING → SHIPPED → DELIVERED`

Cabang: `CANCELLED`, `EXPIRED`, `COD_PENDING → COD_COMPLETED / COD_RETURNED`
