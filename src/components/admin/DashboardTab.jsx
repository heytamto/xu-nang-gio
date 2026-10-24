// src/components/admin/DashboardTab.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Database, Loader2, RefreshCw, Search, X, 
  PhoneCall, Trash2, Clock, Calendar, 
  AlertTriangle, ShieldAlert, History, ArrowUpRight, ArrowLeft, Info, CheckCircle,
  Lock, Edit3, CheckCircle2, ChevronDown, Check, Gift,
  LayoutList, LayoutGrid, CheckSquare, Square, Layers, Ban, ShieldCheck
} from 'lucide-react';
import { formatDateTime, getRemainingCancelMs, formatCountdownTimer } from '../../utils/dateUtils';
import { ORDER_STATUS, ORDER_STATUS_MAP, normalizeOrderStatus } from '../../constants/orderStatus';
import { parseCleanMoney } from '../../utils/orderRiskUtils';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import ConfirmModal from './ConfirmModal';

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
// HÀM LẤY TÊN NGÂN HÀNG ĐỘNG (DB SUPABASE -> ENV -> VIETQR)
// =========================================================================
export function getActiveBankLabel(shopConfig) {
  const dbBank = shopConfig?.payment?.bankName || shopConfig?.bankName;
  if (dbBank && typeof dbBank === 'string' && dbBank.trim()) {
    return dbBank.trim();
  }
  const envBank = import.meta.env?.VITE_BANK_NAME;
  if (envBank && typeof envBank === 'string' && envBank.trim()) {
    return envBank.trim();
  }
  return 'VietQR';
}

// =========================================================================
// HÀM ĐỌC SỐ TIỀN CỌC ĐỘNG TỪ CẤU HÌNH SHOP
// =========================================================================
export function resolveDepositAmount(shopConfig) {
  const amount = 
    shopConfig?.payment?.depositAmount ?? 
    shopConfig?.payment_config?.depositAmount ?? 
    shopConfig?.depositAmount ?? 
    shopConfig?.deposit_amount;
    
  const num = Number(amount);
  return !isNaN(num) && num > 0 ? num : 50000;
}

// =========================================================================
// HÀM HIỂN THỊ NHÃN THANH TOÁN ĐỘNG (THAY CHO PAYMENT_LABELS TĨNH)
// =========================================================================
export function getDynamicPaymentLabel(method, configDeposit, orderRecord) {
  const m = String(method || '').toLowerCase();
  
  if (m === 'deposit' || m.includes('cọc')) {
    const depositVal = Number(
      orderRecord?.deposit_amount_expected || 
      orderRecord?.deposit_paid || 
      configDeposit
    );
    return `Cọc ${depositVal.toLocaleString('vi-VN')}đ`;
  }
  
  if (m === 'full_qr' || m.includes('100%')) {
    return 'Chuyển khoản 100%';
  }
  
  return 'COD (Trả sau)';
}

