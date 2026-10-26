// src/components/NewProductAnnouncementBar.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { Sparkles, ArrowRight, X } from 'lucide-react';

export default function NewProductAnnouncementBar({ 
  products = [], 
  onNavigateProduct,
  onVisibilityChange,
  daysThreshold = 7 
}) {
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('dismiss_new_product_banner') === 'true';
    } catch {
      return false;
    }
  });

  // State điều khiển animation đóng mượt mà trước khi unmount khỏi DOM
  const [isClosing, setIsClosing] = useState(false);

  // Lọc tất cả sản phẩm mới lên giàn trong `daysThreshold` ngày qua
  const newProductsList = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) return [];

    const now = Date.now();
    const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;

    const validProducts = products.filter((p) => {
      const createdTime = new Date(p.created_at || p.createdAt || 0).getTime();
      const inStock = p.in_stock !== false && p.inStock !== false;
      return inStock && createdTime > 0 && (now - createdTime) <= thresholdMs;
    });

    // Sắp xếp món mới nhất lên đầu
    return validProducts.sort((a, b) => {
      const timeA = new Date(a.created_at || a.createdAt || 0).getTime();
      const timeB = new Date(b.created_at || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [products, daysThreshold]);

  const latestProduct = newProductsList[0] || null;
  const isMultiple = newProductsList.length > 1;
  const isVisible = !isDismissed && Boolean(latestProduct);

  // Báo trạng thái hiển thị ra component cha
  useEffect(() => {
    if (onVisibilityChange) {
      onVisibilityChange(isVisible);
    }
  }, [isVisible, onVisibilityChange]);

  // Đóng banner với animation trượt lên
  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsDismissed(true);
      try {
        sessionStorage.setItem('dismiss_new_product_banner', 'true');
      } catch (e) {
        console.warn(e);
      }
    }, 280); // Khớp thời gian animation 280ms
  };

  // Khi bấm "Xem ngay": Đóng banner và điều hướng
  const handleViewNow = () => {
    handleDismiss();
    if (onNavigateProduct) {
      // Nếu có 1 món thì truyền món đó để nhấp nháy, nếu nhiều món thì truyền cả danh sách
      onNavigateProduct(isMultiple ? newProductsList : latestProduct);
    }
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Thông báo món mới lên kệ"
      className={`w-full overflow-hidden bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-amber-50 px-4 text-xs sm:text-sm font-medium shadow-xs border-b border-amber-950/20 shrink-0 transition-all duration-300 ease-in-out ${
        isClosing 
          ? 'max-h-0 py-0 opacity-0 -translate-y-2' 
          : 'max-h-16 py-2.5 opacity-100 translate-y-0'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Nội dung thông báo */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-center sm:justify-start">
          <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full text-[11px] font-black tracking-wide uppercase shrink-0">
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            <span>Mới lên giàn</span>
          </span>

          <p className="truncate text-stone-100">
            {isMultiple ? (
              <span>
                Vườn vừa mở bán thêm <strong className="text-white font-black">{newProductsList.length} đặc sản mới</strong> tuần này:
              </span>
            ) : (
              <span>
                <span className="hidden sm:inline">Vườn vừa mở bán đặc sản: </span>
                <strong className="text-white font-black">{latestProduct.name}</strong>
              </span>
            )}
          </p>

          <button
            type="button"
            onClick={handleViewNow}
            className="inline-flex items-center gap-1 font-bold text-amber-300 hover:text-white underline underline-offset-2 ml-1 cursor-pointer shrink-0 transition-colors"
          >
            <span>Xem ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Nút X đóng banner */}
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