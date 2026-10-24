// src/components/checkout/VietQrBox.jsx
import React, { useState, useMemo } from 'react';
import { Copy, Check, QrCode, CheckCircle2, ShieldCheck } from 'lucide-react';
import { getBankByBin } from '../../constants/vietqrBanks';

export default function VietQrBox({
  paymentMethod = 'deposit',
  depositAmount = 50000,
  finalTotalAmount = 0,
  bankBin = '970422',
  bankName,
  accountNo = '0848957345',
  accountName = 'TO THANH TAM',
  orderCode = '',
  isPaymentVerified = false,
  verifiedAmount = 0
}) {
  const [copiedField, setCopiedField] = useState('');

  const parsedTotal = Number(finalTotalAmount) || 0;
  const parsedDeposit = Number(depositAmount) || 50000;

  // Tính số tiền cần thanh toán qua QR (nếu tổng đơn nhỏ hơn mức cọc thì lấy tổng đơn)
  const qrTransferAmount = useMemo(() => {
    if (paymentMethod === 'full_qr') return parsedTotal;
    return parsedTotal > 0 ? Math.min(parsedDeposit, parsedTotal) : parsedDeposit;
  }, [paymentMethod, parsedTotal, parsedDeposit]);

  // Nội dung chuyển khoản: Ưu tiên mã đơn hàng duy nhất đã sinh trước
  const rawTransferMemo = useMemo(() => {
    return (orderCode || '').trim().toUpperCase() || 'XNG ORDER';
  }, [orderCode]);

  // Chuẩn hóa số tài khoản ngân hàng
  const safeAccountNo = useMemo(() => {
    let acc = String(accountNo || '').trim();
    if (acc.length === 9 && !acc.startsWith('0')) {
      acc = `0${acc}`;
    }
    return acc;
  }, [accountNo]);

  const matchedBank = useMemo(() => getBankByBin(bankBin), [bankBin]);
  const currentBankName = bankName || matchedBank?.shortName || 'MBBank';

  // Memoize link ảnh VietQR để tránh re-render khi bấm nút Copy
  const qrImageUrl = useMemo(() => {
    const encodedMemo = encodeURIComponent(rawTransferMemo);
    const encodedAccName = encodeURIComponent((accountName || 'TO THANH TAM').trim());
    return `https://img.vietqr.io/image/${bankBin}-${safeAccountNo}-qr_only.png?amount=${qrTransferAmount}&addInfo=${encodedMemo}&accountName=${encodedAccName}`;
  }, [bankBin, safeAccountNo, qrTransferAmount, rawTransferMemo, accountName]);

  const handleCopy = async (text, fieldName) => {
    if (!text) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(''), 2000);
    } catch (err) {
      console.error('Sao chép thất bại:', err);
    }
  };

  return (
    <div className="p-5 sm:p-6 bg-white rounded-3xl border border-amber-200/90 shadow-2xs space-y-4 text-center font-sans animate-fadeIn text-stone-800">
      {/* Tiêu đề & Số tiền */}
      <div className="flex items-center justify-between px-1 flex-wrap gap-2">
        <span className="text-sm sm:text-base font-black text-amber-950 uppercase tracking-wide flex items-center gap-2">
          <QrCode className="w-5 h-5 text-amber-700" />
          <span>{paymentMethod === 'deposit' ? 'Quét VietQR Đặt Cọc' : 'Quét VietQR Thanh Toán'}</span>
        </span>
        <span className="text-sm sm:text-base font-black font-mono text-amber-950 bg-amber-100/90 px-3 py-1 rounded-xl border border-amber-300 shadow-2xs">
          {qrTransferAmount.toLocaleString('vi-VN')}đ
        </span>
      </div>

      {/* Trạng thái nổ tiền Realtime từ Supabase / Webhook */}
      {isPaymentVerified ? (
        <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-2.5 animate-fadeIn shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <strong className="block text-base sm:text-lg font-black text-emerald-900">
              ĐÃ XÁC NHẬN CHUYỂN KHOẢN!
            </strong>
            <p className="text-xs sm:text-sm text-emerald-800 mt-1 leading-relaxed font-normal">
              Tài khoản đã nhận{' '}
              <strong className="font-mono font-bold text-emerald-950">
                {(verifiedAmount || qrTransferAmount).toLocaleString('vi-VN')}đ
              </strong>
              . Đơn hàng sẵn sàng được hái và giao xe.
            </p>
          </div>
        </div>
      ) : (
        /* Khung ảnh QR khi chưa thanh toán */
        <div className="inline-flex p-3 sm:p-4 bg-white rounded-3xl border border-stone-200/90 shadow-inner relative group">
          <img
            src={qrImageUrl}
            alt="Mã VietQR Chuyển Khoản"
            loading="lazy"
            className="w-52 h-52 sm:w-60 sm:h-60 object-contain mx-auto rounded-2xl"
          />
        </div>
      )}

      {/* Thông tin tài khoản kèm nút sao chép */}
      <div className="bg-stone-50/90 p-4 rounded-2xl border border-stone-200/80 space-y-2.5 text-xs sm:text-sm text-left">
        <div className="flex items-center justify-between">
          <span className="text-stone-500 font-medium">Ngân hàng:</span>
          <strong className="text-stone-800 font-bold">{currentBankName}</strong>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-stone-500 font-medium">Chủ tài khoản:</span>
          <strong className="text-stone-900 font-mono font-bold uppercase">{accountName}</strong>
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <span className="text-stone-500 font-medium">Số tài khoản:</span>
          <button
            type="button"
            onClick={() => handleCopy(safeAccountNo, 'stk')}
            className="flex items-center gap-1.5 font-mono font-black text-xs sm:text-sm text-stone-900 hover:text-amber-800 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs cursor-pointer active:scale-95 transition-all"
            title="Bấm để sao chép"
          >
            <span>{safeAccountNo}</span>
            {copiedField === 'stk' ? (
              <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
            ) : (
              <Copy className="w-4 h-4 text-stone-400" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-stone-200/70">
          <span className="text-stone-500 font-medium">Nội dung CK:</span>
          <button
            type="button"
            onClick={() => handleCopy(rawTransferMemo, 'memo')}
            className="flex items-center gap-1.5 font-mono font-black text-xs sm:text-sm text-amber-950 hover:text-amber-800 bg-amber-100/90 px-3 py-1.5 rounded-xl border border-amber-300 shadow-2xs cursor-pointer active:scale-95 transition-all"
            title="Bấm để sao chép"
          >
            <span>{rawTransferMemo}</span>
            {copiedField === 'memo' ? (
              <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
            ) : (
              <Copy className="w-4 h-4 text-amber-700" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}