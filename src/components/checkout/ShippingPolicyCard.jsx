// src/components/checkout/ShippingPolicyCard.jsx
import React from 'react';
import { HeartHandshake, Sparkles, PackageCheck, ShieldCheck, Headphones, BadgeCheck } from 'lucide-react';

export default function ShippingPolicyCard({ shouldShowFullPolicy, hotline = '0848.957.345' }) {
  if (!shouldShowFullPolicy) {
    return (
      <div className="p-3 bg-gradient-to-r from-amber-50/90 via-white to-amber-50/50 rounded-2xl border border-amber-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs animate-fadeIn font-sans">
        <span className="flex items-center gap-1.5 font-bold text-amber-950 text-xs min-w-0">
          <BadgeCheck className="w-4 h-4 text-amber-700 shrink-0" />
          <span className="truncate">Bao ăn từng quả • Đóng thùng xốp dày • Bù hàng trong 24h</span>
        </span>
        <span className="text-[10.5px] font-mono font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md shrink-0">
          Hotline: {hotline}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50/70 via-stone-50 to-emerald-50/40 rounded-3xl p-4 sm:p-5 border border-amber-200/70 shadow-2xs space-y-3 animate-fadeIn font-sans">
      <div className="flex items-center justify-between border-b border-amber-200/50 pb-2">
        <span className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
          <HeartHandshake className="w-4 h-4 text-amber-700" />
          <span>Chính Sách Giao Hàng & Bảo Vệ Khách Hàng</span>
        </span>
        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5" />
          <span>Bao ăn từng quả</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="bg-white/90 p-3 rounded-2xl border border-stone-200/80 space-y-1 shadow-2xs">
          <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold mb-1">
            <PackageCheck className="w-3.5 h-3.5" />
          </div>
          <strong className="block text-[11px] text-stone-900 font-bold">Đóng thùng xốp dày</strong>
          <p className="text-[10px] text-stone-500 leading-relaxed">
            Lưới xốp từng chùm, chèn vụn chống dập khi xe chạy.
          </p>
        </div>

        <div className="bg-white/90 p-3 rounded-2xl border border-stone-200/80 space-y-1 shadow-2xs">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <strong className="block text-[11px] text-stone-900 font-bold">Bao ăn - Bao dập</strong>
          <p className="text-[10px] text-stone-500 leading-relaxed">
            Quả dập úng, vườn gửi bù ngay hoặc hoàn tiền 24h.
          </p>
        </div>

        <div className="bg-white/90 p-3 rounded-2xl border border-stone-200/80 space-y-1 shadow-2xs">
          <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold mb-1">
            <Headphones className="w-3.5 h-3.5" />
          </div>
          <strong className="block text-[11px] text-stone-900 font-bold">Báo giờ xe đến</strong>
          <p className="text-[10px] text-stone-500 leading-relaxed">
            Thông báo biển số xe và giờ xe tới để bạn đón hàng.
          </p>
        </div>
      </div>
    </div>
  );
}