import React, { useState } from 'react';
import { ShoppingBag, Sprout, Menu, X } from 'lucide-react';

export default function Navbar({ currentPage, onNavigate, cartCount = 0, onOpenCart }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Trang Chủ' },
    { id: 'shop', label: 'Cửa Hàng' },
    { id: 'story', label: 'Chuyện Vườn' },
    { id: 'blog', label: 'Cẩm Nang' },
  ];

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
    <header className="sticky top-0 z-40 bg-stone-950/95 backdrop-blur-md border-b border-stone-800 text-stone-200">
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

        {/* Nút Giỏ Hàng & Nút Menu Mobile */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCartClick}
            className="relative p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors active:scale-95 flex items-center justify-center"
            title="Xem giỏ hàng"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-amber-500 text-stone-950 font-black text-[10px] rounded-full flex items-center justify-center shadow-sm">
                {cartCount}
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
