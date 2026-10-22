// src/utils/orderRiskUtils.js
import { ORDER_STATUS, normalizeOrderStatus } from '../constants/orderStatus';

export function parseCleanMoney(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  const str = String(val).trim();
  const cleanDigits = str.replace(/[^0-9]/g, '');
  if (!cleanDigits) return 0;

  // Xử lý trường hợp chuỗi số bị lặp gấp đôi (legacy từ Google Sheets nếu còn sót trong cache)
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

export function isBadStatus(statusStr) {
  const normalized = normalizeOrderStatus(statusStr);
  if (normalized === ORDER_STATUS.CANCELLED || normalized === ORDER_STATUS.BOMBED) return true;
  const raw = String(statusStr || '').trim().toLowerCase();
  return raw === 'đã hủy' || raw === 'da huy' || raw === 'cancelled' || raw === 'bom hàng' || raw === 'bom hang' || raw === 'bombed';
}

/**
 * Xây dựng từ điển lịch sử rủi ro cho từng đơn hàng của từng số điện thoại
 * Hỗ trợ tương thích đồng thời cả Supabase (snake_case) và State cũ (camelCase)
 */
export function buildCustomerProfileMap(orders = []) {
  const map = new Map();
  
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
    // Sắp xếp đơn từ mới nhất -> cũ nhất (ưu tiên created_at từ Supabase)
    const sorted = [...orderList].sort((a, b) => {
      const timeB = parseOrderTimestamp(b.created_at || b.createdAt);
      const timeA = parseOrderTimestamp(a.created_at || a.createdAt);
      return timeB - timeA;
    });
    
    sorted.forEach((currentOrd, index) => {
      // Chỉ lấy các đơn CŨ HƠN đơn hiện tại (chống tự tham chiếu)
      const olderOrders = sorted.slice(index + 1);

      const latestOlder = olderOrders[0];
      const isLatestSuccess = latestOlder && !isBadStatus(latestOlder.status);

      const bombedOrders = olderOrders.filter(ord => {
        const norm = normalizeOrderStatus(ord.status);
        const raw = String(ord.status || '').toLowerCase();
        const paymentMethod = String(ord.payment_method || ord.paymentMethod || '').toLowerCase();
        const isPrepaid100 = paymentMethod.includes('100%') || paymentMethod === 'full_qr';
        return (norm === ORDER_STATUS.BOMBED || raw.includes('bom')) && !isPrepaid100;
      });

      const cancelledOrders = olderOrders.filter(ord => {
        const norm = normalizeOrderStatus(ord.status);
        const raw = String(ord.status || '').toLowerCase();
        return norm === ORDER_STATUS.CANCELLED || raw.includes('hủy') || raw.includes('cancel');
      });

      const validOrders = olderOrders.filter(ord => !isBadStatus(ord.status));
      const isPardoned = isLatestSuccess && validOrders.length > 0 && (bombedOrders.length > 0 || cancelledOrders.length > 0);
      const primaryBadOrder = bombedOrders[0] || cancelledOrders[0] || null;

      let reason = '';
      if (primaryBadOrder) {
        let rawReason = primaryBadOrder.cancel_reason || primaryBadOrder.cancelReason || primaryBadOrder.reason || '';
        const orderNote = primaryBadOrder.customer_note || primaryBadOrder.note || '';
        
        if (!rawReason && orderNote) {
          const matchNote = String(orderNote).match(/\[(BOM HÀNG\vert{}LÝ DO HỦY):\s*([^\]]+)\]/i);
          rawReason = matchNote ? matchNote[2] : orderNote;
        }
        reason = rawReason || (normalizeOrderStatus(primaryBadOrder.status) === ORDER_STATUS.BOMBED ? 'Không nhận hàng / Không liên lạc được' : 'Khách xin hủy đơn');
      }

      const orderKey = currentOrd.code || currentOrd.orderId;
      profileMap.set(`${key}_${orderKey}`, {
        isPardoned,
        hasActiveBombedRisk: !isPardoned && bombedOrders.length > 0,
        hasActiveCancelledRisk: !isPardoned && cancelledOrders.length >= 2,
        primaryBadOrder,
        badOrderReason: reason
      });
    });
  });

  return profileMap;
}