import React, { useState } from 'react';
import { ChevronRight, ChevronDown, HelpCircle, CheckCircle2 } from 'lucide-react';
import { StepStatus } from '../types';

interface StepHeaderBannerProps {
  currentStep: number;
  status: StepStatus;
  onChangeStatus: (newStatus: StepStatus) => void;
}

const stepGuideData: {
  [key: number]: {
    title: string;
    categoryTag: string;
    aiBadge: string;
    tujuan: string;
    persiapan: string;
    langkah: string[];
    tips: string;
  };
} = {
  1: {
    title: 'Profil Guru & Satuan Pendidikan',
    categoryTag: 'Data Pokok Sekolah',
    aiBadge: '🟢 100% Tanpa AI',
    tujuan: 'Mengisi identitas sekolah dan guru pengampu sekali saja untuk menjadi kop surat resmi dan blok tanda tangan otomatis di seluruh berkas perangkat ajar.',
    persiapan: 'NPSN, SK Pembagian Tugas Mengajar, NIP, dan tanggal titimangsa dokumen tahun ajaran baru.',
    langkah: [
      'Lengkapi nama sekolah, alamat, kelurahan, kecamatan, dan kabupaten/kota.',
      'Isi nama Kepala Sekolah & NIP serta nama Guru Pengampu & NIP.',
      'Tentukan tanggal penetapan dokumen (titimangsa) dan tahun ajaran aktif.',
    ],
    tips: 'Kop surat di Langkah 1 langsung terhubung otomatis ke ekspor Word (.doc) di semua langkah 1 sampai 13!',
  },
  2: {
    title: 'Paket Mengajar & Jenjang',
    categoryTag: 'Manajemen Kelas & Mapel',
    aiBadge: '🟢 Tanpa AI',
    tujuan: 'Menyimpan banyak kelas dan mapel cukup dalam satu berkas, berganti mapel dengan satu klik, serta menggandakan paket untuk kelas paralel (misal 5A dan 5B).',
    persiapan: 'Daftar beban jam mengajar dan nama-nama rombongan belajar.',
    langkah: [
      'Pilih paket aktif atau buat paket baru.',
      'Tentukan jenjang (SD/Umum), fase kurikulum (Fase A/B/C), dan jumlah jam pelajaran (JP) per minggu.',
      'Gunakan tombol Gandakan untuk menyalin konfigurasi ke kelas paralel.',
    ],
    tips: 'Guru kelas SD dapat membuat paket untuk seluruh mapel tematik/terpadu dalam satu file data .json.',
  },
  3: {
    title: 'Kalender & Pekan Efektif',
    categoryTag: 'Alokasi Waktu Pembelajaran',
    aiBadge: '🟢 Hitung Otomatis Tanpa AI',
    tujuan: 'Menghitung secara presisi pekan efektif semester, libur nasional, jeda PTS/PAS, dan total Jam Pelajaran (JP) riil yang tersedia.',
    persiapan: 'Kalender Pendidikan dari Dinas Pendidikan Provinsi/Kabupaten setempat.',
    langkah: [
      'Periksa jumlah pekan total pada masing-masing bulan (Juli–Desember atau Januari–Juni).',
      'Kurangi pekan tidak efektif (MPLS, ujian semester, libur semester).',
      'Perhatikan jumlah total JP yang dihitung otomatis sebagai pagu alokasi Prota dan Promes.',
    ],
    tips: 'Jangan memasukkan materi baru pada pekan asesmen sumatif akhir semester (ASAS) agar target Prota realistis.',
  },
  4: {
    title: 'Capaian Pembelajaran (CP)',
    categoryTag: 'Rujukan Kurikulum Resmi',
    aiBadge: '🟢 Verifikasi Regulasi',
    tujuan: 'Memastikan rumusan CP diambil langsung dari Kepka BSKAP 046/H/KR/2025 dan Kepka BKPDM 020/2026 yang terverifikasi sesuai fase.',
    persiapan: 'Dokumen salinan Kepka BSKAP Capaian Pembelajaran resmi.',
    langkah: [
      'Periksa elemen CP (misal: Pemahaman IPAS dan Keterampilan Proses).',
      'Pastikan tidak ada peringatan warna merah yang menandakan ketidakcocokan sumber CP dengan mapel aktif.',
      'Salin atau sesuaikan deskripsi CP bila satuan pendidikan melakukan modifikasi khusus.',
    ],
    tips: 'CP di aplikasi ini telah dilengkapi fitur validasi otomatis untuk mencegah kekeliruan fase antara Fase B dan Fase C.',
  },
  5: {
    title: 'Alur Tujuan Pembelajaran (ATP)',
    categoryTag: 'Perencanaan Kurikulum',
    aiBadge: '🟡 Bantuan AI Kurikulum Merdeka',
    tujuan: 'Menurunkan Capaian Pembelajaran (CP) menjadi Tujuan Pembelajaran (TP) yang runtut, terukur, dan memuat integrasi 8 Dimensi Profil Lulusan.',
    persiapan: 'Pagu alokasi jam dari Langkah 3 dan cakupan materi dari Langkah 4.',
    langkah: [
      'Gunakan tombol "Buat / Sempurnakan ATP dengan AI" atau sunting langsung pada tabel.',
      'Pastikan setiap TP memiliki alokasi JP dan memuat dimensi karakter yang kontekstual.',
      'Atur urutan TP dari yang konkret ke abstrak (hierarkis).',
    ],
    tips: 'Setiap TP yang Anda simpan di sini akan menjadi jangkar untuk KKTP (Langkah 8), Modul Ajar (Langkah 9), dan Soal (Langkah 12).',
  },
  6: {
    title: 'Program Tahunan (Prota)',
    categoryTag: 'Perencanaan Kurikulum',
    aiBadge: '🟢 Sinkronisasi Otomatis',
    tujuan: 'Menyusun sebaran alokasi waktu tahunan antara Semester Ganjil dan Semester Genap tanpa hitung manual.',
    persiapan: 'Daftar TP yang telah difinalisasi di Langkah 5.',
    langkah: [
      'Tinjau pembagian TP untuk Semester 1 dan Semester 2.',
      'Pastikan total jam semester seimbang dan pas dengan target kalender pendidikan.',
      'Simpan atau cetak langsung ke format dokumen Word.',
    ],
    tips: 'Prota terbentuk otomatis dari data ATP Anda, sehingga tidak ada lagi data ganda yang tidak selaras.',
  },
  7: {
    title: 'Program Semester (Promes)',
    categoryTag: 'Distribusi Pekan Mengajar',
    aiBadge: '🟢 Matriks Dinamis Tanpa AI',
    tujuan: 'Memetakan materi TP ke dalam matriks pekan mengajar mingguan dengan melewati hari libur secara otomatis.',
    persiapan: 'Kalender pekan efektif dari Langkah 3.',
    langkah: [
      'Klik sel pekan mengajar untuk mengisi jam pelajaran yang dialokasikan.',
      'Pekan libur dan pekan ujian ditandai secara visual agar tidak terisi materi baru.',
      'Cek subtotal jam per bulan untuk memastikan distribusi beban mengajar merata.',
    ],
    tips: 'Gunakan tombol "Isi Otomatis Berdasarkan Prota" untuk menyebarkan pekan secara instan.',
  },
  8: {
    title: 'Kriteria Ketercapaian TP (KKTP)',
    categoryTag: 'Standar Ketercapaian Hasil Belajar',
    aiBadge: '🟡 Pilihan 3 Model KKTP Kurikulum Merdeka',
    tujuan: 'Menentukan indikator tuntas dan tindak lanjut remedial/pengayaan dengan 3 pendekatan resmi: Interval Nilai, Rubrik, atau Deskripsi Kriteria.',
    persiapan: 'TP yang sedang aktif diajarkan.',
    langkah: [
      'Pilih model KKTP yang disepakati di satuan pendidikan Anda.',
      'Tentukan Kriteria Ketuntasan Minimal (misal: 70% atau 75%).',
      'Gunakan tombol AI untuk menyusun deskripsi rubrik kompetensi bergradasi dari Perlu Bimbingan hingga Sangat Baik.',
    ],
    tips: 'Model interval nilai sangat praktis untuk pengolahan rapor sumatif, sedangkan model rubrik sangat ideal untuk modul ajar!',
  },
  9: {
    title: 'Modul Ajar Deep Learning (RPM)',
    categoryTag: 'Fitur Utama · Sistem 5 Klik Bertahap',
    aiBadge: '⚡ 5 Klik Bertahap Tanpa Terpotong',
    tujuan: 'Menyusun Modul Ajar Pembelajaran Mendalam (Deep Learning) berkesadaran (mindful), bermakna (meaningful), dan menggembirakan (joyful) super detail tanpa risiko terpotong.',
    persiapan: 'Pilih TP yang ingin dibuatkan modul ajarnya.',
    langkah: [
      'Klik 1: Identifikasi (Karakteristik murid, jenis pengetahuan, 8 Dimensi Profil Lulusan).',
      'Klik 2: Desain Pembelajaran (Lintas disiplin, TP per pertemuan, praktik pedagogis PBL/PjBL).',
      'Klik 3: Pengalaman Belajar (Awal berkesadaran, Inti bermakna & menggembirakan, Penutup 3-2-1).',
      'Klik 4: Asesmen (Diagnostik, As/For/Of Learning, instrumen akhir).',
      'Klik 5: KKTP & Lampiran (Interval 70%, instrumen diagnostik + kunci, rubrik observasi & esai).',
    ],
    tips: 'Setiap klik dapat diedit langsung per kotak textarea, memberi Anda kontrol 100% atas hasil karya!',
  },
  10: {
    title: 'Lembar Kerja Peserta Didik (LKPD)',
    categoryTag: 'Bahan Ajar & Penyelidikan Murid',
    aiBadge: '🟡 Generator LKPD Kontekstual',
    tujuan: 'Membuat lembar kerja penyelidikan yang siap dicetak dan dibagikan ke siswa, dilengkapi studi kasus otentik, tabel investigasi, dan pertanyaan reflektif.',
    persiapan: 'Materi dan model pembelajaran dari Langkah 9.',
    langkah: [
      'Tentukan apakah LKPD untuk kelompok kecil atau mandiri.',
      'Sesuaikan stimulus studi kasus lokal agar dekat dengan keseharian murid.',
      'Tinjau langkah penyelidikan dan tabel data pengamatan sebelum mengunduh ke Word.',
    ],
    tips: 'LKPD ini dapat langsung dicetak per kelompok tanpa perlu diformat ulang.',
  },
  11: {
    title: 'Rencana Asesmen Lengkap',
    categoryTag: 'Matriks Penilaian Terpadu',
    aiBadge: '🟡 Matriks Formatif & Sumatif',
    tujuan: 'Menyatukan seluruh rencana asesmen awal (diagnostik), asesmen proses (formatif as & for learning), dan asesmen akhir (sumatif) dalam satu matriks tabel resmi.',
    persiapan: 'Rancangan penilaian dari Modul Ajar Langkah 9.',
    langkah: [
      'Tinjau pembagian teknik tes (lisan, observasi, kinerja, proyek, tes tertulis).',
      'Tentukan waktu pelaksanaan pada pertemuan ke berapa asesmen dilakukan.',
      'Pastikan asesmen proses menitikberatkan umpan balik perbaikan belajar, bukan sekadar vonis angka.',
    ],
    tips: 'Matriks ini paling sering diminta oleh Pengawas Sekolah saat supervisi administrasi kurikulum!',
  },
  12: {
    title: 'Kisi-kisi & Kartu Soal',
    categoryTag: 'Asesmen Tertulis (opsional)',
    aiBadge: '🟡 Memakai 1 Panggilan AI per Klik (Sistem 3 Klik)',
    tujuan: 'Menghasilkan matriks kisi-kisi soal, naskah butir soal lengkap dengan kunci jawaban, serta kartu soal dan pedoman penskoran berbasis level kognitif C1-C6 HOTS.',
    persiapan: 'Menentukan nama asesmen, jumlah soal PG, jumlah soal uraian, dan skor maksimal per uraian.',
    langkah: [
      'Konfigurasikan jumlah soal dan opsi PG pada formulir konfigurasi.',
      'Jalankan Klik 1 untuk menyusun matriks sebaran kisi-kisi dan level kognitif.',
      'Jalankan Klik 2 untuk menyusun naskah butir soal dan kunci jawaban.',
      'Jalankan Klik 3 untuk menyusun kartu soal format dinas dan rubrik penskoran.',
    ],
    tips: 'Semua butir soal dan kunci jawaban bisa diedit langsung di layar sebelum disalin atau diunduh ke Word!',
  },
  13: {
    title: 'Analisis Kualitas Butir Soal',
    categoryTag: 'Evaluasi & Bank Soal',
    aiBadge: '🟢 Daya Pembeda & Tingkat Kesukaran',
    tujuan: 'Menganalisis kualitas butir soal setelah diujikan ke peserta didik: daya pembeda, tingkat kesukaran, dan efektivitas pengecoh untuk seleksi bank soal.',
    persiapan: 'Naskah soal dari Langkah 12 dan rekapan jawaban siswa.',
    langkah: [
      'Tinjau indeks tingkat kesukaran (Mudah, Sedang, Sukar).',
      'Periksa daya pembeda (D): Butir yang bertanda "Diterima Baik" layak disimpan di bank soal.',
      'Butir yang bertanda "Perlu Direvisi" dapat dilihat rekomendasi perbaikannya.',
    ],
    tips: 'Langkah ini menyempurnakan siklus asesmen dari hulu ke hilir untuk pelaporan mutu pembelajaran!',
  },
};

