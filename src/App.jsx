// src/App.jsx
import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { ShoppingBag, Loader2 } from 'lucide-react';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import OrderLookupModal from './components/OrderLookupModal';
import OrderSuccessModal from './components/checkout/OrderSuccessModal';

import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import StoryPage from './pages/StoryPage';
import BlogPage from './pages/BlogPage';
import CheckoutPage from './pages/CheckoutPage';

// Lazy loading cho các trang quản trị để tối ưu bundle size cho khách hàng
const AdminPage = lazy(() => import('./pages/AdminPage'));
const PackingPage = lazy(() => import('./pages/PackingPage'));

import { getShopConfig, DEFAULT_SHOP_CONFIG } from './config/shopConfig';
import { submitOrderToSupabase, fetchActiveProcessingOrders } from './services/orderService';
import { fetchAllMasterDataFromSupabase } from './services/masterDataService';
import { supabase } from './supabaseClient';

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

  const [orders, setOrders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('shop_orders') || '[]');
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

  const [successOrderInfo, setSuccessOrderInfo] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  
  // State quản lý Tra cứu đơn hàng & Mã tra cứu truyền từ link email
  const [isLookupModalOpen, setIsLookupModalOpen] = useState(false);
  const [initialLookupCode, setInitialLookupCode] = useState('');

  // -------------------------------------------------------------
  // 1. XỬ LÝ URL PARAMS & SỰ KIỆN POPSTATE (BACK/FORWARD TRÌNH DUYỆT)
  // -------------------------------------------------------------
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const orderCodeFromUrl = urlParams.get('order') || urlParams.get('lookup') || urlParams.get('code');
      const pageFromUrl = urlParams.get('page');

      if (orderCodeFromUrl) {
        setInitialLookupCode(orderCodeFromUrl.trim().toUpperCase());
        setIsLookupModalOpen(true);
      }

      if (pageFromUrl && ['home', 'shop', 'story', 'blog', 'checkout', 'admin', 'packing'].includes(pageFromUrl)) {
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

      // Tải các đơn hàng vận hành
      const activeOrders = await fetchActiveProcessingOrders();
      if (Array.isArray(activeOrders)) {
        setOrders(activeOrders);
        localStorage.setItem('shop_orders', JSON.stringify(activeOrders));
      }
    } catch (err) {
      console.warn('Lỗi kết nối tải dữ liệu Supabase:', err);
    } finally {
      setIsLoadingMasterData(false);
    }
  }, []);

  useEffect(() => {
    loadSupabaseData();

    const safetyTimer = setTimeout(() => {
      setIsLoadingMasterData(false);
    }, 3500);

    return () => clearTimeout(safetyTimer);
  }, [loadSupabaseData]);

  // -------------------------------------------------------------
  // 3. REALTIME: LẮNG NGHE SỰ KIỆN CẬP NHẬT ĐƠN HÀNG TỪ SUPABASE
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
            createdAt: raw.created_at || raw.createdAt
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

  // CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG TRỰC TIẾP LÊN SUPABASE
  const handleUpdateOrderStatus = async (orderCode, newStatus) => {
    setOrders((prev) => {
      const updated = prev.map((ord) => 
        ((ord.code === orderCode || ord.orderId === orderCode) ? { ...ord, status: newStatus } : ord)
      );
      try {
        localStorage.setItem('shop_orders', JSON.stringify(updated));
      } catch (e) { console.error(e); }
      return updated;
    });

    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('code', orderCode);

      if (error) console.warn('Lỗi update trạng thái Supabase:', error);
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái đơn hàng:', err);
    }
  };

  // THÊM MÓN & ANIMATION NẢY GIỎ HÀNG
  const handleAddToCart = (product, weightObj, quantity = 1) => {
    if (splashTimerRef.current) clearTimeout(splashTimerRef.current);
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    if (bounceTimerRef.current) clearTimeout(bounceTimerRef.current);
    if (cartUpdateTimerRef.current) clearTimeout(cartUpdateTimerRef.current);

    const multiplier = weightObj?.multiplier || 1;
    const bonus = weightObj?.priceBonus || 0;
    const base = Number(product.basePrice || product.price || 0);
    const unitPrice = weightObj?.priceOverride != null ? weightObj.priceOverride + bonus : Math.round((base + bonus) * multiplier);
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
            ? { ...item, quantity: item.quantity + quantity }
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
  // 4. XỬ LÝ ĐẶT HÀNG: CHẠY ANIMATION NGAY 0MS (OPTIMISTIC UI)
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

    const orderPayload = {
      code: orderCode,
      orderId: orderCode,
      createdAt: new Date().toISOString(),
      customer: {
        name: (orderData.customer?.name || orderData.name || '').trim(),
        phone: (orderData.customer?.phone || orderData.phone || '').trim(),
        email: (orderData.email || orderData.customer?.email || '').trim(),
        address: (orderData.address || orderData.customer?.address || '').trim(),
        note: (orderData.customer?.note || orderData.note || '').trim()
      },
      customer_name: (orderData.customer?.name || orderData.name || '').trim(),
      name: (orderData.customer?.name || orderData.name || '').trim(),
      phone: (orderData.customer?.phone || orderData.phone || '').trim(),
      email: (orderData.email || orderData.customer?.email || '').trim(),
      address: (orderData.address || orderData.customer?.address || '').trim(),
      note: (orderData.customer?.note || orderData.note || '').trim(),
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
      status: 'Chờ xác nhận'
    };

    // ⚡ BƯỚC 1: KÍCH HOẠT HIỆU ỨNG MÁY IN VÀ MODAL TỨC THÌ (0ms)
    setSuccessOrderInfo(orderPayload);
    setIsSuccessModalOpen(true);

    // Cập nhật state đơn hàng và dọn giỏ hàng ngay lập tức
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

    // ⚡ BƯỚC 2: GỬI LÊN SUPABASE CHẠY NGẦM SONG SONG TRONG LÚC MÁY IN ĐANG ĐÙN GIẤY
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
    } catch (err) {
      console.error('Lỗi khởi tạo đồng bộ đơn ngầm:', err);
    }
  };

  const handleSaveConfig = (newCfg) => {
    setShopConfig(newCfg);
    localStorage.setItem('shop_config', JSON.stringify(newCfg));
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

  const totalCartCount = cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const totalCartAmount = cart.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);

  if (isLoadingMasterData) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#faf8f5] text-stone-800 space-y-3 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center animate-bounce shadow-inner">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-stone-700 font-bold text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
          <span>Đang đồng bộ nông sản tươi từ giàn...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#faf8f5] text-stone-800 flex flex-col font-sans">
      {currentPage !== 'admin' && currentPage !== 'packing' && (
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
        />
      )}

      <main className={`flex-1 w-full max-w-full ${currentPage !== 'admin' && currentPage !== 'packing' ? 'pt-16' : ''}`}>
        {currentPage === 'home' && (
          <HomePage
            products={products}
            categories={categories}
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

        {currentPage === 'admin' && (
          <Suspense fallback={
            <div className="min-h-[60vh] flex items-center justify-center text-xs font-bold text-stone-500 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
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
            <div className="min-h-[60vh] flex items-center justify-center text-xs font-bold text-stone-500 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
              <span>Đang tải giao diện đóng gói...</span>
            </div>
          }>
            <PackingPage
              orders={orders}
              shopConfig={shopConfig}
              onRefresh={loadSupabaseData}
              onUpdateStatus={handleUpdateOrderStatus}
              onNavigateHome={() => navigateTo('home')}
            />
          </Suspense>
        )}
      </main>

      {/* MODAL HÓA ĐƠN ĐẶT HÀNG THÀNH CÔNG */}
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
          if (window.location.search.includes('order=') || window.location.search.includes('lookup=')) {
            window.history.replaceState({}, '', window.location.pathname);
          }
        }}
        shopConfig={shopConfig}
      />

      {currentPage !== 'packing' && currentPage !== 'admin' && (
        <Footer 
          config={shopConfig}
          onNavigateAdmin={() => navigateTo('admin')} 
          onNavigatePacking={() => navigateTo('packing')}
          onOpenLookup={() => {
            setInitialLookupCode('');
            setIsLookupModalOpen(true);
          }}
        />
      )}

      {centerSplash && (
        <div 
          key={centerSplash.id} 
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4"
        >
          <div className="animate-center-splash flex flex-col items-center justify-center p-5 rounded-3xl bg-stone-900/95 text-white shadow-2xl backdrop-blur-md border border-amber-500/40 text-center will-change-transform">
            <div className="relative">
              {centerSplash.image ? (
                <img 
                  src={centerSplash.image} 
                  alt="Đặc sản" 
                  className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl object-cover border-2 border-amber-400 shadow-lg" 
                />
              ) : (
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-amber-600 flex items-center justify-center shadow-lg">
                  <ShoppingBag className="w-14 h-14 text-white stroke-[2]" />
                </div>
              )}

              <span className="absolute -top-2.5 -right-2.5 bg-amber-500 text-stone-950 font-black text-sm px-2.5 py-0.5 rounded-full border-2 border-stone-900 shadow-md font-mono">
                x{centerSplash.totalQuantity}
              </span>
            </div>

            <div className="mt-3 flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Đã thêm (+{centerSplash.addedQuantity})</span>
              </div>
              <span className="text-[11px] text-stone-300 font-medium">
                Trong giỏ đang có: <strong className="text-white font-mono font-bold">{centerSplash.totalQuantity}</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}