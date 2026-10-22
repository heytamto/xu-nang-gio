// src/components/checkout/CheckoutReceiptModal.jsx
import React from 'react';
import { Printer, CheckCircle2, Gift } from 'lucide-react';

export default function CheckoutReceiptModal({
  customer = {},
  paymentMethod = 'deposit',
  cart = [],
  discountAmount = 0,
  finalTotalAmount = 0,
  printStage = 1,
  hotline = '0848.957.345',
  giftTitle = '',
  campaignGifts = '',
}) {
  const getPaymentLabel = (method) => {
    const raw = String(method || '').toLowerCase();
    if (raw.includes('cọc') || raw === 'deposit') return 'Cọc giữ hàng (VietQR)';
    if (raw.includes('100%') || raw === 'full_qr') return 'Chuyển khoản 100% (VietQR)';
    return 'Thanh toán khi nhận hàng (COD)';
  };

  const hasGift = Boolean(giftTitle && giftTitle !== 'Không áp dụng (COD)') || Boolean(campaignGifts);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4 animate-fadeIn font-mono">
      {/* Đầu máy in nhiệt */}
      <div className="w-80 sm:w-96 bg-stone-800 rounded-t-2xl p-3 border-t-2 border-x-2 border-stone-700 shadow-2xl relative z-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5" />
            <span>Máy In Vườn Xứ Nắng</span>
          </span>
        </div>
        <span className="text-[10px] text-stone-400">FEEDING...</span>
      </div>

      <div className="w-80 sm:w-96 h-2 bg-stone-900 border-x-2 border-stone-700 relative z-20 shadow-inner flex items-center justify-center">
        <div className="w-3/4 h-0.5 bg-black rounded-full"></div>
      </div>

      {/* Thân giấy hóa đơn */}
      <div className="w-72 sm:w-88 bg-[#fffef9] text-stone-900 shadow-2xl p-5 border-x border-b border-stone-300 relative z-10 text-xs space-y-3.5 transition-all duration-500 ease-out animate-receiptSlideDown">
        <div className="text-center border-b border-dashed border-stone-400 pb-2.5 space-y-0.5">
          <h3 className="font-black text-sm uppercase tracking-wider text-amber-950 font-sans">XỨ NẮNG GIÓ</h3>
          <p className="text-[10px] text-stone-500">Đặc sản hái giàn chuẩn đất Ninh Thuận</p>
          <p className="text-[9.5px] text-stone-400">Hotline: {hotline}</p>
        </div>

        {/* Thông tin khách hàng */}
        <div className="space-y-1 text-[11px] text-stone-700 border-b border-dashed border-stone-400 pb-2.5">
          <div className="flex justify-between">
            <span className="text-stone-500">Khách hàng:</span>
            <strong className="text-stone-900 truncate max-w-[160px] text-right">
              {customer?.name || 'Khách ghé vườn'}
            </strong>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Số ĐT:</span>
            <strong className="text-stone-900 font-mono">
              {customer?.phone || 'Chưa cung cấp'}
            </strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-stone-500">Hình thức:</span>
            <span className="font-semibold text-stone-800 text-[10.5px]">
              {getPaymentLabel(paymentMethod)}
            </span>
          </div>
        </div>

        {/* Danh sách món (Stage 2) */}
        <div className={`space-y-1.5 transition-opacity duration-300 ${printStage >= 2 ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex justify-between font-bold text-[10.5px] text-stone-500 border-b border-stone-200 pb-1">
            <span>TÊN MÓN</span>
            <span>T.TIỀN</span>
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
            {cart.map((item, idx) => (
              <div key={item.id || item.cartItemId || idx} className="flex justify-between text-[11px] leading-tight">
                <span className="truncate pr-2">
                  {item.name} <span className="text-stone-500">x{item.quantity || 1}</span>
                </span>
                <span className="font-bold shrink-0 font-mono">
                  {((Number(item.price) || 0) * (Number(item.quantity) || 1)).toLocaleString('vi-VN')}đ
                </span>
              </div>
            ))}
          </div>

          {/* Dòng quà tặng nhỏ trên giấy in */}
          {hasGift && (
            <div className="pt-1.5 border-t border-dotted border-stone-200 text-[10.5px] text-amber-900 flex items-start gap-1">
              <Gift className="w-3 h-3 text-amber-700 shrink-0 mt-0.5" />
              <span className="truncate">
                🎁 {giftTitle ? `Quà CK: ${giftTitle}` : ''} {campaignGifts ? `| ${campaignGifts}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Tổng tiền & Xác nhận (Stage 3) */}
        <div className={`border-t border-dashed border-stone-400 pt-2 space-y-1.5 transition-opacity duration-300 ${printStage >= 3 ? 'opacity-100' : 'opacity-0'}`}>
          {Number(discountAmount) > 0 && (
            <div className="flex justify-between text-[11px] text-emerald-700 font-mono">
              <span>Giảm ưu đãi:</span>
              <span>-{Number(discountAmount).toLocaleString('vi-VN')}đ</span>
            </div>
          )}
          <div className="flex justify-between text-xs font-black text-stone-900 pt-0.5">
            <span>TỔNG CỘNG:</span>
            <span className="text-sm text-amber-900 font-mono font-black">
              {Number(finalTotalAmount).toLocaleString('vi-VN')}đ
            </span>
          </div>

          <div className="pt-2 flex items-center justify-center gap-1.5 text-emerald-700 font-bold text-xs uppercase tracking-wide">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-bounce" />
            <span>Đã ghi nhận đơn vào hệ thống</span>
          </div>
        </div>

        {/* Răng cưa đáy giấy in */}
        <div className="absolute -bottom-2 left-0 right-0 h-2 bg-[radial-gradient(circle,transparent_3px,#fffef9_4px)] bg-[length:8px_8px] repeat-x"></div>
      </div>

      <p className="mt-4 text-xs text-stone-400 flex items-center gap-2 font-sans">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
        <span>Đang xé hóa đơn gửi bếp & đóng thùng xốp...</span>
      </p>
    </div>
  );
}