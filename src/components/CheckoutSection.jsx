import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Phone, FileText, ShieldCheck, 
  QrCode, Truck, ArrowRight, X, Loader2, Tag, Sparkles, Gift, CheckCircle2, UserCheck
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

  // Voucher State
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState('');

  // 1. Kiểm tra lịch sử đơn hàng theo số điện thoại (Nhận diện Khách Mới / Khách Quen)
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
        // Tìm đơn gần nhất chưa bị dùng mã làm ưu đãi
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

  // Hàm kích hoạt áp dụng mã tự động
  const applySpecificCode = (codeToApply) => {
    setVoucherError('');
    const code = codeToApply.trim().toUpperCase();

    // Trường hợp 1: Mã đơn hàng cũ (XNG...)
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

    // Trường hợp 2: Mã cấu hình (LAMQUEN, v.v.)
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

  const transferMemo = encodeURIComponent(`XNG ${cleanPhone || 'DATNHO'}`);

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden max-w-4xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="bg-stone-900 text-white p-5 flex items-center justify-between border-b border-stone-800">
        <div>
          <h2 className="text-base font-black tracking-wide">Xác Nhận Đặt Hàng - Xứ Nắng Gió</h2>
          <p className="text-xs text-stone-400 mt-0.5">Nông sản thu hái tại giàn, bọc xốp cẩn thận gửi tận nơi</p>
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

      <form onSubmit={handleSubmit} className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI */}
        <div className="lg:col-span-7 space-y-5">
          {/* Thông tin người nhận */}
          <div className="bg-stone-50/80 p-4 rounded-2xl border border-stone-200/80 space-y-3">
            <div className="flex items-center gap-2 text-stone-900 font-bold text-xs uppercase tracking-wide">
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[11px] font-black">1</span>
              <span>Thông Tin Khách Hàng</span>
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

            {/* BOX GỢI Ý THÔNG MINH DỰA TRÊN SỐ ĐIỆN THOẠI */}
            {customerHistory && !appliedVoucher && (
              <div className="animate-fadeIn pt-1">
                {customerHistory.isOldCustomer ? (
                  /* Trạng thái: Khách Quen */
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
                  /* Trạng thái: Khách Mới */
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
          </div>

          {/* Địa chỉ giao hàng */}
          <div className="bg-stone-50/80 p-4 rounded-2xl border border-stone-200/80 space-y-3">
            <div className="flex items-center gap-2 text-stone-900 font-bold text-xs uppercase tracking-wide">
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[11px] font-black">2</span>
              <span>Địa Chỉ Giao Hàng</span>
            </div>

            <AddressField 
              value={shippingAddress} 
              onChange={setShippingAddress} 
            />

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

          {/* Phương thức thanh toán */}
          <div className="bg-stone-50/80 p-4 rounded-2xl border border-stone-200/80 space-y-3">
            <div className="flex items-center gap-2 text-stone-900 font-bold text-xs uppercase tracking-wide">
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[11px] font-black">3</span>
              <span>Phương Thức Thanh Toán</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <label className={`cursor-pointer p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                paymentMethod === 'deposit' 
                  ? 'border-amber-600 bg-amber-50 shadow-xs ring-1 ring-amber-600' 
                  : 'border-stone-200 bg-white hover:bg-stone-50'
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="deposit"
                  checked={paymentMethod === 'deposit'}
                  onChange={() => setPaymentMethod('deposit')}
                  className="sr-only"
                />
                <ShieldCheck className={`w-4 h-4 mb-1.5 ${paymentMethod === 'deposit' ? 'text-amber-700' : 'text-stone-400'}`} />
                <div>
                  <strong className="block text-xs text-stone-900 font-bold">Cọc {depositAmount.toLocaleString('vi-VN')}đ</strong>
                  <span className="text-[10px] text-stone-500 block leading-tight mt-0.5">Giữ đơn hái tươi, còn lại trả khi nhận</span>
                </div>
              </label>

              <label className={`cursor-pointer p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                paymentMethod === 'full_qr' 
                  ? 'border-amber-600 bg-amber-50 shadow-xs ring-1 ring-amber-600' 
                  : 'border-stone-200 bg-white hover:bg-stone-50'
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="full_qr"
                  checked={paymentMethod === 'full_qr'}
                  onChange={() => setPaymentMethod('full_qr')}
                  className="sr-only"
                />
                <QrCode className={`w-4 h-4 mb-1.5 ${paymentMethod === 'full_qr' ? 'text-amber-700' : 'text-stone-400'}`} />
                <div>
                  <strong className="block text-xs text-stone-900 font-bold">CK 100%</strong>
                  <span className="text-[10px] text-stone-500 block leading-tight mt-0.5">Quét mã VietQR nhanh gọn</span>
                </div>
              </label>

              <label className={`cursor-pointer p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                paymentMethod === 'cod' 
                  ? 'border-amber-600 bg-amber-50 shadow-xs ring-1 ring-amber-600' 
                  : 'border-stone-200 bg-white hover:bg-stone-50'
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="sr-only"
                />
                <Truck className={`w-4 h-4 mb-1.5 ${paymentMethod === 'cod' ? 'text-amber-700' : 'text-stone-400'}`} />
                <div>
                  <strong className="block text-xs text-stone-900 font-bold">Trả Sau (COD)</strong>
                  <span className="text-[10px] text-stone-500 block leading-tight mt-0.5">Nhà vườn gọi xác nhận</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI */}
        <div className="lg:col-span-5 bg-stone-50/80 rounded-2xl p-5 border border-stone-200 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">Tóm Tắt Đơn Hàng</h3>

            {/* List sản phẩm */}
            <div className="divide-y divide-stone-200/60 max-h-40 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <span className="font-semibold text-stone-800">{item.name}</span>
                    <span className="text-[11px] text-stone-400 block">
                      x{item.quantity} ({item.weightLabel || 'Tiêu chuẩn'}) {item.flavor ? `• ${item.flavor}` : ''}
                    </span>
                  </div>
                  <span className="font-bold text-stone-900 font-mono">
                    {((item.price || 0) * (item.quantity || 1)).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              ))}
            </div>

            {/* Ô nhập voucher & hiển thị voucher đang áp dụng */}
            <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-600" />
                <span>Mã Ưu Đãi Đơn Hàng</span>
              </span>

              {appliedVoucher ? (
                <div className="flex items-center justify-between bg-amber-50/80 border border-amber-300 px-3 py-2 rounded-xl text-xs">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
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

            {/* Tóm tắt tiền */}
            <div className="pt-2 border-t border-stone-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Tạm tính tiền hàng:</span>
                <span className="font-mono font-bold">{totalAmount.toLocaleString('vi-VN')}đ</span>
              </div>

              {appliedVoucher && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Mã ưu đãi:</span>
                  <span className="font-mono font-bold">-{discountAmount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}

              <div className="flex justify-between text-stone-900 font-bold border-t border-stone-100 pt-1">
                <span>Tổng đơn sau giảm:</span>
                <span className="font-mono text-sm text-stone-900">{finalTotalAmount.toLocaleString('vi-VN')}đ</span>
              </div>

              <div className="flex justify-between text-stone-500">
                <span>Tiền thanh toán ngay:</span>
                <span className="font-mono font-bold text-amber-800">
                  {paymentMethod === 'cod' ? '0đ' : `${qrTransferAmount.toLocaleString('vi-VN')}đ`}
                </span>
              </div>
            </div>

            {/* Xem trước địa chỉ */}
            {shippingAddress && (
              <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/60 text-[11px] text-amber-900 leading-snug">
                <span className="font-bold block text-[10px] text-amber-700 uppercase">Giao đến:</span>
                <span className="line-clamp-2">{shippingAddress}</span>
              </div>
            )}

            {/* VietQR Dynamic Card */}
            {paymentMethod !== 'cod' && shopConfig?.bankBin && shopConfig?.accountNo && (
              <div className="p-3.5 bg-white rounded-2xl border border-amber-200 shadow-2xs text-center space-y-2">
                <span className="text-[11px] font-bold text-amber-800 block">
                  {paymentMethod === 'deposit' ? `Quét Mã VietQR Cọc ${depositAmount.toLocaleString('vi-VN')}đ` : 'Quét Mã VietQR Trả Hết 100%'}
                </span>
                <img
                  src={`https://img.vietqr.io/image/${shopConfig.bankBin}-${shopConfig.accountNo}-compact.png?amount=${qrTransferAmount}&addInfo=${transferMemo}&accountName=${encodeURIComponent(shopConfig.accountName || '')}`}
                  alt="VietQR Chuyển khoản"
                  className="w-36 h-36 mx-auto rounded-xl border border-stone-100 shadow-2xs"
                />
                <div className="text-[10px] text-stone-600 font-mono space-y-0.5">
                  <div>
                    <span className="font-bold text-stone-800">{shopConfig.bankName}</span>: <span>{shopConfig.accountNo}</span>
                  </div>
                  {shopConfig.accountName && (
                    <div className="text-[9px] text-stone-400 uppercase tracking-wide">
                      {shopConfig.accountName}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang Gửi Đơn...</span>
              </>
            ) : (
              <>
                <span>Xác Nhận Đặt Hàng</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
