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
  TrendingUp,
  X,
  Check,
  ChevronDown
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { supabase } from '../supabaseClient';

const CATEGORY_ID_ICON_MAP = {
  cat01: Sparkles, // Combo Ưu Đãi
  cat02: Apple,    // Trái Cây Tươi Giàn
  cat03: Flame,    // Nem & Chả Đặc Sản
  cat04: Fish,     // Hải Sản Gió Biển
  cat05: Wine,     // Gia Vị Xứ Nắng
  cat06: Leaf      // Đặc Sản Sấy Dẻo
};

const SORT_OPTIONS = [
  { value: 'default', label: 'Mặc định' },
  { value: 'newest', label: 'Mới nhất lên giàn' },
  { value: 'price-asc', label: 'Giá: Thấp → Cao' },
  { value: 'price-desc', label: 'Giá: Cao → Thấp' },
  { value: 'name', label: 'Tên: A → Z' },
];

const POPULAR_SEARCHES = ['Táo gió', 'Nho xanh', 'Nho đỏ', 'Chả cá', 'Mực một nắng', 'Tỏi cô đơn'];

// Hàm chuẩn hóa dữ liệu sản phẩm tương thích song song với DB và UI
function normalizeProductData(p) {
  const weightsList = Array.isArray(p.product_weights) && p.product_weights.length > 0
    ? [...p.product_weights]
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((w) => ({
          id: w.weight_key || String(w.id),
          weight_key: w.weight_key,
          label: w.weight_label || w.label,
          weight_label: w.weight_label || w.label,
          multiplier: Number(w.multiplier) || 1,
          priceOverride: w.price_override != null ? Number(w.price_override) : null,
          price_override: w.price_override != null ? Number(w.price_override) : null,
          isDefault: Boolean(w.is_default)
        }))
    : (Array.isArray(p.weights) && p.weights.length > 0
        ? p.weights
        : [{ id: 'std', weight_key: 'std', label: `1 ${p.unit || 'kg'}`, weight_label: `1 ${p.unit || 'kg'}`, multiplier: 1, isDefault: true }]);

  const catId = p.category_id || p.category || 'cat02';

  return {
    id: p.id,
    name: p.name || p.title || '',
    category: catId,
    category_id: catId,
    basePrice: Number(p.base_price ?? p.basePrice ?? p.price ?? 0),
    base_price: Number(p.base_price ?? p.basePrice ?? p.price ?? 0),
    price: Number(p.base_price ?? p.basePrice ?? p.price ?? 0),
    unit: typeof p.unit === 'object' ? (p.unit?.label || 'kg') : (p.unit || 'kg'),
    badge: p.badge || '',
    source: p.source || '',
    desc: p.description || p.desc || '',
    description: p.description || p.desc || '',
    image: p.image_url || p.image || '',
    image_url: p.image_url || p.image || '',
    inStock: p.in_stock !== false && p.inStock !== false,
    in_stock: p.in_stock !== false && p.inStock !== false,
    campaign_gift_id: p.campaign_gift_id,
    campaign_tag: p.campaign_tag,
    weights: weightsList,
    product_weights: weightsList,
    created_at: p.created_at || p.createdAt
  };
}

