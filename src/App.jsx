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

  // Thêm vào giỏ hàng
  const handleAddToCart = (product, weightObj, quantity = 1) => {
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
      {currentPage !== 'admin' && (
        <Navbar
          currentPage={currentPage}
          onNavigate={navigateTo}
          cartCount={totalCartCount}
          onOpenCart={() => setIsCartOpen(true)}
        />
      )}

      <main className="flex-1 w-full max-w-full">
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

      {/* Nút Giỏ Hàng Nổi (Floating Cart Bar): Khách lướt đến đâu cũng thấy số lượng & giá, bấm là mở giỏ */}
      {totalCartCount > 0 && currentPage !== 'checkout' && currentPage !== 'admin' && (
        <aside aria-label="Giỏ hàng nhanh" className="fixed bottom-6 right-5 sm:right-8 z-40 animate-bounce-subtle">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-3 bg-amber-700 hover:bg-amber-600 active:scale-95 text-white pl-4 pr-5 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all border border-amber-600/40"
          >
            <div className="relative flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
              <span className="absolute -top-2.5 -right-2.5 bg-stone-900 text-amber-200 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                {totalCartCount}
              </span>
            </div>
            <div className="text-left font-mono font-bold text-xs sm:text-sm pl-1 border-l border-amber-600/60">
              {totalCartAmount.toLocaleString('vi-VN')}đ
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full hidden sm:inline-block">
              Xem giỏ
            </span>
          </button>
        </aside>
      )}

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
        onClose={() => setIsSuccessModalOpen(false)}
      />

      {currentPage !== 'admin' && (
        <Footer onNavigateAdmin={() => navigateTo('admin')} />
      )}
    </div>
  );
}