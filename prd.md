# Product Requirement Document (PRD)

## Aturen — Budgeting App untuk Keluarga Indonesia

| Field | Detail |
|---|---|
| **Product Name** | Aturen |
| **Version** | 1.0 (MVP) |
| **Author** | [Nama PM] |
| **Last Updated** | 10 Maret 2026 |
| **Status** | Draft |
| **Platform** | Web Application (Progressive Web App) |

---

## 1. Product Vision & Positioning

### Vision Statement

> Menjadi **aplikasi pencatatan keuangan keluarga paling simpel di Indonesia** — dirancang khusus agar siapa pun, termasuk yang tidak terbiasa dengan teknologi, bisa mengelola budget rumah tangga tanpa ribet.

### Positioning Statement

Berbeda dari aplikasi keuangan yang feature-heavy (Money Manager, Sribuu), **Aturen** memilih pendekatan *"less is more"*: fokus pada **pencatatan cepat** dan **visibilitas sisa budget** yang instan. Tidak perlu setup rumit — buka browser, catat, selesai.

### Key Differentiators

1. **Ultra-fast input** — Pencatatan pengeluaran < 5 detik (no friction)
2. **Reserved Budget** — Fitur alokasi dana untuk kebutuhan wajib agar tidak terpakai
3. **Zero install** — Web-based, bisa diakses dari HP, tablet, atau laptop mana pun
4. **Bahasa Indonesia first** — UI dan UX dirancang untuk user Indonesia

---

## 2. Problem Statement

### Konteks

Menurut data OJK (2024), **literasi keuangan masyarakat Indonesia** masih di angka ~49%. Banyak keluarga tidak punya sistem pengelolaan budget yang konsisten, sehingga pengeluaran sering tidak terkontrol.

### Pain Points yang Divalidasi

| # | Pain Point | Dampak |
|---|---|---|
| 1 | Pengeluaran kecil tidak tercatat | Uang "hilang" tanpa jejak |
| 2 | Tidak ada visibilitas sisa budget real-time | Tidak tahu kapan harus rem pengeluaran |
| 3 | Tidak ada pengingat batas anggaran | Overspending berulang tiap bulan |
| 4 | Uang untuk kebutuhan penting (SPP, listrik) sering terpakai duluan | Pembayaran wajib terganggu |
| 5 | Aplikasi budgeting yang ada terlalu rumit | User malas mencatat |

### Root Cause

**Tidak ada alat sederhana** yang memberikan visibilitas instan antara "uang yang bisa dipakai" vs "uang yang sudah dialokasikan" dalam satu tampilan.

---

## 3. Target Users

### Persona 1: Ibu Rina (Primary)

| Atribut | Detail |
|---|---|
| **Usia** | 35 tahun |
| **Pekerjaan** | Ibu rumah tangga |
| **Tech Literacy** | Rendah — hanya pakai WhatsApp, IG, browser |
| **Device** | Android mid-range, jarang pakai laptop |
| **Pain Point** | Uang gajian suami selalu habis sebelum akhir bulan, tidak tahu ke mana |
| **Goal** | Ingin tahu sisa uang yang aman dipakai hari ini |
| **Context of Use** | Mencatat saat di pasar, setelah belanja online, atau saat bayar tagihan |
| **Key Insight** | *"Saya butuh sesuatu yang simpel kayak nulis di buku, tapi bisa ngitung otomatis"* |

### Persona 2: Pak Andi (Secondary)

| Atribut | Detail |
|---|---|
| **Usia** | 38 tahun |
| **Pekerjaan** | Karyawan swasta |
| **Tech Literacy** | Tinggi — suka coba aplikasi baru |
| **Device** | iPhone + Laptop |
| **Pain Point** | Sudah coba Money Manager tapi terlalu kompleks, akhirnya berhenti pakai |
| **Goal** | Ingin monitor spending keluarga tanpa harus micro-manage |
| **Context of Use** | Cek dashboard di malam hari, review pengeluaran mingguan |
| **Key Insight** | *"Saya cuma butuh angka besar: budget, spent, remaining. Sisanya bonus."* |

