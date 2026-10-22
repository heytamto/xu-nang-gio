// src/components/OrderLookupModal.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, PackageCheck, Clock, X, Copy, Check, 
  Gift, PhoneCall, AlertCircle, Ban, Loader2, Star, CheckCircle 
} from 'lucide-react';
import { ORDER_STATUS, ORDER_STATUS_MAP, normalizeOrderStatus } from '../constants/orderStatus';
import { supabase } from '../supabaseClient';
import { lookupOrderDirect, cancelOrderDirect } from '../services/orderService';
import { 
  formatDateTime, 
  isRecentOrder, 
  getRemainingCancelMs, 
  formatCountdownTimer 
} from '../utils/dateUtils';
import OrderReviewModal from './OrderReviewModal';

export default function OrderLookupModal({ 
  isOpen, 
  onClose, 
  shopConfig = {}, 
  initialCode = '' 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Đổi ý / Không còn nhu cầu');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [cancelSuccessNote, setCancelSuccessNote] = useState('');

  // Quản lý Modal Đánh giá & Danh sách đơn đã gửi đánh giá (khóa không cho sửa)
  const [reviewOrderTarget, setReviewOrderTarget] = useState(null);
  const [reviewedCodes, setReviewedCodes] = useState(new Set());

  const [now, setNow] = useState(Date.now());
  const channelRef = useRef(null);

  // Đếm mỗi giây khi modal mở
  useEffect(() => {
    if (!isOpen) return;
    setNow(Date.now());
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const hotline = shopConfig?.hotline || '0848.957.345';
  const cleanHotline = String(hotline).replace(/\D/g, '');
  const zaloPhone = String(shopConfig?.zaloPhone || cleanHotline || '0848957345').replace(/\D/g, '');

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  // Tra cứu đơn hàng & kiểm tra đơn nào đã từng review trong DB
  const performLookup = useCallback(async (queryValue) => {
    setErrorMessage('');
    setCancelSuccessNote('');
    const rawVal = String(queryValue || '').trim().replace(/\s+/g, '');

    if (!rawVal) {
      setErrorMessage('Vui lòng nhập số điện thoại hoặc mã đơn hàng!');
      return;
    }

    const cleanDigits = rawVal.replace(/\D/g, '');
    const hasLetters = /[A-Z]/i.test(rawVal);
    const isPhoneSearch = !hasLetters && cleanDigits.length >= 8;

    if (!isPhoneSearch && rawVal.length < 4) {
      setErrorMessage('Vui lòng nhập tối thiểu 4 ký tự mã đơn hoặc 8 chữ số điện thoại!');
      return;
    }

    setLoading(true);

    try {
      const data = await lookupOrderDirect(rawVal);
      setOrders(data || []);
      if (!data || data.length === 0) {
        setErrorMessage('Không tìm thấy đơn hàng nào khớp với thông tin bạn nhập.');
      } else {
        // Kiểm tra xem các đơn này đã có trong bảng reviews chưa
        const codes = data.map((d) => d.code);
        const { data: revList } = await supabase
          .from('reviews')
          .select('order_code')
          .in('order_code', codes);

        if (Array.isArray(revList) && revList.length > 0) {
          setReviewedCodes((prev) => {
            const nextSet = new Set(prev);
            revList.forEach((r) => nextSet.add(r.order_code));
            return nextSet;
          });
        }
      }
    } catch (err) {
      console.error('Lỗi tra cứu Supabase:', err);
      setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLookup = (e) => {
    if (e) e.preventDefault();
    performLookup(searchTerm);
  };

  useEffect(() => {
    if (isOpen) {
      if (initialCode) {
        const cleanInitial = String(initialCode).trim().replace(/\s+/g, '');
        setSearchTerm(cleanInitial);
        performLookup(cleanInitial);
      } else if (!searchTerm) {
        setOrders(null);
        setErrorMessage('');
      }
    }
  }, [isOpen, initialCode, performLookup]);

  // Realtime Supabase
  useEffect(() => {
    if (!isOpen || !orders || orders.length === 0) return;

    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase
      .channel('public:orders:lookup-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const updatedRow = payload.new;
          if (!updatedRow?.code) return;

          setOrders((prev) => 
            prev ? prev.map((o) => (o.code === updatedRow.code ? { ...o, ...updatedRow } : o)) : prev
          );
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [isOpen, orders]);

  // Xác nhận hủy đơn
  const handleConfirmCancelOrder = async () => {
    if (!cancellingOrder) return;

    const remainingMs = getRemainingCancelMs(cancellingOrder.created_at, now);
    if (remainingMs <= 0) {
      alert('Đã qua thời gian 30 phút đổi ý, đơn hàng đã được lên lịch cắt giàn đóng thùng.');
      setCancellingOrder(null);
      return;
    }

    setIsSubmittingCancel(true);
    const orderCode = cancellingOrder.code;

    try {
      await cancelOrderDirect(orderCode, cancelReason);

      setOrders((prev) => 
        (prev || []).map((o) => (o.code === orderCode ? { ...o, status: ORDER_STATUS.CANCELLED, cancel_reason: cancelReason } : o))
      );

      const isPrepaid = ['deposit', 'full_qr'].includes(cancellingOrder.payment_method) || 
        String(cancellingOrder.payment_method || '').toLowerCase().includes('chuyển khoản');

      if (isPrepaid) {
        setCancelSuccessNote(`Đơn ${orderCode} đã hủy thành công. Vui lòng liên hệ Hotline/Zalo kèm mã đơn để hoàn tiền trong 24h.`);
      } else {
        setCancelSuccessNote(`Đơn hàng ${orderCode} đã được hủy thành công.`);
      }
    } catch (err) {
      alert('Không thể hủy đơn: ' + err.message);
    } finally {
      setIsSubmittingCancel(false);
      setCancellingOrder(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn font-sans">
        <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col relative">
          
          {/* Header */}
          <div className="flex justify-between items-center border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <PackageCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-stone-900 leading-tight">Tra Cứu Đơn Hàng</h3>
                <p className="text-[11px] text-stone-500">Tra cứu trực tiếp từ hệ thống vườn</p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={onClose} 
              className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 text-sm font-bold transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Search Input */}
          <form onSubmit={handleLookup} className="space-y-1.5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="VD: 0848957345 hoặc XNG261022-X31G"
                  className="w-full rounded-2xl border border-stone-200 pl-4 pr-9 py-2.5 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs font-mono uppercase tracking-wider"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-stone-900 hover:bg-amber-700 text-white font-bold px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-xs cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>{loading ? 'Đang tìm...' : 'Tra cứu'}</span>
              </button>
            </div>

            <p className="text-[11px] text-stone-400 px-1 font-sans">
              Gợi ý: Nhập số điện thoại người nhận hoặc mã đơn dạng <span className="font-mono text-stone-600 font-semibold">XNG...</span>
            </p>

            {errorMessage && (
              <p className="text-[11px] text-rose-600 font-semibold pl-1">{errorMessage}</p>
            )}

            {cancelSuccessNote && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs flex items-start gap-2 shadow-2xs">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium">{cancelSuccessNote}</p>
              </div>
            )}
          </form>

          {/* Kết quả danh sách đơn hàng */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
            {orders && orders.map((ord) => {
              const isNew = isRecentOrder(ord.created_at);
              const isCopied = copiedCode === ord.code;
              const hasPaymentGift = ord.payment_gift && ord.payment_gift !== 'Không áp dụng (COD)';
              const hasCampaignGifts = Boolean(ord.campaign_gifts && String(ord.campaign_gifts).trim());

              const statusCode = normalizeOrderStatus(ord.status);
              const statusMeta = ORDER_STATUS_MAP[statusCode] || ORDER_STATUS_MAP[ORDER_STATUS.PENDING];
              
              const remainingCancelMs = getRemainingCancelMs(ord.created_at, now);
              const canCancelDirectly = statusCode === ORDER_STATUS.PENDING && remainingCancelMs > 0;
              const isCompleted = statusCode === ORDER_STATUS.COMPLETED;
              const hasAlreadyReviewed = reviewedCodes.has(ord.code);

              const displayTotal = Number(ord.final_total ?? ord.total ?? 0);

              // Tùy biến màu thẻ đơn hàng:
              // - Đơn hoàn thành: Tông emerald/xanh ngọc trang nhã
              // - Đơn mới: Tông emerald sáng
              // - Các đơn khác: Tông stone trung tính
              const cardColorClass = isCompleted 
                ? 'border-emerald-300 bg-emerald-50/40 shadow-xs' 
                : isNew 
                ? 'border-emerald-300 bg-emerald-50/20 shadow-2xs' 
                : 'border-stone-200 bg-stone-50/50';

              return (
                <div 
                  key={ord.code} 
                  className={`p-4 rounded-2xl border transition-all space-y-2.5 ${cardColorClass}`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(ord.code)}
                        title="Nhấn để sao chép mã đơn"
                        className="group flex items-center gap-1.5 font-mono font-black text-xs sm:text-sm text-stone-900 bg-white hover:bg-amber-50 hover:text-amber-900 px-2 py-0.5 rounded-lg border border-stone-200 transition-colors shadow-2xs cursor-pointer"
                      >
                        <span>{ord.code}</span>
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-700" />}
                      </button>

                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Giao thành công
                        </span>
                      ) : isNew ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                          Đơn mới
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-200/70 text-stone-600">
                          Đơn cũ
                        </span>
                      )}
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${statusMeta.bg}`}>
                      {statusMeta.label}
                    </span>
                  </div>

                  <div className="text-[11.5px] text-stone-600 leading-snug">
                    <div><strong>Người nhận:</strong> {ord.customer_name || ord.name} • <span className="font-mono text-stone-800 font-semibold">{ord.phone}</span></div>
                    <div className="truncate"><strong>Điểm giao:</strong> {ord.address}</div>
                  </div>

                  {/* Danh sách sản phẩm */}
                  <div className="bg-white/80 p-2.5 rounded-xl border border-stone-200/70 text-xs text-stone-700 space-y-1">
                    <span className="font-bold text-stone-500 text-[10px] uppercase block">Sản phẩm:</span>
                    <div className="space-y-1">
                      {Array.isArray(ord.order_items) && ord.order_items.length > 0 ? (
                        ord.order_items.map((item, idx) => (
                          <div key={item.id || idx} className="leading-snug text-stone-800 font-medium">
                            • {item.name} ({item.weight_label || 'Tiêu chuẩn'}) x{item.quantity}
                            {item.campaign_gift_title && (
                              <span className="text-[11px] text-amber-700 ml-1.5 font-normal">
                                (🎁 {item.campaign_gift_title})
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-stone-600 text-[11.5px] italic">
                          {ord.items_summary || ord.itemsSummary || 'Chi tiết các món theo kiện đóng gói'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quà tặng */}
                  {(hasPaymentGift || hasCampaignGifts) && (
                    <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-2.5 text-[11.5px] text-amber-950 space-y-1">
                      <span className="font-bold uppercase text-[10px] text-amber-800 flex items-center gap-1">
                        <Gift className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Quà tặng gửi kèm theo kiện:</span>
                      </span>
                      {hasPaymentGift && (
                        <div className="flex items-start gap-1.5 text-stone-800">
                          <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.2 rounded shrink-0">Quà CK</span>
                          <span className="leading-tight">{ord.payment_gift}</span>
                        </div>
                      )}
                      {hasCampaignGifts && (
                        <div className="flex items-start gap-1.5 text-stone-800">
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded shrink-0">Combo</span>
                          <span className="leading-tight">{ord.campaign_gifts}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-stone-500 pt-1 border-t border-stone-200/50">
                    <span>Tổng thanh toán: <strong className="text-amber-800 font-mono font-bold text-sm">{displayTotal.toLocaleString('vi-VN')} đ</strong></span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>{formatDateTime(ord.created_at)}</span>
                    </span>
                  </div>

                  {/* Khu vực Hủy đơn (30p đầu) HOẶC Đánh giá đơn (Hoàn thành) */}
                  {(canCancelDirectly || isCompleted) && (
                    <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between w-full gap-2">
                      {canCancelDirectly && (
                        <>
                          <span className="text-[11px] text-amber-900 flex items-center gap-1.5 font-medium bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/70">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-spin" />
                            <span>Đổi ý hủy đơn trong: <strong className="font-mono font-black text-amber-950 text-xs">{formatCountdownTimer(remainingCancelMs)}</strong></span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setCancellingOrder(ord);
                              setCancelReason('Đổi ý / Không còn nhu cầu');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition-all cursor-pointer shadow-2xs"
                          >
                            <Ban className="w-3 h-3" />
                            <span>Hủy đơn</span>
                          </button>
                        </>
                      )}

                      {isCompleted && (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] text-emerald-900 font-medium">
                            {hasAlreadyReviewed 
                              ? 'Bạn đã gửi đánh giá cho đơn này' 
                              : 'Đơn hàng đã được giao nhận thành công.'}
                          </span>
                          {!hasAlreadyReviewed ? (
                            <button
                              type="button"
                              onClick={() => setReviewOrderTarget(ord)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
                            >
                              <Star className="w-3.5 h-3.5 fill-stone-950" />
                              <span>Đánh giá đơn hàng</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-xl border border-emerald-300">
                              <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                              <span>Đã gửi đánh giá</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2 text-xs">
            <span className="text-stone-500 text-[11px] font-medium hidden sm:inline">
              Cần hỗ trợ về đơn hàng?
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a href={`tel:${cleanHotline}`} className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 text-stone-800 font-bold text-xs border border-stone-200/80">
                <PhoneCall className="w-3.5 h-3.5 text-amber-700" />
                <span>{hotline}</span>
              </a>
              <a href={`https://zalo.me/${zaloPhone}`} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs">
                <span>Zalo</span>
              </a>
            </div>
          </div>

          {/* Popup Xác Nhận Hủy */}
          {cancellingOrder && (
            <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-xs rounded-3xl p-5 flex flex-col justify-center items-center z-20 animate-fadeIn text-stone-900">
              <div className="bg-white rounded-2xl p-5 w-full max-w-sm border border-stone-200 shadow-2xl space-y-4">
                <div className="flex items-center gap-2.5 text-rose-600 border-b border-stone-100 pb-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <h4 className="font-bold text-sm text-stone-900">Xác Nhận Hủy Đơn Hàng?</h4>
                </div>
                <div className="text-xs space-y-2 text-stone-600 leading-relaxed">
                  <p>Bạn có chắc chắn muốn hủy đơn hàng mã <strong className="font-mono text-stone-900 font-bold">{cancellingOrder.code}</strong> không?</p>
                  <div className="space-y-1 pt-1">
                    <label className="block text-[11px] font-bold text-stone-700">Lý do hủy đơn:</label>
                    <select
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-stone-200 bg-stone-50 font-medium"
                    >
                      <option value="Đổi ý / Không còn nhu cầu">Đổi ý / Không còn nhu cầu</option>
                      <option value="Muốn đặt lại món khác / đổi số lượng">Muốn đặt lại món khác / đổi số lượng</option>
                      <option value="Điền sai địa chỉ hoặc số điện thoại">Điền sai địa chỉ hoặc số điện thoại</option>
                      <option value="Bận không đón được xe khách đúng giờ">Bận không đón được xe khách đúng giờ</option>
                      <option value="Lý do khác">Lý do khác</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button type="button" disabled={isSubmittingCancel} onClick={() => setCancellingOrder(null)} className="flex-1 py-2 rounded-xl border border-stone-200 font-bold text-xs text-stone-700">
                    Không, giữ lại
                  </button>
                  <button type="button" disabled={isSubmittingCancel} onClick={handleConfirmCancelOrder} className="flex-1 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5">
                    {isSubmittingCancel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Xác nhận hủy</span>}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modal Đánh giá đơn hàng */}
      {reviewOrderTarget && (
        <OrderReviewModal
          isOpen={Boolean(reviewOrderTarget)}
          onClose={() => setReviewOrderTarget(null)}
          initialOrderCode={reviewOrderTarget.code}
          initialPhone={reviewOrderTarget.phone}
          initialCustomerName={reviewOrderTarget.customer_name || reviewOrderTarget.name || ''}
          initialEmail={reviewOrderTarget.email || ''}
          onReviewSuccess={({ orderCode }) => {
            setReviewedCodes((prev) => new Set([...prev, orderCode]));
          }}
        />
      )}
    </>
  );
}