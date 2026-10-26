// src/components/Navbar.jsx
import React, { useState } from 'react';
import { ShoppingBag, Sprout, Menu, X, Search } from 'lucide-react';

export default function Navbar({ 
  currentPage, 
  onNavigate, 
  cartCount = 0, 
  cartTotal = 0,
  onOpenLookup,
  isCartBouncing = false,
  shopConfig = {}
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const brandName = shopConfig?.brandName || 'XỨ NẮNG GIÓ';
  const tagline = shopConfig?.tagline || 'Đặc Sản Ninh Thuận Hái Sớm';

  const navItems = [
    { id: 'home', label: 'Trang Chủ' },
    { id: 'shop', label: 'Cửa Hàng' },
    { id: 'story', label: 'Chuyện Vườn' },
    { id: 'blog', label: 'Cẩm Nang' },
  ];

  const handleCartClick = () => {
    setIsMobileMenuOpen(false);
    if (onNavigate) onNavigate('checkout');
  };

  const handleLookupClick = () => {
    setIsMobileMenuOpen(false);
    if (onOpenLookup) onOpenLookup();
  };

  const handleNavClick = (id) => {
    setIsMobileMenuOpen(false);
    if (onNavigate) onNavigate(id);
  };

  return (
    <div className="w-full bg-stone-950/95 backdrop-blur-md border-b border-stone-800 text-stone-200 font-sans shadow-md">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        
        {/* Logo & Tên Vườn */}
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3 text-left group cursor-pointer shrink-0"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform shrink-0">
            <Sprout className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 max-w-[220px] sm:max-w-md lg:max-w-lg">
            <span className="font-black text-sm sm:text-lg tracking-wide text-white block uppercase truncate">
              {brandName}
            </span>
            <span className="text-xs text-amber-400 font-medium block truncate mt-0.5 opacity-90" title={tagline}>
              {tagline}
            </span>
          </div>
        </button>

        {/* Menu Desktop */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`px-3.5 lg:px-4 py-2 rounded-xl text-sm sm:text-base font-bold transition-all cursor-pointer ${
                currentPage === item.id
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/80'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Cụm Nút Tra Cứu, Giỏ Hàng & Menu Mobile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Nút Tra Cứu Đơn (Desktop & Tablet) */}
          <button
            type="button"
            onClick={handleLookupClick}
            className="hidden sm:flex items-center gap-2 py-2 px-3.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 hover:border-amber-500/40 text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
            title="Tra cứu lịch sử đơn hàng"
          >
            <Search className="w-4 h-4 text-amber-400" />
            <span>Tra cứu đơn</span>
          </button>

          {/* Kính lúp mobile */}
          <button
            type="button"
            onClick={handleLookupClick}
            className="sm:hidden p-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-amber-400 border border-stone-800 active:scale-95 transition-all cursor-pointer shadow-2xs"
            title="Tra cứu đơn"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Nút Giỏ Hàng */}
          <button
            type="button"
            onClick={handleCartClick}
            className={`relative py-2 px-3 sm:px-3.5 rounded-2xl border transition-all active:scale-95 flex items-center gap-2.5 cursor-pointer shadow-2xs ${
              isCartBouncing 
                ? 'animate-cart-pop bg-amber-500 border-amber-300 text-stone-950 shadow-[0_0_20px_rgba(245,158,11,0.6)]' 
                : 'bg-stone-900 hover:bg-stone-800 text-stone-200 border-stone-800 hover:border-amber-500/40'
            }`}
            title="Xem đơn hàng & Thanh toán"
          >
            <div className="relative flex items-center justify-center">
              <ShoppingBag 
                className={`w-5 h-5 transition-transform ${
                  isCartBouncing ? 'text-stone-950 scale-110' : 'text-amber-400'
                }`} 
              />
              
              {cartCount > 0 && (
                <span 
                  className={`absolute -top-2.5 -right-2.5 min-w-[18px] h-[18px] px-1 font-black text-[10px] rounded-full flex items-center justify-center shadow-xs transition-all ${
                    isCartBouncing 
                      ? 'bg-stone-950 text-amber-400 scale-110' 
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {cartCount}
                </span>
              )}
            </div>

            {cartCount > 0 && cartTotal > 0 && (
              <>
                <div className={`h-4 w-px ${isCartBouncing ? 'bg-stone-950/30' : 'bg-stone-700/80'}`} />
                <span className={`font-mono text-xs sm:text-sm font-black tracking-tight transition-colors ${
                  isCartBouncing ? 'text-stone-950' : 'text-amber-300'
                }`}>
                  {cartTotal.toLocaleString('vi-VN')}₫
                </span>
              </>
            )}
          </button>

          {/* Nút Toggle Menu Mobile */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors cursor-pointer"
            title={isMobileMenuOpen ? "Đóng menu" : "Mở menu"}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Menu thả xuống trên Mobile */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-stone-900/98 border-t border-stone-800 px-4 sm:px-6 py-4 space-y-2 animate-fadeIn shadow-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800/80 text-xs font-bold text-stone-400 uppercase tracking-wider">
            <span>Danh mục điều hướng</span>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
              title="Đóng menu"
            >
              <span>Đóng</span>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1 pt-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-4 py-3 rounded-2xl text-sm sm:text-base font-bold transition-all flex items-center justify-between cursor-pointer ${
                  currentPage === item.id
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-stone-200 hover:bg-stone-800'
                }`}
              >
                <span>{item.label}</span>
                {currentPage === item.id && <span className="w-2 h-2 rounded-full bg-white"></span>}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleLookupClick}
            className="w-full text-left px-4 py-3 rounded-2xl text-sm sm:text-base font-bold text-amber-400 hover:bg-stone-800 flex items-center gap-2.5 cursor-pointer pt-3 border-t border-stone-800"
          >
            <Search className="w-4 h-4" />
            <span>Tra cứu đơn hàng của bạn</span>
          </button>
        </div>
      )}
    </div>
  );
}