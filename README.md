# Aturen - Budgeting App untuk Keluarga Indonesia

Aplikasi pencatatan keuangan keluarga yang sangat simpel, berfokus pada kecepatan input (di bawah 5 detik) dan alokasi *Reserved Budget* (Dana Wajib).

## Fitur Utama MVP

1. **Catat Cepat**: Halaman khusus untuk mencatat pengeluaran secara instan. Auto-focus ke input nominal dan kategori 1-tap.
2. **Reserved Budget**: Alokasikan uang ke kebutuhan wajib di awal bulan, sehingga sisa budget yang aman dipakai jelas terlihat.
3. **Dashboard Real-time**: Progress bar (Hijau/Kuning/Merah) untuk menunjukkan batas pemakaian budget bulanan.
4. **Mobile First UI**: Desain antarmuka menyerupai aplikasi native di handphone dengan bottom navigation bar.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React Hook Form, Zod, TailwindCSS v4
- **Backend / API**: Next.js Edge API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: JWT via cookies & Next.js Middleware

---

## Cara Menjalankan Project (Local Development)

### 1. Prerequisites
- Node.js (v20+)
- Database PostgreSQL (Lokal atau Cloud seperti Supabase/Neon)

### 2. Setup Database
Ubah file `.env.example` menjadi `.env` dan masukkan connection string database PostgreSQL Anda.

```env
DATABASE_URL="postgresql://user:password@localhost:5432/aturen?schema=public"
JWT_SECRET="rahasia_untuk_local_development"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Prisma & Seed Data
Jalankan migrasi database lalu seed kategori default (Makan, Transport, Belanja, Tagihan, Hiburan).

```bash
npx prisma db push
npm run prisma db seed
```

### 5. Jalankan Development Server
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser. 
*(Disarankan membukanya menggunakan fitur Inspect Element / Responsive Mode di Chrome untuk melihat UI mobile).*

---

## Cara Penggunaan (Simulasi Flow)

1. Buka `http://localhost:3000/register` dan buat akun.
2. Anda akan otomatis diarahkan ke `/dashboard` lalu diminta mengisi **Budget Bulanan** (diarahkan ke tab Settings).
3. Setelah set budget bulanan, masuk ke tab **Reserved** (Dana Wajib) lalu tambahkan item (misal: "Listrik" 300,000, "SPP Anak" 1,000,000).
4. Kembali ke **Home** (Dashboard) untuk melihat kalkulasi *Sisa Budget (Aman Dipakai)*.
5. Cobalah tab **Catat** (Tombol (+) di tengah) untuk simulasi kecepatan input pengeluaran harian.
6. Cobalah kembali ke tab **Reserved** dan tandai item sebagai "Sudah Dibayar" dengan mengklik logo bulat. Sistem akan otomatis memasukkannya sebagai pengeluaran ke dalam buku pengeluaran bulan ini.
