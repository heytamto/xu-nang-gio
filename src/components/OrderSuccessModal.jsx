import React, { useState, useEffect } from 'react';
import { Check, Copy, Printer, CheckCircle2, Phone, Gift, Sparkles } from 'lucide-react';

export default function OrderSuccessModal({ isOpen, orderInfo, onClose }) {
  // stage: 'printing' (đang in) -> 'completed' (ẩn máy in, bung hóa đơn thành công)
  const [stage, setStage] = useState('printing');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStage('printing');
      // Cho máy in chạy từ từ trong 2 giây rồi xé giấy và ẩn máy in
      const timer = setTimeout(() => {
        setStage('completed');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen || !orderInfo) return null;

  const orderCode = orderInfo.code || 'XNG329826';
  const totalDisplay = typeof orderInfo.total === 'number' 
    ? `${orderInfo.total.toLocaleString('vi-VN')}đ` 
    : (orderInfo.total || '0đ');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(orderCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn overflow-hidden">
      
      <div className="flex flex-col items-center max-w-sm w-full relative">
        
        {/* ================= PHẦN 1: ĐẦU MÁY IN NHIỆT (ẨN ĐI KHI IN XONG) ================= */}
        <div 
          className={`w-72 bg-stone-900 border-2 border-stone-700 rounded-t-2xl p-2.5 shadow-2xl relative z-20 flex items-center justify-between transition-all duration-700 ease-in-out ${
            stage === 'completed' 
              ? '-translate-y-16 opacity-0 pointer-events-none' 
              : 'translate-y-0 opacity-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
              <Printer className="w-3 h-3" />
              <span>Máy In Vườn Xứ Nắng</span>
            </span>
          </div>
          <span className="text-[9px] font-mono text-stone-400 animate-pulse">PRINTING...</span>
        </div>

        {/* ================= PHẦN 2: TỜ GIẤY HÓA ĐƠN VỪA IN RA ================= */}
        <div 
          className={`w-full bg-[#fffef9] text-stone-900 rounded-3xl shadow-2xl p-6 sm:p-7 border border-stone-200/90 relative z-10 transition-all duration-700 ease-out font-sans ${
            stage === 'printing' 
              ? 'animate-receiptFeed max-h-[360px] overflow-hidden -mt-1' 
              : 'translate-y-0 scale-100 shadow-[0_20px_50px_rgba(0,0,0,0.3)]'
          }`}
        >
          {/* Răng cưa máy in (chỉ hiện lúc đang ở khe in) */}
          {stage === 'printing' && (
            <div className="absolute -top-1.5 left-0 right-0 h-2 bg-[radial-gradient(circle,transparent_3px,#fffef9_4px)] bg-[length:8px_8px] repeat-x"></div>
          )}

          {/* Dấu tích xanh tròn */}
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-400 flex items-center justify-center text-emerald-600 shadow-sm animate-bounce">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>
          </div>

          {/* Tiêu đề thông báo */}
          <div className="text-center space-y-1 mb-5">
            <h3 className="text-xl font-black text-stone-900 tracking-tight">Đặt Hàng Thành Công!</h3>
            <p className="text-xs text-amber-800 font-semibold flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Vườn đã tiếp nhận đơn của bạn</span>
            </p>
          </div>

          {/* Box tóm tắt mã đơn & tổng tiền */}
          <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/80 space-y-2 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500 font-medium">Mã đơn hàng:</span>
              <span className="font-mono font-bold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-md">
                {orderCode}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-200/50">
              <span className="text-stone-500 font-medium">Tổng thanh toán:</span>
              <span className="font-mono font-black text-sm text-stone-900">
                {totalDisplay}
              </span>
            </div>
          </div>

          {/* Box Ưu đãi lần ghé sau (Code XNG...) */}
          <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200/90 space-y-2.5 mb-5 text-left">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
              <Gift className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Món Quà Cho Lần Ghé Sau</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Lần sau quay lại vườn, nhập chính mã đơn <strong className="text-amber-900 font-mono font-bold">{orderCode}</strong> tại ô ưu đãi để được giảm ngay <strong className="text-amber-800 font-bold">10%</strong> nhé!
            </p>

            {/* Ô sao chép mã */}
            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-amber-200 shadow-2xs">
              <span className="font-mono font-bold text-amber-950 text-xs tracking-wider">{orderCode}</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-950 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Nút bấm quay về */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all active:scale-[0.98] shadow-md cursor-pointer"
          >
            Tiếp Tục Xem Vườn
          </button>

          {/* Hotline hỗ trợ */}
          <div className="mt-3 text-center">
            <a 
              href="tel:0848957345" 
              className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-amber-800 transition-colors font-medium"
            >
              <Phone className="w-3 h-3 text-amber-600" />
              <span>Hotline hỗ trợ: <strong>0848.957.345</strong></span>
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}