/**
 * Chuẩn hóa và format ngày tháng từ Google Sheet/ISO/Timestamp sang dạng dễ đọc
 */

const MONTH_MAP = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
};

// Format ngày: dd/MM/yyyy (VD: 15/10/2026)
export function formatDate(val, fallback = '') {
  if (!val) return fallback;
  let str = String(val).trim();

  // 1. Đã chuẩn dạng dd/MM/yyyy hoặc d/M/yyyy
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  // 2. Định dạng YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const [y, m, d] = str.split('T')[0].split('-');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  // 3. Xử lý chuỗi Google Sheet: "Thu Oct 15 2026 00:00:00 GMT+0700 (Giờ Đông Dương)"
  // Loại bỏ phần chú giải trong ngoặc đơn để new Date() không bị trả về NaN
  const cleanStr = str.replace(/\s*\(.*?\)\s*/g, '');
  const d = new Date(cleanStr);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // 4. Fallback Regex bóc tách trực tiếp tháng tiếng Anh: "Thu Oct 15 2026"
  const match = str.match(/([A-Za-z]{3})\s+(\d{1,2})\s+(\d{4})/);
  if (match) {
    const mStr = match[1];
    const dayStr = match[2].padStart(2, '0');
    const yearStr = match[3];
    if (MONTH_MAP[mStr]) {
      return `${dayStr}/${MONTH_MAP[mStr]}/${yearStr}`;
    }
  }

  return str.split('T')[0] || fallback;
}

// Format ngày kèm giờ: dd/MM/yyyy HH:mm (VD: 15/10/2026 14:30)
export function formatDateTime(val, fallback = 'Gần đây') {
  if (!val) return fallback;
  try {
    const cleanVal = String(val).replace(/\s*\(.*?\)\s*/g, '');
    const d = new Date(cleanVal);
    if (isNaN(d.getTime())) return formatDate(val, fallback);

    const date = d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const time = d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${date} ${time}`;
  } catch {
    return formatDate(val, fallback);
  }
}

// Kiểm tra xem đơn có phải vừa tạo trong vòng 24h không (dành cho badge "Đơn mới")
export function isRecentOrder(createdAtStr) {
  if (!createdAtStr) return false;
  try {
    const cleanStr = String(createdAtStr).replace(/\s*\(.*?\)\s*/g, '');
    let d = new Date(cleanStr);
    if (isNaN(d.getTime()) && cleanStr.includes('/')) {
      const [datePart, timePart] = cleanStr.split(' ');
      const [day, month, year] = datePart.split('/');
      const [hour, min, sec] = (timePart || '0:0:0').split(':');
      d = new Date(year, month - 1, day, hour, min, sec || 0);
    }
    return !isNaN(d.getTime()) && (Date.now() - d.getTime()) <= 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}