// src/hooks/useCartManager.js
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export function useCartManager() {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('shop_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const [forceNavVisible, setForceNavVisible] = useState(false);
  const [centerSplash, setCenterSplash] = useState(null);
  const [removedItemsNotice, setRemovedItemsNotice] = useState(null);

  const splashTimerRef = useRef(null);
  const navTimerRef = useRef(null);
  const bounceTimerRef = useRef(null);
  const cartUpdateTimerRef = useRef(null);

  // 1. Lưu giỏ hàng vào localStorage mỗi khi state cart thay đổi ở tab hiện tại
  useEffect(() => {
    try {
      localStorage.setItem('shop_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Lỗi lưu giỏ hàng vào localStorage:', e);
    }
  }, [cart]);

  // 2. Đồng bộ đa tab: Tab này thanh toán hoặc xoá giỏ, các tab khác tự cập nhật ngay lập tức
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'shop_cart') {
        try {
          const newCart = e.newValue ? JSON.parse(e.newValue) : [];
          setCart(newCart);
        } catch {
          setCart([]);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 3. Dọn dẹp timers khi component unmount
  useEffect(() => {
    return () => {
      if (splashTimerRef.current) clearTimeout(splashTimerRef.current);
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
      if (bounceTimerRef.current) clearTimeout(bounceTimerRef.current);
      if (cartUpdateTimerRef.current) clearTimeout(cartUpdateTimerRef.current);
    };
  }, []);

  // 4. Đồng bộ giỏ hàng theo danh mục sản phẩm mới nhất từ Database
  const syncCartWithMasterData = useCallback((latestProducts) => {
    if (!Array.isArray(latestProducts)) return;

    setCart((prevCart) => {
      if (!Array.isArray(prevCart) || prevCart.length === 0) return prevCart;

      const productMap = new Map(latestProducts.map((p) => [String(p.id), p]));
      let hasCartChanged = false;
      const removedNames = [];

      // Lọc bỏ sản phẩm đã bị xoá khỏi Database
      const cleanCart = prevCart.filter((item) => {
        const prodId = String(item.productId || item.id).split('-')[0];
        const exists = productMap.has(prodId) || productMap.has(String(item.productId)) || productMap.has(String(item.id));

        if (!exists) {
          hasCartChanged = true;
          const name = item.name || 'Sản phẩm';
          if (!removedNames.includes(name)) {
            removedNames.push(name);
          }
          return false;
        }
        return true;
      });

      // Bật thông báo dịu mắt khi có món bị gỡ
      if (removedNames.length > 0) {
        setRemovedItemsNotice(removedNames);
      }

      // Cập nhật giá mới nhất cho các món còn tồn tại
      const updatedCart = cleanCart.map((item) => {
        const prodId = String(item.productId || item.id).split('-')[0];
        const freshProd = productMap.get(prodId) || productMap.get(String(item.productId)) || productMap.get(String(item.id));
        if (!freshProd) return item;

        const base = Number(freshProd.basePrice ?? freshProd.base_price ?? freshProd.price ?? 0);
        let finalUnitPrice = base;

        const rawWeights = freshProd.product_weights || freshProd.weights;
        if (Array.isArray(rawWeights) && rawWeights.length > 0) {
          const matchedWeight = rawWeights.find(
            (w) => String(w.id) === String(item.weightId) || 
                   String(w.weight_key) === String(item.weightId) ||
                   (w.weight_label || w.label) === item.weightLabel
          );
          if (matchedWeight) {
            const override = matchedWeight.price_override != null && matchedWeight.price_override !== ''
              ? Number(matchedWeight.price_override)
              : null;
            const mult = parseFloat(matchedWeight.multiplier) || 1;

            if (override != null && override > 0) {
              finalUnitPrice = override < 10000 && base >= 20000 ? base + override : override;
            } else {
              finalUnitPrice = Math.round(base * mult);
            }
          }
        }

        if (finalUnitPrice !== Number(item.price)) {
          hasCartChanged = true;
          return {
            ...item,
            name: freshProd.name || freshProd.title || item.name,
            basePrice: base,
            base_price: base,
            price: finalUnitPrice,
            inStock: freshProd.in_stock ?? freshProd.inStock ?? true
          };
        }

        return item;
      });

      if (hasCartChanged) {
        try {
          localStorage.setItem('shop_cart', JSON.stringify(updatedCart));
        } catch (e) {
          console.error(e);
        }
        return updatedCart;
      }

      return prevCart;
    });
  }, []);

  // 5. Thêm món vào giỏ kèm hiệu ứng splash
  const handleAddToCart = useCallback((product, weightObj, quantity = 1) => {
    if (splashTimerRef.current) clearTimeout(splashTimerRef.current);
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    if (bounceTimerRef.current) clearTimeout(bounceTimerRef.current);
    if (cartUpdateTimerRef.current) clearTimeout(cartUpdateTimerRef.current);

    const multiplier = weightObj?.multiplier || 1;
    const bonus = weightObj?.priceBonus || 0;
    const base = Number(product.basePrice || product.base_price || product.price || 0);

    let unitPrice = Math.round((base + bonus) * multiplier);
    if (weightObj?.priceOverride != null && weightObj.priceOverride > 0) {
      unitPrice = weightObj.priceOverride < 10000 && base >= 20000
        ? base + weightObj.priceOverride + bonus
        : weightObj.priceOverride + bonus;
    }

    const flavorTag = weightObj?.flavor ? `-${weightObj.flavor}` : '';
    const cartItemId = `${product.id}-${weightObj?.id || 'std'}${flavorTag}`;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === cartItemId || item.cartItemId === cartItemId);
      const currentQtyInCart = existing ? existing.quantity : 0;
      const newTotalQuantity = currentQtyInCart + quantity;

      setCenterSplash({
        id: Date.now() + Math.random(),
        image: product.image,
        addedQuantity: quantity,
        totalQuantity: newTotalQuantity,
        productName: product.name
      });

      if (existing) {
        return prevCart.map((item) =>
          (item.id === cartItemId || item.cartItemId === cartItemId)
            ? { ...item, quantity: item.quantity + quantity, price: unitPrice }
            : item
        );
      }

      return [
        ...prevCart,
        {
          id: cartItemId,
          cartItemId,
          productId: product.id,
          weightId: weightObj?.id || 'std',
          name: product.name,
          price: unitPrice,
          flavor: weightObj?.flavor || null,
          weightLabel: weightObj?.label || product.unit || 'Tiêu chuẩn',
          image: product.image,
          campaign_gift: product.campaign_gift_id || product.campaign_gift || null,
          campaign_gift_title: product.campaign_tag || product.campaign_gift_title || null,
          quantity
        }
      ];
    });

    setForceNavVisible(true);
    setIsCartBouncing(false);

    cartUpdateTimerRef.current = setTimeout(() => {
      setIsCartBouncing(true);
      bounceTimerRef.current = setTimeout(() => {
        setIsCartBouncing(false);
      }, 500);
    }, 200);

    splashTimerRef.current = setTimeout(() => {
      setCenterSplash(null);
    }, 850);

    navTimerRef.current = setTimeout(() => {
      setForceNavVisible(false);
    }, 1800);
  }, []);

  // 6. Cập nhật số lượng món
  const handleUpdateQuantity = useCallback((target, delta) => {
    const targetId = typeof target === 'object' ? (target.id || target.cartItemId || target.productId) : target;
    const targetWeightId = typeof target === 'object' ? (target.weightId || null) : null;

    setCart((prevCart) =>
      prevCart
        .map((item) => {
          const isMatch = (item.id === targetId) || 
                          (item.cartItemId === targetId) || 
                          (item.productId === targetId && (!targetWeightId || item.weightId === targetWeightId));

          if (isMatch) {
            const nextQty = (Number(item.quantity) || 1) + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  }, []);

  // 7. Xoá món khỏi giỏ hàng
  const handleRemoveCartItem = useCallback((target, weightId = null) => {
    setCart((prevCart) => {
      const targetCartItemId = typeof target === 'object' ? (target.cartItemId || target.id) : target;
      const targetProductId = typeof target === 'object' ? (target.productId || target.id) : target;
      const targetWeightId = typeof target === 'object' ? (target.weightId || null) : weightId;

      const nextCart = prevCart.filter((item) => {
        if (item.cartItemId && item.cartItemId === targetCartItemId) return false;
        if (item.id && item.id === targetCartItemId) return false;

        const itemProdId = String(item.productId || item.id);
        const matchProd = itemProdId === String(targetProductId);
        if (matchProd) {
          if (!targetWeightId || String(item.weightId) === String(targetWeightId)) {
            return false;
          }
        }

        return true;
      });

      try {
        localStorage.setItem('shop_cart', JSON.stringify(nextCart));
      } catch (e) {
        console.error(e);
      }
      return nextCart;
    });
  }, []);

  // 8. Dọn sạch giỏ hàng (Sau khi đặt hàng thành công)
  const clearCart = useCallback(() => {
    setCart([]);
    try {
      localStorage.removeItem('shop_cart');
      localStorage.setItem('shop_cart', JSON.stringify([]));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const totalCartCount = useMemo(() => cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0), [cart]);
  const totalCartAmount = useMemo(() => cart.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0), [cart]);

  return {
    cart,
    setCart,
    clearCart,
    totalCartCount,
    totalCartAmount,
    isCartBouncing,
    forceNavVisible,
    centerSplash,
    removedItemsNotice,
    setRemovedItemsNotice,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveCartItem,
    syncCartWithMasterData
  };
}