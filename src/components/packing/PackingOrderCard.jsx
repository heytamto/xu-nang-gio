// src/components/packing/PackingOrderCard.jsx
import React, { useRef } from 'react';
import { 
  Printer, 
  Package, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  Banknote, 
  Camera, 
  ExternalLink, 
  Check, 
  Loader2, 
  Gift 
} from 'lucide-react';
import { ORDER_STATUS, normalizeOrderStatus } from '../../constants/orderStatus';

export default function PackingOrderCard({
  order,
  collectInfo,
  items = [],
  checkedBoxItems = {},
  onToggleBoxItem,
  onPrintSingle,
  onUpdateStatus,
  onUploadPhoto,
  isUploading = false,
  packingImageUrl = null
}) {
  const fileInputRef = useRef(null);
  const orderCode = order.code || order.orderId;
  const currentStatusCode = normalizeOrderStatus(order.status);
  const isPackingNow = currentStatusCode === ORDER_STATUS.PACKING;
  const cleanNote = String(order.customer_note || order.note || '').trim();

  return (
    <div className={`bg-white rounded-3xl border shadow-xs p-6 sm:p-7 space-y-5 ${
      isPackingNow ? 'border-purple-300 ring-2 ring-purple-200/80 bg-purple-50/15' : 'border-stone-200/90'
    }`}>
      {/* HEADER CARD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono font-black text-amber-900 bg-amber-100 px-3 py-1 rounded-xl text-sm">
              {orderCode}
            </span>
            <strong className="text-stone-900 text-base sm:text-lg">
              {order.customer_name || order.name || order.customerName || ''}
            </strong>
            {order.phone && (
              <span className="text-xs sm:text-sm font-mono font-bold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-xl">
                {order.phone}
              </span>
            )}

            {isPackingNow ? (
              <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold border px-3 py-1 rounded-xl bg-purple-100 text-purple-900 border-purple-300">
                <Package className="w-4 h-4 text-purple-700" />
                <span>Đang đóng gói</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold border px-3 py-1 rounded-xl bg-blue-100 text-blue-900 border-blue-300">
                <CheckCircle2 className="w-4 h-4 text-blue-700" />
                <span>Đã xác nhận (Chờ kho gói)</span>
              </span>
            )}

            <span className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold border px-3 py-1 rounded-xl ${collectInfo.badgeStyle}`}>
              {collectInfo.type === 'PAID_FULL' && <ShieldCheck className="w-4 h-4 text-emerald-600" />}
              {collectInfo.type === 'DEPOSIT_REMAINING' && <AlertCircle className="w-4 h-4 text-amber-600" />}
              {collectInfo.type === 'COD_FULL' && <Banknote className="w-4 h-4 text-rose-600" />}
              <span>{collectInfo.badgeText}</span>
            </span>
          </div>

          <p className="text-stone-700 text-sm sm:text-base font-normal">
            📍 <strong>Điểm giao / Bến xe:</strong> {order.address}
          </p>

          {cleanNote && (
            <p className="text-rose-700 italic text-sm font-medium">
              * Ghi chú khách: {cleanNote}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onPrintSingle}
            className="px-4 py-2.5 rounded-2xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-stone-500" />
            <span>In Tem</span>
          </button>

          {!isPackingNow ? (
            <button
              type="button"
              onClick={() => onUpdateStatus(ORDER_STATUS.PACKING)}
              className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>Bắt Đầu Đóng</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onUpdateStatus(ORDER_STATUS.SHIPPING)}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã Gói Xong ➔ Giao Xe</span>
            </button>
          )}
        </div>
      </div>

      {/* KHU VỰC CHỤP ẢNH THÙNG */}
      <div className="p-4 sm:p-5 rounded-2xl border border-stone-200/80 bg-stone-50/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <strong className="text-sm sm:text-base text-stone-900 block font-bold">Ảnh Thùng Hàng Đã Đóng & Dán Tem:</strong>
            <span className="text-xs sm:text-sm text-stone-500 block font-normal">
              Chụp ảnh thực tế kiện hàng trước khi chuyển giao cho tài xế/nhà xe
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) onUploadPhoto(e.target.files[0]);
            }}
          />

          {packingImageUrl ? (
            <div className="flex items-center gap-3">
              <a
                href={packingImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative group block w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-sm shrink-0 cursor-pointer"
              >
                <img
                  src={packingImageUrl}
                  alt="Ảnh đóng thùng"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                  <ExternalLink className="w-4 h-4" />
                </div>
              </a>

              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Đã có ảnh kiện</span>
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="text-xs text-stone-600 hover:text-amber-800 underline font-medium block cursor-pointer"
                >
                  {isUploading ? 'Đang tải lên...' : 'Chụp lại ảnh'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                  <span>Đang tải ảnh lên...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 text-amber-700" />
                  <span>Chụp / Tải Ảnh Kiện</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* MÓN CẦN BỎ VÀO THÙNG */}
      <div className="space-y-2 bg-stone-50/70 p-4 sm:p-5 rounded-2xl border border-stone-200/60">
        <span className="text-xs font-extrabold uppercase text-stone-500 tracking-wider block mb-1">
          Món cần bỏ vào thùng xốp ({items.length} món):
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((it, idx) => {
            const isBoxChecked = !!checkedBoxItems[`${orderCode}_${idx}`];

            return (
              <div 
                key={idx} 
                onClick={() => onToggleBoxItem(idx)}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-2.5 shadow-2xs cursor-pointer select-none ${
                  isBoxChecked 
                    ? 'bg-emerald-50/80 border-emerald-300' 
                    : it.isGift 
                      ? 'bg-amber-50/90 border-amber-300 hover:border-amber-400' 
                      : 'bg-white border-stone-200/80 hover:border-stone-300'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                    isBoxChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-300 bg-white'
                  }`}>
                    {isBoxChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <div className="min-w-0">
                    <div className={`font-bold text-xs sm:text-sm truncate ${
                      isBoxChecked 
                        ? 'text-emerald-950 line-through opacity-75' 
                        : it.isGift 
                          ? 'text-amber-950 flex items-center gap-1.5' 
                          : 'text-stone-900'
                    }`}>
                      {it.isGift && <Gift className="w-4 h-4 text-amber-700 shrink-0" />}
                      <span>{it.name}</span>
                    </div>
                    <div className="text-xs text-stone-500 font-medium">
                      Quy cách: {it.spec}
                    </div>
                  </div>
                </div>

                <span className={`font-mono font-black text-sm sm:text-base px-3 py-1 rounded-xl border shrink-0 ${
                  isBoxChecked 
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                    : it.isGift 
                      ? 'bg-amber-200 text-amber-950 border-amber-300' 
                      : 'bg-amber-100 text-amber-900 border-amber-200'
                }`}>
                  x{it.quantity}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}