// src/components/common/CartCenterSplash.jsx
import React from 'react';
import { ShoppingBag } from 'lucide-react';

export default function CartCenterSplash({ splash }) {
  if (!splash) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
      <div className="animate-center-splash flex flex-col items-center justify-center p-6 sm:p-7 rounded-3xl bg-stone-900/95 text-white shadow-2xl backdrop-blur-md border border-amber-500/40 text-center will-change-transform">
        <div className="relative">
          {splash.image ? (
            <img 
              src={splash.image} 
              alt="Đặc sản" 
              className="w-40 h-40 sm:w-44 sm:h-44 rounded-2xl object-cover border-2 border-amber-400 shadow-xl" 
            />
          ) : (
            <div className="w-40 h-40 sm:w-44 sm:h-44 rounded-2xl bg-amber-600 flex items-center justify-center shadow-xl">
              <ShoppingBag className="w-16 h-16 text-white stroke-[2]" />
            </div>
          )}

          <span className="absolute -top-3 -right-3 bg-amber-500 text-stone-950 font-black text-base px-3 py-1 rounded-full border-2 border-stone-900 shadow-md font-mono">
            x{splash.totalQuantity}
          </span>
        </div>

        <div className="mt-4 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2 text-amber-400 font-black text-sm sm:text-base">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Đã thêm (+{splash.addedQuantity})</span>
          </div>
          <span className="text-xs sm:text-sm text-stone-300 font-medium">
            Trong giỏ đang có: <strong className="text-white font-mono font-black">{splash.totalQuantity}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}