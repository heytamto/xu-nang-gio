// src/components/checkout/PaymentMethodSelector.jsx
import React, { useEffect } from 'react';
import { QrCode, ShieldCheck, Truck, AlertTriangle, Ban } from 'lucide-react';

export default function PaymentMethodSelector({
  paymentMethod = 'deposit',
  setPaymentMethod,
  customerHistory = {},
  depositAmount = 50000,
}) {
  const safeDeposit = Number(depositAmount) || 50000;

  // 1. Phân tích lịch sử đơn hàng của khách
  // Đơn kề trước (gần nhất) có trạng thái là bombed
  const isLastOrderBombed = Boolean(
    customerHistory?.lastOrderBombed || 
    customerHistory?.lastOrderStatus === 'bombed' ||
    customerHistory?.hasBombedHistory
  );

  // 2 đơn liên tục gần nhất đều bị hủy (cancelled)
  const isTwoRecentCancelled = Boolean(
    customerHistory?.twoRecentCancelled || 
    customerHistory?.consecutiveCancelledCount >= 2
  );

  // Khóa COD nếu: Đơn kề trước bị bom HOẶC 2 đơn gần nhất liên tục bị hủy
  const isCodBlocked = isLastOrderBombed || isTwoRecentCancelled;

  // Khóa Cọc nếu: Đơn kề trước bị bom (Bắt buộc trả 100%)
  const isDepositBlocked = isLastOrderBombed;

  // 2. Tự động chuyển hình thức thanh toán hợp lệ nếu phương thức đang chọn bị khóa
  useEffect(() => {
    if (isLastOrderBombed && paymentMethod !== 'full_qr') {
      setPaymentMethod('full_qr');
    } else if (isCodBlocked && paymentMethod === 'cod') {
      setPaymentMethod('deposit');
    }
  }, [isLastOrderBombed, isCodBlocked, paymentMethod, setPaymentMethod]);

  return (
    <div className="space-y-2.5 font-sans">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-stone-700 block">
          Chọn hình thức thanh toán:
        </label>
        {(isLastOrderBombed || isTwoRecentCancelled) && (
          <span className="text-[10px] text-amber-800 font-semibold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Chính sách giữ đơn an toàn</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {/* 1. Chuyển khoản 100% (Luôn mở) */}
        <label className={`cursor-pointer p-3 rounded-2xl border transition-all flex items-center justify-between ${
          paymentMethod === 'full_qr' 
            ? 'border-amber-600 bg-amber-50 ring-1 ring-amber-600 shadow-xs' 
            : 'border-stone-200 bg-white hover:bg-stone-50'
        }`}>
          <div className="flex items-center gap-2.5">
            <QrCode className={`w-4 h-4 shrink-0 ${paymentMethod === 'full_qr' ? 'text-amber-700' : 'text-stone-400'}`} />
            <div>
              <div className="flex items-center gap-1.5">
                <strong className="text-xs text-stone-900 font-bold">Chuyển khoản 100%</strong>
                <span className="text-[9.5px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded-md font-bold">
                  + Tặng Quà Vườn
                </span>
              </div>
              <span className="text-[10px] text-stone-500 block leading-tight mt-0.5">
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
            className="accent-amber-600 cursor-pointer" 
          />
        </label>

        {/* 2. Cọc giữ đơn (Bị khóa nếu đơn kề trước bị bom) */}
        {!isDepositBlocked ? (
          <label className={`cursor-pointer p-3 rounded-2xl border transition-all flex items-center justify-between ${
            paymentMethod === 'deposit' 
              ? 'border-amber-600 bg-amber-50 ring-1 ring-amber-600 shadow-xs' 
              : 'border-stone-200 bg-white hover:bg-stone-50'
          }`}>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className={`w-4 h-4 shrink-0 ${paymentMethod === 'deposit' ? 'text-amber-700' : 'text-stone-400'}`} />
              <div>
                <div className="flex items-center gap-1.5">
                  <strong className="text-xs text-stone-900 font-bold">Cọc {safeDeposit.toLocaleString('vi-VN')}đ</strong>
                  <span className="text-[9.5px] bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded-md font-bold">
                    + Tặng Quà Vườn
                  </span>
                </div>
                <span className="text-[10px] text-stone-500 block leading-tight mt-0.5">
                  Giữ đơn hái tươi sáng sớm • Số tiền còn lại gửi tài xế khi nhận thùng xốp
                </span>
              </div>
            </div>
            <input 
              type="radio" 
              name="paymentMethod" 
              value="deposit" 
              checked={paymentMethod === 'deposit'} 
              onChange={() => setPaymentMethod('deposit')} 
              className="accent-amber-600 cursor-pointer" 
            />
          </label>
        ) : (
          <div className="p-3 rounded-2xl border border-dashed border-rose-300 bg-rose-50/50 text-stone-400 flex items-center justify-between select-none">
            <div className="flex items-center gap-2.5">
              <Ban className="w-4 h-4 text-rose-500 shrink-0" />
              <div>
                <strong className="block text-xs font-bold text-stone-500 line-through">
                  Cọc {safeDeposit.toLocaleString('vi-VN')}đ
                </strong>
                <span className="text-[10px] text-rose-700 block leading-tight mt-0.5">
                  Đơn hàng gần nhất bị hủy giao (bom hàng). Vui lòng thanh toán toàn bộ qua VietQR.
                </span>
              </div>
            </div>
            <span className="text-[9.5px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-md shrink-0 ml-2">
              Bắt Buộc CK 100%
            </span>
          </div>
        )}

        {/* 3. COD (Bị khóa nếu bom đơn trước ĐÓ hoặc hủy 2 đơn liên tiếp) */}
        {!isCodBlocked ? (
          <label className={`cursor-pointer p-3 rounded-2xl border transition-all flex items-center justify-between ${
            paymentMethod === 'cod' 
              ? 'border-amber-600 bg-amber-50 ring-1 ring-amber-600 shadow-xs' 
              : 'border-stone-200 bg-white hover:bg-stone-50'
          }`}>
            <div className="flex items-center gap-2.5">
              <Truck className={`w-4 h-4 shrink-0 ${paymentMethod === 'cod' ? 'text-amber-700' : 'text-stone-400'}`} />
              <div>
                <strong className="block text-xs text-stone-900 font-bold">Trả sau (COD Toàn Phần)</strong>
                <span className="text-[10px] text-stone-500 block leading-tight mt-0.5">
                  Vườn gọi xác nhận trước khi hái • Thanh toán 100% cho nhà xe khi nhận hàng
                </span>
              </div>
            </div>
            <input 
              type="radio" 
              name="paymentMethod" 
              value="cod" 
              checked={paymentMethod === 'cod'} 
              onChange={() => setPaymentMethod('cod')} 
              className="accent-amber-600 cursor-pointer" 
            />
          </label>
        ) : (
          <div className="p-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 text-stone-400 flex items-center justify-between select-none">
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <strong className="block text-xs font-bold text-stone-500 line-through">
                  Trả sau (COD Toàn Phần)
                </strong>
                <span className="text-[10px] text-amber-900 block leading-tight mt-0.5">
                  {isLastOrderBombed 
                    ? 'Không áp dụng COD do đơn kề trước từng hoàn trả.' 
                    : '2 đơn gần nhất liên tiếp bị hủy. Vui lòng cọc giữ đơn để nhà vườn xuất hàng.'}
                </span>
              </div>
            </div>
            <span className="text-[9.5px] font-bold text-amber-900 bg-amber-200/80 border border-amber-300 px-2 py-0.5 rounded-md shrink-0 ml-2">
              {isLastOrderBombed ? 'Khóa COD' : 'Cần Cọc Giữ Đơn'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}