// =========================================================================
// HÀM HIỂN THỊ DANH SÁCH MÓN ĐẶT HÀNG
// =========================================================================
function renderItemsSummary(items, rawSummary, ord, compact = false) {
  const activeItems = Array.isArray(items) && items.length > 0 ? items : (Array.isArray(ord?.cart) ? ord.cart : null);

  if (Array.isArray(activeItems) && activeItems.length > 0) {
    return (
      <div className="space-y-1">
        <div className="space-y-1">
          {activeItems.map((it, idx) => {
            const qty = it.quantity || 1;
            const spec = it.weight_label || it.weightLabel || '';
            const flavor = it.flavor ? ` (${it.flavor})` : '';
            const price = Number(it.price || 0) * qty;
            const giftTitle = it.campaign_gift_title || it.campaignGiftTitle;

            return (
              <div key={it.id || idx} className="leading-snug text-stone-800 font-medium text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    • {it.name || it.product_name} {spec ? `[${spec}]` : ''}{flavor} <strong className="text-amber-900 font-mono">x{qty}</strong>
                  </span>
                  {price > 0 && !compact && (
                    <span className="font-mono text-stone-500 text-[10.5px] shrink-0">
                      {price.toLocaleString('vi-VN')}đ
                    </span>
                  )}
                </div>

                {giftTitle && (
                  <div className="flex items-center gap-1 text-[9.5px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-0.5 ml-2">
                    <Gift className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Tặng: {giftTitle}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {ord?.payment_gift && (
          <div className="flex items-center gap-1.5 text-[9.5px] text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 font-bold mt-1">
            <Gift className="w-3 h-3 text-amber-700 shrink-0" />
            <span className="truncate">Quà CK: {ord.payment_gift}</span>
          </div>
        )}
      </div>
    );
  }

  if (!rawSummary) return <span className="text-stone-400 italic">Chi tiết trong đơn</span>;

  if (typeof rawSummary === 'string' && (rawSummary.includes('<div') || rawSummary.includes('<br') || rawSummary.includes('&#8226;'))) {
    const cleanText = rawSummary
      .replace(/<div[^>]*>/gi, '')
      .replace(/<\/div>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/&#8226;/g, '•')
      .replace(/&bull;/g, '•')
      .trim();

    const lines = cleanText.split('\n').map((l) => l.trim()).filter(Boolean);

    return (
      <div className="space-y-0.5">
        {lines.map((line, idx) => (
          <div key={idx} className="leading-snug text-stone-800 font-medium text-[11px] truncate">
            {line.startsWith('•') ? line : `• ${line}`}
          </div>
        ))}
      </div>
    );
  }

  return <div className="leading-snug text-stone-800 font-medium text-[11px] truncate">{rawSummary}</div>;
}

// =========================================================================
// SUB-COMPONENT: DROPDOWN CHỌN TRẠNG THÁI TIẾN TRÌNH 1 CHIỀU
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
    <div 
      ref={dropdownRef} 
      className="relative inline-block text-left"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        disabled={isProcessing}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50 ${statusMeta.bg}`}
      >
        <span>{statusMeta.label}</span>
        <ChevronDown className={`w-3 h-3 text-stone-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-2xl border border-stone-200 shadow-xl p-1.5 z-30 animate-fadeIn space-y-0.5 text-xs font-medium font-sans">
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
                onClick={(e) => {
                  e.stopPropagation();
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
// SUB-COMPONENT: DÒNG ĐƠN HÀNG HÀNG NGANG (LIST ROW VIEW)
// =========================================================================
function DashboardOrderRow({
  ord,
  riskTrace,
  isSelected,
  onToggleSelect,
  isInspectingRefer,
  isProcessing,
  onSelectStatus,
  onInspectRefer,
  onOpenOverride,
  onDeleteOrder,
  onRequestConfirmPayment,
  confirmingOrderCode,
  depositAmount = 50000,
  shopConfig = {}
}) {
  const currentStatusCode = normalizeOrderStatus(ord.status);
  const statusMeta = ORDER_STATUS_MAP[currentStatusCode] || ORDER_STATUS_MAP[ORDER_STATUS.PENDING];
  
  const paymentMethodVal = ord.payment_method || ord.paymentMethod;
  const activeDepositConfig = resolveDepositAmount(shopConfig);
  const displayPayment = getDynamicPaymentLabel(paymentMethodVal, activeDepositConfig, ord);

  const { hasRisk, isPardoned, isBombedRisk, isCancelledRisk, primaryRefer } = riskTrace;

  const isFullPrepaid = 
    String(paymentMethodVal || '').toLowerCase().includes('100%') || 
    paymentMethodVal === 'full_qr';

  const rawTotal = ord.final_total ?? ord.total ?? 0;
  const cleanTotalNum = parseCleanMoney(rawTotal);
  
  const createdAtVal = ord.created_at || ord.createdAt;
  const formattedCreatedAt = formatDateTime(createdAtVal, 'Vừa xong');

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (currentStatusCode !== ORDER_STATUS.PENDING) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [currentStatusCode]);

  const remainingMs = getRemainingCancelMs(createdAtVal, now, 30);
  const isStillInCancelWindow = currentStatusCode === ORDER_STATUS.PENDING && remainingMs > 0;

  const allowedNextStatuses = FORWARD_STATUS_MAP[currentStatusCode] || [];
  const isTerminalStatus = allowedNextStatuses.length === 0;
  const isCompleted = currentStatusCode === ORDER_STATUS.COMPLETED;
  const isEnded = isTerminalStatus || isCompleted || currentStatusCode === ORDER_STATUS.CANCELLED || currentStatusCode === ORDER_STATUS.BOMBED;
  
  const isLockedStatus = isInspectingRefer || isTerminalStatus;
  const customerName = ord.customer_name || ord.name || 'Khách đặt';

  const isPaid = Boolean(ord.payment_verified) || isCompleted;
  const isConfirming = confirmingOrderCode === ord.code;

  const bankLabel = getActiveBankLabel(shopConfig);
  const displayedDepositNum = Number(ord.deposit_amount_expected || ord.deposit_paid || activeDepositConfig);

  return (
    <div 
      onClick={() => onToggleSelect(ord.code)}
      className={`pt-3 p-3.5 rounded-2xl transition-all border flex flex-col gap-3 text-xs font-sans cursor-pointer select-none ${
        isSelected ? 'ring-2 ring-amber-600 bg-amber-50/40 border-amber-300' : ''
      } ${
        !isSelected && !isCompleted && isBombedRisk 
          ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-400 shadow-2xs' 
          : !isSelected && !isCompleted && isCancelledRisk
            ? 'bg-amber-50/50 border-amber-200 ring-1 ring-amber-300'
            : !isSelected && !isCompleted && isPardoned
              ? 'bg-emerald-50/30 border-emerald-200/80'
              : !isSelected
                ? 'bg-white border-stone-200/90 shadow-2xs hover:border-amber-300/80'
                : ''
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <div className="mt-1 text-stone-400 hover:text-amber-800 transition-colors shrink-0">
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-amber-800 fill-amber-100" />
            ) : (
              <Square className="w-4 h-4 text-stone-300 hover:text-stone-500" />
            )}
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="font-mono font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md text-[11px]">
                {ord.code}
              </span>
              <strong className="text-stone-900 text-sm">{customerName}</strong>
              
              {ord.phone && (
                <a
                  href={`tel:${ord.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg border transition-colors ${
                    !isCompleted && isBombedRisk
                      ? 'bg-red-600 text-white border-red-700 animate-pulse shadow-2xs'
                      : !isCompleted && isCancelledRisk
                        ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                        : isPardoned
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                  }`}
                  title={!isCompleted && isBombedRisk ? '⚠️ Khách đang bị treo án bom đơn gần nhất!' : isPardoned ? '✨ Khách từng có đơn xấu nhưng đã khôi phục uy tín thành công' : ''}
                >
                  <PhoneCall className={`w-3 h-3 ${!isCompleted && (isBombedRisk || isCancelledRisk) ? 'text-white' : 'text-stone-700'}`} />
                  <span>{ord.phone}</span>
                  {!isCompleted && isBombedRisk && (
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

              {/* Huy hiệu trạng thái thanh toán / cọc */}
              {isPaid ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100/90 text-emerald-900 border border-emerald-300 shadow-2xs">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{isCompleted ? 'Đã thanh toán đủ 100%' : `Đã cọc ${displayedDepositNum.toLocaleString('vi-VN')}đ`}</span>
                </span>
              ) : !isEnded && paymentMethodVal !== 'cod' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                  <Clock className="w-2.5 h-2.5 text-amber-600 animate-pulse" />
                  <span>Chờ nổ tiền {bankLabel}</span>
                </span>
              ) : null}

              {!isCompleted && isBombedRisk ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-900 border border-red-300">
                  <ShieldAlert className="w-3 h-3 text-red-700" />
                  <span>Khách rủi ro cao</span>
                </span>
              ) : isPardoned ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <CheckCircle className="w-3 h-3 text-emerald-700" />
                  <span>Đã khôi phục uy tín</span>
                </span>
              ) : !isCompleted && isCancelledRisk ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <History className="w-3 h-3 text-amber-700" />
                  <span>Từng hủy nhiều lần</span>
                </span>
              ) : null}

              {isStillInCancelWindow ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100/90 text-amber-950 border border-amber-300 shadow-2xs">
                  <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                  <span>
                    Khách còn <strong>{formatCountdownTimer(remainingMs)}</strong> đổi ý
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
                !isCompleted && isBombedRisk 
                  ? 'bg-red-100 text-red-950 font-bold border border-red-300 inline-block' 
                  : !isCompleted && isCancelledRisk
                    ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300 inline-block'
                    : 'text-stone-600'
              }`}>
                📍 <strong>Giao đến:</strong> {ord.address}
              </p>
            )}

            {(ord.order_items?.length > 0 || ord.cart?.length > 0 || ord.itemsSummary) && (
              <div className="text-stone-700 text-[11px] bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                  🛍️ Sản phẩm đặt mua:
                </span>
                {renderItemsSummary(ord.order_items, ord.itemsSummary, ord)}
              </div>
            )}
          </div>
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

          <div 
            className="flex items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CHỈ HIỆN NÚT DUYỆT CỌC KHI ĐƠN CHƯA KẾT THÚC VÀ CHƯA THANH TOÁN */}
            {!isPaid && !isEnded && paymentMethodVal !== 'cod' && (
              <button
                type="button"
                disabled={isConfirming || isProcessing}
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestConfirmPayment && onRequestConfirmPayment(ord);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                title={`Bấm để xác nhận kiểm tra tiền về ${bankLabel} trước khi chuyển đơn sang Đã Xác Nhận`}
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang duyệt...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{paymentMethodVal === 'deposit' ? 'Đã Nhận Cọc' : 'Đã Nhận Đủ'}</span>
                  </>
                )}
              </button>
            )}

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
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenOverride(ord);
                    }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteOrder(ord.code);
                }}
                className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                title="Xóa đơn hàng"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin text-amber-600" /> : <Trash2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CHỈ HIỂN THỊ CẢNH BÁO BÊN DƯỚI KHI ĐƠN CHƯA HOÀN TẤT */}
      {!isCompleted && (hasRisk || isPardoned) && primaryRefer && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className={`p-2.5 rounded-xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${
            isBombedRisk 
              ? 'bg-white border-red-200 text-red-950' 
              : isPardoned
                ? 'bg-white border-emerald-200 text-emerald-950'
                : 'bg-white border-amber-200 text-amber-950'
          }`}
        >
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-1.5 font-bold">
              <History className={`w-3.5 h-3.5 ${isBombedRisk ? 'text-red-600' : isPardoned ? 'text-emerald-600' : 'text-amber-600'}`} />
              <span>Tham chiếu đơn cũ:</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onInspectRefer(primaryRefer.orderCode);
                }}
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
// SUB-COMPONENT: DẠNG KHỐI BẢNG / LƯỚI (GRID CARD VIEW)
// =========================================================================
function DashboardOrderGridCard({
  ord,
  riskTrace,
  isSelected,
  onToggleSelect,
  isInspectingRefer,
  isProcessing,
  onSelectStatus,
  onOpenOverride,
  onDeleteOrder,
  onRequestConfirmPayment,
  confirmingOrderCode,
  depositAmount = 50000,
  shopConfig = {}
}) {
  const currentStatusCode = normalizeOrderStatus(ord.status);
  const statusMeta = ORDER_STATUS_MAP[currentStatusCode] || ORDER_STATUS_MAP[ORDER_STATUS.PENDING];
  
  const paymentMethodVal = ord.payment_method || ord.paymentMethod;
  const activeDepositConfig = resolveDepositAmount(shopConfig);
  const displayPayment = getDynamicPaymentLabel(paymentMethodVal, activeDepositConfig, ord);

  const { isBombedRisk, isCancelledRisk, isPardoned } = riskTrace;

  const isFullPrepaid = 
    String(paymentMethodVal || '').toLowerCase().includes('100%') || 
    paymentMethodVal === 'full_qr';

  const rawTotal = ord.final_total ?? ord.total ?? 0;
  const cleanTotalNum = parseCleanMoney(rawTotal);
  
  const createdAtVal = ord.created_at || ord.createdAt;
  const formattedCreatedAt = formatDateTime(createdAtVal, 'Vừa xong');

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (currentStatusCode !== ORDER_STATUS.PENDING) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [currentStatusCode]);

  const remainingMs = getRemainingCancelMs(createdAtVal, now, 30);
  const isStillInCancelWindow = currentStatusCode === ORDER_STATUS.PENDING && remainingMs > 0;

  const allowedNextStatuses = FORWARD_STATUS_MAP[currentStatusCode] || [];
  const isTerminalStatus = allowedNextStatuses.length === 0;
  const isCompleted = currentStatusCode === ORDER_STATUS.COMPLETED;
  const isEnded = isTerminalStatus || isCompleted || currentStatusCode === ORDER_STATUS.CANCELLED || currentStatusCode === ORDER_STATUS.BOMBED;

  const isLockedStatus = isInspectingRefer || isTerminalStatus;
  const customerName = ord.customer_name || ord.name || 'Khách đặt';

  const isPaid = Boolean(ord.payment_verified) || isCompleted;
  const isConfirming = confirmingOrderCode === ord.code;

  const bankLabel = getActiveBankLabel(shopConfig);
  const displayedDepositNum = Number(ord.deposit_amount_expected || ord.deposit_paid || activeDepositConfig);

  return (
    <div 
      onClick={() => onToggleSelect(ord.code)}
      className={`rounded-2xl p-3.5 border transition-all flex flex-col justify-between gap-3 text-xs font-sans shadow-2xs hover:shadow-xs cursor-pointer select-none ${
        isSelected ? 'ring-2 ring-amber-600 bg-amber-50/40 border-amber-300' : 'bg-white'
      } ${
        !isSelected && !isCompleted && isBombedRisk 
          ? 'border-rose-300 ring-1 ring-rose-400 bg-rose-50/40' 
          : !isSelected && !isCompleted && isCancelledRisk
            ? 'border-amber-200 ring-1 ring-amber-300 bg-amber-50/30'
            : !isSelected && !isCompleted && isPardoned
              ? 'border-emerald-200/80 bg-emerald-50/20'
              : !isSelected
                ? 'border-stone-200/90 hover:border-amber-300/80'
                : ''
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2">
          <div className="flex items-center gap-2">
            <div className="text-stone-400 hover:text-amber-800 transition-colors">
              {isSelected ? (
                <CheckSquare className="w-4 h-4 text-amber-800 fill-amber-100" />
              ) : (
                <Square className="w-4 h-4 text-stone-300 hover:text-stone-500" />
              )}
            </div>
            <span className="font-mono font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md text-[10.5px]">
              {ord.code}
            </span>
          </div>

          <span className="text-[10px] text-stone-400 font-mono">
            {formattedCreatedAt}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <strong className="text-stone-900 font-bold text-sm truncate">{customerName}</strong>
            {ord.phone && (
              <a
                href={`tel:${ord.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="font-mono font-bold text-[11px] text-amber-800 hover:underline flex items-center gap-1"
              >
                <PhoneCall className="w-3 h-3 text-stone-500" />
                <span>{ord.phone}</span>
              </a>
            )}
          </div>

          {ord.address && (
            <p className="text-[10.5px] text-stone-500 line-clamp-1">
              📍 {ord.address}
            </p>
          )}

          {isPaid ? (
            <div className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-900 bg-emerald-100/90 border border-emerald-300 px-2.5 py-0.5 rounded-md">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>{isCompleted ? 'Đã thanh toán đủ 100%' : `Đã cọc ${displayedDepositNum.toLocaleString('vi-VN')}đ`}</span>
            </div>
          ) : !isEnded && paymentMethodVal !== 'cod' ? (
            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-md">
              <Clock className="w-2.5 h-2.5 text-amber-600 animate-pulse" />
              <span>Chờ nổ tiền {bankLabel}</span>
            </div>
          ) : null}

          {isStillInCancelWindow && (
            <div className="text-[10px] font-bold text-amber-900 bg-amber-100/80 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Clock className="w-3 h-3 animate-spin text-amber-700" />
              <span>Đổi ý: {formatCountdownTimer(remainingMs)}</span>
            </div>
          )}
        </div>

        {(ord.order_items?.length > 0 || ord.cart?.length > 0 || ord.itemsSummary) && (
          <div className="bg-stone-50 p-2 rounded-xl border border-stone-100 max-h-28 overflow-y-auto">
            {renderItemsSummary(ord.order_items, ord.itemsSummary, ord, true)}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-stone-100 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-stone-500 font-medium bg-stone-100 px-2 py-0.5 rounded-md">
            {displayPayment}
          </span>
          <span className="font-mono font-black text-stone-900 text-sm">
            {cleanTotalNum.toLocaleString('vi-VN')}đ
          </span>
        </div>

        <div 
          className="flex items-center justify-between gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* NÚT DUYỆT TRÊN CARD VIEW */}
          {!isPaid && !isEnded && paymentMethodVal !== 'cod' && (
            <button
              type="button"
              disabled={isConfirming || isProcessing}
              onClick={(e) => {
                e.stopPropagation();
                onRequestConfirmPayment && onRequestConfirmPayment(ord);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              title={`Xác nhận kiểm tra tiền về ${bankLabel}`}
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Duyệt...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{paymentMethodVal === 'deposit' ? 'Đã Nhận Cọc' : 'Đã Nhận Đủ'}</span>
                </>
              )}
            </button>
          )}

          {isLockedStatus ? (
            <div className="flex items-center gap-1">
              <div className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1 select-none ${statusMeta.bg}`}>
                <span>{statusMeta.label}</span>
                <Lock className="w-3 h-3 text-stone-400" />
              </div>
              {!isInspectingRefer && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenOverride(ord);
                  }}
                  className="p-1 text-stone-400 hover:text-amber-700 rounded-lg hover:bg-stone-100"
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
              onClick={(e) => {
                e.stopPropagation();
                onDeleteOrder(ord.code);
              }}
              className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// COMPONENT CHÍNH DASHBOARD TAB
// =========================================================================
export default function DashboardTab({
  orders = [],
  isLoading = false,
  shopConfig = {},
  onRefresh,
  onUpdateStatus,
  onDeleteOrder,
  onConfirmPayment,
  confirmingOrderCode = null,
  depositAmount = 50000,
  actionLoadingCode = null,
  onShowAlert
}) {
  const activeConfigDeposit = resolveDepositAmount(shopConfig);

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
    getRiskTraceDetails
  } = useAdminDashboard(orders, activeConfigDeposit);

  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('shop_admin_dashboard_view_mode') || 'list';
  });

  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('shop_admin_dashboard_view_mode', mode);
  };

  const [selectedOrderCodes, setSelectedOrderCodes] = useState([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [isBulkStatusDropdownOpen, setIsBulkStatusDropdownOpen] = useState(false);
  const bulkDropdownRef = useRef(null);

  const [pendingStatusModal, setPendingStatusModal] = useState(null);
  const [statusReason, setStatusReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const [paymentVerificationModal, setPaymentVerificationModal] = useState(null);

  const [overrideModal, setOverrideModal] = useState(null);
  const [overrideTargetStatus, setOverrideTargetStatus] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  const [confirmModalConfig, setConfirmModalConfig] = useState(null);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef(null);

  const bankLabel = getActiveBankLabel(shopConfig);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target)) {
        setIsDateDropdownOpen(false);
      }
      if (bulkDropdownRef.current && !bulkDropdownRef.current.contains(e.target)) {
        setIsBulkStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setSelectedOrderCodes([]);
  }, [statusFilter, dateFilterType, searchQuery]);

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
    setIsBulkStatusDropdownOpen(false);

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
    setIsBulkStatusDropdownOpen(false);
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
    setStatusReason('Khách báo bận / Đổi ý trước khi cắt giàn');
    setCustomReason('');
  };

  const handleOpenBulkBombModal = () => {
    setIsBulkStatusDropdownOpen(false);
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
    setStatusReason('Thuê bao không liên lạc được / Chặn số');
    setCustomReason('');
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

    const currentStatusCode = normalizeOrderStatus(order.status);
    if (currentStatusCode === ORDER_STATUS.PENDING && normalizedTarget === ORDER_STATUS.CONFIRMED) {
      const createdAtVal = order.created_at || order.createdAt;
      const remainingCancelMs = getRemainingCancelMs(createdAtVal, Date.now(), 30);

      if (remainingCancelMs > 0) {
        const remainingMin = Math.ceil(remainingCancelMs / 60000);
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
      setPendingStatusModal({ 
        isBulk: false,
        order, 
        targetStatus: isBombed ? 'Bom hàng' : 'Đã hủy', 
        isBombed 
      });
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
      message: `Bạn có chắc chắn muốn xóa đơn hàng ${code} không? Dữ liệu trên hệ thống sẽ bị xóa bỏ hoàn toàn.`,
      confirmLabel: 'Xác nhận xóa',
      onConfirm: () => onDeleteOrder(code)
    });
  };

  const handleRequestConfirmPayment = (ord) => {
    const isDeposit = (ord.payment_method || ord.paymentMethod) === 'deposit';
    const totalNum = parseCleanMoney(ord.final_total ?? ord.total ?? 0);
    
    // Ưu tiên số tiền cọc kỳ vọng được ghi lúc đặt đơn, fallback về cấu hình hiện tại
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
    <div className="space-y-4 animate-fadeIn font-sans pb-16">
      {/* ================= 1. CARD TỔNG HỢP DOANH THU & KPI ================= */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs overflow-hidden">
        
        {/* HEADER */}
        <div className="px-5 py-3.5 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-stone-50/50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-stone-900 tracking-tight">
                  Thống Kê Doanh Thu & Vận Hành
                </h2>
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />}
                <span className="font-mono text-[10.5px] font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full border border-stone-200/70">
                  {orders.length} đơn hệ thống
                </span>
              </div>
              <p className="text-[11px] text-stone-400 font-light">
                Đồng bộ thời gian thực Supabase PostgreSQL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-50 border border-stone-200/70">
              <span className="text-[11px] text-stone-500 font-medium">Tỷ lệ hủy/bom:</span>
              <span className={`font-mono font-black text-xs ${metrics.lossRate > 15 ? 'text-rose-600' : 'text-stone-800'}`}>
                {metrics.lossRate}%
              </span>
            </div>
          </div>
        </div>

        {/* LƯỚI 4 CHỈ SỐ KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-stone-100 p-1 bg-white">
          <div className="p-4 sm:p-5 flex flex-col justify-between space-y-2 hover:bg-stone-50/50 transition-colors">
            <span className="text-xs font-bold text-stone-500">Doanh Thu Dự Kiến</span>
            <div>
              <p className="text-lg sm:text-xl font-black text-stone-900 font-mono tracking-tight">
                {metrics.totalRevenue.toLocaleString('vi-VN')}đ
              </p>
              <span className="text-[10px] text-stone-400 block font-light mt-0.5">
                (Không tính đơn hủy & bom)
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-between space-y-2 hover:bg-emerald-50/30 transition-colors">
            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Tiền Thực Nhận (Đã CK)</span>
            </span>
            <div>
              <p className="text-lg sm:text-xl font-black text-emerald-700 font-mono tracking-tight">
                {metrics.realReceivedMoney.toLocaleString('vi-VN')}đ
              </p>
              <span className="text-[10px] text-emerald-600/80 block font-light mt-0.5">
                Đơn đã xác nhận & duyệt tiền
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-between space-y-2 hover:bg-stone-50/50 transition-colors">
            <span className="text-xs font-bold text-stone-500">Số Đơn Hiệu Lực</span>
            <div>
              <p className="text-lg sm:text-xl font-black text-stone-900 font-mono tracking-tight">
                {metrics.totalOrders} <span className="text-xs font-normal text-stone-400">đơn</span>
              </p>
              <span className="text-[10px] text-stone-400 block font-light mt-0.5">
                Đang vận hành & hoàn tất
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-between space-y-2 hover:bg-amber-50/30 transition-colors">
            <span className="text-xs font-bold text-amber-900/80">Giá Trị TB / Đơn (AOV)</span>
            <div>
              <p className="text-lg sm:text-xl font-black text-amber-900 font-mono tracking-tight">
                {metrics.avgOrderValue.toLocaleString('vi-VN')}đ
              </p>
              <span className="text-[10px] text-stone-400 block font-light mt-0.5">
                Bình quân giá trị mỗi giỏ hàng
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-5 py-2.5 bg-[#faf8f5] border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-stone-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Đơn Hủy:</span>
              <strong className="text-stone-900 font-mono">{metrics.cancelledCount}</strong>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-700"></span>
              <span>Bom Hàng:</span>
              <strong className="text-red-700 font-mono">{metrics.bombedCount}</strong>
            </div>

            <span className="text-stone-300">|</span>

            <div className="flex items-center gap-1.5">
              <span>Cọc giữ lại bù tiền xe:</span>
              <strong className="text-emerald-700 font-mono font-bold bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-300/70">
                +{metrics.retainedDeposit.toLocaleString('vi-VN')}đ
              </strong>
            </div>
          </div>

          <span className="text-[11px] text-stone-400 font-light italic">
            Chỉ số cập nhật tự động theo trạng thái đơn
          </span>
        </div>
      </div>

      {/* ================= 2. KHU VỰC QUẢN LÝ ĐƠN HÀNG ================= */}
      <div className="bg-white p-3.5 sm:p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-3.5">
        
        {/* HÀNG 1: TÌM KIẾM + BỘ LỌC NGÀY + NÚT CHUYỂN CHẾ ĐỘ XEM */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 min-w-[200px]">
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

          {/* Dropdown ngày */}
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

          {/* NÚT CHUYỂN ĐỔI CHẾ ĐỘ XEM (LIST VS GRID) */}
          <div className="flex items-center p-0.5 bg-stone-100 rounded-xl border border-stone-200 shrink-0">
            <button
              type="button"
              onClick={() => handleToggleViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
              title="Xem danh sách hàng ngang"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleToggleViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
              title="Xem dạng khối bảng (Grid)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Reset Bộ Lọc */}
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

        {/* HÀNG 2: THANH TAB TRẠNG THÁI */}
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

        {/* Khung chọn tất cả & thông báo số lượng */}
        <div className="flex items-center justify-between text-xs px-1 text-stone-500 pt-1">
          <label className="flex items-center gap-2 cursor-pointer font-bold hover:text-stone-800 select-none">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="text-stone-400 hover:text-amber-800 cursor-pointer"
            >
              {isAllFilteredSelected ? (
                <CheckSquare className="w-4 h-4 text-amber-800 fill-amber-100" />
              ) : (
                <Square className="w-4 h-4 text-stone-300" />
              )}
            </button>
            <span>Chọn tất cả {filteredOrders.length} đơn</span>
          </label>

          <span className="text-[11px] font-medium">
            Chế độ: <strong>{viewMode === 'list' ? 'Hàng ngang' : 'Khối bảng'}</strong>
          </span>
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

        {/* BANNER SOI ĐƠN GỐC */}
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

        {/* DANH SÁCH ĐƠN HÀNG */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
            <p className="text-xs font-bold text-stone-600">
              {statusFilter === ORDER_STATUS.PENDING 
                ? 'Hiện không có đơn hàng nào đang ở trạng thái "Chờ xác nhận"' 
                : 'Không tìm thấy đơn hàng nào khớp bộ lọc'}
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="divide-y divide-stone-100 space-y-2.5 pt-1">
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
                onOpenOverride={(targetOrd) => {
                  setOverrideModal(targetOrd);
                  setOverrideTargetStatus(normalizeOrderStatus(targetOrd.status));
                  setOverrideReason('');
                }}
                onDeleteOrder={handleDeleteWithConfirm}
                onRequestConfirmPayment={handleRequestConfirmPayment}
                confirmingOrderCode={confirmingOrderCode}
                depositAmount={activeConfigDeposit}
                shopConfig={shopConfig}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
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
                onOpenOverride={(targetOrd) => {
                  setOverrideModal(targetOrd);
                  setOverrideTargetStatus(normalizeOrderStatus(targetOrd.status));
                  setOverrideReason('');
                }}
                onDeleteOrder={handleDeleteWithConfirm}
                onRequestConfirmPayment={handleRequestConfirmPayment}
                confirmingOrderCode={confirmingOrderCode}
                depositAmount={activeConfigDeposit}
                shopConfig={shopConfig}
              />
            ))}
          </div>
        )}
      </div>

      {/* ================= 3. THANH THAO TÁC HÀNG LOẠT NỔI (BULK ACTION BAR) ================= */}
      {selectedOrderCodes.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-stone-700/80 flex items-center gap-2.5 sm:gap-3.5 animate-fadeIn max-w-[95vw] sm:max-w-2xl text-xs font-sans">
          <div className="flex items-center gap-2 font-bold shrink-0">
            <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center text-[11px] font-black">
              {selectedOrderCodes.length}
            </span>
            <span className="hidden sm:inline">đã chọn</span>
          </div>

          <div className="h-4 w-[1px] bg-stone-700 hidden sm:block shrink-0" />

          {/* DROPDOWN CHUYỂN BƯỚC TIẾP THEO (GIAO ĐIỂM HỢP LỆ) */}
          <div ref={bulkDropdownRef} className="relative flex-1 min-w-[140px]">
            <button
              type="button"
              disabled={isBulkProcessing || commonNextStatuses.length === 0}
              onClick={() => setIsBulkStatusDropdownOpen((prev) => !prev)}
              className="w-full px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-100 rounded-xl font-bold flex items-center justify-between gap-1.5 transition-colors cursor-pointer border border-stone-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {commonNextStatuses.length > 0 
                    ? 'Chuyển bước kế tiếp...' 
                    : 'Không cùng tiến trình'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            </button>

            {isBulkStatusDropdownOpen && commonNextStatuses.length > 0 && (
              <div className="absolute bottom-full mb-2 left-0 w-56 bg-white text-stone-800 rounded-2xl border border-stone-200 shadow-2xl p-1.5 z-50 animate-fadeIn space-y-0.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block px-2.5 py-1">
                  Bước kế tiếp ({selectedOrderCodes.length} đơn):
                </span>
                {commonNextStatuses.map((statusCode) => {
                  const info = ORDER_STATUS_MAP[statusCode];
                  return (
                    <button
                      key={statusCode}
                      type="button"
                      onClick={() => handleBulkUpdateStatus(statusCode)}
                      className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-bold hover:bg-amber-50 hover:text-amber-900 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>➔ {info?.label || statusCode}</span>
                      <span className={`w-2 h-2 rounded-full ${info?.bg?.split(' ')[0] || 'bg-stone-400'}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* NÚT HỦY HÀNG LOẠT */}
          <button
            type="button"
            disabled={isBulkProcessing || !canBulkCancel}
            onClick={handleOpenBulkCancelModal}
            className="px-2.5 py-1.5 bg-stone-800 hover:bg-amber-950/80 text-amber-400 border border-stone-700 hover:border-amber-600 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
            title={canBulkCancel ? "Hủy toàn bộ đơn đã chọn" : "Chỉ hủy được các đơn chưa hoàn tất"}
          >
            <Ban className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Hủy</span>
          </button>

          {/* NÚT BOM HÀNG LOẠT */}
          <button
            type="button"
            disabled={isBulkProcessing || !canBulkBomb}
            onClick={handleOpenBulkBombModal}
            className="px-2.5 py-1.5 bg-stone-800 hover:bg-rose-950/80 text-rose-400 border border-stone-700 hover:border-rose-600 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
            title={canBulkBomb ? "Đánh dấu bom hàng loạt (Chỉ áp dụng khi đang giao & không CK 100%)" : "Không thể đánh dấu Bom (đơn chưa gửi hoặc đã thanh toán 100%)"}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Bom</span>
          </button>

          {/* NÚT XÓA HÀNG LOẠT */}
          <button
            type="button"
            disabled={isBulkProcessing}
            onClick={handleBulkDelete}
            className="p-2 bg-stone-800 hover:bg-rose-900/60 text-stone-400 hover:text-rose-400 rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title="Xóa tất cả đơn đã chọn"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* HỦY CHỌN */}
          <button
            type="button"
            onClick={() => setSelectedOrderCodes([])}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors cursor-pointer shrink-0"
            title="Bỏ chọn tất cả"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= MODAL XÁC NHẬN DUYỆT TIỀN CỌC / CHUYỂN KHOẢN ================= */}
      {paymentVerificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 animate-fadeIn font-sans">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md border border-stone-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-stone-900">
                    {paymentVerificationModal.isDeposit ? 'Xác Nhận Đã Nhận Tiền Cọc' : 'Xác Nhận Đã Nhận Đủ 100%'}
                  </h4>
                  <p className="text-[11px] text-stone-500 font-mono">
                    Mã đơn: <strong className="text-amber-900">{paymentVerificationModal.order.code}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPaymentVerificationModal(null)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chi tiết số tiền & tài khoản đối soát */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center text-stone-600">
                <span>Khách hàng:</span>
                <span className="font-bold text-stone-900">
                  {paymentVerificationModal.order.customer_name || paymentVerificationModal.order.name || 'Khách đặt'}
                </span>
              </div>

              <div className="flex justify-between items-center text-stone-600">
                <span>Số điện thoại:</span>
                <span className="font-mono font-bold text-stone-800">
                  {paymentVerificationModal.order.phone}
                </span>
              </div>

              <div className="flex justify-between items-center text-stone-600">
                <span>Tổng giá trị đơn hàng:</span>
                <span className="font-mono font-bold text-stone-900">
                  {paymentVerificationModal.totalNum.toLocaleString('vi-VN')}đ
                </span>
              </div>

              <div className="pt-2 border-t border-stone-200/70 flex justify-between items-center">
                <span className="font-bold text-emerald-950">
                  {paymentVerificationModal.isDeposit ? 'Số tiền cọc cần đối soát:' : 'Số tiền 100% cần đối soát:'}
                </span>
                <span className="font-mono font-black text-emerald-700 text-base">
                  {paymentVerificationModal.expectedAmount.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-[11px] text-amber-950 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Vui lòng mở ứng dụng <strong>{bankLabel}</strong> và kiểm tra biến động số dư đúng mã <strong>{paymentVerificationModal.order.code}</strong> trước khi xác nhận. Sau khi xác nhận, đơn sẽ tự động chuyển sang trạng thái <strong>Đã Xác Nhận (Confirmed)</strong> để chuyển giao qua tổ Đóng gói.
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setPaymentVerificationModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 font-bold text-xs text-stone-600 transition-colors cursor-pointer"
              >
                Chưa nhận, Đóng
              </button>

              <button
                type="button"
                onClick={async () => {
                  const targetOrd = paymentVerificationModal.order;
                  setPaymentVerificationModal(null);
                  if (onConfirmPayment) {
                    await onConfirmPayment(targetOrd);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Đã Nhận Đủ Tiền</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL LÝ DO HỦY / BOM (CHO CẢ ĐƠN LẺ VÀ HÀNG LOẠT) ================= */}
      {pendingStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 animate-fadeIn font-sans">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md border border-stone-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                {pendingStatusModal.isBombed ? (
                  <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <h4 className="font-black text-sm text-stone-900">
                    {pendingStatusModal.isBulk
                      ? (pendingStatusModal.isBombed 
                          ? `Đánh Dấu BOM ${pendingStatusModal.targetCodes.length} ĐƠN HÀNG` 
                          : `Xác Nhận HỦY ${pendingStatusModal.targetCodes.length} ĐƠN HÀNG`)
                      : (pendingStatusModal.isBombed 
                          ? 'Xác Nhận Đánh Dấu BOM HÀNG' 
                          : 'Xác Nhận HỦY ĐƠN HÀNG')
                    }
                  </h4>
                  <p className="text-[11px] text-stone-500 font-mono">
                    {pendingStatusModal.isBulk 
                      ? `Áp dụng cho ${pendingStatusModal.targetCodes.length} đơn được chọn` 
                      : `Mã đơn: ${pendingStatusModal.order.code}`}
                  </p>
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
                  placeholder="VD: Nhà xe gọi 3 lần đều không bắt máy..."
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
                disabled={isBulkProcessing}
                onClick={async () => {
                  if (!pendingStatusModal) return;
                  const finalReason = customReason.trim() ? `${statusReason} - ${customReason.trim()}` : statusReason;
                  
                  if (pendingStatusModal.isBulk) {
                    setIsBulkProcessing(true);
                    try {
                      for (const code of pendingStatusModal.targetCodes) {
                        await onUpdateStatus(code, pendingStatusModal.targetStatus, finalReason);
                      }
                      onShowAlert?.(`Đã ${pendingStatusModal.isBombed ? 'đánh dấu Bom' : 'Hủy'} thành công ${pendingStatusModal.targetCodes.length} đơn hàng!`);
                      setSelectedOrderCodes([]);
                    } catch (err) {
                      console.error('Lỗi thao tác hàng loạt:', err);
                    } finally {
                      setIsBulkProcessing(false);
                      setPendingStatusModal(null);
                    }
                  } else {
                    onUpdateStatus(pendingStatusModal.order.code, pendingStatusModal.targetStatus, finalReason);
                    setPendingStatusModal(null);
                  }
                }}
                className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs cursor-pointer shadow-xs disabled:opacity-50 ${
                  pendingStatusModal.isBombed 
                    ? 'bg-rose-600 hover:bg-rose-700' 
                    : 'bg-stone-900 hover:bg-amber-700'
                }`}
              >
                {isBulkProcessing ? 'Đang lưu...' : 'Lưu trạng thái & Ghi chú'}
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