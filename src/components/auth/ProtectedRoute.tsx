import React, { useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { AuthContainer } from './AuthContainer';
import { Paywall } from './Paywall';
import { getSupabaseClient } from '../../services/supabaseClient';
import { RefreshCw } from 'lucide-react';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isPremium, isLoading, checkSession } = useAuthStore();

  useEffect(() => {
    checkSession();
    try {
      const supabase = getSupabaseClient();
      const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
        checkSession();
      });

      return () => {
        subscription?.unsubscribe();
      };
    } catch (_) {}
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border-2 border-slate-900 shadow-lg">
          <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
          <p className="text-xs font-bold text-slate-800">Memuat sistem autentikasi &amp; cloud data...</p>
        </div>
      </div>
    );
  }

  // Render AuthContainer when not logged in
  if (!user) return <AuthContainer />;

  // Render Paywall when user has not activated premium license
  if (!isPremium) return <Paywall />;

  return <>{children}</>;
};
