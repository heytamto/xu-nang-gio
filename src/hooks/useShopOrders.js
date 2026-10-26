// src/hooks/useShopOrders.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { ORDER_STATUS, normalizeOrderStatus } from '../constants/orderStatus';
import { submitOrderToSupabase, fetchActiveProcessingOrders } from '../services/orderService';
import { generatePrefixedDateId } from '../utils/idGenerator';

const VIETNAMESE_SAFE_FONTS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif";

export function useShopOrders(onOrderCreatedSuccess) {
  const [orders, setOrders] = useState(() => {
    try {
      const local = JSON.parse(localStorage.getItem('shop_orders') || '[]');
      return local.map((ord) => ({
        ...ord,
        status: normalizeOrderStatus(ord.status)
      }));
    } catch {
      return [];
    }
  });

  const [successOrderInfo, setSuccessOrderInfo] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Nạp danh sách đơn khởi tạo
  const refreshOrders = useCallback(async () => {
    try {
      const activeOrders = await fetchActiveProcessingOrders();
      if (Array.isArray(activeOrders)) {
        const normalizedOrders = activeOrders.map((o) => ({
          ...o,
          status: normalizeOrderStatus(o.status)
        }));
        setOrders(normalizedOrders);
        localStorage.setItem('shop_orders', JSON.stringify(normalizedOrders));
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách đơn:', err);
    }
  }, []);

  // Lắng nghe Realtime đơn hàng từ Supabase
  useEffect(() => {
    const channel = supabase
      .channel('app:orders-realtime-listener')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          const raw = payload.new;
          if (!raw) return;

          const normalized = {
            ...raw,
            name: raw.customer_name || raw.name,
            total: raw.final_total ?? raw.total,
            paymentMethod: raw.payment_method || raw.paymentMethod,
            createdAt: raw.created_at || raw.createdAt,
            status: normalizeOrderStatus(raw.status)
          };

          if (payload.eventType === 'INSERT') {
            setOrders((prev) => [normalized, ...prev.filter((o) => o.code !== normalized.code)]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((o) => (o.code === normalized.code ? { ...o, ...normalized } : o))
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((o) => o.code !== payload.old?.code && o.id !== payload.old?.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Cập nhật trạng thái đơn
  const handleUpdateOrderStatus = useCallback(async (orderCode, newStatus, reason = null) => {
    const statusCode = normalizeOrderStatus(newStatus);

    setOrders((prev) => {
      const updated = prev.map((ord) => 
        ((ord.code === orderCode || ord.orderId === orderCode) 
          ? { ...ord, status: statusCode, ...(reason ? { cancel_reason: reason } : {}) } 
          : ord)
      );
      try {
        localStorage.setItem('shop_orders', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    try {
      const updatePayload = { 
        status: statusCode,
        updated_at: new Date().toISOString()
      };
      if (reason) {
        updatePayload.cancel_reason = reason;
      }

      const { error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('code', orderCode);

      if (error) console.warn('Lỗi update trạng thái Supabase:', error);
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái đơn hàng:', err);
    }
  }, []);

  // Đặt hàng và gửi mail
  const handleProcessOrder = useCallback(async (orderData, currentCart) => {
    const orderCode = orderData.code || generatePrefixedDateId('XNG');
    const sourceCart = Array.isArray(orderData.cart) && orderData.cart.length > 0 ? orderData.cart : currentCart;
    const finalTotalAmount = Number(orderData.total !== undefined ? orderData.total : orderData.finalTotal) || 0;
    const subtotalAmount = Number(orderData.subtotal || orderData.rawTotal) || finalTotalAmount;

    const campaignGiftsList = sourceCart
      .filter((item) => item.campaign_gift_title)
      .map((item) => `${item.name}: ${item.campaign_gift_title}`)
      .join(' | ');

    const initialStatus = ORDER_STATUS.PENDING;

    const recipientEmail = (orderData.email || orderData.customer?.email || '').trim();
    const recipientName = (orderData.customer?.name || orderData.name || '').trim();
    const recipientPhone = (orderData.customer?.phone || orderData.phone || '').trim();
    const recipientAddress = (orderData.address || orderData.customer?.address || '').trim();
    const recipientNote = (orderData.customer?.note || orderData.note || '').trim();

    const orderPayload = {
      code: orderCode,
      orderId: orderCode,
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      customer: {
        name: recipientName,
        phone: recipientPhone,
        email: recipientEmail,
        address: recipientAddress,
        note: recipientNote
      },
      customer_name: recipientName,
      name: recipientName,
      phone: recipientPhone,
      email: recipientEmail,
      address: recipientAddress,
      note: recipientNote,
      cart: sourceCart.map((item) => ({
        productId: item.productId || item.id,
        id: item.productId || item.id,
        weightId: item.weightId || 'std',
        name: item.name,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        weightLabel: item.weightLabel || '',
        campaign_gift_title: item.campaign_gift_title || null
      })),
      paymentMethod: orderData.paymentMethod || 'deposit',
      payment_method: orderData.paymentMethod || 'deposit',
      paymentGift: orderData.giftTitle || orderData.paymentGift || '',
      campaignGifts: campaignGiftsList || '',
      subtotal: subtotalAmount,
      shipping_fee: Number(orderData.shipping_fee || orderData.shippingFee || 0),
      discount: Number(orderData.discount) || 0,
      discountAmount: Number(orderData.discount) || 0,
      finalTotal: finalTotalAmount,
      final_total: finalTotalAmount,
      total: finalTotalAmount,
      totalAmount: finalTotalAmount,
      rawTotal: subtotalAmount,
      voucherCode: orderData.voucherCode || '',
      voucher: orderData.voucherCode || '',
      usedPreviousOrderCode: orderData.usedPreviousOrderCode || '',
      edgeSignature: orderData.edgeSignature || '',
      status: initialStatus
    };

    setSuccessOrderInfo(orderPayload);
    setIsSuccessModalOpen(true);

    setOrders((prev) => {
      const nextOrders = [orderPayload, ...prev.filter((o) => o.code !== orderCode)];
      try {
        localStorage.setItem('shop_orders', JSON.stringify(nextOrders));
      } catch (err) {
        console.error(err);
      }
      return nextOrders;
    });

    if (onOrderCreatedSuccess) {
      onOrderCreatedSuccess();
    }

    try {
      submitOrderToSupabase(orderPayload)
        .then((res) => {
          if (!res?.success) console.warn('Lỗi ghi nhận Supabase ngầm:', res?.error);
        })
        .catch((err) => {
          console.error('Lỗi network khi gửi đơn ngầm:', err);
        });

      const currentMethod = String(orderPayload.paymentMethod || orderPayload.payment_method || 'deposit').toLowerCase();
      const isCodOrder = currentMethod === 'cod';
      const isAutoPrepaidVerified = Boolean(orderData.isPaymentVerified || orderPayload.payment_verified);

      if (recipientEmail && recipientEmail.includes('@') && (isCodOrder || isAutoPrepaidVerified)) {
        const itemsSummaryHtml = orderPayload.cart.length > 0
          ? orderPayload.cart.map((it) => {
              const qty = Number(it.quantity) || 1;
              const lineTotal = (Number(it.price) || 0) * qty;
              const weight = it.weightLabel ? ` (${it.weightLabel})` : '';
              return `
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 8px; border-bottom: 1px dashed #fde68a; padding-bottom: 6px;">
                  <tr>
                    <td align="left" style="font-size: 13.5px; color: #292524; font-family: ${VIETNAMESE_SAFE_FONTS}; line-height: 1.4;">
                      • <strong>${it.name}</strong>${weight} <span style="color: #b45309; font-weight: 700;">x${qty}</span>
                    </td>
                    <td align="right" style="font-size: 13.5px; font-weight: 700; color: #78350f; font-family: ${VIETNAMESE_SAFE_FONTS}; white-space: nowrap; padding-left: 12px;">
                      ${lineTotal.toLocaleString('vi-VN')}đ
                    </td>
                  </tr>
                </table>
              `;
            }).join('')
          : 'Đặc sản Ninh Thuận hái tươi tại giàn';

        supabase.functions.invoke('send-order-email', {
          body: {
            to: recipientEmail,
            email: recipientEmail,
            customer_email: recipientEmail,
            recipient_email: recipientEmail,
            template_id: 'tpl0001',
            event_type: isCodOrder ? 'ORDER_COD_CREATED' : 'PAYMENT_CONFIRMED',
            customer_name: recipientName,
            order_code: orderCode,
            cart: orderPayload.cart,
            payment_method: isCodOrder ? 'cod' : currentMethod,
            paymentMethod: isCodOrder ? 'cod' : currentMethod,
            deposit_paid: isCodOrder ? 0 : finalTotalAmount,
            remaining_cod: isCodOrder ? finalTotalAmount : 0,
            final_total: finalTotalAmount,
            data: {
              CUSTOMER_NAME: recipientName,
              ORDER_CODE: orderCode,
              FINAL_TOTAL: `${finalTotalAmount.toLocaleString('vi-VN')}đ`,
              TOTAL: finalTotalAmount.toLocaleString('vi-VN') + 'đ',
              PAYMENT_METHOD: isCodOrder ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản 100% (VietQR)',
              DEPOSIT_PAID: '0đ',
              REMAINING_COD: `${finalTotalAmount.toLocaleString('vi-VN')}đ`,
              SHIPPING_ADDRESS: recipientAddress,
              ADDRESS: recipientAddress,
              GIFT_TITLE: orderPayload.paymentGift || 'Nông sản biếu tặng',
              ITEMS_SUMMARY: itemsSummaryHtml
            }
          }
        }).catch((mailErr) => {
          console.warn('Lỗi gọi Edge Function gửi mail COD:', mailErr);
        });
      }
    } catch (err) {
      console.error('Lỗi khởi tạo đồng bộ đơn ngầm:', err);
    }
  }, [onOrderCreatedSuccess]);

  return {
    orders,
    refreshOrders,
    handleUpdateOrderStatus,
    handleProcessOrder,
    successOrderInfo,
    isSuccessModalOpen,
    setIsSuccessModalOpen
  };
}