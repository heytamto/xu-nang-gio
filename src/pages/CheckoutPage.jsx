// src/pages/CheckoutPage.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ArrowLeft, ShoppingBag, ArrowRight } from 'lucide-react';
import { ORDER_STATUS, normalizeOrderStatus } from '../constants/orderStatus';
import { useServerReconcile } from '../hooks/useServerReconcile';

import { 
  validateName, 
  validatePhone, 
  validateEmail, 
  validateAddress,
  isValidVietnamesePhone 
} from '../utils/checkoutValidation';

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
  onUpdateQuantity,
  onRemoveItem,
}) {
  const [customer, setCustomer] = useState(() => {
    try {
      const saved = localStorage.getItem('shop_last_customer');
      return saved ? JSON.parse(saved) : { name: '', phone: '', email: '', note: '' };
    } catch {
      return { name: '', phone: '', email: '', note: '' };
    }
  });

  const [shippingAddress, setShippingAddress] = useState(() => {
    try {
      return localStorage.getItem('shop_last_address') || '';
    } catch {
      return '';
    }
  });

  const [paymentMethod, setPaymentMethod] = useState('deposit');
  const [selectedGiftId, setSelectedGiftId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printStage, setPrintStage] = useState(1);
  const [isPromoDismissed, setIsPromoDismissed] = useState(false);
  const [formErrors, setFormErrors] = useState({ name: '', phone: '', email: '' });
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVouchers, setAppliedVouchers] = useState([]);
  const [voucherError, setVoucherError] = useState('');

  const cleanPhone = useMemo(() => customer.phone.trim().replace(/[^0-9]/g, ''), [customer.phone]);
  const prevPhoneRef = useRef(cleanPhone);
  const voucherCodeString = useMemo(() => appliedVouchers.map((v) => v.code).join(', '), [appliedVouchers]);

  const isPhoneValid = useMemo(() => isValidVietnamesePhone(cleanPhone), [cleanPhone]);

  useEffect(() => {
    if (!isPhoneValid) {
      if (appliedVouchers.length > 0) {
        setAppliedVouchers([]);
        setVoucherInput('');
        setVoucherError('');
      }
    } else if (prevPhoneRef.current && prevPhoneRef.current !== cleanPhone) {
      setAppliedVouchers([]);
      setVoucherInput('');
      setVoucherError('');
    }
    prevPhoneRef.current = cleanPhone;
  }, [cleanPhone, isPhoneValid, appliedVouchers.length]);

  const customerHistory = useMemo(() => {
    if (!isPhoneValid) return null;

    try {
      const localOrders = JSON.parse(localStorage.getItem('shop_orders') || '[]');
      const sheetOrders = Array.isArray(shopConfig?.orders) ? shopConfig.orders : [];
      const allOrdersMap = new Map();
      sheetOrders.forEach((o) => { if (o?.code || o?.orderId) allOrdersMap.set(o.code || o.orderId, o); });
      localOrders.forEach((o) => { if (o?.code || o?.orderId) allOrdersMap.set(o.code || o.orderId, o); });
      const combinedOrders = Array.from(allOrdersMap.values());

      const matchedOrders = combinedOrders.filter((ord) => {
        const ordPhone = String(ord.phone || ord['Số Điện Thoại'] || ord.customer?.phone || '').replace(/[^0-9]/g, '');
        return ordPhone && (ordPhone.endsWith(cleanPhone.slice(-8)) || cleanPhone.endsWith(ordPhone.slice(-8)));
      });

      if (matchedOrders.length > 0) {
        matchedOrders.sort((a, b) => parseDateForSort(b.createdAt) - parseDateForSort(a.createdAt));
        const latestOrder = matchedOrders[0];
        const isLatestSuccess = latestOrder && !isBadOrderStatus(latestOrder.status);

        const validOrders = matchedOrders.filter((ord) => !isBadOrderStatus(ord.status));
        const hasSuccess = validOrders.length > 0;

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

        const isPardoned = isLatestSuccess && hasSuccess;
        const activeBombedRisk = !isPardoned && bombedOrders.length > 0;
        const activeFrequentCanceller = !isPardoned && cancelledOrders.length >= 2;

        const latestSuccessOrder = hasSuccess ? validOrders[0] : null;
        const hasUnusedOldCode = Boolean(
          latestSuccessOrder && !combinedOrders.some((ord) => ord.usedPreviousOrderCode === (latestSuccessOrder.code || latestSuccessOrder.orderId))
        );

        return {
          isOldCustomer: hasSuccess,
          isPardoned,
          onlyHasBadHistory: !hasSuccess && (bombedOrders.length > 0 || cancelledOrders.length > 0),
          orderCount: validOrders.length,
          hasBombedHistory: activeBombedRisk,
          isFrequentCanceller: activeFrequentCanceller,
          isRiskCustomer: activeBombedRisk || activeFrequentCanceller,
          latestOrderCode: latestSuccessOrder ? (latestSuccessOrder.code || latestSuccessOrder.orderId) : null,
          canUseOldCode: hasUnusedOldCode,
          previousInfo: latestSuccessOrder ? {
            name: String(latestSuccessOrder.customerName || latestSuccessOrder.name || latestSuccessOrder.customer?.name || ''),
            address: String(latestSuccessOrder.address || latestSuccessOrder.customer?.address || ''),
            email: String(latestSuccessOrder.email || latestSuccessOrder['Email'] || latestSuccessOrder.customer?.email || '')
          } : null,
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
      canUseOldCode: false,
      previousInfo: null
    };
  }, [cleanPhone, isPhoneValid, shopConfig?.orders]);

  // Đối soát giá và chữ ký bảo mật âm thầm từ Edge Worker Proxy
  const { serverState } = useServerReconcile({
    cart,
    cleanPhone: isPhoneValid ? cleanPhone : '',
    voucherCode: voucherCodeString,
    shopConfig,
    customerHistory
  });

  const clientSubtotal = useMemo(() => cart.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0), [cart]);

  const activeSubtotal = serverState ? serverState.subtotal : clientSubtotal;
  const activeDiscount = serverState ? serverState.totalDiscount : 0;
  const activeFinalTotal = serverState ? serverState.finalTotal : clientSubtotal;

  const activeCart = useMemo(() => {
    if (!cart || cart.length === 0) return [];
    if (serverState?.cart && serverState.cart.length === cart.length) {
      return serverState.cart;
    }
    return cart;
  }, [cart, serverState?.cart]);

  const paymentGifts = useMemo(() => Array.isArray(shopConfig?.paymentGifts) ? shopConfig.paymentGifts : [], [shopConfig?.paymentGifts]);
  const depositAmount = Number(shopConfig?.depositAmount) || 50000;

  useEffect(() => {
    if (customerHistory?.hasBombedHistory || serverState?.isRiskCustomer) {
      if (paymentMethod !== 'full_qr') setPaymentMethod('full_qr');
    } else if (customerHistory?.isFrequentCanceller && paymentMethod === 'cod') {
      setPaymentMethod('deposit');
    }
  }, [customerHistory, serverState?.isRiskCustomer, paymentMethod]);

  const isLoyaltyCodeApplied = useMemo(() => appliedVouchers.some((v) => v.code === customerHistory?.latestOrderCode || v.usedPreviousOrderCode || v.code.startsWith('XNG')), [appliedVouchers, customerHistory?.latestOrderCode]);
  const isWelcomeCodeApplied = useMemo(() => appliedVouchers.some((v) => v.code === 'LAMQUEN'), [appliedVouchers]);

  const singleSuggestedVoucher = useMemo(() => {
    if (!customerHistory || !isPhoneValid) return null;
    
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
  }, [customerHistory, isPhoneValid, isLoyaltyCodeApplied, isWelcomeCodeApplied, shopConfig?.loyaltyDiscountPercent, shopConfig?.vouchers]);

  const applySpecificCode = (codeToApply) => {
    setVoucherError('');
    const code = codeToApply.trim().toUpperCase();
    if (!code) return;

    if (appliedVouchers.some((v) => v.code === code)) {
      setVoucherError(`Mã "${code}" đã được áp dụng.`);
      return;
    }

    setAppliedVouchers((prev) => [...prev, { code }]);
    setVoucherInput('');
  };

  const handleRemoveVoucher = (code) => {
    setAppliedVouchers((prev) => prev.filter((v) => v.code !== code));
    setVoucherError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nameErr = validateName(customer.name);
    const phoneErr = validatePhone(customer.phone);
    const emailErr = validateEmail(customer.email);
    const addressErr = validateAddress(shippingAddress);

    setFormErrors({ name: nameErr, phone: phoneErr, email: emailErr });
    if (nameErr || phoneErr || emailErr) return;

    if (addressErr) {
      alert(addressErr);
      return;
    }

    if ((customerHistory?.hasBombedHistory || serverState?.isRiskCustomer) && paymentMethod !== 'full_qr') {
      alert('Đơn hàng này cần thanh toán chuyển khoản 100% trước khi nhà vườn cắt hái!');
      setPaymentMethod('full_qr');
      return;
    }

    setIsSubmitting(true);
    setPrintStage(1);
    setTimeout(() => setPrintStage(2), 600);
    setTimeout(() => setPrintStage(3), 1200);

    const chosenGiftObj = paymentGifts.find((g) => g.id === selectedGiftId);
    const previousOrderCodeUsed = appliedVouchers.find((v) => v.code.startsWith('XNG'))?.code || '';

    try {
      localStorage.setItem('shop_last_customer', JSON.stringify(customer));
      localStorage.setItem('shop_last_address', shippingAddress);
    } catch (err) {
      console.error(err);
    }

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

        subtotal: activeSubtotal,
        finalTotal: activeFinalTotal,
        edgeSignature: serverState?.signature || '',

        total: activeFinalTotal,
        rawTotal: activeSubtotal,
        discount: activeDiscount,

        voucherCode: appliedVouchers.map((v) => v.code).filter(Boolean).join(', '),
        usedPreviousOrderCode: previousOrderCodeUsed,
        appliedVouchers: serverState?.appliedVouchers || appliedVouchers,
        cart: activeCart,
      });
    } catch (err) {
      alert('Lỗi tạo đơn hàng!');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cart.length) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 font-sans">
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl p-8 sm:p-12 text-center max-w-md mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center mx-auto mb-5 shadow-inner">
            <ShoppingBag className="w-10 h-10 stroke-[1.8]" />
          </div>

          <h2 className="text-xl font-black text-stone-900 tracking-tight">
            Giỏ hàng của bạn đang trống
          </h2>
          
          <p className="text-xs sm:text-sm text-stone-500 mt-2 leading-relaxed">
            Hiện chưa có thức quà nào trong giỏ. Ghé thăm gian hàng vườn để chọn nho tươi, táo giòn cắt cành nhé!
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => onNavigate?.('shop')}
              className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Ghé Gian Hàng</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('home')}
              className="px-6 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Về Trang Chủ
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-stone-100 flex items-center justify-center gap-4 text-[11px] text-stone-400 font-medium">
            <span>🌿 Hái tươi tại vườn</span>
            <span>•</span>
            <span>🚚 Giao tận nhà</span>
            <span>•</span>
            <span>🛡️ Bao ăn từng quả</span>
          </div>
        </div>
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
            cart={activeCart}
            discountAmount={activeDiscount}
            finalTotalAmount={activeFinalTotal}
            printStage={printStage}
            hotline={shopConfig?.hotline}
          />
        )}

        <div className="bg-stone-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => onNavigate?.('shop')} 
              className="p-2 hover:bg-stone-800 rounded-xl text-stone-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-black">Xác Nhận Đặt Hàng - Xứ Nắng Gió</h2>
              <p className="text-xs text-stone-400">Nông sản thu hái tại giàn, bao ăn từng trái</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between gap-5 h-full">
            <div className="space-y-4">
              <OrderItemsList 
                cart={activeCart} 
                totalAmount={activeSubtotal} 
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={onRemoveItem}
              />
              {paymentMethod !== 'cod' && (
                <PaymentGiftSelector 
                  paymentGifts={paymentGifts} 
                  selectedGiftId={selectedGiftId} 
                  onSelectGift={setSelectedGiftId} 
                />
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
            <ShippingPolicyCard shouldShowFullPolicy={activeCart.length <= 2} hotline={shopConfig?.hotline} />
          </div>

          <div className="lg:col-span-5 bg-stone-50/90 rounded-3xl p-4 sm:p-5 border border-stone-200/90 shadow-xs flex flex-col justify-between gap-4 h-full">
            <div className="space-y-4">
              <VoucherSection
                voucherInput={voucherInput}
                setVoucherInput={setVoucherInput}
                appliedVouchers={appliedVouchers}
                calculatedVouchers={serverState?.appliedVouchers || appliedVouchers}
                voucherError={voucherError || (serverState?.rejectedVouchers?.length ? `Mã không áp dụng được: ${serverState.rejectedVouchers.join(', ')}` : '')}
                isValidating={false}
                onApplyVoucher={() => applySpecificCode(voucherInput)}
                onRemoveVoucher={handleRemoveVoucher}
              />
              <PaymentMethodSelector
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                customerHistory={customerHistory}
                depositAmount={depositAmount}
              />
              {paymentMethod === 'cod' ? (
                <CodTimeline finalTotalAmount={activeFinalTotal} />
              ) : (
                <VietQrBox
                  paymentMethod={paymentMethod}
                  depositAmount={depositAmount}
                  finalTotalAmount={activeFinalTotal}
                  bankBin={shopConfig?.bankBin || '970422'}
                  bankName={shopConfig?.bankName || 'MB'}
                  accountNo={shopConfig?.accountNo || '0848957345'}
                  accountName={shopConfig?.accountName || 'TO THANH TAM'}
                  cleanPhone={cleanPhone}
                />
              )}
            </div>
            <OrderSummaryCard
              totalAmount={activeSubtotal}
              discountAmount={activeDiscount}
              finalTotalAmount={activeFinalTotal}
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