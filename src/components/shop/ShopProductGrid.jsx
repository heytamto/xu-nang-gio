// src/components/shop/ShopProductGrid.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingBag, ArrowRight, Video, Sparkles } from 'lucide-react';
import ProductCard from '../ProductCard';

export default function ShopProductGrid({
  products = [],
  highlightedProductId = null,
  onAddToCart,
  onViewProductDetail,
  onResetFilters
}) {
  const [onlyWithVideo, setOnlyWithVideo] = useState(false);

  // Tự động cuộn đến thẻ sản phẩm được highlight khi có param hoặc click điều hướng
  useEffect(() => {
    if (highlightedProductId) {
      const el = document.getElementById(`product-card-${highlightedProductId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedProductId]);

  // Đếm số lượng sản phẩm có video thực tế
  const videoCount = useMemo(() => {
    return products.filter((p) => Boolean(p.video_url || p.videoUrl)).length;
  }, [products]);

  // Danh sách hiển thị sau khi lọc nhanh video
  const displayedProducts = useMemo(() => {
    if (!onlyWithVideo) return products;
    return products.filter((p) => Boolean(p.video_url || p.videoUrl));
  }, [products, onlyWithVideo]);

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
    <section className="space-y-4 font-sans text-stone-800">
      {/* THANH THỐNG KÊ & NÚT LỌC VIDEO THỰC TẾ */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-stone-600 px-1">
        <div className="flex items-center gap-2">
          <span>
            Hiển thị <strong className="text-stone-900 font-mono font-bold text-sm sm:text-base">{displayedProducts.length}</strong> sản phẩm
          </span>
          <span className="text-stone-300 hidden sm:inline">•</span>
          <span className="text-amber-800 font-semibold hidden sm:inline">Hái tươi & đóng thùng trong ngày</span>
        </div>

        {/* Nút lọc nhanh sản phẩm có video Shorts */}
        {videoCount > 0 && (
          <button
            type="button"
            onClick={() => setOnlyWithVideo((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer text-xs active:scale-95 border ${
              onlyWithVideo
                ? 'bg-red-600 text-white border-red-600 shadow-xs ring-2 ring-red-500/20'
                : 'bg-white text-stone-700 border-stone-200 hover:border-red-300 hover:text-red-700 shadow-2xs'
            }`}
          >
            <Video className={`w-3.5 h-3.5 ${onlyWithVideo ? 'text-white' : 'text-red-600'}`} />
            <span>Có video thực tế ({videoCount})</span>
          </button>
        )}
      </div>

      {/* LƯỚI SẢN PHẨM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {displayedProducts.map((product) => {
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
                onViewDetail={onViewProductDetail}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}