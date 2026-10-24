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
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-amber-700" />
          <span>Mã Giảm Giá / Tri Ân</span>
        </label>
        {appliedVouchers.length > 0 && (
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Đã áp dụng {appliedVouchers.length} mã
          </span>
        )}
      </div>

      {/* ĐÃ THAY <form> BẰNG <div> ĐỂ TRÁNH LỖI NESTED FORM */}
      <div className="flex gap-1.5">
        <input
          type="text"
          placeholder="Nhập mã ưu đãi (VD: LAMQUEN)..."
          value={voucherInput}
          onChange={(e) => setVoucherInput?.(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          disabled={isValidating}
          className="w-full text-xs font-mono uppercase font-bold p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-amber-600 shadow-2xs"
        />
        <button
          type="button"
          disabled={isValidating || !voucherInput.trim()}
          onClick={onApplyVoucher}
          className="px-4 py-2.5 bg-stone-900 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-xs shrink-0 flex items-center gap-1.5"
        >
          {isValidating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>{isValidating ? 'Kiểm tra...' : 'Áp dụng'}</span>
        </button>
      </div>

      {voucherError && (
        <p className="text-[11px] text-rose-600 font-semibold pl-1 animate-fadeIn">
          {voucherError}
        </p>
      )}

      {/* DANH SÁCH MÃ ĐÃ ÁP DỤNG */}
      {appliedVouchers.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {appliedVouchers.map((v) => (
            <div
              key={v.code}
              className="flex items-center justify-between p-2 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono font-black text-amber-900 bg-amber-200/70 px-1.5 py-0.5 rounded text-[10.5px]">
                  {v.code}
                </span>
                <span className="text-[11px] text-stone-700 truncate font-medium">
                  {v.desc || v.title || (v.percent ? `Giảm ${v.percent}%` : `Giảm ${Number(v.value || 0).toLocaleString('vi-VN')}đ`)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveVoucher?.(v.code)}
                className="p-1 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors cursor-pointer shrink-0"
                title="Gỡ mã này"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}