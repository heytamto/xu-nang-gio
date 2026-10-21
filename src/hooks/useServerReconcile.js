// src/hooks/useServerReconcile.js
import { useState, useEffect, useRef, useMemo } from 'react';

// In-memory cache tại trình duyệt: tránh gọi Worker trùng lặp nếu khách không đổi giỏ
const edgeCache = new Map();

export function useServerReconcile({ cart = [], cleanPhone = '', voucherCode = '' }) {
  const clientSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  }, [cart]);

  const [serverState, setServerState] = useState({
    subtotal: clientSubtotal,
    loyaltyDiscount: 0,
    voucherDiscount: 0,
    totalDiscount: 0,
    finalTotal: clientSubtotal,
    appliedVouchers: [],
    rejectedVouchers: [],
    cart: cart,
    signature: '',
    isRiskCustomer: false,
    orderCount: 0
  });

  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileError, setReconcileError] = useState(null);
  const debounceRef = useRef(null);

  // Khóa cache dựa trên tổ hợp: SĐT + Voucher + Giỏ hàng
  const cartSignature = useMemo(() => {
    return cart
      .map((i) => `${i.productId || i.id}_${i.weightId || 'std'}_${i.quantity}_${i.price}`)
      .sort()
      .join('|');
  }, [cart]);

  const cacheKey = `${cleanPhone}#${String(voucherCode || '').trim().toUpperCase()}#${cartSignature}`;

  useEffect(() => {
    if (!cart || cart.length === 0) {
      setServerState({
        subtotal: 0,
        loyaltyDiscount: 0,
        voucherDiscount: 0,
        totalDiscount: 0,
        finalTotal: 0,
        appliedVouchers: [],
        rejectedVouchers: [],
        cart: [],
        signature: '',
        isRiskCustomer: false,
        orderCount: 0
      });
      setIsReconciling(false);
      return;
    }

    // 1. HIT CACHE TRÌNH DUYỆT (0ms)
    if (edgeCache.has(cacheKey)) {
      setServerState(edgeCache.get(cacheKey));
      setReconcileError(null);
      setIsReconciling(false);
      return;
    }

    setIsReconciling(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // 2. GỬI REQUEST SANG CLOUDFLARE WORKER (Debounce ngắn 200ms)
    debounceRef.current = setTimeout(async () => {
      const workerUrl = import.meta.env.VITE_EDGE_WORKER_URL;
      if (!workerUrl) {
        setIsReconciling(false);
        return;
      }

      try {
        const miniCart = cart.map((i) => ({
          productId: i.productId || i.id,
          weightId: i.weightId || 'std',
          quantity: Math.max(1, Number(i.quantity) || 1),
          price: Number(i.price) || 0,
          name: i.name,
          campaign_gift: i.campaign_gift || null
        }));

        const response = await fetch(`${workerUrl}/api/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            cart: miniCart,
            voucherCode: voucherCode.trim(),
            phone: cleanPhone
          })
        });

        const res = await response.json();

        if (res && res.success && res.data) {
          edgeCache.set(cacheKey, res.data);
          setServerState(res.data);
          setReconcileError(null);
        } else {
          setReconcileError(res?.error || res?.message || 'Không thể xác thực giá từ Edge');
        }
      } catch (err) {
        console.warn('Lỗi gọi Edge Worker:', err);
        setReconcileError(err.message);
      } finally {
        setIsReconciling(false);
      }
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [cacheKey, cart, cleanPhone, voucherCode]);

  return { serverState, isReconciling, reconcileError };
}