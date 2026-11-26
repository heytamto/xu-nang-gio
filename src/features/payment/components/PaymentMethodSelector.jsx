// src/components/checkout/PaymentMethodSelector.jsx
import React, { useEffect } from 'react';
import { QrCode, ShieldCheck, Truck, AlertTriangle, Ban } from 'lucide-react';

export default function PaymentMethodSelector({
  paymentMethod = 'deposit',
  setPaymentMethod,
  customerHistory = {},
  depositAmount = 50000,
  finalTotalAmount = 0,
  isPaymentGiftsEnabled = true,
}) {
  const safeDeposit = Number(depositAmount) || 50000;
  const totalAmount = Number(finalTotalAmount) || 0;

  // Tính chính xác số tiền COD còn lại cần đưa nhà xe
  const remainingCod = Math.max(0, totalAmount - safeDeposit);

  // Khi tổng đơn nhỏ hơn hoặc bằng mức cọc
  const isTotalLowerThanDeposit = totalAmount > 0 && totalAmount <= safeDeposit;

  // 1. Phân tích lịch sử đơn hàng của khách
  const isPardoned = Boolean(customerHistory?.isPardoned);

  const isLastOrderBombed = !isPardoned && Boolean(
    customerHistory?.lastOrderBombed || 
    customerHistory?.lastOrderStatus === 'bombed' ||
    customerHistory?.hasBombedHistory
  );

  const isTwoRecentCancelled = !isPardoned && Boolean(
    customerHistory?.twoRecentCancelled || 
    customerHistory?.consecutiveCancelledCount >= 2 ||
    customerHistory?.isFrequentCanceller
  );

  // Khóa COD nếu: Đơn kề trước bị bom HOẶC 2 đơn gần nhất liên tục bị hủy
  const isCodBlocked = isLastOrderBombed || isTwoRecentCancelled;

  // Khóa Cọc nếu: Đơn kề trước bị bom HOẶC tổng đơn nhỏ hơn/bằng tiền cọc
  const isDepositBlocked = isLastOrderBombed || isTotalLowerThanDeposit;

  // 2. Tự động chuyển hình thức thanh toán hợp lệ
  useEffect(() => {
    if (isLastOrderBombed && paymentMethod !== 'full_qr') {
      setPaymentMethod('full_qr');
    } else if (isTotalLowerThanDeposit && paymentMethod === 'deposit') {
      setPaymentMethod(isCodBlocked ? 'full_qr' : 'cod');
    } else if (isCodBlocked && paymentMethod === 'cod') {
      setPaymentMethod(isDepositBlocked ? 'full_qr' : 'deposit');
    }
  }, [isLastOrderBombed, isTotalLowerThanDeposit, isCodBlocked, isDepositBlocked, paymentMethod, setPaymentMethod]);

  return (
    <div className="space-y-3 font-sans text-stone-800">
      <div className="flex items-center justify-between">
        <label className="text-xs sm:text-sm font-bold text-stone-700 block">
          Chọn hình thức thanh toán:
        </label>
        {(isLastOrderBombed || isTwoRecentCancelled) && (
          <span className="text-xs text-amber-900 font-semibold flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Chính sách giữ đơn an toàn</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {/* 1. Chuyển khoản 100% (Luôn mở) */}
        <label className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-center justify-between ${
          paymentMethod === 'full_qr' 
            ? 'border-amber-600 bg-amber-50/80 ring-2 ring-amber-600/20 shadow-2xs' 
            : 'border-stone-200 bg-white hover:bg-stone-50'
        }`}>
          <div className="flex items-center gap-3">
            <QrCode className={`w-5 h-5 shrink-0 ${paymentMethod === 'full_qr' ? 'text-amber-700' : 'text-stone-400'}`} />
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <strong className="text-sm sm:text-base text-stone-900 font-bold">
                  {isTotalLowerThanDeposit && totalAmount > 0 
                    ? `Chuyển khoản toàn bộ (${totalAmount.toLocaleString('vi-VN')}đ)` 
                    : 'Chuyển khoản 100%'}
                </strong>

                {/* Hiển thị khi bật quà tặng */}
                {isPaymentGiftsEnabled && (
                  <span className="text-xs bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-lg font-bold animate-fadeIn">
                    + Tặng Quà Vườn
                  </span>
                )}
              </div>
              <span className="text-xs sm:text-sm text-stone-600 block leading-relaxed font-normal">
                Quét VietQR tức thì • Nhận hàng thảnh thơi không cần chuẩn bị tiền mặt
              </span>
            </div>
          </div>
          <input 
            type="radio" 
            name="paymentMethod" 
            value="full_qr" 
            checked={paymentMethod === 'full_qr'} 
            onChange={() => setPaymentMethod('full_qr')} 
            className="accent-amber-600 cursor-pointer w-4 h-4 ml-2" 
          />
        </label>

        {/* 2. Cọc giữ đơn (Nói rõ số tiền cọc và số tiền gửi nhà xe) */}
        {!isTotalLowerThanDeposit && (
          !isLastOrderBombed ? (
            <label className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-center justify-between ${
              paymentMethod === 'deposit' 
                ? 'border-amber-600 bg-amber-50/80 ring-2 ring-amber-600/20 shadow-2xs' 
                : 'border-stone-200 bg-white hover:bg-stone-50'
            }`}>
              <div className="flex items-center gap-3">
                <ShieldCheck className={`w-5 h-5 shrink-0 ${paymentMethod === 'deposit' ? 'text-amber-700' : 'text-stone-400'}`} />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-sm sm:text-base text-stone-900 font-bold">
                      Cọc trước {safeDeposit.toLocaleString('vi-VN')}đ
                    </strong>

                    {/* Hiển thị khi bật quà tặng */}
                    {isPaymentGiftsEnabled && (
                      <span className="text-xs bg-amber-100 text-amber-950 border border-amber-300 px-2 py-0.5 rounded-lg font-bold animate-fadeIn">
                        + Tặng Quà Vườn
                      </span>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm text-stone-600 block leading-relaxed font-normal">
                    Chuyển khoản <strong className="font-mono text-stone-900 font-bold">{safeDeposit.toLocaleString('vi-VN')}đ</strong> giữ đơn • Gửi nhà xe <strong className="font-mono text-amber-950 font-bold">{remainingCod.toLocaleString('vi-VN')}đ</strong> khi nhận hàng
                  </span>
                </div>
              </div>
              <input 
                type="radio" 
                name="paymentMethod" 
                value="deposit" 
                checked={paymentMethod === 'deposit'} 
                onChange={() => setPaymentMethod('deposit')} 
                className="accent-amber-600 cursor-pointer w-4 h-4 ml-2" 
              />
            </label>
          ) : (
            <div className="p-4 rounded-2xl border border-dashed border-rose-300 bg-rose-50/60 text-stone-500 flex items-center justify-between select-none">
              <div className="flex items-center gap-3">
                <Ban className="w-5 h-5 text-rose-500 shrink-0" />
                <div className="space-y-0.5">
                  <strong className="block text-sm sm:text-base font-bold text-stone-500 line-through">
                    Cọc trước {safeDeposit.toLocaleString('vi-VN')}đ
                  </strong>
                  <span className="text-xs sm:text-sm text-rose-800 block leading-relaxed font-normal">
                    Đơn hàng gần nhất bị hủy giao (bom hàng). Vui lòng thanh toán toàn bộ qua VietQR.
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-900 bg-rose-100 border border-rose-300 px-2.5 py-1 rounded-xl shrink-0 ml-2">
                Bắt Buộc CK 100%
              </span>
            </div>
          )
        )}

        {/* 3. COD (Bị khóa nếu bom đơn trước đó hoặc hủy 2 đơn liên tiếp) */}
        {!isCodBlocked ? (
          <label className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-center justify-between ${
            paymentMethod === 'cod' 
              ? 'border-amber-600 bg-amber-50/80 ring-2 ring-amber-600/20 shadow-2xs' 
              : 'border-stone-200 bg-white hover:bg-stone-50'
          }`}>
            <div className="flex items-center gap-3">
              <Truck className={`w-5 h-5 shrink-0 ${paymentMethod === 'cod' ? 'text-amber-700' : 'text-stone-400'}`} />
              <div className="space-y-0.5">
                <strong className="block text-sm sm:text-base text-stone-900 font-bold">
                  Trả sau (COD Toàn Phần)
                </strong>
                <span className="text-xs sm:text-sm text-stone-600 block leading-relaxed font-normal">
                  Vườn gọi xác nhận trước khi hái • Gửi trọn gói <strong className="font-mono text-stone-900 font-bold">{totalAmount.toLocaleString('vi-VN')}đ</strong> cho nhà xe khi nhận hàng
                </span>
              </div>
            </div>
            <input 
              type="radio" 
              name="paymentMethod" 
              value="cod" 
              checked={paymentMethod === 'cod'} 
              onChange={() => setPaymentMethod('cod')} 
              className="accent-amber-600 cursor-pointer w-4 h-4 ml-2" 
            />
          </label>
        ) : (
          <div className="p-4 rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 text-stone-500 flex items-center justify-between select-none">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="space-y-0.5">
                <strong className="block text-sm sm:text-base font-bold text-stone-500 line-through">
                  Trả sau (COD Toàn Phần)
                </strong>
                <span className="text-xs sm:text-sm text-amber-950 block leading-relaxed font-normal">
                  {isLastOrderBombed 
                    ? 'Không áp dụng COD do đơn kề trước từng hoàn trả.' 
                    : '2 đơn gần nhất liên tiếp bị hủy. Vui lòng thanh toán trước để nhà vườn xuất hàng.'}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-950 bg-amber-200/80 border border-amber-300 px-2.5 py-1 rounded-xl shrink-0 ml-2">
              {isLastOrderBombed ? 'Khóa COD' : 'Cần Trả Trước'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}