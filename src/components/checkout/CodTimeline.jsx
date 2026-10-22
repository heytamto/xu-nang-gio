// src/components/checkout/CodTimeline.jsx
import React from 'react';

export default function CodTimeline({ finalTotalAmount = 0 }) {
  const safeTotal = Number(finalTotalAmount) || 0;

  return (
    <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-3.5 animate-fadeIn">
      <div className="flex items-center justify-between border-b border-stone-100 pb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-black text-stone-900 uppercase tracking-wide">
            Quy Trình Giao Xe Thu COD
          </span>
        </div>
        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          Trả sau 100%
        </span>
      </div>

      <div className="relative pl-5 space-y-3 text-xs before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
        <div className="relative">
          <span className="absolute -left-5 top-0.5 w-4 h-4 rounded-full bg-amber-500 text-white font-bold text-[9px] flex items-center justify-center ring-2 ring-white">
            1
          </span>
          <div>
            <strong className="text-stone-900 font-bold block text-[11px]">Vườn chốt giờ xe</strong>
            <p className="text-[10px] text-stone-500 leading-tight mt-0.5">
              Gọi thông báo biển số xe và giờ xe tới điểm đón.
            </p>
          </div>
        </div>

        <div className="relative">
          <span className="absolute -left-5 top-0.5 w-4 h-4 rounded-full bg-amber-600 text-white font-bold text-[9px] flex items-center justify-center ring-2 ring-white">
            2
          </span>
          <div>
            <div className="flex items-center justify-between">
              <strong className="text-stone-900 font-bold text-[11px]">Đóng thùng xốp dán tem COD</strong>
              <span className="text-[10px] text-amber-700 font-mono font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                {safeTotal.toLocaleString('vi-VN')}đ
              </span>
            </div>
            <p className="text-[10px] text-stone-500 leading-tight mt-0.5">
              Thùng niêm phong ghi đúng tiền thu hộ, không phụ phí.
            </p>
          </div>
        </div>

        <div className="relative">
          <span className="absolute -left-5 top-0.5 w-4 h-4 rounded-full bg-emerald-600 text-white font-bold text-[9px] flex items-center justify-center ring-2 ring-white">
            3
          </span>
          <div>
            <strong className="text-stone-900 font-bold block text-[11px]">Kiểm tra thùng & nhận hàng</strong>
            <p className="text-[10px] text-stone-500 leading-tight mt-0.5">
              Nhận thùng nguyên vẹn từ tài xế rồi thanh toán tiền mặt.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}