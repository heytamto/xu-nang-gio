// src/components/checkout/OrderSuccessModal.jsx
import React, { useState, useEffect } from 'react';
import { Check, Copy, Printer, Phone, Sparkles } from 'lucide-react';

// Răng cưa siêu nhuyễn 1.8px sắc nét, dùng chung cho cả 2 đầu
function MicroSawtoothEdge({ position = 'bottom' }) {
  return (
    <div 
      className={`w-full h-[3px] overflow-hidden pointer-events-none block ${
        position === 'top' ? '-mb-[1px] rotate-180' : '-mt-[1px]'
      }`}
    >
      <svg viewBox="0 0 100 1.8" preserveAspectRatio="none" className="w-full h-full fill-[#fffefb] block">
        <polygon points="
          0,0 0.8,1.8 1.6,0 2.4,1.8 3.2,0 4.0,1.8 4.8,0 5.6,1.8 6.4,0 7.2,1.8 8.0,0 8.8,1.8 9.6,0 10.4,1.8 11.2,0 12.0,1.8 12.8,0 13.6,1.8 14.4,0 15.2,1.8 16.0,0
          16.8,1.8 17.6,0 18.4,1.8 19.2,0 20.0,1.8 20.8,0 21.6,1.8 22.4,0 23.2,1.8 24.0,0 24.8,1.8 25.6,0 26.4,1.8 27.2,0 28.0,1.8 28.8,0 29.6,1.8 30.4,0 31.2,1.8 32.0,0
          32.8,1.8 33.6,0 34.4,1.8 35.2,0 36.0,1.8 36.8,0 37.6,1.8 38.4,0 39.2,1.8 40.0,0 40.8,1.8 41.6,0 42.4,1.8 43.2,0 44.0,1.8 44.8,0 45.6,1.8 46.4,0 47.2,1.8 48.0,0
          48.8,1.8 49.6,0 50.4,1.8 51.2,0 52.0,1.8 52.8,0 53.6,1.8 54.4,0 55.2,1.8 56.0,0 56.8,1.8 57.6,0 58.4,1.8 59.2,0 60.0,1.8 60.8,0 61.6,1.8 62.4,0 63.2,1.8 64.0,0
          64.8,1.8 65.6,0 66.4,1.8 67.2,0 68.0,1.8 68.8,0 69.6,1.8 70.4,0 71.2,1.8 72.0,0 72.8,1.8 73.6,0 74.4,1.8 75.2,0 76.0,1.8 76.8,0 77.6,1.8 78.4,0 79.2,1.8 80.0,0
          80.8,1.8 81.6,0 82.4,1.8 83.2,0 84.0,1.8 84.8,0 85.6,1.8 86.4,0 87.2,1.8 88.0,0 88.8,1.8 89.6,0 90.4,1.8 91.2,0 92.0,1.8 92.8,0 93.6,1.8 94.4,0 95.2,1.8 96.0,0
          96.8,1.8 97.6,0 98.4,1.8 99.2,0 100,0
        " />
      </svg>
    </div>
  );
}

