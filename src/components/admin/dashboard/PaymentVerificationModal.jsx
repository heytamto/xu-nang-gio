// src/components/admin/dashboard/PaymentVerificationModal.jsx
import React from 'react';
import { ShieldCheck, X, Info, CheckCircle2 } from 'lucide-react';

export default function PaymentVerificationModal({
  modalData,
  bankLabel,
  onClose,
  onConfirm
}) {
  if (!modalData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/75 backdrop-blur-xs p-4 animate-fadeIn font-sans">
      <div className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-md border border-stone-200 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h4 className="font-black text-base sm:text-lg text-stone-900">
                {modalData.isDeposit ? 'Xác Nhận Đã Nhận Tiền Cọc' : 'Xác Nhận Đã Nhận Đủ 100%'}
              </h4>
              <p className="text-xs sm:text-sm text-stone-500 font-mono">
                Mã đơn: <strong className="text-amber-950 font-bold">{modalData.order.code}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-2 rounded-2xl hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200/80 space-y-2.5 text-xs sm:text-sm">
          <div className="flex justify-between items-center text-stone-600">
            <span className="font-medium">Khách hàng:</span>
            <span className="font-bold text-stone-900 text-sm">
              {modalData.order.customer_name || modalData.order.name || 'Khách đặt'}
            </span>
          </div>

          <div className="flex justify-between items-center text-stone-600">
            <span className="font-medium">Số điện thoại:</span>
            <span className="font-mono font-bold text-stone-900 text-sm">
              {modalData.order.phone}
            </span>
          </div>

          <div className="flex justify-between items-center text-stone-600">
            <span className="font-medium">Tổng giá trị đơn hàng:</span>
            <span className="font-mono font-black text-stone-900 text-sm sm:text-base">
              {modalData.totalNum.toLocaleString('vi-VN')}đ
            </span>
          </div>

          <div className="pt-2.5 border-t border-stone-200/70 flex justify-between items-center">
            <span className="font-bold text-emerald-950 text-xs sm:text-sm">
              {modalData.isDeposit ? 'Số tiền cọc cần đối soát:' : 'Số tiền 100% cần đối soát:'}
            </span>
            <span className="font-mono font-black text-emerald-700 text-lg sm:text-xl">
              {modalData.expectedAmount.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2.5 leading-relaxed font-normal">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            Vui lòng mở ứng dụng <strong>{bankLabel}</strong> và kiểm tra biến động số dư đúng mã <strong>{modalData.order.code}</strong> trước khi xác nhận. Sau khi xác nhận, đơn sẽ tự động chuyển sang trạng thái <strong>Đã Xác Nhận (Confirmed)</strong> để chuyển giao qua tổ Đóng gói.
          </span>
        </div>

        <div className="flex items-center gap-3 pt-2.5 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-stone-200 hover:bg-stone-100 font-bold text-xs sm:text-sm text-stone-700 transition-colors cursor-pointer"
          >
            Chưa nhận, Đóng
          </button>

          <button
            type="button"
            onClick={() => onConfirm(modalData.order)}
            className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã Nhận Đủ Tiền</span>
          </button>
        </div>
      </div>
    </div>
  );
}