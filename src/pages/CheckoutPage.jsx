// src/pages/CheckoutPage.jsx
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ShoppingBag, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { ORDER_STATUS, normalizeOrderStatus } from '../constants/orderStatus';
import { 
  validateVoucherCode,
  findEligiblePreviousOrderVoucher,
  checkCustomerOrderRisk 
} from '../services/orderService';

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

function generateUniqueOrderCode() {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `XNG${dateStr}-${randomChars}`;
}

export default function CheckoutPage({
  cart = [],
  onSubmitOrder,
  onNavigate,
  shopConfig = {},
  onUpdateQuantity,
  onRemoveItem,
}) {
  const [orderCode] = useState(() => generateUniqueOrderCode());

  // 1. STATE ĐỒNG BỘ GIÁ & DỮ LIỆU REALTIME
  const [syncedCart, setSyncedCart] = useState(cart);
  const [priceChangeNotice, setPriceChangeNotice] = useState(null);
  const [isSyncingPrice, setIsSyncingPrice] = useState(false);

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
  const [isPromoDismissed, setIsPromoDismissed] = useState(false);
  const [formErrors, setFormErrors] = useState({ name: '', phone: '', email: '', address: '' });
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVouchers, setAppliedVouchers] = useState([]);
  const [voucherError, setVoucherError] = useState('');
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  
  const [isPaymentVerified, setIsPaymentVerified] = useState(false);
  const [verifiedAmount, setVerifiedAmount] = useState(0);

  const [eligibleOldOrderVoucher, setEligibleOldOrderVoucher] = useState(null);

  const [dbRiskData, setDbRiskData] = useState({
    lastOrderBombed: false,
    twoRecentCancelled: false,
    isChecking: false
  });

  const cleanPhone = useMemo(() => customer.phone.trim().replace(/[^0-9]/g, ''), [customer.phone]);
  const prevPhoneRef = useRef(cleanPhone);
  const isPhoneValid = useMemo(() => isValidVietnamesePhone(cleanPhone), [cleanPhone]);

  // -------------------------------------------------------------
  // TÍNH NĂNG 1: ĐỒNG BỘ GIÁ VÀ TỒN KHO REALTIME TỪ SUPABASE
  // -------------------------------------------------------------
  useEffect(() => {
    if (!cart.length) {
      setSyncedCart([]);
      return;
    }

    const syncPricesWithDatabase = async () => {
      setIsSyncingPrice(true);
      try {
        const productIds = cart.map((it) => it.id).filter(Boolean);
        if (!productIds.length) {
          setSyncedCart(cart);
          return;
        }

        const { data: latestProducts, error } = await supabase
          .from('products')
          .select('id, name, title, base_price, price, in_stock')
          .in('id', productIds);

        if (error) throw error;

        if (Array.isArray(latestProducts) && latestProducts.length > 0) {
          const productMap = new Map(latestProducts.map((p) => [String(p.id), p]));
          let hasPriceChanged = false;

          const updated = cart.map((cartItem) => {
            const fresh = productMap.get(String(cartItem.id));
            if (!fresh) return cartItem;

            const currentItemPrice = Number(cartItem.price ?? cartItem.base_price ?? cartItem.basePrice ?? 0);
            const freshPrice = Number(fresh.price ?? fresh.base_price ?? currentItemPrice);

            if (freshPrice !== currentItemPrice) {
              hasPriceChanged = true;
            }

            return {
              ...cartItem,
              title: fresh.title || fresh.name || cartItem.title || cartItem.name,
              price: freshPrice,
              basePrice: freshPrice,
              base_price: freshPrice,
              inStock: fresh.in_stock ?? true,
            };
          });

          setSyncedCart(updated);

          if (hasPriceChanged) {
            setPriceChangeNotice('Giá một số sản phẩm trong giỏ vừa được đồng bộ cập nhật theo bảng giá mới nhất từ vườn.');
            try {
              localStorage.setItem('shop_cart', JSON.stringify(updated));
            } catch (e) {
              console.error(e);
            }
          }
        } else {
          setSyncedCart(cart);
        }
      } catch (err) {
        console.warn('Không thể đồng bộ giá realtime, dùng giá cache:', err);
        setSyncedCart(cart);
      } finally {
        setIsSyncingPrice(false);
      }
    };

    syncPricesWithDatabase();
  }, [cart]);

  // -------------------------------------------------------------
  // TÍNH NĂNG 2: KIỂM TRA RỦI RO ĐƠN HÀNG (DEBOUNCED)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isPhoneValid || cleanPhone.length < 10) {
      setDbRiskData({
        lastOrderBombed: false,
        twoRecentCancelled: false,
        isChecking: false
      });
      return;
    }

    setDbRiskData(prev => ({ ...prev, isChecking: true }));

    const timer = setTimeout(async () => {
      try {
        const risk = await checkCustomerOrderRisk(cleanPhone);
        setDbRiskData({
          lastOrderBombed: Boolean(risk.lastOrderBombed),
          twoRecentCancelled: Boolean(risk.twoRecentCancelled),
          isChecking: false
        });
      } catch (err) {
        console.error('Lỗi kiểm tra rủi ro đơn hàng:', err);
        setDbRiskData(prev => ({ ...prev, isChecking: false }));
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [cleanPhone, isPhoneValid]);

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
      const currentOrders = Array.isArray(shopConfig?.orders) ? shopConfig.orders : [];
      const allOrdersMap = new Map();
      currentOrders.forEach((o) => { if (o?.code || o?.orderId) allOrdersMap.set(o.code || o.orderId, o); });
      localOrders.forEach((o) => { if (o?.code || o?.orderId) allOrdersMap.set(o.code || o.orderId, o); });
      const combinedOrders = Array.from(allOrdersMap.values());

      const matchedOrders = combinedOrders.filter((ord) => {
        const ordPhone = String(ord.phone || ord.customer?.phone || '').replace(/[^0-9]/g, '');
        return ordPhone && (ordPhone.endsWith(cleanPhone.slice(-8)) || cleanPhone.endsWith(ordPhone.slice(-8)));
      });

      let activeBombedRisk = dbRiskData.lastOrderBombed;
      let activeFrequentCanceller = dbRiskData.twoRecentCancelled;

      let validOrders = [];
      let hasSuccess = false;
      let latestSuccessOrder = null;
      let isLatestSuccess = false;

      if (matchedOrders.length > 0) {
        matchedOrders.sort((a, b) => parseDateForSort(b.created_at || b.createdAt) - parseDateForSort(a.created_at || a.createdAt));
        const latestOrder = matchedOrders[0];
        isLatestSuccess = latestOrder && !isBadOrderStatus(latestOrder.status);

        validOrders = matchedOrders.filter((ord) => !isBadOrderStatus(ord.status));
        hasSuccess = validOrders.length > 0;
        latestSuccessOrder = hasSuccess ? validOrders[0] : null;

        if (!activeBombedRisk) {
          const bombedOrders = matchedOrders.filter((ord) => {
            const norm = normalizeOrderStatus(ord.status);
            const raw = String(ord.status || '').toLowerCase();
            const pMethod = String(ord.payment_method || ord.paymentMethod || '').toLowerCase();
            const isPrepaid100 = pMethod.includes('100%') || pMethod === 'full_qr';
            return (norm === ORDER_STATUS.BOMBED || raw.includes('bom')) && !isPrepaid100;
          });
          const isPardoned = isLatestSuccess && hasSuccess;
          activeBombedRisk = !isPardoned && bombedOrders.length > 0;
        }

        if (!activeFrequentCanceller) {
          const cancelledOrders = matchedOrders.filter((ord) => {
            const norm = normalizeOrderStatus(ord.status);
            const raw = String(ord.status || '').toLowerCase();
            return norm === ORDER_STATUS.CANCELLED || raw.includes('hủy') || raw.includes('cancel');
          });
          const isPardoned = isLatestSuccess && hasSuccess;
          activeFrequentCanceller = !isPardoned && cancelledOrders.length >= 2;
        }
      }

      const hasUnusedOldCode = Boolean(
        latestSuccessOrder && !combinedOrders.some((ord) => ord.usedPreviousOrderCode === (latestSuccessOrder.code || latestSuccessOrder.orderId))
      );

      return {
        isOldCustomer: hasSuccess,
        isPardoned: isLatestSuccess && hasSuccess,
        onlyHasBadHistory: !hasSuccess && (activeBombedRisk || activeFrequentCanceller),
        orderCount: validOrders.length,
        hasBombedHistory: activeBombedRisk,
        isFrequentCanceller: activeFrequentCanceller,
        isRiskCustomer: activeBombedRisk || activeFrequentCanceller,
        lastOrderBombed: activeBombedRisk,
        twoRecentCancelled: activeFrequentCanceller,
        latestOrderCode: latestSuccessOrder ? (latestSuccessOrder.code || latestSuccessOrder.orderId) : null,
        canUseOldCode: hasUnusedOldCode,
        validOrders,
        allCombinedOrders: combinedOrders,
        previousInfo: latestSuccessOrder ? {
          name: String(latestSuccessOrder.customer_name || latestSuccessOrder.name || latestSuccessOrder.customer?.name || ''),
          address: String(latestSuccessOrder.address || latestSuccessOrder.customer?.address || ''),
          email: String(latestSuccessOrder.email || latestSuccessOrder.customer?.email || '')
        } : null,
      };
    } catch (e) {
      console.error('Lỗi tính toán lịch sử khách hàng:', e);
    }

    return { 
      isOldCustomer: false, 
      isPardoned: false, 
      onlyHasBadHistory: false, 
      orderCount: 0, 
      hasBombedHistory: dbRiskData.lastOrderBombed, 
      isFrequentCanceller: dbRiskData.twoRecentCancelled, 
      isRiskCustomer: dbRiskData.lastOrderBombed || dbRiskData.twoRecentCancelled, 
      lastOrderBombed: dbRiskData.lastOrderBombed,
      twoRecentCancelled: dbRiskData.twoRecentCancelled,
      latestOrderCode: null, 
      canUseOldCode: false,
      validOrders: [],
      allCombinedOrders: [],
      previousInfo: null
    };
  }, [cleanPhone, isPhoneValid, shopConfig?.orders, dbRiskData]);

  useEffect(() => {
    let isMounted = true;

    const checkEligibleOrder = async () => {
      if (customerHistory?.isOldCustomer && Array.isArray(customerHistory?.validOrders)) {
        const result = await findEligiblePreviousOrderVoucher(
          customerHistory.validOrders, 
          customerHistory.allCombinedOrders || []
        );
        if (isMounted) {
          setEligibleOldOrderVoucher(result);
        }
      } else {
        if (isMounted) setEligibleOldOrderVoucher(null);
      }
    };

    checkEligibleOrder();
    return () => { isMounted = false; };
  }, [customerHistory]);

  // -------------------------------------------------------------
  // TÍNH TOÁN DÒNG TIỀN: TIỀN HÀNG, PHÍ SHIP, GIẢM GIÁ, TỔNG TIỀN
  // -------------------------------------------------------------
  // 1. Tiền hàng nông sản (Tính trên syncedCart đã làm mới giá realtime)
  const clientSubtotal = useMemo(() => {
    return syncedCart.reduce(
      (sum, item) => sum + (Number(item.price || item.base_price || item.basePrice || 0) * Number(item.quantity || 1)), 
      0
    );
  }, [syncedCart]);

  // 2. Phí vận chuyển đọc linh hoạt từ shopConfig (ưu tiên dòng shipping)
  const standardShippingFee = Number(
    shopConfig?.shipping?.standardFee ?? 
    shopConfig?.standardFee ?? 
    shopConfig?.shippingFee ?? 
    30000
  );

  const freeShippingThreshold = Number(
    shopConfig?.shipping?.freeShippingMin ?? 
    shopConfig?.freeShippingMin ?? 
    shopConfig?.freeShippingThreshold ?? 
    500000
  );

  const shippingFee = useMemo(() => {
    if (clientSubtotal === 0) return 0;
    return clientSubtotal >= freeShippingThreshold ? 0 : standardShippingFee;
  }, [clientSubtotal, freeShippingThreshold, standardShippingFee]);

  // 3. Giảm giá từ voucher
  const activeDiscount = useMemo(() => {
    if (!appliedVouchers.length) return 0;
    
    const rate = Number(shopConfig?.loyaltyDiscountPercent) || 10;
    const maxDisc = Number(shopConfig?.loyaltyMaxDiscount) || 50000;

    let totalDisc = 0;
    appliedVouchers.forEach((v) => {
      if (v.isPreviousOrder || v.isLoyalty) {
        const currentRate = Number(v.percent) || rate;
        const currentMax = Number(v.maxDiscount) || maxDisc;
        const disc = Math.round((clientSubtotal * currentRate) / 100);
        totalDisc += Math.min(disc, currentMax);
      } else {
        totalDisc += Number(v.discount || v.value || 0);
      }
    });

    return Math.min(totalDisc, clientSubtotal);
  }, [appliedVouchers, clientSubtotal, shopConfig?.loyaltyDiscountPercent, shopConfig?.loyaltyMaxDiscount]);

  // 4. Tổng thanh toán cuối cùng = Tiền hàng + Phí vận chuyển - Giảm giá
  const activeFinalTotal = Math.max(0, clientSubtotal + shippingFee - activeDiscount);
  const activeSubtotal = clientSubtotal;
  const activeCart = syncedCart;

  const paymentGifts = useMemo(() => Array.isArray(shopConfig?.giftsCatalog) ? shopConfig.giftsCatalog : (shopConfig?.paymentGifts || []), [shopConfig]);
  
  // 5. Tiền cọc thực tế (Chặn trần nếu tổng đơn nhỏ hơn tiền cọc cấu hình)
  const configuredDeposit = Number(shopConfig?.depositAmount || shopConfig?.deposit_amount) || 50000;
  const depositAmount = Math.min(configuredDeposit, activeFinalTotal);

  useEffect(() => {
    if (customerHistory?.hasBombedHistory) {
      if (paymentMethod !== 'full_qr') setPaymentMethod('full_qr');
    } else if (customerHistory?.isFrequentCanceller && paymentMethod === 'cod') {
      setPaymentMethod('deposit');
    }
  }, [customerHistory, paymentMethod]);

  const isWelcomeCodeApplied = useMemo(() => appliedVouchers.some((v) => v.code === 'LAMQUEN'), [appliedVouchers]);

  const singleSuggestedVoucher = useMemo(() => {
    if (!customerHistory || !isPhoneValid) return null;
    
    if (eligibleOldOrderVoucher) {
      const isAlreadyApplied = appliedVouchers.some((v) => v.code === eligibleOldOrderVoucher.code);
      if (!isAlreadyApplied) {
        const rate = Number(shopConfig?.loyaltyDiscountPercent) || 10;
        return { 
          isLoyalty: true, 
          code: eligibleOldOrderVoucher.code, 
          title: `Tri ân khách quen (Đơn thứ ${customerHistory.orderCount + 1})`, 
          desc: `Giảm ${rate}% (tối đa 50.000đ) từ mã đơn ${eligibleOldOrderVoucher.code} đã đánh giá ${eligibleOldOrderVoucher.rating}★` 
        };
      }
      return null;
    }

    if (!customerHistory.isOldCustomer && !isWelcomeCodeApplied) {
      return { 
        isLoyalty: false, 
        code: 'LAMQUEN', 
        title: customerHistory.onlyHasBadHistory ? 'Mừng bạn quay lại đặt đơn!' : 'Chào bạn mới ghé vườn!', 
        desc: 'Ưu đãi cho đơn hàng hoàn tất đầu tiên' 
      };
    }

    return null;
  }, [
    customerHistory, 
    isPhoneValid, 
    eligibleOldOrderVoucher, 
    appliedVouchers, 
    isWelcomeCodeApplied,
    shopConfig?.loyaltyDiscountPercent
  ]);

  const applySpecificCode = async (codeToApply) => {
    setVoucherError('');
    const code = String(codeToApply || '').trim().toUpperCase();
    if (!code) return;

    if (code.startsWith('XNG') && !isPhoneValid) {
      setVoucherError('Vui lòng nhập số điện thoại hợp lệ trước khi áp dụng mã đơn cũ.');
      return;
    }

    setIsValidatingVoucher(true);
    const result = await validateVoucherCode(code, clientSubtotal, cleanPhone, appliedVouchers);
    setIsValidatingVoucher(false);

    if (!result.success) {
      setVoucherError(result.error);
      return;
    }

    setAppliedVouchers((prev) => [...prev, result.voucher]);
    setVoucherInput('');
  };

  const handleRemoveVoucher = (code) => {
    setAppliedVouchers((prev) => prev.filter((v) => v.code !== code));
    setVoucherError('');
  };

  // -------------------------------------------------------------
  // LẮNG NGHE REALTIME & POLLING XÁC NHẬN CHUYỂN KHOẢN NGÂN HÀNG
  // -------------------------------------------------------------
  useEffect(() => {
    if (paymentMethod === 'cod' || isPaymentVerified || !orderCode) return;

    const paymentChannel = supabase
      .channel(`payment-check:${orderCode}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `code=eq.${orderCode}`
        },
        (payload) => {
          const updated = payload.new;
          const status = normalizeOrderStatus(updated?.status);
          if (status === ORDER_STATUS.CONFIRMED || status === ORDER_STATUS.PACKING) {
            setIsPaymentVerified(true);
            setVerifiedAmount(Number(updated.deposit_paid || updated.total || depositAmount));
          }
        }
      )
      .subscribe();

    const pollInterval = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke('check-payment', {
          body: { orderCode }
        });

        if (data?.paid) {
          setIsPaymentVerified(true);
          setVerifiedAmount(Number(data.amount || depositAmount));
          clearInterval(pollInterval);
        }
      } catch (err) {
        // Bỏ qua lỗi polling tạm thời
      }
    }, 4000);

    return () => {
      supabase.removeChannel(paymentChannel);
      clearInterval(pollInterval);
    };
  }, [orderCode, paymentMethod, isPaymentVerified, depositAmount]);

  // -------------------------------------------------------------
  // XỬ LÝ ĐẶT HÀNG
  // -------------------------------------------------------------
  const processCheckoutSubmission = useCallback(async (overrides = {}) => {
    const chosenGiftObj = paymentGifts.find((g) => g.id === selectedGiftId);
    const previousOrderCodeUsed = appliedVouchers.find((v) => v.isLoyalty || v.isPreviousOrder)?.code || '';

    const isPrepaid = overrides.isPaymentVerified ?? isPaymentVerified;
    const initialStatus = isPrepaid ? ORDER_STATUS.CONFIRMED : ORDER_STATUS.PENDING;

    const orderPayload = {
      code: orderCode,
      orderCode: orderCode,
      customer,
      customer_name: customer.name.trim(),
      name: customer.name.trim(),
      phone: cleanPhone,
      email: customer.email.trim(),
      note: customer.note.trim(),
      address: shippingAddress.trim(),
      payment_method: paymentMethod,
      paymentMethod,
      payment_verified: isPrepaid,
      paymentVerified: isPrepaid,
      deposit_paid: isPrepaid ? (overrides.verifiedAmount ?? verifiedAmount ?? depositAmount) : 0,
      giftTitle: paymentMethod !== 'cod' ? (chosenGiftObj?.title || '') : 'Không áp dụng (COD)',

      subtotal: activeSubtotal,
      shipping_fee: shippingFee,
      shippingFee: shippingFee,
      final_total: activeFinalTotal,
      finalTotal: activeFinalTotal,
      total: activeFinalTotal,
      rawTotal: activeSubtotal,
      discount: activeDiscount,
      discountAmount: activeDiscount,

      voucherCode: appliedVouchers.map((v) => v.code).filter(Boolean).join(', '),
      usedPreviousOrderCode: previousOrderCodeUsed,
      used_previous_order_code: previousOrderCodeUsed,
      appliedVouchers,
      cart: activeCart,
      status: initialStatus
    };

    try {
      localStorage.setItem('shop_last_customer', JSON.stringify(customer));
      localStorage.setItem('shop_last_address', shippingAddress);
    } catch (err) {
      console.error(err);
    }

    if (onSubmitOrder) {
      await onSubmitOrder(orderPayload);
    }
  }, [
    paymentGifts,
    selectedGiftId,
    appliedVouchers,
    isPaymentVerified,
    orderCode,
    customer,
    cleanPhone,
    shippingAddress,
    paymentMethod,
    verifiedAmount,
    depositAmount,
    activeSubtotal,
    shippingFee,
    activeFinalTotal,
    activeDiscount,
    activeCart,
    onSubmitOrder
  ]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const nameErr = validateName(customer.name);
    const phoneErr = validatePhone(customer.phone);
    const emailErr = validateEmail(customer.email);
    const addressErr = validateAddress(shippingAddress);

    setFormErrors({ name: nameErr, phone: phoneErr, email: emailErr, address: addressErr });
    if (nameErr || phoneErr || emailErr || addressErr) return;

    if (customerHistory?.hasBombedHistory && paymentMethod !== 'full_qr') {
      alert('Đơn hàng này cần thanh toán chuyển khoản 100% trước khi nhà vườn cắt hái!');
      setPaymentMethod('full_qr');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      await processCheckoutSubmission();
    } catch (err) {
      console.error('Lỗi khi gửi đơn hàng:', err);
    } finally {
      setIsSubmittingOrder(false);
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

        {/* THÔNG BÁO CẬP NHẬT GIÁ REALTIME NẾU CÓ THAY ĐỔI */}
        {priceChangeNotice && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 px-6 flex items-center justify-between gap-3 text-xs text-amber-900 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{priceChangeNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setPriceChangeNotice(null)}
              className="text-amber-800 hover:text-amber-950 font-bold text-[11px] underline cursor-pointer"
            >
              Đã hiểu
            </button>
          </div>
        )}

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
                calculatedVouchers={appliedVouchers}
                voucherError={voucherError}
                isValidating={isValidatingVoucher}
                onApplyVoucher={() => applySpecificCode(voucherInput)}
                onRemoveVoucher={handleRemoveVoucher}
              />
              <PaymentMethodSelector
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                customerHistory={customerHistory}
                depositAmount={depositAmount}
                finalTotalAmount={activeFinalTotal}
              />
              {paymentMethod === 'cod' ? (
                <CodTimeline finalTotalAmount={activeFinalTotal} />
              ) : (
                <VietQrBox
                  paymentMethod={paymentMethod}
                  depositAmount={depositAmount}
                  finalTotalAmount={activeFinalTotal}
                  orderCode={orderCode}
                  bankBin={shopConfig?.bankBin || '970422'}
                  bankName={shopConfig?.bankName || 'MB'}
                  accountNo={shopConfig?.accountNo || '0848957345'}
                  accountName={shopConfig?.accountName || 'TO THANH TAM'}
                  cleanPhone={cleanPhone}
                  isPaymentVerified={isPaymentVerified}
                  verifiedAmount={verifiedAmount}
                />
              )}
            </div>
            <OrderSummaryCard
              totalAmount={activeSubtotal}
              shippingFee={shippingFee}
              freeShippingThreshold={freeShippingThreshold}
              discountAmount={activeDiscount}
              finalTotalAmount={activeFinalTotal}
              paymentMethod={paymentMethod}
              depositAmount={depositAmount}
              isSubmitting={isSubmittingOrder}
              isPaymentVerified={isPaymentVerified}
            />
          </div>
        </form>
      </div>
    </div>
  );
}