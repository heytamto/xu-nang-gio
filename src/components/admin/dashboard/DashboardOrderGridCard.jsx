// src/components/admin/dashboard/DashboardOrderGridCard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Square, CheckSquare, PhoneCall, CheckCircle2, Clock, 
  Lock, Edit3, Trash2, ChevronDown, Check, Loader2 
} from 'lucide-react';
import { formatDateTime, getRemainingCancelMs, formatCountdownTimer } from '../../../utils/dateUtils';
import { ORDER_STATUS, ORDER_STATUS_MAP, normalizeOrderStatus } from '../../../constants/orderStatus';
import { parseCleanMoney } from '../../../services/customerRiskService';
import { 
  FORWARD_STATUS_MAP, 
  resolveDepositAmount, 
  getActiveBankLabel, 
  getDynamicPaymentLabel, 
  renderItemsSummary 
} from './dashboardUtils';

function StatusSelectDropdown({ 
  ord, 
  currentStatusCode, 
  statusMeta, 
  allowedNextStatuses, 
  isFullPrepaid, 
  isPaid,
  paymentMethodVal,
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
    <div ref={dropdownRef} className="relative inline-block text-left flex-1" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        disabled={isProcessing}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`w-full text-xs sm:text-sm font-bold px-3 py-2 rounded-2xl border flex items-center justify-between gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50 ${statusMeta.bg}`}
      >
        <span>{statusMeta.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-stone-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 w-full min-w-[190px] bg-white rounded-2xl border border-stone-200 shadow-xl p-1.5 z-30 animate-fadeIn space-y-1 text-xs font-medium font-sans">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block px-3 py-1">
            Chuyển trạng thái:
          </span>

          <div className="w-full px-3 py-2 rounded-xl text-left flex items-center justify-between bg-stone-100 text-stone-800 font-bold">
            <span>{statusMeta.label}</span>
            <Check className="w-3.5 h-3.5 text-stone-600" />
          </div>

          {allowedNextStatuses.map((nextStatusCode) => {
            if (isFullPrepaid && nextStatusCode === ORDER_STATUS.BOMBED) return null;

            // Chặn nhảy cóc qua dropdown với đơn cọc/chuyển khoản chưa thanh toán
            const isPrepaidOrder = paymentMethodVal !== 'cod';
            if (!isPaid && isPrepaidOrder && nextStatusCode === ORDER_STATUS.CONFIRMED) {
              return null;
            }

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
                className="w-full px-3 py-2 rounded-xl text-left flex items-center justify-between font-bold text-stone-700 hover:bg-amber-50 hover:text-amber-950 transition-colors cursor-pointer"
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

export default function DashboardOrderGridCard({
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
  const isPending = currentStatusCode === ORDER_STATUS.PENDING;
  const isConfirmed = currentStatusCode === ORDER_STATUS.CONFIRMED;

  const isLockedStatus = isInspectingRefer || isTerminalStatus;
  const customerName = ord.customer_name || ord.name || 'Khách đặt';

  const isPaid = Boolean(ord.payment_verified) || isCompleted;
  const isConfirming = confirmingOrderCode === ord.code;

  const bankLabel = getActiveBankLabel(shopConfig);
  const displayedDepositNum = Number(ord.deposit_amount_expected || ord.deposit_paid || activeDepositConfig);

  // Đơn cần duyệt thanh toán trước: Trạng thái PENDING + hình thức cọc/100% + chưa nổ tiền
  const isAwaitingPaymentVerification = !isPaid && isPending && paymentMethodVal !== 'cod';

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

          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {isPaid || isConfirmed ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-emerald-100/90 border border-emerald-300 px-3 py-1 rounded-full shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isCompleted ? 'Đã thanh toán đủ 100%' : `Đã cọc ${displayedDepositNum.toLocaleString('vi-VN')}đ`}</span>
              </span>
            ) : isPending && paymentMethodVal !== 'cod' ? (
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

        {/* KHU VỰC THAO TÁC NÚT: ĐẢM BẢO CHỈ 1 NÚT DUY NHẤT KHI CHỜ CỌC */}
        <div 
          className="flex items-center justify-between gap-2 pt-1"
          onClick={(e) => e.stopPropagation()}
        >
          {isAwaitingPaymentVerification ? (
            /* TRƯỜNG HỢP 1: DUY NHẤT 1 NÚT XÁC NHẬN CỌC / TIỀN */
            <button
              type="button"
              disabled={isConfirming || isProcessing}
              onClick={(e) => {
                e.stopPropagation();
                onRequestConfirmPayment && onRequestConfirmPayment(ord);
              }}
              className="flex-1 py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              title={`Xác nhận kiểm tra tiền về ${bankLabel}`}
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang duyệt...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{paymentMethodVal === 'deposit' ? 'Đã Nhận Cọc' : 'Đã Nhận Đủ 100%'}</span>
                </>
              )}
            </button>
          ) : isLockedStatus ? (
            /* TRƯỜNG HỢP 2: ĐƠN ĐÃ KHÓA / HOÀN TẤT */
            <div className="flex items-center gap-1.5 flex-1">
              <div className={`text-xs sm:text-sm font-bold px-3 py-2 rounded-2xl border flex items-center justify-between flex-1 select-none ${statusMeta.bg}`}>
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
                  className="p-2 text-stone-400 hover:text-amber-700 rounded-xl hover:bg-stone-100 cursor-pointer"
                  title="Ghi đè trạng thái"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            /* TRƯỜNG HỢP 3: DROPDOWN CHUYỂN TRẠNG THÁI BÌNH THƯỜNG */
            <StatusSelectDropdown
              ord={ord}
              currentStatusCode={currentStatusCode}
              statusMeta={statusMeta}
              allowedNextStatuses={allowedNextStatuses}
              isFullPrepaid={isFullPrepaid}
              isPaid={isPaid}
              paymentMethodVal={paymentMethodVal}
              isProcessing={isProcessing}
              onSelectStatus={onSelectStatus}
            />
          )}

          {/* Nút xóa đơn */}
          {!isInspectingRefer && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteOrder(ord.code);
              }}
              className="p-2.5 text-stone-400 hover:text-red-600 rounded-2xl hover:bg-stone-100 transition-colors cursor-pointer shrink-0"
              title="Xóa đơn hàng"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}