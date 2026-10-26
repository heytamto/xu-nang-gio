// src/pages/CheckoutPage.jsx
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ShoppingBag, ArrowRight, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { ORDER_STATUS, normalizeOrderStatus } from '../constants/orderStatus';
import { 
  validateVoucherCode,
  findEligiblePreviousOrderVoucher,
  checkCustomerOrderRisk 
} from '../services/orderService';
import { generatePrefixedDateId } from '../utils/idGenerator';

import { 
  validateName, 
  validatePhone, 
  validateEmail, 
  validateAddress, 
  isValidVietnamesePhone 
} from '../utils/validationUtils';

import OrderItemsList from '../components/checkout/OrderItemsList';
import PaymentGiftSelector from '../components/checkout/PaymentGiftSelector';
import CustomerInfoForm from '../components/checkout/CustomerInfoForm';
import ShippingPolicyCard from '../components/checkout/ShippingPolicyCard';
import VoucherSection from '../components/checkout/VoucherSection';
import PaymentMethodSelector from '../components/checkout/PaymentMethodSelector';
import CodTimeline from '../components/checkout/CodTimeline';
import VietQrBox from '../components/checkout/VietQrBox';
import OrderSummaryCard from '../components/checkout/OrderSummaryCard';

function resolveDepositAmount(shopConfig) {
  const amount = 
    shopConfig?.payment?.depositAmount ?? 
    shopConfig?.payment_config?.depositAmount ?? 
    shopConfig?.depositAmount ?? 
    shopConfig?.deposit_amount;
    
  const num = Number(amount);
  return !isNaN(num) && num > 0 ? num : 50000;
}

