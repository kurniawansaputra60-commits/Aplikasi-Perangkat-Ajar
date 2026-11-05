import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const DEFAULT_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseCredentials() {
  const url = DEFAULT_SUPABASE_URL;
  const anonKey = DEFAULT_SUPABASE_ANON_KEY;
  return { url, anonKey, isCustom: false };
}

export function getSupabaseClient(): SupabaseClient {
  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey) throw new Error('Supabase belum dikonfigurasi. Atur VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.');
  if (!supabaseInstance) {
    supabaseInstance = createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  }
  return supabaseInstance;
}

export function resetSupabaseClient() { supabaseInstance = null; }

export function getGeminiApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('user_gemini_api_key');
}
export function setGeminiApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (key?.trim()) localStorage.setItem('user_gemini_api_key', key.trim());
  else localStorage.removeItem('user_gemini_api_key');
}

export interface AppUserAccount {
  id: string;
  email: string;
  fullName?: string;
  isProUser: boolean;
  licenseCode?: string;
  activatedAt?: string;
}

export function getCurrentUserAccount(): AppUserAccount | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('perangkat_ajar_user_account');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
export function setCurrentUserAccount(account: AppUserAccount | null): void {
  if (typeof window === 'undefined') return;
  if (account) localStorage.setItem('perangkat_ajar_user_account', JSON.stringify(account));
  else localStorage.removeItem('perangkat_ajar_user_account');
}

export async function activateProLicense(licenseCode: string): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  const { data: { session }, error: sessionError } = await client.auth.getSession();
  if (sessionError || !session) return { success: false, message: 'Silakan masuk sebelum mengaktifkan lisensi.' };
  const code = String(licenseCode || '').trim();
  if (!code) return { success: false, message: 'Masukkan kode lisensi.' };

  try {
    const response = await fetch('/api/license/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ code }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) return { success: false, message: result?.message || 'Kode tidak valid atau sudah digunakan.' };

    const user = session.user;
    setCurrentUserAccount({
      id: user.id,
      email: user.email || '',
      fullName: user.user_metadata?.full_name || '',
      isProUser: true,
      licenseCode: code.toUpperCase(),
      activatedAt: new Date().toLocaleDateString('id-ID'),
    });
    return { success: true, message: result?.message || 'Lisensi berhasil diaktifkan.' };
  } catch {
    return { success: false, message: 'Tidak dapat menghubungi server aktivasi. Silakan coba lagi.' };
  }
}

// One cloud snapshot per authenticated user. RLS in Supabase enforces ownership.
export async function syncPackageToSupabase(packageData: any): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return false;
    const { error } = await supabase.from('teaching_packages').upsert({
      id: user.id,
      user_id: user.id,
      name: 'Perangkat Ajar',
      data: packageData,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) {
      console.warn('Cloud save failed:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.warn('Cloud save unavailable:', error);
    return false;
  }
}

export async function fetchPackageFromSupabase(_packageId: string): Promise<any | null> {
  try {
    const supabase = getSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return null;
    const { data, error } = await supabase.from('teaching_packages').select('data').eq('user_id', user.id).maybeSingle();
    if (error) {
      console.warn('Cloud load failed:', error.message);
      return null;
    }
    return data?.data ?? null;
  } catch (error) {
    console.warn('Cloud load unavailable:', error);
    return null;
  }
}
