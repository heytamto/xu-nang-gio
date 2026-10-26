// src/components/admin/DashboardTab.jsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { History, ArrowLeft } from 'lucide-react';
import { ORDER_STATUS, ORDER_STATUS_MAP, normalizeOrderStatus } from '../../constants/orderStatus';
import { parseCleanMoney } from '../../services/customerRiskService';
import ConfirmModal from './ConfirmModal';

import { 
  FORWARD_STATUS_MAP, 
  resolveDepositAmount, 
  getActiveBankLabel 
} from './dashboard/dashboardUtils';
import DashboardMetricsCard from './dashboard/DashboardMetricsCard';
import DashboardFilterBar from './dashboard/DashboardFilterBar';
import DashboardOrderRow from './dashboard/DashboardOrderRow';
import DashboardOrderGridCard from './dashboard/DashboardOrderGridCard';
import BulkActionBar from './dashboard/BulkActionBar';
import PaymentVerificationModal from './dashboard/PaymentVerificationModal';
import StatusReasonModal from './dashboard/StatusReasonModal';
import OverrideStatusModal from './dashboard/OverrideStatusModal';

function parseDateForSort(dateStr) {
  if (!dateStr) return 0;
  if (dateStr instanceof Date) return dateStr.getTime();
  let str = String(dateStr).trim().replace(/\s*\(.*?\)\s*/g, '');
  if (str.includes('/')) {
    const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}):(\d{1,2}))?/);
    if (match) {
      const [, d, m, y, hr = '0', min = '0', sec = '0'] = match;
      return new Date(Number(y), Number(m) - 1, Number(d), Number(hr), Number(min), Number(sec)).getTime();
    }
  }
  const t = new Date(str).getTime();
  return isNaN(t) ? 0 : t;
}

