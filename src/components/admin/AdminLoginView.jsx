// src/components/admin/AdminLoginView.jsx
import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'tam2026';
const ALLOWED_ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || 'xunanggio@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase());

export default function AdminLoginView({ onLoginSuccess, onNavigateHome }) {
  const [passInput, setPassInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });

        if (!userInfoRes.ok) {
          throw new Error('Không thể lấy thông tin tài khoản Google');
        }

        const profile = await userInfoRes.json();
        const email = (profile.email || '').toLowerCase();

        if (ALLOWED_ADMIN_EMAILS.includes(email)) {
          const userObj = { email, name: profile.name, picture: profile.picture };
          sessionStorage.setItem('xng_admin_user', JSON.stringify(userObj));
          localStorage.setItem('xng_admin_user', JSON.stringify(userObj));
          onLoginSuccess(userObj);
          setLoginError('');
        } else {
          setLoginError(`Email ${email} không có quyền quản trị vườn.`);
        }
      } catch (err) {
        console.error('Lỗi lấy hồ sơ Google:', err);
        setLoginError('Đăng nhập Google thất bại. Vui lòng thử lại hoặc dùng mật khẩu.');
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: (err) => {
      console.warn('Lỗi Google OAuth:', err);
      setLoginError('Đăng nhập Google không thành công. Kiểm tra Authorized Origins hoặc adblock.');
      setIsGoogleLoading(false);
    }
  });

  const handlePasswordLogin = (e) => {
    if (e) e.preventDefault();
    if (passInput.trim() === ADMIN_PASSWORD) {
      const userObj = { email: 'admin@xunanggio.vn', name: 'Chủ Vườn' };
      sessionStorage.setItem('xng_admin_user', JSON.stringify(userObj));
      onLoginSuccess(userObj);
      setLoginError('');
    } else {
      setLoginError('Mật khẩu quản trị không chính xác.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 font-sans animate-fadeIn text-stone-800">
      <div className="w-full max-w-md bg-white p-7 sm:p-9 rounded-3xl border border-stone-200/90 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100/90 text-amber-900 flex items-center justify-center border border-amber-200 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">Khu Vực Quản Trị Vườn</h2>
          <p className="text-xs sm:text-sm text-stone-500 leading-relaxed font-normal">
            Dành riêng cho chủ vườn Xứ Nắng Gió ({ALLOWED_ADMIN_EMAILS.join(', ')})
          </p>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            disabled={isGoogleLoading}
            onClick={() => loginWithGoogle()}
            className="w-full h-11 px-4 rounded-2xl border border-stone-300 hover:border-amber-500 bg-white hover:bg-stone-50 text-stone-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{isGoogleLoading ? 'Đang xác thực Google...' : 'Đăng nhập với Google'}</span>
          </button>
          
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-stone-200"></div>
            <span className="shrink mx-3 text-stone-400 text-xs font-bold uppercase tracking-wider">Hoặc dùng mật khẩu</span>
            <div className="flex-grow border-t border-stone-200"></div>
          </div>

          <form onSubmit={handlePasswordLogin} className="space-y-3.5 text-left">
            <div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Nhập mật khẩu quản trị..."
                  value={passInput}
                  onChange={(e) => {
                    setPassInput(e.target.value);
                    setLoginError('');
                  }}
                  className="w-full h-11 text-xs sm:text-sm pl-11 pr-4 rounded-2xl border border-stone-200 bg-stone-50/80 focus:bg-white focus:outline-none focus:border-amber-700 font-medium text-stone-900 transition-all shadow-2xs"
                />
              </div>

              {loginError && (
                <div className="flex items-center gap-1.5 text-rose-600 text-xs font-semibold mt-2 px-1">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full h-11 px-4 rounded-2xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Đăng Nhập Mật Khẩu</span>
            </button>
          </form>
        </div>

        {onNavigateHome && (
          <button
            type="button"
            onClick={onNavigateHome}
            className="text-xs sm:text-sm font-semibold text-stone-500 hover:text-stone-900 flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer pt-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay về trang mua sắm</span>
          </button>
        )}
      </div>
    </div>
  );
}