import React from 'react';
import { QrCode, ShieldCheck, Truck } from 'lucide-react';

export default function PaymentMethodSelector({
  paymentMethod,
  setPaymentMethod,
  customerHistory,
  depositAmount = 50000,
}) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-bold text-stone-700 block">Chọn hình thức thanh toán:</label>
      <div className="grid grid-cols-1 gap-2">
        {/* 1. Chuyển khoản 100% */}
        <label className={`cursor-pointer p-2.5 rounded-2xl border transition-all flex items-center justify-between ${
          paymentMethod === 'full_qr' ? 'border-amber-600 bg-amber-50 ring-1 ring-amber-600 shadow-xs' : 'border-stone-200 bg-white hover:bg-stone-50'
        }`}>
          <div className="flex items-center gap-2.5">
            <QrCode className={`w-4 h-4 shrink-0 ${paymentMethod === 'full_qr' ? 'text-amber-700' : 'text-stone-400'}`} />
            <div>
              <div className="flex items-center gap-1.5">
                <strong className="text-xs text-stone-900 font-bold">Chuyển khoản 100%</strong>
                <span className="text-[9.5px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded-md font-bold">+ Tặng Quà</span>
              </div>
              <span className="text-[10px] text-stone-500 block leading-tight">Quét VietQR • Nhận hàng không cần tiền mặt</span>
            </div>
          </div>
          <input 
            type="radio" 
            name="paymentMethod" 
            value="full_qr" 
            checked={paymentMethod === 'full_qr'} 
            onChange={() => setPaymentMethod('full_qr')} 
            className="accent-amber-600" 
          />
        </label>

        {/* 2. Cọc 50.000đ */}
        {!customerHistory?.hasBombedHistory ? (
          <label className={`cursor-pointer p-2.5 rounded-2xl border transition-all flex items-center justify-between ${
            paymentMethod === 'deposit' ? 'border-amber-600 bg-amber-50 ring-1 ring-amber-600 shadow-xs' : 'border-stone-200 bg-white hover:bg-stone-50'
          }`}>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className={`w-4 h-4 shrink-0 ${paymentMethod === 'deposit' ? 'text-amber-700' : 'text-stone-400'}`} />
              <div>
                <div className="flex items-center gap-1.5">
                  <strong className="text-xs text-stone-900 font-bold">Cọc {depositAmount.toLocaleString('vi-VN')}đ</strong>
                  <span className="text-[9.5px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-md font-bold">+ Tặng Quà</span>
                </div>
                <span className="text-[10px] text-stone-500 block leading-tight">Giữ đơn hái tươi • Phần còn lại nhà xe thu</span>
              </div>
            </div>
            <input 
              type="radio" 
              name="paymentMethod" 
              value="deposit" 
              checked={paymentMethod === 'deposit'} 
              onChange={() => setPaymentMethod('deposit')} 
              className="accent-amber-600" 
            />
          </label>
        ) : (
          <div className="p-2.5 rounded-2xl border border-dashed border-stone-300 bg-stone-100/70 text-stone-400 flex items-center justify-between cursor-not-allowed select-none opacity-60">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <div>
                <strong className="block text-xs font-bold line-through">Cọc {depositAmount.toLocaleString('vi-VN')}đ</strong>
                <span className="text-[10px] block leading-tight">Không áp dụng cho số điện thoại từng có đơn bom</span>
              </div>
            </div>
            <span className="text-[9.5px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md">
              Tạm Khóa Cọc
            </span>
          </div>
        )}

        {/* 3. COD (Trả sau) */}
        {!customerHistory?.isRiskCustomer ? (
          <label className={`cursor-pointer p-2.5 rounded-2xl border transition-all flex items-center justify-between ${
            paymentMethod === 'cod' ? 'border-amber-600 bg-amber-50 ring-1 ring-amber-600 shadow-xs' : 'border-stone-200 bg-white hover:bg-stone-50'
          }`}>
            <div className="flex items-center gap-2.5">
              <Truck className={`w-4 h-4 shrink-0 ${paymentMethod === 'cod' ? 'text-amber-700' : 'text-stone-400'}`} />
              <div>
                <strong className="block text-xs text-stone-900 font-bold">Trả sau (COD Toàn Phần)</strong>
                <span className="text-[10px] text-stone-500 block leading-tight">Vườn gọi xác nhận • Thanh toán 100% khi nhận hàng</span>
              </div>
            </div>
            <input 
              type="radio" 
              name="paymentMethod" 
              value="cod" 
              checked={paymentMethod === 'cod'} 
              onChange={() => setPaymentMethod('cod')} 
              className="accent-amber-600" 
            />
          </label>
        ) : (
          <div className="p-2.5 rounded-2xl border border-dashed border-stone-300 bg-stone-100/70 text-stone-400 flex items-center justify-between cursor-not-allowed select-none opacity-60">
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 shrink-0" />
              <div>
                <strong className="block text-xs font-bold line-through">Trả sau (COD Toàn Phần)</strong>
                <span className="text-[10px] block leading-tight">Tạm ngưng COD cho đơn hàng này</span>
              </div>
            </div>
            <span className="text-[9.5px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
              {customerHistory?.hasBombedHistory ? 'Bắt Buộc CK 100%' : 'Cần Cọc Giữ Đơn'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}