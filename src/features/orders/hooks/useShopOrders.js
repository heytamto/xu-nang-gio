import { applyOrderRealtime } from '../utils/orderRealtime';
// src/hooks/useShopOrders.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../infrastructure/supabase/supabaseClient';
import { ORDER_STATUS, normalizeOrderStatus } from '../constants/orderStatus';
import { submitOrderToSupabase } from '../services/orderCommandService';
import { fetchActiveProcessingOrders } from '../services/orderLookupService';
import { generatePrefixedDateId } from '../../../shared/utils/idGenerator';


export function useShopOrders(onOrderCreatedSuccess, enableOrderFeed = false) {
  const [orders, setOrders] = useState([]);

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
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách đơn:', err);
    }
  }, []);

  // Lắng nghe Realtime đơn hàng từ Supabase
  useEffect(() => {
    if (!enableOrderFeed) return;
    refreshOrders();
    const channel = supabase
      .channel('app:orders-realtime-listener')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          setOrders(prev => applyOrderRealtime(prev, payload));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enableOrderFeed, refreshOrders]);

  // Đồng bộ trạng thái đã được Admin ghi thành công; không ghi DB lần thứ hai.
  const handleUpdateOrderStatus = useCallback((orderCode, newStatus, reason = null) => {
    const statusCode = normalizeOrderStatus(newStatus);

    setOrders((prev) => {
      const updated = prev.map((ord) => 
        ((ord.code === orderCode || ord.orderId === orderCode) 
          ? { ...ord, status: statusCode, ...(reason ? { cancel_reason: reason } : {}) } 
          : ord)
      );
      return updated;
    });


  }, []);

  // Đặt hàng và gửi mail
  const handleProcessOrder = useCallback(async (orderData, currentCart) => {
    const orderCode = orderData.code || generatePrefixedDateId('XNG');
    const sourceCart = Array.isArray(orderData.cart) && orderData.cart.length > 0 ? orderData.cart : currentCart;
    const finalTotalAmount = Number(orderData.total !== undefined ? orderData.total : orderData.finalTotal) || 0;
    const subtotalAmount = Number(orderData.subtotal ?? orderData.rawTotal ?? finalTotalAmount);

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
      requestId: orderData.requestId,
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
        flavor: item.flavor || null,
        name: item.name,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        weightLabel: item.weightLabel || '',
        campaign_gift_title: item.campaign_gift_title || null
      })),
      paymentMethod: orderData.paymentMethod || 'deposit',
      payment_method: orderData.paymentMethod || 'deposit',
      deposit_amount_expected: orderData.deposit_amount_expected,
      paymentGift: orderData.giftTitle || orderData.paymentGift || '',
      paymentGiftId: orderData.paymentGiftId || null,
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

    // Do not clear the cart or report success before PostgreSQL commits.
    const result = await submitOrderToSupabase(orderPayload);
    if (!result.success) throw new Error('Không thể ghi nhận đơn hàng');
    setSuccessOrderInfo(orderPayload);
    setIsSuccessModalOpen(true);
    if (onOrderCreatedSuccess) onOrderCreatedSuccess();
    // Existing database INSERT trigger owns order-created email delivery.
    // Do not invoke the email endpoint again from checkout.
    return result;

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