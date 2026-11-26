// src/components/admin/dashboard/StatusReasonModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, ChevronDown, Check } from 'lucide-react';

const CANCEL_REASONS = [
  'Khách báo bận / Đổi ý trước khi cắt giàn',
  'Đặt nhầm món / Muốn tạo lại đơn khác',
  'Trùng đơn hàng trước đó',
  'Không đón được khung giờ xe khách chạy',
  'Hết hàng tại vườn',
  'Lý do khác'
];

const BOMB_REASONS = [
  'Thuê bao không liên lạc được / Chặn số',
  'Xe tới điểm hẹn nhưng khách không ra nhận',
  'Khách từ chối nhận hàng không có lý do chính đáng',
  'Cố tình cho sai địa chỉ / SĐT ảo',
  'Lý do khác'
];

export default function StatusReasonModal({
  modalData,
  isProcessing,
  onClose,
  onSubmit
}) {
  const [statusReason, setStatusReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (modalData) {
      setStatusReason(
        modalData.isBombed 
          ? 'Thuê bao không liên lạc được / Chặn số' 
          : 'Khách báo bận / Đổi ý trước khi cắt giàn'
      );
      setCustomReason('');
    }
  }, [modalData]);

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

  if (!modalData) return null;

  const options = modalData.isBombed ? BOMB_REASONS : CANCEL_REASONS;

  const handleConfirm = () => {
    const finalReason = customReason.trim() ? `${statusReason} - ${customReason.trim()}` : statusReason;
    onSubmit(modalData, finalReason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/75 backdrop-blur-xs p-4 animate-fadeIn font-sans">
      <div className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-md border border-stone-200 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
          <div className="flex items-center gap-3">
            {modalData.isBombed ? (
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
                {modalData.isBulk
                  ? (modalData.isBombed 
                      ? `Đánh Dấu BOM ${modalData.targetCodes.length} ĐƠN HÀNG` 
                      : `Xác Nhận HỦY ${modalData.targetCodes.length} ĐƠN HÀNG`)
                  : (modalData.isBombed 
                      ? 'Xác Nhận Đánh Dấu BOM HÀNG' 
                      : 'Xác Nhận HỦY ĐƠN HÀNG')
                }
              </h4>
              <p className="text-xs sm:text-sm text-stone-500 font-mono">
                {modalData.isBulk 
                  ? `Áp dụng cho ${modalData.targetCodes.length} đơn được chọn` 
                  : `Mã đơn: ${modalData.order.code}`}
              </p>
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

        <div className="space-y-3.5 text-xs sm:text-sm">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-stone-700 mb-1.5">
              Chọn lý do chính *:
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
                <span className="truncate pr-2">{statusReason || 'Chọn lý do...'}</span>
                <ChevronDown className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-amber-700' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-fadeIn">
                  <div className="px-4 py-2.5 text-xs font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100 bg-stone-50/50">
                    Chọn lý do phù hợp:
                  </div>
                  <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                    {options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setStatusReason(opt);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between text-xs sm:text-sm transition-colors cursor-pointer ${
                          statusReason === opt
                            ? 'bg-amber-100 text-amber-950 font-bold'
                            : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900 font-medium'
                        }`}
                      >
                        <span className="truncate">{opt}</span>
                        {statusReason === opt && <Check className="w-4 h-4 text-amber-700 shrink-0 ml-2" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-stone-200 hover:bg-stone-100 font-bold text-xs sm:text-sm text-stone-700 cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleConfirm}
            className={`flex-1 py-3 rounded-2xl text-white font-bold text-xs sm:text-sm cursor-pointer shadow-xs disabled:opacity-50 ${
              modalData.isBombed 
                ? 'bg-rose-600 hover:bg-rose-700' 
                : 'bg-stone-900 hover:bg-amber-700'
            }`}
          >
            {isProcessing ? 'Đang lưu...' : 'Lưu trạng thái & Ghi chú'}
          </button>
        </div>
      </div>
    </div>
  );
}