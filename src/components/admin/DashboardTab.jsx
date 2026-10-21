// src/components/admin/DashboardTab.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  FileSpreadsheet, Loader2, RefreshCw, Search, X, 
  PhoneCall, Trash2, Clock, Calendar, 
  AlertTriangle, ShieldAlert, History, ArrowUpRight, ArrowLeft, Info, CheckCircle,
  Lock, Edit3, CheckCircle2, ChevronDown, Check, Filter
} from 'lucide-react';
import { formatDateTime } from '../../utils/dateUtils';
import { ORDER_STATUS, ORDER_STATUS_MAP, normalizeOrderStatus } from '../../constants/orderStatus';
import { parseCleanMoney, parseOrderTimestamp } from '../../utils/orderRiskUtils';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import ConfirmModal from './ConfirmModal';

const PAYMENT_LABELS = {
  deposit: 'Cọc 50.000đ',
  full_qr: 'Chuyển khoản 100%',
  cod: 'COD (Trả sau)'
};

const DATE_OPTIONS = [
  { value: 'all', label: 'Tất cả thời gian' },
  { value: 'today', label: 'Hôm nay' },
  { value: 'yesterday', label: 'Hôm qua' },
  { value: '7days', label: '7 ngày gần nhất' },
  { value: '30days', label: '30 ngày gần nhất' },
  { value: 'custom', label: 'Khoảng ngày tùy chọn...' },
];

const FORWARD_STATUS_MAP = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PACKING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PACKING]: [ORDER_STATUS.SHIPPING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPING]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.BOMBED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.COMPLETED]: [],
  [ORDER_STATUS.CANCELLED]: [],
  [ORDER_STATUS.BOMBED]: []
};

