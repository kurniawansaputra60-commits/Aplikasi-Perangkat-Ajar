import React, { useEffect, useState } from 'react';
import { User, Lock, Mail, UserCheck, X, CheckCircle, ArrowRight } from 'lucide-react';
import { getSupabaseClient, setCurrentUserAccount, getCurrentUserAccount, AppUserAccount } from '../../services/supabaseClient';

interface AuthModalProps { isOpen: boolean; onClose: () => void; onSuccess: (user: AppUserAccount) => void; }

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUserAccount | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setNotice(null);
    setCurrentUser(getCurrentUserAccount());
    try {
      getSupabaseClient().auth.getUser().then(({ data, error }) => {
        if (!error && data.user) {
          const user = { id: data.user.id, email: data.user.email || '', fullName: data.user.user_metadata?.full_name || '', isProUser: getCurrentUserAccount()?.isProUser === true };
          setCurrentUserAccount(user);
          setCurrentUser(user);
        }
      }).catch(() => {});
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Supabase belum dikonfigurasi.');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setNotice(null);
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { data: { full_name: fullName.trim(), school_name: schoolName.trim() } },
        });
        if (error) throw error;
        if (!data.session || !data.user) {
          setNotice('Pendaftaran berhasil. Silakan cek email untuk verifikasi, lalu masuk.');
          return;
        }
        const user: AppUserAccount = { id: data.user.id, email: data.user.email || email, fullName: fullName.trim(), isProUser: false };
        setCurrentUserAccount(user); setCurrentUser(user); onSuccess(user); onClose();
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        if (!data.user) throw new Error('Login tidak berhasil.');
        const previous = getCurrentUserAccount();
        const user: AppUserAccount = {
          id: data.user.id, email: data.user.email || email,
          fullName: data.user.user_metadata?.full_name || '',
          isProUser: previous?.id === data.user.id && previous.isProUser === true,
        };
        setCurrentUserAccount(user); setCurrentUser(user); onSuccess(user); onClose();
      }
    } catch (error: any) {
      setErrorMsg(error?.message || 'Autentikasi gagal. Periksa koneksi dan kredensial Supabase.');
    } finally { setLoading(false); }
  };

  const handleLogout = async () => {
    setLoading(true); setErrorMsg(null);
    try {
      const { error } = await getSupabaseClient().auth.signOut();
      if (error) throw error;
      setCurrentUserAccount(null); setCurrentUser(null);
    } catch (error: any) { setErrorMsg(error?.message || 'Gagal keluar.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-2xl max-w-md w-full p-6 relative overflow-hidden">
        <button onClick={onClose} aria-label="Tutup" className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white border-2 border-slate-900 flex items-center justify-center mx-auto mb-2"><UserCheck className="w-6 h-6" /></div>
          <h2 className="text-lg font-black text-slate-900">{isRegister ? 'Registrasi Akun Guru' : 'Masuk Akun Perangkat Ajar'}</h2>
          <p className="text-xs text-slate-500 mt-1">Akun dikelola oleh Supabase Authentication.</p>
        </div>
        {currentUser ? (
          <div className="p-4 bg-emerald-50 border-2 border-slate-900 rounded-xl space-y-3 mb-4 text-center">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold">Anda masuk sebagai</h3><p className="text-xs text-slate-600">{currentUser.email}</p>
            <button disabled={loading} onClick={handleLogout} className="px-4 py-1.5 bg-rose-50 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold">{loading ? 'Memproses…' : 'Keluar Akun'}</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && <>
              <label className="block text-xs font-bold">Nama lengkap<div className="relative mt-1"><User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full text-xs p-2.5 pl-9 rounded-xl border-2 border-slate-900" /></div></label>
              <label className="block text-xs font-bold">Nama sekolah<input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className="w-full mt-1 text-xs p-2.5 rounded-xl border-2 border-slate-900" /></label>
            </>}
            <label className="block text-xs font-bold">Email<div className="relative mt-1"><Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full text-xs p-2.5 pl-9 rounded-xl border-2 border-slate-900" /></div></label>
            <label className="block text-xs font-bold">Kata sandi<div className="relative mt-1"><Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full text-xs p-2.5 pl-9 rounded-xl border-2 border-slate-900" /></div></label>
            {errorMsg && <div role="alert" className="p-2.5 bg-rose-100 border border-rose-300 text-rose-800 text-xs rounded-lg">{errorMsg}</div>}
            {notice && <div role="status" className="p-2.5 bg-sky-100 border border-sky-300 text-sky-800 text-xs rounded-lg">{notice}</div>}
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl border-2 border-slate-900 flex items-center justify-center gap-2">{loading ? 'Memproses…' : <>{isRegister ? 'Daftar' : 'Masuk'}<ArrowRight className="w-4 h-4" /></>}</button>
            <div className="text-center pt-2 border-t border-slate-200"><button type="button" onClick={() => { setIsRegister(!isRegister); setErrorMsg(null); setNotice(null); }} className="text-xs font-bold text-indigo-600 underline">{isRegister ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}</button></div>
          </form>
        )}
        {errorMsg && currentUser && <div role="alert" className="p-2.5 bg-rose-100 text-rose-800 text-xs rounded-lg">{errorMsg}</div>}
      </div>
    </div>
  );
};
