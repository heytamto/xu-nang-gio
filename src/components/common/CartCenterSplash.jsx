// src/components/common/CartCenterSplash.jsx
import React from 'react';
import { ShoppingBag } from 'lucide-react';

export default function CartCenterSplash({ splash }) {
  if (!splash) return null;

  return (
    <div 
      key={splash.id} 
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4"
    >
      {/* Khung giỏ chính */}
      <div className="animate-center-splash flex flex-col items-center justify-center p-5 sm:p-6 rounded-3xl bg-stone-900/95 text-white shadow-2xl backdrop-blur-md border border-amber-500/40 text-center will-change-transform">
        <div className="relative">
          {/* Món hàng rơi vào giỏ */}
          <div className="animate-item-drop">
            {splash.image ? (
              <img 
                src={splash.image} 
                alt={splash.productName || "Đặc sản"} 
                className="w-36 h-36 sm:w-40 sm:h-40 rounded-2xl object-cover border-2 border-amber-400 shadow-xl" 
              />
            ) : (
              <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-2xl bg-amber-600 flex items-center justify-center shadow-xl">
                <ShoppingBag className="w-14 h-14 text-white stroke-[2]" />
              </div>
            )}
          </div>

          {/* Badge góc: Hiện chính xác TỔNG SỐ LƯỢNG (VD: x29) thay vì +1 vô nghĩa */}
          <span className="animate-badge-pop absolute -top-3 -right-3 bg-amber-500 text-stone-950 font-black text-sm sm:text-base px-3 py-1 rounded-full border-2 border-stone-900 shadow-md font-mono">
            x{splash.totalQuantity}
          </span>
        </div>

        {/* Thông tin xác nhận */}
        <div className="mt-4 flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 text-amber-400 font-black text-sm sm:text-base">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Đã vào giỏ mây</span>
          </div>
          <span className="text-xs sm:text-sm text-stone-300 font-medium">
            Trong giỏ đang có: <strong className="text-white font-mono font-black">{splash.totalQuantity} món</strong>
          </span>
        </div>
      </div>
    </div>
  );
}