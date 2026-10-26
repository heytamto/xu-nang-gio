// src/components/admin/dashboard/OverrideStatusModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Edit3, ChevronDown, Check } from 'lucide-react';
import { ORDER_STATUS_MAP, normalizeOrderStatus } from '../../../constants/orderStatus';

export default function OverrideStatusModal({
  order,
  onClose,
  onConfirm
}) {
  const [overrideTargetStatus, setOverrideTargetStatus] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (order) {
      setOverrideTargetStatus(normalizeOrderStatus(order.status));
      setOverrideReason('');
    }
  }, [order]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  if (!order) return null;

  const currentLabel = ORDER_STATUS_MAP[overrideTargetStatus]?.label || overrideTargetStatus || 'Chọn trạng thái';

  const handleSave = () => {
    if (!overrideTargetStatus) return;
    const reasonText = overrideReason.trim() 
      ? `[Admin đính chính]: ${overrideReason.trim()}` 
      : '[Admin đính chính trạng thái]';
    onConfirm(order.code, overrideTargetStatus, reasonText);
  };

  return (
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
              <p className="text-xs sm:text-sm text-stone-500 font-mono">Mã đơn: {order.code}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
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
            <div className="relative text-xs sm:text-sm font-sans" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
                  isDropdownOpen
                    ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20 text-stone-900 font-bold'
                    : 'border-amber-400 bg-white hover:border-amber-500 text-stone-900 font-semibold'
                }`}
              >
                <span className="truncate pr-2">{currentLabel}</span>
                <ChevronDown className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-amber-700' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-fadeIn">
                  <div className="px-4 py-2.5 text-xs font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100 bg-stone-50/50">
                    Chuyển sang trạng thái:
                  </div>
                  <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                    {Object.entries(ORDER_STATUS_MAP).map(([statusCode, info]) => {
                      const isSelected = overrideTargetStatus === statusCode;
                      return (
                        <button
                          key={statusCode}
                          type="button"
                          onClick={() => {
                            setOverrideTargetStatus(statusCode);
                            setIsDropdownOpen(false);
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
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-stone-200 hover:bg-stone-100 font-bold text-xs sm:text-sm text-stone-700 cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 rounded-2xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-xs active:scale-95 transition-all"
          >
            Xác nhận đính chính
          </button>
        </div>
      </div>
    </div>
  );
}