// =========================================================================
// SUB-COMPONENT: DROPDOWN CHỌN TRẠNG THÁI TÙY CHỈNH (THAY THẾ SELECT HỆ ĐIỀU HÀNH)
// =========================================================================
function StatusSelectDropdown({ 
  ord, 
  currentStatusCode, 
  statusMeta, 
  allowedNextStatuses, 
  isFullPrepaid, 
  isProcessing, 
  onSelectStatus 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <button
        type="button"
        disabled={isProcessing}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50 ${statusMeta.bg}`}
      >
        <span>{statusMeta.label}</span>
        <ChevronDown className={`w-3 h-3 text-stone-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-2xl border border-stone-200 shadow-xl p-1.5 z-30 animate-fadeIn space-y-0.5 text-xs font-medium">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block px-2.5 py-1">
            Chuyển trạng thái:
          </span>

          <div className="w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between bg-stone-100/70 text-stone-700 text-[11px] font-bold">
            <span>{statusMeta.label}</span>
            <Check className="w-3 h-3 text-stone-500" />
          </div>

          {allowedNextStatuses.map((nextStatusCode) => {
            if (isFullPrepaid && nextStatusCode === ORDER_STATUS.BOMBED) return null;
            const nextMeta = ORDER_STATUS_MAP[nextStatusCode];

            return (
              <button
                key={nextStatusCode}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onSelectStatus(ord, nextStatusCode);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between text-[11px] font-semibold text-stone-700 hover:bg-amber-50 hover:text-amber-900 transition-colors cursor-pointer"
              >
                <span>➔ {nextMeta?.label || nextStatusCode}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT TỪNG DÒNG ĐƠN HÀNG
// =========================================================================
function DashboardOrderRow({
  ord,
  riskTrace,
  isInspectingRefer,
  isProcessing,
  onSelectStatus,
  onInspectRefer,
  onOpenOverride,
  onDeleteOrder
}) {
  const currentStatusCode = normalizeOrderStatus(ord.status);
  const statusMeta = ORDER_STATUS_MAP[currentStatusCode] || ORDER_STATUS_MAP[ORDER_STATUS.PENDING];
  const displayPayment = PAYMENT_LABELS[ord.paymentMethod] || ord.paymentMethod || 'Chưa chọn';

  const { hasRisk, isPardoned, isBombedRisk, isCancelledRisk, primaryRefer } = riskTrace;

  const isFullPrepaid = 
    String(ord.paymentMethod || '').toLowerCase().includes('100%') || 
    ord.paymentMethod === 'full_qr';

  const cleanTotalNum = parseCleanMoney(ord.total);
  const formattedCreatedAt = formatDateTime(ord.createdAt, 'Vừa xong');

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (currentStatusCode !== ORDER_STATUS.PENDING) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [currentStatusCode]);

  const orderTimestamp = parseOrderTimestamp(ord.createdAt);
  const elapsedMs = orderTimestamp ? (now - orderTimestamp) : 0;
  const remainingMs = Math.max(0, 30 * 60 * 1000 - elapsedMs);
  const isStillInCancelWindow = currentStatusCode === ORDER_STATUS.PENDING && remainingMs > 0;
  const cancelMinutes = Math.floor(remainingMs / 60000);
  const cancelSeconds = Math.floor((remainingMs % 60000) / 1000);

  const allowedNextStatuses = FORWARD_STATUS_MAP[currentStatusCode] || [];
  const isTerminalStatus = allowedNextStatuses.length === 0;
  const isLockedStatus = isInspectingRefer || isTerminalStatus;

  return (
    <div 
      className={`pt-3 p-3.5 rounded-2xl transition-all border flex flex-col gap-3 text-xs ${
        isBombedRisk 
          ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-400 shadow-2xs' 
          : isCancelledRisk
            ? 'bg-amber-50/50 border-amber-200 ring-1 ring-amber-300'
            : isPardoned
              ? 'bg-emerald-50/30 border-emerald-200/80'
              : 'bg-white border-transparent'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="font-mono font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md text-[11px]">
              {ord.code}
            </span>
            <strong className="text-stone-900 text-sm">{ord.name}</strong>
            
            {ord.phone && (
              <a
                href={`tel:${ord.phone}`}
                className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg border transition-colors ${
                  isBombedRisk
                    ? 'bg-red-600 text-white border-red-700 animate-pulse shadow-2xs'
                    : isCancelledRisk
                      ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                      : isPardoned
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                }`}
                title={isBombedRisk ? '⚠️ Khách đang bị treo án bom đơn gần nhất!' : isPardoned ? '✨ Khách từng có đơn xấu nhưng đã khôi phục uy tín thành công' : ''}
              >
                <PhoneCall className={`w-3 h-3 ${isBombedRisk || isCancelledRisk ? 'text-white' : 'text-stone-700'}`} />
                <span>{ord.phone}</span>
                {isBombedRisk && (
                  <span className="text-[9px] bg-white text-red-700 px-1 rounded font-black ml-0.5">
                    ĐANG TREO BOM
                  </span>
                )}
              </a>
            )}

            <span className="text-[10.5px] text-stone-400 font-mono inline-flex items-center gap-1">
              <Calendar className="w-3 h-3 text-stone-400" />
              <span>({formattedCreatedAt})</span>
            </span>

            {isBombedRisk ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-900 border border-red-300">
                <ShieldAlert className="w-3 h-3 text-red-700" />
                <span>Khách rủi ro cao</span>
              </span>
            ) : isPardoned ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                <CheckCircle className="w-3 h-3 text-emerald-700" />
                <span>Đã khôi phục uy tín</span>
              </span>
            ) : isCancelledRisk ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                <History className="w-3 h-3 text-amber-700" />
                <span>Từng hủy nhiều lần</span>
              </span>
            ) : null}

            {isStillInCancelWindow ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100/90 text-amber-950 border border-amber-300 shadow-2xs">
                <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                <span>
                  Khách còn <strong>{String(cancelMinutes).padStart(2, '0')}:{String(cancelSeconds).padStart(2, '0')}</strong> đổi ý
                </span>
              </span>
            ) : currentStatusCode === ORDER_STATUS.PENDING ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Đã qua 30p • Sẵn sàng duyệt</span>
              </span>
            ) : null}
          </div>

          {ord.address && (
            <p className={`text-[11px] line-clamp-1 p-1 rounded-md transition-colors ${
              isBombedRisk
                ? 'bg-red-100 text-red-950 font-bold border border-red-300 inline-block'
                : isCancelledRisk
                  ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300 inline-block'
                  : 'text-stone-600'
            }`}>
              📍 <strong>Giao đến:</strong> {ord.address}
            </p>
          )}

          {ord.itemsSummary && (
            <p className="text-stone-700 text-[11px] font-medium bg-stone-50 p-2 rounded-xl border border-stone-100 line-clamp-2">
              🛍️ {ord.itemsSummary}
            </p>
          )}
        </div>

        <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2 shrink-0">
          <div className="text-left md:text-right">
            <span className="font-mono font-black text-stone-900 text-sm block">
              {cleanTotalNum.toLocaleString('vi-VN')}đ
            </span>
            <span className="text-[10px] text-stone-500 font-medium bg-stone-100 px-2 py-0.5 rounded-md inline-block mt-0.5">
              {displayPayment}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isLockedStatus ? (
              <div className="flex items-center gap-1">
                <div 
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 select-none ${statusMeta.bg}`}
                  title={isInspectingRefer ? "Đang xem chi tiết đơn gốc: Khóa sửa đổi" : "Đơn hàng đã kết thúc: Khóa tiến trình 1 chiều"}
                >
                  <span>{statusMeta.label}</span>
                  <Lock className="w-3 h-3 text-stone-400 shrink-0" />
                </div>

                {!isInspectingRefer && (
                  <button
                    type="button"
                    onClick={() => onOpenOverride(ord)}
                    className="p-1.5 text-stone-400 hover:text-amber-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                    title="Đính chính lại trạng thái (Khi nhân viên bấm nhầm)"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <StatusSelectDropdown
                ord={ord}
                currentStatusCode={currentStatusCode}
                statusMeta={statusMeta}
                allowedNextStatuses={allowedNextStatuses}
                isFullPrepaid={isFullPrepaid}
                isProcessing={isProcessing}
                onSelectStatus={onSelectStatus}
              />
            )}

            {!isInspectingRefer && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => onDeleteOrder(ord.code)}
                className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                title="Xóa đơn hàng"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin text-amber-600" /> : <Trash2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {(hasRisk || isPardoned) && primaryRefer && (
        <div className={`p-2.5 rounded-xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${
          isBombedRisk 
            ? 'bg-white border-red-200 text-red-950' 
            : isPardoned
              ? 'bg-white border-emerald-200 text-emerald-950'
              : 'bg-white border-amber-200 text-amber-950'
        }`}>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-1.5 font-bold">
              <History className={`w-3.5 h-3.5 ${isBombedRisk ? 'text-red-600' : isPardoned ? 'text-emerald-600' : 'text-amber-600'}`} />
              <span>Tham chiếu đơn cũ:</span>
              <button
                type="button"
                onClick={() => onInspectRefer(primaryRefer.orderCode)}
                className="font-mono font-black text-amber-900 bg-amber-100 hover:bg-amber-200 px-1.5 py-0.2 rounded underline inline-flex items-center gap-0.5 cursor-pointer"
                title="Bấm để xem ngay đơn gốc này"
              >
                <span>{primaryRefer.orderCode}</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                primaryRefer.statusLabel === 'Bom hàng' ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-900'
              }`}>
                {primaryRefer.statusLabel}
              </span>
            </div>

            <p className="text-[11px] leading-relaxed text-stone-600">
              📌 <strong>Lý do đơn cũ:</strong>{' '}
              <span className="italic text-stone-800">
                "{primaryRefer.reason || 'Không có ghi chú chi tiết'}"
              </span>
            </p>
          </div>

          <div className={`p-2 rounded-lg text-[10.5px] leading-tight font-medium max-w-sm shrink-0 border ${
            isBombedRisk 
              ? 'bg-rose-50 border-rose-200 text-rose-900' 
              : isPardoned
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center gap-1 font-bold mb-0.5 uppercase tracking-wide">
              <Info className="w-3 h-3" />
              <span>Cơ chế ứng xử:</span>
            </div>
            {isBombedRisk ? (
              <span>
                Đơn gần nhất bị bom. <strong>Tuyệt đối không gửi COD</strong>. Chỉ bấm duyệt chuyển Kho khi khách đã <strong>Chuyển khoản 100%</strong>.
              </span>
            ) : isPardoned ? (
              <span>
                Khách từng có đơn cũ bị sự cố nhưng <strong>đơn gần nhất đã nhận hàng thành công</strong>. Uy tín đã khôi phục, chăm sóc chu đáo như khách quen.
              </span>
            ) : (
              <span>
                Khách từng báo hủy trước đó. Vẫn hỗ trợ chu đáo, <strong>gọi điện chốt kỹ điểm đón và giờ xe</strong> trước khi bấm duyệt.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// COMPONENT CHÍNH DASHBOARD TAB
// =========================================================================
export default function DashboardTab({
  orders = [],
  isLoading = false,
  onRefresh,
  onUpdateStatus,
  onDeleteOrder,
  depositAmount = 50000,
  actionLoadingCode = null,
  onShowAlert
}) {
  const {
    searchQuery, setSearchQuery,
    dateFilterType, setDateFilterType,
    startDate,
    endDate,
    statusFilter, setStatusFilter,
    handleStartDateChange,
    handleEndDateChange,
    filteredOrders,
    metrics,
    topProducts,
    getRiskTraceDetails
  } = useAdminDashboard(orders, depositAmount);

  const [pendingStatusModal, setPendingStatusModal] = useState(null);
  const [statusReason, setStatusReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const [overrideModal, setOverrideModal] = useState(null);
  const [overrideTargetStatus, setOverrideTargetStatus] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  const [confirmModalConfig, setConfirmModalConfig] = useState(null);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target)) {
        setIsDateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const statusCounts = useMemo(() => {
    const counts = { all: orders.length };
    orders.forEach((o) => {
      const code = normalizeOrderStatus(o.status);
      counts[code] = (counts[code] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const currentDateLabel = useMemo(() => {
    return DATE_OPTIONS.find((d) => d.value === dateFilterType)?.label || 'Tất cả thời gian';
  }, [dateFilterType]);

  const handleInspectReferOrder = (code) => {
    setSearchQuery(code);
    setStatusFilter('all');
    setDateFilterType('all');
  };

  const isInspectingRefer = Boolean(
    searchQuery.trim().toUpperCase().startsWith('XNG') && statusFilter === 'all'
  );

  const handleSelectStatus = (order, targetStatus) => {
    const normalizedTarget = normalizeOrderStatus(targetStatus);
    const isFullPrepaid = 
      String(order.paymentMethod || '').toLowerCase().includes('100%') || 
      order.paymentMethod === 'full_qr';

    if (isFullPrepaid && normalizedTarget === ORDER_STATUS.BOMBED) {
      setConfirmModalConfig({
        isAlert: true,
        title: 'Thao Tác Không Hợp Lệ',
        message: 'Đơn hàng này đã thanh toán chuyển khoản 100%, không thể đánh dấu Bom hàng!'
      });
      return;
    }

    const currentStatusCode = normalizeOrderStatus(order.status);
    if (currentStatusCode === ORDER_STATUS.PENDING && normalizedTarget === ORDER_STATUS.CONFIRMED) {
      const elapsed = Date.now() - parseOrderTimestamp(order.createdAt);
      const isWithin30Mins = elapsed < 30 * 60 * 1000;

      if (isWithin30Mins) {
        const remainingMin = Math.ceil((30 * 60 * 1000 - elapsed) / 60000);
        setConfirmModalConfig({
          isAlert: false,
          title: 'Khách Còn Thời Gian Đổi Ý',
          message: `Khách vẫn còn khoảng ${remainingMin} phút đổi ý trên hệ thống.\n\nBạn đã kiểm tra tài khoản nhận đủ tiền cọc/chuyển khoản của khách chưa? Xác nhận duyệt đơn chuyển Kho?`,
          confirmLabel: 'Đã nhận tiền, Duyệt',
          onConfirm: () => onUpdateStatus(order.code, targetStatus)
        });
        return;
      }
    }

    if (normalizedTarget === ORDER_STATUS.CANCELLED || normalizedTarget === ORDER_STATUS.BOMBED) {
      const isBombed = normalizedTarget === ORDER_STATUS.BOMBED;
      setPendingStatusModal({ order, targetStatus: isBombed ? 'Bom hàng' : 'Đã hủy', isBombed });
      setStatusReason(isBombed ? 'Thuê bao không liên lạc được / Chặn số' : 'Khách báo bận / Đổi ý trước khi cắt giàn');
      setCustomReason('');
      return;
    }

    onUpdateStatus(order.code, targetStatus);
  };

  const handleDeleteWithConfirm = (code) => {
    setConfirmModalConfig({
      isAlert: false,
      title: 'Xóa Đơn Hàng',
      message: `Bạn có chắc chắn muốn xóa đơn hàng ${code} không? Dữ liệu trên Google Sheet cũng sẽ bị xóa bỏ hoàn toàn.`,
      confirmLabel: 'Xác nhận xóa',
      onConfirm: () => onDeleteOrder(code)
    });
  };

  return (
    <div className="space-y-5 animate-fadeIn font-sans">
      {/* Top Banner Thống Kê */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-black text-stone-900">Thống Kê Doanh Thu Từ Google Sheet</h2>
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />}
          </div>
          <p className="text-[11px] text-stone-500">
            Đồng bộ trực tiếp qua Apps Script • Tổng nhận: <strong>{orders.length}</strong> dòng
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* 4 Chỉ số KPI Chuẩn */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-stone-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-stone-500 block">Doanh Thu Dự Kiến</span>
          <p className="text-base sm:text-lg font-black text-stone-900 font-mono">
            {metrics.totalRevenue.toLocaleString('vi-VN')}đ
          </p>
          <span className="text-[10px] text-stone-400 block">Không tính đơn hủy/bom</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-stone-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-emerald-700 block">Tiền Thực Nhận (Đã CK)</span>
          <p className="text-base sm:text-lg font-black text-emerald-700 font-mono">
            {metrics.realReceivedMoney.toLocaleString('vi-VN')}đ
          </p>
          <span className="text-[10px] text-emerald-600 block">Đơn đã duyệt thanh toán</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-stone-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-stone-500 block">Số Đơn Hàng</span>
          <p className="text-base sm:text-lg font-black text-stone-900 font-mono">
            {metrics.totalOrders} <span className="text-xs font-normal text-stone-400">đơn</span>
          </p>
          <span className="text-[10px] text-stone-400 block">Chưa tính đơn hủy/bom</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-stone-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-stone-500 block">Giá Trị TB / Đơn (AOV)</span>
          <p className="text-base sm:text-lg font-black text-amber-800 font-mono">
            {metrics.avgOrderValue.toLocaleString('vi-VN')}đ
          </p>
          <span className="text-[10px] text-stone-400 block">Bình quân mỗi đơn</span>
        </div>
      </div>

      {/* THANH THỐNG KÊ ĐƠN HỦY / BOM */}
      <div className="bg-white p-3 rounded-2xl border border-stone-200/90 shadow-xs flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span className="text-stone-600">
              Đơn Hủy: <strong className="text-stone-900 font-mono">{metrics.cancelledCount}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-700 animate-pulse"></span>
            <span className="text-stone-600">
              Bom Hàng: <strong className="text-red-700 font-mono">{metrics.bombedCount}</strong>
            </span>
          </div>

          <span className="hidden sm:inline text-stone-300">|</span>

          <div className="flex items-center gap-1 text-stone-700">
            <span>Tiền cọc giữ lại:</span>
            <strong className="text-emerald-700 font-mono font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              +{metrics.retainedDeposit.toLocaleString('vi-VN')}đ
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/80">
          <span className="text-stone-500 text-[10.5px]">Tỷ lệ hủy/bom:</span>
          <span className={`font-mono font-bold text-xs ${metrics.lossRate > 15 ? 'text-rose-600' : 'text-stone-800'}`}>
            {metrics.lossRate}%
          </span>
        </div>
      </div>

      {/* =========================================================================
          KHU VỰC QUẢN LÝ ĐƠN HÀNG: GIAO DIỆN BỘ LỌC TỐI ƯU MOBILE & DESKTOP
         ========================================================================= */}
      <div className="bg-white p-3.5 sm:p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-3.5">
        
        {/* HÀNG 1: TÌM KIẾM MỞ RỘNG TỐI ĐA + BỘ CHỌN THỜI GIAN CUSTOM */}
        <div className="flex items-center gap-2">
          
          {/* Ô Tìm Kiếm */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm số điện thoại, tên, mã XNG..."
              className="w-full pl-9 pr-7 py-2 rounded-xl bg-stone-50/90 hover:bg-white focus:bg-white border border-stone-200 text-xs font-medium focus:border-amber-600 focus:outline-none transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Bộ chọn Ngày Popup Custom */}
          <div ref={dateDropdownRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsDateDropdownOpen((prev) => !prev)}
              className={`h-8.5 px-2.5 sm:px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 ${
                dateFilterType !== 'all'
                  ? 'bg-amber-100/80 border-amber-400 text-amber-900'
                  : 'bg-stone-50/90 border-stone-200 text-stone-700 hover:bg-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">{currentDateLabel}</span>
              <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDateDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-2xl border border-stone-200 shadow-xl p-1.5 z-30 animate-fadeIn space-y-0.5 text-xs font-medium">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block px-2.5 py-1">
                  Khoảng thời gian:
                </span>
                {DATE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setDateFilterType(opt.value);
                      setIsDateDropdownOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between cursor-pointer transition-colors ${
                      dateFilterType === opt.value
                        ? 'bg-amber-50 text-amber-900 font-bold'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {dateFilterType === opt.value && <Check className="w-3.5 h-3.5 text-amber-700" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Nút Reset Bộ Lọc */}
          {(statusFilter !== ORDER_STATUS.PENDING || dateFilterType !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter(ORDER_STATUS.PENDING);
                setDateFilterType('all');
                setSearchQuery('');
              }}
              className="h-8.5 px-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl border border-stone-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
              title="Đặt lại về mặc định"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* HÀNG 2: THANH TAB TRẠNG THÁI TRƯỢT NGANG */}
        <div className="pt-2 border-t border-stone-100 flex items-center gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`shrink-0 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border ${
              statusFilter === 'all'
                ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
            }`}
          >
            <span>Tất cả</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              statusFilter === 'all' ? 'bg-stone-800 text-stone-200' : 'bg-stone-200 text-stone-600'
            }`}>
              {statusCounts.all || 0}
            </span>
          </button>

          {Object.entries(ORDER_STATUS_MAP).map(([statusCode, info]) => {
            const isActive = statusFilter === statusCode;
            const count = statusCounts[statusCode] || 0;
            return (
              <button
                key={statusCode}
                type="button"
                onClick={() => setStatusFilter(statusCode)}
                className={`shrink-0 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-800 text-white border-amber-800 shadow-2xs ring-1 ring-amber-800'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                <span>{statusCode === ORDER_STATUS.PENDING ? '⏳ ' + info.label : info.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? 'bg-amber-950 text-amber-200' : 'bg-stone-200/80 text-stone-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Khung nhập khoảng ngày tùy chọn */}
        {dateFilterType === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200/60 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500 font-semibold">Từ ngày:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value, (msg) => setConfirmModalConfig({ isAlert: true, title: 'Thông Báo', message: msg }))}
                className="py-1 px-2.5 rounded-xl bg-white border border-stone-200 text-xs font-mono font-bold"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500 font-semibold">Đến ngày:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value, (msg) => setConfirmModalConfig({ isAlert: true, title: 'Thông Báo', message: msg }))}
                className="py-1 px-2.5 rounded-xl bg-white border border-stone-200 text-xs font-mono font-bold"
              />
            </div>
          </div>
        )}

        {/* BANNER KHI ĐANG SOI ĐƠN GỐC */}
        {isInspectingRefer && (
          <div className="p-2.5 bg-amber-500/10 border border-amber-300 rounded-2xl flex items-center justify-between gap-3 text-xs animate-fadeIn">
            <div className="flex items-center gap-2 text-amber-950 font-medium">
              <History className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Đang xem đơn gốc: <strong className="font-mono font-black text-amber-900">{searchQuery}</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => { setSearchQuery(''); setStatusFilter(ORDER_STATUS.PENDING); }}
              className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Quay lại</span>
            </button>
          </div>
        )}

        {/* Danh sách từng dòng đơn */}
        <div className="divide-y divide-stone-100 space-y-2.5 pt-1">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
              <p className="text-xs font-bold text-stone-600">
                {statusFilter === ORDER_STATUS.PENDING 
                  ? 'Hiện không có đơn hàng nào đang ở trạng thái "Chờ xác nhận"' 
                  : 'Không tìm thấy đơn hàng nào khớp bộ lọc'}
              </p>
            </div>
          ) : (
            filteredOrders.map((ord) => (
              <DashboardOrderRow
                key={ord.code}
                ord={ord}
                riskTrace={getRiskTraceDetails(ord)}
                isInspectingRefer={isInspectingRefer}
                isProcessing={actionLoadingCode === ord.code}
                onSelectStatus={handleSelectStatus}
                onInspectRefer={handleInspectReferOrder}
                onOpenOverride={(targetOrd) => {
                  setOverrideModal(targetOrd);
                  setOverrideTargetStatus(normalizeOrderStatus(targetOrd.status));
                  setOverrideReason('');
                }}
                onDeleteOrder={handleDeleteWithConfirm}
              />
            ))
          )}
        </div>
      </div>

      {/* MODAL BẮT BUỘC CHỌN LÝ DO HỦY / BOM */}
      {pendingStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 animate-fadeIn font-sans">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md border border-stone-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                {pendingStatusModal.isBombed ? (
                  <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <h4 className="font-black text-sm text-stone-900">
                    {pendingStatusModal.isBombed ? 'Xác Nhận Đánh Dấu BOM HÀNG' : 'Xác Nhận HỦY ĐƠN HÀNG'}
                  </h4>
                  <p className="text-[11px] text-stone-500 font-mono">Mã đơn: {pendingStatusModal.order.code}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingStatusModal(null)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Chọn lý do chính *:
                </label>
                <select
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-medium text-stone-800 focus:bg-white focus:outline-none focus:border-amber-600 cursor-pointer"
                >
                  {pendingStatusModal.isBombed ? (
                    <>
                      <option value="Thuê bao không liên lạc được / Chặn số">Thuê bao không liên lạc được / Chặn số</option>
                      <option value="Xe tới điểm hẹn nhưng khách không ra nhận">Xe tới điểm hẹn nhưng khách không ra nhận</option>
                      <option value="Khách từ chối nhận hàng không có lý do chính đáng">Khách từ chối nhận hàng không có lý do chính đáng</option>
                      <option value="Cố tình cho sai địa chỉ / SĐT ảo">Cố tình cho sai địa chỉ / SĐT ảo</option>
                      <option value="Lý do khác">Lý do khác</option>
                    </>
                  ) : (
                    <>
                      <option value="Khách báo bận / Đổi ý trước khi cắt giàn">Khách báo bận / Đổi ý trước khi cắt giàn</option>
                      <option value="Đặt nhầm món / Muốn tạo lại đơn khác">Đặt nhầm món / Muốn tạo lại đơn khác</option>
                      <option value="Trùng đơn hàng trước đó">Trùng đơn hàng trước đó</option>
                      <option value="Không đón được khung giờ xe khách chạy">Không đón được khung giờ xe khách chạy</option>
                      <option value="Hết hàng tại vườn">Hết hàng tại vườn</option>
                      <option value="Lý do khác">Lý do khác</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Ghi chú chi tiết (nếu có):
                </label>
                <input
                  type="text"
                  placeholder="VD: Gọi 3 cuộc nhà xe báo khách tắt máy..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-white font-medium text-stone-800 focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingStatusModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 font-bold text-xs text-stone-600 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!pendingStatusModal) return;
                  const finalReason = customReason.trim() ? `${statusReason} - ${customReason.trim()}` : statusReason;
                  onUpdateStatus(pendingStatusModal.order.code, pendingStatusModal.targetStatus, finalReason);
                  setPendingStatusModal(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs cursor-pointer shadow-xs ${
                  pendingStatusModal.isBombed 
                    ? 'bg-rose-600 hover:bg-rose-700' 
                    : 'bg-stone-900 hover:bg-amber-700'
                }`}
              >
                Lưu trạng thái & Ghi chú
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ĐÍNH CHÍNH TRẠNG THÁI */}
      {overrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 animate-fadeIn font-sans">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md border border-amber-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-stone-900">
                    Đính Chính Trạng Thái Đơn Hàng
                  </h4>
                  <p className="text-[11px] text-stone-500 font-mono">Mã đơn: {overrideModal.code}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOverrideModal(null)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-1">
              <strong className="block font-bold">⚠️ Cảnh báo can thiệp đơn đã đóng:</strong>
              <p className="text-[11px] leading-relaxed text-amber-900">
                Đơn hàng này đang ở trạng thái đã kết thúc. Chỉ thực hiện đính chính khi có sự cố thao tác nhầm lẫn để đảm bảo không làm lệch số liệu thống kê.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Chọn trạng thái cần đính chính lại *:
                </label>
                <select
                  value={overrideTargetStatus}
                  onChange={(e) => setOverrideTargetStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-white font-medium text-stone-800 focus:outline-none focus:border-amber-600 cursor-pointer"
                >
                  {Object.entries(ORDER_STATUS_MAP).map(([statusCode, info]) => (
                    <option key={statusCode} value={statusCode}>
                      {info.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Lý do đính chính (để ghi log) *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Bấm nhầm nút khi khách vừa chuyển khoản..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-white font-medium text-stone-800 focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOverrideModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 font-bold text-xs text-stone-600 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!overrideModal || !overrideTargetStatus) return;
                  const reasonText = overrideReason.trim() ? `[Admin đính chính]: ${overrideReason.trim()}` : '[Admin đính chính trạng thái]';
                  onUpdateStatus(overrideModal.code, overrideTargetStatus, reasonText);
                  setOverrideModal(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Xác nhận đính chính
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL ĐỒNG BỘ */}
      <ConfirmModal 
        modalConfig={confirmModalConfig} 
        onClose={() => setConfirmModalConfig(null)} 
      />
    </div>
  );
}