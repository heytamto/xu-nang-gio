import React, { useState, useEffect } from 'react';
import { ShoppingBag, Sprout, Menu, X } from 'lucide-react';

export default function Navbar({ 
  currentPage, 
  onNavigate, 
  cartCount = 0, 
  cartTotal = 0,
  onOpenCart,
  isCartBouncing = false,
  forceVisible = false // Nhận tín hiệu ép hiện khi bấm mua
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const navItems = [
    { id: 'home', label: 'Trang Chủ' },
    { id: 'shop', label: 'Cửa Hàng' },
    { id: 'story', label: 'Chuyện Vườn' },
    { id: 'blog', label: 'Cẩm Nang' },
  ];

  // Nếu có tín hiệu thêm món (forceVisible), lập tức hiện Navbar
  useEffect(() => {
    if (forceVisible) {
      setIsVisible(true);
    }
  }, [forceVisible]);

  // Logic kiểm soát cuộn trang
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (isMobileMenuOpen) return;

      if (currentScrollY < 20) {
        setIsVisible(true);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isMobileMenuOpen]);

  const handleCartClick = () => {
    setIsMobileMenuOpen(false);
    if (onOpenCart) {
      onOpenCart();
    } else if (onNavigate) {
      onNavigate('checkout');
    }
  };

  const handleNavClick = (id) => {
    setIsMobileMenuOpen(false);
    onNavigate(id);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-40 bg-stone-950/95 backdrop-blur-md border-b border-stone-800 text-stone-200 transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0 shadow-lg' : '-translate-y-full shadow-none'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo Vườn */}
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2.5 text-left group"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <span className="font-black text-sm tracking-wide text-white block">XỨ NẮNG GIÓ</span>
            <span className="text-[10px] text-amber-400 font-semibold block leading-none">Đặc Sản Ninh Thuận</span>
          </div>
        </button>

        {/* Menu Desktop */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentPage === item.id
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/70'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Nút Giỏ Hàng Phóng To Khi Thêm */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCartClick}
            className={`relative py-1.5 px-3 rounded-xl border transition-all active:scale-95 flex items-center gap-2 ${
              isCartBouncing 
                ? 'animate-cart-pop bg-amber-500 border-amber-300 text-stone-950 shadow-[0_0_20px_rgba(245,158,11,0.6)]' 
                : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700/80'
            }`}
            title="Xem giỏ hàng"
          >
            <div className="relative">
              <ShoppingBag className={`w-4 h-4 transition-colors ${isCartBouncing ? 'text-stone-950 scale-110' : 'text-amber-500'}`} />
              
              {cartCount > 0 && (
                <span className={`absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-1 font-black text-[10px] rounded-full flex items-center justify-center shadow-md transition-all ${
                  isCartBouncing 
                    ? 'bg-stone-950 text-amber-400 scale-125' 
                    : 'bg-amber-500 text-stone-950'
                }`}>
                  {cartCount}
                </span>
              )}
            </div>

            {cartCount > 0 && cartTotal > 0 && (
              <span className={`hidden sm:inline font-mono text-xs font-bold transition-colors ${
                isCartBouncing ? 'text-stone-950' : 'text-amber-400'
              }`}>
                {cartTotal.toLocaleString('vi-VN')}đ
              </span>
            )}
          </button>

          {/* Toggle Menu Mobile */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors"
            title="Mở menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Drawer Dropdown Mobile */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-stone-900 border-b border-stone-800 px-4 py-3 space-y-1 animate-fadeIn">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                currentPage === item.id
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-stone-300 hover:bg-stone-800'
              }`}
            >
              <span>{item.label}</span>
              {currentPage === item.id && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}