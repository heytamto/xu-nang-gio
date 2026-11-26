// src/components/checkout/PaymentGiftSelector.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Gift, Check } from 'lucide-react';

function GiftImage({ src, title }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden bg-amber-50 border border-amber-100 flex items-center justify-center">
      {src && !failed ? (
        <img
          src={src}
          alt={title || 'Quà tặng thanh toán'}
          className="w-full h-full object-contain p-1"
          draggable={false}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <Gift aria-hidden="true" className="w-6 h-6 text-amber-400" />
      )}
    </div>
  );
}

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
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0 || (e.deltaY < 0 && el.scrollLeft <= 0) || (e.deltaY > 0 && el.scrollLeft >= max - 1)) return;
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
    <div className="bg-amber-50/80 rounded-3xl p-3 sm:p-4 border border-amber-200/90 space-y-2.5 animate-fadeIn font-sans text-stone-800">
      <div className="flex items-center justify-between border-b border-amber-200/70 pb-2 flex-wrap gap-2">
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
        className={`flex items-stretch gap-2 overflow-x-auto pb-1 pt-1 select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {activeGifts.map((gift) => {
          const isSelected = selectedGiftId === gift.id;
          const giftImage = gift.image_url || gift.image || '';
          const giftTitle = gift.title || gift.name || 'Quà tặng';

          return (
            <button
              type="button"
              key={gift.id}
              aria-pressed={isSelected}
              onClick={(event) => {
                if (event.detail === 0) onSelectGift?.(gift.id);
                else handleCardClick(gift.id);
              }}
              className={`w-[min(100%,240px)] sm:w-[260px] p-2.5 text-left focus-visible:outline-2 focus-visible:outline-amber-600 rounded-2xl border transition-all flex items-center gap-2.5 shrink-0 select-none cursor-pointer ${
                isSelected
                  ? 'bg-white border-amber-600 ring-2 ring-amber-600/25 shadow-sm'
                  : 'bg-white/85 border-amber-200/80 hover:bg-white hover:border-amber-400'
              }`}
            >
              <GiftImage key={`${gift.id}:${giftImage}`} src={giftImage} title={giftTitle} />
              <div className="min-w-0 flex-1 space-y-1 pointer-events-none">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg truncate max-w-full min-w-0 bg-amber-100 text-amber-900">
                    {gift.tag || 'Quà Quê'}
                  </span>

                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                      isSelected
                        ? 'bg-amber-600 border-amber-600 text-white'
                        : 'border-stone-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <strong className="block font-bold text-xs sm:text-sm leading-snug line-clamp-2 text-stone-900">
                  {giftTitle}
                </strong>
                <p className="text-xs text-stone-600 line-clamp-2 leading-snug font-normal">
                {gift.description || gift.desc || 'Gửi kèm thùng xốp hái tươi'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}