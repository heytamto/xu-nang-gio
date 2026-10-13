import React, { useState, useMemo } from 'react';
import { 
  User, Phone, FileText, ShieldCheck, 
  QrCode, Truck, ArrowRight, X, Loader2, Tag, Sparkles, Gift, UserCheck, ShoppingBag,
  Download, Copy, Check, ExternalLink, Smartphone
} from 'lucide-react';
import AddressField from './AddressField';

export default function CheckoutSection({ 
  cart = [], 
  totalAmount = 0, 
  onClose, 
  onSubmitOrder, 
  shopConfig = {} 
}) {
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    note: ''
  });

  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('deposit');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trạng thái copy nhanh
  const [copiedField, setCopiedField] = useState('');

  // Voucher State
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState('');

  // Nhận diện Khách Mới / Khách Quen theo SĐT
  const cleanPhone = useMemo(() => {
    return customer.phone.trim().replace(/[^0-9]/g, '');
  }, [customer.phone]);

  const customerHistory = useMemo(() => {
    if (!cleanPhone || cleanPhone.length < 10) return null;

    try {
      const pastOrders = JSON.parse(localStorage.getItem('shop_orders') || '[]');
      const matchedOrders = pastOrders.filter((ord) => {
        const ordPhone = (ord.phone || ord['Số Điện Thoại'] || ord.customer?.phone || '').replace(/[^0-9]/g, '');
        return ordPhone === cleanPhone;
      });

      if (matchedOrders.length > 0) {
        const latestOrder = matchedOrders[0];
        const hasUnusedOldCode = !pastOrders.some((ord) => ord.usedPreviousOrderCode === latestOrder.code);

        return {
          isOldCustomer: true,
          orderCount: matchedOrders.length,
          latestOrderCode: latestOrder.code,
          canUseOldCode: hasUnusedOldCode
        };
      }
    } catch (e) {
      console.error(e);
    }

    return {
      isOldCustomer: false,
      orderCount: 0,
      latestOrderCode: null,
      canUseOldCode: false
    };
  }, [cleanPhone]);

  // Áp dụng mã
  const applySpecificCode = (codeToApply) => {
    setVoucherError('');
    const code = codeToApply.trim().toUpperCase();

    // Mã đơn cũ XNG...
    if (code.startsWith('XNG')) {
      const pastOrders = JSON.parse(localStorage.getItem('shop_orders') || '[]');
      const isUsed = pastOrders.some((ord) => ord.usedPreviousOrderCode === code);
      if (isUsed) {
        setVoucherError(`Mã đơn ${code} đã được dùng ưu đãi trước đó.`);
        return;
      }

      const rate = shopConfig?.loyaltyDiscountPercent || 10;
      const discount = Math.round((totalAmount * rate) / 100);

      setAppliedVoucher({
        code: code,
        discount: discount,
        desc: `Tri ân từ đơn cũ ${code} (Giảm ${rate}%)`,
        usedPreviousOrderCode: code
      });
      setVoucherInput('');
      return;
    }

    // Voucher cấu hình
    const availableVouchers = shopConfig?.vouchers || [];
    const matched = availableVouchers.find((v) => v.code === code);

    if (!matched) {
      setVoucherError('Mã không hợp lệ hoặc đã hết hạn.');
      return;
    }

    if (matched.minOrder && totalAmount < matched.minOrder) {
      setVoucherError(`Đơn hàng phải từ ${matched.minOrder.toLocaleString('vi-VN')}đ để dùng mã này.`);
      return;
    }

    let discount = 0;
    if (matched.type === 'percent') {
      discount = Math.round((totalAmount * (matched.value || 0)) / 100);
    } else {
      discount = Number(matched.value) || 0;
    }

    setAppliedVoucher({
      code: matched.code,
      discount: discount,
      desc: matched.desc || `Mã giảm ${matched.code}`
    });
    setVoucherInput('');
  };

  const handleApplyVoucher = (e) => {
    e.preventDefault();
    if (voucherInput.trim()) {
      applySpecificCode(voucherInput);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherError('');
  };

  const discountAmount = appliedVoucher ? appliedVoucher.discount : 0;
  const finalTotalAmount = Math.max(0, totalAmount - discountAmount);

  const depositAmount = shopConfig?.depositAmount || 50000;
  const qrTransferAmount = paymentMethod === 'full_qr' ? finalTotalAmount : depositAmount;
  const rawTransferMemo = `XNG ${cleanPhone || 'DATNHO'}`;
  const transferMemo = encodeURIComponent(rawTransferMemo);

  const qrImageUrl = (shopConfig?.bankBin && shopConfig?.accountNo) 
    ? `https://img.vietqr.io/image/${shopConfig.bankBin}-${shopConfig.accountNo}-compact.png?amount=${qrTransferAmount}&addInfo=${transferMemo}&accountName=${encodeURIComponent(shopConfig.accountName || '')}`
    : '';

  // Copy helper
  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  // Tải ảnh QR về máy
  const handleDownloadQR = async () => {
    if (!qrImageUrl) return;
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VietQR-${rawTransferMemo}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(qrImageUrl, '_blank');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customer.name.trim() || !customer.phone.trim()) {
      alert('Vui lòng điền đầy đủ họ tên và số điện thoại người nhận!');
      return;
    }
    if (!shippingAddress.trim()) {
      alert('Vui lòng chọn Tỉnh/Thành, Phường/Xã và nhập địa chỉ nhận hàng!');
      return;
    }

    setIsSubmitting(true);

    const orderPayload = {
      customer,
      name: customer.name.trim(),
      phone: customer.phone.trim(),
      note: customer.note.trim(),
      address: shippingAddress.trim(),
      paymentMethod,
      total: finalTotalAmount,
      rawTotal: totalAmount,
      discount: discountAmount,
      voucherCode: appliedVoucher ? appliedVoucher.code : '',
      usedPreviousOrderCode: appliedVoucher?.usedPreviousOrderCode || null,
      cart
    };

    try {
      await onSubmitOrder(orderPayload);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden max-w-6xl mx-auto animate-fadeIn">
      {/* Header Modal */}
      <div className="bg-stone-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-stone-800">
        <div>
          <h2 className="text-base sm:text-lg font-black tracking-wide">Xác Nhận Đặt Hàng - Xứ Nắng Gió</h2>
          <p className="text-xs text-stone-400 mt-0.5">Nông sản thu hái tại giàn, bao ăn từng trái, bọc xốp cẩn thận gửi tận nơi</p>
        </div>
        {onClose && (
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 hover:bg-stone-800 rounded-xl text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
        
        {/* ================= CỘT TRÁI (TỶ LỆ 6/10) ================= */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* HÀNG 1: TÓM TẮT ĐƠN HÀNG (KHÔNG CUỘN) */}
          <div className="bg-stone-50/90 rounded-3xl p-4 sm:p-5 border border-stone-200/80 space-y-3.5">
            <div className="flex items-center justify-between border-b border-stone-200/70 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[11px] font-black shadow-2xs">1</span>
                <h3 className="text-xs sm:text-sm font-black text-stone-900 uppercase tracking-wide flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-amber-700" />
                  <span>Danh Sách Món Đã Chọn ({cart.length} món)</span>
                </h3>
              </div>
              <span className="text-xs font-bold text-amber-900 font-mono">
                Tạm tính: {totalAmount.toLocaleString('vi-VN')}đ
              </span>
            </div>

            <div className="divide-y divide-stone-200/70">
              {cart.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-stone-200/80 shadow-2xs" 
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-stone-900 block leading-snug">
                        {item.name}
                      </span>
                      <span className="text-[11px] text-stone-500 block mt-0.5">
                        Quy cách: <strong className="text-stone-700">{item.weightLabel || 'Tiêu chuẩn'}</strong>
                        {item.flavor ? ` • ${item.flavor}` : ''} 
                        {' '}| Số lượng: <strong className="text-amber-800 font-mono font-bold">x{item.quantity}</strong>
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-stone-900 whitespace-nowrap text-sm pl-2">
                    {((item.price || 0) * (item.quantity || 1)).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* HÀNG 2: THÔNG TIN GIAO HÀNG & ĐỊA CHỈ */}
          <div className="bg-stone-50/90 rounded-3xl p-4 sm:p-5 border border-stone-200/80 space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-200/70 pb-3">
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[11px] font-black shadow-2xs">2</span>
              <h3 className="text-xs sm:text-sm font-black text-stone-900 uppercase tracking-wide">
                Thông Tin Khách Hàng & Địa Chỉ Nhận Hàng
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Họ và tên người nhận *"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-amber-600 font-medium text-stone-800 shadow-2xs"
                />
              </div>

              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="Số điện thoại di động *"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-amber-600 font-mono text-stone-800 shadow-2xs"
                />
              </div>
            </div>

            {customerHistory && !appliedVoucher && (
              <div className="animate-fadeIn">
                {customerHistory.isOldCustomer ? (
                  <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-[11px] font-bold text-emerald-800 block">
                          Chào mừng khách quen trở lại! (Đơn thứ {customerHistory.orderCount + 1})
                        </span>
                        <span className="text-[10px] text-emerald-600">
                          {customerHistory.canUseOldCode 
                            ? `Bạn có ưu đãi giảm 10% từ đơn cũ ${customerHistory.latestOrderCode}` 
                            : 'Đã sẵn sàng ưu đãi tri ân cho bạn'}
                        </span>
                      </div>
                    </div>

                    {customerHistory.canUseOldCode && (
                      <button
                        type="button"
                        onClick={() => applySpecificCode(customerHistory.latestOrderCode)}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold whitespace-nowrap shadow-xs transition-all active:scale-95"
                      >
                        Áp dụng giảm 10%
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="text-[11px] font-bold text-amber-800 block">
                          Chào bạn mới ghé vườn Xứ Nắng Gió!
                        </span>
                        <span className="text-[10px] text-amber-600">
                          Tặng bạn mã làm quen giảm ngay 15.000đ cho đơn đầu tiên
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => applySpecificCode('LAMQUEN')}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold whitespace-nowrap shadow-xs transition-all active:scale-95"
                    >
                      Dùng mã LAMQUEN
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-stone-600 block">Địa chỉ nhận hàng *</label>
              <AddressField 
                value={shippingAddress} 
                onChange={setShippingAddress} 
              />
            </div>

            <div className="relative pt-1">
              <FileText className="w-4 h-4 text-stone-400 absolute left-3 top-4" />
              <input
                type="text"
                placeholder="Ghi chú đóng gói (VD: Giao giờ hành chính, bọc kỹ chống dập...)"
                value={customer.note}
                onChange={(e) => setCustomer({ ...customer, note: e.target.value })}
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-amber-600 text-stone-600 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* ================= CỘT PHẢI (TỶ LỆ 4/10): THANH TOÁN ================= */}
        <div className="lg:col-span-4 bg-stone-50/90 rounded-3xl p-5 border border-stone-200/90 shadow-xs space-y-4 sticky top-6">
          
          <div className="border-b border-stone-200/70 pb-3">
            <h3 className="text-xs sm:text-sm font-black text-stone-900 uppercase tracking-wide">
              Thanh Toán & Ưu Đãi
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">Áp dụng voucher và chọn phương thức</p>
          </div>

          {/* Ô Nhập Voucher */}
          <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
            <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-600" />
              <span>Mã Ưu Đãi / Quà Tặng</span>
            </span>

            {appliedVoucher ? (
              <div className="flex items-center justify-between bg-amber-50/80 border border-amber-300 px-3 py-2 rounded-xl text-xs">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <div>
                    <span className="font-mono font-bold text-amber-900 block">{appliedVoucher.code}</span>
                    <span className="text-[10px] text-amber-700">{appliedVoucher.desc}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveVoucher}
                  className="text-stone-400 hover:text-red-500 p-1"
                  title="Bỏ mã"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Nhập mã ưu đãi..."
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-amber-600 font-mono uppercase text-stone-800"
                />
                <button
                  type="button"
                  onClick={handleApplyVoucher}
                  className="px-3 py-2 bg-stone-900 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
                >
                  Áp dụng
                </button>
              </div>
            )}

            {voucherError && (
              <p className="text-[10px] text-red-500 font-medium">{voucherError}</p>
            )}
          </div>

          {/* 3 Lựa chọn hình thức thanh toán */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-stone-700 block">Chọn hình thức thanh toán:</label>
            <div className="grid grid-cols-1 gap-2">
              <label className={`cursor-pointer p-3 rounded-2xl border transition-all flex items-center justify-between ${
                paymentMethod === 'deposit' 
                  ? 'border-amber-600 bg-amber-50 ring-1 ring-amber-600 shadow-xs' 
                  : 'border-stone-200 bg-white hover:bg-stone-50'
              }`}>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className={`w-4 h-4 shrink-0 ${paymentMethod === 'deposit' ? 'text-amber-700' : 'text-stone-400'}`} />
                  <div>
                    <strong className="block text-xs text-stone-900 font-bold">Cọc {depositAmount.toLocaleString('vi-VN')}đ</strong>
                    <span className="text-[10px] text-stone-500 block leading-tight">Giữ đơn hái tươi</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="deposit"
                  checked={paymentMethod === 'deposit'}
                  onChange={() => setPaymentMethod('deposit')}
                  className="accent-amber-600"
                />
              </label>

              <label className={`cursor-pointer p-3 rounded-2xl border transition-all flex items-center justify-between ${
                paymentMethod === 'full_qr' 
                  ? 'border-amber-600 bg-amber-50 ring-1 ring-amber-600 shadow-xs' 
                  : 'border-stone-200 bg-white hover:bg-stone-50'
              }`}>
                <div className="flex items-center gap-2.5">
                  <QrCode className={`w-4 h-4 shrink-0 ${paymentMethod === 'full_qr' ? 'text-amber-700' : 'text-stone-400'}`} />
                  <div>
                    <strong className="block text-xs text-stone-900 font-bold">Chuyển khoản 100%</strong>
                    <span className="text-[10px] text-stone-500 block leading-tight">Quét mã VietQR tiện lợi</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="full_qr"
                  checked={paymentMethod === 'full_qr'}
                  onChange={() => setPaymentMethod('full_qr')}
                  className="accent-amber-600"
                />
              </label>

              <label className={`cursor-pointer p-3 rounded-2xl border transition-all flex items-center justify-between ${
                paymentMethod === 'cod' 
                  ? 'border-amber-600 bg-amber-50 ring-1 ring-amber-600 shadow-xs' 
                  : 'border-stone-200 bg-white hover:bg-stone-50'
              }`}>
                <div className="flex items-center gap-2.5">
                  <Truck className={`w-4 h-4 shrink-0 ${paymentMethod === 'cod' ? 'text-amber-700' : 'text-stone-400'}`} />
                  <div>
                    <strong className="block text-xs text-stone-900 font-bold">Trả sau (COD)</strong>
                    <span className="text-[10px] text-stone-500 block leading-tight">Vườn gọi điện xác nhận</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="accent-amber-600"
                />
              </label>
            </div>
          </div>

          {/* KHỐI VIETQR ĐỘNG & BỘ CÔNG CỤ CHO KHÁCH DÙNG 1 ĐIỆN THOẠI */}
          {paymentMethod !== 'cod' && shopConfig?.bankBin && shopConfig?.accountNo && (
            <div className="p-3.5 bg-white rounded-2xl border border-amber-200 shadow-2xs space-y-3 animate-fadeIn">
              <div className="text-center">
                <span className="text-[11px] font-bold text-amber-900 block">
                  {paymentMethod === 'deposit' ? `Quét VietQR Cọc ${depositAmount.toLocaleString('vi-VN')}đ` : 'Quét VietQR Trả Đủ 100%'}
                </span>
                <span className="text-[10px] text-stone-400 block">Hỗ trợ mọi app Mobile Banking & MoMo</span>
              </div>

              {/* Ảnh QR */}
              <div className="relative w-36 mx-auto">
                <img
                  src={qrImageUrl}
                  alt="VietQR Chuyển khoản"
                  className="w-36 h-36 mx-auto rounded-xl border border-stone-100 shadow-2xs"
                />
              </div>

              {/* NÚT MỞ APP NGÂN HÀNG HOẶC TẢI ẢNH CHO 1 ĐIỆN THOẠI */}
              <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px]">
                  <Smartphone className="w-3.5 h-3.5 text-amber-700" />
                  <span>Dùng 1 điện thoại thanh toán:</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {/* Nút 1: Mở app ngân hàng qua Deep Link */}
                  <a
                    href={`https://dl.vietqr.io/pay?app=&ba=${shopConfig.bankBin}&acc=${shopConfig.accountNo}&am=${qrTransferAmount}&des=${transferMemo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-stone-900 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors text-center shadow-2xs"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Mở App Ngân Hàng</span>
                  </a>

                  {/* Nút 2: Tải ảnh QR về thư viện */}
                  <button
                    type="button"
                    onClick={handleDownloadQR}
                    className="p-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors text-center shadow-2xs"
                  >
                    <Download className="w-3 h-3 text-amber-600" />
                    <span>Lưu ảnh QR</span>
                  </button>
                </div>

                <p className="text-[9.5px] text-stone-500 leading-tight">
                  💡 <em>Mẹo:</em> Bấm <strong>Lưu ảnh QR</strong> $\rightarrow$ Mở app Ngân hàng $\rightarrow$ Chọn <strong>Quét QR từ ảnh có sẵn</strong> là xong!
                </p>
              </div>

              {/* Thông tin chuyển khoản thủ công & Copy 1 chạm */}
              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/70 space-y-1.5 text-[10px]">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 font-medium">Ngân hàng:</span>
                  <span className="font-bold text-stone-800">{shopConfig.bankName}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-stone-500 font-medium">Số tài khoản:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(shopConfig.accountNo, 'stk')}
                    className="flex items-center gap-1 font-mono font-bold text-stone-900 hover:text-amber-700 transition-colors bg-white px-1.5 py-0.5 rounded border border-stone-200"
                    title="Sao chép số tài khoản"
                  >
                    <span>{shopConfig.accountNo}</span>
                    {copiedField === 'stk' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-stone-400" />
                    )}
                  </button>
                </div>

                {shopConfig.accountName && (
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 font-medium">Chủ tài khoản:</span>
                    <span className="font-mono uppercase font-bold text-stone-800">{shopConfig.accountName}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-stone-500 font-medium">Nội dung CK:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(rawTransferMemo, 'memo')}
                    className="flex items-center gap-1 font-mono font-bold text-amber-900 hover:text-amber-700 transition-colors bg-amber-100/70 px-1.5 py-0.5 rounded border border-amber-200/80"
                    title="Sao chép nội dung"
                  >
                    <span>{rawTransferMemo}</span>
                    {copiedField === 'memo' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-amber-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bảng tính tiền & Tổng kết */}
          <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 space-y-2 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>Tạm tính tiền hàng:</span>
              <span className="font-mono font-bold">{totalAmount.toLocaleString('vi-VN')}đ</span>
            </div>

            {appliedVoucher && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Mã ưu đãi:</span>
                <span className="font-mono font-bold">-{discountAmount.toLocaleString('vi-VN')}đ</span>
              </div>
            )}

            <div className="flex justify-between text-stone-900 font-black border-t border-stone-100 pt-2 text-sm">
              <span>Tổng thanh toán:</span>
              <span className="font-mono text-amber-900">{finalTotalAmount.toLocaleString('vi-VN')}đ</span>
            </div>

            <div className="flex justify-between text-stone-500 text-[11px] pt-0.5">
              <span>Thanh toán ngay:</span>
              <span className="font-mono font-bold text-stone-800">
                {paymentMethod === 'cod' ? '0đ (Trả khi nhận)' : `${qrTransferAmount.toLocaleString('vi-VN')}đ`}
              </span>
            </div>
          </div>

          {/* Nút Xác Nhận Đặt Hàng */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang Gửi Đơn Về Vườn...</span>
              </>
            ) : (
              <>
                <span>Xác Nhận Đặt Hàng Ngay</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
