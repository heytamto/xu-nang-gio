// src/components/admin/dashboard/dashboardUtils.jsx
import React from 'react';
import { Gift } from 'lucide-react';
import { ORDER_STATUS } from '../../../constants/orderStatus';

export const DATE_OPTIONS = [
  { value: 'all', label: 'Tất cả thời gian' },
  { value: 'today', label: 'Hôm nay' },
  { value: 'yesterday', label: 'Hôm qua' },
  { value: '7days', label: '7 ngày gần nhất' },
  { value: '30days', label: '30 ngày gần nhất' },
  { value: 'this_month', label: 'Tháng này' },
  { value: 'custom', label: 'Khoảng ngày tùy chọn...' },
];

export const FORWARD_STATUS_MAP = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PACKING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PACKING]: [ORDER_STATUS.SHIPPING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPING]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.BOMBED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.COMPLETED]: [],
  [ORDER_STATUS.CANCELLED]: [],
  [ORDER_STATUS.BOMBED]: []
};

/**
 * Lấy tên ngân hàng đang kích hoạt để hiển thị nhãn
 */
export function getActiveBankLabel(shopConfig) {
  const dbBank = shopConfig?.payment?.bankName || shopConfig?.bankName;
  if (dbBank && typeof dbBank === 'string' && dbBank.trim()) {
    return dbBank.trim();
  }
  const envBank = import.meta.env?.VITE_BANK_NAME;
  if (envBank && typeof envBank === 'string' && envBank.trim()) {
    return envBank.trim();
  }
  return 'MBBank';
}

/**
 * Trích xuất tiền cọc cấu hình chuẩn từ nhiều cấu trúc schema khác nhau
 */
export function resolveDepositAmount(shopConfig) {
  const amount = 
    shopConfig?.payment?.depositAmount ?? 
    shopConfig?.payment_config?.depositAmount ?? 
    shopConfig?.depositAmount ?? 
    shopConfig?.deposit_amount;
    
  const num = Number(amount);
  return !isNaN(num) && num > 0 ? num : 50000;
}

/**
 * Sinh nhãn hiển thị phương thức thanh toán linh hoạt cho dòng đơn hàng
 */
export function getDynamicPaymentLabel(method, configDeposit, orderRecord) {
  const m = String(method || '').toLowerCase();
  
  if (m === 'deposit' || m.includes('cọc')) {
    const depositVal = Number(
      orderRecord?.deposit_paid || 
      orderRecord?.deposit_amount_expected || 
      configDeposit
    );
    return `Cọc ${depositVal.toLocaleString('vi-VN')}đ`;
  }
  
  if (m === 'full_qr' || m.includes('100%') || m.includes('full')) {
    return 'Chuyển khoản 100%';
  }
  
  return 'COD (Thu hộ khi nhận)';
}

/**
 * Tra cứu giải mã tên quà tặng nếu dữ liệu lưu mã ID
 */
export function resolveGiftDisplayTitle(rawTitle, shopConfig = {}) {
  if (!rawTitle || typeof rawTitle !== 'string') return '';
  const trimmed = rawTitle.trim();
  
  const giftsList = [
    ...(Array.isArray(shopConfig?.giftsCatalog) ? shopConfig.giftsCatalog : []),
    ...(Array.isArray(shopConfig?.paymentGifts) ? shopConfig.paymentGifts : [])
  ];

  const matched = giftsList.find((g) => g && String(g.id).trim() === trimmed);
  return matched ? (matched.title || matched.name || trimmed) : trimmed;
}

/**
 * Hiển thị tóm tắt danh sách sản phẩm và quà tặng trong đơn
 */
export function renderItemsSummary(items, rawSummary, ord, compact = false, shopConfig = {}) {
  const activeItems = Array.isArray(items) && items.length > 0 
    ? items 
    : (Array.isArray(ord?.cart) ? ord.cart : null);

  if (Array.isArray(activeItems) && activeItems.length > 0) {
    const resolvedPaymentGift = resolveGiftDisplayTitle(ord?.payment_gift, shopConfig);

    return (
      <div className="space-y-1.5">
        <div className="space-y-1">
          {activeItems.map((it, idx) => {
            const qty = Number(it.quantity) || 1;
            const spec = it.weight_label || it.weightLabel || it.unit || '';
            const flavor = it.flavor ? ` (${it.flavor})` : '';
            const price = (Number(it.price) || 0) * qty;
            const giftTitle = resolveGiftDisplayTitle(it.campaign_gift_title || it.campaignGiftTitle, shopConfig);

            return (
              <div key={it.id || idx} className="leading-snug text-stone-800 font-medium text-xs sm:text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    • {it.name || it.product_name} {spec ? `[${spec}]` : ''}{flavor} <strong className="text-amber-950 font-mono font-bold">x{qty}</strong>
                  </span>
                  {price > 0 && !compact && (
                    <span className="font-mono text-stone-600 text-xs sm:text-sm font-semibold shrink-0">
                      {price.toLocaleString('vi-VN')}đ
                    </span>
                  )}
                </div>

                {giftTitle && (
                  <div className="inline-flex items-center gap-1.5 text-xs text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 mt-1 ml-2 font-bold">
                    <Gift className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Tặng: {giftTitle}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {resolvedPaymentGift && resolvedPaymentGift !== 'Không áp dụng (COD)' && (
          <div className="flex items-center gap-2 text-xs text-amber-950 bg-amber-100/90 px-2.5 py-1 rounded-xl border border-amber-300 font-bold mt-1.5 shadow-2xs">
            <Gift className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="truncate">Quà CK: {resolvedPaymentGift}</span>
          </div>
        )}
      </div>
    );
  }

  if (!rawSummary) return <span className="text-stone-400 italic text-xs sm:text-sm">Chi tiết trong đơn</span>;

  if (typeof rawSummary === 'string' && (rawSummary.includes('<div') || rawSummary.includes('<br') || rawSummary.includes('&#8226;'))) {
    const cleanText = rawSummary
      .replace(/<div[^>]*>/gi, '')
      .replace(/<\/div>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/&#8226;/g, '•')
      .replace(/&bull;/g, '•')
      .trim();

    const lines = cleanText.split('\n').map((l) => l.trim()).filter(Boolean);

    return (
      <div className="space-y-1">
        {lines.map((line, idx) => (
          <div key={idx} className="leading-snug text-stone-800 font-medium text-xs sm:text-sm truncate">
            {line.startsWith('•') ? line : `• ${line}`}
          </div>
        ))}
      </div>
    );
  }

  return <div className="leading-snug text-stone-800 font-medium text-xs sm:text-sm truncate">{rawSummary}</div>;
}