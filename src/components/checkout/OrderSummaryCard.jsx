// src/components/checkout/OrderSummaryCard.jsx
import React from 'react';
import { ArrowRight, Loader2, Truck, CheckCircle2, Sparkles } from 'lucide-react';

export default function OrderSummaryCard({
  totalAmount = 0,
  shippingFee = 0,
  freeShippingThreshold = 500000,
  discountAmount = 0,
  finalTotalAmount = 0,
  paymentMethod = 'deposit',
  depositAmount = 50000,
  isSubmitting = false,
  isPaymentVerified = false,
}) {
  const safeTotal = Number(totalAmount) || 0;
  const safeShipping = Number(shippingFee) || 0;
  const safeDiscount = Number(discountAmount) || 0;
  const safeFinalTotal = Number(finalTotalAmount) || 0;
  const safeDeposit = Math.min(Number(depositAmount) || 50000, safeFinalTotal);

  const qrTransferAmount = paymentMethod === 'full_qr' ? safeFinalTotal : safeDeposit;
  const remainingCod = paymentMethod === 'cod' ? safeFinalTotal : Math.max(0, safeFinalTotal - qrTransferAmount);

  // Tiến trình đạt mốc miễn phí vận chuyển
  const remainingForFreeship = Math.max(0, freeShippingThreshold - safeTotal);
  const freeshipProgressPercent = Math.min(100, Math.round((safeTotal / freeShippingThreshold) * 100));

  return (
    <div className="space-y-3 pt-2 font-sans">
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 space-y-2.5 text-xs shadow-2xs">
        
        {/* Thanh gợi ý Freeship */}
        {safeTotal > 0 && remainingForFreeship > 0 && (
          <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/70 space-y-1.5">
            <div className="flex items-center justify-between text-[10.5px]">
              <span className="text-amber-900 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-700 shrink-0" />
                <span>Mua thêm <strong>{remainingForFreeship.toLocaleString('vi-VN')}đ</strong> để được:</span>
              </span>
              <strong className="text-emerald-700 font-bold uppercase tracking-wider text-[10px]">
                Freeship
              </strong>
            </div>
            <div className="w-full bg-amber-200/70 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-amber-600 h-full rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${freeshipProgressPercent}%` }} 
              />
            </div>
          </div>
        )}

        {/* Tạm tính tiền hàng */}
        <div className="flex justify-between text-stone-600">
          <span>Tạm tính tiền hàng:</span>
          <span className="font-mono font-bold text-stone-900">{safeTotal.toLocaleString('vi-VN')}đ</span>
        </div>

        {/* Cước phí vận chuyển / gửi xe */}
        <div className="flex justify-between items-center text-stone-600">
          <span className="flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-stone-400" />
            <span>Phí gửi xe / vận chuyển:</span>
          </span>
          {safeShipping === 0 ? (
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] border border-emerald-200">
              Miễn phí ship
            </span>
          ) : (
            <span className="font-mono font-bold text-stone-800">
              +{safeShipping.toLocaleString('vi-VN')}đ
            </span>
          )}
        </div>

        {/* Giảm giá voucher */}
        {safeDiscount > 0 && (
          <div className="flex justify-between text-emerald-700 font-semibold">
            <span>Giảm ưu đãi:</span>
            <span className="font-mono font-bold">-{safeDiscount.toLocaleString('vi-VN')}đ</span>
          </div>
        )}

        {/* Tổng thanh toán cuối cùng */}
        <div className="flex justify-between text-stone-900 font-black border-t border-stone-100 pt-2 text-sm">
          <span>Tổng thanh toán:</span>
          <span className="font-mono text-amber-900 text-base">{safeFinalTotal.toLocaleString('vi-VN')}đ</span>
        </div>

        {/* Khoản tiền thanh toán trước / nhận hàng */}
        <div className="border-t border-stone-100/70 pt-2 space-y-1.5 text-[11px]">
          <div className="flex justify-between items-center text-stone-600">
            <span>{paymentMethod === 'deposit' ? `Cọc giữ đơn (${safeDeposit.toLocaleString('vi-VN')}đ):` : 'Thanh toán ngay (VietQR):'}</span>
            <div className="flex items-center gap-1">
              {isPaymentVerified && paymentMethod !== 'cod' && (
                <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Đã nhận</span>
                </span>
              )}
              <span className="font-mono font-bold text-emerald-700">
                {paymentMethod === 'cod' ? '0đ (Trả sau)' : `${qrTransferAmount.toLocaleString('vi-VN')}đ`}
              </span>
            </div>
          </div>

          {remainingCod > 0 && (
            <div className="flex justify-between text-stone-500">
              <span>Còn lại gửi nhà xe khi nhận:</span>
              <span className="font-mono font-semibold text-stone-700">
                {remainingCod.toLocaleString('vi-VN')}đ
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Nút gửi đơn hàng */}
      <button
        type="submit"
        disabled={isSubmitting || safeTotal === 0}
        className={`w-full py-3.5 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60 ${
          isPaymentVerified && paymentMethod !== 'cod'
            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
            : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
        }`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang Gửi Đơn Về Vườn...</span>
          </>
        ) : isPaymentVerified && paymentMethod !== 'cod' ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã Nhận Tiền • Hoàn Tất Đặt Hàng</span>
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