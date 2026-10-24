// src/components/checkout/SelfCancelButton.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, AlertTriangle, Loader2, XCircle, PhoneCall, ShieldAlert } from 'lucide-react';
import { ORDER_STATUS, normalizeOrderStatus } from '../../constants/orderStatus';
import { orderService } from '../../services/orderService';
import { getRemainingCancelMs, formatCountdownTimer } from '../../utils/dateUtils';

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

  // Không hiển thị nếu đơn đã duyệt sang khâu đóng gói hoặc đã hủy/hoàn
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
    <div className="pt-2 font-sans">
      {remainingMs > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-1.5 text-amber-900 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin shrink-0" />
            <span>
              Đơn đang chờ duyệt. Còn{' '}
              <strong className="font-mono font-black text-amber-950 text-sm">
                {formatCountdownTimer(remainingMs)}
              </strong>{' '}
              để tự hủy
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-xl font-bold text-[11px] shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            Hủy đơn này
          </button>
        </div>
      ) : (
        <p className="text-[10.5px] text-stone-500 italic flex items-center gap-1">
          <Clock className="w-3 h-3 text-stone-400" />
          <span>
            Đã hết hạn tự hủy (30 phút). Để đổi thông tin hoặc báo hủy, vui lòng gọi Hotline:{' '}
            <a href={`tel:${cleanPhone}`} className="font-bold text-amber-800 underline">
              {hotline}
            </a>.
          </span>
        </p>
      )}

      {/* MODAL XÁC NHẬN HỦY DÀNH CHO KHÁCH */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 animate-fadeIn font-sans">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm border border-stone-200 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div className="flex items-center gap-2 text-rose-700">
                <XCircle className="w-5 h-5 shrink-0" />
                <h4 className="font-black text-sm text-stone-900">Xác Nhận Hủy Đơn</h4>
              </div>
              <span className="font-mono text-xs text-amber-900 font-bold bg-amber-100 px-2 py-0.5 rounded-md">
                {orderCode}
              </span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Bạn có chắc chắn muốn hủy đơn hàng này không? Sau khi hủy, hệ thống nhà vườn sẽ dừng chuẩn bị kiện hàng này.
            </p>

            {/* Lưu ý nếu đơn này đã được xác nhận cọc/tiền */}
            {isPrepaidOrVerified && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-[11px] flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Đơn hàng đã ghi nhận thanh toán/đặt cọc. Sau khi bấm hủy, bộ phận kế toán sẽ liên hệ số điện thoại của bạn để hoàn tiền.
                </span>
              </div>
            )}

            <div className="space-y-2 text-xs">
              <label className="block text-[11px] font-bold text-stone-700">Lý do hủy đơn:</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2 rounded-xl border border-stone-200 bg-stone-50 font-medium text-stone-800 focus:bg-white focus:outline-none focus:border-amber-600 cursor-pointer"
              >
                <option value="Đổi ý / Đặt nhầm sản phẩm">Đổi ý / Đặt nhầm sản phẩm</option>
                <option value="Trùng đơn hàng vừa đặt">Trùng đơn hàng vừa đặt</option>
                <option value="Muốn thay đổi địa chỉ hoặc số điện thoại">Muốn thay đổi địa chỉ hoặc số điện thoại</option>
                <option value="Bận việc đột xuất không nhận được">Bận việc đột xuất không nhận được</option>
                <option value="Lý do khác">Lý do khác</option>
              </select>

              <input
                type="text"
                placeholder="Ghi chú thêm (không bắt buộc)..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full p-2 rounded-xl border border-stone-200 text-stone-800 text-xs focus:outline-none focus:border-amber-600"
              />
            </div>

            {errorMsg && (
              <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2 rounded-xl border border-stone-200 text-stone-600 font-bold text-xs hover:bg-stone-50 cursor-pointer transition-colors"
              >
                Giữ đơn
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmCancel}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow-xs transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
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