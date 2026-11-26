// src/components/admin/ConfirmModal.jsx
import React, { useEffect } from 'react';
import { AlertTriangle, Info, Check, X } from 'lucide-react';

export default function ConfirmModal({ modalConfig, onClose }) {
  const isAlert = Boolean(modalConfig?.isAlert);
  const isDanger = modalConfig?.isDanger !== undefined ? Boolean(modalConfig.isDanger) : !isAlert;

  useEffect(() => {
    if (!modalConfig) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalConfig, onClose]);

  if (!modalConfig) return null;

  return (
    <div 
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs animate-fadeIn font-sans text-stone-800"
    >
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200/90 text-center space-y-4 relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Nút X đóng góc trên */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-2xl hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. Icon Căn Giữa Hiện Đại */}
        <div className="flex justify-center pt-1">
          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-inner ${
            isDanger ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}>
            {isDanger ? (
              <AlertTriangle className="w-8 h-8 stroke-[2.2]" />
            ) : (
              <Info className="w-8 h-8 stroke-[2.2]" />
            )}
          </div>
        </div>

        {/* 2. Tiêu đề & Nội dung căn giữa gọn gàng */}
        <div className="space-y-2 px-1">
          <h4 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
            {modalConfig.title || 'Xác nhận'}
          </h4>
          <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-normal whitespace-pre-line">
            {modalConfig.message}
          </p>
        </div>

        {/* 3. Nút bấm tỷ lệ 50/50 cân đối */}
        <div className="grid grid-cols-2 gap-3 pt-2.5">
          {!isAlert && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-2xs"
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
            className={`w-full py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold text-white transition-all active:scale-95 cursor-pointer shadow-xs flex items-center justify-center gap-2 ${
              isAlert ? 'col-span-2' : ''
            } ${
              isDanger 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                : 'bg-stone-900 hover:bg-amber-800'
            }`}
          >
            {isAlert && <Check className="w-4 h-4 stroke-[2.5]" />}
            <span>{modalConfig.confirmLabel || (isAlert ? 'Đã hiểu' : 'Xác nhận xóa')}</span>
          </button>
        </div>

      </div>
    </div>
  );
}