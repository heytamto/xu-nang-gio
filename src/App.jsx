import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShoppingBag, Loader2 } from 'lucide-react';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import OrderSuccessModal from './components/OrderSuccessModal';
import OrderLookupModal from './components/OrderLookupModal';

import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import StoryPage from './pages/StoryPage';
import BlogPage from './pages/BlogPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminPage from './pages/AdminPage';
import PackingPage from './pages/PackingPage';

import { getShopConfig, DEFAULT_SHOP_CONFIG } from './config/shopConfig';
import { enqueueOrder, processOrderQueue, initQueueWorker } from './utils/orderQueue';

export default function App() {
  // 1. Giữ nguyên trang hiện tại khi F5 bằng sessionStorage
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      return sessionStorage.getItem('shop_current_page') || 'home';
    } catch {
      return 'home';
    }
  });

  const [shopConfig, setShopConfig] = useState(() => getShopConfig());

  // State lưu danh mục được chọn từ HomePage để truyền sang ShopPage lọc chuẩn xác
  const [selectedShopCategory, setSelectedShopCategory] = useState(() => {
    try {
      return sessionStorage.getItem('shop_selected_category') || 'all';
    } catch {
      return 'all';
    }
  });

  // Khởi tạo state ban đầu từ localStorage
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

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [successOrderInfo, setSuccessOrderInfo] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isLookupModalOpen, setIsLookupModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('shop_cart', JSON.stringify(cart));
    } catch (e) { console.error(e); }
  }, [cart]);

  useEffect(() => {
    const cleanupWorker = initQueueWorker();
    return cleanupWorker;
  }, []);

  useEffect(() => {
    return () => {
      if (splashTimerRef.current) clearTimeout(splashTimerRef.current);
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
      if (bounceTimerRef.current) clearTimeout(bounceTimerRef.current);
      if (cartUpdateTimerRef.current) clearTimeout(cartUpdateTimerRef.current);
    };
  }, []);

  /**
   * CƠ CHẾ FETCH DỮ LIỆU: ĐỒNG BỘ 1 CHIỀU CHÍNH XÁC VỚI GOOGLE SHEET
   */
  const fetchSheetData = useCallback(async () => {
    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    if (!webhookUrl) {
      setIsLoadingMasterData(false);
      return;
    }

    const timestamp = Date.now();
    const freshUrl = `${webhookUrl}${webhookUrl.includes('?') ? '&' : '?'}nocache=${timestamp}&_t=${timestamp}`;

    try {
      const res = await fetch(freshUrl);
      const data = await res.json();

      if (data && (data.status === 'success' || data.success === true)) {
        // 1. CẬP NHẬT DANH MỤC
        if (Array.isArray(data.categories)) {
          const sortedCats = [...data.categories].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
          setCategories(sortedCats);
          localStorage.setItem('shop_categories', JSON.stringify(sortedCats));
        }

        // 2. CẬP NHẬT SẢN PHẨM
        if (Array.isArray(data.products)) {
          setProducts(data.products);
          localStorage.setItem('shop_products', JSON.stringify(data.products));
        }

        // 3. CẬP NHẬT BÀI VIẾT CẨM NANG
        if (Array.isArray(data.posts)) {
          setPosts(data.posts);
          localStorage.setItem('shop_posts', JSON.stringify(data.posts));
        }

        // 4. CẬP NHẬT CÂU CHUYỆN VƯỜN
        if (Array.isArray(data.stories)) {
          setStories(data.stories);
          localStorage.setItem('shop_stories', JSON.stringify(data.stories));
        }

        // 5. CẬP NHẬT ĐƠN HÀNG: GHI ĐÈ THEO SHEET
        const incomingOrders = Array.isArray(data.orders) 
          ? data.orders 
          : (Array.isArray(data.data) ? data.data : null);

        if (incomingOrders !== null) {
          const validSheetOrders = incomingOrders.filter(
            (o) => o && o.code && String(o.code).trim() !== ''
          );
          setOrders(validSheetOrders);
          localStorage.setItem('shop_orders', JSON.stringify(validSheetOrders));
        }

        // 6. CẬP NHẬT CẤU HÌNH, QUÀ TẶNG & VOUCHER
        setShopConfig((prev) => {
          const nextConfig = { ...prev };
          if (Array.isArray(data.vouchers)) nextConfig.vouchers = data.vouchers;
          if (Array.isArray(data.paymentGifts)) nextConfig.paymentGifts = data.paymentGifts;
          if (Array.isArray(data.giftsCatalog)) nextConfig.giftsCatalog = data.giftsCatalog;

          if (data.config && Object.keys(data.config).length > 0) {
            Object.assign(nextConfig, data.config);
            if (data.config.depositAmount) nextConfig.depositAmount = Number(data.config.depositAmount);
            if (data.config.loyaltyDiscountPercent) nextConfig.loyaltyDiscountPercent = Number(data.config.loyaltyDiscountPercent);
            if (data.config.loyaltyMaxDiscount) nextConfig.loyaltyMaxDiscount = Number(data.config.loyaltyMaxDiscount);
            if (data.config.mapEmbedUrl) nextConfig.mapEmbedUrl = String(data.config.mapEmbedUrl);
            if (data.config.mapDirectionsUrl) nextConfig.mapDirectionsUrl = String(data.config.mapDirectionsUrl);
          }

          localStorage.setItem('shop_config', JSON.stringify(nextConfig));
          return nextConfig;
        });
      }
    } catch (err) {
      console.warn('Lỗi kết nối tải dữ liệu mới từ Sheet:', err);
    } finally {
      setIsLoadingMasterData(false);
    }
  }, []);

  useEffect(() => {
    fetchSheetData();

    const safetyTimer = setTimeout(() => {
      setIsLoadingMasterData(false);
    }, 4000);

    return () => clearTimeout(safetyTimer);
  }, [fetchSheetData]);

  const handleUpdateOrderStatus = async (orderCode, newStatus) => {
    setOrders((prev) => {
      const updated = prev.map((ord) => (ord.code === orderCode ? { ...ord, status: newStatus } : ord));
      try {
        localStorage.setItem('shop_orders', JSON.stringify(updated));
      } catch (e) { console.error(e); }
      return updated;
    });

    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'update_status',
            code: orderCode,
            status: newStatus
          })
        });
      } catch (err) {
        console.error('Lỗi cập nhật trạng thái đơn lên Sheet:', err);
      }
    }
  };

  // XỬ LÝ THÊM MÓN & TÍNH TỔNG SỐ LƯỢNG MÓN ĐANG CÓ TRONG GIỎ
  const handleAddToCart = (product, weightObj, quantity = 1) => {
    if (splashTimerRef.current) clearTimeout(splashTimerRef.current);
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    if (bounceTimerRef.current) clearTimeout(bounceTimerRef.current);
    if (cartUpdateTimerRef.current) clearTimeout(cartUpdateTimerRef.current);

    const multiplier = weightObj?.multiplier || 1;
    const bonus = weightObj?.priceBonus || 0;
    const base = Number(product.basePrice || product.price || 0);
    const unitPrice = Math.round((base + bonus) * multiplier);
    const flavorTag = weightObj?.flavor ? `-${weightObj.flavor}` : '';
    const cartItemId = `${product.id}-${weightObj?.id || 'std'}${flavorTag}`;

    // Tính tổng số lượng món này sẽ có trong giỏ
    const existingItem = cart.find((item) => item.id === cartItemId);
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
      const existing = prevCart.find((item) => item.id === cartItemId);
      if (existing) {
        return prevCart.map((item) =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...prevCart,
        {
          id: cartItemId,
          productId: product.id,
          weightId: weightObj?.id || 'std',
          name: product.name,
          price: unitPrice,
          flavor: weightObj?.flavor || null,
          weightLabel: weightObj?.label || product.unit || 'Tiêu chuẩn',
          image: product.image,
          campaign_gift: product.campaign_gift || null,
          resolved_campaign_gifts: product.resolved_campaign_gifts || [],
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

  const handleUpdateQuantity = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const handleRemoveCartItem = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const handleProcessOrder = async (orderData) => {
    const orderCode = 'XNG' + Math.floor(100000 + Math.random() * 900000);
    const totalAmount = orderData.total || cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const orderPayload = {
      code: orderCode,
      createdAt: new Date().toISOString(),
      customer: {
        name: orderData.customer?.name || orderData.name || '',
        phone: orderData.customer?.phone || orderData.phone || '',
        note: orderData.customer?.note || orderData.note || ''
      },
      name: orderData.customer?.name || orderData.name || '',
      phone: orderData.customer?.phone || orderData.phone || '',
      email: orderData.email || '',
      note: orderData.customer?.note || orderData.note || '',
      address: orderData.address || '',
      paymentMethod: orderData.paymentMethod || 'deposit',
      giftTitle: orderData.giftTitle || '',
      total: totalAmount,
      rawTotal: orderData.rawTotal || totalAmount,
      discount: orderData.discount || 0,
      voucherCode: orderData.voucherCode || '',
      cart: cart.map((item) => ({
        productId: item.productId,
        weightId: item.weightId || 'std',
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        weightLabel: item.weightLabel,
        campaign_gift: item.campaign_gift || null,
        resolved_campaign_gifts: item.resolved_campaign_gifts || []
      }))
    };

    enqueueOrder(orderPayload);
    processOrderQueue();

    setOrders((prev) => {
      const nextOrders = [orderPayload, ...prev];
      try {
        localStorage.setItem('shop_orders', JSON.stringify(nextOrders));
      } catch (err) { console.error(err); }
      return nextOrders;
    });

    setSuccessOrderInfo({ code: orderCode, total: totalAmount });
    setIsSuccessModalOpen(true);
    setCart([]);
    setIsCartOpen(false);
  };

  const handleSaveConfig = (newCfg) => {
    setShopConfig(newCfg);
    localStorage.setItem('shop_config', JSON.stringify(newCfg));

    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'save_config',
          config: newCfg
        })
      }).catch((err) => console.error('Lỗi đồng bộ cấu hình:', err));
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
    } catch (e) { console.error(e); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToShopCategory = (catId = 'all') => {
    setSelectedShopCategory(catId);
    setCurrentPage('shop');
    try {
      sessionStorage.setItem('shop_selected_category', catId);
      sessionStorage.setItem('shop_current_page', 'shop');
    } catch (e) { console.error(e); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalCartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalCartAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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
      {/* Ẩn Navbar ở trang Admin và Kho */}
      {currentPage !== 'admin' && currentPage !== 'packing' && (
        <Navbar
          currentPage={currentPage}
          onNavigate={(page) => {
            if (page === 'shop') handleNavigateToShopCategory('all');
            else navigateTo(page);
          }}
          cartCount={totalCartCount}
          cartTotal={totalCartAmount}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenLookup={() => setIsLookupModalOpen(true)}
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
          />
        )}

        {currentPage === 'admin' && (
          <AdminPage
            products={products}
            categories={categories}
            orders={orders}
            onSaveProducts={(newList) => {
              setProducts(newList);
              localStorage.setItem('shop_products', JSON.stringify(newList));
            }}
            onResetProducts={() => {
              fetchSheetData();
            }}
            posts={posts}
            onSavePosts={(newList) => {
              setPosts(newList);
              localStorage.setItem('shop_posts', JSON.stringify(newList));
            }}
            onResetPosts={() => {
              fetchSheetData();
            }}
            stories={stories}
            onSaveStories={(newList) => {
              setStories(newList);
              localStorage.setItem('shop_stories', JSON.stringify(newList));
            }}
            onResetStories={() => {
              fetchSheetData();
            }}
            shopConfig={shopConfig}
            onSaveConfig={handleSaveConfig}
            onResetConfig={() => handleSaveConfig(DEFAULT_SHOP_CONFIG)}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onNavigateHome={() => navigateTo('home')}
            onNavigatePacking={() => navigateTo('packing')}
          />
        )}

        {currentPage === 'packing' && (
          <PackingPage
            orders={orders}
            shopConfig={shopConfig}
            onRefresh={fetchSheetData}
            onUpdateStatus={handleUpdateOrderStatus}
            onNavigateHome={() => navigateTo('home')}
          />
        )}
      </main>

      {isCartOpen && (
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveCartItem}
          onProceedCheckout={() => {
            setIsCartOpen(false);
            navigateTo('checkout');
          }}
        />
      )}

      <OrderSuccessModal
        isOpen={isSuccessModalOpen}
        orderInfo={successOrderInfo}
        onClose={() => {
          setIsSuccessModalOpen(false);
          navigateTo('home');
        }}
      />

      <OrderLookupModal
        isOpen={isLookupModalOpen}
        onClose={() => setIsLookupModalOpen(false)}
        shopConfig={shopConfig}
      />

      {/* Chỉ hiển thị Footer khi ở trang khách */}
      {currentPage !== 'packing' && currentPage !== 'admin' && (
        <Footer 
          config={shopConfig}
          onNavigateAdmin={() => navigateTo('admin')} 
          onNavigatePacking={() => navigateTo('packing')}
          onOpenLookup={() => setIsLookupModalOpen(true)}
        />
      )}

      {/* POPUP ANIMATION THÊM GIỎ HÀNG: HIỂN THỊ TỔNG SỐ LƯỢNG MÓN ĐANG CÓ */}
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

              {/* Huy hiệu hiển thị tổng số lượng món đó đang có trong giỏ */}
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