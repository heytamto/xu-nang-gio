import React, { useState } from 'react';
import { Lock, ArrowLeft } from 'lucide-react';
import { supabase } from '../../../infrastructure/supabase/supabaseClient';

export default function AdminLoginView({ area = 'admin', denied, error, onLogout, onNavigateHome }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const login = async (event) => {
    event.preventDefault();
    setBusy(true); setMessage('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    } catch { setMessage('Không thể đăng nhập. Kiểm tra tài khoản hoặc thử lại.'); }
    finally { setBusy(false); setPassword(''); }
  };
  const google = async () => {
    setBusy(true); setMessage('');
    try {
      const redirectTo = new URL('/', window.location.origin);
      redirectTo.searchParams.set('page', area === 'warehouse' ? 'packing' : 'admin');
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectTo.href } });
      if (error) throw error;
    } catch { setMessage('Không thể đăng nhập Google. Vui lòng thử lại.'); setBusy(false); }
  };
  const inputClass = 'w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:border-amber-700';
  const buttonClass = 'w-full h-11 rounded-2xl bg-amber-800 text-white font-bold disabled:opacity-50';
  return <div className="min-h-[80vh] flex items-center justify-center p-4 font-sans">
    <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-stone-200 shadow-xl space-y-5 text-center">
      <Lock className="w-10 h-10 mx-auto text-amber-800" />
      <h2 className="text-xl font-black">{area === 'warehouse' ? 'Kho Đóng Hàng' : 'Khu Vực Quản Trị Vườn'}</h2>
      {denied ? <><p role="alert" className="text-red-700">Tài khoản chưa được cấp quyền vào khu vực này.</p><button type="button" className={buttonClass} onClick={onLogout}>Đăng xuất</button></> : <>
        <button type="button" disabled={busy} onClick={google} className="w-full h-11 rounded-2xl border font-bold disabled:opacity-50">Đăng nhập với Google</button>
        <form onSubmit={login} className="space-y-3">
          <input aria-label="Email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className={inputClass} />
          <input aria-label="Mật khẩu" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Mật khẩu" className={inputClass} />
          <button disabled={busy} type="submit" className={buttonClass}>{busy ? 'Đang xác thực...' : 'Đăng nhập'}</button>
        </form>
      </>}
      {(message || error) && <p role="alert" className="text-sm text-red-700">{message || error}</p>}
      <button type="button" onClick={onNavigateHome} className="mx-auto flex items-center gap-2 text-sm text-stone-600"><ArrowLeft size={16} /> Quay về cửa hàng</button>
    </div>
  </div>;
}
