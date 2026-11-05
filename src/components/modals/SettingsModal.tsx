import React, { useState, useEffect } from 'react';
import { Settings, Key, Database, CheckCircle2, ExternalLink, RefreshCw, X, ShieldCheck } from 'lucide-react';
import { getGeminiApiKey, setGeminiApiKey, getSupabaseCredentials, resetSupabaseClient } from '../../services/supabaseClient';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKeyInput] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKeyInput(getGeminiApiKey() || '');
      const creds = getSupabaseCredentials();
      setSupabaseUrl(localStorage.getItem('user_supabase_url') || creds.url || '');
      setSupabaseKey(localStorage.getItem('user_supabase_key') || '');
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setGeminiApiKey(apiKey.trim());

    if (supabaseUrl.trim() && supabaseKey.trim()) {
      localStorage.setItem('user_supabase_url', supabaseUrl.trim());
      localStorage.setItem('user_supabase_key', supabaseKey.trim());
    } else {
      localStorage.removeItem('user_supabase_url');
      localStorage.removeItem('user_supabase_key');
    }

    resetSupabaseClient();
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-2xl max-w-xl w-full p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 border-b border-slate-200 pb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 border-2 border-slate-900 flex items-center justify-center text-indigo-700">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Pengaturan Kunci AI &amp; Supabase Cloud</h2>
            <p className="text-xs text-slate-500">Konfigurasi Sistem BYOK (Bring Your Own Key) &amp; Basis Data Cloud</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Section 1: BYOK Gemini API Key */}
          <div className="p-4 rounded-xl border-2 border-slate-900 bg-amber-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-600" />
                API Key Google Gemini (BYOK Guru)
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 underline"
              >
                Dapatkan Kunci Gratis di Google AI Studio <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Memasang kunci milik sendiri melepaskan Anda dari batasan kuota publik dan memastikan semua fitur pembuat perangkat ajar berjalan tanpa gangguan secara gratis.
            </p>

            <input
              type="password"
              placeholder="Masukkan AIzaSy... (API Key Gemini Anda)"
              value={apiKey}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="w-full text-xs font-mono p-2.5 rounded-lg border-2 border-slate-900 bg-white shadow-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />

            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Kunci API disimpan dengan aman di penyimpanan lokal browser Anda.</span>
            </div>
          </div>

          {/* Section 2: Supabase Credentials */}
          <div className="p-4 rounded-xl border-2 border-slate-900 bg-sky-50/60 space-y-3">
            <label className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-600" />
              Kredensial Supabase Cloud Database (Opsional)
            </label>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Hubungkan ke proyek Supabase milik Anda sendiri untuk sinkronisasi otomatis antar-perangkat sekolah dan rumah.
            </p>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="Supabase Project URL (https://xxxx.supabase.co)"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full text-xs font-mono p-2.5 rounded-lg border-2 border-slate-900 bg-white shadow-xs"
              />
              <input
                type="password"
                placeholder="Supabase Anon Key (eyJhbGci...)"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="w-full text-xs font-mono p-2.5 rounded-lg border-2 border-slate-900 bg-white shadow-xs"
              />
            </div>
          </div>

          {saveSuccess && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Pengaturan berhasil disimpan! Kunci dan database telah diperbarui.
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-300"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl border-2 border-slate-900 shadow-sm flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
