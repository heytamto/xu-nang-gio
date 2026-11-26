import { normalizeOrderStatus } from '../constants/orderStatus.ts';

export function applyOrderRealtime(orders, payload) {
  if (payload.eventType === 'DELETE') {
    const { id, code } = payload.old || {};
    return orders.filter(order => !((id != null && order.id === id) || (code != null && order.code === code)));
  }
  const raw = payload.new;
  if (!raw || !raw.code) return orders;
  const normalized = {
    ...raw,
    name: raw.customer_name || raw.name,
    total: raw.final_total ?? raw.total,
    paymentMethod: raw.payment_method || raw.paymentMethod,
    createdAt: raw.created_at || raw.createdAt,
    status: normalizeOrderStatus(raw.status),
  };
  if (payload.eventType === 'INSERT') {
    return [normalized, ...orders.filter(order => order.code !== normalized.code)];
  }
  if (payload.eventType === 'UPDATE') {
    return orders.map(order => order.code === normalized.code ? { ...order, ...normalized } : order);
  }
  return orders;
}
