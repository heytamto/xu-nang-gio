// src/components/admin/ConfirmModal.jsx
import React, { useEffect } from 'react';
import { AlertTriangle, Info, Check } from 'lucide-react';

export default function ConfirmModal({ modalConfig, onClose }) {
  const isAlert = Boolean(modalConfig?.isAlert);
  const isDanger = modalConfig?.isDanger !== undefined ? Boolean(modalConfig.isDanger) : !isAlert;

  // Hỗ trợ phím Escape để đóng nhanh
  useEffect(() => {
    if (!modalConfig) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalConfig, onClose]);

  if (!modalConfig) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn font-sans"
    >
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 space-y-4 transform transition-all scale-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
            isDanger ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
          }`}>
            {isDanger ? (
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            ) : (
              <Info className="w-5 h-5 stroke-[2.2]" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-black text-stone-900">{modalConfig.title || 'Thông Báo'}</h4>
            <p className="text-xs text-stone-500">
              {modalConfig.subtitle || (isAlert ? 'Hệ thống vườn Xứ Nắng' : 'Hành động này không thể hoàn tác')}
            </p>
          </div>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3.5 rounded-2xl border border-stone-100 whitespace-pre-line">
          {modalConfig.message}
        </p>

        <div className="flex items-center justify-end gap-2 pt-1">
          {!isAlert && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (modalConfig.onConfirm) modalConfig.onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
              isDanger 
                ? 'bg-rose-600 hover:bg-rose-500' 
                : 'bg-stone-900 hover:bg-amber-700'
            }`}
          >
            {isAlert && <Check className="w-3.5 h-3.5" />}
            <span>{modalConfig.confirmLabel || (isAlert ? 'Đã hiểu' : 'Đồng ý')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}