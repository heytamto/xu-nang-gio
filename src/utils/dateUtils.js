/**
 * src/utils/dateUtils.js
 * Bộ công cụ chuẩn hóa ngày tháng và tính toán đếm ngược đơn hàng
 */

const MONTH_MAP = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
};

/**
 * 1. PARSE THỜI GIAN VỀ EPOCH MILI-GIÂY (UTC CHUẨN)
 * Chống lệch múi giờ giữa PostgreSQL (UTC) và trình duyệt (GMT+7)
 */
export function parseOrderTimestampToMs(val) {
  if (!val) return 0;
  if (val instanceof Date) return isNaN(val.getTime()) ? 0 : val.getTime();
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  try {
    let str = String(val).trim().replace(/\s*\(.*?\)\s*/g, '');

    // 1.1 Dạng dd/MM/yyyy hoặc dd/MM/yyyy HH:mm:ss
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
      const [datePart, timePart = '00:00:00'] = str.split(' ');
      const [d, m, y] = datePart.split('/');
      const [h = '00', min = '00', s = '00'] = timePart.split(':');
      return new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min), Number(s)).getTime();
    }

    // 1.2 Dạng chuỗi tháng tiếng Anh từ Google Sheet: "Thu Oct 15 2026 00:00:00 GMT+0700"
    const match = str.match(/([A-Za-z]{3})\s+(\d{1,2})\s+(\d{4})/);
    if (match && !str.includes('T')) {
      const d = new Date(str);
      if (!isNaN(d.getTime())) return d.getTime();
    }

    // 1.3 Dạng ISO hoặc từ Supabase (vd: "2026-10-22 08:30:00" hoặc "2026-10-22T08:30:00")
    // Nếu chuỗi ISO chưa có chỉ thị timezone (Z hoặc +/ - sau phần giờ) -> ép đuôi 'Z' để coi là UTC chuẩn
    if (str.includes('-')) {
      const hasT = str.includes('T');
      const normalizedStr = hasT ? str : str.replace(' ', 'T');
      const timeComponent = normalizedStr.split('T')[1] || '';

      const hasTimezone = timeComponent.includes('Z') || 
                          timeComponent.includes('+') || 
                          (timeComponent.includes('-') && timeComponent.indexOf('-') > 2);

      const finalIso = hasTimezone ? normalizedStr : `${normalizedStr}Z`;
      const t = new Date(finalIso).getTime();
      if (!isNaN(t)) return t;
    }

    const t = new Date(str).getTime();
    return isNaN(t) ? 0 : t;
  } catch {
    return 0;
  }
}

/**
 * 2. TÍNH THỜI GIAN ĐỔI Ý HỦY ĐƠN (CHỐNG KẸT 30:00 VÀ CHỐNG TRÀN GIỜ)
 * @param {string|number|Date} createdAtStr Mốc tạo đơn từ Database
 * @param {number} currentNow Mốc thời gian hiện tại (Date.now())
 * @param {number} windowMinutes Thời hạn cho phép hủy (mặc định 30 phút)
 */
export function getRemainingCancelMs(createdAtStr, currentNow = Date.now(), windowMinutes = 30) {
  const orderTime = parseOrderTimestampToMs(createdAtStr);
  if (!orderTime) return 0;

  const maxWindowMs = windowMinutes * 60 * 1000;
  // Mốc hết hạn cố định = Thời điểm đặt + 30 phút
  const expireTime = orderTime + maxWindowMs;
  
  // Thời gian còn lại = Mốc hết hạn - Thời gian hiện tại
  const remaining = expireTime - currentNow;

  // Đã quá 30 phút -> hết hạn hủy
  if (remaining <= 0) return 0;

  // Giới hạn trần tối đa không vượt quá windowMinutes (chống lỗi tràn giờ do lệch đồng hồ máy khách)
  return Math.min(remaining, maxWindowMs);
}

/**
 * 3. FORMAT ĐỒNG HỒ ĐẾM NGƯỢC (mm:ss)
 */
export function formatCountdownTimer(ms) {
  if (!ms || ms <= 0) return '00:00';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * 4. FORMAT NGÀY: dd/MM/yyyy (VD: 22/10/2026)
 * Đã chuẩn hóa qua Local Time để không bị tụt ngày khi lưu UTC ở server
 */
export function formatDate(val, fallback = '') {
  if (!val) return fallback;
  try {
    const ms = parseOrderTimestampToMs(val);
    if (!ms) return fallback;

    const d = new Date(ms);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return fallback;
  }
}

/**
 * 5. FORMAT NGÀY KÈM GIỜ: dd/MM/yyyy HH:mm (VD: 22/10/2026 14:30)
 */
export function formatDateTime(val, fallback = 'Gần đây') {
  if (!val) return fallback;
  try {
    const ms = parseOrderTimestampToMs(val);
    if (!ms) return formatDate(val, fallback);

    const d = new Date(ms);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return formatDate(val, fallback);
  }
}

/**
 * 6. KIỂM TRA ĐƠN TẠO TRONG VÒNG 24H (Dành cho badge "Đơn mới")
 */
export function isRecentOrder(createdAtStr) {
  if (!createdAtStr) return false;
  const ms = parseOrderTimestampToMs(createdAtStr);
  return ms > 0 && (Date.now() - ms) <= 24 * 60 * 60 * 1000;
}