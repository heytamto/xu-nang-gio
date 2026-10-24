// src/components/checkout/VoucherSection.jsx
import React from 'react';
import { Tag, Check, X, Loader2, Layers } from 'lucide-react';

export default function VoucherSection({
  voucherInput = '',
  setVoucherInput,
  appliedVouchers = [],
  calculatedVouchers = [],
  voucherError = '',
  isValidating = false,
  onApplyVoucher,
  onRemoveVoucher,
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!isValidating && voucherInput.trim()) {
        onApplyVoucher?.();
      }
    }
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-2xs space-y-3.5 font-sans text-stone-800">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="text-sm sm:text-base font-black text-stone-900 flex items-center gap-2 tracking-wide">
          <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
          <span>Mã Giảm Giá / Tri Ân</span>
        </label>
        {appliedVouchers.length > 0 && (
          <span className="text-xs font-bold text-emerald-900 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-300 shadow-2xs">
            Đã áp dụng {appliedVouchers.length} mã
          </span>
        )}
      </div>

      {/* Khung nhập mã ưu đãi */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Nhập mã ưu đãi (VD: LAMQUEN)..."
          value={voucherInput}
          onChange={(e) => setVoucherInput?.(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          disabled={isValidating}
          className="w-full text-xs sm:text-sm font-mono uppercase font-bold px-4 py-3 rounded-2xl border border-stone-200 bg-stone-50/90 focus:bg-white focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
        />
        <button
          type="button"
          disabled={isValidating || !voucherInput.trim()}
          onClick={onApplyVoucher}
          className="px-5 py-3 bg-stone-900 hover:bg-amber-800 text-white font-bold text-xs sm:text-sm rounded-2xl transition-all disabled:opacity-50 cursor-pointer shadow-xs shrink-0 flex items-center gap-2 active:scale-95"
        >
          {isValidating && <Loader2 className="w-4 h-4 animate-spin text-amber-300" />}
          <span>{isValidating ? 'Kiểm tra...' : 'Áp dụng'}</span>
        </button>
      </div>

      {voucherError && (
        <p className="text-xs sm:text-sm text-rose-600 font-semibold pl-1 animate-fadeIn">
          {voucherError}
        </p>
      )}

      {/* DANH SÁCH MÃ ĐÃ ÁP DỤNG */}
      {appliedVouchers.length > 0 && (
        <div className="space-y-2 pt-1.5">
          {appliedVouchers.map((v) => (
            <div
              key={v.code}
              className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-xs sm:text-sm shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-mono font-black text-amber-950 bg-amber-200/80 px-2.5 py-1 rounded-lg text-xs sm:text-sm shrink-0 border border-amber-300/60">
                  {v.code}
                </span>
                <span className="text-xs sm:text-sm text-stone-800 truncate font-medium">
                  {v.desc || v.title || (v.percent ? `Giảm ${v.percent}%` : `Giảm ${Number(v.value || 0).toLocaleString('vi-VN')}đ`)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveVoucher?.(v.code)}
                className="p-1.5 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-white transition-colors cursor-pointer shrink-0 ml-2"
                title="Gỡ mã này"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}