function resolveBankConfig(shopConfig) {
  return {
    bankBin: String(shopConfig?.payment?.bankBin || shopConfig?.bankBin || import.meta.env?.VITE_BANK_BIN || '970422'),
    bankName: shopConfig?.payment?.bankName || shopConfig?.bankName || import.meta.env?.VITE_BANK_NAME || 'MBBank',
    accountNo: String(shopConfig?.payment?.accountNo || shopConfig?.accountNo || import.meta.env?.VITE_ACCOUNT_NO || '0848957345'),
    accountName: shopConfig?.payment?.accountName || shopConfig?.accountName || import.meta.env?.VITE_ACCOUNT_NAME || 'TO THANH TAM',
  };
}

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
  const [orderCode] = useState(() => generatePrefixedDateId('XNG'));

  // 1. STATE QUYỀN LỢI ĐỒNG BỘ REALTIME
  const [syncedCart, setSyncedCart] = useState(cart);
  const [paymentGifts, setPaymentGifts] = useState([]);
  const [liveConfig, setLiveConfig] = useState(shopConfig);
  const [priceChangeNotice, setPriceChangeNotice] = useState(null);
  const [isSyncingPrice, setIsSyncingPrice] = useState(false);

  // FIX LỖI CỐT LÕI: Tự động cập nhật syncedCart ngay khi prop cart ở App.jsx bị sửa số lượng hoặc xóa món
  useEffect(() => {
    setSyncedCart((prevSynced) => {
      // Map lại cart mới nhưng vẫn giữ các thông tin giá realtime đã được vườn sync
      const priceMap = new Map();
      prevSynced.forEach((item) => {
        const itemKey = item.key || item.productId || item.id;
        priceMap.set(itemKey, item.price);
      });

      return cart.map((item) => {
        const itemKey = item.key || item.productId || item.id;
        return {
          ...item,
          price: priceMap.has(itemKey) ? priceMap.get(itemKey) : item.price
        };
      });
    });
  }, [cart]);

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

  const [eligibleOldOrderVoucher, setEligibleOldOrderVoucher] = useState(null);

  const [dbRiskData, setDbRiskData] = useState({
    lastOrderBombed: false,
    twoRecentCancelled: false,
    isChecking: false
  });

  // REALTIME LISTENER
  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        const [giftsRes, configsRes] = await Promise.all([
          supabase.from('gifts').select('*').order('id', { ascending: true }),
          supabase.from('shop_configs').select('*')
        ]);

        if (isMounted) {
          if (Array.isArray(giftsRes.data)) setPaymentGifts(giftsRes.data);
          if (Array.isArray(configsRes.data)) {
            let merged = {};
            configsRes.data.forEach((r) => {
              const val = typeof r.value === 'string' ? JSON.parse(r.value || '{}') : r.value;
              merged = { ...merged, ...val };
            });
            setLiveConfig((prev) => ({ ...prev, ...merged }));
          }
        }
      } catch (err) {
        console.warn('Lỗi tải dữ liệu khởi tạo:', err);
      }
    };

    fetchInitialData();

    const masterChannel = supabase
      .channel('master-checkout-realtime-listener')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gifts' },
        (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'UPDATE') {
            setPaymentGifts((prev) => {
              const next = prev.map((g) => (g.id === payload.new.id ? payload.new : g));
              if (payload.new.id === selectedGiftId && payload.new.is_active === false) {
                const avail = next.filter((item) => item.is_active !== false);
                setSelectedGiftId(avail.length > 0 ? avail[0].id : '');
              }
              return next;
            });
          } else if (payload.eventType === 'INSERT') {
            setPaymentGifts((prev) => [...prev, payload.new]);
          } else if (payload.eventType === 'DELETE') {
            setPaymentGifts((prev) => prev.filter((g) => g.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => {
          if (!isMounted) return;
          const freshProd = payload.new;
          setSyncedCart((prevCart) => {
            let changed = false;
            const updated = prevCart.map((it) => {
              const cleanId = String(it.product_id || it.productId || it.id || '').split('-opt-')[0].split('_')[0].trim();
              if (cleanId === String(freshProd.id)) {
                const base = Number(freshProd.base_price ?? freshProd.basePrice ?? 0);
                let finalPrice = Number(it.price || base);

                const rawWeights = freshProd.product_weights || freshProd.weights;
                if (Array.isArray(rawWeights) && rawWeights.length > 0) {
                  const matchedWeight = rawWeights.find(
                    (w) => String(w.id) === String(it.weightId) || (w.weight_label || w.label) === it.weightLabel
                  );
                  if (matchedWeight) {
                    const override = matchedWeight.price_override != null && matchedWeight.price_override !== ''
                      ? Number(matchedWeight.price_override)
                      : null;
                    const mult = parseFloat(matchedWeight.multiplier) || 1;
                    finalPrice = (override != null && override > 0) ? override : Math.round(base * mult);
                  }
                }

                if (finalPrice !== Number(it.price)) {
                  changed = true;
                }

                return {
                  ...it,
                  name: freshProd.name || it.name,
                  title: freshProd.name || it.title,
                  price: finalPrice,
                  basePrice: base,
                  base_price: base,
                  inStock: freshProd.in_stock ?? true
                };
              }
              return it;
            });

            if (changed) {
              setPriceChangeNotice('Giá sản phẩm trong giỏ vừa được nhà vườn cập nhật mới.');
            }
            return updated;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vouchers' },
        (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'UPDATE') {
            setAppliedVouchers((prevApplied) =>
              prevApplied.map((v) => {
                if (v.code === payload.new.code) {
                  return {
                    ...v,
                    type: payload.new.type,
                    value: Number(payload.new.value) || 0,
                    percent: payload.new.type === 'percent' ? Number(payload.new.value) : undefined,
                    maxDiscount: Number(payload.new.max_discount ?? 0),
                    minOrder: Number(payload.new.min_order ?? 0),
                    canStack: Boolean(payload.new.can_stack)
                  };
                }
                return v;
              })
            );
          } else if (payload.eventType === 'DELETE') {
            setAppliedVouchers((prevApplied) =>
              prevApplied.filter((v) => v.code !== payload.old.code)
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shop_configs' },
        (payload) => {
          if (!isMounted || !payload.new) return;
          const val = typeof payload.new.value === 'string'
            ? JSON.parse(payload.new.value || '{}')
            : payload.new.value;
          setLiveConfig((prev) => ({ ...prev, ...val }));
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(masterChannel);
    };
  }, [selectedGiftId]);

  const cleanPhone = useMemo(() => customer.phone.trim().replace(/[^0-9]/g, ''), [customer.phone]);
  const prevPhoneRef = useRef(cleanPhone);
  const isPhoneValid = useMemo(() => isValidVietnamesePhone(cleanPhone), [cleanPhone]);

  const bankConfig = useMemo(() => resolveBankConfig(liveConfig), [liveConfig]);

  const isPaymentGiftsEnabled = useMemo(() => {
    return liveConfig?.enablePaymentGifts ?? liveConfig?.payment?.enableGifts ?? true;
  }, [liveConfig]);

  // Đồng bộ giá từ cơ sở dữ liệu cho lần đầu mở trang
  useEffect(() => {
    if (!cart.length) {
      setSyncedCart([]);
      return;
    }

    const syncPricesWithDatabase = async () => {
      setIsSyncingPrice(true);
      try {
        const productIds = cart
          .map((it) => {
            const rawId = it.product_id || it.productId || it.id || '';
            return String(rawId).split('-opt-')[0].split('_')[0].trim();
          })
          .filter(Boolean);

        if (!productIds.length) return;

        const { data: latestProducts, error } = await supabase
          .from('products')
          .select('id, name, base_price, in_stock, product_weights(*)')
          .in('id', productIds);

        if (error) throw error;

        if (Array.isArray(latestProducts) && latestProducts.length > 0) {
          const productMap = new Map(latestProducts.map((p) => [String(p.id), p]));
          let hasPriceChanged = false;

          setSyncedCart((currentSynced) =>
            currentSynced.map((cartItem) => {
              const rawId = cartItem.product_id || cartItem.productId || cartItem.id || '';
              const cleanId = String(rawId).split('-opt-')[0].split('_')[0].trim();
              const fresh = productMap.get(cleanId);
              if (!fresh) return cartItem;

              const base = Number(fresh.base_price ?? fresh.basePrice ?? 0);
              let finalPrice = Number(cartItem.price || base);

              const rawWeights = fresh.product_weights || fresh.weights;
              if (Array.isArray(rawWeights) && rawWeights.length > 0) {
                const matchedWeight = rawWeights.find(
                  (w) => String(w.id) === String(cartItem.weightId) || (w.weight_label || w.label) === cartItem.weightLabel
                );

                if (matchedWeight) {
                  const override = matchedWeight.price_override != null && matchedWeight.price_override !== ''
                    ? Number(matchedWeight.price_override)
                    : null;
                  const mult = parseFloat(matchedWeight.multiplier) || 1;

                  if (override != null && override > 0) {
                    finalPrice = override;
                  } else {
                    finalPrice = Math.round(base * mult);
                  }
                }
              } else {
                finalPrice = base;
              }

              if (finalPrice !== Number(cartItem.price)) {
                hasPriceChanged = true;
              }

              return {
                ...cartItem,
                name: fresh.name || cartItem.name,
                title: fresh.name || cartItem.title,
                price: finalPrice,
                basePrice: base,
                base_price: base,
                inStock: fresh.in_stock ?? true,
              };
            })
          );

          if (hasPriceChanged) {
            setPriceChangeNotice('Giá một số sản phẩm trong giỏ vừa được đồng bộ cập nhật theo bảng giá mới nhất từ vườn.');
          }
        }
      } catch (err) {
        console.warn('Không thể đồng bộ giá realtime:', err);
      } finally {
        setIsSyncingPrice(false);
      }
    };

    syncPricesWithDatabase();
  }, [cart.length]);

  // Kiểm tra rủi ro khách hàng
  useEffect(() => {
    if (!isPhoneValid || cleanPhone.length < 10) {
      setDbRiskData({
        lastOrderBombed: false,
        twoRecentCancelled: false,
        isChecking: false
      });
      return;
    }

    setDbRiskData((prev) => ({ ...prev, isChecking: true }));

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
        setDbRiskData((prev) => ({ ...prev, isChecking: false }));
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [cleanPhone, isPhoneValid]);

  // Reset voucher khi số điện thoại đổi
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

  // Lịch sử khách hàng
  const customerHistory = useMemo(() => {
    if (!isPhoneValid) return null;

    try {
      const localOrders = JSON.parse(localStorage.getItem('shop_orders') || '[]');
      const currentOrders = Array.isArray(liveConfig?.orders) ? liveConfig.orders : [];
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
  }, [cleanPhone, isPhoneValid, liveConfig?.orders, dbRiskData]);

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

  // Luôn lấy dữ liệu syncedCart chuẩn để tính toán
  const clientSubtotal = useMemo(() => {
    return syncedCart.reduce(
      (sum, item) => sum + (Number(item.price || item.base_price || item.basePrice || 0) * Number(item.quantity || 1)), 
      0
    );
  }, [syncedCart]);

  const standardShippingFee = Number(
    liveConfig?.shipping?.standardFee ?? 
    liveConfig?.standardFee ?? 
    liveConfig?.shippingFee ?? 
    30000
  );

  const freeShippingThreshold = Number(
    liveConfig?.shipping?.freeShippingMin ?? 
    liveConfig?.freeShippingMin ?? 
    liveConfig?.freeShippingThreshold ?? 
    500000
  );

  const shippingFee = useMemo(() => {
    if (clientSubtotal === 0) return 0;
    return clientSubtotal >= freeShippingThreshold ? 0 : standardShippingFee;
  }, [clientSubtotal, freeShippingThreshold, standardShippingFee]);

  const activeDiscount = useMemo(() => {
    if (!appliedVouchers.length) return 0;
    
    const rate = Number(liveConfig?.loyaltyDiscountPercent) || 10;
    const maxDisc = Number(liveConfig?.loyaltyMaxDiscount) || 50000;

    let totalDisc = 0;
    appliedVouchers.forEach((v) => {
      if (v.isPreviousOrder || v.isLoyalty || v.type === 'percent' || v.percent) {
        const currentRate = Number(v.percent ?? v.value ?? rate);
        const currentMax = Number(v.maxDiscount ?? maxDisc);
        const disc = Math.round((clientSubtotal * currentRate) / 100);
        totalDisc += currentMax > 0 ? Math.min(disc, currentMax) : disc;
      } else {
        totalDisc += Number(v.discount || v.value || 0);
      }
    });

    return Math.min(totalDisc, clientSubtotal);
  }, [appliedVouchers, clientSubtotal, liveConfig?.loyaltyDiscountPercent, liveConfig?.loyaltyMaxDiscount]);

  const activeFinalTotal = Math.max(0, clientSubtotal + shippingFee - activeDiscount);
  const activeSubtotal = clientSubtotal;
  const activeCart = syncedCart;

  const configuredDeposit = resolveDepositAmount(liveConfig);
  const depositAmount = Math.min(configuredDeposit, activeFinalTotal);

  useEffect(() => {
    if (customerHistory?.hasBombedHistory && !customerHistory?.isPardoned) {
      if (paymentMethod !== 'full_qr') setPaymentMethod('full_qr');
    } else if (customerHistory?.isFrequentCanceller && !customerHistory?.isPardoned && paymentMethod === 'cod') {
      setPaymentMethod('deposit');
    }
  }, [customerHistory, paymentMethod]);

  const isWelcomeCodeApplied = useMemo(() => appliedVouchers.some((v) => v.code === 'LAMQUEN'), [appliedVouchers]);

  const singleSuggestedVoucher = useMemo(() => {
    if (!customerHistory || !isPhoneValid) return null;
    
    if (eligibleOldOrderVoucher) {
      const isAlreadyApplied = appliedVouchers.some((v) => v.code === eligibleOldOrderVoucher.code);
      if (!isAlreadyApplied) {
        const rate = Number(liveConfig?.loyaltyDiscountPercent) || 10;
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
    liveConfig?.loyaltyDiscountPercent
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

  const processCheckoutSubmission = useCallback(async () => {
    const chosenGiftObj = paymentGifts.find((g) => g.id === selectedGiftId);
    
    const isGiftInStock = chosenGiftObj && chosenGiftObj.is_active !== false && chosenGiftObj.inStock !== false;
    const isGiftApplicable = isPaymentGiftsEnabled && paymentMethod !== 'cod' && isGiftInStock;
    const giftTitleToSave = isGiftApplicable 
      ? (chosenGiftObj?.title || chosenGiftObj?.name || '') 
      : 'Không áp dụng (COD / Hết quà)';

    const previousOrderCodeUsed = appliedVouchers.find((v) => v.isLoyalty || v.isPreviousOrder)?.code || '';

    const currentDepositExpected = paymentMethod === 'deposit' ? depositAmount : (paymentMethod === 'full_qr' ? activeFinalTotal : 0);
    const currentRemainingCod = paymentMethod === 'deposit' 
      ? Math.max(0, activeFinalTotal - currentDepositExpected) 
      : (paymentMethod === 'cod' ? activeFinalTotal : 0);

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
      payment_verified: false,
      paymentVerified: false,
      
      deposit_amount_expected: currentDepositExpected,
      deposit_paid: 0,
      remaining_cod: currentRemainingCod,
      giftTitle: giftTitleToSave,
      payment_gift: isGiftApplicable ? giftTitleToSave : null,

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
      status: ORDER_STATUS.PENDING
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
    isPaymentGiftsEnabled,
    appliedVouchers,
    orderCode,
    customer,
    cleanPhone,
    shippingAddress,
    paymentMethod,
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

    if (customerHistory?.hasBombedHistory && !customerHistory?.isPardoned && paymentMethod !== 'full_qr') {
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

  // Nếu giỏ hàng trống hoàn toàn
  if (!cart.length) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 font-sans text-stone-800">
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-7 animate-fadeIn">
          <div className="w-24 h-24 rounded-3xl bg-amber-50 border-2 border-amber-200/80 text-amber-800 flex items-center justify-center mx-auto shadow-inner">
            <ShoppingBag className="w-12 h-12 stroke-[2.2]" />
          </div>

          <div className="space-y-2.5 max-w-md mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Giỏ hàng của bạn đang trống
            </h2>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed font-normal">
              Hiện chưa có thức quà nào trong giỏ. Ghé thăm gian hàng vườn để chọn nho tươi, táo giòn cắt cành nhé!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3.5 justify-center pt-2">
            <button
              type="button"
              onClick={() => onNavigate?.('shop')}
              className="h-12 px-7 rounded-2xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-sm sm:text-base shadow-md shadow-amber-800/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2.5"
            >
              <span>GHÉ GIAN HÀNG</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('home')}
              className="h-12 px-6 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-sm sm:text-base transition-colors active:scale-95 cursor-pointer flex items-center justify-center"
            >
              Về Trang Chủ
            </button>
          </div>

          <div className="pt-6 border-t border-stone-100 flex flex-wrap items-center justify-center gap-4 sm:gap-7 text-xs sm:text-sm font-semibold text-stone-600">
            <span>🌿 Hái tươi tại vườn</span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-300 hidden sm:inline-block" />
            <span>🚚 Giao tận nhà</span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-300 hidden sm:inline-block" />
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
              {paymentMethod !== 'cod' && isPaymentGiftsEnabled && (
                <PaymentGiftSelector 
                  paymentGifts={paymentGifts} 
                  selectedGiftId={selectedGiftId} 
                  onSelectGift={setSelectedGiftId} 
                  isEnabled={isPaymentGiftsEnabled}
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
            <ShippingPolicyCard 
              shouldShowFullPolicy={activeCart.length <= 2} 
              hotline={liveConfig?.hotline} 
              shopConfig={liveConfig}
            />
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
                isPaymentGiftsEnabled={isPaymentGiftsEnabled}
              />
              {paymentMethod === 'cod' ? (
                <CodTimeline finalTotalAmount={activeFinalTotal} />
              ) : (
                <VietQrBox
                  paymentMethod={paymentMethod}
                  depositAmount={depositAmount}
                  finalTotalAmount={activeFinalTotal}
                  orderCode={orderCode}
                  bankBin={bankConfig.bankBin}
                  bankName={bankConfig.bankName}
                  accountNo={bankConfig.accountNo}
                  accountName={bankConfig.accountName}
                  cleanPhone={cleanPhone}
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
            />
          </div>
        </form>
      </div>
    </div>
  );
}