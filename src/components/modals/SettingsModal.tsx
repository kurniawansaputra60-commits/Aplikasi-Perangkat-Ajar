import React, { useState, useEffect } from 'react';
import { Settings, Key, CheckCircle2, ExternalLink, RefreshCw, X, ShieldCheck, Database } from 'lucide-react';
import { getGeminiApiKey, setGeminiApiKey } from '../../services/supabaseClient';

interface SettingsModalProps { isOpen: boolean; onClose: () => void; }

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKeyInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKeyInput(getGeminiApiKey() || '');
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    setGeminiApiKey(apiKey.trim());
    setSaveSuccess(true);
    setTimeout(() => { setSaveSuccess(false); onClose(); }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-2xl max-w-xl w-full p-6 relative">
        <button onClick={onClose} aria-label="Tutup" className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
        <div className="flex items-center gap-3 mb-5 border-b border-slate-200 pb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 border-2 border-slate-900 flex items-center justify-center text-indigo-700"><Settings className="w-5 h-5" /></div>
          <div><h2 className="text-lg font-black">Pengaturan AI &amp; Cloud</h2><p className="text-xs text-slate-500">Koneksi cloud dikelola oleh konfigurasi deployment.</p></div>
        </div>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="p-4 rounded-xl border-2 border-slate-900 bg-amber-50/60 space-y-3">
            <label className="text-xs font-bold flex items-center gap-2"><Key className="w-4 h-4 text-amber-600" />API Key Google Gemini (opsional)</label>
            <p className="text-[11px] text-slate-600">Key ini disimpan di browser ini dan digunakan untuk permintaan AI. Jangan gunakan key yang sama untuk aplikasi publik tanpa batas penggunaan.</p>
            <input type="password" autoComplete="off" placeholder="Masukkan Gemini API Key" value={apiKey} onChange={(e) => setApiKeyInput(e.target.value)} className="w-full text-xs font-mono p-2.5 rounded-lg border-2 border-slate-900 bg-white" />
            <div className="flex items-center gap-2 text-[11px] text-slate-500"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /><span>Atau atur GEMINI_API_KEY sebagai server environment variable.</span></div>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[11px] font-bold text-indigo-600 underline flex items-center gap-1">Google AI Studio <ExternalLink className="w-3 h-3" /></a>
          </div>
          <div className="p-4 rounded-xl border-2 border-slate-900 bg-sky-50/60 space-y-2">
            <div className="text-xs font-bold flex items-center gap-2"><Database className="w-4 h-4 text-sky-600" />Supabase Cloud</div>
            <p className="text-[11px] text-slate-600">Project URL dan anon/public key dikonfigurasi di Vercel sebagai VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY. Kunci service-role tidak boleh dimasukkan di sini atau di browser.</p>
          </div>
          {saveSuccess && <div role="status" className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />Pengaturan AI berhasil disimpan.</div>}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 rounded-xl border border-slate-300">Batal</button>
            <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl border-2 border-slate-900 flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5" />Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
};
