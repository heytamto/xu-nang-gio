import { submitAtomicOrder } from './atomicOrderRequest';
import { orderRepo } from '../../../infrastructure/supabase/repositories/index';
import { supabase } from '../../../infrastructure/supabase/supabaseClient';
import { parseOrderTimestampToMs } from '../../../shared/utils/dateUtils';
import { ORDER_STATUS, normalizeOrderStatus } from '../../orders/constants/orderStatus';

/**
 * 1. TẠO ĐƠN HÀNG NGUYÊN TỬ VÀO POSTGRESQL (GỌI QUA ORDER REPOSITORY)
 */
export async function submitOrderToSupabase(orderData) {
  return submitAtomicOrder(supabase, orderData);
}

/**
 * 5. HỦY ĐƠN HÀNG (Gọi qua orderRepo)
 */
export async function cancelOrderDirect(orderCode, cancelReason) {
  const allOrders = await orderRepo.getAll();
  const ord = allOrders.find((o) => o.code === orderCode);

  if (!ord) {
    throw new Error('Không tìm thấy đơn hàng cần hủy.');
  }

  const orderTimeMs = parseOrderTimestampToMs(ord.created_at);
  const elapsedMs = Date.now() - orderTimeMs;
  const thirtyMinutesMs = 30 * 60 * 1000;

  if (orderTimeMs > 0 && elapsedMs > thirtyMinutesMs) {
    throw new Error('Đã quá thời gian 30 phút đổi ý. Đơn hàng đã được chốt đóng thùng.');
  }

  const updatedData = await orderRepo.update(orderCode, {
    status: ORDER_STATUS.CANCELLED,
    cancel_reason: cancelReason || 'Khách đổi ý hủy đơn'
  }, 'code');

  return {
    ...updatedData,
    status: normalizeOrderStatus(updatedData.status)
  };
}
