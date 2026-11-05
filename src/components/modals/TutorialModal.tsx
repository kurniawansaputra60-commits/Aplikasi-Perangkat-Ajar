import React from 'react';
import { X, Laptop, CheckCircle, Sparkles, FileDown, ShieldCheck, HelpCircle } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#FAF8F5] rounded-2xl border-2 border-slate-900 w-full max-w-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full border border-slate-300 bg-white flex items-center justify-center hover:bg-slate-100 text-slate-700"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
          <span>📖</span> Cara Pakai: Praktis di Mana Saja
        </h3>
        <p className="text-xs text-slate-600 mb-5">
          Administrasi melelahkan, dikerjakan aplikasi. Kerjakan di sekolah, lanjutkan di rumah!
        </p>

        {/* Workflow Diagram Banner */}
        <div className="p-4 rounded-xl bg-white border-2 border-slate-900 mb-6">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-3 text-center">
            Alur Fleksibel Tanpa Akun &amp; Tanpa Server
          </h4>
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center">
            <div className="flex-1 p-3 rounded-lg bg-indigo-50 border border-indigo-200">
              <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                💻
              </div>
              <div className="font-bold text-xs text-slate-900">Laptop Sekolah</div>
              <div className="text-[11px] text-slate-600">Langkah 1–6 Selesai</div>
            </div>

            <div className="font-extrabold text-indigo-600 text-lg">➔</div>

            <div className="flex-1 p-3 rounded-lg bg-emerald-50 border border-emerald-300">
              <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                📁
              </div>
              <div className="font-bold text-xs text-slate-900">perangkat-ajar.json</div>
              <div className="text-[11px] text-emerald-800 font-medium">Satu Berkas, Semua Data</div>
            </div>

            <div className="font-extrabold text-indigo-600 text-lg">➔</div>

            <div className="flex-1 p-3 rounded-lg bg-indigo-50 border border-indigo-200">
              <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                🏠
              </div>
              <div className="font-bold text-xs text-slate-900">Laptop Rumah</div>
              <div className="text-[11px] text-slate-600">Langsung Lanjut Langkah 7</div>
            </div>
          </div>
        </div>

        {/* 3 Simple Steps */}
        <div className="space-y-4 mb-6">
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-amber-300 border-2 border-slate-900 flex items-center justify-center font-black text-xs flex-shrink-0">
              1
            </div>
            <div>
              <h5 className="font-bold text-xs text-slate-900 mb-0.5">
                Unduh berkas data dengan satu klik, atau cukup salin teksnya
              </h5>
              <p className="text-xs text-slate-600">
                Sebelum mematikan komputer sekolah atau menutup tab browser, klik tombol{' '}
                <strong>Unduh Berkas Data (.json)</strong>.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-amber-300 border-2 border-slate-900 flex items-center justify-center font-black text-xs flex-shrink-0">
              2
            </div>
            <div>
              <h5 className="font-bold text-xs text-slate-900 mb-0.5">
                Bawa ke laptop lain lewat flashdisk, WhatsApp, atau Google Drive
              </h5>
              <p className="text-xs text-slate-600">
                Berkas .json berukuran sangat ringan (hanya puluhan kilobyte) sehingga sangat cepat
                dikirim ke WhatsApp Web diri sendiri atau disimpan di Google Drive.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-amber-300 border-2 border-slate-900 flex items-center justify-center font-black text-xs flex-shrink-0">
              3
            </div>
            <div>
              <h5 className="font-bold text-xs text-slate-900 mb-0.5">
                Muat kembali, aplikasi langsung membuka langkah terakhir Anda
              </h5>
              <p className="text-xs text-slate-600">
                Buka aplikasi di laptop rumah, klik menu <strong>Buka Berkas Data</strong> lalu pilih
                file .json Anda. Seluruh kop surat, jadwal, modul ajar, dan kisi-kisi soal kembali utuh!
              </p>
            </div>
          </div>
        </div>

        {/* Fitur Bintang: Sistem 5 Klik & 3 Klik */}
        <div className="p-4 rounded-xl bg-indigo-50 border-2 border-slate-900 mb-6">
          <h4 className="font-black text-xs text-indigo-950 uppercase mb-2">
            ⭐ Mengapa Memakai Sistem Klik Bertahap?
          </h4>
          <p className="text-xs text-indigo-900 mb-3 leading-relaxed">
            Dalam menyusun Modul Ajar Deep Learning (Langkah 9) dan Kisi-kisi Soal (Langkah 12),
            banyak AI biasa menghasilkan teks yang terpotong di tengah jalan karena batasan token.
            Dengan <strong>Sistem 5 Klik Bertahap</strong> dan <strong>Sistem 3 Klik</strong>, setiap
            bagian dibuat secara mendalam dan utuh, serta dapat Anda sunting langsung per kotak!
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-indigo-200">
              <span className="font-bold text-indigo-700">Langkah 9 Modul Ajar:</span>
              <ul className="list-disc list-inside text-slate-600 mt-1 space-y-0.5 text-[11px]">
                <li>Klik 1: Identifikasi &amp; Karakteristik</li>
                <li>Klik 2: Desain Pembelajaran Lintas Mapel</li>
                <li>Klik 3: Pengalaman Belajar Mindful-Joyful</li>
                <li>Klik 4: Asesmen Diagnostik &amp; Formatif</li>
                <li>Klik 5: KKTP &amp; Lampiran Instrumen</li>
              </ul>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-indigo-200">
              <span className="font-bold text-indigo-700">Langkah 12 Kisi-kisi Soal:</span>
              <ul className="list-disc list-inside text-slate-600 mt-1 space-y-0.5 text-[11px]">
                <li>Klik 1: Matriks Distribusi Kisi-kisi</li>
                <li>Klik 2: Naskah Soal &amp; Kunci Jawaban</li>
                <li>Klik 3: Kartu Soal &amp; Pedoman Skor</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Ready to Word */}
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between">
          <div className="text-xs text-emerald-900">
            <span className="font-bold block">Siap Ekspor ke Microsoft Word (.doc) &amp; Google Docs</span>
            Semua tabel, format rata tengah, kop surat dinas, dan blok tanda tangan Kepala Sekolah &amp; Guru sudah terpasang otomatis.
          </div>
        </div>
      </div>
    </div>
  );
};
