// src/components/checkout/VietQrBox.jsx
import React, { useState, useMemo } from 'react';
import { Copy, Check, QrCode } from 'lucide-react';
import { getBankByBin } from '../../constants/vietqrBanks';

export default function VietQrBox({
  paymentMethod = 'deposit',
  depositAmount = 50000,
  finalTotalAmount = 0,
  bankBin = '970422',
  bankName,
  accountNo = '0848957345',
  accountName = 'TO THANH TAM',
  cleanPhone = '',
  orderCode = ''
}) {
  const [copiedField, setCopiedField] = useState("");

  const parsedTotal = Number(finalTotalAmount) || 0;
  const parsedDeposit = Number(depositAmount) || 50000;
  const qrTransferAmount = paymentMethod === "full_qr" ? parsedTotal : parsedDeposit;

  const rawTransferMemo = useMemo(() => {
    if (orderCode && orderCode.trim()) {
      return orderCode.trim().toUpperCase();
    }
    const cleanDigits = String(cleanPhone || '').replace(/\D/g, '');
    return cleanDigits.length >= 6 ? `XNG ${cleanDigits.slice(-6)}` : "XNG DATNHO";
  }, [orderCode, cleanPhone]);

  const transferMemo = encodeURIComponent(rawTransferMemo);
  
  let safeAccountNo = String(accountNo || '').trim();
  if (safeAccountNo.length === 9 && !safeAccountNo.startsWith('0')) {
    safeAccountNo = `0${safeAccountNo}`;
  }

  const matchedBank = useMemo(() => getBankByBin(bankBin), [bankBin]);
  const currentBankName = bankName || matchedBank?.shortName || 'MBBank';

  // Template 'qr_only': hiển thị khung mã QR thuần vuông vắn, không chữ thừa
  const qrImageUrl = `https://img.vietqr.io/image/${bankBin}-${safeAccountNo}-qr_only.png?amount=${qrTransferAmount}&addInfo=${transferMemo}&accountName=${encodeURIComponent(accountName)}`;

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(""), 2000);
  };

  return (
    <div className="p-4 bg-white rounded-3xl border border-amber-200/90 shadow-2xs space-y-3.5 text-center font-sans">
      {/* Tiêu đề & Số tiền */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
          <QrCode className="w-4 h-4 text-amber-700" />
          <span>{paymentMethod === "deposit" ? "Quét VietQR Đặt Cọc" : "Quét VietQR Thanh Toán"}</span>
        </span>
        <span className="text-xs font-black font-mono text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
          {qrTransferAmount.toLocaleString("vi-VN")}đ
        </span>
      </div>

      {/* KHUNG MÃ QR THUẦN TÚY */}
      <div className="inline-flex p-3 bg-white rounded-2xl border border-stone-200 shadow-inner">
        <img
          src={qrImageUrl}
          alt="Mã VietQR"
          className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto rounded-xl"
        />
      </div>

      {/* BẢNG THÔNG TIN TÀI KHOẢN KÈM NÚT SAO CHÉP */}
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
            onClick={() => handleCopy(safeAccountNo, "stk")}
            className="flex items-center gap-1 font-mono font-bold text-stone-900 hover:text-amber-700 bg-white px-2 py-0.5 rounded-md border border-stone-200 shadow-2xs cursor-pointer active:scale-95 transition-all"
            title="Bấm để sao chép"
          >
            <span>{safeAccountNo}</span>
            {copiedField === "stk" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
          </button>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-stone-200/60">
          <span className="text-stone-500 font-medium">Nội dung CK:</span>
          <button
            type="button"
            onClick={() => handleCopy(rawTransferMemo, "memo")}
            className="flex items-center gap-1 font-mono font-bold text-amber-900 hover:text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300 shadow-2xs cursor-pointer active:scale-95 transition-all"
            title="Bấm để sao chép"
          >
            <span>{rawTransferMemo}</span>
            {copiedField === "memo" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-amber-600" />}
          </button>
        </div>
      </div>
    </div>
  );
}