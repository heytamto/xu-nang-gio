// src/utils/orderRiskUtils.js
import { ORDER_STATUS, normalizeOrderStatus } from '../constants/orderStatus';

export function parseCleanMoney(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  const str = String(val).trim();
  const cleanDigits = str.replace(/[^0-9]/g, '');
  if (!cleanDigits) return 0;

  // Xử lý trường hợp chuỗi số bị lặp gấp đôi (legacy cache)
  const len = cleanDigits.length;
  if (len >= 12 && len % 2 === 0) {
    const half1 = cleanDigits.slice(0, len / 2);
    const half2 = cleanDigits.slice(len / 2);
    if (half1 === half2) {
      return Number(half1) || 0;
    }
  }

  const num = Number(cleanDigits);
  return isNaN(num) ? 0 : num;
}

export function parseOrderDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;
  
  let str = String(dateStr).trim().replace(/\s*\(.*?\)\s*/g, '');
  
  // Format DD/MM/YYYY
  if (str.includes('/')) {
    const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      const [, d, m, y] = match;
      const parsed = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00`);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
  }
  
  // Format chuẩn ISO từ PostgreSQL Supabase (2026-10-22T05:00:00Z)
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function parseOrderTimestamp(dateStr) {
  if (!dateStr) return 0;
  if (dateStr instanceof Date) return dateStr.getTime();
  
  let str = String(dateStr).trim().replace(/\s*\(.*?\)\s*/g, '');
  
  // Format DD/MM/YYYY HH:mm:ss
  if (str.includes('/')) {
    const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}):(\d{1,2}))?/);
    if (match) {
      const [, d, m, y, hr = '0', min = '0', sec = '0'] = match;
      return new Date(Number(y), Number(m) - 1, Number(d), Number(hr), Number(min), Number(sec)).getTime();
    }
  }
  
  const d = new Date(str);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

/**
 * Kiểm tra trạng thái xấu chỉ dựa vào ORDER_STATUS
 */
export function isBadStatus(statusStr) {
  const normalized = normalizeOrderStatus(statusStr);
  return normalized === ORDER_STATUS.CANCELLED || normalized === ORDER_STATUS.BOMBED;
}

/**
 * XÂY DỰNG TỪ ĐIỂN LỊCH SỬ RỦI RO & GẮN CỜ KHÁCH HÀNG (CUSTOMER TAGGING ENGINE)
 * Phân loại: VIP/Khách quen, Đang treo bom, Hay báo hủy, Đã hoàn lương
 */
export function buildCustomerProfileMap(orders = []) {
  const map = new Map();
  
  // 1. Gom nhóm các đơn theo 9 số cuối của SĐT để tránh lệch đầu 0 hoặc +84
  orders.forEach((ord) => {
    const cleanP = String(ord.phone || ord.customer?.phone || '').replace(/\D/g, '');
    if (cleanP.length >= 8) {
      const key = cleanP.slice(-9);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ord);
    }
  });

  const profileMap = new Map();
  
  map.forEach((orderList, key) => {
    // Sắp xếp đơn từ mới nhất -> cũ nhất
    const sorted = [...orderList].sort((a, b) => {
      const timeB = parseOrderTimestamp(b.created_at || b.createdAt);
      const timeA = parseOrderTimestamp(a.created_at || a.createdAt);
      return timeB - timeA;
    });
    
    sorted.forEach((currentOrd, index) => {
      // Chỉ xét các đơn CŨ HƠN đơn hiện tại (chống việc đơn hiện tại tự gắn cờ chính nó)
      const olderOrders = sorted.slice(index + 1);

      const latestOlder = olderOrders[0];
      const isLatestSuccess = latestOlder && normalizeOrderStatus(latestOlder.status) === ORDER_STATUS.COMPLETED;

      // Đơn bom hàng (loại trừ trường hợp khách đã chuyển khoản 100%)
      const bombedOrders = olderOrders.filter((ord) => {
        const norm = normalizeOrderStatus(ord.status);
        const paymentMethod = String(ord.payment_method || ord.paymentMethod || '').toLowerCase();
        const isPrepaid100 = paymentMethod.includes('100%') || paymentMethod === 'full_qr';
        return norm === ORDER_STATUS.BOMBED && !isPrepaid100;
      });

      // Đơn đã hủy trong quá khứ
      const cancelledOrders = olderOrders.filter((ord) => {
        const norm = normalizeOrderStatus(ord.status);
        return norm === ORDER_STATUS.CANCELLED;
      });

      // Đơn đã hoàn thành (nhận hàng thành công)
      const completedOrders = olderOrders.filter((ord) => {
        const norm = normalizeOrderStatus(ord.status);
        return norm === ORDER_STATUS.COMPLETED;
      });

      // Trạng thái đã khôi phục uy tín (Pardoned)
      const hasBadHistory = bombedOrders.length > 0 || cancelledOrders.length > 0;
      const isPardoned = isLatestSuccess && hasBadHistory;

      const hasActiveBombedRisk = !isPardoned && bombedOrders.length > 0;
      const hasActiveCancelledRisk = !isPardoned && cancelledOrders.length >= 2;
      const isVipCustomer = completedOrders.length >= 2;

      // Xác định đơn lỗi gần nhất để hiển thị tham chiếu
      const primaryBadOrder = bombedOrders[0] || cancelledOrders[0] || null;

      let reason = '';
      if (primaryBadOrder) {
        let rawReason = primaryBadOrder.cancel_reason || primaryBadOrder.cancelReason || primaryBadOrder.reason || '';
        const orderNote = primaryBadOrder.customer_note || primaryBadOrder.note || '';
        
        if (!rawReason && orderNote) {
          const matchNote = String(orderNote).match(/\[(BOM HÀNG|LÝ DO HỦY):\s*([^\]]+)\]/i);
          rawReason = matchNote ? matchNote[2] : orderNote;
        }
        reason = rawReason || (normalizeOrderStatus(primaryBadOrder.status) === ORDER_STATUS.BOMBED ? 'Không nhận hàng / Thuê bao chặn số' : 'Khách xin hủy đơn');
      }

      // Xây dựng thẻ Tag định danh nhanh
      let customerTag = null;
      if (hasActiveBombedRisk) {
        customerTag = {
          type: 'danger',
          label: 'Đang treo bom',
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
          tooltip: 'Khách từng bom đơn trước đó. Tuyệt đối không gửi COD!'
        };
      } else if (isPardoned) {
        customerTag = {
          type: 'pardoned',
          label: 'Đã hoàn lương',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
          tooltip: 'Từng có sự cố đơn cũ nhưng đơn gần nhất đã nhận hàng thành công.'
        };
      } else if (isVipCustomer) {
        customerTag = {
          type: 'vip',
          label: `Khách quen (${completedOrders.length} đơn)`,
          badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
          tooltip: `Đã hoàn thành ${completedOrders.length} đơn hàng trước đó.`
        };
      } else if (hasActiveCancelledRisk) {
        customerTag = {
          type: 'warning',
          label: `Hủy ${cancelledOrders.length} lần`,
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
          tooltip: `Khách từng xin hủy ${cancelledOrders.length} đơn trong quá khứ.`
        };
      }

      const orderKey = currentOrd.code || currentOrd.orderId;
      profileMap.set(`${key}_${orderKey}`, {
        isPardoned,
        hasActiveBombedRisk,
        hasActiveCancelledRisk,
        isVipCustomer,
        completedCount: completedOrders.length,
        primaryBadOrder,
        badOrderReason: reason,
        customerTag
      });
    });
  });

  return profileMap;
}

/**
 * Helper lấy nhanh thẻ tag của một đơn hàng cụ thể
 */
export function getOrderCustomerTag(ord, profileMap) {
  if (!ord || !profileMap) return null;
  const cleanP = String(ord.phone || ord.customer?.phone || '').replace(/\D/g, '');
  if (cleanP.length < 8) return null;
  const key = cleanP.slice(-9);
  const orderKey = ord.code || ord.orderId;
  const profile = profileMap.get(`${key}_${orderKey}`);
  return profile?.customerTag || null;
}