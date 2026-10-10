# Edi's Journal Store

E-commerce toko buku (produk utama buku, plus alat tulis & merchandise).

**Stack:**
- Backend: Laravel 12 + Sanctum (REST API)
- Frontend: Vite + React + TypeScript + Tailwind CSS v4
- Database: MySQL 8

## Struktur

```
backend/   — API Laravel
frontend/  — SPA React
docs/      — dokumentasi proyek (PROGRESS, DECISIONS, API, dll)
```

## Menjalankan lokal

### Prasyarat
- PHP 8.3+
- Composer
- Node.js 20+
- MySQL 8

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve        # http://127.0.0.1:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev              # http://localhost:5173
```

Frontend me-proxy `/api` dan `/storage` ke backend (`http://127.0.0.1:8000`) lewat Vite, jadi tidak perlu konfigurasi tambahan.

## Dokumentasi

Lihat `docs/` untuk progress, keputusan teknis, dan kontrak API.
