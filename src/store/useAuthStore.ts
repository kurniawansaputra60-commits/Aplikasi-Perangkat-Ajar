import { create } from 'zustand';
import { getSupabaseClient, getCurrentUserAccount, setCurrentUserAccount, AppUserAccount } from '../services/supabaseClient';

interface AuthState {
  user: any | null;
  isPremium: boolean;
  isLoading: boolean;
  checkSession: () => Promise<void>;
  signOut: () => Promise<void>;
  activatePremium: (code?: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getCurrentUserAccount() || null,
  isPremium: getCurrentUserAccount()?.isProUser ?? true, // Pro default for smooth teacher experience
  isLoading: false,

  checkSession: async () => {
    set({ isLoading: true });

    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Fetch premium status from user_profiles table if exists
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_premium')
          .eq('id', session.user.id)
          .maybeSingle();

        const userAccount: AppUserAccount = {
          id: session.user.id,
          email: session.user.email || 'guru@sekolah.sch.id',
          fullName: session.user.user_metadata?.full_name || 'Budi Santoso, S.Pd',
          isProUser: profile?.is_premium ?? true,
        };

        setCurrentUserAccount(userAccount);
        set({
          user: session.user,
          isPremium: userAccount.isProUser,
          isLoading: false,
        });
      } else {
        const localUser = getCurrentUserAccount();
        if (localUser) {
          set({ user: localUser, isPremium: localUser.isProUser, isLoading: false });
        } else {
          set({ user: null, isPremium: false, isLoading: false });
        }
      }
    } catch (err) {
      console.warn('Check session fallback to local user:', err);
      const localUser = getCurrentUserAccount();
      set({
        user: localUser,
        isPremium: localUser ? localUser.isProUser : false,
        isLoading: false,
      });
    }
  },

  signOut: async () => {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } catch (_) {}
    setCurrentUserAccount(null);
    set({ user: null, isPremium: false });
  },

  activatePremium: (code?: string) => {
    const user = getCurrentUserAccount();
    const updated: AppUserAccount = {
      id: user?.id || 'user-' + Date.now(),
      email: user?.email || 'guru.sd@sekolah.sch.id',
      fullName: user?.fullName || 'Guru SD Merdeka',
      isProUser: true,
      licenseCode: code || 'PRO-2026-SD',
    };
    setCurrentUserAccount(updated);
    set({ user: updated, isPremium: true });
  },
}));
