// src/App.jsx
import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { ShoppingBag, Loader2 } from 'lucide-react';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import OrderLookupModal from './components/OrderLookupModal';
import OrderSuccessModal from './components/checkout/OrderSuccessModal';
import ShopAnnouncementBar from './components/ShopAnnouncementBar';
import CartCenterSplash from './components/common/CartCenterSplash';

import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import StoryPage from './pages/StoryPage';
import CheckoutPage from './pages/CheckoutPage';
import PolicyPage from './pages/PolicyPage';

const AdminPage = lazy(() => import('./pages/AdminPage'));
const PackingPage = lazy(() => import('./pages/PackingPage'));

import { getShopConfig, DEFAULT_SHOP_CONFIG } from './config/shopConfig';
import { fetchAllMasterDataFromSupabase } from './services/masterDataService';
import { supabase } from './supabaseClient';
import { useCartManager } from './hooks/useCartManager';
import { useShopOrders } from './hooks/useShopOrders';

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const savedPage = sessionStorage.getItem('shop_current_page') || 'home';
      // Nếu là trang blog cũ thì tự động chuyển về story
      return savedPage === 'blog' ? 'story' : savedPage;
    } catch {
      return 'home';
    }
  });

  const [shopConfig, setShopConfig] = useState(() => getShopConfig());
  const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(false);
  const [highlightedProductId, setHighlightedProductId] = useState(null);
  const highlightTimerRef = useRef(null);

  const [selectedShopCategory, setSelectedShopCategory] = useState(() => {
    try {
      return sessionStorage.getItem('shop_selected_category') || 'all';
    } catch {
      return 'all';
    }
  });

  // Master Data state
  const [categories, setCategories] = useState(() => {
    try { return JSON.parse(localStorage.getItem('shop_categories') || '[]'); } catch { return []; }
  });
  const [products, setProducts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('shop_products') || '[]'); } catch { return []; }
  });
  const [posts, setPosts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('shop_posts') || '[]'); } catch { return []; }
  });
  const [stories, setStories] = useState(() => {
    try { return JSON.parse(localStorage.getItem('shop_stories') || '[]'); } catch { return []; }
  });

  const [isLoadingMasterData, setIsLoadingMasterData] = useState(() => !localStorage.getItem('shop_products'));

  // Modals state
  const [isLookupModalOpen, setIsLookupModalOpen] = useState(false);
  const [initialLookupCode, setInitialLookupCode] = useState('');

  // 1. Quản lý Giỏ hàng qua Hook
  const {
    cart,
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
  } = useCartManager();

  // 2. Quản lý Đơn hàng qua Hook
  const {
    orders,
    refreshOrders,
    handleUpdateOrderStatus,
    handleProcessOrder,
    successOrderInfo,
    isSuccessModalOpen,
    setIsSuccessModalOpen
  } = useShopOrders(clearCart);

  // 3. Tải Master Data & Tự động đồng bộ giỏ hàng
  const loadSupabaseData = useCallback(async () => {
    try {
      const masterData = await fetchAllMasterDataFromSupabase();
      if (masterData) {
        if (Array.isArray(masterData.categories)) {
          setCategories(masterData.categories);
          localStorage.setItem('shop_categories', JSON.stringify(masterData.categories));
        }
        if (Array.isArray(masterData.products)) {
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
          if (masterData.config) Object.assign(nextConfig, masterData.config);
          localStorage.setItem('shop_config', JSON.stringify(nextConfig));
          return nextConfig;
        });
      }
      await refreshOrders();
    } catch (err) {
      console.warn('Lỗi kết nối tải dữ liệu Supabase:', err);
    } finally {
      setIsLoadingMasterData(false);
    }
  }, [syncCartWithMasterData, refreshOrders]);

  useEffect(() => {
    loadSupabaseData();
  }, [loadSupabaseData]);

  // Đồng bộ giỏ hàng khi danh sách products trong state cập nhật
  useEffect(() => {
    if (Array.isArray(products) && products.length > 0) {
      syncCartWithMasterData(products);
    }
  }, [products, syncCartWithMasterData]);

  // Lắng nghe Realtime Master data
  useEffect(() => {
    const channel = supabase
      .channel('app:master-data-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, loadSupabaseData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_weights' }, loadSupabaseData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_configs' }, loadSupabaseData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadSupabaseData]);

  // URL Params listener
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('lookup') || urlParams.get('order') || urlParams.get('code');
      const page = urlParams.get('page');

      if (code) {
        setInitialLookupCode(code.trim().toUpperCase());
        setIsLookupModalOpen(true);
        window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      }

      if (page) {
        // Tự động map URL cũ page=blog sang story
        const targetPage = page === 'blog' ? 'story' : page;
        if (['home', 'shop', 'story', 'checkout', 'admin', 'packing', 'policy'].includes(targetPage)) {
          setCurrentPage(targetPage);
          sessionStorage.setItem('shop_current_page', targetPage);
        }
      }
    } catch (e) {
      console.error('Lỗi URL Params:', e);
    }
  }, []);

  const navigateTo = (page) => {
    const targetPage = page === 'blog' ? 'story' : page;
    if (targetPage !== 'shop') {
      setSelectedShopCategory('all');
      try { sessionStorage.setItem('shop_selected_category', 'all'); } catch (e) {}
    }
    setCurrentPage(targetPage);
    try {
      sessionStorage.setItem('shop_current_page', targetPage);
      const newUrl = targetPage === 'home' ? window.location.pathname : `?page=${targetPage}`;
      window.history.pushState({ page: targetPage }, '', newUrl);
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToShopCategory = (catId = 'all') => {
    setSelectedShopCategory(catId);
    setCurrentPage('shop');
    try {
      sessionStorage.setItem('shop_selected_category', catId);
      sessionStorage.setItem('shop_current_page', 'shop');
      window.history.pushState({ page: 'shop', category: catId }, '', `?page=shop&cat=${catId}`);
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnnouncementNavigate = (target) => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    if (target?.id) {
      const targetCat = target.category || 'all';
      setSelectedShopCategory(targetCat);
      setCurrentPage('shop');
      setHighlightedProductId(target.id);
      highlightTimerRef.current = setTimeout(() => setHighlightedProductId(null), 3500);
    } else {
      handleNavigateToShopCategory('all');
    }
  };

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
      {currentPage !== 'admin' && currentPage !== 'packing' && (
        <header className="sticky top-0 z-40 w-full flex flex-col shadow-md">
          <ShopAnnouncementBar
            products={products}
            removedItemsNotice={removedItemsNotice}
            onClearRemovedNotice={() => setRemovedItemsNotice(null)}
            daysThreshold={7}
            onVisibilityChange={setIsAnnouncementVisible}
            onNavigateProduct={handleAnnouncementNavigate}
          />
          <Navbar
            currentPage={currentPage}
            onNavigate={(page) => (page === 'shop' ? handleNavigateToShopCategory('all') : navigateTo(page))}
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
            highlightedProductId={highlightedProductId}
            onAddToCart={handleAddToCart}
            onNavigate={navigateTo}
          />
        )}

        {/* GỘP TOÀN BỘ CHUYỆN VƯỜN & CẨM NANG VÀO ĐÂY */}
        {currentPage === 'story' && (
          <StoryPage 
            stories={stories} 
            posts={posts} 
            onNavigate={navigateTo} 
          />
        )}

        {currentPage === 'checkout' && (
          <CheckoutPage
            cart={cart}
            onSubmitOrder={(orderData) => handleProcessOrder(orderData, cart)}
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
              onSaveConfig={(newCfg) => {
                setShopConfig(newCfg);
                localStorage.setItem('shop_config', JSON.stringify(newCfg));
              }}
              onResetConfig={() => setShopConfig(DEFAULT_SHOP_CONFIG)}
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

      <CartCenterSplash splash={centerSplash} />
    </div>
  );
}