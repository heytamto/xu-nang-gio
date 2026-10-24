// src/components/checkout/SelfCancelButton.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle, Loader2, XCircle, PhoneCall, ShieldAlert, ChevronDown, Check } from 'lucide-react';
import { ORDER_STATUS, normalizeOrderStatus } from '../../constants/orderStatus';
import { orderService } from '../../services/orderService';
import { getRemainingCancelMs, formatCountdownTimer } from '../../utils/dateUtils';

const CANCEL_REASONS = [
  'Đổi ý / Đặt nhầm sản phẩm',
  'Trùng đơn hàng vừa đặt',
  'Muốn thay đổi địa chỉ hoặc số điện thoại',
  'Bận việc đột xuất không nhận được',
  'Lý do khác'
];

export default function SelfCancelButton({
  order,
  onCancelSuccess,
  hotline = '0848.957.345',
}) {
  const [remainingMs, setRemainingMs] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Đổi ý / Đặt nhầm sản phẩm');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Quản lý trạng thái đóng/mở dropdown custom
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const createdAtVal = order?.created_at || order?.createdAt;
  const currentStatus = normalizeOrderStatus(order?.status);
  const isPending = currentStatus === ORDER_STATUS.PENDING;

  const isPrepaidOrVerified = Boolean(
    order?.payment_verified || 
    order?.paymentVerified || 
    Number(order?.deposit_paid || 0) > 0
  );

  // Cập nhật bộ đếm lùi 30 phút mỗi giây
  useEffect(() => {
    if (!createdAtVal || !isPending) {
      setRemainingMs(0);
      return;
    }

    const checkTime = () => {
      const left = getRemainingCancelMs(createdAtVal, Date.now(), 30);
      setRemainingMs(left > 0 ? left : 0);
    };

    checkTime();
    const timer = setInterval(checkTime, 1000);
    return () => clearInterval(timer);
  }, [createdAtVal, isPending]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  if (!isPending) return null;

  const orderCode = order?.code || order?.orderId || 'XNG-ORDER';
  const cleanPhone = String(hotline).replace(/\D/g, '');

  const handleConfirmCancel = async () => {
    setIsSubmitting(true);
    setErrorMsg('');

    const finalReason = customReason.trim() 
      ? `${cancelReason} (${customReason.trim()})`
      : cancelReason;

    try {
      if (orderService?.cancelOrder) {
        await orderService.cancelOrder(orderCode, finalReason);
      } else if (orderService?.updateOrderStatus) {
        await orderService.updateOrderStatus(orderCode, ORDER_STATUS.CANCELLED, finalReason);
      }

      setIsModalOpen(false);
      if (onCancelSuccess) {
        onCancelSuccess(orderCode, finalReason);
      }
    } catch (err) {
      console.error('Lỗi hủy đơn:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi cập nhật máy chủ. Vui lòng gọi Hotline!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-2 font-sans text-stone-800">
      {remainingMs > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-xs sm:text-sm shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-2 text-amber-950 font-medium">
            <Clock className="w-4 h-4 text-amber-700 animate-spin shrink-0" />
            <span>
              Đơn đang chờ duyệt. Còn{' '}
              <strong className="font-mono font-black text-amber-950 text-sm sm:text-base px-1">
                {formatCountdownTimer(remainingMs)}
              </strong>{' '}
              để tự hủy
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsModalOpen(true);
              setIsDropdownOpen(false);
            }}
            className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-xl font-bold text-xs sm:text-sm shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
          >
            Hủy đơn này
          </button>
        </div>
      ) : (
        <p className="text-xs sm:text-sm text-stone-600 italic flex items-center gap-2 leading-relaxed">
          <Clock className="w-4 h-4 text-stone-400 shrink-0" />
          <span>
            Đã hết hạn tự hủy (30 phút). Để đổi thông tin hoặc báo hủy, vui lòng gọi Hotline:{' '}
            <a href={`tel:${cleanPhone}`} className="font-bold text-amber-800 underline underline-offset-2">
              {hotline}
            </a>.
          </span>
        </p>
      )}

      {/* MODAL XÁC NHẬN HỦY DÀNH CHO KHÁCH */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/75 backdrop-blur-xs p-4 animate-fadeIn font-sans">
          <div className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-md border border-stone-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5 text-rose-700">
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                <h4 className="font-black text-base sm:text-lg text-stone-900">Xác Nhận Hủy Đơn</h4>
              </div>
              <span className="font-mono text-xs sm:text-sm text-amber-950 font-black bg-amber-100 px-2.5 py-1 rounded-xl border border-amber-300/60">
                {orderCode}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
              Bạn có chắc chắn muốn hủy đơn hàng này không? Sau khi hủy, hệ thống nhà vườn sẽ dừng chuẩn bị kiện hàng này.
            </p>

            {/* Lưu ý nếu đơn này đã được xác nhận cọc/tiền */}
            {isPrepaidOrVerified && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs sm:text-sm flex items-start gap-2.5 shadow-2xs">
                <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-normal">
                  Đơn hàng đã ghi nhận thanh toán/đặt cọc. Sau khi bấm hủy, bộ phận kế toán sẽ liên hệ số điện thoại của bạn để hoàn tiền.
                </span>
              </div>
            )}

            {/* CUSTOM DROPDOWN CHỌN LÝ DO */}
            <div className="space-y-1.5 text-xs sm:text-sm relative" ref={dropdownRef}>
              <label className="block text-xs font-bold text-stone-700">Lý do hủy đơn:</label>
              
              {/* Nút bấm kích hoạt Dropdown */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
                  isDropdownOpen
                    ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20'
                    : 'border-amber-400 bg-white hover:border-amber-500'
                }`}
              >
                <span className="font-semibold text-stone-900 text-xs sm:text-sm truncate pr-2">
                  {cancelReason}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180 text-amber-700' : ''
                  }`}
                />
              </button>

              {/* Menu danh sách các lý do xổ xuống */}
              {isDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden z-20 animate-fadeIn">
                  <div className="px-3.5 py-2 text-[10.5px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100 bg-stone-50/50">
                    Chọn lý do phù hợp:
                  </div>
                  <div className="max-h-56 overflow-y-auto p-1.5 space-y-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
                    {CANCEL_REASONS.map((reason) => {
                      const isSelected = cancelReason === reason;
                      return (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => {
                            setCancelReason(reason);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between text-xs sm:text-sm transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-amber-50 text-amber-950 font-bold'
                              : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900'
                          }`}
                        >
                          <span className="truncate">{reason}</span>
                          {isSelected && <Check className="w-4 h-4 text-amber-700 shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <input
                type="text"
                placeholder="Ghi chú thêm (không bắt buộc)..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full mt-2 p-3 rounded-2xl border border-stone-200 text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs"
              />
            </div>

            {errorMsg && (
              <p className="text-xs sm:text-sm text-rose-600 font-semibold flex items-center gap-1.5 pl-1 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </p>
            )}

            <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-2xl border border-stone-200 text-stone-700 font-bold text-xs sm:text-sm hover:bg-stone-50 cursor-pointer transition-colors"
              >
                Giữ đơn
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmCancel}
                className="flex-1 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang hủy...</span>
                  </>
                ) : (
                  'Xác nhận hủy'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}