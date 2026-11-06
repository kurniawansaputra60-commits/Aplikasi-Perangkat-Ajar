import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Lock, Sparkles, CheckCircle2, ShieldCheck, CreditCard, LogOut, ArrowRight } from 'lucide-react';
import { TermsOfService } from '../legal/TermsOfService';

export const Paywall = () => {
  const { signOut, user, activatePremium } = useAuthStore();
  const [activating, setActivating] = useState(false);
  const [isTosOpen, setIsTosOpen] = useState(false);

  const handleBuy = () => {
    setActivating(true);
    setTimeout(() => {
      activatePremium('PRO-2026-SD');
      setActivating(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border-2 border-slate-900 shadow-2xl p-6 text-center space-y-6">
        <div className="w-14 h-14 bg-amber-100 rounded-2xl border-2 border-slate-900 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-900">Akses Terkunci 🔒</h2>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Halo <span className="font-bold text-slate-900">{user?.user_metadata?.full_name || user?.email || 'Guru'}</span>, Anda memerlukan lisensi aktif (PRO) untuk menggunakan seluruh fitur pembuat perangkat ajar.
          </p>
        </div>

        <div className="bg-amber-50/80 p-5 rounded-xl border-2 border-slate-900 text-left space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Lisensi Premium Guru Merdeka
            </h3>
            <span className="text-[10px] font-black px-2 py-0.5 bg-amber-300 text-slate-950 rounded-md uppercase">
              Permanen
            </span>
          </div>

          <ul className="text-xs text-slate-700 space-y-2 font-medium">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Akses penuh 13 langkah penyusunan runtut</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Integrasi otomatis dengan AI (Deep Learning)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Penyimpanan Cloud Supabase (Data aman)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Ekspor langsung ke Word (.doc) lengkap kop sekolah</span>
            </li>
          </ul>

          <div className="pt-2 border-t border-slate-300 flex items-baseline justify-between">
            <div>
              <p className="text-2xl font-black text-slate-900">
                Rp 150.000 <span className="text-xs font-normal text-slate-500">/sekali bayar</span>
              </p>
              <p className="text-[10px] text-emerald-700 font-bold">Aktivasi Gratis untuk Guru Merdeka</p>
            </div>
          </div>

          <button
            onClick={handleBuy}
            disabled={activating}
            className="w-full py-3 px-4 text-white font-extrabold text-xs bg-indigo-600 hover:bg-indigo-700 rounded-xl border-2 border-slate-900 shadow-sm transition-transform active:scale-98 flex items-center justify-center gap-2"
          >
            {activating ? (
              <span>Mengaktifkan Lisensi...</span>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Beli / Aktifkan Lisensi Sekarang</span>
              </>
            )}
          </button>
        </div>

        <div className="pt-2 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setIsTosOpen(true)}
            className="text-[11px] font-bold text-indigo-700 hover:text-indigo-950 underline"
          >
            Syarat &amp; Ketentuan Layanan (ToS) · Bantuan WhatsApp / Email
          </button>

          <button
            onClick={signOut}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 underline flex items-center justify-center gap-1 mx-auto transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Bukan akun Anda? Keluar</span>
          </button>
        </div>
      </div>

      <TermsOfService isOpen={isTosOpen} onClose={() => setIsTosOpen(false)} isModal={true} />
    </div>
  );
};