### Persona 3: Dina (Tertiary)

| Atribut | Detail |
|---|---|
| **Usia** | 24 tahun |
| **Pekerjaan** | Fresh graduate, kerja pertama |
| **Tech Literacy** | Sangat tinggi |
| **Device** | Android flagship + Laptop |
| **Pain Point** | Gaji pertama habis tanpa sadar, belum punya kebiasaan budgeting |
| **Goal** | Ingin mulai track pengeluaran tanpa ribet |
| **Context of Use** | Catat setelah bayar GrabFood, nongkrong, atau belanja online |

---

## 4. Product Goals & Success Metrics

### Product Goals (Prioritized)

| Priority | Goal | Rationale |
|---|---|---|
| P0 | Mencegah overspending dengan visibilitas sisa budget real-time | Core value proposition |
| P0 | Pencatatan pengeluaran < 5 detik (frictionless input) | Menentukan retensi user |
| P1 | Membantu identifikasi pola pengeluaran terbesar | Actionable insight |
| P2 | Proteksi dana "wajib" agar tidak terpakai sembarangan | Fitur diferensiasi |

### Success Metrics (SMART)

#### North Star Metric

> **Percentage of users who stay within budget by end of month**
> Target: 60% of MAU within 6 bulan setelah launch

#### Engagement Metrics

| Metric | Target (3 bulan post-launch) | Cara Ukur |
|---|---|---|
| Transaksi per user per bulan | ≥ 20 entries | Analytics event |
| DAU / MAU ratio | ≥ 30% | Analytics |
| Dashboard views per week | ≥ 3x | Page view tracking |
| Session duration | < 60 detik (efisien) | Analytics |
| User retention D7 | ≥ 40% | Cohort analysis |
| User retention D30 | ≥ 25% | Cohort analysis |

#### Financial Behavior Metrics

| Metric | Target | Cara Ukur |
|---|---|---|
| Users within budget at month end | 60% of MAU | Budget vs spent comparison |
| Reserved budget utilization rate | ≥ 80% items marked paid | Status tracking |

---

## 5. Competitive Analysis

| Fitur | Aturen | Sribuu | Money Manager | Wallet |
|---|---|---|---|---|
| **Platform** | Web (PWA) | Mobile App | Mobile App | Mobile App |
| **Harga** | Free | Freemium | Freemium | Freemium |
| **Speed of Input** | ⭐⭐⭐ (optimized) | ⭐⭐ | ⭐ (banyak field) | ⭐⭐ |
| **Reserved Budget** | ✅ | ❌ | ❌ | ❌ |
| **Learning Curve** | Sangat rendah | Rendah | Tinggi | Medium |
| **Bank Integration** | ❌ (future) | ✅ | ❌ | ✅ |
| **Multi-currency** | ❌ | ❌ | ✅ | ✅ |
| **Report/Chart** | Basic | Advanced | Advanced | Advanced |
| **Bahasa Indonesia** | ✅ Native | ✅ | ❌ | ❌ |

**Competitive Advantage:** Simplicity + Reserved Budget + Zero Install + Bahasa Indonesia.

---

## 6. Core User Journey

### Journey Map

```
┌─────────┐    ┌──────────────┐    ┌──────────────────┐    ┌───────────────┐
│  Login   │───▶│  Set Budget  │───▶│  Setup Reserved  │───▶│  Daily Use    │
│          │    │  Bulanan     │    │  Budget          │    │  (Catat)      │
└─────────┘    └──────────────┘    └──────────────────┘    └───────┬───────┘
                                                                    │
                    ┌───────────────┐    ┌──────────────┐          │
                    │  Cek Laporan  │◀───│  Cek         │◀─────────┘
                    │  (Weekly)     │    │  Dashboard   │
                    └───────────────┘    └──────────────┘
```

### Journey Detail

#### Step 1: Onboarding & Login

