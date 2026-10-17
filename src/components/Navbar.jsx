import React, { useState, useEffect } from 'react';
import { ShoppingBag, Sprout, Menu, X, Search } from 'lucide-react';

export default function Navbar({ 
  currentPage, 
  onNavigate, 
  cartCount = 0, 
  cartTotal = 0,
  onOpenCart,
  onOpenLookup,
  isCartBouncing = false,
  forceVisible = false
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

  const handleLookupClick = () => {
    setIsMobileMenuOpen(false);
    if (onOpenLookup) {
      onOpenLookup();
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
      {/* ĐÃ SỬA: Đổi max-w-6xl thành max-w-7xl và padding px-4 sm:px-6 lg:px-8 để thẳng hàng 100% với nội dung trang */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo Vườn */}
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2.5 text-left group cursor-pointer"
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentPage === item.id
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/70'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Cụm Nút Tra Cứu, Giỏ Hàng & Menu Mobile */}
        <div className="flex items-center gap-2">
          {/* Nút Tra Cứu Đơn Hàng (Desktop & Tablet) */}
          <button
            type="button"
            onClick={handleLookupClick}
            className="hidden sm:flex items-center gap-1.5 py-1.5 px-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 hover:border-amber-500/40 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
            title="Tra cứu lịch sử đơn hàng"
          >
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span>Tra cứu đơn</span>
          </button>

          {/* Icon kính lúp dạng tròn cho màn hình điện thoại siêu nhỏ */}
          <button
            type="button"
            onClick={handleLookupClick}
            className="sm:hidden p-2 rounded-2xl bg-stone-900 hover:bg-stone-800 text-amber-400 border border-stone-800 active:scale-95 transition-all cursor-pointer"
            title="Tra cứu đơn"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Nút Giỏ Hàng */}
          <button
            type="button"
            onClick={handleCartClick}
            className={`relative py-1.5 px-3 rounded-2xl border transition-all active:scale-95 flex items-center gap-2.5 cursor-pointer ${
              isCartBouncing 
                ? 'animate-cart-pop bg-amber-500 border-amber-300 text-stone-950 shadow-[0_0_20px_rgba(245,158,11,0.6)]' 
                : 'bg-stone-900 hover:bg-stone-800 text-stone-200 border-stone-800 hover:border-amber-500/40'
            }`}
            title="Xem giỏ hàng"
          >
            <div className="relative flex items-center justify-center">
              <ShoppingBag 
                className={`w-4 h-4 transition-transform ${
                  isCartBouncing ? 'text-stone-950 scale-110' : 'text-amber-400'
                }`} 
              />
              
              {cartCount > 0 && (
                <span 
                  className={`absolute -top-2 -right-2.5 min-w-[17px] h-[17px] px-1 font-black text-[9.5px] rounded-full flex items-center justify-center shadow-xs transition-all ${
                    isCartBouncing 
                      ? 'bg-stone-950 text-amber-400 scale-110' 
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {cartCount}
                </span>
              )}
            </div>

            {/* Hiển thị số tiền nếu có hàng trong giỏ */}
            {cartCount > 0 && cartTotal > 0 && (
              <>
                <div className={`h-3.5 w-px ${isCartBouncing ? 'bg-stone-950/30' : 'bg-stone-700/80'}`} />
                <span className={`font-mono text-xs font-bold tracking-tight transition-colors ${
                  isCartBouncing ? 'text-stone-950' : 'text-amber-300'
                }`}>
                  {cartTotal.toLocaleString('vi-VN')}₫
                </span>
              </>
            )}
          </button>

          {/* Toggle Menu Mobile */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors cursor-pointer"
            title="Mở menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Drawer Dropdown Mobile (Cũng đồng bộ padding theo max-w-7xl) */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-stone-900 border-b border-stone-800 px-4 sm:px-6 py-3 space-y-1 animate-fadeIn">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                currentPage === item.id
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-stone-300 hover:bg-stone-800'
              }`}
            >
              <span>{item.label}</span>
              {currentPage === item.id && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
            </button>
          ))}

          {/* Mục Tra Cứu Đơn riêng trong menu Mobile */}
          <button
            type="button"
            onClick={handleLookupClick}
            className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold text-amber-400 hover:bg-stone-800 flex items-center gap-2 cursor-pointer pt-2 border-t border-stone-800"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Tra cứu đơn hàng của bạn</span>
          </button>
        </div>
      )}
    </header>
  );
}