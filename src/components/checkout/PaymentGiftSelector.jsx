// src/components/checkout/PaymentGiftSelector.jsx
import React, { useEffect, useMemo } from 'react';
import { Gift, Check } from 'lucide-react';

export default function PaymentGiftSelector({ 
  paymentGifts = [], 
  selectedGiftId, 
  onSelectGift,
  isEnabled = true 
}) {
  // 1. Hook useMemo: Luôn chạy đầu tiên
  const activeGifts = useMemo(() => {
    if (!Array.isArray(paymentGifts)) return [];
    return paymentGifts.filter((g) => {
      return g.is_active !== false && g.inStock !== false && g.active !== false;
    });
  }, [paymentGifts]);

  // 2. Hook useEffect: Luôn chạy thứ hai
  useEffect(() => {
    if (isEnabled && activeGifts.length > 0 && onSelectGift) {
      const isCurrentSelectionValid = activeGifts.some((g) => g.id === selectedGiftId);
      if (!selectedGiftId || !isCurrentSelectionValid) {
        onSelectGift(activeGifts[0].id);
      }
    }
  }, [isEnabled, activeGifts, selectedGiftId, onSelectGift]);

  // 3. Kiểm tra điều kiện render
  if (!isEnabled || activeGifts.length === 0) {
    return null;
  }

  return (
    <div className="bg-amber-50/80 rounded-3xl p-5 sm:p-6 border border-amber-200/90 space-y-3.5 animate-fadeIn font-sans text-stone-800">
      <div className="flex items-center justify-between border-b border-amber-200/70 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <Gift className="w-5 h-5 text-amber-700 shrink-0" />
          <span className="text-sm sm:text-base font-black text-amber-950 uppercase tracking-wide">
            Chọn Quà Quê Tặng Kèm (Ưu Đãi Chuyển Khoản)
          </span>
        </div>
        <span className="text-xs font-bold text-emerald-900 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-300 shadow-2xs shrink-0">
          Miễn phí 100%
        </span>
      </div>

      <div className="flex items-stretch gap-3 overflow-x-auto pb-2 pt-1 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:thin]">
        {activeGifts.map((gift) => {
          const isSelected = selectedGiftId === gift.id;

          return (
            <div
              key={gift.id}
              onClick={() => onSelectGift && onSelectGift(gift.id)}
              className={`min-w-[240px] sm:min-w-[260px] max-w-[270px] p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 snap-start shrink-0 select-none cursor-pointer ${
                isSelected
                  ? 'bg-white border-amber-600 ring-2 ring-amber-600/25 shadow-sm'
                  : 'bg-white/85 border-amber-200/80 hover:bg-white hover:border-amber-400'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg truncate max-w-[160px] bg-amber-100 text-amber-900">
                    {gift.tag || 'Quà Quê'}
                  </span>

                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                      isSelected
                        ? 'bg-amber-600 border-amber-600 text-white'
                        : 'border-stone-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <strong className="font-bold text-sm sm:text-base block leading-snug line-clamp-2 text-stone-900">
                  {gift.title || gift.name}
                </strong>
              </div>

              <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed font-normal">
                {gift.description || gift.desc || 'Gửi kèm thùng xốp hái tươi'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}