// src/pages/ShopPage.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  CheckCircle2,
  TrendingUp,
  X,
  Check,
  ChevronDown
} from 'lucide-react';
import ProductCard from '../components/ProductCard';

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

const SORT_OPTIONS = [
  { value: 'default', label: 'Mặc định' },
  { value: 'price-asc', label: 'Giá: Thấp → Cao' },
  { value: 'price-desc', label: 'Giá: Cao → Thấp' },
  { value: 'name', label: 'Tên: A → Z' },
];

const POPULAR_SEARCHES = ['Táo gió', 'Nho đỏ', 'Nho xanh', 'Rượu nho', 'Mực một nắng', 'Tỏi Phan Rang'];

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

  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState('default');

  const searchBoxRef = useRef(null);
  const sortRef = useRef(null);

  // Ref và state phục vụ kéo rê danh mục chuột (Drag to Scroll)
  const catScrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  // Debounce tìm kiếm 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (initialCategory && initialCategory !== 'all') {
      setSelectedCategories([initialCategory]);
    } else if (initialCategory === 'all') {
      setSelectedCategories([]);
    }
  }, [initialCategory]);

  // Xử lý kéo rê chuột ngang cho danh mục
  const handleMouseDown = (e) => {
    if (!catScrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - catScrollRef.current.offsetLeft);
    setScrollLeftState(catScrollRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !catScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - catScrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Hệ số cuộn
    catScrollRef.current.scrollLeft = scrollLeftState - walk;
  };

  const handleWheel = (e) => {
    if (e.deltaY !== 0 && catScrollRef.current) {
      catScrollRef.current.scrollLeft += e.deltaY;
    }
  };

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

  const searchSuggestions = useMemo(() => {
    if (!searchInput.trim()) return [];
    const q = searchInput.toLowerCase().trim();
    const matches = new Set();
    products.forEach((p) => {
      if (p.name && p.name.toLowerCase().includes(q)) matches.add(p.name);
      if (p.source && p.source.toLowerCase().includes(q)) matches.add(p.source);
    });
    return Array.from(matches).slice(0, 5);
  }, [products, searchInput]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const matchCat =
        selectedCategories.length === 0 || selectedCategories.includes(p.category);

      const query = debouncedQuery.toLowerCase();
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
  }, [products, selectedCategories, debouncedQuery, sortBy]);

  const displayCategories = useMemo(() => {
    return categories.filter((c) => c.id !== 'all');
  }, [categories]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  const currentSortLabel = useMemo(() => {
    return SORT_OPTIONS.find((s) => s.value === sortBy)?.label || 'Mặc định';
  }, [sortBy]);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-8 animate-fadeIn font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* ================= 1. BANNER TIÊU ĐỀ ================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950 text-white p-5 sm:p-10 shadow-xl border border-stone-800">
        <div className="relative z-10 max-w-3xl space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-amber-300 text-[11px] font-bold border border-amber-400/20 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Nông Sản Tươi Hái Mỗi Sáng • Đóng Thùng Xốp Gửi Xe</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Gian Hàng Đặc Sản <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200 bg-clip-text text-transparent">
              Chính Gốc Xứ Nắng Gió
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-light max-w-2xl">
            Tất cả táo gió, nho mộc, rượu nho và hải sản phơi ráo đều được chuẩn bị kỹ lưỡng tại Phan Rang, gửi xe khách trong đêm vào TP.HCM và các tỉnh toàn quốc.
          </p>
        </div>
      </section>

      {/* ================= 2. BỘ LỌC TỐI ƯU GỌN GÀNG TRÊN 1 HÀNG ================= */}
      <section className="bg-white rounded-3xl p-3 sm:p-4 border border-stone-200/90 shadow-xs space-y-2.5">
        
        {/* HÀNG 1: Ô TÌM KIẾM CHIẾM TRỌN DIỆN TÍCH + NÚT LỌC CUSTOM */}
        <div className="flex items-center gap-2">
          
          <div ref={searchBoxRef} className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm táo gió, nho mộc, bánh tráng..."
              value={searchInput}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full text-xs pl-9 pr-8 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/90 focus:bg-white focus:outline-none focus:border-amber-600 font-medium text-stone-800 transition-all shadow-2xs"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setDebouncedQuery('');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* DROPDOWN GỢI Ý TÌM KIẾM */}
            {isSearchFocused && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-stone-200 shadow-xl p-3 z-30 animate-fadeIn space-y-2 text-xs">
                {searchInput.trim() ? (
                  searchSuggestions.length > 0 ? (
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block px-1 pb-1">Gợi ý món phù hợp:</span>
                      <div className="space-y-0.5">
                        {searchSuggestions.map((item, idx) => (
                          <div
                            key={idx}
                            onMouseDown={() => {
                              setSearchInput(item);
                              setDebouncedQuery(item);
                              setIsSearchFocused(false);
                            }}
                            className="px-2.5 py-1.5 rounded-xl hover:bg-amber-50 text-stone-700 hover:text-amber-900 cursor-pointer flex items-center justify-between"
                          >
                            <span className="font-medium">{item}</span>
                            <ArrowRight className="w-3 h-3 text-stone-300" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 text-center text-stone-400 text-xs">
                      Không có gợi ý trùng khớp
                    </div>
                  )
                ) : (
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1 px-1 pb-1">
                      <TrendingUp className="w-3 h-3 text-amber-600" />
                      <span>Được tìm kiếm nhiều:</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {POPULAR_SEARCHES.map((tag, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onMouseDown={() => {
                            setSearchInput(tag);
                            setDebouncedQuery(tag);
                            setIsSearchFocused(false);
                          }}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 rounded-lg text-[11px] font-medium"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* NÚT SẮP XẾP CUSTOM UI */}
          <div ref={sortRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsSortOpen((prev) => !prev)}
              className={`h-9 px-2.5 sm:px-3 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 ${
                sortBy !== 'default'
                  ? 'bg-amber-100/80 border-amber-400 text-amber-900'
                  : 'bg-stone-50/90 border-stone-200 text-stone-700 hover:bg-white'
              }`}
              title="Sắp xếp sản phẩm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">{currentSortLabel}</span>
              <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSortOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-2xl border border-stone-200 shadow-xl p-1.5 z-30 animate-fadeIn space-y-0.5 text-xs font-medium">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block px-2.5 py-1">
                  Sắp xếp theo:
                </span>
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSortBy(opt.value);
                      setIsSortOpen(false);
                    }}
                    className={`w-full px-2.5 py-2 rounded-xl text-left flex items-center justify-between cursor-pointer transition-colors ${
                      sortBy === opt.value
                        ? 'bg-amber-50 text-amber-900 font-bold'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {sortBy === opt.value && <Check className="w-3.5 h-3.5 text-amber-700" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* HÀNG 2: THANH CUỘN DANH MỤC (HỖ TRỢ LĂN CHUỘT + KÉO CHUỘT TRƯỢT NGANG MƯỢT MÀ) */}
        <div
          ref={catScrollRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeaveOrUp}
          onMouseUp={handleMouseLeaveOrUp}
          onMouseMove={handleMouseMove}
          className={`pt-2 border-t border-stone-100 flex items-center gap-2 overflow-x-auto pb-1 select-none [-ms-overflow-style:none] [scrollbar-width:none] ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          <button
            type="button"
            onClick={handleSelectAllCategories}
            className={`shrink-0 py-1.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border ${
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

          {displayCategories.map((cat) => {
            const IconComponent = ICON_MAP[cat.icon] || Sparkles;
            const isCatActive = selectedCategories.includes(cat.id);
            const itemCount = categoryCounts[cat.id] || 0;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleToggleCategory(cat.id)}
                className={`shrink-0 py-1.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border whitespace-nowrap ${
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
        <section className="bg-white rounded-3xl p-8 sm:p-14 text-center border border-dashed border-stone-300 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200/80">
            <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-stone-800 text-sm sm:text-base">Không tìm thấy món phù hợp</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
              Không có sản phẩm nào khớp với từ khóa "{searchInput}". Bạn thử chọn lại từ khóa gợi ý phía trên nhé!
            </p>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                setSelectedCategories([]);
                setSearchInput('');
                setDebouncedQuery('');
                setSortBy('default');
              }}
              className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Xem lại toàn bộ kệ hàng</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-500 px-1">
            <span>Hiển thị <strong className="text-stone-900 font-mono font-bold">{filteredProducts.length}</strong> sản phẩm</span>
            <span className="text-amber-800 font-medium">Hái tươi & đóng thùng trong ngày</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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

      {/* ================= 4. CAM KẾT VẬN CHUYỂN ================= */}
      <section className="bg-amber-50/80 rounded-3xl p-5 sm:p-7 border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="font-bold text-sm text-amber-950 flex items-center justify-center sm:justify-start gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span>Đơn Hàng Gửi Xe Vào Sài Gòn & Các Tỉnh</span>
          </h4>
          <p className="text-xs text-amber-900/80 leading-relaxed font-light max-w-2xl">
            Nông sản tươi được chèn giấy rơm và bọc thùng xốp chuyên dụng, gửi xe khách trong đêm để sáng sớm hôm sau tới nơi vẫn giữ nguyên độ tươi giòn.
          </p>
        </div>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('story')}
            className="px-4 py-2.5 rounded-2xl bg-amber-800 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1"
          >
            <span>Đọc chuyện mùa vụ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </section>

    </div>
  );
}