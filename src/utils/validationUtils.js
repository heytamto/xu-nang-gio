// src/utils/validationUtils.js

/**
 * Chuyển đổi chuỗi tiếng Việt có dấu thành không dấu và chuẩn hóa chữ thường
 */
export function normalizeVietnameseText(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Chuẩn hóa tên đơn vị hành chính (Tỉnh/Thành, Quận/Huyện, Phường/Xã)
 */
export function cleanAdministrativeName(val) {
  if (!val) return '';
  return String(val)
    .trim()
    .replace(/^(tỉnh|thành phố|tp\.|tp|quận|huyện|thị xã|tx\.|tx|phường|xã|thị trấn|tt\.)\s+/i, '')
    .trim();
}

/**
 * Chuẩn hóa chuỗi địa chỉ chi tiết
 */
export function sanitizeAddressText(raw) {
  if (!raw) return '';
  return String(raw)
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[\r\n\t]/g, ' ');
}

/**
 * Chuẩn hóa số điện thoại di động Việt Nam về dạng 10 chữ số chuẩn (đầu 0)
 */
export function sanitizeVietnamesePhone(raw) {
  if (!raw) return '';
  let str = String(raw).trim().replace(/[\s\-().]/g, '');
  if (str.startsWith('+84')) str = '0' + str.slice(3);
  else if (str.startsWith('84') && str.length >= 11) str = '0' + str.slice(2);
  else if (!str.startsWith('0') && str.length === 9 && /^[35789]/.test(str)) str = '0' + str;
  return str.replace(/\D/g, '').slice(0, 10);
}

/**
 * Kiểm tra số điện thoại di động Việt Nam có hợp lệ hay không (trả về boolean true/false)
 */
export function isValidVietnamesePhone(phone) {
  const clean = sanitizeVietnamesePhone(phone);
  if (!clean || clean.length !== 10) return false;
  return /^0(3[2-9]|5[25689]|7[016-9]|8[1-9]|9[0-9])[0-9]{7}$/.test(clean);
}

/**
 * Validate số điện thoại di động Việt Nam (trả về chuỗi thông báo lỗi)
 */
export function validatePhone(phone) {
  const clean = sanitizeVietnamesePhone(phone);
  if (!clean) return 'Vui lòng nhập số điện thoại người nhận.';
  if (clean.length !== 10) return `Số điện thoại phải có đúng 10 số (hiện có ${clean.length} số).`;
  if (!/^0(3[2-9]|5[25689]|7[016-9]|8[1-9]|9[0-9])[0-9]{7}$/.test(clean)) return 'Đầu số di động không hợp lệ.';
  return '';
}

/**
 * Validate họ và tên người nhận hàng
 */
export function validateName(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return 'Vui lòng nhập họ và tên người nhận.';
  if (!/^[\p{L}\s]+$/u.test(trimmed)) return 'Họ tên chỉ được chứa chữ cái.';
  if (trimmed.split(/\s+/).filter(Boolean).length < 2 || trimmed.length < 4) return 'Vui lòng nhập đầy đủ cả họ và tên.';
  return '';
}

/**
 * Validate địa chỉ nhận hàng
 */
export function validateAddress(address) {
  const trimmed = String(address || '').trim();
  if (!trimmed) return 'Vui lòng nhập địa chỉ nhận hàng.';
  if (trimmed.length < 8) return 'Địa chỉ nhận hàng quá ngắn, vui lòng nhập rõ ràng (số nhà, tên đường hoặc thôn xóm).';
  return '';
}

/**
 * Validate email
 */
export function validateEmail(email) {
  const trimmed = String(email || '').trim();
  if (!trimmed) return '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Địa chỉ email không đúng định dạng.';
  return '';
}