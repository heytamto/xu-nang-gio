import React, { useEffect, useState } from 'react';
import { CheckCircle2, PhoneCall, Sparkles, Copy, Check, Gift } from 'lucide-react';

export default function OrderSuccessModal({ isOpen, onClose, orderInfo }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !orderInfo) return null;

  const totalAmount = Number(orderInfo.total) || 0;
  const hotline = import.meta.env.VITE_HOTLINE || "0987.654.321";
  const orderCode = orderInfo.code || "XNG123456";

  const handleCopyCode = () => {
    navigator.clipboard.writeText(orderCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full text-center shadow-2xl border border-stone-100 relative overflow-hidden"
      >
        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-100 shadow-2xs">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <h3 className="text-lg font-black text-stone-900 mb-0.5">
          Đặt Hàng Thành Công!
        </h3>
        <p className="text-[11px] text-amber-700 font-semibold mb-3 inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-600" />
          <span>Vườn đã tiếp nhận đơn của bạn</span>
        </p>

        {/* Khối tóm tắt mã đơn */}
        <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3.5 text-left space-y-1.5 mb-3.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-stone-500 font-medium">Mã đơn hàng:</span>
            <span className="font-mono font-black text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-md">
              {orderCode}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-stone-500 font-medium">Tổng thanh toán:</span>
            <span className="font-bold text-stone-900 font-mono text-sm">
              {totalAmount.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>

        {/* THẺ DÙNG CHÍNH MÃ ĐƠN NÀY ĐỂ GIẢM GIÁ LẦN SAU */}
        <div className="bg-linear-to-br from-amber-500/10 via-amber-500/5 to-emerald-500/10 border border-amber-300/80 rounded-2xl p-3.5 text-left mb-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs mb-1">
            <Gift className="w-4 h-4 text-amber-600" />
            <span>Món Quà Cho Lần Ghé Sau</span>
          </div>
          <p className="text-[11px] text-stone-600 leading-relaxed mb-2.5">
            Lần sau quay lại vườn, nhập chính mã đơn <strong className="text-amber-800 font-mono">{orderCode}</strong> tại ô ưu đãi để được giảm ngay <strong className="text-amber-800">10%</strong> nhé!
          </p>

          <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-amber-300/70">
            <span className="font-mono font-black text-xs text-amber-800 tracking-wider">
              {orderCode}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700">Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Sao chép</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Nút tiếp tục */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-stone-900 hover:bg-amber-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-sm active:scale-[0.99]"
          >
            Tiếp tục xem vườn
          </button>

          <a
            href={`tel:${hotline}`}
            className="w-full py-1.5 text-stone-500 hover:text-stone-800 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <PhoneCall className="w-3 h-3 text-amber-600" />
            <span>Hotline hỗ trợ: {hotline}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
