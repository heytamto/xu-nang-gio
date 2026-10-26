// src/components/shop/ShopFilterBar.jsx
import React, { useRef, useState, useEffect } from 'react';
import { 
  Search, 
  X, 
  ArrowRight, 
  TrendingUp, 
  SlidersHorizontal, 
  ChevronDown, 
  Check, 
  Sparkles, 
  Sun
} from 'lucide-react';
import { resolveCategoryIcon } from '../../utils/categoryIcons';

const SORT_OPTIONS = [
  { value: 'default', label: 'Mặc định' },
  { value: 'newest', label: 'Mới nhất lên giàn' },
  { value: 'price-asc', label: 'Giá: Thấp → Cao' },
  { value: 'price-desc', label: 'Giá: Cao → Thấp' },
  { value: 'name', label: 'Tên: A → Z' },
];

const POPULAR_SEARCHES = ['Táo gió', 'Nho xanh', 'Nho đỏ', 'Chả cá', 'Mực một nắng', 'Tỏi cô đơn'];

export default function ShopFilterBar({
  searchInput,
  setSearchInput,
  onSelectSearchKeyword,
  searchSuggestions = [],
  sortBy,
  setSortBy,
  selectedCategories = [],
  onToggleCategory,
  onSelectAllCategories,
  isFilterNewOnly,
  onToggleFilterNewOnly,
  totalProductsCount = 0,
  newProductsCount = 0,
  categories = [],
  categoryCounts = {}
}) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const searchBoxRef = useRef(null);
  const sortRef = useRef(null);

  const catScrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

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

  const handleMouseDown = (e) => {
    if (!catScrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - catScrollRef.current.offsetLeft);
    setScrollLeftState(catScrollRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => setIsDragging(false);

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

  const currentSortLabel = SORT_OPTIONS.find((s) => s.value === sortBy)?.label || 'Mặc định';

  return (
    <section className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/90 shadow-xs space-y-3.5">
      {/* Ô tìm kiếm + Sắp xếp */}
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
                onSelectSearchKeyword('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {isSearchFocused && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-stone-200 shadow-xl p-3.5 z-30 animate-fadeIn space-y-2.5 text-sm">
              {searchInput.trim() ? (
                searchSuggestions.length > 0 ? (
                  <div>
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block px-1 pb-1.5">
                      Gợi ý món phù hợp:
                    </span>
                    <div className="space-y-1">
                      {searchSuggestions.map((item, idx) => (
                        <div
                          key={idx}
                          onMouseDown={() => {
                            setSearchInput(item);
                            onSelectSearchKeyword(item);
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
                          onSelectSearchKeyword(tag);
                          setIsSearchFocused(false);
                        }}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer"
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

      {/* Thanh cuộn danh mục hoàn toàn động từ DB */}
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
          onClick={onSelectAllCategories}
          className={`shrink-0 py-2 px-4 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 border ${
            selectedCategories.length === 0 && !isFilterNewOnly
              ? 'bg-amber-900 text-white border-amber-900 shadow-xs'
              : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Tất cả</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
            selectedCategories.length === 0 && !isFilterNewOnly ? 'bg-amber-950 text-amber-200' : 'bg-stone-200 text-stone-600'
          }`}>
            {totalProductsCount}
          </span>
        </button>

        {newProductsCount > 0 && (
          <button
            type="button"
            onClick={onToggleFilterNewOnly}
            className={`shrink-0 py-2 px-4 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 border whitespace-nowrap ${
              isFilterNewOnly
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-1 ring-amber-600'
                : 'bg-amber-50 hover:bg-amber-100/80 text-amber-950 border-amber-200'
            }`}
          >
            <Sun className={`w-4 h-4 shrink-0 transition-transform ${isFilterNewOnly ? 'rotate-45' : 'text-amber-700'}`} />
            <span>Mới lên giàn</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
              isFilterNewOnly ? 'bg-amber-800 text-white' : 'bg-amber-200 text-amber-950'
            }`}>
              {newProductsCount}
            </span>
          </button>
        )}

        {/* LẶP QUA TẤT CẢ DANH MỤC TRẢ VỀ TỪ SUPABASE */}
        {categories.filter((c) => c.id !== 'all').map((cat) => {
          const IconComponent = resolveCategoryIcon(cat);
          const isCatActive = selectedCategories.includes(cat.id);
          const itemCount = categoryCounts[cat.id] || 0;
          const catName = cat.name || cat.label || 'Danh mục';

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onToggleCategory(cat.id)}
              className={`shrink-0 py-2 px-4 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 border whitespace-nowrap ${
                isCatActive && !isFilterNewOnly
                  ? 'bg-amber-900 text-white border-amber-900 shadow-xs ring-1 ring-amber-900'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              <IconComponent className={`w-4 h-4 shrink-0 transition-transform ${isCatActive && !isFilterNewOnly ? 'text-amber-200 scale-110' : 'text-amber-700'}`} />
              <span>{catName}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                isCatActive && !isFilterNewOnly ? 'bg-amber-950 text-amber-200' : 'bg-stone-200 text-stone-600'
              }`}>
                {itemCount}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}