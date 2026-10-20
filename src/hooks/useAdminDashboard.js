import { useState, useMemo } from 'react';
import { ORDER_STATUS, normalizeOrderStatus } from '../constants/orderStatus';
import { 
  buildCustomerProfileMap, 
  parseCleanMoney, 
  parseOrderDate, 
  parseOrderTimestamp 
} from '../utils/orderRiskUtils';

export function useAdminDashboard(orders = [], depositAmount = 50000) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilterType, setDateFilterType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState(ORDER_STATUS.PENDING);

  // Phân tích hồ sơ khách hàng
  const customerProfileByPhone = useMemo(() => buildCustomerProfileMap(orders), [orders]);

  const getRiskTraceDetails = (currentOrder) => {
    const currentP = String(currentOrder.phone || currentOrder.customer?.phone || '').replace(/\D/g, '');
    if (currentP.length < 8) return { hasRisk: false, isPardoned: false };
    const key = currentP.slice(-9);
    const profile = customerProfileByPhone.get(`${key}_${currentOrder.code}`);
    if (!profile) return { hasRisk: false, isPardoned: false };

    return {
      hasRisk: profile.hasActiveBombedRisk || profile.hasActiveCancelledRisk,
      isPardoned: profile.isPardoned,
      isBombedRisk: profile.hasActiveBombedRisk,
      isCancelledRisk: profile.hasActiveCancelledRisk,
      primaryRefer: profile.primaryBadOrder ? {
        orderCode: profile.primaryBadOrder.code,
        statusLabel: normalizeOrderStatus(profile.primaryBadOrder.status) === ORDER_STATUS.BOMBED ? 'Bom hàng' : 'Đã hủy',
        reason: profile.badOrderReason
      } : null
    };
  };

  const handleStartDateChange = (val, onShowAlert) => {
    setStartDate(val);
    if (val && endDate) {
      const diffDays = Math.ceil((new Date(endDate) - new Date(val)) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) setEndDate(val);
      else if (diffDays > 30) {
        const maxEnd = new Date(val);
        maxEnd.setDate(maxEnd.getDate() + 30);
        setEndDate(maxEnd.toISOString().split('T')[0]);
        if (onShowAlert) onShowAlert('Khoảng thời gian chọn tối đa là 30 ngày.');
      }
    }
  };

  const handleEndDateChange = (val, onShowAlert) => {
    if (!startDate && val) { setEndDate(val); return; }
    if (startDate && val) {
      const diffDays = Math.ceil((new Date(val) - new Date(startDate)) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) { if (onShowAlert) onShowAlert('Ngày kết thúc không được nhỏ hơn ngày bắt đầu.'); return; }
      if (diffDays > 30) {
        const maxEnd = new Date(startDate);
        maxEnd.setDate(maxEnd.getDate() + 30);
        setEndDate(maxEnd.toISOString().split('T')[0]);
        if (onShowAlert) onShowAlert('Khoảng thời gian chọn tối đa là 30 ngày.');
        return;
      }
    }
    setEndDate(val);
  };

  // Lọc danh sách đơn hàng
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;

    return orders.filter((order) => {
      const rawPhone = String(order.phone || '').replace(/\D/g, '');
      const rawName = String(order.name || '').toLowerCase();
      const rawCode = String(order.code || '').toLowerCase();
      const currentStatusCode = normalizeOrderStatus(order.status);

      const search = searchQuery.trim().toLowerCase();
      const searchPhone = search.replace(/\D/g, '');

      const matchSearch =
        !search ||
        rawCode.includes(search) ||
        rawName.includes(search) ||
        (searchPhone && rawPhone.includes(searchPhone));

      if (!matchSearch) return false;
      if (statusFilter !== 'all' && currentStatusCode !== statusFilter) return false;
      if (dateFilterType === 'all') return true;

      const orderDate = parseOrderDate(order.createdAt);
      if (!orderDate) return true;

      const orderTime = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate()).getTime();
      if (dateFilterType === 'today') return orderTime === todayStart;
      if (dateFilterType === 'yesterday') return orderTime === yesterdayStart;
      if (dateFilterType === '7days') return orderTime >= todayStart - 7 * 86400000 && orderTime <= todayStart;
      if (dateFilterType === '30days') return orderTime >= todayStart - 30 * 86400000 && orderTime <= todayStart;
      if (dateFilterType === 'custom') {
        const startTimestamp = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
        const endTimestamp = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;
        if (startTimestamp && endTimestamp) return orderTime >= startTimestamp && orderTime <= endTimestamp;
        if (startTimestamp) return orderTime >= startTimestamp;
        if (endTimestamp) return orderTime <= endTimestamp;
      }
      return true;
    });
  }, [orders, searchQuery, statusFilter, dateFilterType, startDate, endDate]);

  // Tính toán KPI & Tỷ lệ thất thoát
  const metrics = useMemo(() => {
    const validOrders = filteredOrders.filter((o) => {
      const st = normalizeOrderStatus(o.status);
      return st !== ORDER_STATUS.CANCELLED && st !== ORDER_STATUS.BOMBED;
    });
    const cancelledOrders = filteredOrders.filter((o) => normalizeOrderStatus(o.status) === ORDER_STATUS.CANCELLED);
    const bombedOrders = filteredOrders.filter((o) => normalizeOrderStatus(o.status) === ORDER_STATUS.BOMBED);

    const totalRevenue = validOrders.reduce((sum, o) => sum + parseCleanMoney(o.total), 0);
    const totalOrders = validOrders.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const realReceivedMoney = validOrders.reduce((sum, o) => {
      const st = normalizeOrderStatus(o.status);
      const isConfirmed = st === ORDER_STATUS.CONFIRMED || st === ORDER_STATUS.SHIPPING || st === ORDER_STATUS.COMPLETED;
      if (!isConfirmed) return sum;
      const method = String(o.paymentMethod || '').toLowerCase();
      const numTotal = parseCleanMoney(o.total);
      if (method.includes('100%') || method.includes('full') || st === ORDER_STATUS.COMPLETED) return sum + numTotal;
      if (method.includes('cọc') || method.includes('deposit')) return sum + (Number(depositAmount) || 50000);
      return sum;
    }, 0);

    const retainedDepositFromBombed = bombedOrders.reduce((sum, o) => {
      const method = String(o.paymentMethod || '').toLowerCase();
      if (method.includes('cọc') || method.includes('deposit')) return sum + (Number(depositAmount) || 50000);
      return sum;
    }, 0);

    const grandTotalOrders = filteredOrders.length;
    const badOrderCount = cancelledOrders.length + bombedOrders.length;
    const lossRate = grandTotalOrders > 0 ? Math.round((badOrderCount / grandTotalOrders) * 100) : 0;

    return { 
      totalRevenue, totalOrders, avgOrderValue, realReceivedMoney,
      cancelledCount: cancelledOrders.length, bombedCount: bombedOrders.length,
      retainedDeposit: retainedDepositFromBombed, lossRate
    };
  }, [filteredOrders, depositAmount]);

  // Đặc sản bán chạy
  const topProducts = useMemo(() => {
    const productStats = {};
    const validOrders = filteredOrders.filter((o) => {
      const st = normalizeOrderStatus(o.status);
      return st !== ORDER_STATUS.CANCELLED && st !== ORDER_STATUS.BOMBED;
    });

    validOrders.forEach((order) => {
      if (Array.isArray(order.cart) && order.cart.length > 0) {
        order.cart.forEach((item) => {
          const key = item.name || 'Đặc sản';
          if (!productStats[key]) productStats[key] = { name: key, quantity: 0 };
          productStats[key].quantity += (Number(item.quantity) || 1);
        });
      } else if (order.itemsSummary && typeof order.itemsSummary === 'string') {
        order.itemsSummary.split(',').forEach((p) => {
          const trimmed = p.trim();
          if (!trimmed) return;
          const matchQty = trimmed.match(/x(\d+)\s*$/i);
          let qty = matchQty ? (Number(matchQty[1]) || 1) : 1;
          let prodName = matchQty ? trimmed.replace(/x\d+\s*$/i, '').trim() : trimmed;
          if (!productStats[prodName]) productStats[prodName] = { name: prodName, quantity: 0 };
          productStats[prodName].quantity += qty;
        });
      }
    });

    return Object.values(productStats).sort((a, b) => b.quantity - a.quantity);
  }, [filteredOrders]);

  return {
    searchQuery, setSearchQuery,
    dateFilterType, setDateFilterType,
    startDate, setStartDate,
    endDate, setEndDate,
    statusFilter, setStatusFilter,
    handleStartDateChange,
    handleEndDateChange,
    filteredOrders,
    metrics,
    topProducts,
    getRiskTraceDetails
  };
}