export default function OrderSuccessModal({ 
  isOpen, 
  orderInfo, 
  cart = [], 
  customer = {}, 
  shopConfig = {}, 
  onClose 
}) {
  // Giai đoạn:
  // 1: 'waiting'  (0.0s - 0.6s) : Máy in hiện bên dưới, đèn LED nhấp nháy
  // 2: 'shaking'  (0.6s - 1.0s) : Rung nhẹ trục in
  // 3: 'feeding'  (1.0s - 3.7s) : Nhịp 1 đùn Xứ Nắng Gió -> delay nhẹ -> Nhịp 2 trượt đều phần còn lại
  // 4: 'tearing'  (3.7s - 4.2s) : Dao xé giật nghiêng rẹt một cái
  // 5: 'torn'     (sau 4.2s)    : Máy in trượt mất, hóa đơn đứng yên
  const [printStep, setPrintStep] = useState('waiting');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPrintStep('waiting');

      const t1 = setTimeout(() => setPrintStep('shaking'), 600);
      const t2 = setTimeout(() => setPrintStep('feeding'), 1000);
      const t3 = setTimeout(() => setPrintStep('tearing'), 3700); // Kích hoạt cú xé
      const t4 = setTimeout(() => setPrintStep('torn'), 4200);    // Hoàn tất

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [isOpen]);

  if (!isOpen || !orderInfo) return null;

  const orderCode = orderInfo.code || orderInfo.orderCode || orderInfo.orderId || 'XNG-ORDER';
  
  const customerName = orderInfo.customer_name 
    || orderInfo.name 
    || orderInfo.customer?.name 
    || customer?.name 
    || 'Quý khách';

  const customerPhone = orderInfo.phone 
    || orderInfo.customer?.phone 
    || customer?.phone 
    || 'Chưa cung cấp';

  const hotline = shopConfig?.hotline || '0848957345';

  const items = (Array.isArray(orderInfo.cart) && orderInfo.cart.length > 0)
    ? orderInfo.cart
    : ((Array.isArray(cart) && cart.length > 0) ? cart : (orderInfo.order_items || []));

  const rawTotal = orderInfo.final_total ?? orderInfo.finalTotal ?? orderInfo.total ?? 0;
  const finalTotalNum = Number(rawTotal);
  const discountNum = Number(orderInfo.discount ?? orderInfo.discountAmount ?? 0);

  const getPaymentLabel = (method) => {
    const raw = String(method || orderInfo.payment_method || orderInfo.paymentMethod || '').toLowerCase();
    if (raw.includes('cọc') || raw === 'deposit') return 'Cọc giữ hàng (VietQR)';
    if (raw.includes('100%') || raw === 'full_qr') return 'Chuyển khoản 100% (VietQR)';
    return 'Thanh toán khi nhận hàng (COD)';
  };

  const handleCopyCode = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(orderCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-950/85 backdrop-blur-md p-4 font-mono select-none overflow-y-auto">
      <style>{`
        /* Motor máy in bên dưới rung giật */
        @keyframes bottomPrinterVibrate {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(1.5px); }
          50% { transform: translateY(-1.5px); }
          75% { transform: translateY(1px); }
        }

        /* ĐÙN 2 NHỊP:
           - Nhịp 1 (0% -> 22%): Đùn tiêu đề XỨ NẮNG GIÓ nhô khỏi khe máy in
           - Khựng delay (22% -> 38%): Tạm dừng nguyên vị trí
           - Nhịp 2 (38% -> 100%): Trượt tịnh tiến mượt mà toàn bộ phần còn lại ra ngoài
        */
        @keyframes printFeedTwoPhasesUp {
          0% {
            transform: translateY(98%);
            opacity: 0.7;
          }
          /* Đùn XỨ NẮNG GIÓ nhô ra */
          22% {
            transform: translateY(78%);
          }
          /* Delay khựng lại chút */
          38% {
            transform: translateY(78%);
          }
          /* Trượt đều tịnh tiến phần còn lại lên hết */
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* Động tác xé giấy giật dứt khoát */
        @keyframes paperTearActionUp {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-10px) rotate(2.4deg) scale(1.01);
          }
          55% {
            transform: translateY(-4px) rotate(-1deg);
          }
          100% {
            transform: translateY(0) rotate(0deg);
          }
        }

        .animate-bottom-shake {
          animation: bottomPrinterVibrate 0.15s ease-in-out infinite;
        }

        .animate-feed-two-phases {
          animation: printFeedTwoPhasesUp 2.6s cubic-bezier(0.2, 0.85, 0.3, 1) forwards;
        }

        .animate-tear-snap-up {
          animation: paperTearActionUp 0.5s cubic-bezier(0.18, 0.9, 0.3, 1) forwards;
        }
      `}</style>

      <div className="w-[340px] sm:w-[380px] flex flex-col items-center relative my-auto">

        {/* ================= 1. TỜ GIẤY HÓA ĐƠN ================= */}
        <div className={`w-full overflow-hidden transition-all duration-700 ${printStep === 'torn' || printStep === 'tearing' ? 'overflow-visible' : ''}`}>
          <div 
            className={`w-full flex flex-col ${
              printStep === 'waiting' || printStep === 'shaking'
                ? 'translate-y-[98%] opacity-0'
                : printStep === 'feeding'
                  ? 'animate-feed-two-phases origin-bottom'
                  : printStep === 'tearing'
                    ? 'animate-tear-snap-up origin-bottom-left'
                    : 'translate-y-0 shadow-[0_25px_60px_rgba(0,0,0,0.6)]'
            }`}
          >
            {/* 1. MÉP RĂNG CƯA TRÊN CÙNG (Cùng Xứ Nắng Gió nhô ra ở nhịp 1) */}
            <MicroSawtoothEdge position="top" />

            {/* THÂN GIẤY (Trắng ngà sáng, vuông vức nối liền răng cưa) */}
            <div className="w-full bg-[#fffefb] text-stone-900 px-6 pt-5 pb-5 border-x border-stone-200/90 shadow-2xl space-y-3.5 text-xs">
              
              {/* Header: NHỊP 1 ĐÙN RA ĐẦU TIÊN -> DELAY */}
              <div className="text-center border-b border-dashed border-stone-300 pb-2.5 space-y-0.5">
                <h3 className="font-black text-base uppercase tracking-wider text-amber-950 font-sans">
                  XỨ NẮNG GIÓ
                </h3>
                <p className="text-[10px] text-stone-500 font-sans">Đặc sản hái giàn chuẩn đất Ninh Thuận</p>
                <p className="text-[9.5px] text-stone-400">Hotline: {hotline}</p>
              </div>

              {/* Thông tin đơn hàng & Khách hàng */}
              <div className="space-y-1.5 text-[11px] text-stone-700 border-b border-dashed border-stone-300 pb-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Mã đơn hàng:</span>
                  <span className="font-mono font-bold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded text-xs">
                    {orderCode}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Khách hàng:</span>
                  <strong className="text-stone-900 font-sans text-right truncate max-w-[180px]">
                    {customerName}
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Số ĐT:</span>
                  <strong className="text-stone-900 font-mono">
                    {customerPhone}
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Hình thức:</span>
                  <span className="font-semibold text-stone-800 text-[10.5px] font-sans">
                    {getPaymentLabel(orderInfo.payment_method || orderInfo.paymentMethod)}
                  </span>
                </div>
              </div>

              {/* Danh sách món */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-[10px] text-stone-400 border-b border-stone-200 pb-1">
                  <span>TÊN MÓN</span>
                  <span>T.TIỀN</span>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {items.length > 0 ? (
                    items.map((item, idx) => {
                      const price = Number(item.price || item.base_price || 0);
                      const qty = Number(item.quantity || 1);
                      return (
                        <div key={item.id || idx} className="flex justify-between text-[11px] leading-snug">
                          <span className="truncate pr-2 font-sans">
                            {item.name} <span className="text-stone-500 font-mono">x{qty}</span>
                          </span>
                          <span className="font-bold shrink-0 font-mono">
                            {(price * qty).toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-[11px] text-stone-500 italic py-1 font-sans">
                      Đặc sản Ninh Thuận hái tươi đóng thùng
                    </div>
                  )}
                </div>
              </div>

              {/* Tổng tiền */}
              <div className="border-t border-dashed border-stone-300 pt-2 space-y-1.5">
                {discountNum > 0 && (
                  <div className="flex justify-between text-[11px] text-emerald-700 font-mono">
                    <span>Giảm ưu đãi:</span>
                    <span>-{discountNum.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}

                <div className="flex justify-between text-xs font-black text-stone-900 pt-0.5">
                  <span>TỔNG CỘNG:</span>
                  <span className="text-base text-amber-900 font-mono font-black">
                    {finalTotalNum.toLocaleString('vi-VN')}đ
                  </span>
                </div>

                {/* Khối voucher tri ân lần sau */}
                <div className="bg-amber-50/80 rounded-2xl p-3 border border-amber-200/80 space-y-1.5 text-left font-sans mt-2">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Món Quà Cho Lần Ghé Sau</span>
                  </div>
                  <p className="text-[10.5px] text-stone-600 leading-relaxed">
                    Lần sau ghé vườn, nhập mã <strong className="text-amber-900 font-mono">{orderCode}</strong> tại ô voucher để được giảm ngay <strong className="text-amber-800 font-bold">10%</strong>!
                  </p>

                  <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-amber-200 shadow-2xs">
                    <span className="font-mono font-bold text-amber-950 text-xs tracking-wider">{orderCode}</span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-950 cursor-pointer"
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

                {/* Nút hành động */}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full mt-2 py-3 bg-stone-900 hover:bg-stone-800 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all active:scale-[0.98] shadow-md cursor-pointer font-sans"
                >
                  Tiếp Tục Xem Vườn
                </button>

                <div className="text-center pt-0.5 font-sans">
                  <a 
                    href={`tel:${hotline.replace(/[^0-9]/g, '')}`} 
                    className="inline-flex items-center gap-1 text-[10px] text-stone-500 hover:text-amber-800 font-medium"
                  >
                    <Phone className="w-3 h-3 text-amber-600" />
                    <span>Hotline nhà vườn: <strong>{hotline}</strong></span>
                  </a>
                </div>
              </div>
            </div>

            {/* 2. MÉP RĂNG CƯA DƯỚI CÙNG (Nơi lưỡi dao máy in cắt) */}
            <MicroSawtoothEdge position="bottom" />

          </div>
        </div>

        {/* Khe thoát giấy máy in */}
        <div 
          className={`w-full h-2 bg-black border-x-2 border-stone-700 relative z-30 transition-all duration-700 shadow-inner flex items-center justify-center ${
            printStep === 'torn' || printStep === 'tearing' ? 'translate-y-14 opacity-0' : 'opacity-100'
          }`}
        >
          <div className="w-11/12 h-0.5 bg-stone-500 rounded-full opacity-60"></div>
        </div>

        {/* ================= 2. ĐẦU MÁY IN NHIỆT (DƯỚI ĐÁY) ================= */}
        <div 
          className={`w-full bg-gradient-to-t from-stone-900 to-stone-800 border-2 border-stone-600 rounded-b-3xl p-3.5 shadow-2xl relative z-30 transition-all duration-700 ease-out ${
            printStep === 'torn' || printStep === 'tearing'
              ? 'translate-y-14 opacity-0 pointer-events-none scale-95'
              : 'translate-y-0 opacity-100'
          } ${printStep === 'shaking' ? 'animate-bottom-shake' : ''}`}
        >
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shadow-inner">
                <Printer className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <span className="font-sans text-[11px] font-black text-amber-300 uppercase tracking-widest block leading-tight">
                  Xứ Nắng POS
                </span>
                <span className="text-[9px] text-stone-400 font-mono tracking-wider">
                  MODEL: XNG-MINI
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${printStep === 'waiting' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'}`}></span>
              <span className="text-[9px] text-stone-300 font-mono font-bold tracking-wider animate-pulse">
                {printStep === 'waiting' && 'NHẬN ĐƠN...'}
                {printStep === 'shaking' && 'CUỐN GIẤY...'}
                {printStep === 'feeding' && 'FEEDING...'}
                {printStep === 'tearing' && 'XÉ GIẤY...'}
                {printStep === 'torn' && 'COMPLETED'}
              </span>
            </div>
          </div>

          <div className="w-16 h-1 bg-white/20 rounded-full mx-auto mt-2"></div>
        </div>

      </div>
    </div>
  );
}