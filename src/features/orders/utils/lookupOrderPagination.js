import { ORDER_STATUS, normalizeOrderStatus } from '../constants/orderStatus.ts';

export const LOOKUP_PAGE_SIZES = Object.freeze([6, 12, 24]);
export const LOOKUP_STATUS_FILTERS = Object.freeze([
  { value: 'all', label: 'Tất cả' },
  { value: ORDER_STATUS.PENDING, label: 'Chờ xác nhận' },
  { value: ORDER_STATUS.CONFIRMED, label: 'Đã xác nhận' },
  { value: ORDER_STATUS.PACKING, label: 'Đang đóng gói' },
  { value: ORDER_STATUS.SHIPPING, label: 'Đang giao' },
  { value: ORDER_STATUS.COMPLETED, label: 'Hoàn thành' },
  { value: ORDER_STATUS.CANCELLED, label: 'Đã hủy' },
  { value: ORDER_STATUS.BOMBED, label: 'Giao không thành công' },
]);

function timestamp(order) {
  const time = Date.parse(order.created_at ?? order.createdAt ?? '');
  return Number.isFinite(time) ? time : -Infinity;
}

export function paginateLookupOrders(orders, { status = 'all', page = 1, pageSize = 6 } = {}) {
  const size = LOOKUP_PAGE_SIZES.includes(pageSize) ? pageSize : 6;
  const rows = Array.isArray(orders) ? orders.filter(Boolean) : [];
  const counts = Object.fromEntries(LOOKUP_STATUS_FILTERS.map(({ value }) => [value, 0]));
  counts.all = rows.length;
  const classified = rows.map(order => {
    const normalized = normalizeOrderStatus(order.status);
    counts[normalized] = (counts[normalized] ?? 0) + 1;
    return { order, status: normalized };
  });
  const selected = LOOKUP_STATUS_FILTERS.some(f => f.value === status) ? status : 'all';
  const filtered = classified.filter(row => selected === 'all' || row.status === selected).map(row => row.order);
  filtered.sort((a, b) => {
    const ta = timestamp(a), tb = timestamp(b);
    if (ta !== tb) return ta > tb ? -1 : 1;
    return String(b.code ?? '').localeCompare(String(a.code ?? ''));
  });
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const currentPage = Math.min(totalPages, Math.max(1, Number.isSafeInteger(page) ? page : 1));
  const offset = (currentPage - 1) * size;
  return { counts, total, totalPages, currentPage, pageSize: size, start: total ? offset + 1 : 0, end: Math.min(offset + size, total), items: filtered.slice(offset, offset + size) };
}
