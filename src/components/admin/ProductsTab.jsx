// src/components/admin/ProductsTab.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  RotateCcw, 
  Pencil, 
  ToggleLeft, 
  ToggleRight, 
  Trash2, 
  Layers, 
  ChevronDown, 
  Check, 
  Tag
} from 'lucide-react';
import ImageUploadField from '../ImageUploadField';
import { supabase } from '../../supabaseClient';

// Danh mục chuẩn khớp với database Supabase
const DEFAULT_CATEGORIES = [
  { id: 'cat01', label: 'Combo Ưu Đãi' },
  { id: 'cat02', label: 'Trái Cây Tươi Giàn' },
  { id: 'cat03', label: 'Nem & Chả Đặc Sản' },
  { id: 'cat04', label: 'Hải Sản Gió Biển' },
  { id: 'cat05', label: 'Gia Vị Xứ Nắng' },
  { id: 'cat06', label: 'Đặc Sản Sấy Dẻo' }
];

// Danh sách trạng thái kho
const STOCK_STATUS_OPTIONS = [
  {
    value: true,
    label: 'Đang có sẵn ở vườn',
    subLabel: 'Còn lứa hái, đang mở bán',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500'
  },
  {
    value: false,
    label: 'Tạm hết lứa',
    subLabel: 'Chờ đợt thu hoạch kế tiếp',
    badgeClass: 'bg-stone-100 text-stone-600 border-stone-200',
    dotClass: 'bg-stone-400'
  }
];

