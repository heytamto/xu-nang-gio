// src/components/checkout/PaymentGiftSelector.jsx
import React, { useEffect } from 'react';
import { Gift, Check } from 'lucide-react';

export default function PaymentGiftSelector({ paymentGifts = [], selectedGiftId, onSelectGift }) {
  // Tự động chọn trước phần quà đầu tiên nếu chưa chọn hoặc ID đang chọn không hợp lệ
  useEffect(() => {
    if (paymentGifts.length > 0 && onSelectGift) {
      const isValidSelection = paymentGifts.some((g) => g.id === selectedGiftId);
      if (!selectedGiftId || !isValidSelection) {
        onSelectGift(paymentGifts[0].id);
      }
    }
  }, [paymentGifts, selectedGiftId, onSelectGift]);

  if (paymentGifts.length === 0) return null;

  return (
    <div className="bg-amber-50/80 rounded-3xl p-4 sm:p-5 border border-amber-200/80 space-y-3 animate-fadeIn font-sans">
      <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-amber-700 shrink-0" />
          <span className="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-wide">
            Chọn Quà Quê Tặng Kèm (Ưu Đãi Chuyển Khoản)
          </span>
        </div>
        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
          Miễn phí 100%
        </span>
      </div>

      <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1.5 pt-0.5 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:thin]">
        {paymentGifts.map((gift) => {
          const isSelected = selectedGiftId === gift.id;
          return (
            <div
              key={gift.id}
              onClick={() => onSelectGift(gift.id)}
              className={`min-w-[210px] sm:min-w-[230px] max-w-[240px] p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 snap-start shrink-0 select-none ${
                isSelected
                  ? 'bg-white border-amber-600 ring-2 ring-amber-600/20 shadow-sm'
                  : 'bg-white/80 border-amber-200/70 hover:bg-white hover:border-amber-400'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[9.5px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                    {gift.tag || 'Quà Quê'}
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                      isSelected ? 'bg-amber-600 border-amber-600 text-white' : 'border-stone-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>

                <strong className="font-bold text-xs text-stone-900 block leading-snug line-clamp-2">
                  {gift.title || gift.name}
                </strong>
              </div>

              <p className="text-[10px] text-stone-500 line-clamp-1 leading-tight">
                {gift.description || gift.desc || 'Gửi kèm thùng xốp hái tươi'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}