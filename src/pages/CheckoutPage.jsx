import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { ORDER_STATUS, normalizeOrderStatus } from '../constants/orderStatus';

// Sub-components
import OrderItemsList from '../components/checkout/OrderItemsList';
import PaymentGiftSelector from '../components/checkout/PaymentGiftSelector';
import CustomerInfoForm from '../components/checkout/CustomerInfoForm';
import ShippingPolicyCard from '../components/checkout/ShippingPolicyCard';
import VoucherSection from '../components/checkout/VoucherSection';
import PaymentMethodSelector from '../components/checkout/PaymentMethodSelector';
import CodTimeline from '../components/checkout/CodTimeline';
import VietQrBox from '../components/checkout/VietQrBox';
import OrderSummaryCard from '../components/checkout/OrderSummaryCard';
import CheckoutReceiptModal from '../components/checkout/CheckoutReceiptModal';

const MAX_VOUCHERS = 3;

function isBadOrderStatus(statusStr) {
  const normalized = normalizeOrderStatus(statusStr);
  if (normalized === ORDER_STATUS.CANCELLED || normalized === ORDER_STATUS.BOMBED) return true;
  const raw = String(statusStr || '').trim().toLowerCase();
  return (
    raw === 'đã hủy' || 
    raw === 'da huy' || 
    raw === 'cancelled' || 
    raw === 'bom hàng' || 
    raw === 'bom hang' || 
    raw === 'bombed'
  );
}

// Hàm parse ngày an toàn để sắp xếp dòng thời gian
function parseDateForSort(dateStr) {
  if (!dateStr) return 0;
  if (dateStr instanceof Date) return dateStr.getTime();
  let str = String(dateStr).trim().replace(/\s*\(.*?\)\s*/g, '');
  if (str.includes('/')) {
    const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}):(\d{1,2}))?/);
    if (match) {
      const [, d, m, y, hr = '0', min = '0', sec = '0'] = match;
      return new Date(Number(y), Number(m) - 1, Number(d), Number(hr), Number(min), Number(sec)).getTime();
    }
  }
  const t = new Date(str).getTime();
  return isNaN(t) ? 0 : t;
}

