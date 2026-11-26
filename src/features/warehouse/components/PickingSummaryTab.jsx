// src/components/packing/PickingSummaryTab.jsx
import React from 'react';
import { Gift, Check, RotateCcw } from 'lucide-react';

export default function PickingSummaryTab({
  pickingSummary = [],
  pickedItems = {},
  onTogglePickedItem,
  onResetTicks
}) {
  const completedPickingCount = pickingSummary.filter((it) => pickedItems[it.key]).length;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-xs space-y-5">
      <div className="flex flex-wrap items-center justify-between border-b border-stone-100 pb-4 gap-2">
        <div>
          <h3 className="text-base sm:text-lg font-black text-stone-900">Nông Sản & Quà Tặng Cần Gom</h3>
          <p className="text-xs sm:text-sm text-stone-500 font-normal">
            Bấm vào món để đánh dấu đã gom đủ số lượng ngoài giàn / trong kho
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl">
            Đã gom: {completedPickingCount}/{pickingSummary.length} món
          </span>
          {completedPickingCount > 0 && (
            <button
              type="button"
              onClick={onResetTicks}
              className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Bỏ chọn tất cả"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {pickingSummary.length === 0 ? (
        <p className="text-sm text-stone-500 py-12 text-center italic">Hiện không có đơn nào cần chuẩn bị hàng.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {pickingSummary.map((item) => {
            const isPicked = !!pickedItems[item.key];

            return (
              <div 
                key={item.key} 
                onClick={() => onTogglePickedItem(item.key)}
                className={`p-4 rounded-2xl border flex items-center justify-between shadow-2xs cursor-pointer select-none active:scale-[0.98] ${
                  isPicked 
                    ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-300' 
                    : item.isGift 
                      ? 'bg-amber-50/80 border-amber-300 hover:border-amber-400' 
                      : 'bg-stone-50 border-stone-200/80 hover:border-stone-300'
                }`}
              >
                <div className="flex items-start gap-3 pr-2 min-w-0">
                  <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                    isPicked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-300 bg-white'
                  }`}>
                    {isPicked && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <span className={`font-bold text-sm sm:text-base block leading-snug line-clamp-2 ${
                      isPicked 
                        ? 'text-emerald-950 line-through opacity-75' 
                        : item.isGift 
                          ? 'text-amber-950 flex items-center gap-1.5' 
                          : 'text-stone-900'
                    }`}>
                      {item.isGift && <Gift className="w-4 h-4 text-amber-700 shrink-0" />}
                      <span>{item.name}</span>
                    </span>
                    
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <span className={`${isPicked ? 'text-emerald-700' : 'text-stone-500'} font-normal`}>
                        {item.spec}
                      </span>
                      {isPicked && (
                        <span className="font-bold text-emerald-700 text-xs">
                          • Đã gom đủ
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-lg sm:text-xl font-black font-mono px-3 py-1.5 rounded-xl border ${
                    isPicked 
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                      : 'text-amber-900 bg-amber-100/90 border-amber-300'
                  }`}>
                    x{item.quantity}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}