| Aspek | Detail |
|---|---|
| **Trigger** | User pertama kali membuka app |
| **Action** | Register dengan username + password, atau login |
| **Onboarding** | First-time user diguide: (1) Set budget → (2) Tambah reserved → (3) Catat pengeluaran pertama |
| **Success** | User berhasil masuk dan melihat dashboard |
| **Edge Case** | Lupa password → reset via email (future) |

#### Step 2: Set Budget Bulanan

| Aspek | Detail |
|---|---|
| **Trigger** | Awal bulan baru atau first-time setup |
| **Action** | User input total budget bulan ini |
| **Contoh** | Budget April: Rp5.000.000 |
| **Auto Behavior** | Jika bulan baru dan belum set budget → tampilkan prompt |
| **Edge Case** | User ubah budget di tengah bulan → konfirmasi, hitung ulang remaining |

#### Step 3: Setup Reserved Budget

| Aspek | Detail |
|---|---|
| **Trigger** | Setelah set budget, atau kapan saja |
| **Action** | User menambahkan alokasi dana wajib |
| **Contoh** | SPP Anak: Rp1.000.000, Listrik: Rp300.000, Internet: Rp350.000, Tabungan: Rp500.000 |
| **Calculation** | Spendable Budget = Total Budget - Total Reserved |
| **Mark as Paid** | Saat item dibayar → tandai "Paid" → otomatis masuk pengeluaran |

#### Step 4: Mencatat Pengeluaran (Core Loop)

| Aspek | Detail |
|---|---|
| **Trigger** | Setelah berbelanja / membayar sesuatu |
| **Action** | Tap tombol (+) → input nominal → pilih kategori → submit |
| **Required Fields** | Nominal, Kategori |
| **Optional Fields** | Catatan, Tanggal (default: hari ini) |
| **Target Time** | < 5 detik dari tap (+) sampai saved |
| **UX Goals** | Auto-focus ke nominal, kategori 1-tap select, instant save |

#### Step 5: Dashboard

| Aspek | Detail |
|---|---|
| **Content** | Budget, Reserved, Spent, Remaining (dengan progress bar visual) |
| **Visual Indicator** | 🟢 Aman (< 70%) → 🟡 Hati-hati (70-90%) → 🔴 Bahaya (> 90%) |
| **Quick Actions** | Tombol (+) untuk catat pengeluaran baru |

#### Step 6: Laporan & Analisa

| Aspek | Detail |
|---|---|
| **View** | Breakdown per kategori, riwayat transaksi |
| **Sorting** | Kategori terbesar di atas |
| **Insight** | "Pengeluaran terbesar kamu bulan ini: Makan (Rp1.5jt - 45%)" |

---

## 7. Feature Requirements

### Feature Priority Matrix (MoSCoW)

#### 🔴 Must Have (MVP v1.0)

| ID | Feature | User Story | Acceptance Criteria |
|---|---|---|---|
| F01 | **Register & Login** | Sebagai user baru, saya ingin membuat akun agar data saya tersimpan | ✅ Register: username + password ✅ Login: session persist ✅ Logout ✅ Password min 8 char |
| F02 | **Set Budget Bulanan** | Sebagai user, saya ingin menentukan budget bulan ini agar tahu batas spending saya | ✅ Input nominal budget ✅ Budget per bulan ✅ Bisa diubah ✅ Prompt di awal bulan |
| F03 | **Reserved Budget** | Sebagai user, saya ingin mengalokasikan dana wajib agar tidak terpakai sembarangan | ✅ CRUD reserved items ✅ Mark as paid → masuk pengeluaran ✅ Hitung spendable budget otomatis |
| F04 | **Catat Pengeluaran** | Sebagai user, saya ingin mencatat pengeluaran dengan cepat | ✅ Input: nominal + kategori + note (opt) + date (default today) ✅ CRUD transaksi ✅ Input < 5 detik |
| F05 | **Dashboard** | Sebagai user, saya ingin melihat sisa budget secara instan | ✅ Total budget, reserved, spent, remaining ✅ Progress bar dengan color indicator ✅ Quick-add button |
| F06 | **Default Categories** | Sebagai user, saya ingin kategori sudah tersedia agar tidak perlu setup | ✅ 5 default: Makan, Transport, Belanja, Tagihan, Hiburan |
| F07 | **Onboarding Flow** | Sebagai user baru, saya ingin diguide saat pertama kali pakai | ✅ Step-by-step: set budget → add reserved → catat 1 transaksi |

