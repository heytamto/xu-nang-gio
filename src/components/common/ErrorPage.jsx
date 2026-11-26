// src/components/common/ErrorPage.jsx
import React from 'react';
import {
  Home,
  RotateCcw,
  Compass,
  AlertTriangle,
  ShoppingBag,
  MapPin,
  ArrowRight,
  Sparkles,
  BookOpen,
  Search,
} from 'lucide-react';

const ERROR_CONFIG = {
  400: {
    code: '400',
    badge: 'Liên kết chưa hợp lệ • Mã lỗi 400',
    titleLine1: 'Hình như bạn rẽ',
    titleHighlight: 'Nhầm Lối Vào Vườn Rồi!',
    desc: 'Đường dẫn hoặc tham số gửi lên không đúng định dạng. Đừng lo, mọi thức quà tươi ngon từ Phan Rang vẫn đang chờ bạn ở kệ hàng chính.',
    location: 'Cung đường vườn nho Thái An, Ninh Thuận',
    image:
      'https://images.unsplash.com/photo-1596363505729-4190a9506133?auto=format&fit=crop&w=1400&q=80',
  },
  404: {
    code: '404',
    badge: 'Không tìm thấy trang • Mã lỗi 404',
    titleLine1: 'Lạc Bước Giữa',
    titleHighlight: 'Đồi Cát Nam Cương...',
    desc: 'Trang bạn tìm kiếm không tồn tại hoặc món đặc sản này vừa hết mùa thu hoạch. Hãy quay lại kệ nông sản để khám phá các đặc sản đang rộ vụ nhé!',
    location: 'Tiểu sa mạc Nam Cương, An Hải, Ninh Thuận',
    image:
      'https://images.unsplash.com/photo-1547234935-80c7145ec969?auto=format&fit=crop&w=1400&q=80',
  },
  500: {
    code: '500',
    badge: 'Gián đoạn kết nối • Mã lỗi 500',
    titleLine1: 'Gió Phan Rang Thổi Mạnh,',
    titleHighlight: 'Đường Truyền Đang Chập Chờn!',
    desc: 'Hệ thống đang gặp chút trục trặc kết nối máy chủ. Dữ liệu giỏ hàng và đơn của bạn vẫn an toàn tuyệt đối, hãy thử tải lại trang sau vài giây.',
    location: 'Mũi Dinh & Bờ biển Cà Ná, Ninh Thuận',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 font-sans">
      {/* 1. HERO BANNER LỚN FULL-WIDTH (ĐỒNG BỘ 100% VỚI TRANG CỬA HÀNG) */}
      <div className="relative w-full rounded-3xl overflow-hidden bg-stone-900 text-white p-7 sm:p-12 lg:p-14 border border-stone-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        {/* Ảnh nền phong cảnh Ninh Thuận + Lớp phủ gradient ấm */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src={config.image}
            alt={config.location}
            className="w-full h-full object-cover filter brightness-[0.42] contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/85 to-stone-900/45" />
        </div>

        {/* CỘT TRÁI: NỘI DUNG THÔNG BÁO & NÚT HÀNH ĐỘNG */}
        <div className="relative z-10 max-w-2xl space-y-5">
          {/* Pill Badge giống hệt trang Cửa Hàng */}
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold border backdrop-blur-md ${
              isServerError
                ? 'bg-red-950/70 text-red-300 border-red-500/40'
                : 'bg-stone-800/80 text-amber-300 border-amber-400/30'
            }`}
          >
            {isServerError ? (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            ) : (
              <Compass className="w-4 h-4 text-amber-400" />
            )}
            <span>{config.badge}</span>
          </div>

          {/* Tiêu đề 2 dòng: Trắng + Vàng hổ phách */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15]">
            <span className="block text-white">{config.titleLine1}</span>
            <span className="block text-amber-400 mt-1">
              {config.titleHighlight}
            </span>
          </h1>

          {/* Mô tả chi tiết */}
          <p className="text-sm sm:text-base text-stone-300 leading-relaxed max-w-xl">
            {config.desc}
          </p>

          {/* Khung log lỗi kỹ thuật (nếu có lỗi 500 khi debug) */}
          {errorDetail && (
            <div className="p-3.5 rounded-2xl bg-black/70 text-amber-300 font-mono text-xs overflow-x-auto border border-white/15 max-w-xl">
              <span className="text-stone-400 select-none">$ error: </span>
              <span>{String(errorDetail)}</span>
            </div>
          )}

          {/* Cụm nút điều hướng chính */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {isServerError ? (
              <button
                type="button"
                onClick={handleRetry}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-sm flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Thử tải lại trang ngay</span>
              </button>
            ) : (
              onGoShop && (
                <button
                  type="button"
                  onClick={onGoShop}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-sm flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Ghé Gian Hàng Đặc Sản</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )
            )}

            <button
              type="button"
              onClick={handleGoHome}
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md font-bold text-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Quay Về Trang Chủ</span>
            </button>
          </div>
        </div>

        {/* CỘT PHẢI: CON SỐ MÃ LỖI KHỔNG LỒ & THẺ ĐỊA DANH */}
        <div className="relative z-10 flex flex-col items-start lg:items-end justify-between gap-4 select-none shrink-0">
          <div
            className="font-mono font-black text-8xl sm:text-9xl lg:text-[148px] tracking-tighter leading-none text-transparent"
            style={{
              WebkitTextStroke: '2.5px rgba(251, 191, 36, 0.75)',
              filter: 'drop-shadow(0 12px 30px rgba(0, 0, 0, 0.75))',
            }}
          >
            {config.code}
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-black/55 border border-white/15 backdrop-blur-md text-xs text-stone-200 font-medium">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{config.location}</span>
          </div>
        </div>
      </div>

      {/* 2. KHỐI GỢI Ý LỐI TẮT NHANH BÊN DƯỚI (GIỐNG THANH FILTER TRANG CỬA HÀNG) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm font-black text-stone-900">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Gợi ý điểm dừng chân dành cho bạn</span>
          </div>
          <span className="text-xs text-stone-400 font-medium">
            Nông sản cắt giàn hái sớm • Gửi xe khách trong đêm tới TP.HCM
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <button
            type="button"
            onClick={onGoShop || handleGoHome}
            className="group p-4 rounded-2xl bg-[#FAF6F0] hover:bg-amber-50/90 border border-stone-200/80 hover:border-amber-300 text-left transition-all flex items-center justify-between cursor-pointer"
          >
            <div className="space-y-1">
              <div className="font-bold text-sm text-stone-900 group-hover:text-amber-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-700" />
                <span>Đặc sản chính vụ hôm nay</span>
              </div>
              <p className="text-xs text-stone-500">
                Táo gió, nho xanh, mực một nắng, mật nho...
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-amber-700 group-hover:translate-x-1 transition-all shrink-0" />
          </button>

          <button
            type="button"
            onClick={handleGoHome}
            className="group p-4 rounded-2xl bg-[#FAF6F0] hover:bg-amber-50/90 border border-stone-200/80 hover:border-amber-300 text-left transition-all flex items-center justify-between cursor-pointer"
          >
            <div className="space-y-1">
              <div className="font-bold text-sm text-stone-900 group-hover:text-amber-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-700" />
                <span>Lịch mùa vụ & Điểm đến 12 tháng</span>
              </div>
              <p className="text-xs text-stone-500">
                Xem tháng này Phan Rang có thức quà gì ngon
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-amber-700 group-hover:translate-x-1 transition-all shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => {
              window.location.href = '/?page=story';
            }}
            className="group p-4 rounded-2xl bg-[#FAF6F0] hover:bg-amber-50/90 border border-stone-200/80 hover:border-amber-300 text-left transition-all flex items-center justify-between cursor-pointer"
          >
            <div className="space-y-1">
              <div className="font-bold text-sm text-stone-900 group-hover:text-amber-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-stone-700" />
                <span>Tâm sự chuyện vườn & nghề</span>
              </div>
              <p className="text-xs text-stone-500">
                Hành trình nông sản sạch từ Ninh Thuận vào phố
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-amber-700 group-hover:translate-x-1 transition-all shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}