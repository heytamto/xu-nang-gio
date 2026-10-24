// src/components/OrderLookupModal.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, PackageCheck, Clock, X, Copy, Check, 
  Gift, PhoneCall, AlertCircle, Ban, Loader2, Star, CheckCircle, ShieldAlert 
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

  // Quản lý Modal Đánh giá & Danh sách đơn đã gửi đánh giá
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
        String(cancellingOrder.payment_method || '').toLowerCase().includes('chuyển khoản') ||
        Boolean(cancellingOrder.payment_verified);

      if (isPrepaid) {
        setCancelSuccessNote(`Đơn ${orderCode} đã hủy thành công. Vui lòng liên hệ Hotline hoặc Zalo ${hotline} để kế toán hoàn tiền trong 24h.`);
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn font-sans text-stone-800">
        <div className="w-full max-w-xl rounded-3xl bg-white p-5 sm:p-7 shadow-2xl space-y-4 max-h-[90vh] flex flex-col relative border border-stone-200/90">
          
          {/* Header */}
          <div className="flex justify-between items-center border-b border-stone-100 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg sm:text-xl text-stone-900 leading-tight">Tra Cứu Đơn Hàng</h3>
                <p className="text-xs sm:text-sm text-stone-500 font-normal">Tra cứu trực tiếp từ hệ thống vườn</p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={onClose} 
              className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 text-sm font-bold transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Search Input */}
          <form onSubmit={handleLookup} className="space-y-2">
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
                  className="w-full rounded-2xl border border-stone-200 pl-4 pr-10 py-3 text-sm sm:text-base text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs font-mono uppercase tracking-wider"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-stone-900 hover:bg-amber-800 text-white font-bold px-5 sm:px-6 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2 transition-all disabled:opacity-50 shadow-xs cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>{loading ? 'Đang tìm...' : 'Tra cứu'}</span>
              </button>
            </div>

            <p className="text-xs text-stone-500 px-1 font-sans">
              Gợi ý: Nhập số điện thoại người nhận hoặc mã đơn dạng <span className="font-mono text-stone-700 font-bold">XNG...</span>
            </p>

            {errorMessage && (
              <p className="text-xs sm:text-sm text-rose-600 font-semibold pl-1">{errorMessage}</p>
            )}

            {cancelSuccessNote && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 text-xs sm:text-sm flex items-start gap-2.5 shadow-2xs">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 stroke-[2.5]" />
                <p className="leading-relaxed font-medium">{cancelSuccessNote}</p>
              </div>
            )}
          </form>

          {/* Kết quả danh sách đơn hàng */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
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
              const depositPaid = Number(ord.deposit_paid ?? 0);
              const remainingCod = Number(ord.remaining_cod ?? (displayTotal - depositPaid));

              const cardColorClass = isCompleted 
                ? 'border-emerald-300 bg-emerald-50/40 shadow-xs' 
                : isNew 
                ? 'border-emerald-300 bg-emerald-50/20 shadow-2xs' 
                : 'border-stone-200 bg-stone-50/60';

              return (
                <div 
                  key={ord.code} 
                  className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${cardColorClass}`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(ord.code)}
                        title="Nhấn để sao chép mã đơn"
                        className="group flex items-center gap-1.5 font-mono font-black text-xs sm:text-sm text-stone-900 bg-white hover:bg-amber-50 hover:text-amber-900 px-2.5 py-1 rounded-xl border border-stone-200 transition-colors shadow-2xs cursor-pointer"
                      >
                        <span>{ord.code}</span>
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-700" />}
                      </button>

                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Giao thành công
                        </span>
                      ) : isNew ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          Đơn mới
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-stone-200/80 text-stone-700">
                          Đơn cũ
                        </span>
                      )}
                    </div>

                    <span className={`px-3 py-1 rounded-full font-bold text-xs border ${statusMeta.bg}`}>
                      {statusMeta.label}
                    </span>
                  </div>

                  <div className="text-xs sm:text-sm text-stone-700 leading-relaxed space-y-0.5">
                    <div><strong>Người nhận:</strong> {ord.customer_name || ord.name} • <span className="font-mono text-stone-900 font-bold">{ord.phone}</span></div>
                    <div className="truncate"><strong>Điểm giao:</strong> {ord.address}</div>
                  </div>

                  {/* Danh sách sản phẩm */}
                  <div className="bg-white/90 p-3 rounded-2xl border border-stone-200/80 text-xs sm:text-sm text-stone-700 space-y-1.5 shadow-2xs">
                    <span className="font-bold text-stone-500 text-xs uppercase tracking-wider block">Sản phẩm trong kiện:</span>
                    <div className="space-y-1">
                      {Array.isArray(ord.order_items) && ord.order_items.length > 0 ? (
                        ord.order_items.map((item, idx) => (
                          <div key={item.id || idx} className="leading-snug text-stone-800 font-medium">
                            • {item.name || item.title} ({item.weight_label || 'Tiêu chuẩn'}) x{item.quantity}
                            {item.campaign_gift_title && (
                              <span className="text-xs text-amber-800 ml-1.5 font-normal">
                                (🎁 {item.campaign_gift_title})
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-stone-600 text-xs italic">
                          {ord.items_summary || ord.itemsSummary || 'Chi tiết các món theo kiện đóng gói'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quà tặng */}
                  {(hasPaymentGift || hasCampaignGifts) && (
                    <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-3 text-xs sm:text-sm text-amber-950 space-y-1.5 shadow-2xs">
                      <span className="font-bold uppercase text-xs text-amber-800 flex items-center gap-1.5">
                        <Gift className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Quà tặng gửi kèm theo kiện:</span>
                      </span>
                      {hasPaymentGift && (
                        <div className="flex items-start gap-2 text-stone-800">
                          <span className="text-[11px] bg-amber-200 text-amber-950 font-bold px-2 py-0.5 rounded-md shrink-0">Quà CK</span>
                          <span className="leading-tight">{ord.payment_gift}</span>
                        </div>
                      )}
                      {hasCampaignGifts && (
                        <div className="flex items-start gap-2 text-stone-800">
                          <span className="text-[11px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-md shrink-0">Combo</span>
                          <span className="leading-tight">{ord.campaign_gifts}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Chi tiết thanh toán & cọc */}
                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/70 space-y-1.5 text-xs sm:text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-600 font-normal">Tổng giá trị đơn:</span>
                      <strong className="text-stone-900 font-mono text-base font-black">{displayTotal.toLocaleString('vi-VN')}đ</strong>
                    </div>

                    {depositPaid > 0 && (
                      <div className="flex items-center justify-between text-emerald-800 text-xs sm:text-sm">
                        <span>Đã thanh toán / cọc:</span>
                        <strong className="font-mono font-bold">-{depositPaid.toLocaleString('vi-VN')}đ</strong>
                      </div>
                    )}

                    {remainingCod > 0 && (
                      <div className="flex items-center justify-between text-stone-700 text-xs sm:text-sm pt-1.5 border-t border-stone-200/60">
                        <span>Cần gửi nhà xe khi nhận:</span>
                        <strong className="font-mono font-black text-amber-950 text-sm sm:text-base">{remainingCod.toLocaleString('vi-VN')}đ</strong>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                    <span className="text-xs text-stone-500 font-normal">Thời gian đặt:</span>
                    <span className="flex items-center gap-1.5 text-xs font-mono font-medium text-stone-600">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>{formatDateTime(ord.created_at)}</span>
                    </span>
                  </div>

                  {/* Khu vực Hủy đơn (30p đầu) HOẶC Đánh giá đơn (Hoàn thành) */}
                  {(canCancelDirectly || isCompleted) && (
                    <div className="pt-2.5 border-t border-stone-200/60 flex items-center justify-between w-full gap-2">
                      {canCancelDirectly && (
                        <>
                          <span className="text-xs text-amber-950 flex items-center gap-2 font-medium bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200/80">
                            <Clock className="w-4 h-4 text-amber-700 shrink-0 animate-spin" />
                            <span>Đổi ý hủy đơn trong: <strong className="font-mono font-black text-amber-950 text-sm">{formatCountdownTimer(remainingCancelMs)}</strong></span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setCancellingOrder(ord);
                              setCancelReason('Đổi ý / Không còn nhu cầu');
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-2xs"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Hủy đơn</span>
                          </button>
                        </>
                      )}

                      {isCompleted && (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs sm:text-sm text-emerald-950 font-medium">
                            {hasAlreadyReviewed 
                              ? 'Bạn đã gửi đánh giá cho đơn này' 
                              : 'Đơn hàng đã được giao nhận thành công.'}
                          </span>
                          {!hasAlreadyReviewed ? (
                            <button
                              type="button"
                              onClick={() => setReviewOrderTarget(ord)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer active:scale-95"
                            >
                              <Star className="w-4 h-4 fill-stone-950" />
                              <span>Đánh giá đơn hàng</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1.5 rounded-xl border border-emerald-300">
                              <Check className="w-4 h-4 text-emerald-700 stroke-[3]" />
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
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3 text-xs sm:text-sm">
            <span className="text-stone-500 text-xs font-medium hidden sm:inline">
              Cần hỗ trợ về đơn hàng?
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a href={`tel:${cleanHotline}`} className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-100 text-stone-800 font-bold text-xs sm:text-sm border border-stone-200/80 hover:bg-stone-200 transition-colors">
                <PhoneCall className="w-4 h-4 text-amber-700" />
                <span>{hotline}</span>
              </a>
              <a href={`https://zalo.me/${zaloPhone}`} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-colors">
                <span>Zalo</span>
              </a>
            </div>
          </div>

          {/* Popup Xác Nhận Hủy */}
          {cancellingOrder && (
            <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-xs rounded-3xl p-5 flex flex-col justify-center items-center z-20 animate-fadeIn text-stone-900">
              <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-stone-200 shadow-2xl space-y-4">
                <div className="flex items-center gap-3 text-rose-600 border-b border-stone-100 pb-3.5">
                  <AlertCircle className="w-6 h-6 shrink-0" />
                  <h4 className="font-black text-base text-stone-900">Xác Nhận Hủy Đơn Hàng?</h4>
                </div>
                <div className="text-xs sm:text-sm space-y-3 text-stone-600 leading-relaxed">
                  <p>Bạn có chắc chắn muốn hủy đơn hàng mã <strong className="font-mono text-stone-900 font-bold">{cancellingOrder.code}</strong> không?</p>
                  
                  {Boolean(cancellingOrder.payment_verified || cancellingOrder.deposit_paid > 0) && (
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <span>
                        Đơn đã ghi nhận thanh toán/cọc. Sau khi bấm hủy, vui lòng liên hệ Hotline <strong>{hotline}</strong> để kế toán vườn hoàn tiền.
                      </span>
                    </div>
                  )}

                  <div className="space-y-1.5 pt-1">
                    <label className="block text-xs font-bold text-stone-700">Lý do hủy đơn:</label>
                    <select
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-medium cursor-pointer focus:outline-none focus:border-amber-600"
                    >
                      <option value="Đổi ý / Không còn nhu cầu">Đổi ý / Không còn nhu cầu</option>
                      <option value="Muốn đặt lại món khác / đổi số lượng">Muốn đặt lại món khác / đổi số lượng</option>
                      <option value="Điền sai địa chỉ hoặc số điện thoại">Điền sai địa chỉ hoặc số điện thoại</option>
                      <option value="Bận không đón được xe khách đúng giờ">Bận không đón được xe khách đúng giờ</option>
                      <option value="Lý do khác">Lý do khác</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button type="button" disabled={isSubmittingCancel} onClick={() => setCancellingOrder(null)} className="flex-1 py-2.5 rounded-xl border border-stone-200 font-bold text-xs sm:text-sm text-stone-700 hover:bg-stone-50 cursor-pointer">
                    Không, giữ lại
                  </button>
                  <button type="button" disabled={isSubmittingCancel} onClick={handleConfirmCancelOrder} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs">
                    {isSubmittingCancel ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Xác nhận hủy</span>}
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