import { fetchOrderItemsByCodes } from './orderItemsQuery';
import { mapOrderItem, mapOrderWithItems } from "../mappers/orderMapper";
// src/repositories/orderRepository.js
import { createRepository } from './baseRepository';
import { supabase } from '../supabaseClient';

const baseOrderRepo = createRepository('orders', { strategy: 'manual_slug' });

export const orderRepo = {
  ...baseOrderRepo,

  /**
   * Lấy danh sách orders kèm order_items (Query 2 bước để độc lập FK)
   */
  async getAllWithItems() {
    // Bước 1: Lấy danh sách orders mới nhất
    const { data: ordersData, error: ordersErr } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersErr) throw ordersErr;
    if (!Array.isArray(ordersData) || ordersData.length === 0) return [];

    // Bước 2: Lấy order_items độc lập theo order_code
    const orderCodes = ordersData.map((o) => o.code).filter(Boolean);
    let itemsByOrder = {};

    if (orderCodes.length > 0) {
      const itemsData = await fetchOrderItemsByCodes(supabase, orderCodes);
      itemsData.forEach(it => {
        const code = it.order_code;
        if (!itemsByOrder[code]) itemsByOrder[code] = [];
        itemsByOrder[code].push(mapOrderItem(it));
      });
    }

    // Bước 3: Chuẩn hóa dữ liệu tương thích với DashboardTab & Kho
    return ordersData.map((ord) => mapOrderWithItems(ord, itemsByOrder));
  },

  /**
   * Cập nhật trạng thái đơn hàng (sử dụng code làm khóa định danh)
   */
  async updateStatus(orderCode, newStatus, reason = '') {
    const updatePayload = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };
    if (reason) {
      updatePayload.cancel_reason = reason;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('code', orderCode)
      .select();

    if (error) throw error;
    return data;
  },

  /**
   * Xóa đơn hàng theo code
   */
  async removeByCode(orderCode) {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('code', orderCode);

    if (error) throw error;
    return true;
  },

  /**
   * Đăng ký lắng nghe sự kiện Realtime thay đổi dữ liệu đơn hàng
   */
  subscribeToChanges(callbacks = {}) {
    const channel = supabase
      .channel('public:orders:realtime-hook')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            callbacks.onInsert?.(payload.new);
          } else if (payload.eventType === 'UPDATE') {
            callbacks.onUpdate?.(payload.new);
          } else if (payload.eventType === 'DELETE') {
            callbacks.onDelete?.(payload.old);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};

export default orderRepo;