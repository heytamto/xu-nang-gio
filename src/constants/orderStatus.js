export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PACKING: 'packing',       // <-- Thêm mới cho bên Kho
  SHIPPING: 'shipping',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  BOMBED: 'bombed'
};

export const ORDER_STATUS_MAP = {
  [ORDER_STATUS.PENDING]: { label: 'Chờ xác nhận', bg: 'bg-amber-100 text-amber-900 border-amber-300' },
  [ORDER_STATUS.CONFIRMED]: { label: 'Đã xác nhận', bg: 'bg-blue-100 text-blue-900 border-blue-300' },
  [ORDER_STATUS.PACKING]: { label: 'Đang đóng gói', bg: 'bg-purple-100 text-purple-900 border-purple-300' }, // <-- Thêm màu nhận diện kho
  [ORDER_STATUS.SHIPPING]: { label: 'Đang giao xe', bg: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
  [ORDER_STATUS.COMPLETED]: { label: 'Hoàn thành', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  [ORDER_STATUS.CANCELLED]: { label: 'Đã hủy', bg: 'bg-stone-200 text-stone-700 border-stone-300' },
  [ORDER_STATUS.BOMBED]: { label: 'Bom hàng', bg: 'bg-rose-100 text-rose-900 border-rose-300' }
};

export function normalizeOrderStatus(statusStr) {
  if (!statusStr) return ORDER_STATUS.PENDING;
  const s = String(statusStr).trim().toLowerCase();
  if (s === 'đang đóng gói' || s === 'dang dong goi' || s === 'packing' || s.includes('đóng gói')) return ORDER_STATUS.PACKING;
  if (s === 'đã xác nhận' || s === 'da xac nhan' || s === 'confirmed') return ORDER_STATUS.CONFIRMED;
  if (s === 'đang giao' || s === 'dang giao' || s === 'shipping') return ORDER_STATUS.SHIPPING;
  if (s === 'hoàn thành' || s === 'hoan thanh' || s === 'completed') return ORDER_STATUS.COMPLETED;
  if (s === 'đã hủy' || s === 'da huy' || s === 'cancelled') return ORDER_STATUS.CANCELLED;
  if (s === 'bom hàng' || s === 'bom hang' || s === 'bombed') return ORDER_STATUS.BOMBED;
  return ORDER_STATUS.PENDING;
}