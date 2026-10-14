import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Sparkles, 
  Apple, 
  Flame, 
  Wine, 
  Fish, 
  ShoppingBag, 
  Check, 
  MapPin, 
  ShieldCheck, 
  ArrowRight
} from 'lucide-react';
import { CATEGORIES } from '../data/products';

// Ánh xạ icon tương ứng với từng danh mục
const categoryIcons = {
  fresh: Apple,
  dried: Flame,
  condiments: Wine,
  seafood: Fish
};

// Loại bỏ 'all' để giao diện chỉ giữ lại đúng 4 danh mục thực tế
const FILTER_CATEGORIES = CATEGORIES.filter((cat) => cat.id !== 'all');

export default function ShopPage({ products = [], onAddToCart, onNavigate }) {
  // Mảng lưu danh sách categoryId đang được chọn
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWeights, setSelectedWeights] = useState({});
  const [addedItemEffect, setAddedItemEffect] = useState(null);

  // Toggle chọn / bỏ chọn danh mục
  const handleToggleCategory = (catId) => {
    setSelectedCategories((prev) => {
      if (prev.includes(catId)) {
        return prev.filter((id) => id !== catId);
      } else {
        return [...prev, catId];
      }
    });
  };

  // Lọc sản phẩm: Nếu không chọn danh mục nào thì mặc định hiển thị tất cả
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        selectedCategories.length === 0 || selectedCategories.includes(p.category);

      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (p.source && p.source.toLowerCase().includes(searchQuery.toLowerCase().trim())) ||
        (p.desc && p.desc.toLowerCase().includes(searchQuery.toLowerCase().trim()));

      return matchCat && matchSearch;
    });
  }, [products, selectedCategories, searchQuery]);

  const handleSelectWeight = (productId, weightOption) => {
    setSelectedWeights((prev) => ({
      ...prev,
      [productId]: weightOption
    }));
  };

  const handleAddToCartClick = (product) => {
    const defaultWeight = product.weights?.[0] || { id: 'std', label: product.unit || 'Tiêu chuẩn', multiplier: 1 };
    const activeWeight = selectedWeights[product.id] || defaultWeight;

    if (onAddToCart) {
      onAddToCart(product, activeWeight, 1);
    }

    setAddedItemEffect(product.id);
    setTimeout(() => {
      setAddedItemEffect(null);
    }, 1200);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* ================= 1. BANNER TIÊU ĐỀ TRANG ================= */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
            <ShieldCheck className="w-4 h-4" />
            <span>Nông sản & Đặc sản nắng gió Ninh Thuận</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Gian Hàng Đặc Sản Xứ Nắng Gió
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            Hái tươi tại giàn, bọc xốp chống dập, gửi xe thẳng vào Sài Gòn và các tỉnh. Có thể chọn kết hợp nhiều danh mục để tìm món ưng ý.
          </p>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-amber-600/10 to-transparent pointer-events-none" />
      </div>

      {/* ================= 2. BỘ LỌC ĐA DANH MỤC & TÌM KIẾM ================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/90 shadow-xs space-y-4">
        
        {/* TẦNG 1: Ô TÌM KIẾM RỘNG RÃI & NÚT ĐẶT LẠI */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm theo tên đặc sản (táo, nho, mực, tỏi...), xuất xứ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-3 rounded-2xl border border-stone-200 bg-stone-50/60 focus:bg-white focus:outline-none focus:border-amber-600 font-medium text-stone-800 shadow-2xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 text-xs text-stone-500">
            <span>
              {selectedCategories.length > 0 ? (
                <>Đang lọc: <strong className="text-amber-800 font-bold">{selectedCategories.length} danh mục</strong> ({filteredProducts.length} món)</>
              ) : (
                <>Tất cả: <strong className="text-stone-900 font-bold font-mono">{filteredProducts.length}</strong> món</>
              )}
            </span>

            {/* Nút xem lại tất cả khi đang có điều kiện lọc hoặc từ khóa */}
            {(selectedCategories.length > 0 || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategories([]);
                  setSearchQuery('');
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[11px] transition-all border border-amber-200/60"
              >
                Xem tất cả
              </button>
            )}
          </div>
        </div>

        {/* TẦNG 2: 4 DANH MỤC CHIA ĐỀU 4 CỘT CÂN ĐỐI (KHÔNG CÒN TRỐNG, KHÔNG XÔ CHỮ) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-stone-100">
          {FILTER_CATEGORIES.map((cat) => {
            const Icon = categoryIcons[cat.id] || Sparkles;
            const isCatActive = selectedCategories.includes(cat.id);

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleToggleCategory(cat.id)}
                className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-98 border select-none ${
                  isCatActive
                    ? 'bg-amber-700 text-white border-amber-700 shadow-xs ring-1 ring-amber-700'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200/90'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform ${isCatActive ? 'text-amber-200 scale-110' : 'text-stone-400'}`} />
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= 3. DANH SÁCH SẢN PHẨM ================= */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/80 shadow-xs space-y-3">
          <p className="text-stone-500 text-sm">Không tìm thấy món đặc sản nào khớp với bộ lọc hiện tại.</p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategories([]);
              setSearchQuery('');
            }}
            className="text-xs font-bold text-amber-800 hover:underline inline-flex items-center gap-1"
          >
            <span>Đặt lại bộ lọc (Xem tất cả)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredProducts.map((product) => {
            const defaultWeight = product.weights?.[0] || { id: 'std', label: product.unit || 'Tiêu chuẩn', multiplier: 1 };
            const activeWeight = selectedWeights[product.id] || defaultWeight;
            
            const base = Number(product.basePrice || product.price || 0);
            const multiplier = activeWeight.multiplier || 1;
            const bonus = activeWeight.priceBonus || 0;
            const currentPrice = Math.round((base + bonus) * multiplier);

            const isJustAdded = addedItemEffect === product.id;

            return (
              <div
                key={product.id}
                className="bg-white rounded-3xl border border-stone-200/80 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Ảnh sản phẩm + Nguồn gốc + Badge */}
                <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  
                  {product.badge && (
                    <span className="absolute top-3 left-3 bg-stone-900/85 backdrop-blur-xs text-amber-200 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                      {product.badge}
                    </span>
                  )}

                  {product.source && (
                    <span className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-xs text-stone-700 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 truncate shadow-2xs">
                      <MapPin className="w-3 h-3 text-amber-700 shrink-0" />
                      <span className="truncate">{product.source}</span>
                    </span>
                  )}
                </div>

                {/* Nội dung card */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm leading-snug line-clamp-2 group-hover:text-amber-800 transition-colors">
                      {product.name}
                    </h3>
                    {product.desc && (
                      <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                        {product.desc}
                      </p>
                    )}
                  </div>

                  {/* Lựa chọn quy cách (weights / options) */}
                  {product.weights && product.weights.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                        Chọn quy cách:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {product.weights.map((w) => {
                          const isWeightActive = activeWeight.id === w.id;
                          return (
                            <button
                              key={w.id}
                              type="button"
                              onClick={() => handleSelectWeight(product.id, w)}
                              className={`text-[10.5px] px-2.5 py-1 rounded-xl font-bold transition-all border ${
                                isWeightActive
                                  ? 'bg-amber-50 text-amber-900 border-amber-600 shadow-2xs'
                                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                              }`}
                            >
                              {w.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Giá & Nút Thêm Vào Giỏ */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-stone-400 block">Đơn giá:</span>
                      <span className="font-mono font-black text-amber-900 text-base">
                        {currentPrice.toLocaleString('vi-VN')}đ
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToCartClick(product)}
                      className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs ${
                        isJustAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-900 hover:bg-amber-700 text-white'
                      }`}
                    >
                      {isJustAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Đã thêm</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Thêm giỏ</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}