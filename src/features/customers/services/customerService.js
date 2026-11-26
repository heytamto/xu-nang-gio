import { orderRepo, customerRiskRepo } from '../../../infrastructure/supabase/repositories/index';
import { ORDER_STATUS, normalizeOrderStatus } from '../../orders/constants/orderStatus';

/**
 * 3. TRA CỨU LỊCH SỬ KHÁCH HÀNG QUA REPOSITORIES
 */
export async function fetchCustomerHistory(phone) {
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  if (cleanPhone.length < 8) return null;

  try {
    const last8Digits = cleanPhone.slice(-8);

    const riskProfiles = await customerRiskRepo.getAll();
    const riskProfile = riskProfiles.find((rp) => rp.phone && rp.phone.slice(-8) === last8Digits);

    const allOrders = await orderRepo.getAll();
    const matchedOrders = allOrders.filter((o) => o.phone && o.phone.replace(/\D/g, '').slice(-8) === last8Digits);

    if (!matchedOrders || matchedOrders.length === 0) {
      return {
        isOldCustomer: false,
        isPardoned: false,
        onlyHasBadHistory: false,
        orderCount: 0,
        hasBombedHistory: riskProfile?.risk_level === 'BOMBED_RISK' && !riskProfile?.is_pardoned,
        isFrequentCanceller: riskProfile?.risk_level === 'CANCELLED_RISK' && !riskProfile?.is_pardoned,
        isRiskCustomer: Boolean(riskProfile && !riskProfile.is_pardoned && riskProfile.risk_level !== 'NORMAL'),
        latestOrderCode: null,
        canUseOldCode: false,
        previousInfo: null,
        validOrders: [],
        allCombinedOrders: []
      };
    }

    const latestOrder = matchedOrders[0];
    
    const isBadStatus = (st) => {
      const norm = normalizeOrderStatus(st);
      return norm === ORDER_STATUS.CANCELLED || norm === ORDER_STATUS.BOMBED;
    };

    const validOrders = matchedOrders.filter((o) => !isBadStatus(o.status));
    const hasSuccess = validOrders.length > 0;
    const isLatestSuccess = latestOrder && !isBadStatus(latestOrder.status);
    const isPardoned = riskProfile?.is_pardoned || (isLatestSuccess && hasSuccess);

    const hasBombedHistory = (riskProfile?.risk_level === 'BOMBED_RISK' && !isPardoned) ||
      (!isPardoned && matchedOrders.some((o) => normalizeOrderStatus(o.status) === ORDER_STATUS.BOMBED));

    const hasCancelHistory = (riskProfile?.risk_level === 'CANCELLED_RISK' && !isPardoned) ||
      (!isPardoned && matchedOrders.filter((o) => normalizeOrderStatus(o.status) === ORDER_STATUS.CANCELLED).length >= 2);

    const latestSuccessOrder = hasSuccess ? validOrders[0] : null;

    return {
      isOldCustomer: hasSuccess,
      isPardoned,
      onlyHasBadHistory: !hasSuccess && (hasBombedHistory || hasCancelHistory),
      orderCount: validOrders.length,
      hasBombedHistory,
      isFrequentCanceller: hasCancelHistory,
      isRiskCustomer: hasBombedHistory || hasCancelHistory,
      latestOrderCode: latestSuccessOrder ? latestSuccessOrder.code : null,
      canUseOldCode: Boolean(latestSuccessOrder),
      validOrders,
      allCombinedOrders: matchedOrders,
      previousInfo: latestSuccessOrder ? {
        name: latestSuccessOrder.customer_name || '',
        address: latestSuccessOrder.address || '',
        email: latestSuccessOrder.email || ''
      } : null
    };
  } catch (err) {
    console.warn('Lỗi fetchCustomerHistory:', err);
    return null;
  }
}

/**
 * 16. KIỂM TRA RỦI RO BOM ĐƠN / HỦY ĐƠN CỦA SỐ ĐIỆN THOẠI
 */
export async function checkCustomerOrderRisk(phone) {
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  if (cleanPhone.length < 9) {
    return { lastOrderBombed: false, twoRecentCancelled: false, totalOrders: 0 };
  }

  try {
    const allOrders = await orderRepo.getAll();
    const orders = allOrders.filter((o) => o.phone && o.phone.replace(/\D/g, '') === cleanPhone).slice(0, 5);

    if (!Array.isArray(orders) || orders.length === 0) {
      return { lastOrderBombed: false, twoRecentCancelled: false, totalOrders: 0 };
    }

    const normalizedOrders = orders.map((o) => ({
      ...o,
      status: normalizeOrderStatus(o.status),
    }));

    const lastOrder = normalizedOrders[0];
    const lastOrderBombed = lastOrder?.status === ORDER_STATUS.BOMBED;

    const twoRecentCancelled =
      normalizedOrders.length >= 2 &&
      normalizedOrders[0]?.status === ORDER_STATUS.CANCELLED &&
      normalizedOrders[1]?.status === ORDER_STATUS.CANCELLED;

    return {
      lastOrderBombed,
      twoRecentCancelled,
      totalOrders: normalizedOrders.length,
    };
  } catch (err) {
    console.warn('Lỗi tra cứu rủi ro khách hàng:', err);
    return { lastOrderBombed: false, twoRecentCancelled: false, totalOrders: 0 };
  }
}
