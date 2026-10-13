import React, { useState } from 'react';
import ProductCard from '../components/ProductCard';

export default function ShopPage({ products = [], onAddToCart }) {
  const [filter, setFilter] = useState('all');

  const categories = [
    { id: 'all', label: 'Tất Cả Đặc Sản' },
    { id: 'dried', label: 'Táo Sấy Dẻo Handmade' },
    { id: 'fresh', label: 'Trái Cây Tươi' },
    { id: 'drinks', label: 'Rượu Nho & Mật Nho' },
  ];

  const safeProducts = Array.isArray(products) ? products : [];

  const filteredProducts = filter === 'all'
    ? safeProducts
    : safeProducts.filter(p => p.category === filter);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 overflow-hidden">
      {/* Tiêu đề trang */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h1 className="text-3xl font-black text-stone-900 tracking-tight">Cửa Hàng Đặc Sản Vườn</h1>
        <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
          Chọn hương vị yêu thích: Táo sấy dẻo không tắc, thêm lát tắc chua thanh, hoặc lắc muối ớt cay cay đậm đà.
        </p>
      </div>

      {/* Bộ lọc danh mục */}
      <div className="flex justify-center flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setFilter(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              filter === cat.id
                ? 'bg-amber-600 text-white shadow'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Lưới sản phẩm */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center text-stone-400 text-xs bg-white rounded-3xl border border-stone-200 shadow-xs">
          Không có sản phẩm nào trong danh mục này.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
          ))}
        </div>
      )}
    </div>
  );
}