export default function CheckoutPage({
  cart = [],
  onSubmitOrder,
  onNavigate,
  shopConfig = {},
}) {
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', note: '' });
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('deposit');
  const [selectedGiftId, setSelectedGiftId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printStage, setPrintStage] = useState(1);
  const [isPromoDismissed, setIsPromoDismissed] = useState(false);
  const [formErrors, setFormErrors] = useState({ name: '', phone: '', email: '' });
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVouchers, setAppliedVouchers] = useState([]);
  const [voucherError, setVoucherError] = useState('');

  const paymentGifts = useMemo(() => Array.isArray(shopConfig?.paymentGifts) ? shopConfig.paymentGifts : [], [shopConfig?.paymentGifts]);
  const totalAmount = useMemo(() => cart.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0), [cart]);

  const cleanPhone = useMemo(() => customer.phone.trim().replace(/[^0-9]/g, ''), [customer.phone]);

  const validatePhone = (phone) => {
    const raw = phone.trim();
    if (!raw) return 'Vui lòng nhập số điện thoại người nhận.';
    if (raw.length !== 10) return `Số điện thoại phải có đúng 10 số (hiện có ${raw.length} số).`;
    if (!/^0(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/.test(raw)) return 'Đầu số không hợp lệ (bắt đầu bằng 03, 05, 07, 08, 09).';
    return '';
  };

  const validateName = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return 'Vui lòng nhập họ và tên người nhận.';
    if (!/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/.test(trimmed)) return 'Họ tên chỉ được chứa chữ cái.';
    if (trimmed.split(/\s+/).filter(Boolean).length < 2 || trimmed.length < 4) return 'Vui lòng nhập đầy đủ cả họ và tên.';
    return '';
  };

  const validateEmail = (email) => {
    const trimmed = email.trim();
    if (!trimmed) return '';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? '' : 'Email không đúng định dạng.';
  };

  // =========================================================================
  // TRA CỨU LỊCH SỬ KHÁCH HÀNG & CƠ CHẾ KHÔI PHỤC UY TÍN (PARDONING)
  // =========================================================================
  const customerHistory = useMemo(() => {
    if (!cleanPhone || cleanPhone.length < 9) return null;
    try {
      const localOrders = JSON.parse(localStorage.getItem('shop_orders') || '[]');
      const sheetOrders = Array.isArray(shopConfig?.orders) ? shopConfig.orders : [];
      const allOrdersMap = new Map();
      sheetOrders.forEach(o => { if (o?.code) allOrdersMap.set(o.code, o); });
      localOrders.forEach(o => { if (o?.code) allOrdersMap.set(o.code, o); });
      const combinedOrders = Array.from(allOrdersMap.values());

      const matchedOrders = combinedOrders.filter((ord) => {
        const ordPhone = String(ord.phone || ord['Số Điện Thoại'] || ord.customer?.phone || '').replace(/[^0-9]/g, '');
        return ordPhone && (ordPhone.endsWith(cleanPhone.slice(-9)) || cleanPhone.endsWith(ordPhone.slice(-9)));
      });

      if (matchedOrders.length > 0) {
        // 1. Sắp xếp đơn từ mới nhất đến cũ nhất
        matchedOrders.sort((a, b) => parseDateForSort(b.createdAt) - parseDateForSort(a.createdAt));

        const latestOrder = matchedOrders[0];
        const isLatestSuccess = latestOrder && !isBadOrderStatus(latestOrder.status);

        // Đơn thành công
        const validOrders = matchedOrders.filter((ord) => !isBadOrderStatus(ord.status));
        const hasSuccess = validOrders.length > 0;

        // Đơn bom & đơn hủy
        const bombedOrders = matchedOrders.filter((ord) => {
          const norm = normalizeOrderStatus(ord.status);
          const raw = String(ord.status || '').toLowerCase();
          const isPrepaid100 = String(ord.paymentMethod || '').toLowerCase().includes('100%') || ord.paymentMethod === 'full_qr';
          return (norm === ORDER_STATUS.BOMBED || raw.includes('bom')) && !isPrepaid100;
        });

        const cancelledOrders = matchedOrders.filter((ord) => {
          const norm = normalizeOrderStatus(ord.status);
          const raw = String(ord.status || '').toLowerCase();
          return norm === ORDER_STATUS.CANCELLED || raw.includes('hủy') || raw.includes('cancel');
        });

        // =====================================================================
        // CƠ CHẾ KHÔI PHỤC UY TÍN:
        // Nếu đơn gần đây nhất là đơn thành công -> Khôi phục uy tín hoàn toàn!
        // =====================================================================
        const isPardoned = isLatestSuccess && hasSuccess;

        // Án phạt Bom chỉ kích hoạt nếu CHƯA được khôi phục uy tín và có đơn bom chưa được chuộc lỗi
        const activeBombedRisk = !isPardoned && (bombedOrders.length > 0);
        const activeFrequentCanceller = !isPardoned && (cancelledOrders.length >= 2);

        const latestSuccessOrder = hasSuccess ? validOrders[0] : null;
        const hasUnusedOldCode = Boolean(
          latestSuccessOrder && !combinedOrders.some((ord) => ord.usedPreviousOrderCode === latestSuccessOrder.code)
        );

        return {
          isOldCustomer: hasSuccess,
          isPardoned,
          onlyHasBadHistory: !hasSuccess && (bombedOrders.length > 0 || cancelledOrders.length > 0),
          orderCount: validOrders.length,
          hasBombedHistory: activeBombedRisk,
          isFrequentCanceller: activeFrequentCanceller,
          isRiskCustomer: activeBombedRisk || activeFrequentCanceller,
          latestOrderCode: latestSuccessOrder ? latestSuccessOrder.code : null,
          canUseOldCode: hasUnusedOldCode,
        };
      }
    } catch (e) {
      console.error(e);
    }
    return { 
      isOldCustomer: false, 
      isPardoned: false, 
      onlyHasBadHistory: false, 
      orderCount: 0, 
      hasBombedHistory: false, 
      isFrequentCanceller: false, 
      isRiskCustomer: false, 
      latestOrderCode: null, 
      canUseOldCode: false 
    };
  }, [cleanPhone, shopConfig?.orders]);

  // Điều phối thanh toán (Chỉ ép khi án phạt bom đang hiệu lực)
  useEffect(() => {
    if (customerHistory?.hasBombedHistory) {
      if (paymentMethod !== 'full_qr') setPaymentMethod('full_qr');
    } else if (customerHistory?.isFrequentCanceller && paymentMethod === 'cod') {
      setPaymentMethod('deposit');
    }
  }, [customerHistory, paymentMethod]);

  const isLoyaltyCodeApplied = useMemo(() => appliedVouchers.some(v => v.code === customerHistory?.latestOrderCode || v.usedPreviousOrderCode || v.code.startsWith('XNG')), [appliedVouchers, customerHistory?.latestOrderCode]);
  const isWelcomeCodeApplied = useMemo(() => appliedVouchers.some(v => v.code === 'LAMQUEN'), [appliedVouchers]);

  // Gợi ý voucher thông minh
  const singleSuggestedVoucher = useMemo(() => {
    if (!customerHistory) return null;
    
    // Nếu là khách đã có đơn thành công (hoặc đã được khôi phục uy tín)
    if (customerHistory.isOldCustomer) {
      if (customerHistory.canUseOldCode && !isLoyaltyCodeApplied && customerHistory.latestOrderCode) {
        const rate = Number(shopConfig?.loyaltyDiscountPercent) || 10;
        return { 
          isLoyalty: true, 
          code: customerHistory.latestOrderCode, 
          title: `Tri ân khách quen (Đơn thứ ${customerHistory.orderCount + 1})`, 
          desc: `Giảm ${rate}% từ đơn thành công ${customerHistory.latestOrderCode}` 
        };
      }
      return null;
    }

    // Nếu chỉ có lịch sử hủy/bom hoặc là khách mới hoàn toàn
    if (!isWelcomeCodeApplied) {
      const welcomeVoucher = shopConfig?.vouchers?.find((v) => v.code === 'LAMQUEN');
      if (welcomeVoucher) {
        return { 
          isLoyalty: false, 
          code: 'LAMQUEN', 
          title: customerHistory.onlyHasBadHistory ? 'Mừng bạn quay lại đặt đơn!' : 'Chào bạn mới ghé vườn!', 
          desc: welcomeVoucher.desc || 'Ưu đãi 15.000đ cho đơn hàng hoàn tất đầu tiên' 
        };
      }
    }
    return null;
  }, [customerHistory, isLoyaltyCodeApplied, isWelcomeCodeApplied, shopConfig?.loyaltyDiscountPercent, shopConfig?.vouchers]);

  const { calculatedVouchers, discountAmount } = useMemo(() => {
    if (appliedVouchers.length === 0) return { calculatedVouchers: [], discountAmount: 0 };
    let totalDisc = 0;
    const list = appliedVouchers.map((v) => {
      let currentVal = v.type === 'percent' ? Math.round((totalAmount * (v.value || 0)) / 100) : (Number(v.value) || 0);
      if (v.type === 'percent' && v.maxDiscount) currentVal = Math.min(currentVal, v.maxDiscount);
      totalDisc += currentVal;
      return { ...v, currentDiscount: currentVal };
    });
    return { calculatedVouchers: list, discountAmount: Math.min(totalAmount, totalDisc) };
  }, [appliedVouchers, totalAmount]);

  const applySpecificCode = (codeToApply) => {
    setVoucherError('');
    const code = codeToApply.trim().toUpperCase();
    if (!code) return;
    if (code === 'LAMQUEN' && customerHistory?.isOldCustomer) {
      setVoucherError('Mã "LAMQUEN" chỉ áp dụng cho khách hàng chưa có đơn giao thành công!');
      return;
    }
    if (appliedVouchers.some((v) => v.code === code)) {
      setVoucherError(`Mã "${code}" đã được áp dụng.`);
      return;
    }

    if (code.startsWith('XNG')) {
      const combinedOrders = [...(shopConfig?.orders || []), ...JSON.parse(localStorage.getItem('shop_orders') || '[]')];
      const targetOldOrder = combinedOrders.find((ord) => String(ord.code).trim().toUpperCase() === code);
      if (!targetOldOrder || isBadOrderStatus(targetOldOrder.status)) {
        setVoucherError('Đơn hàng này không hợp lệ hoặc đã bị hủy/bom hàng.');
        return;
      }
      const rate = Number(shopConfig?.loyaltyDiscountPercent) || 10;
      const maxLoyalty = Number(shopConfig?.loyaltyMaxDiscount) || 50000;
      setAppliedVouchers(prev => [...prev, { code, type: 'percent', value: rate, maxDiscount: maxLoyalty, canStack: true, desc: `Tri ân đơn cũ ${code}`, usedPreviousOrderCode: code }]);
      setVoucherInput('');
    } else {
      const matched = (shopConfig?.vouchers || []).find((v) => v.code === code);
      if (!matched) {
        setVoucherError(`Mã "${code}" không tồn tại hoặc đã hết hạn.`);
        return;
      }
      setAppliedVouchers(prev => [...prev, { code: matched.code, type: matched.type || 'fixed', value: Number(matched.value) || 0, maxDiscount: matched.maxDiscount ? Number(matched.maxDiscount) : null, canStack: matched.canStack ?? true, desc: matched.desc }]);
      setVoucherInput('');
    }
  };

  const finalTotalAmount = Math.max(0, totalAmount - discountAmount);
  const depositAmount = Number(shopConfig?.depositAmount) || 50000;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nameErr = validateName(customer.name);
    const phoneErr = validatePhone(customer.phone);
    const emailErr = validateEmail(customer.email);
    setFormErrors({ name: nameErr, phone: phoneErr, email: emailErr });
    if (nameErr || phoneErr || emailErr) return;

    if (!shippingAddress.trim()) {
      alert('Vui lòng chọn địa chỉ nhận hàng!');
      return;
    }
    if (customerHistory?.hasBombedHistory && paymentMethod !== 'full_qr') {
      alert('Đơn hàng này cần thanh toán chuyển khoản 100% trước khi nhà vườn cắt hái!');
      setPaymentMethod('full_qr');
      return;
    }

    setIsSubmitting(true);
    setPrintStage(1);
    setTimeout(() => setPrintStage(2), 600);
    setTimeout(() => setPrintStage(3), 1200);

    const chosenGiftObj = paymentGifts.find((g) => g.id === selectedGiftId);
    try {
      await onSubmitOrder({
        customer,
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        email: customer.email.trim(),
        note: customer.note.trim(),
        address: shippingAddress.trim(),
        paymentMethod,
        giftTitle: paymentMethod !== 'cod' ? (chosenGiftObj?.title || '') : 'Không áp dụng (COD)',
        total: finalTotalAmount,
        rawTotal: totalAmount,
        discount: discountAmount,
        voucherCode: appliedVouchers.map(v => v.code).join(', '),
        appliedVouchers: calculatedVouchers,
        cart,
      });
    } catch (err) {
      alert('Lỗi tạo đơn hàng!');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cart.length) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-stone-900">Giỏ hàng của bạn đang trống</h2>
        <button onClick={() => onNavigate?.('shop')} className="px-5 py-2.5 rounded-2xl bg-amber-600 text-white font-bold text-xs">
          Quay lại gian hàng
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 font-sans">
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden relative">
        {isSubmitting && (
          <CheckoutReceiptModal
            customer={customer}
            paymentMethod={paymentMethod}
            cart={cart}
            discountAmount={discountAmount}
            finalTotalAmount={finalTotalAmount}
            printStage={printStage}
            hotline={shopConfig?.hotline}
          />
        )}

        <div className="bg-stone-900 text-white p-4 sm:p-5 flex items-center gap-3">
          <button onClick={() => onNavigate?.('shop')} className="p-2 hover:bg-stone-800 rounded-xl text-stone-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-black">Xác Nhận Đặt Hàng - Xứ Nắng Gió</h2>
            <p className="text-xs text-stone-400">Nông sản thu hái tại giàn, bao ăn từng trái</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between gap-5 h-full">
            <div className="space-y-4">
              <OrderItemsList cart={cart} totalAmount={totalAmount} />
              {paymentMethod !== 'cod' && (
                <PaymentGiftSelector paymentGifts={paymentGifts} selectedGiftId={selectedGiftId} onSelectGift={setSelectedGiftId} />
              )}
              <CustomerInfoForm
                customer={customer}
                setCustomer={setCustomer}
                shippingAddress={shippingAddress}
                setShippingAddress={setShippingAddress}
                formErrors={formErrors}
                setFormErrors={setFormErrors}
                validateName={validateName}
                validatePhone={validatePhone}
                validateEmail={validateEmail}
                customerHistory={customerHistory}
                singleSuggestedVoucher={singleSuggestedVoucher}
                isPromoDismissed={isPromoDismissed}
                setIsPromoDismissed={setIsPromoDismissed}
                onApplySpecificCode={applySpecificCode}
              />
            </div>
            <ShippingPolicyCard shouldShowFullPolicy={cart.length <= 2} hotline={shopConfig?.hotline} />
          </div>

          <div className="lg:col-span-5 bg-stone-50/90 rounded-3xl p-4 sm:p-5 border border-stone-200/90 shadow-xs flex flex-col justify-between gap-4 h-full">
            <div className="space-y-4">
              <VoucherSection
                voucherInput={voucherInput}
                setVoucherInput={setVoucherInput}
                appliedVouchers={appliedVouchers}
                calculatedVouchers={calculatedVouchers}
                voucherError={voucherError}
                onApplyVoucher={() => applySpecificCode(voucherInput)}
                onRemoveVoucher={(code) => setAppliedVouchers(prev => prev.filter(v => v.code !== code))}
              />
              <PaymentMethodSelector
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                customerHistory={customerHistory}
                depositAmount={depositAmount}
              />
              {paymentMethod === 'cod' ? (
                <CodTimeline finalTotalAmount={finalTotalAmount} />
              ) : (
                <VietQrBox
                  paymentMethod={paymentMethod}
                  depositAmount={depositAmount}
                  finalTotalAmount={finalTotalAmount}
                  bankBin={shopConfig?.bankBin || '970422'}
                  bankName={shopConfig?.bankName || 'MB'}
                  accountNo={shopConfig?.accountNo || '0848957345'}
                  accountName={shopConfig?.accountName || 'TO THANH TAM'}
                  cleanPhone={cleanPhone}
                />
              )}
            </div>
            <OrderSummaryCard
              totalAmount={totalAmount}
              discountAmount={discountAmount}
              finalTotalAmount={finalTotalAmount}
              paymentMethod={paymentMethod}
              depositAmount={depositAmount}
              isSubmitting={isSubmitting}
            />
          </div>
        </form>
      </div>
    </div>
  );
}