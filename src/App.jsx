import React, { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import OrderSuccessModal from './components/OrderSuccessModal';

import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import StoryPage from './pages/StoryPage';
import BlogPage from './pages/BlogPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminPage from './pages/AdminPage';

import * as productModule from './data/products';
import * as postModule from './data/posts';
import { getShopConfig, DEFAULT_SHOP_CONFIG } from './config/shopConfig';

const initialProducts = 
  productModule.PRODUCTS || 
  productModule.products || 
  productModule.default || 
  [];

const initialPosts = 
  postModule.POSTS || 
  postModule.posts || 
  postModule.default || 
  [];

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [shopConfig, setShopConfig] = useState(() => getShopConfig());

  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('shop_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return initialProducts;
  });

  const [posts, setPosts] = useState(() => {
    try {
      const saved = localStorage.getItem('shop_posts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return initialPosts;
  });

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('shop_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // State kiểm soát hiệu ứng rung giỏ hàng, ép hiện Navbar và splash giữa màn hình
  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const [forceNavVisible, setForceNavVisible] = useState(false);
  const [centerSplash, setCenterSplash] = useState(null); // { image, quantity }

  useEffect(() => {
    try {
      localStorage.setItem('shop_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [successOrderInfo, setSuccessOrderInfo] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

// Xử lý thêm vào giỏ: Chỉ hiện Splash to giữa màn hình -> Splash tắt tự nhiên (không bật CartDrawer)
  const handleAddToCart = (product, weightObj, quantity = 1) => {
    // -------------------------------------------------------------------------
    // PHA 1 (0ms): Bật ngay Splash to giữa màn hình + Kéo Navbar xuống tầm mắt
    // -------------------------------------------------------------------------
    setCenterSplash({
      image: product.image,
      quantity: quantity
    });
    setForceNavVisible(true);

    // -------------------------------------------------------------------------
    // PHA 2 (280ms): Cập nhật dữ liệu giỏ hàng + Nảy số icon giỏ trên Navbar
    // -------------------------------------------------------------------------
    setTimeout(() => {
      const multiplier = weightObj?.multiplier || 1;
      const bonus = weightObj?.priceBonus || 0;
      const base = Number(product.basePrice || product.price || 0);
      const unitPrice = Math.round((base + bonus) * multiplier);

      const flavorTag = weightObj?.flavor ? `-${weightObj.flavor}` : '';
      const cartItemId = `${product.id}-${weightObj?.id || 'std'}${flavorTag}`;

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
            name: product.name,
            price: unitPrice,
            flavor: weightObj?.flavor || null,
            weightLabel: weightObj?.label || product.unit || 'Tiêu chuẩn',
            image: product.image,
            quantity: quantity
          }
        ];
      });

      setIsCartBouncing(true);
      setTimeout(() => {
        setIsCartBouncing(false);
      }, 600);
    }, 280);

    // -------------------------------------------------------------------------
    // PHA 3 (850ms): Tắt hẳn Splash giữa màn hình, khách tiếp tục thoải mái lướt xem
    // -------------------------------------------------------------------------
    setTimeout(() => {
      setCenterSplash(null);
    }, 850);

    setTimeout(() => {
      setForceNavVisible(false);
    }, 2000);
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
      note: orderData.customer?.note || orderData.note || '',
      address: orderData.address || '',
      paymentMethod: orderData.paymentMethod || 'deposit',
      deliveryBatch: orderData.deliveryBatch || 'Chuyến gần nhất',
      total: totalAmount,
      rawTotal: orderData.rawTotal || totalAmount,
      discount: orderData.discount || 0,
      voucherCode: orderData.voucherCode || '',
      cart: cart
    };

    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        fetch(webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        }).catch((err) => console.error('Lỗi webhook:', err));
      } catch (err) {
        console.error('Lỗi fetch webhook:', err);
      }
    }

    try {
      const existing = JSON.parse(localStorage.getItem('shop_orders') || '[]');
      localStorage.setItem('shop_orders', JSON.stringify([orderPayload, ...existing]));
    } catch (err) {
      console.error(err);
    }

    setSuccessOrderInfo({
      code: orderCode,
      total: totalAmount
    });
    setIsSuccessModalOpen(true);
    setCart([]);
    setIsCartOpen(false);
    setCurrentPage('home');
  };

  const navigateTo = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalCartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalCartAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#faf8f5] text-stone-800 flex flex-col font-sans">
      {/* Navbar hỗ trợ tự hiện khi cuộn lên hoặc khi thêm món */}
      {currentPage !== 'admin' && (
        <Navbar
          currentPage={currentPage}
          onNavigate={navigateTo}
          cartCount={totalCartCount}
          cartTotal={totalCartAmount}
          onOpenCart={() => setIsCartOpen(true)}
          isCartBouncing={isCartBouncing}
          forceVisible={forceNavVisible}
        />
      )}

      {/* Main Container có pt-16 khi có Navbar fixed */}
      <main className={`flex-1 w-full max-w-full ${currentPage !== 'admin' ? 'pt-16' : ''}`}>
        {currentPage === 'home' && (
          <HomePage
            products={products}
            onAddToCart={handleAddToCart}
            onNavigateShop={() => navigateTo('shop')}
            onNavigateStory={() => navigateTo('story')}
            onNavigate={navigateTo}
          />
        )}

        {currentPage === 'shop' && (
          <ShopPage
            products={products}
            onAddToCart={handleAddToCart}
            onNavigate={navigateTo}
          />
        )}

        {currentPage === 'story' && (
          <StoryPage onNavigate={navigateTo} />
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
            onSaveProducts={(newList) => {
              setProducts(newList);
              localStorage.setItem('shop_products', JSON.stringify(newList));
            }}
            onResetProducts={() => {
              setProducts(initialProducts);
              localStorage.setItem('shop_products', JSON.stringify(initialProducts));
            }}
            posts={posts}
            onSavePosts={(newList) => {
              setPosts(newList);
              localStorage.setItem('shop_posts', JSON.stringify(newList));
            }}
            onResetPosts={() => {
              setPosts(initialPosts);
              localStorage.setItem('shop_posts', JSON.stringify(initialPosts));
            }}
            shopConfig={shopConfig}
            onSaveConfig={(newCfg) => {
              setShopConfig(newCfg);
              localStorage.setItem('shop_config', JSON.stringify(newCfg));
            }}
            onResetConfig={() => {
              setShopConfig(DEFAULT_SHOP_CONFIG);
              localStorage.setItem('shop_config', JSON.stringify(DEFAULT_SHOP_CONFIG));
            }}
            onNavigateHome={() => navigateTo('home')}
          />
        )}
      </main>

      {/* Cart Drawer */}
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

      {/* Modal Thông Báo Đặt Hàng Thành Công */}
      <OrderSuccessModal
        isOpen={isSuccessModalOpen}
        orderInfo={successOrderInfo}
        onClose={() => setIsSuccessModalOpen(false)}
      />

      {/* Footer Shop */}
      {currentPage !== 'admin' && (
        <Footer onNavigateAdmin={() => navigateTo('admin')} />
      )}

      {/* ================= HIỆU ỨNG TẬP TRUNG GIỮA MÀN HÌNH (CENTER SPLASH - PHÓNG TO RÕ RÀNG) ================= */}
      {/* ================= HIỆU ỨNG TẬP TRUNG GIỮA MÀN HÌNH (GỌN GÀNG, CÂN XỨNG) ================= */}
{centerSplash && (
  <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
    <div className="animate-center-splash flex flex-col items-center justify-center p-5 rounded-3xl bg-stone-900/95 text-white shadow-2xl backdrop-blur-md border border-amber-500/40 text-center">
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
        {/* Badge số lượng nảy góc phải */}
        <span className="absolute -top-2.5 -right-2.5 bg-emerald-500 text-white font-black text-sm px-2.5 py-0.5 rounded-full border-2 border-stone-900 shadow-md">
          +{centerSplash.quantity}
        </span>
      </div>
      
      {/* Dòng chữ gọn gàng cân xứng với ảnh */}
      <div className="mt-3 flex items-center gap-1.5 text-amber-400 font-bold text-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Đã thêm vào giỏ hàng</span>
      </div>
    </div>
  </div>
)}
    </div>
  );
}