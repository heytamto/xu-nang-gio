// src/utils/orderRiskUtils.js
import { ORDER_STATUS, normalizeOrderStatus } from '../constants/orderStatus';

export function parseCleanMoney(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  const str = String(val).trim();
  const cleanDigits = str.replace(/[^0-9]/g, '');
  if (!cleanDigits) return 0;

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
  
  if (str.includes('/')) {
    const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      const [, d, m, y] = match;
      const parsed = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00`);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
  }
  
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function parseOrderTimestamp(dateStr) {
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
  
  const d = new Date(str);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

export function isBadStatus(statusStr) {
  const normalized = normalizeOrderStatus(statusStr);
  return normalized === ORDER_STATUS.CANCELLED || normalized === ORDER_STATUS.BOMBED;
}

/**
 * XÂY DỰNG TỪ ĐIỂN LỊCH SỬ RỦI RO (TWO-PASS SCANNING)
 * Tự động gỡ án "Treo bom" cho toàn bộ các đơn chuyển khoản trước đó khi đã có 1 đơn thành công xuất hiện
 */
export function buildCustomerProfileMap(orders = []) {
  const map = new Map();
  
  // Gom nhóm theo 9 số cuối SĐT
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
    // Sắp xếp tăng dần theo thời gian (cũ -> mới)
    const chronological = [...orderList].sort((a, b) => {
      const timeA = parseOrderTimestamp(a.created_at || a.createdAt);
      const timeB = parseOrderTimestamp(b.created_at || b.createdAt);
      return timeA - timeB;
    });

    // -------------------------------------------------------------
    // PASS 1: TÌM ĐƠN BOM GẦN NHẤT & ĐƠN THÀNH CÔNG ĐẦU TIÊN SAU ĐƠN BOM ĐÓ
    // -------------------------------------------------------------
    let lastBombedIndex = -1;
    let firstSuccessAfterBombIndex = -1;

    for (let i = chronological.length - 1; i >= 0; i--) {
      const st = normalizeOrderStatus(chronological[i].status);
      const pm = String(chronological[i].payment_method || chronological[i].paymentMethod || '').toLowerCase();
      const isPrepaid100 = pm.includes('100%') || pm === 'full_qr';

      if (st === ORDER_STATUS.BOMBED && !isPrepaid100) {
        lastBombedIndex = i;
        break; // Lấy đơn bom mới nhất
      }
    }

    if (lastBombedIndex !== -1) {
      // Tìm đơn thành công đầu tiên sau đơn bom
      for (let i = lastBombedIndex + 1; i < chronological.length; i++) {
        const st = normalizeOrderStatus(chronological[i].status);
        if (st === ORDER_STATUS.COMPLETED) {
          firstSuccessAfterBombIndex = i;
          break; // Chỉ lấy đơn thành công đầu tiên
        }
      }
    }

    const lastBombedOrder = lastBombedIndex !== -1 ? chronological[lastBombedIndex] : null;
    const hasPardonedSuccess = firstSuccessAfterBombIndex !== -1;

    // -------------------------------------------------------------
    // PASS 2: GẮN NHÃN TỪNG ĐƠN HÀNG DỰA TRÊN MỐC GIẢI ÁN
    // -------------------------------------------------------------
    let completedCount = 0;

    chronological.forEach((ord, index) => {
      const currentStatus = normalizeOrderStatus(ord.status);
      const isCompleted = currentStatus === ORDER_STATUS.COMPLETED;
      if (isCompleted) completedCount += 1;

      let hasActiveBombedRisk = false;
      let isPardoned = false;
      let isClearedPreSuccess = false; // Đơn nằm giữa đơn bom và đơn thành công
      let isWatchlist = false;         // Đơn phát sinh sau đơn thành công

      let primaryBadOrder = null;

      if (lastBombedOrder) {
        if (index <= lastBombedIndex) {
          // Các đơn diễn ra TRƯỚC hoặc CHÍNH LÀ đơn bom: Không gắn cờ bom tương lai
          primaryBadOrder = null;
        } else if (!hasPardonedSuccess) {
          // CHƯA CÓ ĐƠN THÀNH CÔNG NÀO: Tất cả đơn sau bom đều bị treo án
          hasActiveBombedRisk = true;
          primaryBadOrder = lastBombedOrder;
        } else {
          // 👉 ĐÃ CÓ ĐƠN THÀNH CÔNG GIẢI ÁN (firstSuccessAfterBombIndex)
          if (index < firstSuccessAfterBombIndex) {
            // CÁC ĐƠN NẰM GIỮA ĐƠN BOM VÀ ĐƠN THÀNH CÔNG (Đơn 1, Đơn 2 trong câu hỏi của bạn)
            // Được HỒI TỐ GỠ ÁN, không còn bị coi là "Đang treo bom"
            isClearedPreSuccess = true;
            hasActiveBombedRisk = false;
            primaryBadOrder = lastBombedOrder; // Vẫn lưu vết để biết lý do vì sao bắt CK
          } else if (index === firstSuccessAfterBombIndex) {
            // CHÍNH LÀ ĐƠN THÀNH CÔNG ĐẦU TIÊN (Đơn 3)
            isPardoned = true;
            hasActiveBombedRisk = false;
            primaryBadOrder = lastBombedOrder;
          } else {
            // CÁC ĐƠN PHÁT SINH SAU ĐƠN THÀNH CÔNG: Vào diện theo dõi nhẹ (Watchlist)
            isWatchlist = true;
            hasActiveBombedRisk = false;
            primaryBadOrder = lastBombedOrder;
          }
        }
      }

      // Lấy lý do bom
      let reason = '';
      if (primaryBadOrder) {
        let rawReason = primaryBadOrder.cancel_reason || primaryBadOrder.cancelReason || primaryBadOrder.reason || '';
        const orderNote = primaryBadOrder.customer_note || primaryBadOrder.note || '';
        if (!rawReason && orderNote) {
          const matchNote = String(orderNote).match(/\[(BOM HÀNG|LÝ DO HỦY):\s*([^\]]+)\]/i);
          rawReason = matchNote ? matchNote[2] : orderNote;
        }
        reason = rawReason || 'Thuê bao không liên lạc được / Chặn số';
      }

      // Xây dựng thẻ Tag hiển thị
      let customerTag = null;
      if (hasActiveBombedRisk) {
        customerTag = {
          type: 'danger',
          label: 'Đang treo bom',
          badgeClass: 'bg-rose-600 text-white border-rose-700 animate-pulse font-bold',
          tooltip: `Khách từng bom đơn #${primaryBadOrder?.code}. Bắt buộc chuyển khoản 100%!`
        };
      } else if (isPardoned) {
        customerTag = {
          type: 'pardoned',
          label: 'Đã hoàn lương',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
          tooltip: `Đơn này nhận thành công, giải án cho đơn bom #${primaryBadOrder?.code}.`
        };
      } else if (isClearedPreSuccess) {
        customerTag = {
          type: 'cleared',
          label: 'Đã giải án (Chờ nhận)',
          badgeClass: 'bg-blue-100 text-blue-900 border-blue-200 font-bold',
          tooltip: `Khách đã hoàn thành đơn #${chronological[firstSuccessAfterBombIndex]?.code}, đơn này được cởi trói án bom.`
        };
      } else if (isWatchlist) {
        customerTag = {
          type: 'watchlist',
          label: `Từng bom • Đã nhận ${completedCount} đơn`,
          badgeClass: 'bg-amber-100 text-amber-950 border-amber-300 font-bold',
          tooltip: `Khách từng bom đơn #${primaryBadOrder?.code}. Đã nhận ${completedCount} đơn. Cần gọi xác nhận kỹ trước khi cắt hàng.`
        };
      } else if (completedCount >= 2) {
        customerTag = {
          type: 'vip',
          label: `Khách quen (${completedCount} đơn)`,
          badgeClass: 'bg-stone-100 text-stone-800 border-stone-300 font-bold',
          tooltip: `Đã hoàn thành ${completedCount} đơn hàng thuận lợi.`
        };
      }

      const orderKey = ord.code || ord.orderId;
      profileMap.set(`${key}_${orderKey}`, {
        isPardoned,
        isClearedPreSuccess,
        isWatchlist,
        hasActiveBombedRisk,
        completedCount,
        primaryBadOrder,
        badOrderReason: reason,
        customerTag
      });
    });
  });

  return profileMap;
}

export function getOrderCustomerTag(ord, profileMap) {
  if (!ord || !profileMap) return null;
  const cleanP = String(ord.phone || ord.customer?.phone || '').replace(/\D/g, '');
  if (cleanP.length < 8) return null;
  const key = cleanP.slice(-9);
  const orderKey = ord.code || ord.orderId;
  const profile = profileMap.get(`${key}_${orderKey}`);
  return profile?.customerTag || null;
}