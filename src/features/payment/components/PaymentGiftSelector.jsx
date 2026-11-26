// src/components/checkout/PaymentGiftSelector.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Gift, Check } from 'lucide-react';

export default function PaymentGiftSelector({ 
  paymentGifts = [], 
  selectedGiftId, 
  onSelectGift,
  isEnabled = true 
}) {
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({
    startX: 0,
    scrollLeft: 0,
    hasMoved: false,
  });

  // 1. Hook useMemo: Lọc chuẩn các món quà thanh toán khả dụng (type === 'payment_reward' & đang bật)
  const activeGifts = useMemo(() => {
    if (!Array.isArray(paymentGifts)) return [];
    return paymentGifts.filter((g) => {
      const matchType = !g.type || g.type === 'payment_reward' || g.type === 'payment';
      const isAvailable = g.is_active !== false && g.inStock !== false && g.active !== false;
      return matchType && isAvailable;
    });
  }, [paymentGifts]);

  // 2. Hook useEffect: Tự động chọn món quà đầu tiên nếu chưa chọn hoặc quà hiện tại bị tắt
  useEffect(() => {
    if (isEnabled && activeGifts.length > 0 && onSelectGift) {
      const isCurrentSelectionValid = activeGifts.some((g) => g.id === selectedGiftId);
      if (!selectedGiftId || !isCurrentSelectionValid) {
        onSelectGift(activeGifts[0].id);
      }
    }
  }, [isEnabled, activeGifts, selectedGiftId, onSelectGift]);

  // 3. Xử lý lăn chuột (Mouse Wheel) cuộn ngang mượt mà
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 0.9;
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // 4. Kéo thả bằng chuột trên máy tính (Mouse Drag to Scroll)
  const handleMouseDown = useCallback((e) => {
    const el = scrollRef.current;
    if (!el) return;

    setIsDragging(true);
    dragState.current = {
      startX: e.pageX - el.offsetLeft,
      scrollLeft: el.scrollLeft,
      hasMoved: false,
    };
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const el = scrollRef.current;
    if (!el) return;

    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragState.current.startX) * 1.3;
    if (Math.abs(walk) > 4) {
      dragState.current.hasMoved = true;
    }
    el.scrollLeft = dragState.current.scrollLeft - walk;
  }, [isDragging]);

  const handleMouseUpOrLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleCardClick = (giftId) => {
    if (dragState.current.hasMoved) return;
    if (onSelectGift) onSelectGift(giftId);
  };

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

      {/* Danh sách thẻ quà: cuộn ngang, ẩn thanh cuộn, kéo thả mượt mà */}
      <div 
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`flex items-stretch gap-3 overflow-x-auto pb-2 pt-1 select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {activeGifts.map((gift) => {
          const isSelected = selectedGiftId === gift.id;
          const giftImage = gift.image_url || gift.image;

          return (
            <div
              key={gift.id}
              onClick={() => handleCardClick(gift.id)}
              className={`min-w-[250px] sm:min-w-[270px] max-w-[280px] p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 shrink-0 select-none cursor-pointer ${
                isSelected
                  ? 'bg-white border-amber-600 ring-2 ring-amber-600/25 shadow-sm'
                  : 'bg-white/85 border-amber-200/80 hover:bg-white hover:border-amber-400'
              }`}
            >
              <div className="space-y-2 pointer-events-none">
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

                <div className="flex items-center gap-3">
                  {giftImage && (
                    <img 
                      src={giftImage} 
                      alt={gift.title || gift.name} 
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-stone-200 bg-stone-100"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <strong className="font-bold text-sm sm:text-base leading-snug line-clamp-2 text-stone-900">
                    {gift.title || gift.name}
                  </strong>
                </div>
              </div>

              <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed font-normal pointer-events-none">
                {gift.description || gift.desc || 'Gửi kèm thùng xốp hái tươi'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}