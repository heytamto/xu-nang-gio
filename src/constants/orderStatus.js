// src/constants/orderStatus.js

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PACKING: 'packing',    
  SHIPPING: 'shipping',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  BOMBED: 'bombed'
};

export const ORDER_STATUS_MAP = {
  [ORDER_STATUS.PENDING]: { 
    label: 'Chờ xác nhận', 
    bg: 'bg-amber-100 text-amber-900 border-amber-300' 
  },
  [ORDER_STATUS.CONFIRMED]: { 
    label: 'Đã xác nhận', 
    bg: 'bg-blue-100 text-blue-900 border-blue-300' 
  },
  [ORDER_STATUS.PACKING]: { 
    label: 'Đang đóng gói', 
    bg: 'bg-purple-100 text-purple-900 border-purple-300' 
  },
  [ORDER_STATUS.SHIPPING]: { 
    label: 'Đang giao xe', 
    bg: 'bg-indigo-100 text-indigo-900 border-indigo-300' 
  },
  [ORDER_STATUS.COMPLETED]: { 
    label: 'Hoàn thành', 
    bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' 
  },
  [ORDER_STATUS.CANCELLED]: { 
    label: 'Đã hủy', 
    bg: 'bg-stone-200 text-stone-700 border-stone-300' 
  },
  [ORDER_STATUS.BOMBED]: { 
    label: 'Bom hàng', 
    bg: 'bg-rose-100 text-rose-900 border-rose-300' 
  }
};

/**
 * Chuẩn hóa chuỗi trạng thái bất kỳ (tiếng Việt, không dấu, code enum) về mã ORDER_STATUS chuẩn
 */
export function normalizeOrderStatus(statusStr) {
  if (!statusStr) return ORDER_STATUS.PENDING;
  
  const s = String(statusStr).trim().toLowerCase();

  // 1. Đang đóng gói
  if (
    s === 'đang đóng gói' || 
    s === 'dang dong goi' || 
    s === 'packing' || 
    s.includes('đóng gói') ||
    s.includes('dong goi')
  ) {
    return ORDER_STATUS.PACKING;
  }

  // 2. Đã xác nhận
  if (
    s === 'đã xác nhận' || 
    s === 'da xac nhan' || 
    s === 'confirmed' ||
    s.includes('xác nhận') ||
    s.includes('xac nhan')
  ) {
    return ORDER_STATUS.CONFIRMED;
  }

  // 3. Đang giao xe / Đang giao hàng
  if (
    s === 'đang giao' || 
    s === 'dang giao' || 
    s === 'đang giao xe' || 
    s === 'dang giao xe' || 
    s === 'shipping' ||
    s.includes('giao xe') ||
    s.includes('giao hàng')
  ) {
    return ORDER_STATUS.SHIPPING;
  }

  // 4. Hoàn thành
  if (
    s === 'hoàn thành' || 
    s === 'hoan thanh' || 
    s === 'completed' || 
    s === 'thành công'
  ) {
    return ORDER_STATUS.COMPLETED;
  }

  // 5. Đã hủy
  if (
    s === 'đã hủy' || 
    s === 'da huy' || 
    s === 'cancelled' || 
    s === 'canceled'
  ) {
    return ORDER_STATUS.CANCELLED;
  }

  // 6. Bom hàng
  if (
    s === 'bom hàng' || 
    s === 'bom hang' || 
    s === 'bombed' || 
    s === 'boom'
  ) {
    return ORDER_STATUS.BOMBED;
  }

  return ORDER_STATUS.PENDING;
}

/**
 * Lấy nhãn tiếng Việt chuẩn để ghi xuống DB hoặc hiển thị
 */
export function getOrderStatusLabel(statusStr) {
  const code = normalizeOrderStatus(statusStr);
  return ORDER_STATUS_MAP[code]?.label || 'Chờ xác nhận';
}