import { useEffect, useRef } from 'react';
import { supabase } from '../../../infrastructure/supabase/supabaseClient';
import { normalizeOrderStatus } from '../constants/orderStatus';

export function useLookupOrderSync(orders, setOrders) {
  const channelRef = useRef(null);
  const orderCodesKey = JSON.stringify([...new Set((Array.isArray(orders) ? orders : []).map(o => o.code).filter(Boolean))].sort());
  // Tự động nhận trạng thái mới nhất qua WebSocket và Polling ngầm
  useEffect(() => {
    const activeOrderCodes = JSON.parse(orderCodesKey);
    if (activeOrderCodes.length === 0) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    let active = true;
    let polling = false;
    const uniqueChannelKey = `lookup_page_orders_${Date.now()}`;
    const channel = supabase
      .channel(uniqueChannelKey)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          if (!active) return;
          const updatedRow = payload.new || payload.record;
          if (!updatedRow?.code || !activeOrderCodes.includes(updatedRow.code)) return;

          setOrders((prev) => {
            if (!prev) return prev;
            return prev.map((o) => {
              if (o.code === updatedRow.code) {
                return {
                  ...o,
                  ...updatedRow,
                  status: normalizeOrderStatus(updatedRow.status),
                  order_items: updatedRow.order_items || o.order_items || [],
                };
              }
              return o;
            });
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    const pollInterval = setInterval(async () => {
      if (!active || polling) return;
      polling = true;
      try {
        const { data: freshOrders, error } = await supabase
          .from('orders')
          .select('*')
          .in('code', activeOrderCodes);

        if (active && !error && Array.isArray(freshOrders)) {
          setOrders((prev) => {
            if (!prev) return prev;
            return prev.map((curr) => {
              const matched = freshOrders.find((f) => f.code === curr.code);
              if (
                matched &&
                (matched.status !== curr.status || matched.payment_verified !== curr.payment_verified)
              ) {
                return {
                  ...curr,
                  ...matched,
                  status: normalizeOrderStatus(matched.status),
                };
              }
              return curr;
            });
          });
        }
      } catch (e) {
        console.warn('Lỗi đồng bộ ngầm:', e);
      } finally {
        polling = false;
      }
    }, 3500);

    return () => {
      active = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      clearInterval(pollInterval);
    };
  }, [orderCodesKey, setOrders]);

}
