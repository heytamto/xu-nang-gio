// src/pages/OrderLookupPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  PackageCheck,
  Clock,
  X,
  Copy,
  Check,
  Gift,
  PhoneCall,
  AlertCircle,
  Ban,
  Loader2,
  Star,
  CheckCircle,
  ShieldAlert,
  Camera,
  ZoomIn,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { ORDER_STATUS, ORDER_STATUS_MAP, normalizeOrderStatus } from '../constants/orderStatus';
import { supabase } from '../../../infrastructure/supabase/supabaseClient';
import { lookupOrderDirect, cancelOrderDirect } from '../services/orderService';
import { reviewRepo } from '../../../infrastructure/supabase/repositories/index';
import CustomDropdown from '../../../shared/components/CustomDropdown';
import {
  formatDateTime,
  isRecentOrder,
  getRemainingCancelMs,
  formatCountdownTimer,
} from '../../../shared/utils/dateUtils';
import OrderReviewModal from '../../reviews/components/OrderReviewModal';

const CANCEL_REASONS = [
  { value: 'Đổi ý / Không còn nhu cầu', label: 'Đổi ý / Không còn nhu cầu' },
  { value: 'Muốn đặt lại món khác / đổi số lượng', label: 'Muốn đặt lại món khác / đổi số lượng' },
  { value: 'Điền sai địa chỉ hoặc số điện thoại', label: 'Điền sai địa chỉ hoặc số điện thoại' },
  { value: 'Bận không đón được xe khách đúng giờ', label: 'Bận không đón được xe khách đúng giờ' },
  { value: 'Lý do khác', label: 'Lý do khác' },
];

