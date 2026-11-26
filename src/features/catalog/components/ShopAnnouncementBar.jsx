// src/components/ShopAnnouncementBar.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { Sprout, AlertCircle, ArrowRight, X } from 'lucide-react';

export default function ShopAnnouncementBar({ 
  products = [], 
  removedItemsNotice = null,
  onClearRemovedNotice,
  onNavigateProduct,
  onVisibilityChange,
  daysThreshold = 7 
}) {
  const [isClosing, setIsClosing] = useState(false);

  // 1. Lọc sản phẩm mới thu hái trong 7 ngày
  const newProductsList = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) return [];

    const now = Date.now();
    const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;

    const validProducts = products.filter((p) => {
      // Nếu sản phẩm không có created_at, fallback lấy thời gian hiện tại
      const rawDate = p.created_at || p.createdAt;
      const createdTime = rawDate ? new Date(rawDate).getTime() : now;
      const inStock = p.in_stock !== false && p.inStock !== false;

      return inStock && (now - createdTime) <= thresholdMs;
    });

    return validProducts.sort((a, b) => {
      const timeA = new Date(a.created_at || a.createdAt || 0).getTime();
      const timeB = new Date(b.created_at || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [products, daysThreshold]);

  const latestProduct = newProductsList[0] || null;
  const isMultiple = newProductsList.length > 1;

  // 2. Kiểm tra xem món mới nhất này đã bị bấm tắt chưa
  const [dismissedId, setDismissedId] = useState(() => {
    try {
      return sessionStorage.getItem('dismiss_new_product_id') || '';
    } catch {
      return '';
    }
  });

  const isNewProductDismissed = latestProduct && String(latestProduct.id) === String(dismissedId);
  const hasRemovedNotice = Array.isArray(removedItemsNotice) && removedItemsNotice.length > 0;
  
  // Banner hiển thị khi có thông báo gỡ món HOẶC có món mới chưa bị bấm tắt
  const isVisible = hasRemovedNotice || (!isNewProductDismissed && Boolean(latestProduct));

  useEffect(() => {
    if (onVisibilityChange) {
      onVisibilityChange(isVisible);
    }
  }, [isVisible, onVisibilityChange]);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      if (hasRemovedNotice) {
        if (onClearRemovedNotice) onClearRemovedNotice();
      } else if (latestProduct) {
        setDismissedId(String(latestProduct.id));
        try {
          sessionStorage.setItem('dismiss_new_product_id', String(latestProduct.id));
        } catch (e) {
          console.warn(e);
        }
      }
      setIsClosing(false);
    }, 250);
  };

  const handleViewNow = () => {
    handleDismiss();
    if (onNavigateProduct) {
      onNavigateProduct(isMultiple ? newProductsList : latestProduct);
    }
  };

  if (!isVisible) return null;

  return (
    <aside
      role="alert"
      className={`w-full overflow-hidden border-b transition-all duration-300 ease-out font-sans ${
        hasRemovedNotice
          ? 'bg-amber-50/95 border-amber-200/80 text-amber-950'
          : 'bg-stone-900 border-stone-800 text-stone-100'
      } ${
        isClosing 
          ? 'max-h-0 py-0 opacity-0 -translate-y-2' 
          : 'max-h-16 py-2.5 opacity-100 translate-y-0'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 text-xs sm:text-sm">
        {hasRemovedNotice ? (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="p-1 rounded-lg bg-amber-200/60 text-amber-900 shrink-0">
              <AlertCircle className="w-4 h-4 text-amber-800" />
            </span>
            <p className="truncate text-stone-800 font-medium">
              Vườn đã tự động bỏ món{' '}
              <strong className="font-bold text-amber-900">
                "{removedItemsNotice.join(', ')}"
              </strong>{' '}
              khỏi giỏ hàng do vườn vừa thu dọn hết lứa này.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-center sm:justify-start">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-800 text-amber-300 text-[11px] font-bold border border-amber-400/20 shrink-0">
              <Sprout className="w-3.5 h-3.5 text-amber-400" />
              <span>Mới thu hái</span>
            </span>

            <p className="truncate text-stone-200 font-normal">
              {isMultiple ? (
                <span>
                  Vườn vừa mở bán thêm <strong className="text-white font-semibold">{newProductsList.length} đặc sản tươi</strong>:
                </span>
              ) : (
                <span>
                  Đặc sản chính vụ vừa lên kệ: <strong className="text-white font-semibold">{latestProduct.name}</strong>
                </span>
              )}
            </p>

            <button
              type="button"
              onClick={handleViewNow}
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-white underline underline-offset-4 ml-1 cursor-pointer shrink-0 transition-colors"
            >
              <span>Xem giàn quả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleDismiss}
          className={`p-1 rounded-xl transition-colors cursor-pointer shrink-0 ${
            hasRemovedNotice
              ? 'text-amber-800/70 hover:text-amber-950 hover:bg-amber-100'
              : 'text-stone-400 hover:text-stone-100 hover:bg-stone-800'
          }`}
          title="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}