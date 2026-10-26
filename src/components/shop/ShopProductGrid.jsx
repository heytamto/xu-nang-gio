// src/components/shop/ShopProductGrid.jsx
import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import ProductCard from '../ProductCard';

export default function ShopProductGrid({
  products = [],
  highlightedProductId = null,
  onAddToCart,
  onResetFilters
}) {
  if (products.length === 0) {
    return (
      <section className="bg-white rounded-3xl p-8 sm:p-14 text-center border border-dashed border-stone-300 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200/80">
          <ShoppingBag className="w-7 h-7 stroke-[1.5]" />
        </div>

        <div className="space-y-1.5">
          <h3 className="font-bold text-stone-800 text-base sm:text-lg">Không tìm thấy món phù hợp</h3>
          <p className="text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
            Không có sản phẩm nào khớp với bộ lọc hiện tại. Thử chọn lại danh mục hoặc tìm từ khóa khác nhé!
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onResetFilters}
            className="px-5 py-2.5 rounded-2xl bg-amber-900 hover:bg-amber-800 text-white text-sm font-bold transition-all shadow-xs active:scale-95 cursor-pointer inline-flex items-center gap-2"
          >
            <span>Xem lại toàn bộ kệ hàng</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between text-sm text-stone-600 px-1">
        <span>
          Hiển thị <strong className="text-stone-900 font-mono font-bold text-base">{products.length}</strong> sản phẩm
        </span>
        <span className="text-amber-800 font-semibold">Hái tươi & đóng thùng trong ngày</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.map((product) => {
          const isTargetHighlighted = highlightedProductId === product.id;

          return (
            <div
              key={product.id}
              id={`product-card-${product.id}`}
              className={`rounded-3xl transition-all duration-300 ${
                isTargetHighlighted
                  ? 'animate-highlight-card ring-4 ring-amber-500/50 shadow-2xl scale-[1.02]'
                  : ''
              }`}
            >
              <ProductCard
                product={product}
                onAddToCart={onAddToCart}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}