// src/components/admin/dashboard/BulkActionBar.jsx
import React, { useRef, useState, useEffect } from 'react';
import { Layers, ChevronDown, Ban, ShieldAlert, Trash2, X, Loader2 } from 'lucide-react';
import { ORDER_STATUS_MAP } from '../../../constants/orderStatus';

export default function BulkActionBar({
  selectedCount,
  commonNextStatuses = [],
  canBulkCancel,
  canBulkBomb,
  isBulkProcessing,
  onBulkUpdateStatus,
  onOpenBulkCancelModal,
  onOpenBulkBombModal,
  onBulkDelete,
  onClearSelection
}) {
  const [isBulkStatusDropdownOpen, setIsBulkStatusDropdownOpen] = useState(false);
  const bulkDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bulkDropdownRef.current && !bulkDropdownRef.current.contains(e.target)) {
        setIsBulkStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-stone-900/95 text-white px-4 sm:px-5 py-3 rounded-3xl shadow-2xl border border-stone-700/80 backdrop-blur-md flex items-center gap-2.5 sm:gap-4 animate-fadeIn max-w-[95vw] sm:max-w-2xl text-xs sm:text-sm font-sans select-none">
      {/* SỐ LƯỢNG ĐÃ CHỌN */}
      <div className="flex items-center gap-2 font-bold shrink-0">
        <span className="w-6 h-6 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center text-xs font-black font-mono">
          {selectedCount}
        </span>
        <span className="hidden sm:inline">đã chọn</span>
      </div>

      <div className="h-5 w-[1px] bg-stone-700 hidden sm:block shrink-0" />

      {/* DROPDOWN CHUYỂN BƯỚC TIẾP THEO */}
      <div ref={bulkDropdownRef} className="relative flex-1 min-w-[140px] sm:min-w-[170px]">
        <button
          type="button"
          disabled={isBulkProcessing || commonNextStatuses.length === 0}
          onClick={() => setIsBulkStatusDropdownOpen((prev) => !prev)}
          className="w-full px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-100 rounded-2xl font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer border border-stone-600 disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm"
        >
          <div className="flex items-center gap-2 truncate">
            {isBulkProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
            ) : (
              <Layers className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className="truncate">
              {isBulkProcessing
                ? 'Đang xử lý...'
                : commonNextStatuses.length > 0 
                  ? 'Chuyển bước kế tiếp...' 
                  : 'Không cùng tiến trình'}
            </span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-stone-400 shrink-0 transition-transform ${isBulkStatusDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isBulkStatusDropdownOpen && commonNextStatuses.length > 0 && (
          <div className="absolute bottom-full mb-2 left-0 w-64 bg-white text-stone-900 rounded-3xl border border-stone-200 shadow-2xl p-2 z-50 animate-fadeIn space-y-1">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block px-3 py-1.5">
              Bước kế tiếp ({selectedCount} đơn):
            </span>
            {commonNextStatuses.map((statusCode) => {
              const info = ORDER_STATUS_MAP[statusCode];
              return (
                <button
                  key={statusCode}
                  type="button"
                  disabled={isBulkProcessing}
                  onClick={() => {
                    setIsBulkStatusDropdownOpen(false);
                    onBulkUpdateStatus(statusCode);
                  }}
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
        onClick={onOpenBulkCancelModal}
        className="px-3 py-2 bg-stone-800 hover:bg-amber-950/80 text-amber-400 border border-stone-700 hover:border-amber-600 rounded-2xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-30 disabled:cursor-not-allowed text-xs sm:text-sm active:scale-95"
        title={canBulkCancel ? "Hủy toàn bộ đơn đã chọn" : "Chỉ hủy được các đơn chưa hoàn tất"}
      >
        <Ban className="w-4 h-4" />
        <span className="hidden md:inline">Hủy</span>
      </button>

      {/* NÚT BOM HÀNG LOẠT */}
      <button
        type="button"
        disabled={isBulkProcessing || !canBulkBomb}
        onClick={onOpenBulkBombModal}
        className="px-3 py-2 bg-stone-800 hover:bg-rose-950/80 text-rose-400 border border-stone-700 hover:border-rose-600 rounded-2xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-30 disabled:cursor-not-allowed text-xs sm:text-sm active:scale-95"
        title={canBulkBomb ? "Đánh dấu bom hàng loạt (Chỉ áp dụng khi đang giao & không CK 100%)" : "Không thể đánh dấu Bom (đơn chưa gửi hoặc đã thanh toán 100%)"}
      >
        <ShieldAlert className="w-4 h-4" />
        <span className="hidden md:inline">Bom</span>
      </button>

      {/* NÚT XÓA HÀNG LOẠT */}
      <button
        type="button"
        disabled={isBulkProcessing}
        onClick={onBulkDelete}
        className="p-2.5 bg-stone-800 hover:bg-rose-900/60 text-stone-400 hover:text-rose-400 rounded-2xl transition-colors cursor-pointer shrink-0 disabled:opacity-50 active:scale-95"
        title="Xóa tất cả đơn đã chọn"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* HỦY CHỌN */}
      <button
        type="button"
        disabled={isBulkProcessing}
        onClick={onClearSelection}
        className="p-2 text-stone-400 hover:text-white rounded-xl transition-colors cursor-pointer shrink-0"
        title="Bỏ chọn tất cả"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}