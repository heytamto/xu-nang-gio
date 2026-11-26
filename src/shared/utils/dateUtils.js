/**
 * src/utils/dateUtils.js
 * Bộ công cụ chuẩn hóa ngày tháng và tính toán đếm ngược đơn hàng
 */

export function parseOrderTimestampToMs(val) {
  if (!val) return 0;
  if (val instanceof Date) return isNaN(val.getTime()) ? 0 : val.getTime();
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  try {
    let str = String(val).trim().replace(/\s*\(.*?\)\s*/g, '');

    // Dạng dd/MM/yyyy hoặc dd/MM/yyyy HH:mm:ss
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
      const [datePart, timePart = '00:00:00'] = str.split(' ');
      const [d, m, y] = datePart.split('/');
      const [h = '00', min = '00', s = '00'] = timePart.split(':');
      return new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min), Number(s)).getTime();
    }

    // Dạng chuỗi tháng tiếng Anh từ Google Sheet: "Thu Oct 15 2026 00:00:00 GMT+0700"
    const match = str.match(/([A-Za-z]{3})\s+(\d{1,2})\s+(\d{4})/);
    if (match && !str.includes('T')) {
      const d = new Date(str);
      if (!isNaN(d.getTime())) return d.getTime();
    }

    // Dạng ISO từ Supabase (nếu chưa có timezone chỉ định -> ép Z để coi là UTC chuẩn)
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

export function getRemainingCancelMs(createdAtStr, currentNow = Date.now(), windowMinutes = 30) {
  const orderTime = parseOrderTimestampToMs(createdAtStr);
  if (!orderTime) return 0;
  const maxWindowMs = windowMinutes * 60 * 1000;
  const expireTime = orderTime + maxWindowMs;
  const remaining = expireTime - currentNow;
  if (remaining <= 0) return 0;
  return Math.min(remaining, maxWindowMs);
}

export function formatCountdownTimer(ms) {
  if (!ms || ms <= 0) return '00:00';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

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

export function isRecentOrder(createdAtVal) {
  if (!createdAtVal) return false;
  const ms = parseOrderTimestampToMs(createdAtVal);
  if (!ms) return false;
  return Date.now() - ms <= 24 * 60 * 60 * 1000;
}