// COMPONENT DROPDOWN TỰ VIẾT (CHUẨN FORM BO TRÒN THEO MẪU THEME KEM ẤM)
function CustomSelect({ 
  label, 
  headerLabel = "DANH SÁCH TÙY CHỌN:",
  options = [], 
  value, 
  onChange, 
  renderOption,
  renderSelected,
  icon: Icon
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedOpt = options.find((opt) => opt.value === value || opt.id === value);

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && <label className="font-semibold text-stone-700 block mb-1.5 text-xs">{label}</label>}

      {/* Button kích hoạt Dropdown */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full py-2.5 px-3.5 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all duration-200 cursor-pointer text-xs ${
          isOpen
            ? 'bg-amber-50/50 border-amber-500 ring-2 ring-amber-400/20 shadow-xs'
            : 'bg-white hover:bg-stone-50/80 border-stone-300 hover:border-amber-400 shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
          <div className="truncate font-bold text-stone-900">
            {renderSelected ? renderSelected(selectedOpt) : (selectedOpt?.label || selectedOpt?.name)}
          </div>
        </div>

        <ChevronDown 
          className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180 text-amber-700' : ''
          }`} 
        />
      </button>

      {/* Menu xổ xuống bo tròn */}
      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 p-2 rounded-2xl bg-white border border-amber-200/80 shadow-xl space-y-1 animate-fadeIn text-xs backdrop-blur-md">
          {headerLabel && (
            <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">
              {headerLabel}
            </div>
          )}

          <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5 [scrollbar-width:thin] [scrollbar-color:#e7e5e4_transparent]">
            {options.map((opt) => {
              const optKey = opt.value !== undefined ? opt.value : opt.id;
              const isSelected = optKey === value;

              return (
                <div
                  key={String(optKey)}
                  onClick={() => {
                    onChange(optKey);
                    setIsOpen(false);
                  }}
                  className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-2 transition-all ${
                    isSelected
                      ? 'bg-amber-100/70 text-amber-950 font-bold border border-amber-300/80 shadow-2xs'
                      : 'hover:bg-amber-50/70 text-stone-700 font-medium'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    {renderOption ? (
                      renderOption(opt, isSelected)
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="truncate">{opt.label || opt.name}</span>
                        {opt.id && (
                          <span className="text-[10.5px] font-mono text-stone-400 shrink-0">
                            ({opt.id})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-amber-800 shrink-0 stroke-[2.5]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsTab({
  products = [],
  onAddProduct,
  onEditProduct,
  onToggleStock,
  onDeleteProduct,
  onResetProducts
}) {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  // Tự động tải danh mục mới nhất từ Supabase nếu có bảng categories
  useEffect(() => {
    async function loadDbCategories() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, order')
          .order('order', { ascending: true });

        if (!error && Array.isArray(data) && data.length > 0) {
          setCategories(data.map((c) => ({ id: c.id, label: c.name })));
        }
      } catch {
        // Fallback dùng DEFAULT_CATEGORIES
      }
    }
    loadDbCategories();
  }, []);

  const [newProduct, setNewProduct] = useState({
    name: '',
    basePrice: '',
    unit: 'kg',
    category: 'cat02',
    badge: 'Đặc sản mới',
    source: 'Vườn nhà Tâm (Phước Hậu)',
    desc: '',
    image: '',
    inStock: true,
  });

  const [weightsList, setWeightsList] = useState([
    { label: 'Thùng 2kg (Ăn thử)', calcType: 'multiplier', value: 2 },
    { label: 'Thùng 5kg (Tiết kiệm)', calcType: 'fixed', value: 299000 }
  ]);

  const handleAddWeightRow = () => {
    setWeightsList((prev) => [
      ...prev,
      { label: '', calcType: 'multiplier', value: 1 }
    ]);
  };

  const handleRemoveWeightRow = (index) => {
    setWeightsList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateWeightRow = (index, field, val) => {
    setWeightsList((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: val } : row))
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newProduct.name.trim() || !newProduct.basePrice) return;

    const basePriceNum = Number(newProduct.basePrice) || 0;

    const finalWeights = weightsList
      .filter((w) => w.label.trim())
      .map((w, idx) => {
        const isMultiplier = w.calcType === 'multiplier';
        const numVal = Number(w.value) || 0;

        return {
          id: `opt-${idx + 1}`,
          weight_key: `opt_${idx + 1}`,
          label: w.label.trim(),
          weight_label: w.label.trim(),
          multiplier: isMultiplier ? (numVal > 0 ? numVal : 1) : 1,
          price_override: isMultiplier ? null : numVal,
          priceOverride: isMultiplier ? null : numVal,
          is_default: idx === 0,
          isDefault: idx === 0,
          sort_order: idx
        };
      });

    const defaultUnitLabel = newProduct.unit.trim() || 'kg';
    const resolvedWeights = finalWeights.length > 0 ? finalWeights : [
      { 
        id: 'opt-1', 
        weight_key: 'std', 
        label: `1 ${defaultUnitLabel}`, 
        weight_label: `1 ${defaultUnitLabel}`,
        multiplier: 1, 
        price_override: null, 
        priceOverride: null,
        is_default: true, 
        isDefault: true,
        sort_order: 0 
      }
    ];

    const payload = {
      name: newProduct.name.trim(),
      title: newProduct.name.trim(),
      basePrice: basePriceNum,
      base_price: basePriceNum,
      price: basePriceNum,
      unit: defaultUnitLabel,
      category: newProduct.category,
      category_id: newProduct.category,
      badge: newProduct.badge.trim(),
      source: newProduct.source.trim(),
      desc: newProduct.desc.trim(),
      description: newProduct.desc.trim(),
      image: newProduct.image.trim() || 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
      image_url: newProduct.image.trim() || 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
      inStock: newProduct.inStock,
      in_stock: newProduct.inStock,
      weights: resolvedWeights,
      product_weights: resolvedWeights
    };

    onAddProduct(payload);

    setNewProduct({
      name: '',
      basePrice: '',
      unit: 'kg',
      category: 'cat02',
      badge: 'Đặc sản mới',
      source: 'Vườn nhà Tâm (Phước Hậu)',
      desc: '',
      image: '',
      inStock: true,
    });
    setWeightsList([
      { label: 'Thùng 2kg (Ăn thử)', calcType: 'multiplier', value: 2 },
      { label: 'Thùng 5kg (Tiết kiệm)', calcType: 'fixed', value: 299000 }
    ]);
  };

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      {/* 1. Form thêm đặc sản */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="flex items-center gap-2 text-stone-900 font-bold text-sm border-b border-stone-100 pb-3">
          <Plus className="w-4 h-4 text-amber-600" />
          <span>Thêm Đặc Sản Mới Lên Kệ</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Hàng 1: Tên đặc sản + Danh mục */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
            <div className="sm:col-span-2">
              <label className="font-semibold text-stone-600 block mb-1.5">Tên đặc sản *</label>
              <input
                type="text"
                required
                placeholder="VD: Nho Xanh Ninh Thuận (NH01-48)"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="w-full p-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white font-medium text-stone-800 focus:outline-none focus:border-amber-600 transition-colors"
              />
            </div>

            <div>
              <CustomSelect
                label="Danh mục phân loại *"
                headerLabel="DANH MỤC TRONG CƠ SỞ DỮ LIỆU:"
                icon={Tag}
                options={categories}
                value={newProduct.category}
                onChange={(newCatId) => setNewProduct({ ...newProduct, category: newCatId })}
                renderSelected={(opt) => (
                  <span className="flex items-center gap-1.5">
                    <span>{opt?.label}</span>
                    <span className="text-[10px] font-mono text-stone-400 font-normal">({opt?.id})</span>
                  </span>
                )}
                renderOption={(opt, isSelected) => (
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{opt.label}</span>
                    <span className={`text-[10px] font-mono ${isSelected ? 'text-amber-800' : 'text-stone-400'}`}>
                      {opt.id}
                    </span>
                  </div>
                )}
              />
            </div>
          </div>

          {/* Hàng 2: Giá chuẩn + Đơn vị + Huy hiệu */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
            <div>
              <label className="font-semibold text-stone-600 block mb-1.5">Giá chuẩn 1 đơn vị (VNĐ) *</label>
              <input
                type="number"
                required
                min="0"
                step="1000"
                placeholder="VD: 65000"
                value={newProduct.basePrice}
                onChange={(e) => setNewProduct({ ...newProduct, basePrice: e.target.value })}
                className="w-full p-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white font-mono font-bold text-amber-900 focus:outline-none focus:border-amber-600 transition-colors"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-600 block mb-1.5">Đơn vị chuẩn</label>
              <input
                type="text"
                placeholder="kg, hộp, chai, đòn..."
                value={newProduct.unit}
                onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                className="w-full p-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 font-medium focus:outline-none focus:border-amber-600 transition-colors"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-600 block mb-1.5">Huy hiệu (Badge)</label>
              <input
                type="text"
                placeholder="VD: Bao ngọt giàn, Hái sáng sớm"
                value={newProduct.badge}
                onChange={(e) => setNewProduct({ ...newProduct, badge: e.target.value })}
                className="w-full p-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 focus:outline-none focus:border-amber-600 transition-colors"
              />
            </div>
          </div>

          {/* Hàng 3: Nguồn gốc + Trạng thái kho */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
            <div className="sm:col-span-2">
              <label className="font-semibold text-stone-600 block mb-1.5">Nguồn gốc / Xuất xứ</label>
              <input
                type="text"
                placeholder="VD: Vườn nhà Tâm (Phước Hậu, Ninh Phước) hoặc Cảng cá Cà Ná"
                value={newProduct.source}
                onChange={(e) => setNewProduct({ ...newProduct, source: e.target.value })}
                className="w-full p-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 focus:outline-none focus:border-amber-600 transition-colors"
              />
            </div>

            <div>
              <CustomSelect
                label="Tình trạng kho"
                headerLabel="TRẠNG THÁI MỞ BÁN:"
                options={STOCK_STATUS_OPTIONS}
                value={newProduct.inStock}
                onChange={(newStockVal) => setNewProduct({ ...newProduct, inStock: newStockVal })}
                renderSelected={(opt) => (
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${opt?.dotClass} ${opt?.value ? 'animate-pulse' : ''}`} />
                    <span>{opt?.label}</span>
                  </div>
                )}
                renderOption={(opt) => (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className={`w-2 h-2 rounded-full ${opt.dotClass}`} />
                      <span>{opt.label}</span>
                    </div>
                    <p className="text-[10px] text-stone-400 pl-3.5 font-light">
                      {opt.subLabel}
                    </p>
                  </div>
                )}
              />
            </div>
          </div>

          {/* Hàng 4: Upload Ảnh */}
          <ImageUploadField
            label="Ảnh đặc sản (Supabase Storage)"
            value={newProduct.image}
            bucket="products"
            onChange={(url) => setNewProduct({ ...newProduct, image: url })}
          />

          {/* Hàng 5: Quy cách đóng gói & tính giá (Tách riêng biệt từng hàng bằng flex-col & gap chuẩn) */}
          <div className="p-4 sm:p-5 bg-stone-50/80 rounded-2xl border border-stone-200 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-stone-800 text-xs">
                <Layers className="w-4 h-4 text-amber-700" />
                <span>Quy cách đóng gói & Cơ chế định giá</span>
              </div>
              <button
                type="button"
                onClick={handleAddWeightRow}
                className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm quy cách</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {weightsList.map((row, idx) => (
                <div 
                  key={idx} 
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 bg-white p-3 rounded-2xl border border-stone-200/90 shadow-2xs"
                >
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      placeholder="Tên quy cách (VD: Thùng 5kg)"
                      value={row.label}
                      onChange={(e) => handleUpdateWeightRow(idx, 'label', e.target.value)}
                      className="w-full p-2.5 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:border-amber-600 transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-36 shrink-0">
                      <select
                        value={row.calcType}
                        onChange={(e) => handleUpdateWeightRow(idx, 'calcType', e.target.value)}
                        className="w-full p-2.5 border border-stone-200 rounded-xl text-xs font-medium text-stone-700 cursor-pointer focus:outline-none focus:border-amber-600 bg-stone-50 transition-colors"
                      >
                        <option value="multiplier">Nhân hệ số (x)</option>
                        <option value="fixed">Giá cố định (VNĐ)</option>
                      </select>
                    </div>

                    <div className="w-32 shrink-0">
                      <input
                        type="number"
                        step={row.calcType === 'multiplier' ? '0.1' : '1000'}
                        min="0"
                        placeholder={row.calcType === 'multiplier' ? 'VD: 4.8' : 'VD: 299000'}
                        value={row.value}
                        onChange={(e) => handleUpdateWeightRow(idx, 'value', e.target.value)}
                        className="w-full p-2.5 border border-stone-200 rounded-xl font-mono font-bold text-amber-900 text-xs focus:outline-none focus:border-amber-600 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    <div className="text-[11px] text-stone-500 font-mono text-left sm:text-right shrink-0">
                      {row.calcType === 'fixed' ? (
                        <span className="text-emerald-700 font-bold">
                          {Number(row.value || 0).toLocaleString('vi-VN')}đ
                        </span>
                      ) : (
                        <span>
                          = {((Number(newProduct.basePrice) || 0) * (Number(row.value) || 0)).toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveWeightRow(idx)}
                      className="p-2 text-stone-400 hover:text-red-600 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Xóa quy cách này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hàng 6: Mô tả */}
          <div>
            <label className="font-semibold text-stone-600 block mb-1.5">Mô tả đặc điểm</label>
            <textarea
              rows="2"
              placeholder="Quả mọng, ngọt đậm vị thanh mát tự nhiên..."
              value={newProduct.desc}
              onChange={(e) => setNewProduct({ ...newProduct, desc: e.target.value })}
              className="w-full p-3 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-700 resize-none focus:outline-none focus:border-amber-600 leading-relaxed transition-colors"
            />
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Đăng Sản Phẩm Mới</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Danh sách đặc sản trên kệ */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-stone-900">Danh Sách Đặc Sản ({products.length})</h2>
            <p className="text-xs text-stone-500">Chỉnh sửa thông tin, giá, đổi ảnh hoặc bật/tắt bán</p>
          </div>
          {onResetProducts && (
            <button
              type="button"
              onClick={onResetProducts}
              className="px-3.5 py-1.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục mặc định</span>
            </button>
          )}
        </div>

        {products.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-xs italic">
            Chưa có sản phẩm nào trên kệ.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {products.map((p) => {
              const catKey = p.category_id || p.category;
              const currentCat = categories.find((c) => c.id === catKey);
              const isAvailable = p.inStock ?? p.in_stock ?? true;
              const productImg = p.image_url || p.image || "https://images.unsplash.com/photo-1616684000067-36952fde56ec?auto=format&fit=crop&w=600&q=80";
              const priceVal = Number(p.basePrice ?? p.base_price ?? p.price ?? 0);

              return (
                <div key={p.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img 
                      src={productImg} 
                      alt={p.name || p.title} 
                      className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-stone-100 shadow-2xs" 
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1616684000067-36952fde56ec?auto=format&fit=crop&w=600&q=80";
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-stone-900 truncate">{p.name || p.title}</span>
                        {p.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold shrink-0">
                            {p.badge}
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-medium shrink-0">
                          {currentCat?.label || catKey}
                        </span>
                      </div>
                      <span className="text-stone-500 text-[11px] font-mono block mt-1">
                        {priceVal.toLocaleString('vi-VN')}đ / {typeof p.unit === 'object' ? p.unit?.label : (p.unit || 'kg')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditProduct(p)}
                      className="p-2 text-stone-400 hover:text-amber-600 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Chỉnh sửa sản phẩm & cập nhật ảnh"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleStock(p.id)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isAvailable 
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' 
                          : 'bg-stone-100 text-stone-500 hover:bg-stone-200 border border-stone-200'
                      }`}
                    >
                      {isAvailable ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-emerald-600" />
                          <span>Đang bán</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-stone-400" />
                          <span>Tạm hết lứa</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteProduct(p.id, p.name || p.title)}
                      className="p-2 text-stone-400 hover:text-red-600 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Xóa đặc sản"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}