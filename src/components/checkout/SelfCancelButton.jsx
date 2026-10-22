// src/components/checkout/SelfCancelButton.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, AlertTriangle, Loader2, XCircle } from 'lucide-react';
import { ORDER_STATUS, normalizeOrderStatus } from '../../constants/orderStatus';
import { orderService } from '../../services/orderService';

function parseOrderTimestamp(dateStr) {
  if (!dateStr) return 0;
  if (dateStr instanceof Date) return dateStr.getTime();
  let str = String(dateStr).trim().replace(/\s*\(.*?\)\s*/g, '');
  if (str.includes('/')) {
    const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}):(\d{1,2}))?/);
    if (match) {
      const [, d, m, y, hr = '0', min = '0', sec = '0'] = match;
      return new Date(Number(y), Number(m) - 1, Number(d), Number(hr), Number(min), Number(sec)).getTime();
    }
  }
  const t = new Date(str).getTime();
  return isNaN(t) ? 0 : t;
}

export default function SelfCancelButton({
  order,
  onCancelSuccess,
  hotline = '0848.957.345',
}) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Đổi ý / Đặt nhầm sản phẩm');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const orderTimestamp = useMemo(() => {
    return parseOrderTimestamp(order?.created_at || order?.createdAt);
  }, [order?.created_at, order?.createdAt]);

  const currentStatus = normalizeOrderStatus(order?.status);
  const isPending = currentStatus === ORDER_STATUS.PENDING;

  // Cập nhật bộ đếm lùi 30 phút mỗi giây
  useEffect(() => {
    if (!orderTimestamp || !isPending) {
      setTimeLeft(0);
      return;
    }

    const checkTime = () => {
      const now = Date.now();
      const elapsed = now - orderTimestamp;
      const remaining = 30 * 60 * 1000 - elapsed;
      setTimeLeft(remaining > 0 ? remaining : 0);
    };

    checkTime();
    const timer = setInterval(checkTime, 1000);
    return () => clearInterval(timer);
  }, [orderTimestamp, isPending]);

  // Không hiển thị nếu đơn đã duyệt sang khâu đóng gói hoặc đã hủy/hoàn
  if (!isPending) return null;

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const orderCode = order?.code || order?.orderId;

  const handleConfirmCancel = async () => {
    setIsSubmitting(true);
    setErrorMsg('');

    const finalReason = customReason.trim() 
      ? `${cancelReason} (${customReason.trim()})`
      : cancelReason;

    try {
      // Gọi service cập nhật trực tiếp qua Supabase RPC / Update
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
      {timeLeft > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs">
          <div className="flex items-center gap-1.5 text-amber-900 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            <span>Đơn đang chờ hái. Còn <strong className="font-mono font-black text-amber-950 text-sm">{timeFormatted}</strong> để tự hủy</span>
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
        <p className="text-[10.5px] text-stone-500 italic">
          ⏳ Đã hết hạn tự hủy (30 phút). Để đổi thông tin hoặc hủy đơn, vui lòng gọi Hotline:{' '}
          <a href={`tel:${hotline.replace(/\./g, '')}`} className="font-bold text-amber-800 underline">
            {hotline}
          </a>.
        </p>
      )}

      {/* MODAL XÁC NHẬN HỦY DÀNH CHO KHÁCH */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm border border-stone-200 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div className="flex items-center gap-2 text-rose-700">
                <XCircle className="w-5 h-5" />
                <h4 className="font-black text-sm text-stone-900">Xác Nhận Hủy Đơn</h4>
              </div>
              <span className="font-mono text-xs text-amber-900 font-bold bg-amber-100 px-2 py-0.5 rounded-md">
                {orderCode}
              </span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Bạn có chắc chắn muốn hủy đơn hàng này không? Sau khi hủy, hệ thống nhà vườn sẽ dừng chuẩn bị kiện hàng này.
            </p>

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
                className="flex-1 py-2 rounded-xl border border-stone-200 text-stone-600 font-bold text-xs hover:bg-stone-50 cursor-pointer"
              >
                Giữ đơn
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmCancel}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow-xs"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}