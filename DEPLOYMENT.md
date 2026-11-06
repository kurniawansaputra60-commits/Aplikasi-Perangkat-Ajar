# Deployment Vercel + Supabase

## A. SQL untuk proyek Supabase ini

1. Buka https://supabase.com/dashboard/project/jefbqoimnzytamaaazjo/sql/new.
2. Salin seluruh `supabase/migrations/202611050001_initial_schema.sql` dari repo.
3. Klik **Run**. Pastikan hasilnya sukses sebelum melanjutkan.
4. Di **Authentication → URL Configuration**, set **Site URL** ke URL produksi Vercel. Tambahkan URL preview yang diperlukan ke Redirect URLs.
5. Di **Authentication → Providers**, aktifkan Email. Tentukan kebijakan konfirmasi email dan SMTP sebelum melayani pelanggan.

Schema membuat satu snapshot per user di `teaching_packages`, dengan RLS agar hanya pemilik yang bisa mengaksesnya. Tabel `licenses` tidak dapat diakses melalui anon/authenticated; verifikasi dilakukan server-side.

## B. Vercel environment variables

Hubungkan repo `kurniawansaputra60-commits/Aplikasi-Perangkat-Ajar` sebagai proyek Vercel dengan Root Directory di root repo, Framework Vite, Build Command `npm run build`, Output Directory `dist`.

Di **Vercel → Project → Settings → Environment Variables**, tambahkan untuk Production dan Preview:

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://jefbqoimnzytamaaazjo.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key dari Project Settings → API Keys |
| `SUPABASE_URL` | `https://jefbqoimnzytamaaazjo.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anon/public key yang sama |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role/secret key, server only |
| `MIDTRANS_SERVER_KEY` | Server Key dari Midtrans Dashboard (Production / Sandbox) |
| `GEMINI_API_KEY` | Opsional; server Gemini key |

**Jangan** beri prefix `VITE_` kepada service-role key atau Midtrans server key. Jangan commit rahasia ke GitHub.

Setelah menambah/mengubah variables, jalankan **Redeploy**. Kunjungi `/api/health`; hasilnya harus JSON dengan `status: ok`.

## C. Tes sebelum membuka ke pelanggan

1. Jalankan migrasi SQL kedua di Supabase SQL Editor: `supabase/migrations/202611050002_add_payments_table.sql` untuk membuat tabel `payments` dan kolom `is_premium`.
2. Buat akun percobaan baru, konfirmasi email jika fitur itu aktif, lalu login.
3. Uji simpan/muat data di cloud. Buat akun kedua dan pastikan tidak bisa membaca data akun pertama.
4. Periksa RLS di Supabase; jangan menonaktifkannya untuk mengatasi error.
5. Pastikan alur email dan redirect berfungsi di URL produksi dan preview.
6. Uji aktivasi kode valid satu kali, lalu uji ulang kode yang sama dan pastikan ditolak.
7. Jalankan `npm run build` secara lokal atau periksa hasil deployment build Vercel.

## D. Otomatisasi Pembayaran Midtrans (Webhook)

Webhook Midtrans telah terpasang di endpoint:
- `POST /api/webhook/midtrans`

**Alur Keamanan dan Kerja Webhook:**
1. **Validasi Signature SHA512**: Sistem menghitung `SHA512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)`. Permintaan palsu atau tanpa tanda tangan valid otomatis ditolak dengan `403 Forbidden`.
2. **Auto-Generate Kode Lisensi**: Ketika status transaksi `settlement` atau `capture` (accept), server secara otomatis meng-generate lisensi unik `EDU-XXXXXX`.
3. **Penyimpanan Terenkripsi**: Lisensi di-hash dengan SHA-256 dan disimpan ke tabel `licenses`, serta status order di tabel `payments` diubah menjadi `PAID`.
4. **Auto-Aktivasi Akun (Opsional)**: Jika saat pembuatan Snap Token Anda menyertakan `custom_field1: user.id`, webhook akan langsung mengaktifkan `is_premium: true` di profil pengguna tanpa mengharuskan pengguna mengetikkan kode secara manual.

**Konfigurasi di Dashboard Midtrans:**
- Buka **Midtrans Dashboard → Settings → Configuration**.
- Masukkan Payment Notification URL: `https://aplikasi-perangkat-ajar-v1.vercel.app/api/webhook/midtrans`
- Simpan perubahan.

## E. Syarat dan Ketentuan (Terms of Service) & Dukungan

Halaman Syarat dan Ketentuan Layanan (ToS) telah terpasang lengkap dengan tombol kontak dukungan WhatsApp dan Email, dan dapat diakses melalui:
1. Tombol **Ketentuan & Bantuan** di Header navigasi atas.
2. Link di halaman Paywall (Akses Terkunci).
3. Link di Modal Aktivasi Lisensi Pro.
4. Link di Halaman Masuk / Registrasi Guru.

Untuk mengubah nomor WhatsApp atau Email dukungan resmi, Anda dapat mengedit variabel `supportWhatsApp` dan `supportEmail` di berkas `src/components/legal/TermsOfService.tsx`.