export default function OrderLookupPage({
  shopConfig = {},
  initialCode = '',
  onNavigate,
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

  // Xem ảnh phóng to (Portal)
  const [previewImage, setPreviewImage] = useState(null);

  const [now, setNow] = useState(Date.now());
  const channelRef = useRef(null);

  // Đếm mỗi giây trên trang
  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Khóa cuộn trang nền khi mở Popup Hủy đơn hoặc Lightbox Phóng to ảnh
  useEffect(() => {
    if (!previewImage && !cancellingOrder) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (previewImage) setPreviewImage(null);
        else if (cancellingOrder && !isSubmittingCancel) setCancellingOrder(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewImage, cancellingOrder, isSubmittingCancel]);

  const hotline = shopConfig?.hotline || '0848.957.345';
  const cleanHotline = String(hotline).replace(/\D/g, '');
  const zaloPhone = String(shopConfig?.zaloPhone || cleanHotline || '0848957345').replace(/\D/g, '');

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  // Tra cứu đơn hàng & kiểm tra đơn nào đã từng review qua reviewRepo
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
        const allReviews = await reviewRepo.getAll();

        if (Array.isArray(allReviews) && allReviews.length > 0) {
          const matchingReviews = allReviews.filter((r) => codes.includes(r.order_code));
          if (matchingReviews.length > 0) {
            setReviewedCodes((prev) => {
              const nextSet = new Set(prev);
              matchingReviews.forEach((r) => nextSet.add(r.order_code));
              return nextSet;
            });
          }
        }
      }
    } catch (err) {
      console.error('Lỗi tra cứu:', err);
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
    if (initialCode) {
      const cleanInitial = String(initialCode).trim().replace(/\s+/g, '');
      setSearchTerm(cleanInitial);
      performLookup(cleanInitial);
    }
  }, [initialCode, performLookup]);

  // Tự động nhận trạng thái mới nhất qua WebSocket và Polling ngầm
  useEffect(() => {
    if (!Array.isArray(orders) || orders.length === 0) return;

    const activeOrderCodes = orders.map((o) => o.code).filter(Boolean);
    if (activeOrderCodes.length === 0) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const uniqueChannelKey = `lookup_page_orders_${Date.now()}`;
    const channel = supabase
      .channel(uniqueChannelKey)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const updatedRow = payload.new || payload.record;
          if (!updatedRow?.code || !activeOrderCodes.includes(updatedRow.code)) return;

          setOrders((prev) => {
            if (!prev) return prev;
            return prev.map((o) => {
              if (o.code === updatedRow.code) {
                return {
                  ...o,
                  ...updatedRow,
                  status: normalizeOrderStatus(updatedRow.status),
                  order_items: updatedRow.order_items || o.order_items || [],
                };
              }
              return o;
            });
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    const pollInterval = setInterval(async () => {
      try {
        const { data: freshOrders, error } = await supabase
          .from('orders')
          .select('*')
          .in('code', activeOrderCodes);

        if (!error && Array.isArray(freshOrders)) {
          setOrders((prev) => {
            if (!prev) return prev;
            return prev.map((curr) => {
              const matched = freshOrders.find((f) => f.code === curr.code);
              if (
                matched &&
                (matched.status !== curr.status || matched.payment_verified !== curr.payment_verified)
              ) {
                return {
                  ...curr,
                  ...matched,
                  status: normalizeOrderStatus(matched.status),
                };
              }
              return curr;
            });
          });
        }
      } catch (e) {
        console.warn('Lỗi đồng bộ ngầm:', e);
      }
    }, 3500);

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      clearInterval(pollInterval);
    };
  }, [orders?.length]);

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
        (prev || []).map((o) =>
          o.code === orderCode
            ? { ...o, status: ORDER_STATUS.CANCELLED, cancel_reason: cancelReason }
            : o
        )
      );

      const isPrepaid =
        ['deposit', 'full_qr'].includes(cancellingOrder.payment_method) ||
        String(cancellingOrder.payment_method || '').toLowerCase().includes('chuyển khoản') ||
        Boolean(cancellingOrder.payment_verified);

      if (isPrepaid) {
        setCancelSuccessNote(
          `Đơn ${orderCode} đã hủy thành công. Vui lòng liên hệ Hotline hoặc Zalo ${hotline} để kế toán hoàn tiền trong 24h.`
        );
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

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 font-sans text-stone-800 animate-fadeIn">
      {/* 1. HERO BANNER LỚN FULL-WIDTH */}
      <div className="relative w-full rounded-3xl overflow-hidden bg-stone-900 text-white p-7 sm:p-12 lg:p-14 border border-stone-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=80"
            alt="Hành trình nông sản Phan Rang"
            className="w-full h-full object-cover filter brightness-[0.38] contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/85 to-stone-900/45" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-stone-800/80 text-amber-300 border border-amber-400/30 backdrop-blur-md">
            <PackageCheck className="w-4 h-4 text-amber-400" />
            <span>Theo Dõi Hành Trình Kiện Hàng • Cập Nhật Trực Tiếp Từ Vườn</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15]">
            <span className="block text-white">Tra Cứu Đơn Hàng</span>
            <span className="block text-amber-400 mt-1">
              & Ảnh Đóng Thùng Thực Tế
            </span>
          </h1>

          <p className="text-sm sm:text-base text-stone-300 leading-relaxed max-w-xl">
            Nhập số điện thoại đặt hàng hoặc mã đơn <span className="font-mono text-amber-300 font-bold">XNG...</span> để kiểm tra tiến độ cắt giàn, xem ảnh chụp thùng xốp trước khi gửi nhà xe và quản lý đơn hàng.
          </p>
        </div>

        {/* Khối liên hệ nhanh bên phải Banner */}
        <div className="relative z-10 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
          <a
            href={`tel:${cleanHotline}`}
            className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md font-bold text-sm flex items-center justify-center gap-2.5 transition-all"
          >
            <PhoneCall className="w-4 h-4 text-amber-400" />
            <span>Hotline: {hotline}</span>
          </a>
          <a
            href={`https://zalo.me/${zaloPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <span>Nhắn Zalo Hỗ Trợ Nhà Vườn</span>
          </a>
        </div>
      </div>

      {/* 2. THANH TÌM KIẾM FULL-CONTAINER */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-3">
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="Nhập SĐT nhận hàng (VD: 0848957345) hoặc Mã đơn (VD: XNG261022-X31G)..."
              className="w-full h-12 sm:h-13 rounded-2xl border border-stone-200 bg-stone-50/70 focus:bg-white pl-12 pr-11 text-sm sm:text-base text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs font-mono uppercase tracking-wider transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setOrders(null);
                  setErrorMessage('');
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer p-1.5 rounded-full hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-12 sm:h-13 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black px-8 rounded-2xl text-sm sm:text-base flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md active:scale-95 cursor-pointer shrink-0"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            <span>{loading ? 'Đang tìm đơn...' : 'Tra Cứu Ngay'}</span>
          </button>
        </form>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {cancelSuccessNote && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 text-xs sm:text-sm flex items-start gap-2.5 shadow-2xs">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 stroke-[2.5]" />
            <p className="leading-relaxed font-medium">{cancelSuccessNote}</p>
          </div>
        )}
      </div>

      {/* 3. KẾT QUẢ TRA CỨU HOẶC GỢI Ý KHI CHƯA NHẬP */}
      {!orders && !loading && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-black text-stone-900 mb-4">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Quy trình xử lý đơn hàng tại Xứ Nắng Gió</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#FAF6F0] border border-stone-200/80 space-y-1.5">
              <div className="font-mono font-black text-xs text-amber-800 uppercase">
                Bước 01 • Chốt đơn & Cắt giàn
              </div>
              <div className="font-bold text-base text-stone-900">
                30 phút đổi ý linh hoạt
              </div>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Bạn có thể tự bấm hủy đơn ngay trên trang này trong vòng 30 phút đầu trước khi nhà vườn xuất vườn hái trái.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF6F0] border border-stone-200/80 space-y-1.5">
              <div className="font-mono font-black text-xs text-emerald-800 uppercase">
                Bước 02 • Đóng thùng xốp
              </div>
              <div className="font-bold text-base text-stone-900">
                Chụp ảnh thực tế kiện hàng
              </div>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Nhân viên đóng gói chụp ảnh cận cảnh từng lớp trái cây/hải sản và cập nhật trực tiếp lên mã đơn của bạn.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF6F0] border border-stone-200/80 space-y-1.5">
              <div className="font-mono font-black text-xs text-stone-700 uppercase">
                Bước 03 • Gửi xe khách trong đêm
              </div>
              <div className="font-bold text-base text-stone-900">
                Sáng hôm sau nhận hàng tươi
              </div>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Hàng rời Phan Rang lúc tối muộn và cập bến TP.HCM rạng sáng hôm sau để giữ trọn độ giòn ngọt nguyên bản.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DANH SÁCH ĐƠN HÀNG TÌM THẤY (DẠNG LƯỚI RỘNG RÃI) */}
      {Array.isArray(orders) && orders.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-bold text-stone-700">
              Tìm thấy <strong className="text-stone-950">{orders.length}</strong> đơn hàng phù hợp
            </span>
            <button
              type="button"
              onClick={() => onNavigate?.('shop')}
              className="text-xs sm:text-sm font-bold text-amber-800 hover:text-amber-950 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Tiếp tục mua sắm</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {orders.map((ord) => {
              const isNew = isRecentOrder(ord.created_at);
              const isCopied = copiedCode === ord.code;
              const hasPaymentGift =
                ord.payment_gift && ord.payment_gift !== 'Không áp dụng (COD)';
              const hasCampaignGifts = Boolean(
                ord.campaign_gifts && String(ord.campaign_gifts).trim()
              );

              const statusCode = normalizeOrderStatus(ord.status);
              const statusMeta =
                ORDER_STATUS_MAP[statusCode] || ORDER_STATUS_MAP[ORDER_STATUS.PENDING];

              const remainingCancelMs = getRemainingCancelMs(ord.created_at, now);
              const canCancelDirectly =
                statusCode === ORDER_STATUS.PENDING && remainingCancelMs > 0;
              const isCompleted = statusCode === ORDER_STATUS.COMPLETED;
              const hasAlreadyReviewed = reviewedCodes.has(ord.code);

              const displayTotal = Number(ord.final_total ?? ord.total ?? 0);
              const depositPaid = Number(ord.deposit_paid ?? 0);
              const remainingCod = Number(
                ord.remaining_cod ?? displayTotal - depositPaid
              );

              const packingImage =
                ord.packing_image_url ||
                ord.packed_image_url ||
                ord.packing_image ||
                (Array.isArray(ord.packing_photos) && ord.packing_photos[0]);

              const cardColorClass = isCompleted
                ? 'border-emerald-300 bg-white shadow-sm'
                : isNew
                  ? 'border-amber-300 bg-white shadow-sm'
                  : 'border-stone-200/90 bg-white shadow-xs';

              return (
                <div
                  key={ord.code}
                  className={`p-5 sm:p-7 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${cardColorClass}`}
                >
                  <div className="space-y-4">
                    {/* Top Bar: Mã đơn & Trạng thái */}
                    <div className="flex items-center justify-between gap-2 flex-wrap border-b border-stone-100 pb-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(ord.code)}
                          title="Nhấn để sao chép mã đơn"
                          className="group flex items-center gap-1.5 font-mono font-black text-xs sm:text-sm text-stone-900 bg-stone-50 hover:bg-amber-50 hover:text-amber-900 px-3 py-1.5 rounded-xl border border-stone-200 transition-colors shadow-2xs cursor-pointer"
                        >
                          <span>{ord.code}</span>
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-700" />
                          )}
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
                        ) : null}
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full font-bold text-xs border ${statusMeta.bg}`}
                      >
                        {statusMeta.label}
                      </span>
                    </div>

                    {/* Thông tin người nhận */}
                    <div className="text-xs sm:text-sm text-stone-700 leading-relaxed space-y-1 bg-[#FAF6F0] p-3.5 rounded-2xl border border-stone-200/70">
                      <div>
                        <strong>Người nhận:</strong> {ord.customer_name || ord.name} •{' '}
                        <span className="font-mono text-stone-900 font-bold">
                          {ord.phone}
                        </span>
                      </div>
                      <div>
                        <strong>Điểm giao:</strong> {ord.address}
                      </div>
                    </div>

                    {/* Danh sách sản phẩm */}
                    <div className="bg-stone-50/80 p-3.5 rounded-2xl border border-stone-200/80 text-xs sm:text-sm text-stone-700 space-y-2">
                      <span className="font-bold text-stone-500 text-xs uppercase tracking-wider block">
                        Sản phẩm trong kiện:
                      </span>
                      <div className="space-y-1.5">
                        {Array.isArray(ord.order_items) && ord.order_items.length > 0 ? (
                          ord.order_items.map((item, idx) => (
                            <div
                              key={item.id || idx}
                              className="leading-snug text-stone-800 font-medium"
                            >
                              • {item.name || item.title} ({item.weight_label || 'Tiêu chuẩn'}) x
                              {item.quantity}
                              {item.campaign_gift_title && (
                                <span className="text-xs text-amber-800 ml-1.5 font-normal">
                                  (🎁 {item.campaign_gift_title})
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-stone-600 text-xs italic">
                            {ord.items_summary ||
                              ord.itemsSummary ||
                              'Chi tiết các món theo kiện đóng gói'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quà tặng */}
                    {(hasPaymentGift || hasCampaignGifts) && (
                      <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-3.5 text-xs sm:text-sm text-amber-950 space-y-1.5">
                        <span className="font-bold uppercase text-xs text-amber-800 flex items-center gap-1.5">
                          <Gift className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>Quà tặng gửi kèm theo kiện:</span>
                        </span>
                        {hasPaymentGift && (
                          <div className="flex items-start gap-2 text-stone-800">
                            <span className="text-[11px] bg-amber-200 text-amber-950 font-bold px-2 py-0.5 rounded-md shrink-0">
                              Quà CK
                            </span>
                            <span className="leading-tight">{ord.payment_gift}</span>
                          </div>
                        )}
                        {hasCampaignGifts && (
                          <div className="flex items-start gap-2 text-stone-800">
                            <span className="text-[11px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-md shrink-0">
                              Combo
                            </span>
                            <span className="leading-tight">{ord.campaign_gifts}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* KHỐI ẢNH THỰC TẾ SAU ĐÓNG GÓI */}
                    {packingImage && (
                      <div className="bg-stone-900/5 border border-stone-200 rounded-2xl p-3.5 space-y-2.5 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                            <Camera className="w-4 h-4 text-amber-700 shrink-0" />
                            <span>Ảnh Thực Tế Sau Đóng Gói:</span>
                          </span>
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                            Đã kiểm tra thùng xốp
                          </span>
                        </div>

                        <div
                          onClick={() => setPreviewImage(packingImage)}
                          className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-100 aspect-16/9 max-h-56 group cursor-pointer shadow-2xs"
                          title="Bấm để xem ảnh phóng to"
                        >
                          <img
                            src={packingImage}
                            alt={`Ảnh đóng gói kiện đơn ${ord.code}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-stone-950/20 group-hover:bg-stone-950/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <span className="px-3.5 py-2 rounded-xl bg-white/95 backdrop-blur-xs text-stone-900 font-bold text-xs flex items-center gap-1.5 shadow-md">
                              <ZoomIn className="w-4 h-4 text-amber-700" />
                              <span>Xem ảnh phóng to</span>
                            </span>
                          </div>
                        </div>

                        {ord.packed_at && (
                          <p className="text-[11px] text-stone-500 font-mono">
                            Thời gian đóng thùng: {formatDateTime(ord.packed_at)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom Bar: Thanh toán, Thời gian & Nút Hủy/Đánh giá */}
                  <div className="space-y-3 pt-2">
                    <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/70 space-y-1.5 text-xs sm:text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-600">Tổng giá trị đơn:</span>
                        <strong className="text-stone-900 font-mono text-base font-black">
                          {displayTotal.toLocaleString('vi-VN')}đ
                        </strong>
                      </div>

                      {depositPaid > 0 && (
                        <div className="flex items-center justify-between text-emerald-800">
                          <span>Đã thanh toán / cọc:</span>
                          <strong className="font-mono font-bold">
                            -{depositPaid.toLocaleString('vi-VN')}đ
                          </strong>
                        </div>
                      )}

                      {remainingCod > 0 && (
                        <div className="flex items-center justify-between text-stone-700 pt-1.5 border-t border-stone-200/60">
                          <span>Cần gửi nhà xe khi nhận:</span>
                          <strong className="font-mono font-black text-amber-950 text-sm sm:text-base">
                            {remainingCod.toLocaleString('vi-VN')}đ
                          </strong>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-stone-500 px-1">
                      <span>Thời gian đặt:</span>
                      <span className="flex items-center gap-1.5 font-mono font-medium text-stone-600">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>{formatDateTime(ord.created_at)}</span>
                      </span>
                    </div>

                    {(canCancelDirectly || isCompleted) && (
                      <div className="pt-3 border-t border-stone-100 flex items-center justify-between w-full gap-2">
                        {canCancelDirectly && (
                          <>
                            <span className="text-xs text-amber-950 flex items-center gap-2 font-medium bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200/80">
                              <Clock className="w-4 h-4 text-amber-700 shrink-0 animate-spin" />
                              <span>
                                Đổi ý trong:{' '}
                                <strong className="font-mono font-black text-amber-950 text-sm">
                                  {formatCountdownTimer(remainingCancelMs)}
                                </strong>
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setCancellingOrder(ord);
                                setCancelReason('Đổi ý / Không còn nhu cầu');
                              }}
                              className="h-10 px-4 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1.5 active:scale-95"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Hủy đơn</span>
                            </button>
                          </>
                        )}

                        {isCompleted && (
                          <div className="flex items-center justify-between w-full gap-2">
                            <span className="text-xs sm:text-sm text-emerald-950 font-medium">
                              {hasAlreadyReviewed
                                ? 'Cảm ơn bạn đã gửi đánh giá!'
                                : 'Đơn hàng đã giao nhận thành công.'}
                            </span>
                            {!hasAlreadyReviewed ? (
                              <button
                                type="button"
                                onClick={() => setReviewOrderTarget(ord)}
                                className="h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer active:scale-95 inline-flex items-center gap-1.5 shrink-0"
                              >
                                <Star className="w-4 h-4 fill-stone-950" />
                                <span>Đánh giá đơn</span>
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1.5 rounded-xl border border-emerald-300 shrink-0">
                                <Check className="w-4 h-4 text-emerald-700 stroke-[3]" />
                                <span>Đã đánh giá</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Popup Xác Nhận Hủy (Render qua Portal ra document.body) */}
      {cancellingOrder &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-stone-950/75 backdrop-blur-xs p-4 sm:p-6 flex flex-col justify-center items-center animate-fadeIn text-stone-900">
            <div className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-lg border border-stone-200 shadow-2xl space-y-5 animate-scaleUp">
              <div className="flex items-center gap-3.5 border-b border-stone-100 pb-3.5">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                  <AlertCircle className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="font-black text-base sm:text-lg text-stone-900 tracking-tight">
                    Xác Nhận Hủy Đơn Hàng?
                  </h4>
                  <p className="font-mono text-xs text-stone-500 font-bold mt-0.5">
                    Mã đơn: #{cancellingOrder.code}
                  </p>
                </div>
              </div>

              <div className="text-xs sm:text-sm space-y-3.5 text-stone-600 leading-relaxed font-normal">
                <p>
                  Bạn có chắc chắn muốn hủy đơn hàng mã{' '}
                  <strong className="font-mono text-stone-900 font-black">
                    {cancellingOrder.code}
                  </strong>{' '}
                  không? Sau khi hủy, hệ thống nhà vườn sẽ dừng chuẩn bị kiện nông sản này.
                </p>

                {Boolean(cancellingOrder.payment_verified || cancellingOrder.deposit_paid > 0) && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs sm:text-sm flex items-start gap-2.5 shadow-2xs">
                    <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-medium">
                      Đơn đã ghi nhận thanh toán/cọc. Sau khi bấm hủy, vui lòng liên hệ Hotline{' '}
                      <strong>{hotline}</strong> để kế toán vườn hoàn tiền trong 24h.
                    </span>
                  </div>
                )}

                <div className="space-y-1.5 pt-1 text-left">
                  <label className="block text-xs font-bold text-stone-700">Lý do hủy đơn:</label>
                  <CustomDropdown
                    options={CANCEL_REASONS}
                    value={cancelReason}
                    onChange={(val) => setCancelReason(val)}
                    searchable={false}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  disabled={isSubmittingCancel}
                  onClick={() => setCancellingOrder(null)}
                  className="flex-1 h-11 rounded-2xl border border-stone-200 font-bold text-xs sm:text-sm text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Giữ lại đơn
                </button>
                <button
                  type="button"
                  disabled={isSubmittingCancel}
                  onClick={handleConfirmCancelOrder}
                  className="flex-1 h-11 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSubmittingCancel ? 'Đang xử lý...' : 'Xác nhận hủy'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modal Đánh giá đơn hàng */}
      {reviewOrderTarget && (
        <OrderReviewModal
          isOpen={Boolean(reviewOrderTarget)}
          order={reviewOrderTarget}
          onClose={() => setReviewOrderTarget(null)}
          onSuccess={(submittedCode) => {
            setReviewedCodes((prev) => new Set(prev).add(submittedCode));
            setReviewOrderTarget(null);
          }}
        />
      )}

      {/* Lightbox Phóng to ảnh đóng gói (Render qua Portal ra document.body) */}
      {previewImage &&
        createPortal(
          <div
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-[9999] bg-stone-950/90 backdrop-blur-sm p-4 sm:p-8 flex items-center justify-center animate-fadeIn cursor-zoom-out"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl w-full flex flex-col items-center cursor-default"
            >
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                aria-label="Đóng ảnh phóng to"
                className="self-end mb-3 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center font-bold transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="bg-white p-2 sm:p-3 rounded-2xl shadow-2xl border border-white/20 max-h-[82vh] flex items-center justify-center">
                <img
                  src={previewImage}
                  alt="Ảnh phóng to"
                  className="max-h-[76vh] w-auto rounded-xl object-contain"
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}