// src/components/checkout/VietQrBox.jsx
import React, { useState, useMemo } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
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
  
  let safeAccountNo = String(accountNo || '').trim();
  if (safeAccountNo.length === 9 && !safeAccountNo.startsWith('0')) {
    safeAccountNo = `0${safeAccountNo}`;
  }

  const matchedBank = useMemo(() => getBankByBin(bankBin), [bankBin]);
  const currentBankName = bankName || matchedBank?.shortName || 'MBBank';

  // Khung VietQR chuẩn Napas 247 chính thức
  const qrImageUrl = `https://img.vietqr.io/image/${bankBin}-${safeAccountNo}-compact.png?amount=${qrTransferAmount}&addInfo=${transferMemo}&accountName=${encodeURIComponent(accountName)}`;

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(""), 2000);
  };

  // Mở ảnh trực tiếp để tải hoặc chạm giữ lưu về thư viện máy (Tránh tuyệt đối lỗi CORS fetch)
  const handleOpenFullImage = () => {
    window.open(qrImageUrl, '_blank');
  };

  return (
    <div className="p-4 bg-white rounded-3xl border border-amber-200 shadow-2xs space-y-3 text-center font-sans">
      {/* Tiêu đề & Số tiền thanh toán */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-black text-amber-950 uppercase tracking-wide">
          {paymentMethod === "deposit" ? "Quét VietQR Đặt Cọc" : "Quét VietQR Thanh Toán"}
        </span>
        <span className="text-xs font-black font-mono text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
          {qrTransferAmount.toLocaleString("vi-VN")}đ
        </span>
      </div>

      {/* ẢNH VIETQR NAPAS 247 */}
      <div className="flex justify-center items-center py-0.5">
        <img
          src={qrImageUrl}
          alt="Mã VietQR Chuyển Khoản"
          className="w-full max-w-[250px] sm:max-w-[270px] object-contain mx-auto rounded-2xl"
        />
      </div>

      {/* NÚT MỞ ẢNH GỐC ĐỂ CHẠM GIỮ LƯU VÀO ALBUM (KHÔNG DÙNG FETCH) */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleOpenFullImage}
          className="py-1.5 px-3.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors border border-amber-200/90 shadow-2xs cursor-pointer active:scale-95"
          title="Mở ảnh QR để lưu vào máy"
        >
          <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
          <span>Mở ảnh QR để lưu vào máy</span>
        </button>
      </div>

      {/* BẢNG SAO CHÉP THÔNG TIN TIỆN DỤNG */}
      <div className="bg-stone-50/90 p-3 rounded-2xl border border-stone-200/80 space-y-2 text-xs text-left">
        <div className="flex items-center justify-between">
          <span className="text-stone-500 font-medium">Ngân hàng:</span>
          <strong className="text-stone-800">{currentBankName}</strong>
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