export const StepHeaderBanner: React.FC<StepHeaderBannerProps> = ({
  currentStep,
  status,
  onChangeStatus,
}) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const guide = stepGuideData[currentStep] || stepGuideData[12];

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-900 p-4 shadow-sm mb-4">
      {/* Top row: Badges and Step Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Step Pill */}
          <span className="bg-indigo-600 text-white text-xs font-black px-3 py-1 rounded-full border border-indigo-700 shadow-xs">
            Langkah {currentStep} dari 13
          </span>

          {/* Category Tag */}
          <span className="bg-indigo-50 text-indigo-900 text-xs font-semibold px-2.5 py-1 rounded-full border border-indigo-200">
            {guide.categoryTag}
          </span>

          {/* AI Badge */}
          <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-300">
            {guide.aiBadge}
          </span>
        </div>

        {/* Right: Step Status selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Status Langkah Ini:</span>
          <select
            value={status}
            onChange={(e) => onChangeStatus(e.target.value as StepStatus)}
            className="bg-emerald-50 text-emerald-900 font-bold text-xs px-2.5 py-1 rounded-lg border-2 border-slate-900 cursor-pointer hover:bg-emerald-100 focus:outline-none"
          >
            <option value="Tersimpan">Tersimpan ✓</option>
            <option value="Draf">Draf</option>
            <option value="Perlu Ditinjau">Perlu Ditinjau</option>
            <option value="Belum Dibuat">Belum Dibuat</option>
          </select>
        </div>
      </div>

      {/* Main Title */}
      <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mb-3">
        {guide.title}
      </h2>

      {/* Accordion Guide: Petunjuk Langkah n: apa yang harus dikerjakan di sini? */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/70">
        <button
          onClick={() => setIsGuideOpen(!isGuideOpen)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-100 transition"
        >
          <div className="flex items-center gap-2">
            <span className="text-indigo-600 font-bold">
              {isGuideOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </span>
            <span className="text-slate-900">
              📘 Petunjuk Langkah {currentStep}: apa yang harus dikerjakan di sini?
            </span>
          </div>
          <span className="text-[11px] font-normal text-slate-500">
            {isGuideOpen ? 'Tutup panduan' : 'Klik untuk melihat petunjuk lengkap'}
          </span>
        </button>

        {isGuideOpen && (
          <div className="p-4 border-t border-slate-200 text-xs text-slate-700 bg-white space-y-3 leading-relaxed">
            <div>
              <strong className="text-slate-900 font-bold block mb-0.5">🎯 Tujuan:</strong>
              <p>{guide.tujuan}</p>
            </div>
            <div>
              <strong className="text-slate-900 font-bold block mb-0.5">📋 Yang Perlu Disiapkan:</strong>
              <p>{guide.persiapan}</p>
            </div>
            <div>
              <strong className="text-slate-900 font-bold block mb-0.5">🚀 Langkah Pelaksanaan:</strong>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                {guide.langkah.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ol>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
              <strong className="font-bold">💡 Tips Praktis:</strong> {guide.tips}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