export default function ShopPage({ 
  products: initialProducts = [], 
  categories = [], 
  initialCategory = null, 
  onAddToCart, 
  onNavigate 
}) {
  const [localProducts, setLocalProducts] = useState(() => {
    return Array.isArray(initialProducts) ? initialProducts.map(normalizeProductData) : [];
  });

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

  // Kéo rê danh mục (Drag to Scroll)
  const catScrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  // Đồng bộ khi component cha (App.jsx) truyền danh sách mới
  useEffect(() => {
    if (Array.isArray(initialProducts) && initialProducts.length > 0) {
      setLocalProducts(initialProducts.map(normalizeProductData));
    }
  }, [initialProducts]);

  // LẮNG NGHE REALTIME: KHI CÓ SẢN PHẨM HOẶC QUY CÁCH MỚI LẬP TỨC TẢI LẠI
  useEffect(() => {
    const fetchFreshProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            id,
            name,
            category,
            category_id,
            base_price,
            unit,
            badge,
            source,
            description,
            image_url,
            in_stock,
            campaign_gift_id,
            campaign_tag,
            created_at,
            product_weights (
              id,
              weight_key,
              label,
              weight_label,
              multiplier,
              price_override,
              is_default,
              sort_order
            )
          `)
          .order('id', { ascending: true });

        if (!error && Array.isArray(data)) {
          setLocalProducts(data.map(normalizeProductData));
        }
      } catch (err) {
        console.warn('Lỗi đồng bộ realtime sản phẩm:', err);
      }
    };

    const channel = supabase
      .channel('shop-page-realtime-products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchFreshProducts();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_weights' },
        () => {
          fetchFreshProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  // Đồng bộ category khi URL hoặc prop initialCategory thay đổi
  useEffect(() => {
    if (initialCategory && initialCategory !== 'all') {
      setSelectedCategories([initialCategory]);
    } else if (initialCategory === 'all') {
      setSelectedCategories([]);
    }
  }, [initialCategory]);

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
    const walk = (x - startX) * 1.5;
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
    localProducts.forEach((p) => {
      if (p.name && p.name.toLowerCase().includes(q)) matches.add(p.name);
      if (p.source && p.source.toLowerCase().includes(q)) matches.add(p.source);
    });
    return Array.from(matches).slice(0, 5);
  }, [localProducts, searchInput]);

  const filteredProducts = useMemo(() => {
    let result = localProducts.filter((p) => {
      const catKey = p.category_id || p.category;
      const matchCat =
        selectedCategories.length === 0 || selectedCategories.includes(catKey);

      const query = debouncedQuery.toLowerCase();
      const matchSearch =
        !query ||
        p.name?.toLowerCase().includes(query) ||
        (p.source && p.source.toLowerCase().includes(query)) ||
        (p.desc && p.desc.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query));

      return matchCat && matchSearch;
    });

    const getPrice = (item) => Number(item.basePrice ?? item.base_price ?? item.price ?? 0);

    if (sortBy === 'price-asc') {
      result.sort((a, b) => getPrice(a) - getPrice(b));
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => getPrice(b) - getPrice(a));
    } else if (sortBy === 'name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
    } else if (sortBy === 'newest') {
      result.sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return timeB - timeA;
      });
    }

    return result;
  }, [localProducts, selectedCategories, debouncedQuery, sortBy]);

  const displayCategories = useMemo(() => {
    return categories.filter((c) => c.id !== 'all');
  }, [categories]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    localProducts.forEach((p) => {
      const catKey = p.category_id || p.category;
      counts[catKey] = (counts[catKey] || 0) + 1;
    });
    return counts;
  }, [localProducts]);

  const currentSortLabel = useMemo(() => {
    return SORT_OPTIONS.find((s) => s.value === sortBy)?.label || 'Mặc định';
  }, [sortBy]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-10 animate-fadeIn font-sans selection:bg-amber-100 selection:text-amber-900 text-stone-800">
      
      {/* 1. BANNER TIÊU ĐỀ */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950 text-white p-6 sm:p-12 shadow-xl border border-stone-800">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-xs text-amber-300 text-xs sm:text-sm font-bold border border-amber-400/20 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Nông Sản Tươi Hái Mỗi Sáng • Đóng Thùng Xốp Gửi Xe</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Gian Hàng Đặc Sản <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200 bg-clip-text text-transparent">
              Chính Gốc Xứ Nắng Gió
            </span>
          </h1>

          <p className="text-sm sm:text-base text-stone-200 leading-relaxed font-normal max-w-2xl">
            Tất cả táo gió, nho mộc, rượu nho và hải sản phơi ráo đều được chuẩn bị kỹ lưỡng tại Phan Rang, gửi xe khách trong đêm vào TP.HCM và các tỉnh toàn quốc.
          </p>
        </div>
      </section>

      {/* 2. BỘ LỌC TÌM KIẾM, SẮP XẾP & DANH MỤC */}
      <section className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/90 shadow-xs space-y-3.5">
        
        {/* HÀNG 1: Ô TÌM KIẾM + SẮP XẾP */}
        <div className="flex items-center gap-3">
          <div ref={searchBoxRef} className="relative flex-1">
            <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm táo gió, nho xanh, chả cá, mật nho, tỏi mồ côi..."
              value={searchInput}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full text-sm pl-11 pr-10 py-3 rounded-2xl border border-stone-200 bg-stone-50/90 focus:bg-white focus:outline-none focus:border-amber-600 font-medium text-stone-800 transition-all shadow-2xs"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setDebouncedQuery('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* DROPDOWN GỢI Ý */}
            {isSearchFocused && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-stone-200 shadow-xl p-3.5 z-30 animate-fadeIn space-y-2.5 text-sm">
                {searchInput.trim() ? (
                  searchSuggestions.length > 0 ? (
                    <div>
                      <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block px-1 pb-1.5">Gợi ý món phù hợp:</span>
                      <div className="space-y-1">
                        {searchSuggestions.map((item, idx) => (
                          <div
                            key={idx}
                            onMouseDown={() => {
                              setSearchInput(item);
                              setDebouncedQuery(item);
                              setIsSearchFocused(false);
                            }}
                            className="px-3 py-2 rounded-xl hover:bg-amber-50 text-stone-700 hover:text-amber-900 cursor-pointer flex items-center justify-between text-sm"
                          >
                            <span className="font-medium">{item}</span>
                            <ArrowRight className="w-4 h-4 text-stone-300" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 text-center text-stone-400 text-sm">
                      Không có gợi ý trùng khớp
                    </div>
                  )
                ) : (
                  <div>
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5 px-1 pb-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                      <span>Được tìm kiếm nhiều:</span>
                    </span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {POPULAR_SEARCHES.map((tag, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onMouseDown={() => {
                            setSearchInput(tag);
                            setDebouncedQuery(tag);
                            setIsSearchFocused(false);
                          }}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 rounded-xl text-xs sm:text-sm font-medium transition-colors"
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

          {/* NÚT SẮP XẾP */}
          <div ref={sortRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsSortOpen((prev) => !prev)}
              className={`h-11 px-3.5 sm:px-4 rounded-2xl border text-sm font-bold flex items-center gap-2 transition-all shadow-2xs cursor-pointer active:scale-95 ${
                sortBy !== 'default'
                  ? 'bg-amber-100/90 border-amber-400 text-amber-900'
                  : 'bg-stone-50/90 border-stone-200 text-stone-700 hover:bg-white'
              }`}
              title="Sắp xếp sản phẩm"
            >
              <SlidersHorizontal className="w-4 h-4 text-amber-700" />
              <span className="hidden sm:inline">{currentSortLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSortOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl border border-stone-200 shadow-xl p-2 z-30 animate-fadeIn space-y-1 text-sm font-medium">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block px-2.5 py-1">
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
                    className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between cursor-pointer transition-colors text-sm ${
                      sortBy === opt.value
                        ? 'bg-amber-50 text-amber-900 font-bold'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {sortBy === opt.value && <Check className="w-4 h-4 text-amber-700" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* HÀNG 2: THANH DANH MỤC CHIPS */}
        <div
          ref={catScrollRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeaveOrUp}
          onMouseUp={handleMouseLeaveOrUp}
          onMouseMove={handleMouseMove}
          className={`pt-3 border-t border-stone-100 flex items-center gap-2.5 overflow-x-auto pb-1 select-none [-ms-overflow-style:none] [scrollbar-width:none] ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          <button
            type="button"
            onClick={handleSelectAllCategories}
            className={`shrink-0 py-2 px-4 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 border ${
              selectedCategories.length === 0
                ? 'bg-amber-900 text-white border-amber-900 shadow-xs'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Tất cả</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
              selectedCategories.length === 0 ? 'bg-amber-950 text-amber-200' : 'bg-stone-200 text-stone-600'
            }`}>
              {localProducts.length}
            </span>
          </button>

          {displayCategories.map((cat) => {
            const IconComponent = CATEGORY_ID_ICON_MAP[cat.id] || Sparkles;
            const isCatActive = selectedCategories.includes(cat.id);
            const itemCount = categoryCounts[cat.id] || 0;
            const catName = cat.name || cat.label || 'Danh mục';

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleToggleCategory(cat.id)}
                className={`shrink-0 py-2 px-4 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 border whitespace-nowrap ${
                  isCatActive
                    ? 'bg-amber-900 text-white border-amber-900 shadow-xs ring-1 ring-amber-900'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                <IconComponent className={`w-4 h-4 shrink-0 transition-transform ${isCatActive ? 'text-amber-200 scale-110' : 'text-amber-700'}`} />
                <span>{catName}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                  isCatActive ? 'bg-amber-950 text-amber-200' : 'bg-stone-200 text-stone-600'
                }`}>
                  {itemCount}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. LƯỚI SẢN PHẨM */}
      {filteredProducts.length === 0 ? (
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
              onClick={() => {
                setSelectedCategories([]);
                setSearchInput('');
                setDebouncedQuery('');
                setSortBy('default');
              }}
              className="px-5 py-2.5 rounded-2xl bg-amber-900 hover:bg-amber-800 text-white text-sm font-bold transition-all shadow-xs active:scale-95 cursor-pointer inline-flex items-center gap-2"
            >
              <span>Xem lại toàn bộ kệ hàng</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between text-sm text-stone-600 px-1">
            <span>Hiển thị <strong className="text-stone-900 font-mono font-bold text-base">{filteredProducts.length}</strong> sản phẩm</span>
            <span className="text-amber-800 font-semibold">Hái tươi & đóng thùng trong ngày</span>
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

      {/* 4. CAM KẾT VẬN CHUYỂN */}
      <section className="bg-amber-50/80 rounded-3xl p-6 sm:p-8 border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="space-y-1.5 text-center sm:text-left">
          <h4 className="font-bold text-base sm:text-lg text-amber-950 flex items-center justify-center sm:justify-start gap-2">
            <Sparkles className="w-5 h-5 text-amber-700" />
            <span>Đơn Hàng Gửi Xe Vào Sài Gòn & Các Tỉnh</span>
          </h4>
          <p className="text-sm text-amber-900/90 leading-relaxed font-normal max-w-2xl">
            Nông sản tươi được chèn giấy rơm và bọc thùng xốp chuyên dụng, gửi xe khách trong đêm để sáng sớm hôm sau tới nơi vẫn giữ nguyên độ tươi giòn.
          </p>
        </div>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('story')}
            className="px-5 py-3 rounded-2xl bg-amber-900 hover:bg-amber-800 text-white text-sm font-bold shrink-0 transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <span>Đọc chuyện mùa vụ</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </section>

    </div>
  );
}