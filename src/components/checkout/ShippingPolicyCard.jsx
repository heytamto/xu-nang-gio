// src/components/checkout/ShippingPolicyCard.jsx
import React from 'react';
import { HeartHandshake, Sparkles, PackageCheck, ShieldCheck, Headphones, BadgeCheck, Phone } from 'lucide-react';

export default function ShippingPolicyCard({ 
  shouldShowFullPolicy, 
  hotline = '0848.957.345',
  shopConfig = {}
}) {
  const activeHotline = shopConfig?.hotline || hotline;
  const cleanPhone = String(activeHotline).replace(/\D/g, '');
  const announcementText = shopConfig?.announcement || 'Bao ăn từng quả • Đóng thùng xốp dày • Bù hàng trong 24h';

  if (!shouldShowFullPolicy) {
    return (
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-amber-50/90 via-white to-amber-50/50 rounded-2xl border border-amber-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm animate-fadeIn font-sans text-stone-800">
        <span className="flex items-center gap-2 font-bold text-amber-950 text-xs sm:text-sm min-w-0">
          <BadgeCheck className="w-5 h-5 text-amber-700 shrink-0" />
          <span className="truncate">{announcementText}</span>
        </span>
        <a
          href={`tel:${cleanPhone}`}
          className="text-xs sm:text-sm font-mono font-bold text-amber-950 bg-amber-100 hover:bg-amber-200/90 px-3 py-1.5 rounded-xl shrink-0 flex items-center gap-1.5 transition-colors border border-amber-300/60 shadow-2xs"
        >
          <Phone className="w-3.5 h-3.5 text-amber-700" />
          <span>Hotline: {activeHotline}</span>
        </a>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50/70 via-stone-50 to-emerald-50/40 rounded-3xl p-5 sm:p-6 border border-amber-200/80 shadow-2xs space-y-4 animate-fadeIn font-sans text-stone-800">
      <div className="flex items-center justify-between border-b border-amber-200/60 pb-3 flex-wrap gap-2">
        <span className="text-sm sm:text-base font-black text-amber-950 uppercase tracking-wide flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-amber-700" />
          <span>Chính Sách Giao Hàng & Bảo Vệ Khách Hàng</span>
        </span>
        <span className="text-xs font-bold text-emerald-900 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-300 flex items-center gap-1.5 shadow-2xs shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          <span>Bao ăn từng quả</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
        <div className="bg-white/95 p-4 rounded-2xl border border-stone-200/90 space-y-1.5 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold mb-1">
            <PackageCheck className="w-4 h-4" />
          </div>
          <strong className="block text-xs sm:text-sm text-stone-900 font-bold">Đóng thùng xốp dày</strong>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
            Lưới xốp từng chùm, chèn vụn chống dập khi xe chạy.
          </p>
        </div>

        <div className="bg-white/95 p-4 rounded-2xl border border-stone-200/90 space-y-1.5 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-1">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <strong className="block text-xs sm:text-sm text-stone-900 font-bold">Bao ăn - Bao dập</strong>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
            Quả dập úng, vườn gửi bù ngay hoặc hoàn tiền 24h.
          </p>
        </div>

        <div className="bg-white/95 p-4 rounded-2xl border border-stone-200/90 space-y-1.5 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold mb-1">
            <Headphones className="w-4 h-4" />
          </div>
          <strong className="block text-xs sm:text-sm text-stone-900 font-bold">Báo giờ xe đến</strong>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
            Thông báo biển số xe và giờ xe tới để bạn đón hàng.
          </p>
        </div>
      </div>
    </div>
  );
}