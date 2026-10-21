// src/components/checkout/VietQrBox.jsx
import React, { useState, useMemo } from 'react';
import { Download, Copy, Check, ExternalLink } from 'lucide-react';
import { getBankByBin } from '../../constants/vietqrBanks';

export default function VietQrBox({
  paymentMethod,
  depositAmount = 50000,
  finalTotalAmount,
  bankBin = '970422',
  bankName,
  accountNo = '0848957345',
  accountName = 'TO THANH TAM',
  cleanPhone
}) {
  const [copiedField, setCopiedField] = useState("");

  const qrTransferAmount = paymentMethod === "full_qr" ? finalTotalAmount : depositAmount;
  const rawTransferMemo = `XNG ${cleanPhone ? cleanPhone.slice(-6) : "DATNHO"}`;
  const transferMemo = encodeURIComponent(rawTransferMemo);
  
  // Chuẩn hóa số tài khoản dạng String và bù số 0 nếu vô tình bị rụng
  let safeAccountNo = String(accountNo || '').trim();
  if (safeAccountNo.length === 9 && !safeAccountNo.startsWith('0')) {
    safeAccountNo = `0${safeAccountNo}`;
  }

  // Khớp tên ngân hàng hiển thị
  const matchedBank = useMemo(() => getBankByBin(bankBin), [bankBin]);
  const currentBankName = bankName || matchedBank?.shortName || 'MBBank';

  // 1. Link ảnh mã QR VietQR (quét bằng mọi app ngân hàng)
  const qrImageUrl = `https://img.vietqr.io/image/${bankBin}-${safeAccountNo}-compact.png?amount=${qrTransferAmount}&addInfo=${transferMemo}&accountName=${encodeURIComponent(accountName)}`;

  // 2. Link thanh toán mở đa ngân hàng (khách dùng app nào cũng chọn được)
  const payUniversalUrl = `https://vietqr.me/@${safeAccountNo}?bank=${bankBin}&amount=${qrTransferAmount}&memo=${transferMemo}`;

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const handleDownloadQR = async () => {
    if (!qrImageUrl) return;
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `VietQR-${safeAccountNo}-${rawTransferMemo}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(qrImageUrl, "_blank");
    }
  };

  return (
    <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-2xs space-y-3 animate-fadeIn text-center font-sans">
      <div>
        <span className="text-xs font-black text-amber-900 block">
          {paymentMethod === "deposit" 
            ? `Quét VietQR Cọc ${depositAmount.toLocaleString("vi-VN")}đ` 
            : "Quét VietQR Chuyển Khoản 100%"}
        </span>
        <span className="text-[10px] text-stone-400 block mt-0.5">
          Tự động khớp số tài khoản, số tiền & nội dung
        </span>
      </div>

      <div className="relative inline-block mx-auto py-0.5">
        <img
          src={qrImageUrl}
          alt="VietQR Chuyển khoản"
          className="w-40 h-40 sm:w-44 sm:h-44 mx-auto rounded-2xl border border-amber-100 shadow-2xs object-contain p-2 bg-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto w-full">
        <a
          href={payUniversalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="py-1.5 px-2 bg-stone-900 hover:bg-amber-600 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs"
        >
          <ExternalLink className="w-3 h-3" />
          <span>Mở App Ngân Hàng</span>
        </a>
        <button
          type="button"
          onClick={handleDownloadQR}
          className="py-1.5 px-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-colors border border-stone-200 shadow-2xs cursor-pointer"
        >
          <Download className="w-3 h-3 text-amber-600" />
          <span>Lưu ảnh QR</span>
        </button>
      </div>

      <div className="bg-stone-50/90 p-2.5 rounded-xl border border-stone-200/80 space-y-1 text-[11px] text-left">
        <div className="flex items-center justify-between">
          <span className="text-stone-500">Ngân hàng thụ hưởng:</span>
          <strong className="text-stone-800">{currentBankName}</strong>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-stone-500">Số tài khoản:</span>
          <button
            type="button"
            onClick={() => handleCopy(safeAccountNo, "stk")}
            className="flex items-center gap-1 font-mono font-bold text-stone-900 hover:text-amber-700 bg-white px-2 py-0.5 rounded-md border border-stone-200 shadow-2xs cursor-pointer"
          >
            <span>{safeAccountNo}</span>
            {copiedField === "stk" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-stone-400" />}
          </button>
        </div>
        <div className="flex items-center justify-between pt-0.5 border-t border-stone-200/60">
          <span className="text-stone-500">Nội dung CK:</span>
          <button
            type="button"
            onClick={() => handleCopy(rawTransferMemo, "memo")}
            className="flex items-center gap-1 font-mono font-bold text-amber-900 hover:text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200/80 shadow-2xs cursor-pointer"
          >
            <span>{rawTransferMemo}</span>
            {copiedField === "memo" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-amber-600" />}
          </button>
        </div>
      </div>
    </div>
  );
}