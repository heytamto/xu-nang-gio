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
    <div className="p-4 bg-white rounded-3xl border border-amber-200/90 shadow-2xs space-y-3.5 text-center font-sans animate-fadeIn">
      {/* Tiêu đề & Số tiền */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
          <QrCode className="w-4 h-4 text-amber-700" />
          <span>{paymentMethod === 'deposit' ? 'Quét VietQR Đặt Cọc' : 'Quét VietQR Thanh Toán'}</span>
        </span>
        <span className="text-xs font-black font-mono text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
          {qrTransferAmount.toLocaleString('vi-VN')}đ
        </span>
      </div>

      {/* Trạng thái nổ tiền Realtime từ Supabase / Webhook */}
      {isPaymentVerified ? (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-2 animate-fadeIn">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <strong className="block text-sm font-black text-emerald-900">
              ĐÃ XÁC NHẬN CHUYỂN KHOẢN!
            </strong>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Tài khoản đã nhận{' '}
              <strong className="font-mono text-emerald-900">
                {(verifiedAmount || qrTransferAmount).toLocaleString('vi-VN')}đ
              </strong>
              . Đơn hàng sẵn sàng được hái và giao xe.
            </p>
          </div>
        </div>
      ) : (
        /* Khung ảnh QR khi chưa thanh toán */
        <div className="inline-flex p-3 bg-white rounded-2xl border border-stone-200 shadow-inner relative group">
          <img
            src={qrImageUrl}
            alt="Mã VietQR Chuyển Khoản"
            loading="lazy"
            className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto rounded-xl"
          />
        </div>
      )}

      {/* Thông tin tài khoản kèm nút sao chép */}
      <div className="bg-stone-50/90 p-3 rounded-2xl border border-stone-200/80 space-y-2 text-xs text-left">
        <div className="flex items-center justify-between">
          <span className="text-stone-500 font-medium">Ngân hàng:</span>
          <strong className="text-stone-800 font-semibold">{currentBankName}</strong>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-stone-500 font-medium">Chủ tài khoản:</span>
          <strong className="text-stone-900 font-mono font-bold uppercase">{accountName}</strong>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-stone-500 font-medium">Số tài khoản:</span>
          <button
            type="button"
            onClick={() => handleCopy(safeAccountNo, 'stk')}
            className="flex items-center gap-1 font-mono font-bold text-stone-900 hover:text-amber-700 bg-white px-2 py-0.5 rounded-md border border-stone-200 shadow-2xs cursor-pointer active:scale-95 transition-all"
            title="Bấm để sao chép"
          >
            <span>{safeAccountNo}</span>
            {copiedField === 'stk' ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-stone-400" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-stone-200/60">
          <span className="text-stone-500 font-medium">Nội dung CK:</span>
          <button
            type="button"
            onClick={() => handleCopy(rawTransferMemo, 'memo')}
            className="flex items-center gap-1 font-mono font-bold text-amber-900 hover:text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300 shadow-2xs cursor-pointer active:scale-95 transition-all"
            title="Bấm để sao chép"
          >
            <span>{rawTransferMemo}</span>
            {copiedField === 'memo' ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-amber-600" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}