#### 🟡 Should Have (v1.1)

| ID | Feature | User Story |
|---|---|---|
| F08 | **Laporan per Kategori** | Sebagai user, saya ingin tahu kategori mana yang paling boros |
| F09 | **Riwayat Transaksi** | Sebagai user, saya ingin melihat semua transaksi yang sudah dicatat |
| F10 | **Custom Category** | Sebagai user, saya ingin menambah kategori sesuai kebutuhan saya |
| F11 | **Monthly Reset** | Budget otomatis reset di awal bulan baru dengan opsi carry-over |

#### 🟢 Could Have (v1.2+)

| ID | Feature |
|---|---|
| F12 | Notifikasi overspending (push/email) |
| F13 | Multi-user keluarga (shared budget) |
| F14 | Export laporan (PDF/Excel) |
| F15 | Grafik analytics & trend |

#### ⚪ Won't Have (Not Planned)

| ID | Feature | Alasan |
|---|---|---|
| F16 | Integrasi bank / e-wallet | Kompleksitas tinggi, regulatory risk |
| F17 | AI spending insight | Butuh data besar, premature |
| F18 | Multi-currency | Bukan target market |

---

## 8. Technical Requirements

### 8.1 Tech Stack (Recommended)

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React / Next.js | Komponen reusable, SEO-friendly |
| **Styling** | Vanilla CSS / CSS Modules | Lightweight, full control |
| **Backend** | Node.js + Express / Next.js API Routes | JavaScript full-stack consistency |
| **Database** | PostgreSQL / Supabase | Relational, gratis tier cukup untuk MVP |
| **Auth** | JWT + bcrypt | Simple, stateless |
| **Hosting** | Vercel / Railway | Free tier, auto-deploy |

### 8.2 Data Model (Simplified ERD)

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    users     │     │    budgets       │     │   reserved_items │
├──────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)      │────▶│ id (PK)          │────▶│ id (PK)          │
│ username     │     │ user_id (FK)     │     │ budget_id (FK)   │
│ password_hash│     │ month            │     │ name             │
│ created_at   │     │ year             │     │ amount           │
└──────────────┘     │ total_amount     │     │ is_paid          │
                     │ created_at       │     │ paid_at          │
                     └──────────────────┘     │ created_at       │
                                              └──────────────────┘
