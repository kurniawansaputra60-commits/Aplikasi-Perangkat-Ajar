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
| `GEMINI_API_KEY` | Opsional; server Gemini key |

**Jangan** beri prefix `VITE_` kepada service-role key. Jangan commit rahasia ke GitHub. Jika service-role key pernah dipublikasikan, rotasi segera.

Setelah menambah/mengubah variables, jalankan **Redeploy**. Kunjungi `/api/health`; hasilnya harus JSON dengan `status: ok`.

## C. Tes sebelum membuka ke pelanggan

1. Buat akun percobaan baru, konfirmasi email jika fitur itu aktif, lalu login.
2. Uji simpan/muat data di cloud. Buat akun kedua dan pastikan tidak bisa membaca data akun pertama.
3. Periksa RLS di Supabase; jangan menonaktifkannya untuk mengatasi error.
4. Pastikan alur email dan redirect berfungsi di URL produksi dan preview.
5. Uji aktivasi kode valid satu kali, lalu uji ulang kode yang sama dan pastikan ditolak.
6. Jalankan `npm run build` secara lokal atau periksa hasil deployment build Vercel.
7. Buat backup database dan siapkan kontak dukungan, kebijakan privasi, syarat layanan, dan refund sebelum penjualan.

## D. Pembayaran dan lisensi

Saat ini aplikasi **belum terhubung ke payment gateway**. Jangan gunakan QR/nomor VA simulasi atau mengaktifkan lisensi hanya karena pengguna menekan tombol. PaymentModal sekarang hanya menerima kode lisensi yang sudah diterbitkan setelah pembayaran diverifikasi.

Untuk peluncuran awal, lakukan pembayaran secara manual melalui kanal bisnis Anda, verifikasi dana secara manual, lalu terbitkan satu kode acak unik per transaksi. Simpan hanya hash SHA-256 kode di `licenses` menggunakan contoh SQL di file migration. Berikan kode asli kepada pembeli melalui kanal tepercaya. Endpoint aktivasi akan mengikat kode ke akun Supabase dan mencegah penggunaan ulang.

Untuk pembayaran otomatis, pilih provider yang mendukung bisnis Anda (contoh Midtrans atau Xendit), buat transaksi dari endpoint server, verifikasi signature webhook dari provider di server, dan baru setelah status pembayaran terverifikasi terbitkan lisensi. Jangan mempercayai redirect browser, screenshot bukti bayar, atau status yang dikirim dari frontend. Integrasi provider belum dapat diselesaikan tanpa akun merchant, kredensial sandbox/live, dan konfigurasi webhook milik Anda.

## E. Batasan dan langkah yang perlu dilakukan pemilik

Perubahan repo menyiapkan struktur dan endpoint, tetapi saya tidak dapat menjalankan SQL di dashboard Supabase, memasukkan secret ke Vercel, atau menekan Deploy tanpa akses akun tersebut. Anda perlu melakukan langkah A dan B. Sesudah itu, Vercel dapat melakukan deployment dari commit terbaru. Jangan bagikan service-role key atau password dashboard di chat.
