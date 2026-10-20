import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

export default function OrderSummaryCard({
  totalAmount,
  discountAmount,
  finalTotalAmount,
  paymentMethod,
  depositAmount,
  isSubmitting,
}) {
  const qrTransferAmount = paymentMethod === 'full_qr' ? finalTotalAmount : depositAmount;

  return (
    <div className="space-y-3 pt-2 font-sans">
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 space-y-2 text-xs">
        <div className="flex justify-between text-stone-600">
          <span>Tạm tính tiền hàng:</span>
          <span className="font-mono font-bold">{totalAmount.toLocaleString('vi-VN')}đ</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-emerald-700 font-semibold">
            <span>Giảm ưu đãi:</span>
            <span className="font-mono font-bold">-{discountAmount.toLocaleString('vi-VN')}đ</span>
          </div>
        )}

        <div className="flex justify-between text-stone-900 font-black border-t border-stone-100 pt-2 text-sm">
          <span>Tổng thanh toán:</span>
          <span className="font-mono text-amber-900">{finalTotalAmount.toLocaleString('vi-VN')}đ</span>
        </div>

        <div className="flex justify-between text-stone-500 text-[11px] pt-0.5">
          <span>Thanh toán ngay:</span>
          <span className="font-mono font-bold text-stone-800">
            {paymentMethod === 'cod' ? '0đ (Trả khi nhận)' : `${qrTransferAmount.toLocaleString('vi-VN')}đ`}
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang Gửi Đơn Về Vườn...</span>
          </>
        ) : (
          <>
            <span>Xác Nhận Đặt Hàng Ngay</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}