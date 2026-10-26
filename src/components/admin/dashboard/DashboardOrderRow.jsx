// src/components/admin/dashboard/DashboardOrderRow.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Square, CheckSquare, PhoneCall, Calendar, CheckCircle2, 
  Clock, ShieldAlert, CheckCircle, History, ArrowUpRight, 
  Info, Loader2, Lock, Edit3, ChevronDown, Check, Trash2 
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
    <div ref={dropdownRef} className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
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

export default function DashboardOrderRow({
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
  const isPending = currentStatusCode === ORDER_STATUS.PENDING;
  const isConfirmed = currentStatusCode === ORDER_STATUS.CONFIRMED;
  
  const isLockedStatus = isInspectingRefer || isTerminalStatus;
  const customerName = ord.customer_name || ord.name || 'Khách đặt';

  const isPaid = Boolean(ord.payment_verified) || isCompleted;
  const isConfirming = confirmingOrderCode === ord.code;

  const bankLabel = getActiveBankLabel(shopConfig);
  const displayedDepositNum = Number(ord.deposit_amount_expected || ord.deposit_paid || activeDepositConfig);

  // Điều kiện kiểm tra đơn chờ duyệt tiền cọc / chuyển khoản
  const isAwaitingPaymentVerification = !isPaid && isPending && paymentMethodVal !== 'cod';

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

              {isPaid || isConfirmed ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/90 text-emerald-900 border border-emerald-300 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isCompleted ? 'Đã thanh toán đủ 100%' : `Đã cọc ${displayedDepositNum.toLocaleString('vi-VN')}đ`}</span>
                </span>
              ) : isPending && paymentMethodVal !== 'cod' ? (
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
                {renderItemsSummary(ord.order_items, ord.itemsSummary, ord, false, shopConfig)}
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

          {/* KHU VỰC THAO TÁC NÚT: ĐẢM BẢO CHỈ 1 NÚT DUY NHẤT KHI CHỜ CỌC */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {isAwaitingPaymentVerification ? (
              /* TRƯỜNG HỢP 1: CHỈ DUY NHẤT NÚT XÁC NHẬN CỌC / TIỀN */
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
            ) : isLockedStatus ? (
              /* TRƯỜNG HỢP 2: ĐƠN ĐÃ KHÓA / HOÀN TẤT */
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