// src/components/shop/ShopShippingBanner.jsx
import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function ShopShippingBanner({ onNavigateStory }) {
  return (
    <section className="bg-amber-50/80 rounded-3xl p-6 sm:p-8 border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-5">
      <div className="space-y-1.5 text-center sm:text-left">
        <h4 className="font-bold text-base sm:text-lg text-amber-950 flex items-center justify-center sm:justify-start gap-2">
          <Sparkles className="w-5 h-5 text-amber-700" />
          <span>Đơn Hàng Gửi Xe Vào Sài Gòn & Các Tỉnh</span>
        </h4>
        <p className="text-sm text-amber-900/90 leading-relaxed font-normal max-w-2xl">
          Nông sản tươi được chèn giấy rơm và bọc thùng xốp chuyên dụng, gửi xe khách trong đêm để sáng sớm hôm sau tới nơi vẫn giữ nguyên độ tươi giòn.
        </p>
      </div>

      {onNavigateStory && (
        <button
          type="button"
          onClick={onNavigateStory}
          className="px-5 py-3 rounded-2xl bg-amber-900 hover:bg-amber-800 text-white text-sm font-bold shrink-0 transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-2"
        >
          <span>Đọc chuyện mùa vụ</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </section>
  );
}