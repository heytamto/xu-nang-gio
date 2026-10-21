// src/utils/checkoutValidation.js

/**
 * Chuẩn hóa tiếng Việt bỏ dấu (hỗ trợ tìm kiếm nhanh không dấu)
 */
export function normalizeVietnameseText(str = '') {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

/**
 * Loại bỏ các tiền tố đơn vị hành chính để so khớp tên tỉnh/huyện/xã
 */
export function cleanAdministrativeName(str = '') {
  return String(str || '')
    .toLowerCase()
    .replace(/(tỉnh|thành phố|tp\.|tp|quận|huyện|thị xã|phường|xã|thị trấn)/g, '')
    .trim();
}

/**
 * Chuẩn hóa số điện thoại:
 * - Bỏ ký tự đặc biệt, dấu cách, ngoặc
 * - Chuyển +84 hoặc 84 thành 0
 * - Bù số 0 đầu nếu thiếu (9 chữ số)
 * - Cắt chuẩn tối đa 10 chữ số
 */
export function sanitizeVietnamesePhone(raw) {
  if (!raw) return '';
  let str = String(raw).trim().replace(/[\s\-\.\(\)]/g, '');

  if (str.startsWith('+84')) {
    str = '0' + str.slice(3);
  } else if (str.startsWith('84') && str.length >= 11) {
    str = '0' + str.slice(2);
  } else if (!str.startsWith('0') && str.length === 9 && /^[35789]/.test(str)) {
    str = '0' + str;
  }

  return str.replace(/[^0-9]/g, '').slice(0, 10);
}

/**
 * Kiểm tra định dạng số điện thoại di động Việt Nam (đúng 10 số, đầu 03, 05, 07, 08, 09)
 */
export function isValidVietnamesePhone(phone) {
  const clean = String(phone || '').trim().replace(/[^0-9]/g, '');
  return /^0(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/.test(clean);
}

/**
 * Trả về thông báo lỗi cho Số điện thoại
 */
export function validatePhone(phone) {
  const raw = String(phone || '').trim();
  if (!raw) return 'Vui lòng nhập số điện thoại người nhận.';
  if (raw.length !== 10) return `Số điện thoại phải có đúng 10 số (hiện có ${raw.length} số).`;
  if (!isValidVietnamesePhone(raw)) {
    return 'Đầu số không hợp lệ (bắt đầu bằng 03, 05, 07, 08, 09).';
  }
  return '';
}

/**
 * Kiểm tra họ và tên hợp lệ (chữ cái tiếng Việt có dấu, tối thiểu 2 từ, dài >= 4 ký tự)
 */
export function validateName(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return 'Vui lòng nhập họ và tên người nhận.';
  const regex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/;
  if (!regex.test(trimmed)) return 'Họ tên chỉ được chứa chữ cái.';
  if (trimmed.split(/\s+/).filter(Boolean).length < 2 || trimmed.length < 4) {
    return 'Vui lòng nhập đầy đủ cả họ và tên.';
  }
  return '';
}

/**
 * Kiểm tra định dạng Email (không bắt buộc, nếu nhập thì phải chuẩn RFC)
 */
export function validateEmail(email) {
  const trimmed = String(email || '').trim();
  if (!trimmed) return '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? '' : 'Email không đúng định dạng.';
}

/**
 * Kiểm tra địa chỉ nhận hàng
 */
export function validateAddress(address) {
  const trimmed = String(address || '').trim();
  if (!trimmed) return 'Vui lòng chọn hoặc nhập địa chỉ nhận hàng.';
  if (trimmed.length < 8) return 'Địa chỉ nhận hàng quá ngắn, vui lòng nhập rõ ràng.';
  return '';
}