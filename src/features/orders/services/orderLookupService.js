import { orderRepo } from '../../../infrastructure/supabase/repositories/index';
import { supabase } from '../../../infrastructure/supabase/supabaseClient';
import { ORDER_STATUS, normalizeOrderStatus } from '../../orders/constants/orderStatus';

/**
 * 4. TRA CỨU CHI TIẾT ĐƠN HÀNG
 */
export async function lookupOrderDirect(queryValue) {
  const rawVal = String(queryValue || '').trim().replace(/\s+/g, '');
  if (!rawVal) return [];

  const cleanDigits = rawVal.replace(/\D/g, '');
  const upperCode = rawVal.toUpperCase();

  const hasLetters = /[A-Z]/i.test(rawVal);
  const isPhoneSearch = !hasLetters && cleanDigits.length >= 8;

  try {
    const allOrders = await orderRepo.getAll();
    let ordersData = [];

    if (isPhoneSearch) {
      const suffix = cleanDigits.slice(-8);
      ordersData = allOrders.filter((o) => o.phone && o.phone.replace(/\D/g, '').includes(suffix));
    } else {
      ordersData = allOrders.filter((o) => o.code && o.code.toUpperCase().includes(upperCode));
    }

    if (!Array.isArray(ordersData) || ordersData.length === 0) return [];

    const orderCodes = ordersData.map((o) => o.code).filter(Boolean);
    let itemsByOrder = {};

    if (orderCodes.length > 0) {
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .in('order_code', orderCodes);

      if (Array.isArray(itemsData)) {
        itemsData.forEach((it) => {
          const key = it.order_code;
          if (!itemsByOrder[key]) itemsByOrder[key] = [];
          itemsByOrder[key].push({
            id: it.id,
            productId: it.product_id,
            name: it.name || it.product_name,
            weightLabel: it.weight_label,
            price: Number(it.price) || 0,
            quantity: Number(it.quantity) || 1,
            lineTotal: Number(it.line_total) || 0,
            campaignGiftTitle: it.campaign_gift_title
          });
        });
      }
    }

    return ordersData.map((ord) => ({
      ...ord,
      status: normalizeOrderStatus(ord.status),
      order_items: itemsByOrder[ord.code] || ord.cart || []
    }));
  } catch (err) {
    console.error('Lỗi thực thi lookupOrderDirect:', err);
    throw err;
  }
}

/**
 * 6. TẢI ĐƠN HÀNG ĐANG VẬN HÀNH
 */
export async function fetchActiveProcessingOrders() {
  try {
    const activeStatuses = [
      ORDER_STATUS.PENDING,
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.PACKING,
      ORDER_STATUS.SHIPPING,
      ORDER_STATUS.COMPLETED,
      'Chờ xác nhận',
      'Đã xác nhận',
      'Đang đóng gói',
      'Đang giao',
      'Đang giao xe',
      'Hoàn thành'
    ];

    const allOrders = await orderRepo.getAll();
    const ordersData = allOrders.filter((o) => activeStatuses.includes(o.status));

    if (!Array.isArray(ordersData) || ordersData.length === 0) {
      return [];
    }

    const orderCodes = ordersData.map((o) => o.code).filter(Boolean);
    let itemsByOrder = {};

    if (orderCodes.length > 0) {
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .in('order_code', orderCodes);

      if (Array.isArray(itemsData)) {
        itemsData.forEach((it) => {
          const key = it.order_code;
          if (!itemsByOrder[key]) itemsByOrder[key] = [];
          itemsByOrder[key].push({
            id: it.id,
            productId: it.product_id,
            name: it.name || it.product_name,
            weightLabel: it.weight_label,
            price: Number(it.price) || 0,
            quantity: Number(it.quantity) || 1,
            lineTotal: Number(it.line_total) || 0,
            campaignGiftTitle: it.campaign_gift_title
          });
        });
      }
    }

    return ordersData.map((ord) => {
      const cCode = ord.code || ord.order_code || ord.id;
      const itemsList = itemsByOrder[cCode] || ord.cart || [];

      return {
        ...ord,
        code: cCode,
        orderId: cCode,
        customer_name: ord.customer_name || ord.name || ord.customer?.name || 'Khách hàng',
        name: ord.customer_name || ord.name || ord.customer?.name || 'Khách hàng',
        phone: ord.phone || ord.customer?.phone || '',
        total: ord.final_total ?? ord.total ?? 0,
        final_total: ord.final_total ?? ord.total ?? 0,
        paymentMethod: ord.payment_method || ord.paymentMethod || 'deposit',
        payment_method: ord.payment_method || ord.paymentMethod || 'deposit',
        createdAt: ord.created_at || ord.createdAt || new Date().toISOString(),
        status: normalizeOrderStatus(ord.status),
        cart: itemsList,
        order_items: itemsList
      };
    });
  } catch (err) {
    console.warn('Lỗi kết nối fetchActiveProcessingOrders:', err);
    try {
      const cached = localStorage.getItem('shop_orders');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }
}

/**
 * 12. ĐẾM SỐ ĐƠN THỰC TẾ
 */
export async function fetchTotalOrdersCount() {
  try {
    const orders = await orderRepo.getAll();
    return orders.length;
  } catch (err) {
    console.error('Lỗi đếm số lượng đơn hàng:', err);
    return 0;
  }
}
