// src/components/checkout/CodTimeline.jsx
import React from 'react';
import { PhoneCall, PackageCheck, Truck } from 'lucide-react';

export default function CodTimeline({ finalTotalAmount = 0 }) {
  const safeTotal = Number(finalTotalAmount) || 0;

  return (
    <div className="p-4 sm:p-5 bg-white rounded-3xl border border-stone-200/90 shadow-2xs space-y-4 animate-fadeIn font-sans text-stone-800">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs sm:text-sm font-black text-stone-900 uppercase tracking-wide">
            Quy Trình Giao Xe Thu COD
          </span>
        </div>
        <span className="text-xs font-bold text-emerald-900 bg-emerald-100/90 border border-emerald-300 px-3 py-1 rounded-full shadow-2xs">
          Trả sau 100%
        </span>
      </div>

      <div className="relative pl-7 space-y-4 text-xs sm:text-sm before:absolute before:left-3.5 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-stone-200">
        {/* Bước 1 */}
        <div className="relative">
          <span className="absolute -left-7 top-0.5 w-7 h-7 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center ring-4 ring-white shadow-2xs">
            <PhoneCall className="w-3.5 h-3.5" />
          </span>
          <div className="pl-2 space-y-0.5">
            <strong className="text-stone-900 font-bold block text-sm">Vườn chốt giờ xe</strong>
            <p className="text-xs text-stone-600 leading-relaxed font-normal">
              Gọi xác nhận đơn, thông báo biển số xe và giờ xe tới điểm đón.
            </p>
          </div>
        </div>

        {/* Bước 2 */}
        <div className="relative">
          <span className="absolute -left-7 top-0.5 w-7 h-7 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center ring-4 ring-white shadow-2xs">
            <PackageCheck className="w-3.5 h-3.5" />
          </span>
          <div className="pl-2 space-y-0.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <strong className="text-stone-900 font-bold text-sm">Đóng thùng xốp dán tem COD</strong>
              <span className="text-xs sm:text-sm text-amber-950 font-mono font-black bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300 shrink-0">
                {safeTotal > 0 ? `${safeTotal.toLocaleString('vi-VN')}đ` : 'Thu đủ 100%'}
              </span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed font-normal">
              Thùng niêm phong ghi đúng tiền thu hộ, chuẩn giá vườn, không phát sinh phụ phí.
            </p>
          </div>
        </div>

        {/* Bước 3 */}
        <div className="relative">
          <span className="absolute -left-7 top-0.5 w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center ring-4 ring-white shadow-2xs">
            <Truck className="w-3.5 h-3.5" />
          </span>
          <div className="pl-2 space-y-0.5">
            <strong className="text-stone-900 font-bold text-sm">Kiểm tra thùng & nhận hàng</strong>
            <p className="text-xs text-stone-600 leading-relaxed font-normal">
              Nhận thùng nguyên vẹn từ tài xế rồi thanh toán tiền mặt.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}