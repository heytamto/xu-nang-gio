// src/constants/orderStatus.js

export const ORDER_STATUS = Object.freeze({
  PENDING: 'pending',       // Chờ xác nhận
  CONFIRMED: 'confirmed',   // Đã xác nhận (chờ đóng gói)
  SHIPPING: 'shipping',     // Đang giao xe
  COMPLETED: 'completed',   // Hoàn thành
  CANCELLED: 'cancelled',   // Đã hủy (khách chủ động xin hủy)
  BOMBED: 'bombed'          // Bom hàng (khách từ chối nhận / không nghe máy)
});

// Map ngược lại nhãn tiếng Việt hiển thị trên giao diện & màu sắc badge
export const ORDER_STATUS_MAP = {
  [ORDER_STATUS.PENDING]: {
    label: 'Chờ xác nhận',
    bg: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  [ORDER_STATUS.CONFIRMED]: {
    label: 'Đã xác nhận',
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  [ORDER_STATUS.SHIPPING]: {
    label: 'Đang giao',
    bg: 'bg-indigo-50 text-indigo-800 border-indigo-200'
  },
  [ORDER_STATUS.COMPLETED]: {
    label: 'Hoàn thành',
    bg: 'bg-stone-100 text-stone-800 border-stone-200'
  },
  [ORDER_STATUS.CANCELLED]: {
    label: 'Đã hủy',
    bg: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  [ORDER_STATUS.BOMBED]: {
    label: 'Bom hàng',
    bg: 'bg-red-100 text-red-900 border-red-300 font-black'
  }
};

/**
 * Chuẩn hóa mọi dạng chuỗi trạng thái (Anh, Việt có dấu, không dấu, viết hoa/thường)
 * về đúng mã Enum kỹ thuật của hệ thống.
 */
export function normalizeOrderStatus(rawStatus) {
  if (!rawStatus) return ORDER_STATUS.PENDING;

  const cleaned = String(rawStatus)
    .normalize('NFC')
    .trim()
    .toLowerCase();

  switch (cleaned) {
    case 'bombed':
    case 'bom hàng':
    case 'bom hang':
      return ORDER_STATUS.BOMBED;

    case 'cancelled':
    case 'đã hủy':
    case 'da huy':
    case 'hủy':
      return ORDER_STATUS.CANCELLED;

    case 'confirmed':
    case 'đã xác nhận':
    case 'da xac nhan':
      return ORDER_STATUS.CONFIRMED;

    case 'shipping':
    case 'đang giao':
    case 'dang giao':
      return ORDER_STATUS.SHIPPING;

    case 'completed':
    case 'hoàn thành':
    case 'hoan thanh':
    case 'đã giao':
      return ORDER_STATUS.COMPLETED;

    case 'pending':
    case 'chờ xác nhận':
    case 'cho xac nhan':
    default:
      return ORDER_STATUS.PENDING;
  }
}