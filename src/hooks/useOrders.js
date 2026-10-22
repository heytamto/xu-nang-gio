// src/hooks/useOrders.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient'; // hoặc '../lib/supabaseClient' tuỳ cấu trúc dự án của bạn

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Tải danh sách đơn hàng an toàn (Query 2 bước để chống lỗi quan hệ foreign key)
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Bước 1: Lấy danh sách orders
      const { data: ordersData, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersErr) throw ordersErr;

      if (!Array.isArray(ordersData) || ordersData.length === 0) {
        setOrders([]);
        return;
      }

      // Bước 2: Lấy order_items độc lập theo order_code
      const orderCodes = ordersData.map((o) => o.code).filter(Boolean);
      let itemsByOrder = {};

      if (orderCodes.length > 0) {
        const { data: itemsData, error: itemsErr } = await supabase
          .from('order_items')
          .select('*')
          .in('order_code', orderCodes);

        if (!itemsErr && Array.isArray(itemsData)) {
          itemsData.forEach((it) => {
            const code = it.order_code;
            if (!itemsByOrder[code]) itemsByOrder[code] = [];
            itemsByOrder[code].push({
              id: it.id,
              productId: it.product_id,
              name: it.name || it.product_name,
              weightLabel: it.weight_label,
              flavor: it.flavor,
              price: Number(it.price) || 0,
              quantity: Number(it.quantity) || 1,
              lineTotal: Number(it.line_total) || 0,
              campaignGiftTitle: it.campaign_gift_title
            });
          });
        }
      }

      // Bước 3: Chuẩn hóa dữ liệu tương thích hoàn toàn với DashboardTab & Kho
      const formatted = ordersData.map((ord) => {
        const activeItems = itemsByOrder[ord.code] || ord.cart || [];
        return {
          ...ord,
          total: ord.final_total ?? ord.total,
          totalAmount: ord.final_total ?? ord.total,
          customerName: ord.customer_name || ord.name,
          paymentGift: ord.payment_gift,
          campaignGifts: ord.campaign_gifts,
          order_items: activeItems,
          itemsSummary: activeItems.length > 0
            ? activeItems
                .map((it) => `${it.name} (${it.weightLabel || 'Tiêu chuẩn'}) x${it.quantity}`)
                .join(', ')
            : (ord.items_summary || '')
        };
      });

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
      .channel('public:orders:realtime-hook')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Có đơn mới: Fetch lại đầy đủ để lấy luôn order_items tương ứng
            fetchOrders();
          } else if (payload.eventType === 'UPDATE') {
            const updatedRow = payload.new;
            setOrders((prev) =>
              prev.map((ord) => {
                if (ord.code !== updatedRow.code) return ord;
                return {
                  ...ord,
                  ...updatedRow,
                  total: updatedRow.final_total ?? ord.total,
                  totalAmount: updatedRow.final_total ?? ord.totalAmount,
                  customerName: updatedRow.customer_name ?? ord.customerName,
                  paymentGift: updatedRow.payment_gift ?? ord.paymentGift,
                  campaignGifts: updatedRow.campaign_gifts ?? ord.campaignGifts
                };
              })
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedCode = payload.old?.code;
            if (deletedCode) {
              setOrders((prev) => prev.filter((ord) => ord.code !== deletedCode));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  // 3. Cập nhật trạng thái đơn hàng (Dành cho Admin / Kho gom kiện)
  const updateOrderStatus = async (orderCode, newStatus, reason = '') => {
    try {
      const updatePayload = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      if (reason) {
        updatePayload.cancel_reason = reason;
      }

      const { data, error: updateErr } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('code', orderCode)
        .select();

      if (updateErr) throw updateErr;

      // Cập nhật lạc quan vào state orders
      setOrders((prev) =>
        prev.map((ord) =>
          ord.code === orderCode
            ? { ...ord, status: newStatus, ...(reason ? { cancel_reason: reason } : {}) }
            : ord
        )
      );

      return { success: true, data };
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái:', err);
      return { success: false, error: err.message };
    }
  };

  // 4. Xóa đơn hàng
  const deleteOrder = async (orderCode) => {
    try {
      const { error: delErr } = await supabase
        .from('orders')
        .delete()
        .eq('code', orderCode);

      if (delErr) throw delErr;

      setOrders((prev) => prev.filter((ord) => ord.code !== orderCode));
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