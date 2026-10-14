import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function ConfirmModal({ modalConfig, onClose }) {
  if (!modalConfig) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 space-y-4 transform transition-all scale-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-stone-900">{modalConfig.title || 'Thông Báo'}</h4>
            <p className="text-xs text-stone-500">
              {modalConfig.isAlert ? 'Hệ thống thông báo' : 'Hành động này không thể hoàn tác'}
            </p>
          </div>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3.5 rounded-2xl border border-stone-100">
          {modalConfig.message}
        </p>

        <div className="flex items-center justify-end gap-2 pt-1">
          {!modalConfig.isAlert && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors"
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
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-all active:scale-95"
          >
            {modalConfig.confirmLabel || 'Đồng ý'}
          </button>
        </div>
      </div>
    </div>
  );
}