import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  Apple, 
  Flame, 
  Wine, 
  Fish, 
  Sun,
  ShoppingBag, 
  ShieldCheck, 
  ArrowRight,
  Leaf,
  Heart,
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import ProductCard from '../components/ProductCard';

// Ánh xạ linh hoạt theo tên icon khai báo trên Google Sheet
const ICON_MAP = {
  Apple,
  Sparkles,
  Fish,
  Wine,
  Sun,
  Flame,
  ShoppingBag,
  Leaf,
  Heart
};

export default function ShopPage({ 
  products = [], 
  categories = [], 
  initialCategory = null, 
  onAddToCart, 
  onNavigate 
}) {
  const [selectedCategories, setSelectedCategories] = useState(() => {
    if (initialCategory && initialCategory !== 'all') {
      return [initialCategory];
    }
    return [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default'); // default | price-asc | price-desc | name

  // Cập nhật lại bộ lọc nếu initialCategory từ ngoài truyền vào thay đổi
  useEffect(() => {
    if (initialCategory && initialCategory !== 'all') {
      setSelectedCategories([initialCategory]);
    } else if (initialCategory === 'all') {
      setSelectedCategories([]);
    }
  }, [initialCategory]);

  // Toggle chọn / bỏ chọn danh mục (Multi-select)
  const handleToggleCategory = (catId) => {
    setSelectedCategories((prev) => {
      if (prev.includes(catId)) {
        return prev.filter((id) => id !== catId);
      } else {
        return [...prev, catId];
      }
    });
  };

  const handleSelectAllCategories = () => {
    setSelectedCategories([]);
  };

  // Lọc sản phẩm theo danh mục và từ khóa tìm kiếm, sau đó sắp xếp
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const matchCat =
        selectedCategories.length === 0 || selectedCategories.includes(p.category);

      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        p.name?.toLowerCase().includes(query) ||
        (p.source && p.source.toLowerCase().includes(query)) ||
        (p.desc && p.desc.toLowerCase().includes(query));

      return matchCat && matchSearch;
    });

    if (sortBy === 'price-asc') {
      result.sort((a, b) => (Number(a.basePrice || a.price) || 0) - (Number(b.basePrice || b.price) || 0));
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => (Number(b.basePrice || b.price) || 0) - (Number(a.basePrice || a.price) || 0));
    } else if (sortBy === 'name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
    }

    return result;
  }, [products, selectedCategories, searchQuery, sortBy]);

  const displayCategories = useMemo(() => {
    return categories.filter((c) => c.id !== 'all');
  }, [categories]);

  // Đếm số lượng sản phẩm của từng danh mục
  const categoryCounts = useMemo(() => {
    const counts = {};
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fadeIn font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* ================= 1. BANNER TIÊU ĐỀ TRANG ================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950 text-white p-8 sm:p-12 shadow-xl border border-stone-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-xs text-amber-300 text-xs font-bold border border-amber-400/20 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Nông Sản Tươi Hái Mỗi Sáng • Đóng Thùng Xốp Gửi Xe</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Gian Hàng Đặc Sản <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200 bg-clip-text text-transparent">
              Chính Gốc Xứ Nắng Gió
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-light max-w-2xl">
            Tất cả táo gió, nho mộc, rượu nho và hải sản phơi ráo đều được chuẩn bị kỹ lưỡng tại Phan Rang, bảo quản giữ trọn độ tươi giòn gửi vào bến xe TP.HCM và các tỉnh toàn quốc.
          </p>

          <div className="flex flex-wrap items-center gap-5 pt-2 text-[11px] text-stone-400 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Hút chân không & bọc chống sốc
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Đổi trả 100% nếu dập hỏng
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Tặng quà quê khi chuyển khoản
            </span>
          </div>
        </div>
      </section>

      {/* ================= 2. BỘ LỌC TÌM KIẾM & DANH MỤC TRÊN 1 HÀNG ================= */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-xs space-y-4">
        
        {/* Hàng 1: Ô tìm kiếm + Sắp xếp */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm táo giòn, nho đỏ, rượu ủ, mực một nắng, tỏi Phan Rang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-9 py-3 rounded-2xl border border-stone-200 bg-stone-50/80 focus:bg-white focus:outline-none focus:border-amber-600 font-medium text-stone-800 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-700 text-xs px-1 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sắp xếp giá & tên */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex items-center">
              <SlidersHorizontal className="w-3.5 h-3.5 text-stone-400 absolute left-3 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs pl-8 pr-7 py-3 rounded-2xl border border-stone-200 bg-stone-50/80 hover:bg-white text-stone-700 font-bold focus:outline-none focus:border-amber-600 cursor-pointer transition-all"
              >
                <option value="default">Mặc định</option>
                <option value="price-asc">Giá: Thấp → Cao</option>
                <option value="price-desc">Giá: Cao → Thấp</option>
                <option value="name">Tên: A → Z</option>
              </select>
            </div>

            {(selectedCategories.length > 0 || searchQuery || sortBy !== 'default') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategories([]);
                  setSearchQuery('');
                  setSortBy('default');
                }}
                className="p-3 rounded-2xl border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                title="Đặt lại bộ lọc"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Hàng 2: DANH MỤC TRÊN 1 HÀNG DUY NHẤT (CÓ CUỘN NGANG ẨN THANH CUỘN) */}
        <div className="pt-2 border-t border-stone-100 flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Nút Xem tất cả */}
          <button
            type="button"
            onClick={handleSelectAllCategories}
            className={`shrink-0 py-2 px-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border ${
              selectedCategories.length === 0
                ? 'bg-amber-800 text-white border-amber-800 shadow-xs'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tất cả</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              selectedCategories.length === 0 ? 'bg-amber-950 text-amber-200' : 'bg-stone-200/80 text-stone-600'
            }`}>
              {products.length}
            </span>
          </button>

          {/* Các danh mục từ Google Sheet */}
          {displayCategories.map((cat) => {
            const IconComponent = ICON_MAP[cat.icon] || Sparkles;
            const isCatActive = selectedCategories.includes(cat.id);
            const itemCount = categoryCounts[cat.id] || 0;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleToggleCategory(cat.id)}
                className={`shrink-0 py-2 px-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border whitespace-nowrap ${
                  isCatActive
                    ? 'bg-amber-800 text-white border-amber-800 shadow-xs ring-1 ring-amber-800'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                <IconComponent className={`w-3.5 h-3.5 shrink-0 transition-transform ${isCatActive ? 'text-amber-200 scale-110' : 'text-amber-700'}`} />
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isCatActive ? 'bg-amber-950 text-amber-200' : 'bg-stone-200/80 text-stone-600'
                }`}>
                  {itemCount}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ================= 3. LƯỚI SẢN PHẨM ================= */}
      {filteredProducts.length === 0 ? (
        <section className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-dashed border-stone-300 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200/80">
            <ShoppingBag className="w-7 h-7 stroke-[1.5]" />
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-stone-800 text-base">Không tìm thấy món phù hợp</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
              Không có sản phẩm nào khớp với bộ lọc hoặc từ khóa "{searchQuery}". Bạn thử tìm với từ khóa khác như: <span className="text-amber-800 font-semibold">táo gió, nho đỏ, rượu ủ, mủ trôm, mực một nắng...</span>
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setSelectedCategories([]);
                setSearchQuery('');
                setSortBy('default');
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Xem lại toàn bộ kệ hàng</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between text-xs text-stone-500 px-1">
            <span>Hiển thị <strong className="text-stone-900 font-mono font-bold">{filteredProducts.length}</strong> sản phẩm</span>
            <span className="text-amber-800 font-medium">Bấm chọn quy cách & xem quà tặng kèm</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </section>
      )}

      {/* ================= 4. BANNER CAM KẾT VẬN CHUYỂN CUỐI TRANG ================= */}
      <section className="bg-amber-50/80 rounded-3xl p-6 sm:p-8 border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center sm:text-left">
          <h4 className="font-bold text-sm sm:text-base text-amber-950 flex items-center justify-center sm:justify-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span>Đơn Hàng Gửi Xe Vào Sài Gòn & Các Tỉnh</span>
          </h4>
          <p className="text-xs text-amber-900/80 leading-relaxed font-light max-w-2xl">
            Nông sản tươi được chèn giấy rơm và bọc thùng xốp chuyên dụng, gửi xe khách trong đêm để sáng sớm hôm sau tới nơi vẫn giữ nguyên cuống xanh và vị ngọt giòn.
          </p>
        </div>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('story')}
            className="px-5 py-3 rounded-2xl bg-amber-800 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>Đọc chuyện mùa vụ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </section>

    </div>
  );
}