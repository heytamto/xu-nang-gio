// src/components/checkout/VoucherSection.jsx
import React from 'react';
import { Tag, Sparkles, X, Loader2, Award, Layers } from 'lucide-react';

export default function VoucherSection({
  voucherInput = '',
  setVoucherInput,
  appliedVouchers = [],
  calculatedVouchers = [],
  voucherError = '',
  maxVouchers = 3,
  isValidating = false,
  onApplyVoucher,
  onRemoveVoucher,
}) {
  const handleApply = (e) => {
    if (e) e.preventDefault();
    if (isValidating) return;
    const cleanCode = voucherInput.trim().toUpperCase();
    if (!cleanCode) return;
    if (setVoucherInput) setVoucherInput(cleanCode);
    onApplyVoucher?.(cleanCode);
  };

  // Ưu tiên hiển thị mảng calculatedVouchers (chứa chi tiết số tiền đã tính và mô tả)
  const displayVouchers = (Array.isArray(calculatedVouchers) && calculatedVouchers.length > 0)
    ? calculatedVouchers
    : appliedVouchers;

  const isMaxReached = appliedVouchers.length >= maxVouchers;
  const isInputEmpty = !voucherInput.trim();

  return (
    <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs space-y-2.5 font-sans">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-amber-600" />
          <span>Mã Ưu Đãi / Voucher</span>
        </span>
        {appliedVouchers.length > 0 && (
          <span className="text-[10px] text-stone-400 font-mono">
            {appliedVouchers.length}/{maxVouchers} mã
          </span>
        )}
      </div>

      {/* Khung nhập mã voucher */}
      <form onSubmit={handleApply} className="flex gap-1.5">
        <input
          type="text"
          disabled={isMaxReached || isValidating}
          placeholder="Nhập mã ưu đãi hoặc mã đơn cũ..."
          value={voucherInput}
          onChange={(e) => setVoucherInput?.(e.target.value.toUpperCase())}
          className="flex-1 text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-amber-600 font-mono uppercase text-stone-800 disabled:opacity-60 transition-colors"
        />
        <button
          type="submit"
          disabled={isMaxReached || isInputEmpty || isValidating}
          className="px-3.5 py-2 bg-stone-900 hover:bg-amber-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer min-w-[76px] flex items-center justify-center gap-1.5"
        >
          {isValidating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Kiểm tra...</span>
            </>
          ) : (
            <span>Áp dụng</span>
          )}
        </button>
      </form>

      {voucherError && (
        <p className="text-[10.5px] text-rose-600 font-medium leading-tight animate-fadeIn">
          {voucherError}
        </p>
      )}

      {/* Danh sách các mã ưu đãi đang áp dụng */}
      {displayVouchers.length > 0 && (
        <div className="space-y-1.5 pt-1 max-h-40 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
          {displayVouchers.map((v, index) => {
            const vCode = typeof v === 'string' ? v : (v.code || `VOUCHER-${index + 1}`);
            const discountVal = Number(v.discount ?? v.currentDiscount ?? v.value ?? 0);
            const isPreviousOrder = Boolean(v.isPreviousOrder || v.isLoyalty || vCode.startsWith('XNG'));
            const desc = v.desc || v.description || '';
            const canStack = v.canStack ?? v.can_stack ?? true;

            return (
              <div 
                key={vCode} 
                className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs shadow-2xs border transition-all ${
                  isPreviousOrder 
                    ? 'bg-amber-50/90 border-amber-300' 
                    : 'bg-emerald-50/80 border-emerald-300'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {isPreviousOrder ? (
                    <Award className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  )}
                  
                  <div className="truncate flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-stone-900">{vCode}</span>
                      
                      {isPreviousOrder ? (
                        <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-md bg-amber-200/80 text-amber-900 shrink-0">
                          Đơn cũ tri ân
                        </span>
                      ) : canStack ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.2 rounded bg-emerald-200/70 text-emerald-900 shrink-0">
                          <Layers className="w-2.5 h-2.5" />
                          <span>Gộp</span>
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-stone-200 text-stone-700 shrink-0">
                          Độc quyền
                        </span>
                      )}

                      {discountVal > 0 && (
                        <span className="text-[10.5px] text-amber-900 font-bold font-mono shrink-0 ml-auto mr-1">
                          -{discountVal.toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </div>

                    {desc && !isPreviousOrder && (
                      <p className="text-[10px] text-stone-500 truncate mt-0.5">
                        {desc}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveVoucher?.(vCode)}
                  className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer transition-colors shrink-0 ml-1 rounded-lg hover:bg-black/5"
                  title="Gỡ mã này"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}