┌──────────────────┐     ┌──────────────────┐
│   expenses       │     │   categories     │
├──────────────────┤     ├──────────────────┤
│ id (PK)          │     │ id (PK)          │
│ budget_id (FK)   │     │ user_id (FK)     │
│ category_id (FK) │────▶│ name             │
│ amount           │     │ is_default       │
│ note             │     │ created_at       │
│ date             │     └──────────────────┘
│ created_at       │
└──────────────────┘
```

### 8.3 API Endpoints (MVP)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user baru |
| POST | `/api/auth/login` | Login, return JWT |
| POST | `/api/auth/logout` | Invalidate session |
| GET | `/api/budgets/:month/:year` | Get budget bulan tertentu |
| POST | `/api/budgets` | Create/update budget |
| GET | `/api/reserved/:budgetId` | List reserved items |
| POST | `/api/reserved` | Add reserved item |
| PATCH | `/api/reserved/:id` | Update (mark paid, edit) |
| DELETE | `/api/reserved/:id` | Delete reserved item |
| GET | `/api/expenses/:budgetId` | List expenses |
| POST | `/api/expenses` | Add expense |
| PATCH | `/api/expenses/:id` | Edit expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| GET | `/api/categories` | List categories |
| GET | `/api/dashboard/:budgetId` | Get dashboard summary |

### 8.4 Non-Functional Requirements

| Category | Requirement | Target |
|---|---|---|
| **Performance** | Input transaksi response time | ≤ 2 detik |
| **Performance** | Dashboard load time | ≤ 3 detik |
| **Performance** | First Contentful Paint (FCP) | ≤ 1.5 detik |
| **Usability** | UI harus intuitif untuk non-tech user | Usability test score ≥ 80% |
| **Usability** | Minimal text, maksimal visual indicator | Progress bar, warna, ikon |
| **Accessibility** | Responsive design | Mobile-first (360px — 1440px) |
| **Accessibility** | Touch-friendly | Min tap target 44x44px |
| **Security** | Password storage | bcrypt hashing (salt rounds ≥ 10) |
| **Security** | API authentication | JWT with expiry (24h) |
| **Security** | Data transmission | HTTPS only (TLS 1.2+) |
| **Security** | Input validation | Server-side sanitization (XSS, SQL injection prevention) |
| **Security** | Rate limiting | Max 100 req/min per user |
| **Reliability** | Uptime target | 99.5% |
| **Reliability** | Data backup | Daily automated backup |

---

## 9. Risk Assessment

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | User malas mencatat setelah seminggu | Tinggi | Tinggi | Buat input se-frictionless mungkin, reminder notification (v1.1) |
| 2 | Data hilang / corruption | Rendah | Sangat Tinggi | Daily backup, soft-delete, audit trail |
| 3 | Security breach (data keuangan bocor) | Rendah | Sangat Tinggi | Encryption, code review, security audit |
| 4 | User tidak mengerti cara pakai | Medium | Medium | Onboarding flow, tooltips, UX testing |
| 5 | Scope creep selama development | Tinggi | Medium | Strict MVP scope, weekly check-in |
| 6 | Performance lambat pada device low-end | Medium | Tinggi | Mobile-first, lazy loading, minimal JS bundle |

---

## 10. MVP Development Timeline

### Phase 1: Foundation (Week 1-2)

- [ ] Project setup (tech stack, CI/CD)
- [ ] Database design & migration
- [ ] Authentication system (register, login, logout)
- [ ] Basic UI framework & design system

### Phase 2: Core Features (Week 3-4)

- [ ] Budget management (CRUD)
- [ ] Reserved budget (CRUD + mark as paid)
- [ ] Expense tracking (CRUD)
- [ ] Category system (defaults)

### Phase 3: Dashboard & Polish (Week 5-6)

- [ ] Dashboard (summary + progress bar)
- [ ] Onboarding flow
- [ ] Responsive design testing
- [ ] Performance optimization

### Phase 4: Testing & Launch (Week 7-8)

- [ ] Integration testing
- [ ] Usability testing (3-5 real users)
- [ ] Security review
- [ ] Bug fixes
- [ ] Soft launch (beta)

**Total estimated timeline: 8 minggu**

---

## 11. Open Questions

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | Apakah perlu email untuk reset password di MVP? | PM | Open |
| 2 | Bagaimana handle multi-currency jika user punya pengeluaran USD? | PM | Deferred |
| 3 | Apakah data disimpan selamanya atau ada retention period? | Engineering | Open |
| 4 | Monetization strategy untuk sustainability? | Business | Open |
| 5 | Apakah perlu offline support (PWA) di MVP? | PM | Open |

---

## 12. Appendix

### A. Glossary

| Term | Definition |
|---|---|
| **Budget** | Total uang yang dialokasikan untuk satu bulan |
| **Reserved Budget** | Uang yang sudah dialokasikan untuk kebutuhan spesifik dan tidak boleh dipakai untuk hal lain |
| **Spendable Budget** | Budget - Reserved = uang yang "aman" untuk dipakai |
| **Overspending** | Kondisi saat pengeluaran melebihi budget yang ditetapkan |

### B. Reference

- OJK Survei Nasional Literasi dan Inklusi Keuangan 2024
- Nielsen Norman Group — Mobile Usability Guidelines
- Google Material Design — Data Entry Best Practices

---

*Document ini adalah living document dan akan diperbarui sesuai hasil discovery, testing, dan feedback dari stakeholder.*
