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

export function resolveDepositAmount(shopConfig) {
  const amount = 
    shopConfig?.payment?.depositAmount ?? 
    shopConfig?.payment_config?.depositAmount ?? 
    shopConfig?.depositAmount ?? 
    shopConfig?.deposit_amount;
    
  const num = Number(amount);
  return !isNaN(num) && num > 0 ? num : 50000;
}

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

function renderItemsSummary(items, rawSummary, ord, compact = false) {
  const activeItems = Array.isArray(items) && items.length > 0 ? items : (Array.isArray(ord?.cart) ? ord.cart : null);

  if (Array.isArray(activeItems) && activeItems.length > 0) {
    return (
      <div className="space-y-1.5">
        <div className="space-y-1">
          {activeItems.map((it, idx) => {
            const qty = it.quantity || 1;
            const spec = it.weight_label || it.weightLabel || '';
            const flavor = it.flavor ? ` (${it.flavor})` : '';
            const price = Number(it.price || 0) * qty;
            const giftTitle = it.campaign_gift_title || it.campaignGiftTitle;

            return (
              <div key={it.id || idx} className="leading-snug text-stone-800 font-medium text-xs sm:text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    • {it.name || it.product_name} {spec ? `[${spec}]` : ''}{flavor} <strong className="text-amber-950 font-mono font-bold">x{qty}</strong>
                  </span>
                  {price > 0 && !compact && (
                    <span className="font-mono text-stone-600 text-xs sm:text-sm font-semibold shrink-0">
                      {price.toLocaleString('vi-VN')}đ
                    </span>
                  )}
                </div>

                {giftTitle && (
                  <div className="inline-flex items-center gap-1.5 text-xs text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 mt-1 ml-2 font-bold">
                    <Gift className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Tặng: {giftTitle}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {ord?.payment_gift && (
          <div className="flex items-center gap-2 text-xs text-amber-950 bg-amber-100/90 px-2.5 py-1 rounded-xl border border-amber-300 font-bold mt-1.5 shadow-2xs">
            <Gift className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="truncate">Quà CK: {ord.payment_gift}</span>
          </div>
        )}
      </div>
    );
  }

  if (!rawSummary) return <span className="text-stone-400 italic text-xs sm:text-sm">Chi tiết trong đơn</span>;

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
      <div className="space-y-1">
        {lines.map((line, idx) => (
          <div key={idx} className="leading-snug text-stone-800 font-medium text-xs sm:text-sm truncate">
            {line.startsWith('•') ? line : `• ${line}`}
          </div>
        ))}
      </div>
    );
  }

  return <div className="leading-snug text-stone-800 font-medium text-xs sm:text-sm truncate">{rawSummary}</div>;
}

function StatusReasonDropdown({ value, options = [], onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative text-xs sm:text-sm font-sans" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
          isOpen
            ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20 text-stone-900 font-bold'
            : 'border-amber-400 bg-white hover:border-amber-500 text-stone-900 font-semibold'
        }`}
      >
        <span className="truncate pr-2">{value || 'Chọn lý do...'}</span>
        <ChevronDown
          className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-amber-700' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-fadeIn">
          <div className="px-4 py-2.5 text-xs font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100 bg-stone-50/50">
            Chọn lý do phù hợp:
          </div>
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
            {options.map((opt) => {
              const isSelected = value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onSelect(opt);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between text-xs sm:text-sm transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-amber-100 text-amber-950 font-bold'
                      : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900 font-medium'
                  }`}
                >
                  <span className="truncate">{opt}</span>
                  {isSelected && <Check className="w-4 h-4 text-amber-700 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function OverrideStatusDropdown({ value, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const currentLabel = ORDER_STATUS_MAP[value]?.label || value || 'Chọn trạng thái';

  return (
    <div className="relative text-xs sm:text-sm font-sans" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
          isOpen
            ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20 text-stone-900 font-bold'
            : 'border-amber-400 bg-white hover:border-amber-500 text-stone-900 font-semibold'
        }`}
      >
        <span className="truncate pr-2">{currentLabel}</span>
        <ChevronDown
          className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-amber-700' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-fadeIn">
          <div className="px-4 py-2.5 text-xs font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100 bg-stone-50/50">
            Chuyển sang trạng thái:
          </div>
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
            {Object.entries(ORDER_STATUS_MAP).map(([statusCode, info]) => {
              const isSelected = value === statusCode;
              return (
                <button
                  key={statusCode}
                  type="button"
                  onClick={() => {
                    onSelect(statusCode);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between text-xs sm:text-sm transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-amber-100 text-amber-950 font-bold'
                      : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900 font-medium'
                  }`}
                >
                  <span className="truncate">{info.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-amber-700 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

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
        className={`text-xs sm:text-sm font-bold px-3.5 py-2 rounded-2xl border flex items-center gap-2 transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50 ${statusMeta.bg}`}
      >
        <span>{statusMeta.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-stone-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-2xl border border-stone-200 shadow-xl p-1.5 z-30 animate-fadeIn space-y-1 text-xs sm:text-sm font-medium font-sans">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block px-3 py-1.5">
            Chuyển trạng thái:
          </span>

          <div className="w-full px-3 py-2 rounded-xl text-left flex items-center justify-between bg-stone-100 text-stone-800 font-bold">
            <span>{statusMeta.label}</span>
            <Check className="w-3.5 h-3.5 text-stone-600" />
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
                className="w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between font-bold text-stone-700 hover:bg-amber-50 hover:text-amber-950 transition-colors cursor-pointer"
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
      className={`p-4 sm:p-5 rounded-3xl transition-all border flex flex-col gap-3.5 text-xs sm:text-sm font-sans cursor-pointer select-none ${
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="mt-1 text-stone-400 hover:text-amber-800 transition-colors shrink-0">
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-amber-800 fill-amber-100" />
            ) : (
              <Square className="w-5 h-5 text-stone-300 hover:text-stone-500" />
            )}
          </div>

          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-black text-amber-950 bg-amber-100 px-2.5 py-1 rounded-xl text-xs sm:text-sm border border-amber-300/60">
                {ord.code}
              </span>
              <strong className="text-stone-900 text-sm sm:text-base font-black">{customerName}</strong>
              
              {ord.phone && (
                <a
                  href={`tel:${ord.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-mono font-bold px-3 py-1 rounded-xl border transition-colors ${
                    !isCompleted && isBombedRisk
                      ? 'bg-red-600 text-white border-red-700 animate-pulse shadow-2xs'
                      : !isCompleted && isCancelledRisk
                        ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                        : isPardoned
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'text-amber-900 bg-amber-50 hover:bg-amber-100 border-amber-200'
                  }`}
                  title={!isCompleted && isBombedRisk ? '⚠️ Khách đang bị treo án bom đơn gần nhất!' : isPardoned ? '✨ Khách từng có đơn xấu nhưng đã khôi phục uy tín thành công' : ''}
                >
                  <PhoneCall className={`w-3.5 h-3.5 ${!isCompleted && (isBombedRisk || isCancelledRisk) ? 'text-white' : 'text-stone-700'}`} />
                  <span>{ord.phone}</span>
                  {!isCompleted && isBombedRisk && (
                    <span className="text-[10px] bg-white text-red-700 px-1.5 py-0.2 rounded font-black ml-1">
                      ĐANG TREO BOM
                    </span>
                  )}
                </a>
              )}

              <span className="text-xs text-stone-500 font-mono inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>({formattedCreatedAt})</span>
              </span>

              {/* Huy hiệu trạng thái thanh toán / cọc */}
              {isPaid ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/90 text-emerald-900 border border-emerald-300 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isCompleted ? 'Đã thanh toán đủ 100%' : `Đã cọc ${displayedDepositNum.toLocaleString('vi-VN')}đ`}</span>
                </span>
              ) : !isEnded && paymentMethodVal !== 'cod' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                  <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                  <span>Chờ nổ tiền {bankLabel}</span>
                </span>
              ) : null}

              {!isCompleted && isBombedRisk ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-900 border border-red-300">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-700" />
                  <span>Khách rủi ro cao</span>
                </span>
              ) : isPardoned ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Đã khôi phục uy tín</span>
                </span>
              ) : !isCompleted && isCancelledRisk ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <History className="w-3.5 h-3.5 text-amber-700" />
                  <span>Từng hủy nhiều lần</span>
                </span>
              ) : null}

              {isStillInCancelWindow ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100/90 text-amber-950 border border-amber-300 shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                  <span>
                    Khách còn <strong>{formatCountdownTimer(remainingMs)}</strong> đổi ý
                  </span>
                </span>
              ) : currentStatusCode === ORDER_STATUS.PENDING ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đã qua 30p • Sẵn sàng duyệt</span>
                </span>
              ) : null}
            </div>

            {ord.address && (
              <p className={`text-xs sm:text-sm p-2 rounded-xl transition-colors leading-relaxed ${
                !isCompleted && isBombedRisk 
                  ? 'bg-red-100 text-red-950 font-bold border border-red-300 inline-block' 
                  : !isCompleted && isCancelledRisk
                    ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300 inline-block'
                    : 'text-stone-700'
              }`}>
                📍 <strong>Giao đến:</strong> {ord.address}
              </p>
            )}

            {(ord.order_items?.length > 0 || ord.cart?.length > 0 || ord.itemsSummary) && (
              <div className="text-stone-800 text-xs sm:text-sm bg-stone-50 p-3 sm:p-4 rounded-2xl border border-stone-200/80">
                <span className="text-xs uppercase font-bold text-stone-500 block mb-1.5 tracking-wide">
                  🛍️ Sản phẩm đặt mua:
                </span>
                {renderItemsSummary(ord.order_items, ord.itemsSummary, ord)}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 shrink-0">
          <div className="text-left md:text-right space-y-0.5">
            <span className="font-mono font-black text-stone-900 text-base sm:text-lg block">
              {cleanTotalNum.toLocaleString('vi-VN')}đ
            </span>
            <span className="text-xs text-stone-600 font-semibold bg-stone-100 px-2.5 py-1 rounded-lg inline-block">
              {displayPayment}
            </span>
          </div>

          <div 
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {!isPaid && !isEnded && paymentMethodVal !== 'cod' && (
              <button
                type="button"
                disabled={isConfirming || isProcessing}
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestConfirmPayment && onRequestConfirmPayment(ord);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                title={`Bấm để xác nhận kiểm tra tiền về ${bankLabel} trước khi chuyển đơn sang Đã Xác Nhận`}
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang duyệt...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{paymentMethodVal === 'deposit' ? 'Đã Nhận Cọc' : 'Đã Nhận Đủ'}</span>
                  </>
                )}
              </button>
            )}

            {isLockedStatus ? (
              <div className="flex items-center gap-1.5">
                <div 
                  className={`text-xs sm:text-sm font-bold px-4 py-2 rounded-2xl border flex items-center gap-2 select-none ${statusMeta.bg}`}
                  title={isInspectingRefer ? "Đang xem chi tiết đơn gốc: Khóa sửa đổi" : "Đơn hàng đã kết thúc: Khóa tiến trình 1 chiều"}
                >
                  <span>{statusMeta.label}</span>
                  <Lock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                </div>

                {!isInspectingRefer && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenOverride(ord);
                    }}
                    className="p-2 text-stone-400 hover:text-amber-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                    title="Đính chính lại trạng thái (Khi nhân viên bấm nhầm)"
                  >
                    <Edit3 className="w-4 h-4" />
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
                className="p-2 text-stone-400 hover:text-red-600 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                title="Xóa đơn hàng"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin text-amber-600" /> : <Trash2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {!isCompleted && (hasRisk || isPardoned) && primaryRefer && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className={`p-3.5 rounded-2xl border text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            isBombedRisk 
              ? 'bg-white border-red-200 text-red-950' 
              : isPardoned
                ? 'bg-white border-emerald-200 text-emerald-950'
                : 'bg-white border-amber-200 text-amber-950'
          }`}
        >
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 font-bold">
              <History className={`w-4 h-4 ${isBombedRisk ? 'text-red-600' : isPardoned ? 'text-emerald-600' : 'text-amber-600'}`} />
              <span>Tham chiếu đơn cũ:</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onInspectRefer(primaryRefer.orderCode);
                }}
                className="font-mono font-black text-amber-950 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-lg underline inline-flex items-center gap-1 cursor-pointer"
                title="Bấm để xem ngay đơn gốc này"
              >
                <span>{primaryRefer.orderCode}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <span className={`text-xs px-2 py-0.5 rounded-lg font-black ${
                primaryRefer.statusLabel === 'Bom hàng' ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-900'
              }`}>
                {primaryRefer.statusLabel}
              </span>
            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-stone-700">
              📌 <strong>Lý do đơn cũ:</strong>{' '}
              <span className="italic text-stone-900 font-medium">
                "{primaryRefer.reason || 'Không có ghi chú chi tiết'}"
              </span>
            </p>
          </div>

          <div className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed font-medium max-w-sm shrink-0 border ${
            isBombedRisk 
              ? 'bg-rose-50 border-rose-200 text-rose-950' 
              : isPardoned
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}>
            <div className="flex items-center gap-1.5 font-bold mb-1 uppercase tracking-wide">
              <Info className="w-4 h-4" />
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
      className={`rounded-3xl p-4 sm:p-5 border transition-all flex flex-col justify-between gap-3.5 text-xs sm:text-sm font-sans shadow-2xs hover:shadow-xs cursor-pointer select-none ${
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
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="text-stone-400 hover:text-amber-800 transition-colors">
              {isSelected ? (
                <CheckSquare className="w-5 h-5 text-amber-800 fill-amber-100" />
              ) : (
                <Square className="w-5 h-5 text-stone-300 hover:text-stone-500" />
              )}
            </div>
            <span className="font-mono font-black text-amber-950 bg-amber-100 px-2.5 py-1 rounded-xl text-xs border border-amber-300/60">
              {ord.code}
            </span>
          </div>

          <span className="text-xs text-stone-400 font-mono">
            {formattedCreatedAt}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <strong className="text-stone-900 font-black text-sm sm:text-base truncate">{customerName}</strong>
            {ord.phone && (
              <a
                href={`tel:${ord.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="font-mono font-bold text-xs sm:text-sm text-amber-900 hover:underline flex items-center gap-1.5"
              >
                <PhoneCall className="w-3.5 h-3.5 text-stone-500" />
                <span>{ord.phone}</span>
              </a>
            )}
          </div>

          {ord.address && (
            <p className="text-xs sm:text-sm text-stone-600 line-clamp-1 leading-relaxed">
              📍 {ord.address}
            </p>
          )}

          {/* Cụm huy hiệu trạng thái: dùng flex-wrap và w-fit để không bị kéo dài hết card */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {isPaid ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-emerald-100/90 border border-emerald-300 px-3 py-1 rounded-full shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isCompleted ? 'Đã thanh toán đủ 100%' : `Đã cọc ${displayedDepositNum.toLocaleString('vi-VN')}đ`}</span>
              </span>
            ) : !isEnded && paymentMethodVal !== 'cod' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 px-3 py-1 rounded-full">
                <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                <span>Chờ nổ tiền {bankLabel}</span>
              </span>
            ) : null}

            {isStillInCancelWindow && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-amber-100/90 border border-amber-300 px-3 py-1 rounded-full shadow-2xs">
                <Clock className="w-3.5 h-3.5 animate-spin text-amber-700" />
                <span>Đổi ý: {formatCountdownTimer(remainingMs)}</span>
              </span>
            )}
          </div>
        </div>

        {(ord.order_items?.length > 0 || ord.cart?.length > 0 || ord.itemsSummary) && (
          <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/70 max-h-36 overflow-y-auto">
            {renderItemsSummary(ord.order_items, ord.itemsSummary, ord, true)}
          </div>
        )}
      </div>

      <div className="pt-2.5 border-t border-stone-100 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-stone-600 font-semibold bg-stone-100 px-2.5 py-1 rounded-lg">
            {displayPayment}
          </span>
          <span className="font-mono font-black text-stone-900 text-sm sm:text-base">
            {cleanTotalNum.toLocaleString('vi-VN')}đ
          </span>
        </div>

        <div 
          className="flex items-center justify-between gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {!isPaid && !isEnded && paymentMethodVal !== 'cod' && (
            <button
              type="button"
              disabled={isConfirming || isProcessing}
              onClick={(e) => {
                e.stopPropagation();
                onRequestConfirmPayment && onRequestConfirmPayment(ord);
              }}
              className="px-3 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              title={`Xác nhận kiểm tra tiền về ${bankLabel}`}
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Duyệt...</span>
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
            <div className="flex items-center gap-1.5">
              <div className={`text-xs sm:text-sm font-bold px-3 py-1.5 rounded-2xl border flex items-center gap-1.5 select-none ${statusMeta.bg}`}>
                <span>{statusMeta.label}</span>
                <Lock className="w-3.5 h-3.5 text-stone-400" />
              </div>
              {!isInspectingRefer && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenOverride(ord);
                  }}
                  className="p-1.5 text-stone-400 hover:text-amber-700 rounded-xl hover:bg-stone-100"
                >
                  <Edit3 className="w-4 h-4" />
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
              className="p-2 text-stone-400 hover:text-red-600 rounded-xl hover:bg-stone-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

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
    const targetDeposit = Number(ord.deposit_amount_expected) || activeConfigDeposit;
    const expectedAmount = isDeposit ? Math.min(targetDeposit, totalNum) : totalNum;

    setPaymentVerificationModal({
      order: ord,
      isDeposit,
      expectedAmount,
      totalNum
    });
  };

  const cancelReasonOptions = [
    'Khách báo bận / Đổi ý trước khi cắt giàn',
    'Đặt nhầm món / Muốn tạo lại đơn khác',
    'Trùng đơn hàng trước đó',
    'Không đón được khung giờ xe khách chạy',
    'Hết hàng tại vườn',
    'Lý do khác'
  ];

  const bombReasonOptions = [
    'Thuê bao không liên lạc được / Chặn số',
    'Xe tới điểm hẹn nhưng khách không ra nhận',
    'Khách từ chối nhận hàng không có lý do chính đáng',
    'Cố tình cho sai địa chỉ / SĐT ảo',
    'Lý do khác'
  ];

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn font-sans pb-16 text-stone-800">
      {/* ================= 1. CARD TỔNG HỢP DOANH THU & KPI ================= */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs overflow-hidden">
        
        {/* HEADER */}
        <div className="px-5 py-4 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-stone-50/60 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                  Thống Kê Doanh Thu & Vận Hành
                </h2>
                {isLoading && <Loader2 className="w-4 h-4 animate-spin text-amber-600" />}
                <span className="font-mono text-xs font-black bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-full border border-stone-200">
                  {orders.length} đơn hệ thống
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                Đồng bộ thời gian thực Supabase PostgreSQL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-stone-50 border border-stone-200 shadow-2xs">
              <span className="text-xs sm:text-sm text-stone-600 font-bold">Tỷ lệ hủy/bom:</span>
              <span className={`font-mono font-black text-sm sm:text-base ${metrics.lossRate > 15 ? 'text-rose-600' : 'text-stone-900'}`}>
                {metrics.lossRate}%
              </span>
            </div>
          </div>
        </div>

        {/* LƯỚI 4 CHỈ SỐ KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-stone-100 p-1 bg-white">
          <div className="p-5 flex flex-col justify-between space-y-2.5 hover:bg-stone-50/50 transition-colors">
            <span className="text-sm font-bold text-stone-600">Doanh Thu Dự Kiến</span>
            <div>
              <p className="text-xl sm:text-2xl font-black text-stone-900 font-mono tracking-tight">
                {metrics.totalRevenue.toLocaleString('vi-VN')}đ
              </p>
              <span className="text-xs text-stone-400 block font-normal mt-1">
                (Không tính đơn hủy & bom)
              </span>
            </div>
          </div>

          <div className="p-5 flex flex-col justify-between space-y-2.5 hover:bg-emerald-50/30 transition-colors">
            <span className="text-sm font-bold text-emerald-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Tiền Thực Nhận (Đã CK)</span>
            </span>
            <div>
              <p className="text-xl sm:text-2xl font-black text-emerald-700 font-mono tracking-tight">
                {metrics.realReceivedMoney.toLocaleString('vi-VN')}đ
              </p>
              <span className="text-xs text-emerald-800/80 block font-medium mt-1">
                Đơn đã xác nhận & duyệt tiền
              </span>
            </div>
          </div>

          <div className="p-5 flex flex-col justify-between space-y-2.5 hover:bg-stone-50/50 transition-colors">
            <span className="text-sm font-bold text-stone-600">Số Đơn Hiệu Lực</span>
            <div>
              <p className="text-xl sm:text-2xl font-black text-stone-900 font-mono tracking-tight">
                {metrics.totalOrders} <span className="text-sm font-bold text-stone-400">đơn</span>
              </p>
              <span className="text-xs text-stone-400 block font-normal mt-1">
                Đang vận hành & hoàn tất
              </span>
            </div>
          </div>

          <div className="p-5 flex flex-col justify-between space-y-2.5 hover:bg-amber-50/30 transition-colors">
            <span className="text-sm font-bold text-amber-950">Giá Trị TB / Đơn (AOV)</span>
            <div>
              <p className="text-xl sm:text-2xl font-black text-amber-950 font-mono tracking-tight">
                {metrics.avgOrderValue.toLocaleString('vi-VN')}đ
              </p>
              <span className="text-xs text-stone-500 block font-normal mt-1">
                Bình quân giá trị mỗi giỏ hàng
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-5 py-3 bg-[#faf8f5] border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex flex-wrap items-center gap-4 text-stone-700">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="font-semibold">Đơn Hủy:</span>
              <strong className="text-stone-900 font-mono font-black text-sm">{metrics.cancelledCount}</strong>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-700"></span>
              <span className="font-semibold">Bom Hàng:</span>
              <strong className="text-red-700 font-mono font-black text-sm">{metrics.bombedCount}</strong>
            </div>

            <span className="text-stone-300">|</span>

            <div className="flex items-center gap-2">
              <span className="font-semibold">Cọc giữ lại bù tiền xe:</span>
              <strong className="text-emerald-900 font-mono font-black text-xs sm:text-sm bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-300 shadow-2xs">
                +{metrics.retainedDeposit.toLocaleString('vi-VN')}đ
              </strong>
            </div>
          </div>

          <span className="text-xs text-stone-400 italic">
            Chỉ số cập nhật tự động theo trạng thái đơn
          </span>
        </div>
      </div>

      {/* ================= 2. KHU VỰC QUẢN LÝ ĐƠN HÀNG ================= */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
        
        {/* HÀNG 1: TÌM KIẾM + BỘ LỌC NGÀY + NÚT CHUYỂN CHẾ ĐỘ XEM */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm số điện thoại, tên, mã XNG..."
              className="w-full pl-11 pr-9 py-2.5 rounded-2xl bg-stone-50/90 hover:bg-white focus:bg-white border border-stone-200 text-xs sm:text-sm font-medium focus:border-amber-600 focus:outline-none transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Dropdown ngày */}
          <div ref={dateDropdownRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsDateDropdownOpen((prev) => !prev)}
              className={`h-10 px-3.5 sm:px-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-2xs cursor-pointer active:scale-95 ${
                dateFilterType !== 'all'
                  ? 'bg-amber-100 border-amber-400 text-amber-950'
                  : 'bg-stone-50/90 border-stone-200 text-stone-800 hover:bg-white'
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-700" />
              <span className="hidden sm:inline">{currentDateLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-stone-500 transition-transform ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDateDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-2xl border border-stone-200 shadow-xl p-1.5 z-30 animate-fadeIn space-y-1 text-xs sm:text-sm font-medium">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block px-3 py-1.5">
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
                    className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between cursor-pointer transition-colors ${
                      dateFilterType === opt.value
                        ? 'bg-amber-100 text-amber-950 font-bold'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {dateFilterType === opt.value && <Check className="w-4 h-4 text-amber-700" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* NÚT CHUYỂN ĐỔI CHẾ ĐỘ XEM */}
          <div className="flex items-center p-1 bg-stone-100 rounded-2xl border border-stone-200 shrink-0">
            <button
              type="button"
              onClick={() => handleToggleViewMode('list')}
              className={`p-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
              title="Xem danh sách hàng ngang"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleToggleViewMode('grid')}
              className={`p-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
              title="Xem dạng khối bảng (Grid)"
            >
              <LayoutGrid className="w-4 h-4" />
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
              className="h-10 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl border border-stone-200 text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
              title="Đặt lại về mặc định"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* HÀNG 2: THANH TAB TRẠNG THÁI */}
        <div className="pt-2 border-t border-stone-100 flex items-center gap-2 overflow-x-auto pb-1.5 [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`shrink-0 py-2 px-3.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 border ${
              statusFilter === 'all'
                ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
            }`}
          >
            <span>Tất cả</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
              statusFilter === 'all' ? 'bg-stone-800 text-stone-200' : 'bg-stone-200 text-stone-700'
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
                className={`shrink-0 py-2 px-3.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 border whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-800 text-white border-amber-800 shadow-2xs ring-1 ring-amber-800'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                <span>{statusCode === ORDER_STATUS.PENDING ? '⏳ ' + info.label : info.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                  isActive ? 'bg-amber-950 text-amber-200' : 'bg-stone-200 text-stone-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Khung chọn tất cả & thông báo số lượng */}
        <div className="flex items-center justify-between text-xs sm:text-sm px-1 text-stone-600 pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer font-bold hover:text-stone-900 select-none">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="text-stone-400 hover:text-amber-800 cursor-pointer"
            >
              {isAllFilteredSelected ? (
                <CheckSquare className="w-5 h-5 text-amber-800 fill-amber-100" />
              ) : (
                <Square className="w-5 h-5 text-stone-300" />
              )}
            </button>
            <span>Chọn tất cả {filteredOrders.length} đơn</span>
          </label>

          <span className="text-xs sm:text-sm font-medium">
            Chế độ: <strong>{viewMode === 'list' ? 'Hàng ngang' : 'Khối bảng'}</strong>
          </span>
        </div>

        {/* Khung nhập khoảng ngày tùy chọn */}
        {dateFilterType === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-stone-200/60 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="text-stone-600 font-bold">Từ ngày:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value, (msg) => setConfirmModalConfig({ isAlert: true, title: 'Thông Báo', message: msg }))}
                className="py-1.5 px-3 rounded-xl bg-white border border-stone-200 text-xs sm:text-sm font-mono font-bold"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-stone-600 font-bold">Đến ngày:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value, (msg) => setConfirmModalConfig({ isAlert: true, title: 'Thông Báo', message: msg }))}
                className="py-1.5 px-3 rounded-xl bg-white border border-stone-200 text-xs sm:text-sm font-mono font-bold"
              />
            </div>
          </div>
        )}

        {/* BANNER SOI ĐƠN GỐC */}
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

        {/* DANH SÁCH ĐƠN HÀNG */}
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

      {/* ================= 3. THANH THAO TÁC HÀNG LOẠT NỔI ================= */}
      {selectedOrderCodes.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-stone-900 text-white px-5 py-3.5 rounded-3xl shadow-2xl border border-stone-700/80 flex items-center gap-3 sm:gap-4 animate-fadeIn max-w-[95vw] sm:max-w-2xl text-xs sm:text-sm font-sans">
          <div className="flex items-center gap-2 font-bold shrink-0">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center text-xs font-black">
              {selectedOrderCodes.length}
            </span>
            <span className="hidden sm:inline">đã chọn</span>
          </div>

          <div className="h-5 w-[1px] bg-stone-700 hidden sm:block shrink-0" />

          {/* DROPDOWN CHUYỂN BƯỚC TIẾP THEO */}
          <div ref={bulkDropdownRef} className="relative flex-1 min-w-[150px]">
            <button
              type="button"
              disabled={isBulkProcessing || commonNextStatuses.length === 0}
              onClick={() => setIsBulkStatusDropdownOpen((prev) => !prev)}
              className="w-full px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-100 rounded-2xl font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer border border-stone-600 disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              <div className="flex items-center gap-2 truncate">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>
                  {commonNextStatuses.length > 0 
                    ? 'Chuyển bước kế tiếp...' 
                    : 'Không cùng tiến trình'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
            </button>

            {isBulkStatusDropdownOpen && commonNextStatuses.length > 0 && (
              <div className="absolute bottom-full mb-2 left-0 w-64 bg-white text-stone-900 rounded-3xl border border-stone-200 shadow-2xl p-2 z-50 animate-fadeIn space-y-1">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block px-3 py-1.5">
                  Bước kế tiếp ({selectedOrderCodes.length} đơn):
                </span>
                {commonNextStatuses.map((statusCode) => {
                  const info = ORDER_STATUS_MAP[statusCode];
                  return (
                    <button
                      key={statusCode}
                      type="button"
                      onClick={() => handleBulkUpdateStatus(statusCode)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-bold hover:bg-amber-50 hover:text-amber-950 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>➔ {info?.label || statusCode}</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${info?.bg?.split(' ')[0] || 'bg-stone-400'}`} />
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
            className="px-3 py-2 bg-stone-800 hover:bg-amber-950/80 text-amber-400 border border-stone-700 hover:border-amber-600 rounded-2xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-30 disabled:cursor-not-allowed text-xs sm:text-sm"
            title={canBulkCancel ? "Hủy toàn bộ đơn đã chọn" : "Chỉ hủy được các đơn chưa hoàn tất"}
          >
            <Ban className="w-4 h-4" />
            <span className="hidden md:inline">Hủy</span>
          </button>

          {/* NÚT BOM HÀNG LOẠT */}
          <button
            type="button"
            disabled={isBulkProcessing || !canBulkBomb}
            onClick={handleOpenBulkBombModal}
            className="px-3 py-2 bg-stone-800 hover:bg-rose-950/80 text-rose-400 border border-stone-700 hover:border-rose-600 rounded-2xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-30 disabled:cursor-not-allowed text-xs sm:text-sm"
            title={canBulkBomb ? "Đánh dấu bom hàng loạt (Chỉ áp dụng khi đang giao & không CK 100%)" : "Không thể đánh dấu Bom (đơn chưa gửi hoặc đã thanh toán 100%)"}
          >
            <ShieldAlert className="w-4 h-4" />
            <span className="hidden md:inline">Bom</span>
          </button>

          {/* NÚT XÓA HÀNG LOẠT */}
          <button
            type="button"
            disabled={isBulkProcessing}
            onClick={handleBulkDelete}
            className="p-2.5 bg-stone-800 hover:bg-rose-900/60 text-stone-400 hover:text-rose-400 rounded-2xl transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title="Xóa tất cả đơn đã chọn"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* HỦY CHỌN */}
          <button
            type="button"
            onClick={() => setSelectedOrderCodes([])}
            className="p-2 text-stone-400 hover:text-white rounded-xl transition-colors cursor-pointer shrink-0"
            title="Bỏ chọn tất cả"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= MODAL XÁC NHẬN DUYỆT TIỀN CỌC / CHUYỂN KHOẢN ================= */}
      {paymentVerificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/75 backdrop-blur-xs p-4 animate-fadeIn font-sans">
          <div className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-md border border-stone-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <h4 className="font-black text-base sm:text-lg text-stone-900">
                    {paymentVerificationModal.isDeposit ? 'Xác Nhận Đã Nhận Tiền Cọc' : 'Xác Nhận Đã Nhận Đủ 100%'}
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-500 font-mono">
                    Mã đơn: <strong className="text-amber-950 font-bold">{paymentVerificationModal.order.code}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPaymentVerificationModal(null)}
                className="text-stone-400 hover:text-stone-700 p-2 rounded-2xl hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chi tiết số tiền & tài khoản đối soát */}
            <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200/80 space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between items-center text-stone-600">
                <span className="font-medium">Khách hàng:</span>
                <span className="font-bold text-stone-900 text-sm">
                  {paymentVerificationModal.order.customer_name || paymentVerificationModal.order.name || 'Khách đặt'}
                </span>
              </div>

              <div className="flex justify-between items-center text-stone-600">
                <span className="font-medium">Số điện thoại:</span>
                <span className="font-mono font-bold text-stone-900 text-sm">
                  {paymentVerificationModal.order.phone}
                </span>
              </div>

              <div className="flex justify-between items-center text-stone-600">
                <span className="font-medium">Tổng giá trị đơn hàng:</span>
                <span className="font-mono font-black text-stone-900 text-sm sm:text-base">
                  {paymentVerificationModal.totalNum.toLocaleString('vi-VN')}đ
                </span>
              </div>

              <div className="pt-2.5 border-t border-stone-200/70 flex justify-between items-center">
                <span className="font-bold text-emerald-950 text-xs sm:text-sm">
                  {paymentVerificationModal.isDeposit ? 'Số tiền cọc cần đối soát:' : 'Số tiền 100% cần đối soát:'}
                </span>
                <span className="font-mono font-black text-emerald-700 text-lg sm:text-xl">
                  {paymentVerificationModal.expectedAmount.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2.5 leading-relaxed font-normal">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Vui lòng mở ứng dụng <strong>{bankLabel}</strong> và kiểm tra biến động số dư đúng mã <strong>{paymentVerificationModal.order.code}</strong> trước khi xác nhận. Sau khi xác nhận, đơn sẽ tự động chuyển sang trạng thái <strong>Đã Xác Nhận (Confirmed)</strong> để chuyển giao qua tổ Đóng gói.
              </span>
            </div>

            <div className="flex items-center gap-3 pt-2.5 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setPaymentVerificationModal(null)}
                className="flex-1 py-3 rounded-2xl border border-stone-200 hover:bg-stone-100 font-bold text-xs sm:text-sm text-stone-700 transition-colors cursor-pointer"
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
                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Đã Nhận Đủ Tiền</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL LÝ DO HỦY / BOM ================= */}
      {pendingStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/75 backdrop-blur-xs p-4 animate-fadeIn font-sans">
          <div className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-md border border-stone-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
              <div className="flex items-center gap-3">
                {pendingStatusModal.isBombed ? (
                  <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h4 className="font-black text-base sm:text-lg text-stone-900">
                    {pendingStatusModal.isBulk
                      ? (pendingStatusModal.isBombed 
                          ? `Đánh Dấu BOM ${pendingStatusModal.targetCodes.length} ĐƠN HÀNG` 
                          : `Xác Nhận HỦY ${pendingStatusModal.targetCodes.length} ĐƠN HÀNG`)
                      : (pendingStatusModal.isBombed 
                          ? 'Xác Nhận Đánh Dấu BOM HÀNG' 
                          : 'Xác Nhận HỦY ĐƠN HÀNG')
                    }
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-500 font-mono">
                    {pendingStatusModal.isBulk 
                      ? `Áp dụng cho ${pendingStatusModal.targetCodes.length} đơn được chọn` 
                      : `Mã đơn: ${pendingStatusModal.order.code}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingStatusModal(null)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-stone-700 mb-1.5">
                  Chọn lý do chính *:
                </label>
                <StatusReasonDropdown
                  value={statusReason}
                  options={pendingStatusModal.isBombed ? bombReasonOptions : cancelReasonOptions}
                  onSelect={(selected) => setStatusReason(selected)}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-stone-700 mb-1.5">
                  Ghi chú chi tiết (nếu có):
                </label>
                <input
                  type="text"
                  placeholder="VD: Nhà xe gọi 3 lần đều không bắt máy..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-stone-200 bg-white font-medium text-stone-800 focus:outline-none focus:border-amber-600 shadow-2xs text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2.5 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setPendingStatusModal(null)}
                className="flex-1 py-3 rounded-2xl border border-stone-200 hover:bg-stone-100 font-bold text-xs sm:text-sm text-stone-700 cursor-pointer"
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
                className={`flex-1 py-3 rounded-2xl text-white font-bold text-xs sm:text-sm cursor-pointer shadow-xs disabled:opacity-50 ${
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

      {/* ================= MODAL ĐÍNH CHÍNH TRẠNG THÁI ================= */}
      {overrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/75 backdrop-blur-xs p-4 animate-fadeIn font-sans">
          <div className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-md border border-amber-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-base sm:text-lg text-stone-900">
                    Đính Chính Trạng Thái Đơn Hàng
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-500 font-mono">Mã đơn: {overrideModal.code}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOverrideModal(null)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs sm:text-sm text-amber-950 space-y-1.5 leading-relaxed font-normal">
              <strong className="block font-bold">⚠️ Cảnh báo can thiệp đơn đã đóng:</strong>
              <p className="text-amber-900">
                Đơn hàng này đang ở trạng thái đã kết thúc. Chỉ thực hiện đính chính khi có sự cố thao tác nhầm lẫn để đảm bảo không làm lệch số liệu thống kê.
              </p>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-stone-700 mb-1.5">
                  Chọn trạng thái cần đính chính lại *:
                </label>
                <OverrideStatusDropdown
                  value={overrideTargetStatus}
                  onSelect={(selectedCode) => setOverrideTargetStatus(selectedCode)}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-stone-700 mb-1.5">
                  Lý do đính chính (để ghi log) *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Bấm nhầm nút khi khách vừa chuyển khoản..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-stone-200 bg-white font-medium text-stone-800 focus:outline-none focus:border-amber-600 shadow-2xs text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2.5 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setOverrideModal(null)}
                className="flex-1 py-3 rounded-2xl border border-stone-200 hover:bg-stone-100 font-bold text-xs sm:text-sm text-stone-700 cursor-pointer"
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
                className="flex-1 py-3 rounded-2xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-xs active:scale-95 transition-all"
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