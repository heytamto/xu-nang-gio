// src/pages/ShopPage.jsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '../supabaseClient';
import ShopFilterBar from '../components/shop/ShopFilterBar';
import ShopProductGrid from '../components/shop/ShopProductGrid';
import ShopShippingBanner from '../components/shop/ShopShippingBanner';

function normalizeProductData(p) {
  const weightsList = Array.isArray(p.product_weights) && p.product_weights.length > 0
    ? [...p.product_weights]
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((w) => ({
          id: w.weight_key || String(w.id),
          weight_key: w.weight_key,
          label: w.label || w.weight_label,
          weight_label: w.label || w.weight_label,
          multiplier: Number(w.multiplier) || 1,
          priceOverride: w.price_override != null ? Number(w.price_override) : null,
          price_override: w.price_override != null ? Number(w.price_override) : null,
          isDefault: Boolean(w.is_default)
        }))
    : (Array.isArray(p.weights) && p.weights.length > 0
        ? p.weights
        : [{ id: 'std', weight_key: 'std', label: `1 ${p.unit || 'kg'}`, weight_label: `1 ${p.unit || 'kg'}`, multiplier: 1, isDefault: true }]);

  const catId = p.category || p.category_id || 'cat02';

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
  highlightedProductId = null,
  onAddToCart, 
  onNavigate 
}) {
  const [localProducts, setLocalProducts] = useState(() => {
    return Array.isArray(initialProducts) ? initialProducts.map(normalizeProductData) : [];
  });

  const [selectedCategories, setSelectedCategories] = useState(() => {
    return initialCategory && initialCategory !== 'all' ? [initialCategory] : [];
  });

  const [isFilterNewOnly, setIsFilterNewOnly] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');

  // Tự động cuộn đến thẻ sản phẩm được làm nổi bật
  useEffect(() => {
    if (highlightedProductId) {
      const scrollTimer = setTimeout(() => {
        const el = document.getElementById(`product-card-${highlightedProductId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 250);
      return () => clearTimeout(scrollTimer);
    }
  }, [highlightedProductId]);

  // Đồng bộ khi initialProducts thay đổi
  useEffect(() => {
    if (Array.isArray(initialProducts) && initialProducts.length > 0) {
      setLocalProducts(initialProducts.map(normalizeProductData));
    }
  }, [initialProducts]);

  // Đồng bộ category khi đổi qua URL/tab
  useEffect(() => {
    if (initialCategory && initialCategory !== 'all') {
      setSelectedCategories([initialCategory]);
      setIsFilterNewOnly(false);
    } else if (initialCategory === 'all') {
      setSelectedCategories([]);
    }
  }, [initialCategory]);

  // Debounce tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Lắng nghe Realtime sản phẩm
  const fetchFreshProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, category, base_price, unit, badge, source, description,
          image_url, in_stock, campaign_gift_id, campaign_tag, created_at,
          product_weights (id, weight_key, label, multiplier, price_override, is_default, sort_order)
        `)
        .order('id', { ascending: true });

      if (!error && Array.isArray(data)) {
        setLocalProducts(data.map(normalizeProductData));
      }
    } catch (err) {
      console.warn('Lỗi đồng bộ realtime sản phẩm:', err);
    }
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('shop-page-realtime-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchFreshProducts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_weights' }, fetchFreshProducts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFreshProducts]);

  const handleToggleCategory = (catId) => {
    setIsFilterNewOnly(false);
    setSelectedCategories((prev) => 
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setIsFilterNewOnly(false);
    setSearchInput('');
    setDebouncedQuery('');
    setSortBy('default');
  };

  // Đếm món mới lên giàn trong 7 ngày
  const newProductsCount = useMemo(() => {
    const now = Date.now();
    const thresholdMs = 7 * 24 * 60 * 60 * 1000;
    return localProducts.filter((p) => {
      const createdTime = new Date(p.created_at || 0).getTime();
      return createdTime > 0 && (now - createdTime) <= thresholdMs;
    }).length;
  }, [localProducts]);

  // Gợi ý từ khóa
  const searchSuggestions = useMemo(() => {
    if (!searchInput.trim()) return [];
    const q = searchInput.toLowerCase().trim();
    const matches = new Set();
    localProducts.forEach((p) => {
      if (p.name?.toLowerCase().includes(q)) matches.add(p.name);
      if (p.source?.toLowerCase().includes(q)) matches.add(p.source);
    });
    return Array.from(matches).slice(0, 5);
  }, [localProducts, searchInput]);

  // Bộ đếm theo danh mục
  const categoryCounts = useMemo(() => {
    const counts = {};
    localProducts.forEach((p) => {
      const catKey = p.category || p.category_id;
      counts[catKey] = (counts[catKey] || 0) + 1;
    });
    return counts;
  }, [localProducts]);

  // Lọc và sắp xếp sản phẩm
  const filteredProducts = useMemo(() => {
    const now = Date.now();
    const thresholdMs = 7 * 24 * 60 * 60 * 1000;

    let result = localProducts.filter((p) => {
      if (isFilterNewOnly) {
        const createdTime = new Date(p.created_at || 0).getTime();
        if (createdTime <= 0 || (now - createdTime) > thresholdMs) return false;
      }

      const catKey = p.category || p.category_id;
      const matchCat = selectedCategories.length === 0 || selectedCategories.includes(catKey);

      const query = debouncedQuery.toLowerCase();
      const matchSearch =
        !query ||
        p.name?.toLowerCase().includes(query) ||
        p.source?.toLowerCase().includes(query) ||
        p.desc?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query);

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
      result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    return result;
  }, [localProducts, selectedCategories, isFilterNewOnly, debouncedQuery, sortBy]);

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
      <ShopFilterBar
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onSelectSearchKeyword={setDebouncedQuery}
        searchSuggestions={searchSuggestions}
        sortBy={sortBy}
        setSortBy={setSortBy}
        selectedCategories={selectedCategories}
        onToggleCategory={handleToggleCategory}
        onSelectAllCategories={() => {
          setSelectedCategories([]);
          setIsFilterNewOnly(false);
        }}
        isFilterNewOnly={isFilterNewOnly}
        onToggleFilterNewOnly={() => {
          setIsFilterNewOnly((prev) => !prev);
          setSelectedCategories([]);
        }}
        totalProductsCount={localProducts.length}
        newProductsCount={newProductsCount}
        categories={categories}
        categoryCounts={categoryCounts}
      />

      {/* 3. LƯỚI SẢN PHẨM */}
      <ShopProductGrid
        products={filteredProducts}
        highlightedProductId={highlightedProductId}
        onAddToCart={onAddToCart}
        onResetFilters={handleResetFilters}
      />

      {/* 4. CAM KẾT VẬN CHUYỂN */}
      <ShopShippingBanner onNavigateStory={() => onNavigate?.('story')} />
    </div>
  );
}