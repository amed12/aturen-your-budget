# Panduan Deployment Aturen (Netlify + Neon)

Aplikasi **Aturen** dibangun menggunakan Next.js (Full-Stack) dan PostgreSQL. Untuk menjaga performa aplikasi tetap ngebut 24/7 secara gratis, kita akan menggunakan kombinasi **Netlify** untuk Web Hosting dan **Neon** untuk Database Hosting.

---

## 🛠 Persiapan Awal
1. Pastikan semua *code* lokal sudah di-*commit*.
2. Buat repository baru di **GitHub** (atur jadi *Private* agar aman).
3. *Push* semua *code* Aturen lokal Anda ke repository GitHub tersebut.

---

## 🗄 Langkah 1: Siapkan Database di Neon.tech
Neon adalah layanan *serverless* PostgreSQL yang gratis dan sangat tangguh.

1. Buka [neon.tech](https://neon.tech) dan **Daftar/Login** menggunakan akun GitHub/Google Anda.
2. Klik tombol **Create Project**.
   - **Name:** aturen-db
   - **Database version:** PostgreSQL 16 (Atau yang terbaru yang tersedia)
   - **Region:** Pilih yang terdekat, misal *Singapore (AWS)*.
3. Klik **Create Project**.
4. Setelah project berhasil dibuat, Anda akan diberikan sebuah *Connection String* dalam format URL yang dikasih tanda ⭐ (atau bisa dicari di halaman *Dashboard* -> bagian *Connection Details*).
   - Formatnya kira-kira seperti ini: `postgresql://neondb_owner:kuncirahasia123@ep-restless-bird-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
5. **Simpan URL ini**, ini akan menjadi `DATABASE_URL` Anda di Production.

---

## ⚙️ Langkah 2: Setup Database (Migrasi Schema)
Sekarang kita perlu membangun tabel-tabel (Users, Budgets, dll) di *database* Neon yang masih kosong tadi.

1. Buka *Terminal / Command Prompt* laptop Anda, arahkan ke folder project Aturen.
2. Buka file `.env` di VSCode.
3. Ubah nilai `DATABASE_URL` dengan *Connection String* dari Neon tadi (sementara).
   ```env
   # .env
   DATABASE_URL="postgresql://neondb_owner:kuncirahasia.....?sslmode=require"
   JWT_SECRET="secret-rahasia-lokal-anda"
   ```
4. Jalankan perintah ini di terminal untuk "mencetak" tabel ke server Neon:
   ```bash
   npx prisma db push
   ```
   *Tunggu sampai layar terminal menunjukkan pesan hijau tanda berhasil membuat tabel.*

---

## 🚀 Langkah 3: Deploy di Netlify
Netlify akan mengambil *source code* aplikasi dari GitHub Anda dan menjadikannya sebuah *website* berjalan yang bisa dikunjungi.

1. Buka [netlify.com](https://netlify.com) dan **Sign up/Login** dengan GitHub Anda.
2. Di halaman Dashboard, klik **Add new site** lalu pilih **Import from an existing project**.
3. Pilih penyedia **GitHub**, kemudian otorisasikan akun Anda jika ditanya.
4. Cari dan pilih repository **Aturen** Anda dari daftar yang muncul.
5. Anda akan masuk ke halaman *Site settings and deploy*:
   - **Base directory:** *(Biarkan kosong)*
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
6. **(Penting!)** Scroll ke bawah dan klik tombol **Add environment variables**.
   - Masukkan *Keys* penting ini agar aplikasi Anda bisa terhubung ke Database dan sistem Login berjalan aman:
     - **Key:** `DATABASE_URL` -> **Value:** *(Paste URL dari Neon tadi)*
     - **Key:** `JWT_SECRET`   -> **Value:** *(Buat teks panjang rahasia yang tidak mudah ditebak, misal: `rahasia_keluarga_fathullah_778899`)*
7. Klik **Deploy site**.
8. Netlify akan mulai membangun (Build) aplikasi Anda. Proses ini memakan waktu sekitar 1-2 menit.

---

## 🎉 Langkah 4: Selesai! (Akses dan PWA)
Jika proses *deploy* berhasil selesai, Netlify akan memberikan sebuah alamat URL gratis berakhiran `*.netlify.app` (misal: `https://gorgeous-unicorn-xxx.netlify.app`).

1. Buka URL tersebut di browser HP Istri / Anda.
2. Saat terbuka sempurna, Anda akan direkomendasikan untuk **Add to Home Screen**.
3. *Done!* Sekarang web Aturen sudah ter-install sebagai aplikasi PWA di ponsel keluarga Anda dengan database asli internet!
