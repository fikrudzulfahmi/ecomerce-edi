# PROGRESS — Edi's Journal Store

> Dibaca tiap awal sesi. Checklist fase + catatan terakhir.

## Status fase

- [x] **Fase 0** — Fondasi dokumen (PROGRESS, DECISIONS, API)
- [x] **Fase 1** — Setup proyek (backend Laravel 12 + frontend Vite React TS)
- [ ] **Fase 2** — Database & seed
- [ ] **Fase 3** — Auth
- [ ] **Fase 4** — Katalog
- [ ] **Fase 5** — Keranjang & alamat
- [ ] **Fase 6** — Checkout & pesanan (mock payment)
- [ ] **Fase 7** — Integrasi Mengantar.id
- [ ] **Fase 8** — Pembayaran GDC (tunggu verifikasi)
- [ ] **Fase 9** — Panel admin
- [ ] **Fase 10** — Hardening & rilis

## Catatan terakhir

- **Fase 1 selesai.** Backend Laravel 12 + Sanctum (route `api/user`, `sanctum/csrf-cookie`).
- Frontend Vite + React TS + Tailwind v4 (token brand `navy`/`orange`/`cream`, font Merriweather + Inter), axios client, layout dasar (Navbar/Footer/Container).
- `PAYMENT_DRIVER=mock` & `SHIPPING_DRIVER=mock` sudah diset di `.env.example`.
- **Menunggu konfirmasi sebelum Fase 2.**
