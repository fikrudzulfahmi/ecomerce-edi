# Deploy Edi's Journal Store — Git + GitHub Actions (cPanel Dewaweb)

Push ke `main` → otomatis deploy API (git pull + composer + migrate) dan SPA (build + upload dist).
Kamu hanya perlu: **buat subdomain, database, edit `.env`, dan `git clone` sekali**. Sisanya Actions.

- **API** : `https://api-store.edisjournal.my.id` → docroot `<repo>/backend/public`
- **SPA** : `https://store.edisjournal.my.id` → docroot berisi `dist/`

---

## 0. Gabungkan dulu ke `main`

Deploy dipicu dari branch **`main`**. Fitur terkini masih di `feature-ebook`, jadi gabungkan dulu:

```bash
git checkout main
git merge feature-ebook
git push origin main
```

---

## 1. Sekali saja — setup server di cPanel

### 1a. Aktifkan SSH
cPanel → **Security → SSH Access → Manage → Enable SSH**.

### 1b. Buat 2 subdomain
cPanel → **Domains → Create A New Domain** (dua kali):
- Domain `edisjournal.my.id`, Subdomain `api-store`
- Domain `edisjournal.my.id`, Subdomain `store`

### 1c. Buat database
cPanel → **MySQL Databases** → buat DB + user, catat nama/user/password (untuk `.env`).

### 1d. Clone repo (lewat Terminal cPanel)
```bash
cd ~
git clone https://github.com/fikrudzulfahmi/ecomerce-edi.git
```

### 1e. Set Document Root
- cPanel → **Domains → api-store… → Manage → Document Root** → `.../ecomerce-edi/backend/public`
- cPanel → **Domains → store… → Manage → Document Root** → `/home/USER/store`

### 1f. Buat `.env` backend
```bash
cd ~/ecomerce-edi/backend
cp .env.example .env
nano .env   # isi DB, ADMIN_EMAIL, ADMIN_PASSWORD, MENGANTAR_API_KEY, MAIL_*
```

### 1g. Buat SSH deploy key
```bash
ssh-keygen -t ed25519 -f ~/.ssh/deploy -N ""
cat ~/.ssh/deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh && chmod g-w,o-w ~
cat ~/.ssh/deploy | base64 -w0 && echo   # salin outputnya untuk secret SSH_KEY
```

---

## 2. Isi GitHub Secrets

GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**
(form cuma 2 kolom; isi **satu per satu**):

| Secret | Nilai |
|--------|-------|
| `SSH_HOST` | IP/hostname server Dewaweb |
| `SSH_USER` | username cPanel (mis. `u1002786`) |
| `SSH_KEY` | isi private key (hasil base64 di 1g) |
| `SSH_PORT` | `65002` (port SSH Dewaweb; kalau 22 isi `22`) |
| `DEPLOY_PATH` | `/home/USER/ecomerce-edi` (folder hasil git clone) |
| `DEPLOY_PATH_SPA` | `/home/USER/store` (document root SPA) |
| `VITE_API_BASE_URL` | `https://api-store.edisjournal.my.id` |

---

## 3. Deploy pertama (reset DB + seeder admin)

1. Buka tab **Actions** → workflow **Deploy API (Laravel)** → **Run workflow** → centang **fresh** → Run.
2. (SPA otomatis ter-deploy saat push, atau Run manual **Deploy SPA**.)

> `fresh` menjalankan `migrate:fresh` + `ProductionSeeder` → **hanya akun admin**.
> Setelah itu biarkan off; deploy berikutnya cukup `migrate --force`.

---

## 4. Verifikasi

- API: `https://api-store.edisjournal.my.id/` → JSON `{"app":"Edi's Journal Store","status":"ok"}`
- SPA: `https://store.edisjournal.my.id/` → beranda tampil.
- Login admin → isi produk/kategori/voucher/banner.

---

## 5. Google OAuth (setelah deploy)

Isi `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` di `.env` server,
lalu re-run workflow **Deploy API** (untuk `config:cache` ulang) atau jalankan manual:
`php artisan config:clear && php artisan config:cache`.

---

## Troubleshooting

Baca tab **Annotations** (bukan log) — workflow sudah menulis penyebab gagalnya di sana.

| Gejala | Penyebab umum |
|--------|---------------|
| Run merah "Secret kosong" | secret belum diisi (lihat §2) |
| `git pull` gagal | folder server bukan hasil clone / branch bukan main |
| `composer install` gagal | composer tidak ada → pastikan `composer` atau `~/composer.phar` |
| migrate 1050 (tabel sudah ada) | migrasi setengah jalan → Run dengan **fresh** |
| API 404 semua | Document Root belum `.../backend/public` |
| SPA refresh `/produk/x` 404 | `.htaccess` tidak ter-upload |
| Frontend panggil API salah | `VITE_API_BASE_URL` salah → rebuild |
