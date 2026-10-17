import React, { useState } from 'react';
import { 
  Search, PackageCheck, Clock, X, Copy, Check, 
  Gift, PhoneCall, MessageCircle, Headphones 
} from 'lucide-react';

export default function OrderLookupModal({ isOpen, onClose, shopConfig = {} }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  if (!isOpen) return null;

  const hotline = shopConfig?.hotline || '0848.957.345';
  const cleanHotline = String(hotline).replace(/[^0-9]/g, '');
  const zaloPhone = String(shopConfig?.zaloPhone || cleanHotline || '0848957345').replace(/[^0-9]/g, '');

  const checkIsNew = (createdAtStr) => {
    if (!createdAtStr) return false;
    try {
      let d = new Date(createdAtStr);
      if (isNaN(d.getTime()) && String(createdAtStr).includes('/')) {
        const [datePart, timePart] = String(createdAtStr).split(' ');
        const [day, month, year] = datePart.split('/');
        const [hour, min, sec] = (timePart || '0:0:0').split(':');
        d = new Date(year, month - 1, day, hour, min, sec || 0);
      }
      return !isNaN(d.getTime()) && (Date.now() - d.getTime()) <= 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
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
    e.preventDefault();
    setErrorMessage('');
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

    // 1. Kiểm tra ưu tiên trong LocalStorage trước
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
    } catch (e) {
      console.warn("Lỗi đọc local:", e);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col font-sans">
        
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

                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                    ord.status === 'Hoàn thành' ? 'bg-emerald-100 text-emerald-800' :
                    ord.status === 'Đang giao' || ord.status === 'shipping' ? 'bg-blue-100 text-blue-800' :
                    ord.status === 'Đã nhận cọc' ? 'bg-purple-100 text-purple-800' :
                    ord.status === 'Đã hủy' ? 'bg-rose-100 text-rose-800' :
                    'bg-amber-100 text-amber-900'
                  }`}>
                    {ord.status === 'shipping' ? 'Đang giao' : (ord.status || 'Chờ xác nhận')}
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
                      <Gift className="w-3 h-3 text-amber-600 shrink-0" />
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
                    <Clock className="w-3 h-3 text-stone-400" />
                    <span>{formatDateTime(ord.createdAt)}</span>
                  </span>
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

      </div>
    </div>
  );
}