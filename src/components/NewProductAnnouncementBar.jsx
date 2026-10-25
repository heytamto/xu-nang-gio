// src/components/NewProductAnnouncementBar.jsx
import React, { useState, useMemo } from 'react';
import { Sparkles, ArrowRight, X } from 'lucide-react';

export default function NewProductAnnouncementBar({ 
  products = [], 
  onNavigateProduct,
  daysThreshold = 7 
}) {
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('dismiss_new_product_banner') === 'true';
    } catch {
      return false;
    }
  });

  // Tìm món mới nhất được tạo trong vòng `daysThreshold` ngày qua
  const latestNewProduct = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) return null;

    const now = Date.now();
    const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;

    // Lọc các món còn hàng và có ngày tạo hợp lệ
    const validProducts = products.filter((p) => {
      const createdTime = new Date(p.created_at || p.createdAt || 0).getTime();
      return createdTime > 0 && (now - createdTime) <= thresholdMs;
    });

    if (validProducts.length === 0) return null;

    // Sắp xếp lấy món mới nhất lên đầu
    validProducts.sort((a, b) => {
      const timeA = new Date(a.created_at || a.createdAt || 0).getTime();
      const timeB = new Date(b.created_at || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return validProducts[0];
  }, [products, daysThreshold]);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('dismiss_new_product_banner', 'true');
    } catch (e) {
      console.warn(e);
    }
  };

  // Không hiển thị nếu khách đã tắt hoặc không có món mới
  if (isDismissed || !latestNewProduct) return null;

  return (
    <aside
      aria-label="Thông báo món mới lên kệ"
      className="relative z-50 bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-amber-50 px-4 py-2.5 text-xs sm:text-sm font-medium shadow-xs transition-all border-b border-amber-950/20"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Nội dung thông báo */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-center sm:justify-start">
          <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full text-[11px] font-black tracking-wide uppercase shrink-0">
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            <span>Mới lên giàn</span>
          </span>

          <p className="truncate text-stone-100">
            <span className="hidden sm:inline">Vườn vừa mở bán đặc sản: </span>
            <strong className="text-white font-black">{latestNewProduct.name}</strong>
          </p>

          <button
            type="button"
            onClick={() => onNavigateProduct && onNavigateProduct(latestNewProduct)}
            className="inline-flex items-center gap-1 font-bold text-amber-300 hover:text-white underline underline-offset-2 ml-1 cursor-pointer shrink-0 transition-colors"
          >
            <span>Xem ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Nút đóng banner */}
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-lg text-amber-200/80 hover:text-white hover:bg-black/20 transition-colors cursor-pointer shrink-0 active:scale-95"
          title="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}