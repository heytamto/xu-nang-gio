// src/App.jsx
import React, { useState, Suspense, lazy } from 'react';
import { ShoppingBag, Loader2 } from 'lucide-react';

import Navbar from '../features/storefront/components/Navbar';
import Footer from '../features/storefront/components/Footer';
import OrderSuccessModal from '../features/checkout/components/OrderSuccessModal';
import ShopAnnouncementBar from '../features/storefront/components/ShopAnnouncementBar';
import CartCenterSplash from '../features/cart/components/CartCenterSplash';
import ProductDetailModal from '../features/catalog/components/ProductDetailModal';
import TenantRegisterModal from '../features/tenants/components/TenantRegisterModal';
import ErrorPage from '../shared/components/ErrorPage';
import ErrorBoundary from '../shared/components/ErrorBoundary';

import HomePage from '../features/storefront/pages/HomePage';
const ShopPage = lazy(() => import('../features/catalog/pages/ShopPage'));
const StoryPage = lazy(() => import('../features/content/pages/StoryPage'));
const CheckoutPage = lazy(() => import('../features/checkout/pages/CheckoutPage'));
const PolicyPage = lazy(() => import('../features/storefront/pages/PolicyPage'));
const OrderLookupPage = lazy(() => import('../features/orders/pages/OrderLookupPage'));

const AdminPage = lazy(() => import('../features/admin/pages/AdminPage'));
const PackingPage = lazy(() => import('../features/warehouse/pages/PackingPage'));

import { DEFAULT_SHOP_CONFIG } from '../features/shop-config/config/shopConfig';
import { useStorefrontData } from './hooks/useStorefrontData';
import { useAppNavigation } from './hooks/useAppNavigation';
import { useCartManager } from '../features/cart/hooks/useCartManager';
import { useShopOrders } from '../features/orders/hooks/useShopOrders';

function MainAppContent() {
  const { currentPage, setCurrentPage, selectedShopCategory, highlightedProductId, initialLookupCode, navigateTo, handleNavigateToShopCategory, handleAnnouncementNavigate } = useAppNavigation();
  const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(false);
  // Modals & Lookup state
  const [selectedDetailProduct, setSelectedDetailProduct] = useState(null);
  const [isTenantRegisterOpen, setIsTenantRegisterOpen] = useState(false);

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
    syncCartWithMasterData,
  } = useCartManager();

  // 2. Quản lý Đơn hàng qua Hook
  const {
    handleUpdateOrderStatus,
    handleProcessOrder,
    successOrderInfo,
    isSuccessModalOpen,
    setIsSuccessModalOpen,
  } = useShopOrders(clearCart, false);

  const { serverErrorDetail, shopConfig, setShopConfig, categories, products, setProducts, posts, setPosts, stories, setStories, isLoadingMasterData, loadSupabaseData } = useStorefrontData({ syncCartWithMasterData, setCurrentPage, currentPage });

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

  const isErrorPage = ['400', '404', '500'].includes(String(currentPage));

  return (
    <div className="min-h-screen w-full max-w-full [overflow-x:clip] bg-[#faf8f5] text-stone-800 flex flex-col font-sans relative">
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
              navigateTo('lookup');
            }}
            isCartBouncing={isCartBouncing}
            forceVisible={forceNavVisible}
            shopConfig={shopConfig}
          />
        </header>
      )}

      <main className="flex-1 w-full max-w-full">
        <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center gap-2"><Loader2 className="w-6 h-6 animate-spin" />Đang tải trang...</div>}>
        {currentPage === 'home' && (
          <HomePage
            products={products}
            categories={categories}
            shopConfig={shopConfig}
            onAddToCart={handleAddToCart}
            onNavigateShop={handleNavigateToShopCategory}
            onNavigateStory={() => navigateTo('story')}
            onNavigate={navigateTo}
            onViewProductDetail={(prod) => setSelectedDetailProduct(prod)}
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
            onViewProductDetail={(prod) => setSelectedDetailProduct(prod)}
          />
        )}

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

        {currentPage === 'lookup' && (
          <OrderLookupPage
            shopConfig={shopConfig}
            initialCode={initialLookupCode}
            onNavigate={navigateTo}
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
              onSaveProducts={(newList) => {
                setProducts(newList);
              }}
              onResetProducts={loadSupabaseData}
              posts={posts}
              onSavePosts={(newList) => {
                setPosts(newList);
              }}
              onResetPosts={loadSupabaseData}
              stories={stories}
              onSaveStories={(newList) => {
                setStories(newList);
              }}
              onResetStories={loadSupabaseData}
              shopConfig={shopConfig}
              onSaveConfig={(newCfg) => {
                setShopConfig(newCfg);
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
              shopConfig={shopConfig}
              onNavigateHome={() => navigateTo('home')}
            />
          </Suspense>
        )}

        {/* TRANG BÁO LỖI 400 / 404 / 500 */}
        {isErrorPage && (
          <ErrorPage
            statusCode={Number(currentPage)}
            errorDetail={currentPage === '500' ? serverErrorDetail : null}
            onReset={() => {
              setCurrentPage('home');
              loadSupabaseData();
            }}
            onGoHome={() => navigateTo('home')}
            onGoShop={() => handleNavigateToShopCategory('all')}
          />
        )}
        </Suspense>
      </main>

      {/* Modal Xem chi tiết & Phóng to nhiều ảnh sản phẩm */}
      <ProductDetailModal
        isOpen={Boolean(selectedDetailProduct)}
        product={selectedDetailProduct}
        onClose={() => setSelectedDetailProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Modal Đăng ký gian hàng mới cho Chủ vườn */}
      <TenantRegisterModal
        isOpen={isTenantRegisterOpen}
        onClose={() => setIsTenantRegisterOpen(false)}
        adminBankConfig={{
          bankId: shopConfig?.bankId || 'MB',
          accountNo: shopConfig?.bankAccount || '0901234567',
          accountName: shopConfig?.bankOwner || 'TO THANH TAM',
        }}
      />

      <OrderSuccessModal
        isOpen={isSuccessModalOpen}
        orderInfo={successOrderInfo}
        onClose={() => {
          setIsSuccessModalOpen(false);
          navigateTo('home');
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
            navigateTo('lookup');
          }}
          onOpenTenantRegister={() => setIsTenantRegisterOpen(true)}
        />
      )}

      <CartCenterSplash splash={centerSplash} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainAppContent />
    </ErrorBoundary>
  );
}