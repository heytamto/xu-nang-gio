import React from 'react';
import { ShoppingBag } from 'lucide-react';

export default function OrderItemsList({ cart = [], totalAmount = 0 }) {
  return (
    <div className="bg-stone-50/90 rounded-3xl p-4 sm:p-5 border border-stone-200/80 space-y-3.5">
      <div className="flex items-center justify-between border-b border-stone-200/70 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[11px] font-black shadow-2xs">
            1
          </span>
          <h3 className="text-xs sm:text-sm font-black text-stone-900 uppercase tracking-wide flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-amber-700" />
            <span>Danh Sách Món Đã Chọn ({cart.length} món)</span>
          </h3>
        </div>
        <span className="text-xs font-bold text-amber-900 font-mono">
          Tạm tính: {totalAmount.toLocaleString('vi-VN')}đ
        </span>
      </div>

      <div className="divide-y divide-stone-200/70 max-h-60 sm:max-h-72 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
        {cart.map((item) => (
          <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-11 h-11 rounded-xl object-cover shrink-0 border border-stone-200/80 shadow-2xs"
                />
              )}
              <div className="min-w-0 flex-1">
                <span className="font-bold text-stone-900 block leading-snug truncate">{item.name}</span>
                <span className="text-[11px] text-stone-500 block mt-0.5">
                  Quy cách: <strong className="text-stone-700">{item.weightLabel || 'Tiêu chuẩn'}</strong>
                  {item.flavor ? ` • ${item.flavor}` : ''} | SL: <strong className="text-amber-800 font-mono font-bold">x{item.quantity}</strong>
                </span>
              </div>
            </div>
            <span className="font-mono font-black text-stone-900 whitespace-nowrap text-sm pl-2">
              {((item.price || 0) * (item.quantity || 1)).toLocaleString('vi-VN')}đ
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}