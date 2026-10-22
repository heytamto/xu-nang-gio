// src/hooks/useOrders.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Hàm tải toàn bộ danh sách đơn hàng kèm chi tiết món
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;

      // Chuẩn hóa dữ liệu tương thích với format hiển thị của DashboardTab
      const formatted = (data || []).map((ord) => ({
        ...ord,
        total: ord.final_total,
        totalAmount: ord.final_total,
        customerName: ord.customer_name,
        giftTitle: ord.payment_gift,
        campaignGifts: ord.campaign_gifts,
        itemsSummary: ord.order_items?.length
          ? ord.order_items
              .map((it) => `${it.product_name} (${it.weight_label || 'Tiêu chuẩn'}) x${it.quantity}`)
              .join(', ')
          : ''
      }));

      setOrders(formatted);
    } catch (err) {
      console.error('Lỗi tải đơn hàng từ Supabase:', err);
      setError(err.message || 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Kích hoạt Realtime Subscription từ PostgreSQL CDC
  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('orders_realtime_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Có đơn mới: Tải lại hoặc cập nhật trực tiếp vào đầu danh sách
            fetchOrders();
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((ord) => (ord.code === payload.new.code ? { ...ord, ...payload.new } : ord))
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((ord) => ord.code === payload.old.code));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  // 3. Hàm cập nhật trạng thái đơn hàng (Dành cho Admin/Kho)
  const updateOrderStatus = async (orderCode, newStatus, reason = '') => {
    try {
      const { error: updateErr } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          cancel_reason: reason || null,
          updated_at: new Date().toISOString()
        })
        .eq('code', orderCode);

      if (updateErr) throw updateErr;
      return { success: true };
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái:', err);
      return { success: false, error: err.message };
    }
  };

  // 4. Hàm xóa đơn hàng
  const deleteOrder = async (orderCode) => {
    try {
      const { error: delErr } = await supabase
        .from('orders')
        .delete()
        .eq('code', orderCode);

      if (delErr) throw delErr;
      return { success: true };
    } catch (err) {
      console.error('Lỗi xóa đơn hàng:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    orders,
    loading,
    error,
    refreshOrders: fetchOrders,
    updateOrderStatus,
    deleteOrder
  };
}