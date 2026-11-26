// src/hooks/useAdminOrders.js
import { useState, useCallback, useEffect } from 'react';
import { orderRepo, orderItemRepo } from '../repositories';
import { supabase } from '../supabaseClient';
import { ORDER_STATUS, ORDER_STATUS_MAP, normalizeOrderStatus } from '../constants/orderStatus';

export function useAdminOrders(isAuthenticated, shopConfig, onUpdateOrderStatus, showSavedToast, setModalConfig) {
  const [dbOrders, setDbOrders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('shop_orders') || '[]');
    } catch {
      return [];
    }
  });
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [actionLoadingCode, setActionLoadingCode] = useState(null);
  const [confirmingOrderCode, setConfirmingOrderCode] = useState(null);

  // Tải đơn hàng qua Repository
  const fetchOrdersFromDatabase = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingOrders(true);
    try {
      const ordersData = await orderRepo.getAll();

      if (!Array.isArray(ordersData) || ordersData.length === 0) {
        setDbOrders([]);
        return;
      }

      const orderCodes = ordersData.map((o) => o.code).filter(Boolean);
      let itemsMap = {};

      if (orderCodes.length > 0) {
        const itemsData = await orderItemRepo.getAll();
        if (Array.isArray(itemsData)) {
          itemsData.forEach((item) => {
            if (orderCodes.includes(item.order_code)) {
              const key = item.order_code;
              if (!itemsMap[key]) itemsMap[key] = [];
              itemsMap[key].push(item);
            }
          });
        }
      }

      const mergedOrders = ordersData.map((ord) => ({
        ...ord,
        status: normalizeOrderStatus(ord.status),
        order_items: itemsMap[ord.code] || ord.cart || []
      }));

      setDbOrders(mergedOrders);
      try {
        localStorage.setItem('shop_orders', JSON.stringify(mergedOrders));
      } catch (e) {
        console.error(e);
      }
    } catch (err) {
      console.error('Lỗi tải đơn hàng qua Repo:', err);
      try {
        const local = JSON.parse(localStorage.getItem('shop_orders') || '[]');
        setDbOrders(local);
      } catch {
        setDbOrders([]);
      }
    } finally {
      setIsLoadingOrders(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrdersFromDatabase();
    }
  }, [isAuthenticated, fetchOrdersFromDatabase]);

  // Cập nhật trạng thái qua dropdown (chỉ update DB)
  const handleUpdateStatus = async (orderCode, newStatusRaw, reason = null) => {
    const normalizedStatus = normalizeOrderStatus(newStatusRaw);
    setActionLoadingCode(orderCode);
    try {
      const updatePayload = { status: normalizedStatus };
      if (reason) updatePayload.cancel_reason = reason;

      const updatedRecord = await orderRepo.update(orderCode, updatePayload, 'code');
      if (!updatedRecord) {
        throw new Error('Cập nhật thất bại. Vui lòng kiểm tra quyền truy cập Supabase.');
      }

      setDbOrders((prev) => {
        const nextOrders = prev.map((ord) => 
          (ord.code === orderCode 
            ? { ...ord, status: normalizedStatus, ...(reason ? { cancel_reason: reason } : {}) } 
            : ord)
        );
        try { localStorage.setItem('shop_orders', JSON.stringify(nextOrders)); } catch (e) {}
        return nextOrders;
      });
      
      if (onUpdateOrderStatus) {
        onUpdateOrderStatus(orderCode, normalizedStatus, reason);
      }

      const statusLabel = ORDER_STATUS_MAP[normalizedStatus]?.label || normalizedStatus;
      showSavedToast(`Đã chuyển đơn ${orderCode} sang "${statusLabel}"`);
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái đơn:', err);
      setModalConfig({ 
        title: 'Lỗi Cập Nhật Trạng Thái', 
        message: err.message || 'Không thể lưu trạng thái vào cơ sở dữ liệu.', 
        isAlert: true 
      });
    } finally {
      setActionLoadingCode(null);
    }
  };

  // Duyệt thanh toán cọc và gửi email
  const handleConfirmPaymentAndNotify = async (order) => {
    if (!order || !order.code) return;
    setConfirmingOrderCode(order.code);

    try {
      const totalOrderNum = Number(order.final_total || order.total || 0);
      const configuredDeposit = Number(shopConfig?.depositAmount || 50000);
      
      const verifiedAmount = order.payment_method === 'deposit' 
        ? Math.min(configuredDeposit, totalOrderNum) 
        : totalOrderNum;

      const updatedStatus = ORDER_STATUS.CONFIRMED;
      const nowIso = new Date().toISOString();

      await orderRepo.update(order.code, {
        status: updatedStatus,
        payment_verified: true,
        deposit_paid: verifiedAmount,
        payment_verified_at: nowIso
      }, 'code');

      const customerEmail = order.email || order.customer?.email;
      let emailSent = false;

      if (customerEmail && customerEmail.includes('@')) {
        try {
          const remainingCod = Math.max(0, totalOrderNum - verifiedAmount);
          const { error: mailError } = await supabase.functions.invoke('send-order-email', {
            body: {
              to: customerEmail,
              template: 'payment_success',
              order_code: order.code,
              customer_name: order.customer_name || order.name || 'Quý khách',
              payment_method: order.payment_method,
              deposit_paid: verifiedAmount,
              final_total: totalOrderNum,
              remaining_cod: remainingCod,
              items: order.order_items || order.cart || []
            }
          });
          if (!mailError) emailSent = true;
        } catch (mailErr) {
          console.warn('Gửi email thông báo thất bại:', mailErr);
        }
      }

      setDbOrders((prev) => {
        const nextOrders = prev.map((o) =>
          o.code === order.code
            ? {
                ...o,
                status: updatedStatus,
                payment_verified: true,
                deposit_paid: verifiedAmount,
                payment_verified_at: nowIso
              }
            : o
        );
        try { localStorage.setItem('shop_orders', JSON.stringify(nextOrders)); } catch (e) {}
        return nextOrders;
      });

      if (onUpdateOrderStatus) {
        onUpdateOrderStatus(order.code, updatedStatus);
      }

      showSavedToast(
        `Đã duyệt đơn #${order.code}!` + (emailSent ? ` (Đã gửi email đến ${customerEmail})` : '')
      );
    } catch (err) {
      console.error('Lỗi khi duyệt thanh toán:', err);
      setModalConfig({
        title: 'Lỗi Duyệt Thanh Toán',
        message: err.message || 'Không thể cập nhật đơn hàng.',
        isAlert: true
      });
    } finally {
      setConfirmingOrderCode(null);
    }
  };

  // Xóa đơn hàng
  const handleDeleteOrder = (orderCode) => {
    setModalConfig({
      title: 'Xác Nhận Xóa Đơn',
      message: `Bạn có chắc muốn xóa vĩnh viễn đơn ${orderCode} khỏi cơ sở dữ liệu?`,
      confirmLabel: 'Đồng ý xóa',
      onConfirm: async () => {
        setActionLoadingCode(orderCode);
        try {
          await orderRepo.remove(orderCode, 'code');
          setDbOrders((prev) => {
            const nextOrders = prev.filter((ord) => ord.code !== orderCode);
            try { localStorage.setItem('shop_orders', JSON.stringify(nextOrders)); } catch (e) {}
            return nextOrders;
          });
          showSavedToast(`Đã xóa đơn hàng ${orderCode}`);
        } catch (err) {
          setModalConfig({ title: 'Lỗi', message: err.message, isAlert: true });
        } finally {
          setActionLoadingCode(null);
        }
      }
    });
  };

  return {
    dbOrders,
    isLoadingOrders,
    actionLoadingCode,
    confirmingOrderCode,
    fetchOrdersFromDatabase,
    handleUpdateStatus,
    handleConfirmPaymentAndNotify,
    handleDeleteOrder
  };
}