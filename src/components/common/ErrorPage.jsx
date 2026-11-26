// src/components/common/ErrorPage.jsx
import React from 'react';
import { Home, RotateCcw, Compass, AlertTriangle, ShoppingBag } from 'lucide-react';

const ERROR_CONFIG = {
  400: {
    code: '400',
    badge: 'Yêu cầu chưa hợp lệ',
    title: 'Đường dẫn hơi lạc hướng rồi!',
    desc: 'Thông tin gửi lên không đúng định dạng hoặc liên kết đã cũ. Bạn thử kiểm tra lại đường dẫn hoặc quay về kệ hàng nhé.',
    accent: 'amber',
  },
  404: {
    code: '404',
    badge: 'Không tìm thấy trang',
    title: 'Lạc giữa đồi cát Nam Cương rồi...',
    desc: 'Trang bạn tìm không tồn tại hoặc món đặc sản này vừa hết mùa thu hoạch. Quay lại trang chủ để xem các món đang rộ vụ nhé!',
    accent: 'amber',
  },
  500: {
    code: '500',
    badge: 'Sự cố kết nối hệ thống',
    title: 'Gió Phan Rang thổi hơi mạnh, mạng đang chập chờn!',
    desc: 'Hệ thống đang gặp chút trục trặc kỹ thuật. Đừng lo, dữ liệu đơn hàng của bạn vẫn an toàn. Thử tải lại trang sau vài giây nhé.',
    accent: 'red',
  },
};

export default function ErrorPage({
  statusCode = 404,
  errorDetail = null,
  onReset,
  onGoHome,
  onGoShop,
}) {
  const config = ERROR_CONFIG[statusCode] || ERROR_CONFIG[404];
  const isServerError = Number(statusCode) >= 500;

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  const handleRetry = () => {
    if (onReset) {
      onReset();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-[75vh] w-full flex items-center justify-center p-4 sm:p-8 font-sans">
      <div className="max-w-lg w-full bg-[#FAF6F0] rounded-3xl p-6 sm:p-10 border border-stone-200/90 shadow-lg text-center space-y-6 relative overflow-hidden">
        {/* Trang trí nền nhẹ */}
        <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />

        {/* Icon & Badge */}
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-xs ${
              isServerError
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-amber-100/80 text-amber-800 border-amber-300/70'
            }`}
          >
            {isServerError ? (
              <AlertTriangle className="w-8 h-8 stroke-[1.75]" />
            ) : (
              <Compass className="w-8 h-8 stroke-[1.75]" />
            )}
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              isServerError
                ? 'bg-red-100/80 text-red-700 border-red-200'
                : 'bg-amber-100/80 text-amber-900 border-amber-300/60'
            }`}
          >
            <span>Mã lỗi {config.code}</span>
            <span>•</span>
            <span>{config.badge}</span>
          </span>
        </div>

        {/* Mã lỗi lớn & Tiêu đề */}
        <div className="relative z-10 space-y-2.5">
          <div className="font-mono font-black text-6xl sm:text-7xl tracking-tighter text-stone-900 select-none">
            {config.code}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 leading-snug">
            {config.title}
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed max-w-md mx-auto">
            {config.desc}
          </p>
        </div>

        {/* Chi tiết lỗi kỹ thuật (nếu có - hữu ích khi debug 500) */}
        {errorDetail && (
          <div className="relative z-10 p-3 rounded-2xl bg-stone-900 text-amber-300 font-mono text-xs text-left overflow-x-auto border border-stone-700">
            <span className="text-stone-400 select-none">$ error: </span>
            <span>{String(errorDetail)}</span>
          </div>
        )}

        {/* Các nút điều hướng */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {isServerError ? (
            <button
              type="button"
              onClick={handleRetry}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thử tải lại trang</span>
            </button>
          ) : (
            onGoShop && (
              <button
                type="button"
                onClick={onGoShop}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Xem kệ nông sản</span>
              </button>
            )
          )}

          <button
            type="button"
            onClick={handleGoHome}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Về Trang Chủ</span>
          </button>
        </div>
      </div>
    </div>
  );
}