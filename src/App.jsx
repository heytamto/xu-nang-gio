// src/App.jsx
import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { ShoppingBag, Loader2 } from 'lucide-react';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import OrderLookupModal from './components/OrderLookupModal';
import OrderSuccessModal from './components/checkout/OrderSuccessModal';
import NewProductAnnouncementBar from './components/NewProductAnnouncementBar';

import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import StoryPage from './pages/StoryPage';
import BlogPage from './pages/BlogPage';
import CheckoutPage from './pages/CheckoutPage';
import PolicyPage from './pages/PolicyPage';

// Lazy loading cho các trang quản trị để tối ưu bundle size cho khách hàng
const AdminPage = lazy(() => import('./pages/AdminPage'));
const PackingPage = lazy(() => import('./pages/PackingPage'));

import { getShopConfig, DEFAULT_SHOP_CONFIG } from './config/shopConfig';
import { submitOrderToSupabase, fetchActiveProcessingOrders } from './services/orderService';
import { fetchAllMasterDataFromSupabase } from './services/masterDataService';
import { supabase } from './supabaseClient';
import { ORDER_STATUS, normalizeOrderStatus } from './constants/orderStatus';

const VIETNAMESE_SAFE_FONTS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif";

export default function App() {
  // Giữ nguyên trang hiện tại khi F5 bằng sessionStorage
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      return sessionStorage.getItem('shop_current_page') || 'home';
    } catch {
      return 'home';
    }
  });

  const [shopConfig, setShopConfig] = useState(() => getShopConfig());

  // Trạng thái hiển thị thực tế của Dải băng thông báo món mới
  const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(false);

  // State lưu ID sản phẩm cần nhấp nháy làm nổi bật khi bấm "Xem ngay"
  const [highlightedProductId, setHighlightedProductId] = useState(null);

  // Lưu danh mục được chọn từ HomePage để truyền sang ShopPage
  const [selectedShopCategory, setSelectedShopCategory] = useState(() => {
    try {
      return sessionStorage.getItem('shop_selected_category') || 'all';
    } catch {
      return 'all';
    }
  });

  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('shop_categories');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('shop_products');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [posts, setPosts] = useState(() => {
    try {
      const saved = localStorage.getItem('shop_posts');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [stories, setStories] = useState(() => {
    try {
      const saved = localStorage.getItem('shop_stories');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('shop_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Luôn chuẩn hóa status sang key tiếng Anh (ORDER_STATUS)
  const [orders, setOrders] = useState(() => {
    try {
      const local = JSON.parse(localStorage.getItem('shop_orders') || '[]');
      return local.map((ord) => ({
        ...ord,
        status: normalizeOrderStatus(ord.status)
      }));
    } catch { return []; }
  });

  const [isLoadingMasterData, setIsLoadingMasterData] = useState(() => {
    const hasCachedProducts = !!localStorage.getItem('shop_products');
    return !hasCachedProducts;
  });

  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const [forceNavVisible, setForceNavVisible] = useState(false);
  const [centerSplash, setCenterSplash] = useState(null);

  const splashTimerRef = useRef(null);
  const navTimerRef = useRef(null);
  const bounceTimerRef = useRef(null);
  const cartUpdateTimerRef = useRef(null);
  const highlightTimerRef = useRef(null);

  const [successOrderInfo, setSuccessOrderInfo] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  
  // State quản lý Tra cứu đơn hàng & Mã tra cứu truyền từ link email
  const [isLookupModalOpen, setIsLookupModalOpen] = useState(false);
  const [initialLookupCode, setInitialLookupCode] = useState('');

  // -------------------------------------------------------------
  // ĐỒNG BỘ GIÁ VÀ QUY CÁCH GIỎ HÀNG VỚI MASTER DATA MỚI NHẤT
  // -------------------------------------------------------------
  const syncCartWithMasterData = useCallback((latestProducts) => {
    if (!Array.isArray(latestProducts) || latestProducts.length === 0) return;

    setCart((prevCart) => {
      if (!Array.isArray(prevCart) || prevCart.length === 0) return prevCart;

      const productMap = new Map(latestProducts.map((p) => [String(p.id), p]));
      let hasCartChanged = false;

      const updatedCart = prevCart.map((item) => {
        const prodId = String(item.productId || item.id);
        const freshProd = productMap.get(prodId);
        if (!freshProd) return item;

        const base = Number(freshProd.basePrice ?? freshProd.base_price ?? freshProd.price ?? 0);
        let finalUnitPrice = base;

        // Xử lý giá theo quy cách
        const rawWeights = freshProd.product_weights || freshProd.weights;
        if (Array.isArray(rawWeights) && rawWeights.length > 0) {
          const matchedWeight = rawWeights.find(
            (w) => String(w.id) === String(item.weightId) || (w.weight_label || w.label) === item.weightLabel
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
          console.error('Lỗi lưu giỏ hàng sau khi sync:', e);
        }
        return updatedCart;
      }

      return prevCart;
    });
  }, []);

  // -------------------------------------------------------------
  // 1. XỬ LÝ URL PARAMS & TỰ ĐỘNG BẬT MODAL KHI CÓ LINK TỪ EMAIL
  // -------------------------------------------------------------
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const orderCodeFromUrl = urlParams.get('lookup') || urlParams.get('order') || urlParams.get('code');
      const pageFromUrl = urlParams.get('page');

      if (orderCodeFromUrl) {
        const cleanCode = orderCodeFromUrl.trim().toUpperCase();
        setInitialLookupCode(cleanCode);
        setIsLookupModalOpen(true);

        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }

      if (pageFromUrl && ['home', 'shop', 'story', 'blog', 'checkout', 'admin', 'packing', 'policy'].includes(pageFromUrl)) {
        setCurrentPage(pageFromUrl);
        sessionStorage.setItem('shop_current_page', pageFromUrl);
      }
    } catch (e) {
      console.error('Lỗi phân tích URL Params:', e);
    }

    const handlePopState = (event) => {
      const targetPage = event.state?.page || 'home';
      setCurrentPage(targetPage);
      sessionStorage.setItem('shop_current_page', targetPage);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Đồng bộ giỏ hàng vào LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('shop_cart', JSON.stringify(cart));
    } catch (e) { console.error(e); }
  }, [cart]);

  useEffect(() => {
    return () => {
      if (splashTimerRef.current) clearTimeout(splashTimerRef.current);
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
      if (bounceTimerRef.current) clearTimeout(bounceTimerRef.current);
      if (cartUpdateTimerRef.current) clearTimeout(cartUpdateTimerRef.current);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  // -------------------------------------------------------------
  // 2. TẢI DỮ LIỆU MASTER DATA & ĐƠN HÀNG TỪ SUPABASE POSTGRESQL
  // -------------------------------------------------------------
  const loadSupabaseData = useCallback(async () => {
    try {
      const masterData = await fetchAllMasterDataFromSupabase();
      if (masterData) {
        if (Array.isArray(masterData.categories) && masterData.categories.length > 0) {
          setCategories(masterData.categories);
          localStorage.setItem('shop_categories', JSON.stringify(masterData.categories));
        }

        if (Array.isArray(masterData.products) && masterData.products.length > 0) {
          setProducts(masterData.products);
          localStorage.setItem('shop_products', JSON.stringify(masterData.products));
          syncCartWithMasterData(masterData.products);
        }

        if (Array.isArray(masterData.posts)) {
          setPosts(masterData.posts);
          localStorage.setItem('shop_posts', JSON.stringify(masterData.posts));
        }

        if (Array.isArray(masterData.stories)) {
          setStories(masterData.stories);
          localStorage.setItem('shop_stories', JSON.stringify(masterData.stories));
        }

        setShopConfig((prev) => {
          const nextConfig = { ...prev };
          if (Array.isArray(masterData.vouchers)) nextConfig.vouchers = masterData.vouchers;
          if (Array.isArray(masterData.giftsCatalog)) nextConfig.giftsCatalog = masterData.giftsCatalog;
          if (masterData.config && Object.keys(masterData.config).length > 0) {
            Object.assign(nextConfig, masterData.config);
          }
          localStorage.setItem('shop_config', JSON.stringify(nextConfig));
          return nextConfig;
        });
      }

      const activeOrders = await fetchActiveProcessingOrders();
      if (Array.isArray(activeOrders)) {
        const normalizedOrders = activeOrders.map((o) => ({
          ...o,
          status: normalizeOrderStatus(o.status)
        }));
        setOrders(normalizedOrders);
        localStorage.setItem('shop_orders', JSON.stringify(normalizedOrders));
      }
    } catch (err) {
      console.warn('Lỗi kết nối tải dữ liệu Supabase:', err);
    } finally {
      setIsLoadingMasterData(false);
    }
  }, [syncCartWithMasterData]);

  useEffect(() => {
    loadSupabaseData();

    const safetyTimer = setTimeout(() => {
      setIsLoadingMasterData(false);
    }, 3500);

    return () => clearTimeout(safetyTimer);
  }, [loadSupabaseData]);

  // -------------------------------------------------------------
  // 3. REALTIME: LẮNG NGHE SỰ KIỆN SẢN PHẨM & QUY CÁCH
  // -------------------------------------------------------------
  useEffect(() => {
    const productRealtimeChannel = supabase
      .channel('app:products-and-weights-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          loadSupabaseData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_weights' },
        () => {
          loadSupabaseData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shop_configs' },
        () => {
          loadSupabaseData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productRealtimeChannel);
    };
  }, [loadSupabaseData]);

  // -------------------------------------------------------------
  // 4. REALTIME: LẮNG NGHE SỰ KIỆN CẬP NHẬT ĐƠN HÀNG TỪ SUPABASE
  // -------------------------------------------------------------
  useEffect(() => {
    const channel = supabase
      .channel('app:orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          const raw = payload.new;
          if (!raw) return;

          const normalized = {
            ...raw,
            name: raw.customer_name || raw.name,
            total: raw.final_total ?? raw.total,
            paymentMethod: raw.payment_method || raw.paymentMethod,
            createdAt: raw.created_at || raw.createdAt,
            status: normalizeOrderStatus(raw.status)
          };

          if (payload.eventType === 'INSERT') {
            setOrders((prev) => [normalized, ...prev.filter((o) => o.code !== normalized.code)]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((o) => (o.code === normalized.code ? { ...o, ...normalized } : o))
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((o) => o.code !== payload.old?.code && o.id !== payload.old?.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateOrderStatus = async (orderCode, newStatus, reason = null) => {
    const statusCode = normalizeOrderStatus(newStatus);

    setOrders((prev) => {
      const updated = prev.map((ord) => 
        ((ord.code === orderCode || ord.orderId === orderCode) 
          ? { ...ord, status: statusCode, ...(reason ? { cancel_reason: reason } : {}) } 
          : ord)
      );
      try {
        localStorage.setItem('shop_orders', JSON.stringify(updated));
      } catch (e) { console.error(e); }
      return updated;
    });

    try {
      const updatePayload = { 
        status: statusCode,
        updated_at: new Date().toISOString()
      };
      if (reason) {
        updatePayload.cancel_reason = reason;
      }

      const { error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('code', orderCode);

      if (error) console.warn('Lỗi update trạng thái Supabase:', error);
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái đơn hàng:', err);
    }
  };

  const handleAddToCart = (product, weightObj, quantity = 1) => {
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

    const existingItem = cart.find((item) => item.id === cartItemId || item.cartItemId === cartItemId);
    const currentQtyInCart = existingItem ? existingItem.quantity : 0;
    const newTotalQuantity = currentQtyInCart + quantity;

    setCenterSplash({
      id: Date.now() + Math.random(),
      image: product.image,
      addedQuantity: quantity,
      totalQuantity: newTotalQuantity,
      productName: product.name
    });

    setForceNavVisible(true);
    setIsCartBouncing(false);

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === cartItemId || item.cartItemId === cartItemId);
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
          cartItemId: cartItemId,
          productId: product.id,
          weightId: weightObj?.id || 'std',
          name: product.name,
          price: unitPrice,
          flavor: weightObj?.flavor || null,
          weightLabel: weightObj?.label || product.unit || 'Tiêu chuẩn',
          image: product.image,
          campaign_gift: product.campaign_gift_id || product.campaign_gift || null,
          campaign_gift_title: product.campaign_tag || product.campaign_gift_title || null,
          quantity: quantity
        }
      ];
    });

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
  };

  const handleUpdateQuantity = (target, delta) => {
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
  };

  const handleRemoveCartItem = (target, weightId = null) => {
    const targetId = typeof target === 'object' ? (target.id || target.cartItemId || target.productId) : target;
    const targetWeightId = typeof target === 'object' ? (target.weightId || null) : weightId;

    setCart((prevCart) => 
      prevCart.filter((item) => {
        if (item.id === targetId || item.cartItemId === targetId) return false;
        if (item.productId === targetId) {
          if (!targetWeightId || item.weightId === targetWeightId) return false;
        }
        return true;
      })
    );
  };

  // -------------------------------------------------------------
  // XỬ LÝ ĐẶT HÀNG & PHÂN LUỒNG GỬI EMAIL CHUẨN XÁC
  // -------------------------------------------------------------
  const handleProcessOrder = async (orderData) => {
    const orderCode = orderData.code || ('XNG' + Math.floor(100000 + Math.random() * 900000));
    const sourceCart = Array.isArray(orderData.cart) && orderData.cart.length > 0 ? orderData.cart : cart;
    const finalTotalAmount = Number(orderData.total !== undefined ? orderData.total : orderData.finalTotal) || 0;
    const subtotalAmount = Number(orderData.subtotal || orderData.rawTotal) || finalTotalAmount;

    const campaignGiftsList = sourceCart
      .filter((item) => item.campaign_gift_title)
      .map((item) => `${item.name}: ${item.campaign_gift_title}`)
      .join(' | ');

    const initialStatus = ORDER_STATUS.PENDING;

    const recipientEmail = (orderData.email || orderData.customer?.email || '').trim();
    const recipientName = (orderData.customer?.name || orderData.name || '').trim();
    const recipientPhone = (orderData.customer?.phone || orderData.phone || '').trim();
    const recipientAddress = (orderData.address || orderData.customer?.address || '').trim();
    const recipientNote = (orderData.customer?.note || orderData.note || '').trim();

    const orderPayload = {
      code: orderCode,
      orderId: orderCode,
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      customer: {
        name: recipientName,
        phone: recipientPhone,
        email: recipientEmail,
        address: recipientAddress,
        note: recipientNote
      },
      customer_name: recipientName,
      name: recipientName,
      phone: recipientPhone,
      email: recipientEmail,
      address: recipientAddress,
      note: recipientNote,
      cart: sourceCart.map((item) => ({
        productId: item.productId || item.id,
        id: item.productId || item.id,
        weightId: item.weightId || 'std',
        name: item.name,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        weightLabel: item.weightLabel || '',
        campaign_gift_title: item.campaign_gift_title || null
      })),
      paymentMethod: orderData.paymentMethod || 'deposit',
      payment_method: orderData.paymentMethod || 'deposit',
      paymentGift: orderData.giftTitle || orderData.paymentGift || '',
      campaignGifts: campaignGiftsList || '',
      subtotal: subtotalAmount,
      shipping_fee: Number(orderData.shipping_fee || orderData.shippingFee || 0),
      discount: Number(orderData.discount) || 0,
      discountAmount: Number(orderData.discount) || 0,
      finalTotal: finalTotalAmount,
      final_total: finalTotalAmount,
      total: finalTotalAmount,
      totalAmount: finalTotalAmount,
      rawTotal: subtotalAmount,
      voucherCode: orderData.voucherCode || '',
      voucher: orderData.voucherCode || '',
      usedPreviousOrderCode: orderData.usedPreviousOrderCode || '',
      edgeSignature: orderData.edgeSignature || '',
      status: initialStatus
    };

    setSuccessOrderInfo(orderPayload);
    setIsSuccessModalOpen(true);

    setOrders((prev) => {
      const nextOrders = [orderPayload, ...prev.filter((o) => o.code !== orderCode)];
      try {
        localStorage.setItem('shop_orders', JSON.stringify(nextOrders));
      } catch (err) { console.error(err); }
      return nextOrders;
    });

    setCart([]);
    try {
      localStorage.removeItem('shop_cart');
    } catch (e) { console.error(e); }

    try {
      submitOrderToSupabase(orderPayload)
        .then((res) => {
          if (!res?.success) {
            console.warn('Lỗi ghi nhận Supabase ngầm:', res?.error);
          }
        })
        .catch((err) => {
          console.error('Lỗi network khi gửi đơn ngầm:', err);
        });

      const currentMethod = String(orderPayload.paymentMethod || orderPayload.payment_method || 'deposit').toLowerCase();
      const isCodOrder = currentMethod === 'cod';
      const isAutoPrepaidVerified = Boolean(orderData.isPaymentVerified || orderPayload.payment_verified);

      if (recipientEmail && recipientEmail.includes('@') && (isCodOrder || isAutoPrepaidVerified)) {
        const itemsSummaryHtml = orderPayload.cart.length > 0
          ? orderPayload.cart.map((it) => {
              const qty = Number(it.quantity) || 1;
              const lineTotal = (Number(it.price) || 0) * qty;
              const weight = it.weightLabel ? ` (${it.weightLabel})` : '';
              return `
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 8px; border-bottom: 1px dashed #fde68a; padding-bottom: 6px;">
                  <tr>
                    <td align="left" style="font-size: 13.5px; color: #292524; font-family: ${VIETNAMESE_SAFE_FONTS}; line-height: 1.4;">
                      • <strong>${it.name}</strong>${weight} <span style="color: #b45309; font-weight: 700;">x${qty}</span>
                    </td>
                    <td align="right" style="font-size: 13.5px; font-weight: 700; color: #78350f; font-family: ${VIETNAMESE_SAFE_FONTS}; white-space: nowrap; padding-left: 12px;">
                      ${lineTotal.toLocaleString('vi-VN')}đ
                    </td>
                  </tr>
                </table>
              `;
            }).join('')
          : 'Đặc sản Ninh Thuận hái tươi tại giàn';

        supabase.functions.invoke('send-order-email', {
          body: {
            to: recipientEmail,
            email: recipientEmail,
            customer_email: recipientEmail,
            recipient_email: recipientEmail,
            template_id: 'tpl0001',
            event_type: isCodOrder ? 'ORDER_COD_CREATED' : 'PAYMENT_CONFIRMED',
            customer_name: recipientName,
            order_code: orderCode,
            cart: orderPayload.cart,
            payment_method: isCodOrder ? 'cod' : currentMethod,
            paymentMethod: isCodOrder ? 'cod' : currentMethod,
            deposit_paid: isCodOrder ? 0 : finalTotalAmount,
            remaining_cod: isCodOrder ? finalTotalAmount : 0,
            final_total: finalTotalAmount,
            data: {
              CUSTOMER_NAME: recipientName,
              ORDER_CODE: orderCode,
              FINAL_TOTAL: `${finalTotalAmount.toLocaleString('vi-VN')}đ`,
              TOTAL: finalTotalAmount.toLocaleString('vi-VN') + 'đ',
              PAYMENT_METHOD: isCodOrder ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản 100% (VietQR)',
              DEPOSIT_PAID: '0đ',
              REMAINING_COD: `${finalTotalAmount.toLocaleString('vi-VN')}đ`,
              SHIPPING_ADDRESS: recipientAddress,
              ADDRESS: recipientAddress,
              GIFT_TITLE: orderPayload.paymentGift || 'Nông sản biếu tặng',
              ITEMS_SUMMARY: itemsSummaryHtml
            }
          }
        }).catch((mailErr) => {
          console.warn('Lỗi gọi Edge Function gửi mail COD:', mailErr);
        });
      }
    } catch (err) {
      console.error('Lỗi khởi tạo đồng bộ đơn ngầm:', err);
    }
  };

  const handleSaveConfig = (newCfg) => {
    setShopConfig(newCfg);
    try {
      localStorage.setItem('shop_config', JSON.stringify(newCfg));
    } catch (e) {
      console.error('Lỗi lưu cấu hình shop vào LocalStorage:', e);
    }
  };

  const navigateTo = (page) => {
    if (page !== 'shop') {
      setSelectedShopCategory('all');
      try {
        sessionStorage.setItem('shop_selected_category', 'all');
      } catch (e) { console.error(e); }
    }
    setCurrentPage(page);
    try {
      sessionStorage.setItem('shop_current_page', page);
      const newUrl = page === 'home' ? window.location.pathname : `?page=${page}`;
      window.history.pushState({ page }, '', newUrl);
    } catch (e) { console.error(e); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToShopCategory = (catId = 'all') => {
    setSelectedShopCategory(catId);
    setCurrentPage('shop');
    try {
      sessionStorage.setItem('shop_selected_category', catId);
      sessionStorage.setItem('shop_current_page', 'shop');
      window.history.pushState({ page: 'shop', category: catId }, '', `?page=shop&cat=${catId}`);
    } catch (e) { console.error(e); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // HÀM XỬ LÝ KHI BẤM "XEM NGAY" TRÊN BANNER:
  // - Nếu là 1 sản phẩm: Chuyển sang danh mục của nó, lưu ID để nhấp nháy card
  // - Nếu là danh sách nhiều sản phẩm mới: Chuyển sang Shop và mở tab 'all'
  const handleAnnouncementNavigate = (target) => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);

    if (target && target.id) {
      // Trường hợp xem 1 sản phẩm cụ thể
      const targetCat = target.category || 'all';
      setSelectedShopCategory(targetCat);
      setCurrentPage('shop');
      setHighlightedProductId(target.id);

      try {
        sessionStorage.setItem('shop_selected_category', targetCat);
        sessionStorage.setItem('shop_current_page', 'shop');
        window.history.pushState({ page: 'shop', category: targetCat }, '', `?page=shop&cat=${targetCat}`);
      } catch (e) { console.error(e); }

      // Tự động tắt nhấp nháy sau 3.5 giây
      highlightTimerRef.current = setTimeout(() => {
        setHighlightedProductId(null);
      }, 3500);
    } else {
      // Trường hợp có danh sách nhiều món mới
      handleNavigateToShopCategory('all');
    }
  };

  const totalCartCount = cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const totalCartAmount = cart.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);

  if (isLoadingMasterData) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#faf8f5] text-stone-800 space-y-4 font-sans">
        <div className="w-16 h-16 rounded-3xl bg-amber-100/90 text-amber-800 flex items-center justify-center animate-bounce shadow-inner border border-amber-200">
          <ShoppingBag className="w-8 h-8 stroke-[2.2]" />
        </div>
        <div className="flex items-center gap-2.5 text-stone-800 font-bold text-sm sm:text-base">
          <Loader2 className="w-5 h-5 animate-spin text-amber-700" />
          <span>Đang đồng bộ nông sản tươi từ giàn...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full [overflow-x:clip] bg-[#faf8f5] text-stone-800 flex flex-col font-sans">
      
      {/* 1. KHỐI HEADER DÍNH TỰ NHIÊN: GỒM BANNER VÀ NAVBAR NỐI TIẾP NHAU */}
      {currentPage !== 'admin' && currentPage !== 'packing' && (
        <header className="sticky top-0 z-40 w-full flex flex-col shadow-md">
          {/* Dải băng thông báo món mới */}
          <NewProductAnnouncementBar
            products={products}
            daysThreshold={7}
            onVisibilityChange={setIsAnnouncementVisible}
            onNavigateProduct={handleAnnouncementNavigate}
          />

          {/* Thanh Navbar điều hướng */}
          <Navbar
            currentPage={currentPage}
            onNavigate={(page) => {
              if (page === 'shop') handleNavigateToShopCategory('all');
              else navigateTo(page);
            }}
            cartCount={totalCartCount}
            cartTotal={totalCartAmount}
            onOpenLookup={() => {
              setInitialLookupCode('');
              setIsLookupModalOpen(true);
            }}
            isCartBouncing={isCartBouncing}
            forceVisible={forceNavVisible}
            shopConfig={shopConfig}
          />
        </header>
      )}

      {/* 2. THÂN TRANG */}
      <main className="flex-1 w-full max-w-full">
        {currentPage === 'home' && (
          <HomePage
            products={products}
            categories={categories}
            shopConfig={shopConfig}
            onAddToCart={handleAddToCart}
            onNavigateShop={handleNavigateToShopCategory}
            onNavigateStory={() => navigateTo('story')}
            onNavigate={navigateTo}
          />
        )}

        {currentPage === 'shop' && (
          <ShopPage
            products={products}
            categories={categories}
            initialCategory={selectedShopCategory}
            highlightedProductId={highlightedProductId} // Truyền ID cần nhấp nháy xuống ShopPage
            onAddToCart={handleAddToCart}
            onNavigate={navigateTo}
          />
        )}

        {currentPage === 'story' && (
          <StoryPage stories={stories} onNavigate={navigateTo} />
        )}

        {currentPage === 'blog' && (
          <BlogPage posts={posts} onNavigate={navigateTo} />
        )}

        {currentPage === 'checkout' && (
          <CheckoutPage
            cart={cart}
            onSubmitOrder={handleProcessOrder}
            onNavigate={navigateTo}
            shopConfig={shopConfig}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveCartItem}
          />
        )}

        {currentPage === 'policy' && (
          <PolicyPage
            onNavigateHome={() => navigateTo('home')}
            onNavigateShop={() => navigateTo('shop')}
            onNavigate={navigateTo}
          />
        )}

        {currentPage === 'admin' && (
          <Suspense fallback={
            <div className="min-h-[65vh] flex items-center justify-center text-sm font-bold text-stone-600 gap-2.5">
              <Loader2 className="w-6 h-6 animate-spin text-amber-700" />
              <span>Đang tải bảng quản trị...</span>
            </div>
          }>
            <AdminPage
              products={products}
              categories={categories}
              orders={orders}
              onSaveProducts={(newList) => {
                setProducts(newList);
                localStorage.setItem('shop_products', JSON.stringify(newList));
                syncCartWithMasterData(newList);
              }}
              onResetProducts={loadSupabaseData}
              posts={posts}
              onSavePosts={(newList) => {
                setPosts(newList);
                localStorage.setItem('shop_posts', JSON.stringify(newList));
              }}
              onResetPosts={loadSupabaseData}
              stories={stories}
              onSaveStories={(newList) => {
                setStories(newList);
                localStorage.setItem('shop_stories', JSON.stringify(newList));
              }}
              onResetStories={loadSupabaseData}
              shopConfig={shopConfig}
              onSaveConfig={handleSaveConfig}
              onResetConfig={() => handleSaveConfig(DEFAULT_SHOP_CONFIG)}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onNavigateHome={() => navigateTo('home')}
              onNavigatePacking={() => navigateTo('packing')}
            />
          </Suspense>
        )}

        {currentPage === 'packing' && (
          <Suspense fallback={
            <div className="min-h-[65vh] flex items-center justify-center text-sm font-bold text-stone-600 gap-2.5">
              <Loader2 className="w-6 h-6 animate-spin text-amber-700" />
              <span>Đang tải giao diện đóng gói...</span>
            </div>
          }>
            <PackingPage
              orders={orders}
              shopConfig={shopConfig}
              onNavigateHome={() => navigateTo('home')}
            />
          </Suspense>
        )}
      </main>

      <OrderSuccessModal
        isOpen={isSuccessModalOpen}
        orderInfo={successOrderInfo}
        onClose={() => {
          setIsSuccessModalOpen(false);
          navigateTo('home');
        }}
        shopConfig={shopConfig}
      />

      <OrderLookupModal
        isOpen={isLookupModalOpen}
        initialCode={initialLookupCode}
        onClose={() => {
          setIsLookupModalOpen(false);
          setInitialLookupCode('');
        }}
        shopConfig={shopConfig}
      />

      {currentPage !== 'packing' && currentPage !== 'admin' && currentPage !== 'policy' && (
        <Footer 
          config={shopConfig}
          onNavigateAdmin={() => navigateTo('admin')} 
          onNavigatePacking={() => navigateTo('packing')}
          onNavigatePolicy={() => navigateTo('policy')}
          onOpenLookup={() => {
            setInitialLookupCode('');
            setIsLookupModalOpen(true);
          }}
        />
      )}

      {/* HIỆU ỨNG THÊM VÀO GIỎ TO BẢN */}
      {centerSplash && (
        <div 
          key={centerSplash.id} 
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4"
        >
          <div className="animate-center-splash flex flex-col items-center justify-center p-6 sm:p-7 rounded-3xl bg-stone-900/95 text-white shadow-2xl backdrop-blur-md border border-amber-500/40 text-center will-change-transform">
            <div className="relative">
              {centerSplash.image ? (
                <img 
                  src={centerSplash.image} 
                  alt="Đặc sản" 
                  className="w-40 h-40 sm:w-44 sm:h-44 rounded-2xl object-cover border-2 border-amber-400 shadow-xl" 
                />
              ) : (
                <div className="w-40 h-40 sm:w-44 sm:h-44 rounded-2xl bg-amber-600 flex items-center justify-center shadow-xl">
                  <ShoppingBag className="w-16 h-16 text-white stroke-[2]" />
                </div>
              )}

              <span className="absolute -top-3 -right-3 bg-amber-500 text-stone-950 font-black text-base px-3 py-1 rounded-full border-2 border-stone-900 shadow-md font-mono">
                x{centerSplash.totalQuantity}
              </span>
            </div>

            <div className="mt-4 flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-black text-sm sm:text-base">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Đã thêm (+{centerSplash.addedQuantity})</span>
              </div>
              <span className="text-xs sm:text-sm text-stone-300 font-medium">
                Trong giỏ đang có: <strong className="text-white font-mono font-black">{centerSplash.totalQuantity}</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}