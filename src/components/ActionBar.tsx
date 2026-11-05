import React, { useState } from 'react';
import { Download, Upload, Copy, FileText, CheckCircle2 } from 'lucide-react';
import { AppState } from '../types';
import { downloadJsonFile } from '../utils/exportJson';
import { downloadWordDoc, copyForWord } from '../utils/exportWord';

interface ActionBarProps {
  currentStep: number;
  state: AppState;
  onOpenUploadModal: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  currentStep,
  state,
  onOpenUploadModal,
}) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [docDownloaded, setDocDownloaded] = useState(false);

  const handleCopyWord = async () => {
    const ok = await copyForWord(currentStep, state);
    if (ok) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    }
  };

  const handleDownloadWord = () => {
    downloadWordDoc(currentStep, state);
    setDocDownloaded(true);
    setTimeout(() => setDocDownloaded(false), 3000);
  };

  const handleDownloadJson = () => {
    downloadJsonFile(state);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-900 p-4 shadow-sm mb-4">
      {/* Notice box */}
      <div className="mb-3.5 text-xs text-slate-700 leading-relaxed bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200">
        <p className="font-bold text-slate-900 mb-0.5">
          ✅ Bisa Langsung Lanjut Tanpa Simpan — ⚠️ Wajib Simpan Jika Mau Tutup Browser!
        </p>
        <p className="text-slate-600 text-[11px]">
          Anda bebas melanjutkan ke langkah berikutnya sekarang. Namun jika browser mau ditutup atau
          ada pekerjaan lain, wajib klik <strong>Unduh Berkas Data (.json)</strong> agar nanti bisa
          dilanjut lagi dengan upload file .json di menu <strong>Buka Berkas Data</strong>.
        </p>
      </div>

      {/* 4 Action Buttons matching screenshot */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* 1. Unduh Berkas Data (.json) */}
        <button
          onClick={handleDownloadJson}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl border-2 border-slate-900 shadow-sm transition active:translate-y-0.5"
          title="Unduh seluruh data perangkat ajar sebagai file JSON"
        >
          <Download className="w-4 h-4" />
          <span>Unduh Berkas Data (.json)</span>
        </button>

        {/* 2. Upload / Salin Data (.json) */}
        <button
          onClick={onOpenUploadModal}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs px-4 py-2 rounded-xl border-2 border-slate-900 shadow-sm transition active:translate-y-0.5"
          title="Muat kembali file JSON dari laptop sekolah atau salin teks"
        >
          <Upload className="w-4 h-4" />
          <span>Upload / Salin Data (.json)</span>
        </button>

        {/* 3. Salin untuk Word */}
        <button
          onClick={handleCopyWord}
          className="flex items-center gap-2 bg-amber-300 hover:bg-amber-400 text-slate-900 font-bold text-xs px-4 py-2 rounded-xl border-2 border-slate-900 shadow-sm transition active:translate-y-0.5"
          title="Salin tabel dan format rapi langsung ke clipboard untuk ditempel (Ctrl+V) di Word atau Google Docs"
        >
          {copySuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-800" />
              <span>Tersalin ke Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Salin untuk Word</span>
            </>
          )}
        </button>

        {/* 4. Unduh Word (.doc) */}
        <button
          onClick={handleDownloadWord}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl border-2 border-slate-900 shadow-sm transition active:translate-y-0.5"
          title="Unduh langsung dokumen Word .doc lengkap dengan kop sekolah dan blok tanda tangan"
        >
          {docDownloaded ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Berkas .doc Diunduh!</span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              <span>Unduh Word (.doc)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
