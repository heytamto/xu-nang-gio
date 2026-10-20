import React, { useState, useEffect } from 'react';
import { 
  Search, PackageCheck, Clock, X, Copy, Check, 
  Gift, PhoneCall, MessageCircle, Headphones, AlertCircle, Ban, Loader2 
} from 'lucide-react';
import { ORDER_STATUS, ORDER_STATUS_MAP, normalizeOrderStatus } from '../constants/orderStatus';

// Hàm parse chuỗi ngày giờ linh hoạt (hỗ trợ dd/MM/yyyy HH:mm:ss và ISO)
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

export default function OrderLookupModal({ isOpen, onClose, shopConfig = {} }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  // State phục vụ modal xác nhận hủy đơn
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Đổi ý / Không còn nhu cầu');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [cancelSuccessNote, setCancelSuccessNote] = useState('');

  // Tick cập nhật thời gian mỗi giây cho bộ đếm 30 phút
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const hotline = shopConfig?.hotline || '0848.957.345';
  const cleanHotline = String(hotline).replace(/[^0-9]/g, '');
  const zaloPhone = String(shopConfig?.zaloPhone || cleanHotline || '0848957345').replace(/[^0-9]/g, '');

  // Tính số mili-giây còn lại trong mốc 30 phút đổi ý
  const getRemainingCancelTime = (createdAtStr) => {
    const orderTime = parseOrderTimestamp(createdAtStr);
    if (!orderTime) return 0;
    const elapsed = now - orderTime;
    const remaining = 30 * 60 * 1000 - elapsed;
    return remaining > 0 ? remaining : 0;
  };

  const formatRemainingTimer = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const checkIsNew = (createdAtStr) => {
    const t = parseOrderTimestamp(createdAtStr);
    return t > 0 && (Date.now() - t) <= 24 * 60 * 60 * 1000;
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode('');
    }, 2000);
  };

  const getOrderTotalDisplay = (ord) => {
    const rawVal = ord.total ?? ord.totalAmount ?? ord.tongTien ?? ord.amount ?? ord.rawTotal;
    
    if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
      if (typeof rawVal === 'number' && rawVal > 0) {
        return `${rawVal.toLocaleString('vi-VN')} đ`;
      }
      const cleanNum = Number(String(rawVal).replace(/[^0-9]/g, ''));
      if (!isNaN(cleanNum) && cleanNum > 0) {
        return `${cleanNum.toLocaleString('vi-VN')} đ`;
      }
    }

    if (Array.isArray(ord.cart) && ord.cart.length > 0) {
      const calc = ord.cart.reduce((sum, it) => sum + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0);
      if (calc > 0) return `${calc.toLocaleString('vi-VN')} đ`;
    }

    if (ord.itemsSummary) {
      const matches = [...String(ord.itemsSummary).matchAll(/([0-9.]+)\s*đ?\s*x\s*(\d+)/gi)];
      if (matches.length > 0) {
        let sum = 0;
        matches.forEach(m => {
          const price = Number(m[1].replace(/\./g, '')) || 0;
          const qty = Number(m[2]) || 1;
          sum += price * qty;
        });
        if (sum > 0) return `${sum.toLocaleString('vi-VN')} đ`;
      }
    }

    return 'Liên hệ nhà vườn';
  };

  const formatDateTime = (str) => {
    if (!str) return 'Gần đây';
    try {
      const d = new Date(str);
      if (isNaN(d.getTime())) return String(str).split('T')[0];
      const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      return `${date} ${time}`;
    } catch {
      return String(str);
    }
  };

  const handleLookup = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setCancelSuccessNote('');
    const rawVal = searchTerm.trim();

    if (!rawVal) {
      setErrorMessage("Vui lòng nhập số điện thoại hoặc mã đơn hàng!");
      return;
    }

    const cleanDigits = rawVal.replace(/\D/g, '');
    const isPhoneSearch = cleanDigits.length >= 8;

    if (!isPhoneSearch && rawVal.length < 4) {
      setErrorMessage("Vui lòng nhập tối thiểu 4 ký tự mã đơn hoặc 9 chữ số điện thoại!");
      return;
    }

    setLoading(true);
    let matchedList = [];

    // 1. Kiểm tra trong LocalStorage
    try {
      const localOrders = JSON.parse(localStorage.getItem('shop_orders') || '[]');
      const localMatches = localOrders.filter(ord => {
        const ordCode = String(ord.code || '').trim().toLowerCase();
        const ordPhone = String(ord.phone || ord.customer?.phone || '').replace(/\D/g, '');
        
        if (isPhoneSearch && ordPhone) {
          return ordPhone.endsWith(cleanDigits.slice(-8)) || cleanDigits.endsWith(ordPhone.slice(-8));
        }
        return ordCode.includes(rawVal.toLowerCase());
      });
      matchedList = [...localMatches];
    } catch (err) {
      console.warn("Lỗi đọc local:", err);
    }

    // 2. Tra cứu trực tiếp trên Google Sheet Webhook
    try {
      const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
      if (webhookUrl) {
        const res = await fetch(`${webhookUrl}${webhookUrl.includes('?') ? '&' : '?'}action=lookup_orders&query=${encodeURIComponent(rawVal)}`);
        const data = await res.json();
        
        if (data.status === 'success' && Array.isArray(data.orders)) {
          const orderMap = new Map();
          data.orders.forEach(o => { if (o && o.code) orderMap.set(o.code, o); });
          matchedList.forEach(o => { if (o && o.code) orderMap.set(o.code, o); });
          matchedList = Array.from(orderMap.values());
        }
      }
    } catch (err) {
      console.warn("Không kết nối được Sheet, hiển thị từ Local:", err);
    } finally {
      setLoading(false);
      setOrders(matchedList);
      if (matchedList.length === 0) {
        setErrorMessage("Không tìm thấy đơn hàng nào khớp với thông tin bạn nhập.");
      }
    }
  };

  // Xử lý gửi yêu cầu hủy đơn
  const handleConfirmCancelOrder = async () => {
    if (!cancellingOrder) return;

    // Kiểm tra chặn nếu quá 30 phút
    const remainingMs = getRemainingCancelTime(cancellingOrder.createdAt);
    if (remainingMs <= 0) {
      alert("Đã qua thời gian 30 phút đổi ý, đơn hàng đã được lên lịch cắt giàn đóng thùng. Vui lòng liên hệ trực tiếp hotline để được hỗ trợ!");
      setCancellingOrder(null);
      return;
    }

    setIsSubmittingCancel(true);

    const orderCode = cancellingOrder.code;
    const isPrepaid = 
      cancellingOrder.paymentMethod === 'deposit' || 
      cancellingOrder.paymentMethod === 'full_qr' ||
      String(cancellingOrder.paymentMethod || '').toLowerCase().includes('cọc') ||
      String(cancellingOrder.paymentMethod || '').toLowerCase().includes('100%');

    // 1. Cập nhật state nội bộ
    setOrders((prev) => 
      (prev || []).map(o => o.code === orderCode ? { ...o, status: 'Đã hủy' } : o)
    );

    // 2. Cập nhật vào localStorage
    try {
      const local = JSON.parse(localStorage.getItem('shop_orders') || '[]');
      const updated = local.map(o => o.code === orderCode ? { ...o, status: 'Đã hủy' } : o);
      localStorage.setItem('shop_orders', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    // 3. Gọi Webhook cập nhật lên Sheet
    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'customer_cancel_order',
            code: orderCode,
            reason: cancelReason
          })
        });
      } catch (err) {
        console.warn('Lỗi ghi nhận hủy đơn lên Sheet:', err);
      }
    }

    setIsSubmittingCancel(false);
    setCancellingOrder(null);

    if (isPrepaid) {
      setCancelSuccessNote(
        `Đơn hàng ${orderCode} đã được hủy thành công. Vì đơn có thanh toán trước, bạn vui lòng nhắn Zalo hoặc gọi Hotline kèm mã đơn để nhà vườn đối soát hoàn tiền trong 24h nhé!`
      );
    } else {
      setCancelSuccessNote(`Đơn hàng ${orderCode} đã được hủy thành công.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn font-sans">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col relative">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900 leading-tight">
                Tra Cứu Đơn Hàng
              </h3>
              <p className="text-[11px] text-stone-500">Nhập Số điện thoại hoặc Mã đơn hàng (XNG...)</p>
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

        {/* Ô tìm kiếm thông minh */}
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
                placeholder="VD: 0848957345 hoặc XNG123456"
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
              <span>{loading ? "Đang tìm..." : "Tra cứu"}</span>
            </button>
          </div>

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

        {/* Danh sách đơn hàng */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
          {orders !== null && orders.length === 0 && (
            <div className="text-center py-8 text-stone-400 text-xs space-y-2 bg-stone-50/60 rounded-2xl p-4 border border-stone-100">
              <p className="font-bold text-stone-700 text-sm">Chưa tìm thấy đơn hàng phù hợp</p>
              <p className="max-w-xs mx-auto leading-relaxed">
                Vui lòng kiểm tra lại số điện thoại đặt hàng, hoặc liên hệ trực tiếp nhà vườn để được hỗ trợ kiểm tra tay:
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <a
                  href={`tel:${cleanHotline}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs shadow-2xs hover:bg-amber-700"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Gọi Hotline</span>
                </a>
                <a
                  href={`https://zalo.me/${zaloPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-2xs hover:bg-blue-700"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Nhắn Zalo</span>
                </a>
              </div>
            </div>
          )}

          {orders && orders.map((ord) => {
            const isNew = checkIsNew(ord.createdAt);
            const isCopied = copiedCode === ord.code;
            const giftTitle = ord.giftTitle || ord.paymentGift;
            const hasPaymentGift = giftTitle && giftTitle !== 'Không áp dụng (COD)';
            const hasCampaignGifts = Boolean(ord.campaignGifts && String(ord.campaignGifts).trim());

            const statusCode = normalizeOrderStatus(ord.status);
            const statusMeta = ORDER_STATUS_MAP[statusCode] || ORDER_STATUS_MAP[ORDER_STATUS.PENDING];
            
            // ĐIỀU KIỆN ĐƯỢC ĐỔI Ý HỦY ĐƠN: Đang "Chờ xác nhận" VÀ Còn trong 30 phút
            const remainingCancelMs = getRemainingCancelTime(ord.createdAt);
            const isWithin30Mins = remainingCancelMs > 0;
            const canCancelDirectly = statusCode === ORDER_STATUS.PENDING && isWithin30Mins;

            let itemsSummary = ord.itemsSummary;
            if (!itemsSummary && Array.isArray(ord.cart)) {
              itemsSummary = ord.cart.map(c => `${c.name} (${c.weightLabel || 'Tiêu chuẩn'}) x${c.quantity}`).join(', ');
            }

            return (
              <div 
                key={ord.code} 
                className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                  isNew 
                    ? 'border-emerald-300 bg-emerald-50/30 shadow-2xs' 
                    : 'border-stone-200 bg-stone-50/50'
                }`}
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
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-700" />
                      )}
                    </button>

                    {isNew ? (
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
                  <div>
                    <strong>Người nhận:</strong> {ord.name || ord.customer?.name} • <span className="font-mono text-stone-800 font-semibold">{ord.phone || ord.customer?.phone}</span>
                  </div>
                  <div className="truncate"><strong>Điểm giao:</strong> {ord.address}</div>
                </div>

                <div className="bg-white/80 p-2.5 rounded-xl border border-stone-200/70 text-xs text-stone-700 space-y-0.5">
                  <span className="font-bold text-stone-500 text-[10px] uppercase block">Sản phẩm:</span>
                  <p className="line-clamp-2 leading-relaxed">{itemsSummary || 'Chi tiết trong hóa đơn'}</p>
                </div>

                {(hasPaymentGift || hasCampaignGifts) && (
                  <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-2.5 text-[11.5px] text-amber-950 space-y-1">
                    <span className="font-bold uppercase text-[10px] text-amber-800 flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Quà tặng gửi kèm theo kiện:</span>
                    </span>

                    {hasPaymentGift && (
                      <div className="flex items-start gap-1.5 text-stone-800">
                        <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.2 rounded shrink-0">
                          Quà CK
                        </span>
                        <span className="leading-tight">{giftTitle}</span>
                      </div>
                    )}

                    {hasCampaignGifts && (
                      <div className="flex items-start gap-1.5 text-stone-800">
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded shrink-0">
                          Combo
                        </span>
                        <span className="leading-tight">{ord.campaignGifts}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-stone-500 pt-1 border-t border-stone-200/50">
                  <span>Tổng thanh toán: <strong className="text-amber-800 font-mono font-bold text-sm">{getOrderTotalDisplay(ord)}</strong></span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>{formatDateTime(ord.createdAt)}</span>
                  </span>
                </div>

                {/* KHU VỰC THAO TÁC / HỦY ĐƠN: 30 PHÚT ĐỔI Ý */}
                <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between gap-2">
                  {canCancelDirectly ? (
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="text-[11px] text-amber-900 flex items-center gap-1.5 font-medium bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/70">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-spin" />
                        <span>
                          Được đổi ý hủy đơn trong: <strong className="font-mono font-black text-amber-950 text-xs">{formatRemainingTimer(remainingCancelMs)}</strong>
                        </span>
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setCancellingOrder(ord);
                          setCancelReason('Đổi ý / Không còn nhu cầu');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition-all active:scale-95 cursor-pointer shadow-2xs"
                      >
                        <Ban className="w-3 h-3" />
                        <span>Hủy đơn</span>
                      </button>
                    </div>
                  ) : statusCode === ORDER_STATUS.CANCELLED ? (
                    <span className="text-[11px] text-rose-600 font-medium italic">
                      Đơn hàng này đã hủy
                    </span>
                  ) : statusCode === ORDER_STATUS.BOMBED ? (
                    <span className="text-[11px] text-red-700 font-medium italic">
                      Đơn hàng đã ghi nhận từ chối nhận
                    </span>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10.5px] text-stone-500 italic">
                        {statusCode === ORDER_STATUS.PENDING ? 'Đã qua 30p đổi ý • Đang lên lịch cắt giàn' : 'Đang đóng thùng / Gửi xe'}
                      </span>
                      <a
                        href={`tel:${cleanHotline}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-[11px] transition-colors"
                        title="Liên hệ trực tiếp nhà vườn để điều chỉnh trước khi xe chạy"
                      >
                        <PhoneCall className="w-3 h-3 text-amber-600" />
                        <span>Gọi hỗ trợ hủy/đổi món</span>
                      </a>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* Footer liên hệ hỗ trợ */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-medium hidden sm:flex">
            <Headphones className="w-3.5 h-3.5 text-amber-600" />
            <span>Cần hỗ trợ đơn hàng?</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={`tel:${cleanHotline}`}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-colors border border-stone-200/80 shadow-2xs"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-700" />
              <span>Gọi: {hotline}</span>
            </a>

            <a
              href={`https://zalo.me/${zaloPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-2xs"
            >
              <MessageCircle className="w-3.5 h-3.5 text-white" />
              <span>Chat Zalo</span>
            </a>
          </div>
        </div>

        {/* MODAL POPUP XÁC NHẬN HỦY ĐƠN HÀNG */}
        {cancellingOrder && (
          <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-xs rounded-3xl p-5 flex flex-col justify-center items-center z-20 animate-fadeIn text-stone-900">
            <div className="bg-white rounded-2xl p-5 w-full max-w-sm border border-stone-200 shadow-2xl space-y-4">
              <div className="flex items-center gap-2.5 text-rose-600 border-b border-stone-100 pb-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h4 className="font-bold text-sm text-stone-900">Xác Nhận Hủy Đơn Hàng?</h4>
              </div>

              <div className="text-xs space-y-2 text-stone-600 leading-relaxed">
                <p>
                  Bạn có chắc chắn muốn hủy đơn hàng mã <strong className="font-mono text-stone-900 font-bold">{cancellingOrder.code}</strong> không?
                </p>

                {(cancellingOrder.paymentMethod === 'deposit' || cancellingOrder.paymentMethod === 'full_qr') && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-1">
                    <strong className="block font-bold">Lưu ý đơn đã thanh toán:</strong>
                    <span>Tiền cọc / chuyển khoản sẽ được nhà vườn đối soát và chuyển khoản hoàn lại trong 24 giờ.</span>
                  </div>
                )}

                <div className="space-y-1 pt-1">
                  <label className="block text-[11px] font-bold text-stone-700">Lý do hủy đơn:</label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-amber-600 font-medium"
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
                <button
                  type="button"
                  disabled={isSubmittingCancel}
                  onClick={() => setCancellingOrder(null)}
                  className="flex-1 py-2 rounded-xl border border-stone-200 hover:bg-stone-100 font-bold text-xs text-stone-700 cursor-pointer"
                >
                  Không, giữ lại đơn
                </button>
                <button
                  type="button"
                  disabled={isSubmittingCancel}
                  onClick={handleConfirmCancelOrder}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCancel ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang hủy...</span>
                    </>
                  ) : (
                    <span>Xác nhận hủy</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}