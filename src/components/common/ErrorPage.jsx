// src/components/common/ErrorPage.jsx
import React from 'react';
import { Home, RotateCcw, Compass, AlertTriangle, ShoppingBag, MapPin } from 'lucide-react';

const ERROR_CONFIG = {
  400: {
    code: '400',
    badge: 'Liên kết chưa hợp lệ',
    title: 'Hình như bạn rẽ nhầm lối vào vườn rồi!',
    desc: 'Đường dẫn hoặc thông tin gửi lên không đúng định dạng. Đừng lo, bạn có thể quay lại kệ hàng để chọn những thức quà tươi ngon nhất.',
    location: 'Cung đường vườn nho Thái An, Ninh Thuận',
    image:
      'https://images.unsplash.com/photo-1596363505729-4190a9506133?auto=format&fit=crop&w=1000&q=80',
    accent: 'amber',
  },
  404: {
    code: '404',
    badge: 'Không tìm thấy trang',
    title: 'Lạc bước giữa đồi cát Nam Cương...',
    desc: 'Trang bạn tìm không tồn tại hoặc món đặc sản này vừa hết mùa thu hoạch. Quay lại kệ hàng để khám phá các nông sản đang rộ vụ nhé!',
    location: 'Tiểu sa mạc Nam Cương, An Hải, Ninh Thuận',
    image:
      'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1000&q=80',
    accent: 'amber',
  },
  500: {
    code: '500',
    badge: 'Gián đoạn kết nối',
    title: 'Gió Phan Rang thổi mạnh, đường truyền đang chập chờn!',
    desc: 'Hệ thống đang gặp chút trục trặc kỹ thuật. Dữ liệu giỏ hàng và đơn của bạn vẫn an toàn, hãy thử tải lại trang sau vài giây nhé.',
    location: 'Mũi Dinh & Bờ biển Cà Ná, Ninh Thuận',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
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
    <div className="min-h-[78vh] w-full flex items-center justify-center p-4 sm:p-8 font-sans">
      <div className="max-w-4xl w-full bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
        
        {/* CỘT TRÁI: POSTER ẢNH PHONG CẢNH NINH THUẬN & MÃ LỖI NỔI 3D */}
        <div className="relative md:col-span-5 min-h-[260px] md:min-h-[460px] bg-stone-900 overflow-hidden flex flex-col justify-between p-6 text-white select-none group">
          <img
            src={config.image}
            alt={config.location}
            className="absolute inset-0 w-full h-full object-cover filter brightness-[0.72] contrast-105 transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-black/30" />

          {/* Badge góc trên ảnh */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="font-mono font-black text-xs px-3 py-1 rounded-xl bg-amber-400 text-stone-950 shadow-md">
              XỨ NẮNG GIÓ
            </span>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-black/50 border border-white/20 text-amber-200 backdrop-blur-md">
              {config.badge}
            </span>
          </div>

          {/* Số mã lỗi khổng lồ hiệu ứng chữ rỗng viền sáng (giống chữ dọc ngoài trang chủ) */}
          <div className="relative z-10 my-auto py-4">
            <div
              className="font-mono font-black text-7xl sm:text-8xl tracking-tighter leading-none text-transparent"
              style={{
                WebkitTextStroke: '2px rgba(255, 255, 255, 0.85)',
                filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.6))',
              }}
            >
              {config.code}
            </div>
          </div>

          {/* Chú thích địa danh chân ảnh */}
          <div className="relative z-10 flex items-center gap-1.5 text-xs text-stone-200 font-medium bg-black/45 backdrop-blur-md px-3 py-2 rounded-xl border border-white/15">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{config.location}</span>
          </div>
        </div>

        {/* CỘT PHẢI: NỘI DUNG & ĐIỀU HƯỚNG */}
        <div className="md:col-span-7 bg-[#FAF6F0] p-6 sm:p-10 flex flex-col justify-between space-y-6 relative">
          <div className="space-y-4 my-auto">
            {/* Icon nhỏ định danh */}
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-2xs ${
                isServerError
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-amber-100/80 text-amber-800 border-amber-300/70'
              }`}
            >
              {isServerError ? (
                <AlertTriangle className="w-6 h-6 stroke-[2]" />
              ) : (
                <Compass className="w-6 h-6 stroke-[2]" />
              )}
            </div>

            <div className="space-y-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 leading-tight">
                {config.title}
              </h1>
              <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                {config.desc}
              </p>
            </div>

            {/* Khung báo chi tiết kỹ thuật (chỉ hiện khi có lỗi 500 lúc dev) */}
            {errorDetail && (
              <div className="p-3.5 rounded-2xl bg-stone-900 text-amber-300 font-mono text-xs text-left overflow-x-auto border border-stone-700 shadow-inner">
                <span className="text-stone-400 select-none">$ error: </span>
                <span>{String(errorDetail)}</span>
              </div>
            )}
          </div>

          {/* Cụm nút hành động */}
          <div className="pt-4 border-t border-stone-200/80 flex flex-col sm:flex-row items-center gap-3">
            {isServerError ? (
              <button
                type="button"
                onClick={handleRetry}
                className="w-full sm:w-auto flex-1 h-12 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Thử tải lại trang</span>
              </button>
            ) : (
              onGoShop && (
                <button
                  type="button"
                  onClick={handleRetry ? onGoShop : undefined}
                  className="w-full sm:w-auto flex-1 h-12 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Ghé Kệ Nông Sản</span>
                </button>
              )
            )}

            <button
              type="button"
              onClick={handleGoHome}
              className="w-full sm:w-auto flex-1 h-12 px-5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Về Trang Chủ</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}