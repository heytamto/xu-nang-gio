// src/utils/idGenerator.js

/**
 * Tạo mã nhận diện chuẩn 1 dấu gạch nối: [Tiền tố][YYMMDD]-[4 số ngẫu nhiên]
 * Ví dụ: XNG261026-9812, CAT261026-4521, GIFT261026-7819
 * @param {string} prefix Tiền tố mã (mặc định 'XNG')
 * @returns {string} Mã dạng: XNG261026-9812
 */
export function generatePrefixedDateId(prefix = 'XNG') {
  const now = new Date();
  
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  
  const dateStr = `${yy}${mm}${dd}`;
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  
  return `${prefix.toUpperCase()}${dateStr}-${randomNum}`;
}