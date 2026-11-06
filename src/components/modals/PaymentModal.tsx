import React, { useState } from 'react';
import { KeyRound, X, Sparkles, ShieldCheck } from 'lucide-react';
import { activateProLicense, getCurrentUserAccount } from '../../services/supabaseClient';
import { TermsOfService } from '../legal/TermsOfService';

interface PaymentModalProps { isOpen: boolean; onClose: () => void; onSuccess: () => void; }

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTos, setShowTos] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ isError: boolean; text: string } | null>(null);
  if (!isOpen) return null;
  const currentUser = getCurrentUserAccount();

  const handleActivate = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true); setStatusMsg(null);
    try {
      const result = await activateProLicense(inputCode);
      setStatusMsg({ isError: !result.success, text: result.message });
      if (result.success) setTimeout(() => { onSuccess(); onClose(); }, 1200);
    } catch (error: any) {
      setStatusMsg({ isError: true, text: error?.message || 'Aktivasi gagal. Silakan coba lagi.' });
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-2xl max-w-lg w-full p-6 relative">
        <button onClick={onClose} aria-label="Tutup" className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-800 rounded-lg"><X className="w-5 h-5" /></button>
        <div className="flex items-center gap-3 mb-5 border-b border-slate-200 pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 border-2 border-slate-900 flex items-center justify-center"><Sparkles className="w-5 h-5 text-amber-800" /></div>
          <div><h2 className="text-lg font-black">Aktivasi Lisensi Pro</h2><p className="text-xs text-slate-500">Kode hanya dapat digunakan sekali dan terikat pada akun Anda.</p></div>
        </div>
        {!currentUser ? <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-sm">Silakan masuk ke akun terlebih dahulu sebelum mengaktifkan lisensi.</div> : (
          <form onSubmit={handleActivate} className="space-y-3">
            <p className="text-xs text-slate-600">Pembayaran perlu dilakukan melalui kanal penjualan resmi. Masukkan kode lisensi yang Anda terima setelah pembayaran terkonfirmasi.</p>
            <label className="block text-xs font-bold">Kode lisensi
              <div className="relative mt-1"><KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-600" /><input required autoComplete="off" value={inputCode} onChange={(e) => setInputCode(e.target.value)} placeholder="Masukkan kode dari penjual" className="w-full text-xs font-mono p-2.5 pl-9 rounded-xl border-2 border-slate-900" /></div>
            </label>
            <button disabled={loading} className="w-full py-2.5 bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl border-2 border-slate-900">{loading ? 'Memverifikasi…' : 'Verifikasi & Aktifkan'}</button>
          </form>
        )}
        {statusMsg && <div role={statusMsg.isError ? 'alert' : 'status'} className={`mt-4 p-3 rounded-xl border text-xs font-bold ${statusMsg.isError ? 'bg-rose-100 border-rose-300 text-rose-800' : 'bg-emerald-100 border-emerald-300 text-emerald-800'}`}>{statusMsg.text}</div>}
        <div className="flex flex-col items-center gap-1.5 mt-4 text-[11px] text-slate-500 justify-center">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verifikasi lisensi menggunakan sesi akun Supabase.</span>
          </div>
          <button
            type="button"
            onClick={() => setShowTos(true)}
            className="text-indigo-700 hover:text-indigo-950 font-bold underline"
          >
            Butuh bantuan / Baca Syarat Layanan &amp; Kontak WhatsApp
          </button>
        </div>
      </div>
      <TermsOfService isOpen={showTos} onClose={() => setShowTos(false)} isModal={true} />
    </div>
  );
};
