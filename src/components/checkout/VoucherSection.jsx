import React from 'react';
import { Tag, Sparkles, X } from 'lucide-react';

export default function VoucherSection({
  voucherInput,
  setVoucherInput,
  appliedVouchers = [],
  calculatedVouchers = [],
  voucherError,
  maxVouchers = 3,
  onApplyVoucher,
  onRemoveVoucher,
}) {
  return (
    <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-amber-600" />
          <span>Mã Ưu Đãi / Voucher</span>
        </span>
      </div>

      <div className="flex gap-1.5">
        <input
          type="text"
          disabled={appliedVouchers.length >= maxVouchers}
          placeholder="Nhập mã ưu đãi..."
          value={voucherInput}
          onChange={(e) => setVoucherInput(e.target.value)}
          className="flex-1 text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-amber-600 font-mono uppercase text-stone-800 disabled:opacity-60"
        />
        <button
          type="button"
          disabled={appliedVouchers.length >= maxVouchers}
          onClick={onApplyVoucher}
          className="px-3.5 py-2 bg-stone-900 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer"
        >
          Áp dụng
        </button>
      </div>

      {voucherError && (
        <p className="text-[10.5px] text-red-600 font-medium leading-tight">{voucherError}</p>
      )}

      {calculatedVouchers.length > 0 && (
        <div className="space-y-1.5 pt-1 max-h-32 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
          {calculatedVouchers.map((v) => (
            <div key={v.code} className="flex items-center justify-between bg-amber-50/90 border border-amber-300 px-2.5 py-1.5 rounded-xl text-xs shadow-2xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <div className="truncate">
                  <span className="font-mono font-bold text-amber-900">{v.code}</span>
                  <span className="text-[10.5px] text-amber-800 ml-1 font-medium">(-{v.currentDiscount.toLocaleString('vi-VN')}đ)</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemoveVoucher(v.code)}
                className="text-stone-400 hover:text-red-500 p-1 cursor-pointer"
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