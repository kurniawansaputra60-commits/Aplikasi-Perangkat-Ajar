import React, { useState } from 'react';
import { CreditCard, QrCode, CheckCircle2, ShieldCheck, Sparkles, X, KeyRound, Copy, Check } from 'lucide-react';
import { activateProLicense, getCurrentUserAccount } from '../../services/supabaseClient';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [method, setMethod] = useState<'qris' | 'va' | 'code'>('qris');
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ isError: boolean; text: string } | null>(null);

  if (!isOpen) return null;

  const handleActivateCode = (codeToUse?: string) => {
    const res = activateProLicense(codeToUse || inputCode);
    if (res.success) {
      setStatusMsg({ isError: false, text: res.message });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } else {
      setStatusMsg({ isError: true, text: res.message });
    }
  };

  const currentUser = getCurrentUserAccount();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-2xl max-w-lg w-full p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 border-b border-slate-200 pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 border-2 border-slate-900 flex items-center justify-center text-amber-800 font-black">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Aktivasi Lisensi Guru Merdeka Pro</h2>
            <p className="text-xs text-slate-500">Akses tanpa batas sinkronisasi cloud &amp; pembuatan otomatis AI</p>
          </div>
        </div>

        {/* Plan Header Card */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4 rounded-xl border-2 border-slate-900 mb-5 relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase tracking-wider">
                Paket Permanen
              </span>
              <h3 className="text-base font-extrabold mt-1">Lisensi Penuh Tools Perangkat Ajar SD v1.3</h3>
              <p className="text-xs text-indigo-200">13 Langkah Runtut · Ekspor .doc · Sinkronisasi Cloud Unlimited</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-amber-300">Rp 0</span>
              <p className="text-[10px] text-emerald-300 font-bold">Aktivasi Gratis untuk Guru</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-300 mb-4 text-xs font-bold">
          <button
            onClick={() => setMethod('qris')}
            className={`py-2 rounded-lg transition ${
              method === 'qris' ? 'bg-white text-slate-900 border border-slate-300 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            QRIS Instant
          </button>
          <button
            onClick={() => setMethod('va')}
            className={`py-2 rounded-lg transition ${
              method === 'va' ? 'bg-white text-slate-900 border border-slate-300 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Virtual Account
          </button>
          <button
            onClick={() => setMethod('code')}
            className={`py-2 rounded-lg transition ${
              method === 'code' ? 'bg-white text-slate-900 border border-slate-300 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Kode Aktivasi
          </button>
        </div>

        {/* Tab Contents */}
        {method === 'qris' && (
          <div className="p-4 rounded-xl border-2 border-slate-900 bg-slate-50 text-center space-y-3">
            <p className="text-xs font-bold text-slate-800">Scan QRIS menggunakan Mobile Banking atau E-Wallet apa pun</p>
            <div className="w-40 h-40 mx-auto bg-white p-2 rounded-xl border-2 border-slate-900 flex flex-col items-center justify-center relative">
              <QrCode className="w-32 h-32 text-slate-900" />
              <span className="text-[9px] font-mono font-bold text-slate-500 mt-1">NMID: ID1020261026</span>
            </div>
            <button
              onClick={() => handleActivateCode('PRO-2026-SD')}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl border-2 border-slate-900 shadow-xs transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Simulasi Pembayaran Selesai (Aktifkan Otomatis)
            </button>
          </div>
        )}

        {method === 'va' && (
          <div className="p-4 rounded-xl border-2 border-slate-900 bg-slate-50 space-y-3">
            <p className="text-xs font-bold text-slate-800">Nomor Virtual Account Aktivasi</p>
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-300">
              <div>
                <span className="text-[10px] font-bold text-indigo-700 block">Bank BCA / Mandiri / BRI</span>
                <span className="text-sm font-mono font-extrabold text-slate-900">88012 081234567890</span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('88012081234567890');
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="p-2 text-slate-600 hover:text-indigo-600 rounded-lg bg-slate-100 border border-slate-200"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={() => handleActivateCode('GURU-MERDEKA-PRO')}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl border-2 border-slate-900 shadow-xs transition"
            >
              Konfirmasi Aktivasi VA
            </button>
          </div>
        )}

        {method === 'code' && (
          <div className="p-4 rounded-xl border-2 border-slate-900 bg-amber-50/60 space-y-3">
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-600" />
              Masukkan Kode Aktivasi / Voucher
            </label>
            <input
              type="text"
              placeholder="Contoh: PRO-2026-SD atau GURU-MERDEKA-PRO"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="w-full text-xs font-mono font-bold p-2.5 rounded-xl border-2 border-slate-900 bg-white uppercase"
            />
            <button
              onClick={() => handleActivateCode()}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl border-2 border-slate-900 shadow-xs transition"
            >
              Verifikasi &amp; Aktifkan Lisensi
            </button>
          </div>
        )}

        {statusMsg && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs font-bold ${
              statusMsg.isError ? 'bg-rose-100 border-rose-300 text-rose-800' : 'bg-emerald-100 border-emerald-300 text-emerald-800'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        <div className="flex items-center gap-2 mt-4 text-[11px] text-slate-500 justify-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Sistem Aktivasi Resmi Kemdikbud / BSKAP Kompatibel</span>
        </div>
      </div>
    </div>
  );
};
