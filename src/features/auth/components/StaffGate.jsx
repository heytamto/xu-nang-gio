import React, { useEffect, useState } from 'react';
import { supabase } from '../../../infrastructure/supabase/supabaseClient';
import { canAccessStaffArea } from '../utils/staffAccess';
import AdminLoginView from './AdminLoginView';

export default function StaffGate({ area, onNavigateHome, children }) {
  const [state, setState] = useState({ loading: true, user: null, error: '' });
  const [logoutError, setLogoutError] = useState('');
  useEffect(() => {
    let active = true;
    let revision = 0;
    let timer;
    const verify = async () => {
      const current = ++revision;
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (active && current === revision) setState({ loading: false, user: error ? null : user, error: '' });
      } catch {
        if (active && current === revision) setState({ loading: false, user: null, error: 'Không thể xác thực phiên đăng nhập.' });
      }
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      clearTimeout(timer);
      ++revision;
      if (event === 'SIGNED_OUT') {
        if (active) setState({ loading: false, user: null, error: '' });
        return;
      }
      // Defer network calls outside the Supabase auth callback lock.
      timer = setTimeout(verify, 0);
    });
    verify();
    return () => { active = false; ++revision; clearTimeout(timer); subscription.unsubscribe(); };
  }, []);
  const logout = async () => {
    setLogoutError('');
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
      setState({ loading: false, user: null, error: '' });
      onNavigateHome?.();
    } catch { setLogoutError('Không thể đăng xuất. Vui lòng thử lại.'); }
  };
  if (state.loading) return <p className="p-8 text-center">Đang xác thực phiên đăng nhập...</p>;
  if (!canAccessStaffArea(state.user, area)) return <AdminLoginView area={area} denied={Boolean(state.user)} error={state.error || logoutError} onLogout={logout} onNavigateHome={onNavigateHome} />;
  return <>{logoutError && <p role="alert" className="p-3 text-red-700">{logoutError}</p>}{children(state.user, logout)}</>;
}
