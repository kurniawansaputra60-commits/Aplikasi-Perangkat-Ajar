import React, { useState } from 'react';
import { X, Download, Upload, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import { AppState } from '../../types';
import { downloadJsonFile, parseJsonFile } from '../../utils/exportJson';
import { defaultState } from '../../data/defaultData';

interface FileModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onLoadState: (newState: AppState) => void;
}

export const FileModal: React.FC<FileModalProps> = ({
  isOpen,
  onClose,
  state,
  onLoadState,
}) => {
  const [pasteText, setPasteText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    setSuccessMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseJsonFile(file);
      onLoadState(parsed);
      setSuccessMsg(`Berhasil memuat berkas "${file.name}". Beralih ke Langkah ${parsed.currentStep || 1}.`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memuat berkas .json');
    }
  };

  const handlePasteLoad = () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!pasteText.trim()) {
      setErrorMsg('Silakan tempel teks JSON terlebih dahulu.');
      return;
    }

    try {
      const parsed = JSON.parse(pasteText) as AppState;
      if (!parsed.profile || !parsed.packages) {
        throw new Error('Format JSON tidak sesuai dengan struktur Tools Perangkat Ajar.');
      }
      onLoadState(parsed);
      setSuccessMsg('Berhasil memuat data dari teks JSON.');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Format teks JSON tidak valid');
    }
  };

  const handleResetDefault = () => {
    if (window.confirm('Muat ulang data contoh simulasi IPAS Kelas 5 SD? Data yang belum disimpan ke .json akan digantikan dengan data contoh.')) {
      onLoadState(defaultState);
      setSuccessMsg('Data contoh simulasi IPAS Kelas 5 berhasil dimuat.');
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#FAF8F5] rounded-2xl border-2 border-slate-900 w-full max-w-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full border border-slate-300 bg-white flex items-center justify-center hover:bg-slate-100 text-slate-700"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
          <span>📁</span> Buka &amp; Simpan Berkas Data (.json)
        </h3>
        <p className="text-xs text-slate-600 mb-4">
          Data Anda 100% tersimpan di berkas milik Anda sendiri, aman dan tidak dikirim ke server luar.
          Simpan di sekolah, lanjutkan di rumah!
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs font-semibold">
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {successMsg}
          </div>
        )}

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Card 1: Unduh */}
          <div className="p-4 rounded-xl bg-white border-2 border-slate-900 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-xs text-slate-900 mb-1 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-600" />
                1. Unduh Berkas Data (.json)
              </h4>
              <p className="text-[11px] text-slate-600 mb-3">
                Simpan seluruh progres 13 langkah ke satu file berkas .json sebelum menutup browser.
              </p>
            </div>
            <button
              onClick={() => downloadJsonFile(state)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 rounded-lg border-2 border-slate-900 shadow-sm transition active:translate-y-0.5"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Berkas Sekarang</span>
            </button>
          </div>

          {/* Card 2: Upload */}
          <div className="p-4 rounded-xl bg-white border-2 border-slate-900 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-xs text-slate-900 mb-1 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-cyan-600" />
                2. Muat Berkas dari Komputer
              </h4>
              <p className="text-[11px] text-slate-600 mb-3">
                Pilih berkas perangkat-ajar.json yang pernah Anda unduh untuk melanjutkan pekerjaan.
              </p>
            </div>
            <label className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs py-2 rounded-lg border-2 border-slate-900 shadow-sm cursor-pointer transition active:translate-y-0.5">
              <Upload className="w-4 h-4" />
              <span>Pilih Berkas .json...</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Card 3: Salin / Tempel Teks JSON */}
        <div className="p-4 rounded-xl bg-white border-2 border-slate-900 mb-4">
          <h4 className="font-bold text-xs text-slate-900 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-600" />
            Atau Tempel / Salin Teks Mentah JSON
          </h4>
          <p className="text-[11px] text-slate-600 mb-2">
            Praktis jika Anda menyalin data lewat WhatsApp Web atau catatan tanpa mengirim file.
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Tempel teks JSON di sini (Ctrl + V)..."
            rows={3}
            className="w-full font-mono text-[11px] p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(state, null, 2));
                setSuccessMsg('Seluruh isi JSON saat ini telah disalin ke clipboard!');
                setTimeout(() => setSuccessMsg(''), 3000);
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300"
            >
              Salin Data Aktif
            </button>
            <button
              onClick={handlePasteLoad}
              className="text-xs font-bold px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-slate-900"
            >
              Muat dari Teks
            </button>
          </div>
        </div>

        {/* Card 4: Reset to Simulation Data */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-300">
          <div>
            <div className="font-bold text-xs text-amber-950">Ingin Mencoba dengan Data Contoh?</div>
            <div className="text-[11px] text-amber-800">
              Muat simulasi lengkap IPAS Kelas 5 SD Fase C dengan 13 langkah tersusun rapi.
            </div>
          </div>
          <button
            onClick={handleResetDefault}
            className="flex items-center gap-1.5 bg-amber-300 hover:bg-amber-400 text-slate-900 font-bold text-xs px-3 py-1.5 rounded-lg border-2 border-slate-900 shadow-sm transition active:translate-y-0.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Muat Data Contoh</span>
          </button>
        </div>
      </div>
    </div>
  );
};
