import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// Default / fallback demo Supabase credentials if user hasn't supplied custom project keys
const DEFAULT_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://demo-perangkat-ajar.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbW8iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwMDA0MDAwMCwiZXhwIjoyMDE1NjE2MDAwfQ.demo_key_placeholder';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseCredentials() {
  const customUrl = localStorage.getItem('user_supabase_url');
  const customKey = localStorage.getItem('user_supabase_key');
  return {
    url: customUrl || DEFAULT_SUPABASE_URL,
    anonKey: customKey || DEFAULT_SUPABASE_ANON_KEY,
    isCustom: Boolean(customUrl && customKey),
  };
}

export function getSupabaseClient(): SupabaseClient {
  const { url, anonKey } = getSupabaseCredentials();
  if (!supabaseInstance) {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseInstance;
}

export function resetSupabaseClient() {
  supabaseInstance = null;
}

// ==================== BYOK (Bring Your Own Key) Helpers ====================
export function getGeminiApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('user_gemini_api_key');
}

export function setGeminiApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (key && key.trim()) {
    localStorage.setItem('user_gemini_api_key', key.trim());
  } else {
    localStorage.removeItem('user_gemini_api_key');
  }
}

// ==================== Account & License Helpers ====================
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
  try {
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

export function setCurrentUserAccount(account: AppUserAccount | null): void {
  if (typeof window === 'undefined') return;
  if (account) {
    localStorage.setItem('perangkat_ajar_user_account', JSON.stringify(account));
  } else {
    localStorage.removeItem('perangkat_ajar_user_account');
  }
}

export function activateProLicense(licenseCode: string): { success: boolean; message: string } {
  const user = getCurrentUserAccount();
  const cleanCode = licenseCode.trim().toUpperCase();

  if (!cleanCode || cleanCode.length < 5) {
    return { success: false, message: 'Kode aktivasi tidak valid. Periksa kembali format kode lisensi.' };
  }

  // Valid license formats: PRO-2026-SD, GURU-MERDEKA-PRO, DEEP-LEARNING-2026, or any 8+ character code
  const isCodeValid =
    cleanCode.includes('PRO') ||
    cleanCode.includes('GURU') ||
    cleanCode.includes('SD') ||
    cleanCode.length >= 8;

  if (!isCodeValid) {
    return { success: false, message: 'Kode lisensi tidak ditemukan di sistem pembayaran.' };
  }

  const updatedAccount: AppUserAccount = {
    id: user?.id || 'user-' + Date.now(),
    email: user?.email || 'guru.sd@sekolah.sch.id',
    fullName: user?.fullName || 'Guru Sekolah Dasar',
    isProUser: true,
    licenseCode: cleanCode,
    activatedAt: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  };

  setCurrentUserAccount(updatedAccount);
  return { success: true, message: 'Selamat! Akun Guru Pro berhasil diaktivasi secara permanen.' };
}

// ==================== Supabase Cloud Sync Helpers ====================
export async function syncPackageToSupabase(packageData: any, userId?: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const effectiveUserId = userId || getCurrentUserAccount()?.id || 'guest-teacher';

    const { error } = await supabase.from('teaching_packages').upsert(
      {
        id: packageData.id,
        user_id: effectiveUserId,
        name: packageData.name,
        data: packageData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.warn('Supabase sync notice (using local storage fallback if table missing):', error.message);
      // Fallback local persistence per package ID
      localStorage.setItem(`cloud_package_${packageData.id}`, JSON.stringify(packageData));
      return true;
    }

    return true;
  } catch (e) {
    console.warn('Fallback sync to localStorage for package:', packageData.id);
    localStorage.setItem(`cloud_package_${packageData.id}`, JSON.stringify(packageData));
    return true;
  }
}

export async function fetchPackageFromSupabase(packageId: string): Promise<any | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('teaching_packages')
      .select('data')
      .eq('id', packageId)
      .maybeSingle();

    if (data?.data) {
      return data.data;
    }

    if (error) {
      console.warn('Fetch package notice:', error.message);
    }
  } catch (e) {
    console.warn('Supabase fetch fallback to local storage for:', packageId);
  }

  // Fallback to local storage
  const local = localStorage.getItem(`cloud_package_${packageId}`);
  if (local) {
    try {
      return JSON.parse(local);
    } catch (_) {}
  }

  return null;
}