export default function DashboardTab({
  orders = [],
  isLoading = false,
  shopConfig = {},
  onUpdateStatus,
  onDeleteOrder,
  onConfirmPayment,
  confirmingOrderCode = null,
  actionLoadingCode = null,
  onShowAlert
}) {
  const activeConfigDeposit = resolveDepositAmount(shopConfig);
  const bankLabel = getActiveBankLabel(shopConfig);

  // 1. Quản lý bộ lọc & tìm kiếm trực tiếp
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilterType, setDateFilterType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleStartDateChange = useCallback((val) => setStartDate(val), []);
  const handleEndDateChange = useCallback((val) => setEndDate(val), []);

  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('shop_admin_dashboard_view_mode') || 'list';
  });

  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('shop_admin_dashboard_view_mode', mode);
  };

  const [selectedOrderCodes, setSelectedOrderCodes] = useState([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const [pendingStatusModal, setPendingStatusModal] = useState(null);
  const [paymentVerificationModal, setPaymentVerificationModal] = useState(null);
  const [overrideModal, setOverrideModal] = useState(null);
  const [confirmModalConfig, setConfirmModalConfig] = useState(null);

  useEffect(() => {
    setSelectedOrderCodes([]);
  }, [statusFilter, dateFilterType, searchQuery]);

  // 2. Tra cứu hồ sơ rủi ro khách hàng
  const getRiskTraceDetails = useCallback((ord) => {
    const rawPhone = String(ord?.phone || ord?.customer?.phone || '').replace(/\D/g, '');
    if (!rawPhone || rawPhone.length < 8) {
      return { hasRisk: false, isPardoned: false, isBombedRisk: false, isCancelledRisk: false, primaryRefer: null };
    }

    const last8 = rawPhone.slice(-8);
    const relatedOrders = orders.filter((o) => {
      const p = String(o.phone || o.customer?.phone || '').replace(/\D/g, '');
      return p && p.slice(-8) === last8 && o.code !== ord.code;
    });

    const isBombed = relatedOrders.some((o) => normalizeOrderStatus(o.status) === ORDER_STATUS.BOMBED);
    const cancelledCount = relatedOrders.filter((o) => normalizeOrderStatus(o.status) === ORDER_STATUS.CANCELLED).length;
    const isCancelled = cancelledCount >= 2;
    const hasCompleted = relatedOrders.some((o) => normalizeOrderStatus(o.status) === ORDER_STATUS.COMPLETED);

    return {
      hasRisk: isBombed || isCancelled,
      isPardoned: hasCompleted,
      isBombedRisk: isBombed && !hasCompleted,
      isCancelledRisk: isCancelled && !hasCompleted,
      primaryRefer: relatedOrders.length > 0 ? relatedOrders[0].code : null
    };
  }, [orders]);

  // 3. Lọc danh sách đơn hàng theo điều kiện
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const cleanQuery = searchQuery.trim().toLowerCase();

    return orders.filter((ord) => {
      // Lọc trạng thái
      if (statusFilter !== 'all') {
        const normStatus = normalizeOrderStatus(ord.status);
        if (normStatus !== statusFilter) return false;
      }

      // Lọc thời gian
      const orderTime = parseDateForSort(ord.created_at || ord.createdAt);
      if (orderTime > 0) {
        if (dateFilterType === 'today') {
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          if (orderTime < startOfToday) return false;
        } else if (dateFilterType === 'yesterday') {
          const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
          const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          if (orderTime < startOfYesterday || orderTime >= endOfYesterday) return false;
        } else if (dateFilterType === '7days') {
          const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
          if (orderTime < sevenDaysAgo) return false;
        } else if (dateFilterType === '30days') {
          const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
          if (orderTime < thirtyDaysAgo) return false;
        } else if (dateFilterType === 'this_month') {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
          if (orderTime < startOfMonth) return false;
        } else if (dateFilterType === 'custom') {
          if (startDate) {
            const startLimit = new Date(startDate).getTime();
            if (orderTime < startLimit) return false;
          }
          if (endDate) {
            const endLimit = new Date(endDate).getTime() + 24 * 60 * 60 * 1000;
            if (orderTime >= endLimit) return false;
          }
        }
      }

      // Lọc từ khóa
      if (cleanQuery) {
        const code = String(ord.code || ord.orderId || '').toLowerCase();
        const name = String(ord.customer_name || ord.name || ord.customer?.name || '').toLowerCase();
        const phone = String(ord.phone || ord.customer?.phone || '').toLowerCase();
        const address = String(ord.address || ord.customer?.address || '').toLowerCase();

        return code.includes(cleanQuery) || name.includes(cleanQuery) || phone.includes(cleanQuery) || address.includes(cleanQuery);
      }

      return true;
    });
  }, [orders, statusFilter, dateFilterType, startDate, endDate, searchQuery]);

  // 4. Tính toán Metrics KPI & Doanh thu
  // 4. Tính toán Metrics KPI & Doanh thu đầy đủ trường cho DashboardMetricsCard
  const metrics = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let revenue = 0;
    let revenueToday = 0;
    let revenueMonth = 0;
    let pendingCount = 0;
    let confirmedCount = 0;
    let packingCount = 0;
    let shippingCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    let bombedCount = 0;

    let collectedRevenue = 0;
    let codToCollect = 0;

    orders.forEach((ord) => {
      const st = normalizeOrderStatus(ord.status);
      const total = parseCleanMoney(ord.final_total ?? ord.total ?? 0);
      const depositPaid = Number(ord.deposit_paid ?? 0);
      const orderTime = parseDateForSort(ord.created_at || ord.createdAt);

      if (st === ORDER_STATUS.COMPLETED) {
        revenue += total;
        completedCount += 1;
        if (orderTime >= startOfToday) revenueToday += total;
        if (orderTime >= startOfMonth) revenueMonth += total;
      } else if (st === ORDER_STATUS.PENDING) {
        pendingCount += 1;
      } else if (st === ORDER_STATUS.CONFIRMED) {
        confirmedCount += 1;
      } else if (st === ORDER_STATUS.PACKING) {
        packingCount += 1;
      } else if (st === ORDER_STATUS.SHIPPING) {
        shippingCount += 1;
      } else if (st === ORDER_STATUS.CANCELLED) {
        cancelledCount += 1;
      } else if (st === ORDER_STATUS.BOMBED) {
        bombedCount += 1;
      }

      // Tiền cọc đã thu & COD cần thu
      if (st !== ORDER_STATUS.CANCELLED && st !== ORDER_STATUS.BOMBED) {
        collectedRevenue += depositPaid;
        if (st !== ORDER_STATUS.COMPLETED) {
          codToCollect += Math.max(0, total - depositPaid);
        }
      }
    });

    return {
      revenue,
      revenueToday,
      revenueMonth,
      totalOrders: orders.length,
      pendingCount,
      confirmedCount,
      packingCount,
      shippingCount,
      completedCount,
      cancelledCount,
      bombedCount,
      collectedRevenue,
      codToCollect
    };
  }, [orders]);

  const statusCounts = useMemo(() => {
    const counts = { all: orders.length };
    orders.forEach((o) => {
      const code = normalizeOrderStatus(o.status);
      counts[code] = (counts[code] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const handleInspectReferOrder = (code) => {
    setSearchQuery(code);
    setStatusFilter('all');
    setDateFilterType('all');
  };

  const isInspectingRefer = Boolean(
    searchQuery.trim().toUpperCase().startsWith('XNG') && statusFilter === 'all'
  );

  const handleToggleSelectOrder = (code) => {
    setSelectedOrderCodes((prev) => 
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const isAllFilteredSelected = filteredOrders.length > 0 && selectedOrderCodes.length === filteredOrders.length;
  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      setSelectedOrderCodes([]);
    } else {
      setSelectedOrderCodes(filteredOrders.map((o) => o.code));
    }
  };

  const selectedOrderObjects = useMemo(() => {
    return orders.filter((o) => selectedOrderCodes.includes(o.code));
  }, [orders, selectedOrderCodes]);

  const commonNextStatuses = useMemo(() => {
    if (selectedOrderObjects.length === 0) return [];

    const statusSets = selectedOrderObjects.map((ord) => {
      const currentCode = normalizeOrderStatus(ord.status);
      const allowed = FORWARD_STATUS_MAP[currentCode] || [];
      const paymentVal = ord.payment_method || ord.paymentMethod;
      const isFullPrepaid = 
        String(paymentVal || '').toLowerCase().includes('100%') || 
        paymentVal === 'full_qr';

      return allowed.filter((st) => !(isFullPrepaid && st === ORDER_STATUS.BOMBED));
    });

    return statusSets.reduce((acc, currentList) => 
      acc.filter((st) => currentList.includes(st))
    );
  }, [selectedOrderObjects]);

  const canBulkCancel = useMemo(() => {
    if (selectedOrderObjects.length === 0) return false;
    return selectedOrderObjects.every((o) => {
      const st = normalizeOrderStatus(o.status);
      return st !== ORDER_STATUS.COMPLETED && st !== ORDER_STATUS.CANCELLED && st !== ORDER_STATUS.BOMBED;
    });
  }, [selectedOrderObjects]);

  const canBulkBomb = useMemo(() => {
    if (selectedOrderObjects.length === 0) return false;
    return selectedOrderObjects.every((o) => {
      const st = normalizeOrderStatus(o.status);
      const paymentVal = o.payment_method || o.paymentMethod;
      const isFullPrepaid = 
        String(paymentVal || '').toLowerCase().includes('100%') || 
        paymentVal === 'full_qr';

      return st === ORDER_STATUS.SHIPPING && !isFullPrepaid;
    });
  }, [selectedOrderObjects]);

  const handleBulkUpdateStatus = async (targetStatusCode) => {
    if (selectedOrderCodes.length === 0) return;

    if (targetStatusCode === ORDER_STATUS.CANCELLED) {
      handleOpenBulkCancelModal();
      return;
    }
    if (targetStatusCode === ORDER_STATUS.BOMBED) {
      handleOpenBulkBombModal();
      return;
    }

    const targetMeta = ORDER_STATUS_MAP[targetStatusCode];
    setConfirmModalConfig({
      isAlert: false,
      title: 'Xác Nhận Chuyển Hàng Loạt',
      message: `Bạn có chắc chắn muốn chuyển ${selectedOrderCodes.length} đơn hàng đã chọn sang trạng thái "${targetMeta?.label || targetStatusCode}" không?`,
      confirmLabel: 'Xác nhận chuyển',
      onConfirm: async () => {
        setIsBulkProcessing(true);
        try {
          for (const code of selectedOrderCodes) {
            await onUpdateStatus(code, targetStatusCode);
          }
          onShowAlert?.(`Đã chuyển thành công ${selectedOrderCodes.length} đơn sang "${targetMeta?.label || targetStatusCode}"!`);
          setSelectedOrderCodes([]);
        } catch (err) {
          console.error('Lỗi chuyển trạng thái hàng loạt:', err);
          onShowAlert?.('Có lỗi xảy ra trong quá trình xử lý hàng loạt.');
        } finally {
          setIsBulkProcessing(false);
        }
      }
    });
  };

  const handleOpenBulkCancelModal = () => {
    if (!canBulkCancel) {
      setConfirmModalConfig({
        isAlert: true,
        title: 'Không Thể Hủy Hàng Loạt',
        message: 'Các đơn hàng được chọn bao gồm đơn đã Hoàn thành, đã Hủy hoặc đã Đánh dấu Bom. Vui lòng chỉ chọn các đơn đang xử lý!'
      });
      return;
    }

    setPendingStatusModal({
      isBulk: true,
      targetCodes: [...selectedOrderCodes],
      targetStatus: 'Đã hủy',
      isBombed: false
    });
  };

  const handleOpenBulkBombModal = () => {
    if (!canBulkBomb) {
      setConfirmModalConfig({
        isAlert: true,
        title: 'Không Thể Đánh Dấu Bom Hàng Loạt',
        message: 'Chỉ được đánh dấu Bom hàng loạt cho các đơn ĐANG GIAO (Shipping) và KHÔNG chuyển khoản 100%!'
      });
      return;
    }

    setPendingStatusModal({
      isBulk: true,
      targetCodes: [...selectedOrderCodes],
      targetStatus: 'Bom hàng',
      isBombed: true
    });
  };

  const handleBulkDelete = () => {
    if (selectedOrderCodes.length === 0) return;
    setConfirmModalConfig({
      isAlert: false,
      title: 'Xóa Nhiều Đơn Hàng',
      message: `CẢNH BÁO: Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedOrderCodes.length} đơn hàng đã chọn?`,
      confirmLabel: 'Xác nhận xóa hết',
      onConfirm: async () => {
        setIsBulkProcessing(true);
        try {
          for (const code of selectedOrderCodes) {
            await onDeleteOrder(code);
          }
          onShowAlert?.(`Đã xóa thành công ${selectedOrderCodes.length} đơn hàng!`);
          setSelectedOrderCodes([]);
        } catch (err) {
          console.error('Lỗi xóa hàng loạt:', err);
        } finally {
          setIsBulkProcessing(false);
        }
      }
    });
  };

  const handleSelectStatus = (order, targetStatus) => {
    const normalizedTarget = normalizeOrderStatus(targetStatus);
    const paymentVal = order.payment_method || order.paymentMethod;
    const isFullPrepaid = 
      String(paymentVal || '').toLowerCase().includes('100%') || 
      paymentVal === 'full_qr';

    if (isFullPrepaid && normalizedTarget === ORDER_STATUS.BOMBED) {
      setConfirmModalConfig({
        isAlert: true,
        title: 'Thao Tác Không Hợp Lệ',
        message: 'Đơn hàng này đã thanh toán chuyển khoản 100%, không thể đánh dấu Bom hàng!'
      });
      return;
    }

    if (normalizedTarget === ORDER_STATUS.CANCELLED || normalizedTarget === ORDER_STATUS.BOMBED) {
      const isBombed = normalizedTarget === ORDER_STATUS.BOMBED;
      setPendingStatusModal({ 
        isBulk: false, 
        order, 
        targetStatus: isBombed ? 'Bom hàng' : 'Đã hủy', 
        isBombed 
      });
      return;
    }

    onUpdateStatus(order.code, targetStatus);
  };

  const handleDeleteWithConfirm = (code) => {
    setConfirmModalConfig({
      isAlert: false,
      title: 'Xóa Đơn Hàng',
      message: `Bạn có chắc chắn muốn xóa đơn hàng ${code} không? Dữ liệu trên hệ thống sẽ bị xóa bỏ hoàn toàn.`,
      confirmLabel: 'Xác nhận xóa',
      onConfirm: () => onDeleteOrder(code)
    });
  };

  const handleRequestConfirmPayment = (ord) => {
    const isDeposit = (ord.payment_method || ord.paymentMethod) === 'deposit';
    const totalNum = parseCleanMoney(ord.final_total ?? ord.total ?? 0);
    const targetDeposit = Number(ord.deposit_amount_expected) || activeConfigDeposit;
    const expectedAmount = isDeposit ? Math.min(targetDeposit, totalNum) : totalNum;

    setPaymentVerificationModal({
      order: ord,
      isDeposit,
      expectedAmount,
      totalNum
    });
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn font-sans pb-16 text-stone-800">
      {/* 1. CARD TỔNG HỢP DOANH THU & KPI */}
      <DashboardMetricsCard 
        metrics={metrics} 
        totalOrdersCount={orders.length} 
        isLoading={isLoading} 
      />

      {/* 2. KHU VỰC QUẢN LÝ ĐƠN HÀNG */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
        {/* Bộ lọc & tìm kiếm */}
        <DashboardFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          dateFilterType={dateFilterType}
          setDateFilterType={setDateFilterType}
          startDate={startDate}
          endDate={endDate}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          handleStartDateChange={handleStartDateChange}
          handleEndDateChange={handleEndDateChange}
          viewMode={viewMode}
          handleToggleViewMode={handleToggleViewMode}
          statusCounts={statusCounts}
          filteredOrdersLength={filteredOrders.length}
          isAllFilteredSelected={isAllFilteredSelected}
          onToggleSelectAll={handleToggleSelectAll}
          onShowAlert={(msg) => setConfirmModalConfig({ isAlert: true, title: 'Thông Báo', message: msg })}
        />

        {/* Banner xem đơn gốc */}
        {isInspectingRefer && (
          <div className="p-3 bg-amber-500/10 border border-amber-300 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm animate-fadeIn">
            <div className="flex items-center gap-2 text-amber-950 font-medium">
              <History className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Đang xem đơn gốc: <strong className="font-mono font-black text-amber-900">{searchQuery}</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => { setSearchQuery(''); setStatusFilter(ORDER_STATUS.PENDING); }}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại</span>
            </button>
          </div>
        )}

        {/* Danh sách đơn hàng */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-stone-50 rounded-3xl border border-dashed border-stone-200">
            <p className="text-sm sm:text-base font-bold text-stone-600">
              {statusFilter === ORDER_STATUS.PENDING 
                ? 'Hiện không có đơn hàng nào đang ở trạng thái "Chờ xác nhận"' 
                : 'Không tìm thấy đơn hàng nào khớp bộ lọc'}
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="divide-y divide-stone-100 space-y-3 pt-1">
            {filteredOrders.map((ord) => (
              <DashboardOrderRow
                key={ord.code || ord.id}
                ord={ord}
                riskTrace={getRiskTraceDetails(ord)}
                isSelected={selectedOrderCodes.includes(ord.code)}
                onToggleSelect={handleToggleSelectOrder}
                isInspectingRefer={isInspectingRefer}
                isProcessing={actionLoadingCode === ord.code || isBulkProcessing}
                onSelectStatus={handleSelectStatus}
                onInspectRefer={handleInspectReferOrder}
                onOpenOverride={setOverrideModal}
                onDeleteOrder={handleDeleteWithConfirm}
                onRequestConfirmPayment={handleRequestConfirmPayment}
                confirmingOrderCode={confirmingOrderCode}
                shopConfig={shopConfig}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {filteredOrders.map((ord) => (
              <DashboardOrderGridCard
                key={ord.code || ord.id}
                ord={ord}
                riskTrace={getRiskTraceDetails(ord)}
                isSelected={selectedOrderCodes.includes(ord.code)}
                onToggleSelect={handleToggleSelectOrder}
                isInspectingRefer={isInspectingRefer}
                isProcessing={actionLoadingCode === ord.code || isBulkProcessing}
                onSelectStatus={handleSelectStatus}
                onOpenOverride={setOverrideModal}
                onDeleteOrder={handleDeleteWithConfirm}
                onRequestConfirmPayment={handleRequestConfirmPayment}
                confirmingOrderCode={confirmingOrderCode}
                shopConfig={shopConfig}
              />
            ))}
          </div>
        )}
      </div>

      {/* 3. THANH THAO TÁC HÀNG LOẠT NỔI */}
      <BulkActionBar
        selectedCount={selectedOrderCodes.length}
        commonNextStatuses={commonNextStatuses}
        canBulkCancel={canBulkCancel}
        canBulkBomb={canBulkBomb}
        isBulkProcessing={isBulkProcessing}
        onBulkUpdateStatus={handleBulkUpdateStatus}
        onOpenBulkCancelModal={handleOpenBulkCancelModal}
        onOpenBulkBombModal={handleOpenBulkBombModal}
        onBulkDelete={handleBulkDelete}
        onClearSelection={() => setSelectedOrderCodes([])}
      />

      {/* 4. CÁC MODAL NGHIỆP VỤ */}
      <PaymentVerificationModal
        modalData={paymentVerificationModal}
        bankLabel={bankLabel}
        onClose={() => setPaymentVerificationModal(null)}
        onConfirm={async (targetOrd) => {
          setPaymentVerificationModal(null);
          if (onConfirmPayment) await onConfirmPayment(targetOrd);
        }}
      />

      <StatusReasonModal
        modalData={pendingStatusModal}
        isProcessing={isBulkProcessing}
        onClose={() => setPendingStatusModal(null)}
        onSubmit={async (modalInfo, finalReason) => {
          if (modalInfo.isBulk) {
            setIsBulkProcessing(true);
            try {
              for (const code of modalInfo.targetCodes) {
                await onUpdateStatus(code, modalInfo.targetStatus, finalReason);
              }
              onShowAlert?.(`Đã ${modalInfo.isBombed ? 'đánh dấu Bom' : 'Hủy'} thành công ${modalInfo.targetCodes.length} đơn hàng!`);
              setSelectedOrderCodes([]);
            } catch (err) {
              console.error('Lỗi thao tác hàng loạt:', err);
            } finally {
              setIsBulkProcessing(false);
              setPendingStatusModal(null);
            }
          } else {
            onUpdateStatus(modalInfo.order.code, modalInfo.targetStatus, finalReason);
            setPendingStatusModal(null);
          }
        }}
      />

      <OverrideStatusModal
        order={overrideModal}
        onClose={() => setOverrideModal(null)}
        onConfirm={(orderCode, targetStatus, reasonText) => {
          onUpdateStatus(orderCode, targetStatus, reasonText);
          setOverrideModal(null);
        }}
      />

      {/* MODAL XÁC NHẬN CHUNG */}
      <ConfirmModal 
        modalConfig={confirmModalConfig} 
        onClose={() => setConfirmModalConfig(null)} 
      />
    </div>
  );
}