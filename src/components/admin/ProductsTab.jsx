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
  Tag,
  Loader2
} from 'lucide-react';
import ImageUploadField from '../ImageUploadField';
import { supabase } from '../../supabaseClient';

const DEFAULT_CATEGORIES = [
  { id: 'cat01', label: 'Combo Ưu Đãi' },
  { id: 'cat02', label: 'Trái Cây Tươi Giàn' },
  { id: 'cat03', label: 'Nem & Chả Đặc Sản' },
  { id: 'cat04', label: 'Hải Sản Gió Biển' },
  { id: 'cat05', label: 'Gia Vị Xứ Nắng' },
  { id: 'cat06', label: 'Đặc Sản Sấy Dẻo' }
];

const CALC_TYPE_OPTIONS = [
  { value: 'multiplier', label: 'Nhân hệ số (x)' },
  { value: 'fixed', label: 'Giá cố định (VNĐ)' }
];

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

function CustomCalcTypeSelect({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const selectedOpt = CALC_TYPE_OPTIONS.find((o) => o.value === value) || CALC_TYPE_OPTIONS[0];

  return (
    <div className="relative w-36 sm:w-40 shrink-0 font-sans text-stone-800" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full h-11 px-3 rounded-2xl border text-left flex items-center justify-between gap-1 transition-all duration-200 cursor-pointer text-xs sm:text-sm ${
          isOpen
            ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-400/20 shadow-xs text-stone-900 font-bold'
            : 'bg-stone-50 hover:bg-white border-stone-200 hover:border-amber-400 text-stone-800 font-semibold shadow-2xs'
        }`}
      >
        <span className="font-semibold truncate">{selectedOpt.label}</span>
        <ChevronDown
          className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-amber-700' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-30 p-1.5 rounded-2xl bg-white border border-amber-200/90 shadow-xl space-y-1 animate-fadeIn text-xs sm:text-sm">
          {CALC_TYPE_OPTIONS.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-3 py-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-amber-100/80 text-amber-950 font-bold border border-amber-300'
                    : 'hover:bg-amber-50/70 text-stone-700 font-medium'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <Check className="w-4 h-4 text-amber-800 shrink-0 stroke-[2.5]" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
    <div className="relative w-full font-sans text-stone-800" ref={containerRef}>
      {label && (
        <label className="font-bold text-stone-700 block mb-1.5 text-xs sm:text-sm">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full h-11 px-4 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all duration-200 cursor-pointer text-xs sm:text-sm ${
          isOpen
            ? 'bg-amber-50/60 border-amber-500 ring-2 ring-amber-400/20 shadow-xs text-stone-900 font-bold'
            : 'bg-white hover:bg-stone-50/80 border-stone-300 hover:border-amber-400 shadow-2xs text-stone-800 font-medium'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon className="w-4 h-4 text-amber-700 shrink-0" />}
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

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 p-2 rounded-2xl bg-white border border-amber-200/90 shadow-2xl space-y-1 animate-fadeIn text-xs sm:text-sm backdrop-blur-md">
          {headerLabel && (
            <div className="px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-stone-400">
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
                  className={`p-3 rounded-xl cursor-pointer flex items-center justify-between gap-2 transition-all ${
                    isSelected
                      ? 'bg-amber-100/80 text-amber-950 font-bold border border-amber-300 shadow-2xs'
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
                          <span className={`text-xs font-mono font-bold ${isSelected ? 'text-amber-900' : 'text-stone-400'}`}>
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

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

  // Ghi trực tiếp xuống Supabase Database và tự kích hoạt Sequence ID
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newProduct.name.trim() || !newProduct.basePrice) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      const basePriceNum = Number(newProduct.basePrice) || 0;
      const defaultUnitLabel = newProduct.unit.trim() || 'kg';

      // 1. Thêm bản ghi vào bảng products (KHÔNG truyền ID để Supabase sequence tự sinh prd...)
      const productInsertPayload = {
        name: newProduct.name.trim(),
        base_price: basePriceNum,
        unit: defaultUnitLabel,
        category_id: newProduct.category,
        badge: newProduct.badge.trim(),
        source: newProduct.source.trim(),
        description: newProduct.desc.trim(),
        image_url: newProduct.image.trim() || 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
        in_stock: newProduct.inStock,
        created_at: new Date().toISOString()
      };

      const { data: insertedProduct, error: prodErr } = await supabase
        .from('products')
        .insert([productInsertPayload])
        .select()
        .single();

      if (prodErr) throw prodErr;
      if (!insertedProduct) throw new Error('Không nhận được dữ liệu phản hồi từ Supabase');

      // 2. Chuẩn hóa và thêm danh sách quy cách vào bảng product_weights
      const finalWeights = weightsList
        .filter((w) => w.label.trim())
        .map((w, idx) => {
          const isMultiplier = w.calcType === 'multiplier';
          const numVal = Number(w.value) || 0;

          return {
            product_id: insertedProduct.id,
            weight_key: `opt_${idx + 1}`,
            weight_label: w.label.trim(),
            multiplier: isMultiplier ? (numVal > 0 ? numVal : 1) : 1,
            price_override: isMultiplier ? null : numVal,
            is_default: idx === 0,
            sort_order: idx
          };
        });

      const resolvedWeightsPayload = finalWeights.length > 0 ? finalWeights : [
        {
          product_id: insertedProduct.id,
          weight_key: 'std',
          weight_label: `1 ${defaultUnitLabel}`,
          multiplier: 1,
          price_override: null,
          is_default: true,
          sort_order: 0
        }
      ];

      const { data: insertedWeights, error: weightsErr } = await supabase
        .from('product_weights')
        .insert(resolvedWeightsPayload)
        .select();

      if (weightsErr) {
        console.warn('Lỗi khi chèn quy cách sản phẩm:', weightsErr);
      }

      // 3. Đóng gói sản phẩm hoàn chỉnh để đồng bộ lên State cha
      const completedProduct = {
        ...insertedProduct,
        id: insertedProduct.id,
        basePrice: insertedProduct.base_price,
        image: insertedProduct.image_url,
        inStock: insertedProduct.in_stock,
        category: insertedProduct.category_id,
        desc: insertedProduct.description,
        weights: insertedWeights || resolvedWeightsPayload,
        product_weights: insertedWeights || resolvedWeightsPayload
      };

      if (onAddProduct) {
        onAddProduct(completedProduct);
      }

      // 4. Reset Form về trạng thái rỗng ban đầu
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
    } catch (err) {
      console.error('Lỗi khi lưu sản phẩm vào Supabase:', err);
      setFormError(err.message || 'Lỗi khi lưu vào cơ sở dữ liệu. Hãy kiểm tra lại quyền RLS.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-7 font-sans animate-fadeIn text-stone-800">
      {/* 1. Form thêm đặc sản */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-7 space-y-5 shadow-xs">
        <div className="flex items-center gap-2.5 text-stone-900 font-black text-sm sm:text-base border-b border-stone-100 pb-3.5">
          <Plus className="w-5 h-5 text-amber-700" />
          <span>Thêm Đặc Sản Mới Lên Kệ</span>
        </div>

        {formError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold rounded-2xl">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* Hàng 1: Tên đặc sản + Danh mục */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 sm:gap-4">
            <div className="sm:col-span-8">
              <label className="font-bold text-stone-700 block mb-1.5">Tên đặc sản *</label>
              <input
                type="text"
                required
                placeholder="VD: Nho Xanh Ninh Thuận (NH01-48)"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white font-medium text-stone-900 focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
              />
            </div>

            <div className="sm:col-span-4">
              <CustomSelect
                label="Danh mục phân loại *"
                headerLabel="DANH MỤC TRONG CƠ SỞ DỮ LIỆU:"
                icon={Tag}
                options={categories}
                value={newProduct.category}
                onChange={(newCatId) => setNewProduct({ ...newProduct, category: newCatId })}
                renderSelected={(opt) => (
                  <span className="flex items-center gap-2">
                    <span className="font-bold text-stone-900">{opt?.label}</span>
                    <span className="text-xs font-mono text-stone-400 font-normal">({opt?.id})</span>
                  </span>
                )}
                renderOption={(opt, isSelected) => (
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">{opt.label}</span>
                    <span className={`text-xs font-mono font-bold ${isSelected ? 'text-amber-900' : 'text-stone-400'}`}>
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
              <label className="font-bold text-stone-700 block mb-1.5">Giá chuẩn 1 đơn vị (VNĐ) *</label>
              <input
                type="number"
                required
                min="0"
                step="1000"
                placeholder="VD: 65000"
                value={newProduct.basePrice}
                onChange={(e) => setNewProduct({ ...newProduct, basePrice: e.target.value })}
                className="w-full h-11 px-3.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white font-mono font-black text-amber-950 text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1.5">Đơn vị chuẩn</label>
              <input
                type="text"
                placeholder="kg, hộp, chai, đòn..."
                value={newProduct.unit}
                onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                className="w-full h-11 px-3.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-medium focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1.5">Huy hiệu (Badge)</label>
              <input
                type="text"
                placeholder="VD: Bao ngọt giàn, Hái sáng sớm"
                value={newProduct.badge}
                onChange={(e) => setNewProduct({ ...newProduct, badge: e.target.value })}
                className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-medium focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
              />
            </div>
          </div>

          {/* Hàng 3: Nguồn gốc + Trạng thái kho */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 sm:gap-4">
            <div className="sm:col-span-8">
              <label className="font-bold text-stone-700 block mb-1.5">Nguồn gốc / Xuất xứ</label>
              <input
                type="text"
                placeholder="VD: Vườn nhà Tâm (Phước Hậu, Ninh Phước) hoặc Cảng cá Cà Ná"
                value={newProduct.source}
                onChange={(e) => setNewProduct({ ...newProduct, source: e.target.value })}
                className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-medium focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
              />
            </div>

            <div className="sm:col-span-4">
              <CustomSelect
                label="Tình trạng kho"
                headerLabel="TRẠNG THÁI MỞ BÁN:"
                options={STOCK_STATUS_OPTIONS}
                value={newProduct.inStock}
                onChange={(newStockVal) => setNewProduct({ ...newProduct, inStock: newStockVal })}
                renderSelected={(opt) => (
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${opt?.dotClass} ${opt?.value ? 'animate-pulse' : ''}`} />
                    <span className="font-bold">{opt?.label}</span>
                  </div>
                )}
                renderOption={(opt) => (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 font-bold">
                      <span className={`w-2.5 h-2.5 rounded-full ${opt.dotClass}`} />
                      <span>{opt.label}</span>
                    </div>
                    <p className="text-xs text-stone-500 pl-4 font-normal">
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

          {/* Hàng 5: Quy cách đóng gói & tính giá */}
          <div className="p-4 sm:p-5 bg-stone-50/90 rounded-3xl border border-stone-200 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 font-bold text-stone-900 text-xs sm:text-sm">
                <Layers className="w-4 h-4 text-amber-700" />
                <span>Quy cách đóng gói & Cơ chế định giá</span>
              </div>
              <button
                type="button"
                onClick={handleAddWeightRow}
                className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 shadow-2xs"
              >
                <Plus className="w-4 h-4 text-amber-800" />
                <span>Thêm quy cách</span>
              </button>
            </div>

            <div className="space-y-3">
              {weightsList.map((row, idx) => {
                const calculatedPrice = row.calcType === 'fixed'
                  ? Number(row.value || 0)
                  : (Number(newProduct.basePrice) || 0) * (Number(row.value) || 0);

                return (
                  <div 
                    key={idx} 
                    className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs hover:border-amber-300 transition-all"
                  >
                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="text"
                        placeholder="Tên quy cách (VD: Thùng 5kg...)"
                        value={row.label}
                        onChange={(e) => handleUpdateWeightRow(idx, 'label', e.target.value)}
                        className="w-full h-11 px-4 border border-stone-200 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 focus:outline-none focus:border-amber-600 bg-stone-50/40 focus:bg-white transition-colors shadow-2xs"
                      />
                    </div>

                    <CustomCalcTypeSelect
                      value={row.calcType}
                      onChange={(val) => handleUpdateWeightRow(idx, 'calcType', val)}
                    />

                    <div className="w-24 sm:w-28 shrink-0">
                      <input
                        type="number"
                        step={row.calcType === 'multiplier' ? '0.1' : '1000'}
                        min="0"
                        placeholder={row.calcType === 'multiplier' ? 'VD: 2' : 'VD: 299000'}
                        value={row.value}
                        onChange={(e) => handleUpdateWeightRow(idx, 'value', e.target.value)}
                        className="w-full h-11 px-3 border border-stone-200 rounded-xl font-mono font-bold text-amber-950 text-xs sm:text-sm focus:outline-none focus:border-amber-600 transition-colors text-right bg-stone-50/40 focus:bg-white shadow-2xs"
                      />
                    </div>

                    <div className="hidden sm:flex h-11 px-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 font-mono font-black text-xs sm:text-sm items-center justify-center shrink-0 w-28 shadow-2xs">
                      {calculatedPrice.toLocaleString('vi-VN')}đ
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveWeightRow(idx)}
                      className="w-11 h-11 rounded-xl bg-stone-50 hover:bg-rose-50 border border-stone-200 hover:border-rose-200 text-stone-400 hover:text-rose-600 flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-2xs"
                      title="Xóa quy cách này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hàng 6: Mô tả */}
          <div>
            <label className="font-bold text-stone-700 block mb-1.5">Mô tả đặc điểm</label>
            <textarea
              rows="3"
              placeholder="Quả mọng, ngọt đậm vị thanh mát tự nhiên..."
              value={newProduct.desc}
              onChange={(e) => setNewProduct({ ...newProduct, desc: e.target.value })}
              className="w-full p-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 resize-none focus:outline-none focus:border-amber-600 leading-relaxed transition-colors shadow-2xs text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-stone-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-7 py-3 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white rounded-2xl font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer text-xs sm:text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu vào cơ sở dữ liệu...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Đăng Sản Phẩm Mới</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Danh sách đặc sản trên kệ */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-7 space-y-5 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-stone-100 pb-3.5">
          <div>
            <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
              Danh Sách Đặc Sản ({products.length})
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 font-medium mt-0.5">
              Chỉnh sửa thông tin, giá, đổi ảnh hoặc bật/tắt bán
            </p>
          </div>
          {onResetProducts && (
            <button
              type="button"
              onClick={onResetProducts}
              className="px-4 py-2 rounded-2xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Khôi phục mặc định</span>
            </button>
          )}
        </div>

        {products.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-xs sm:text-sm italic font-medium">
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
                <div key={p.id} className="py-4 flex items-center justify-between gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img 
                      src={productImg} 
                      alt={p.name || p.title} 
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover shrink-0 border border-stone-200 shadow-2xs bg-stone-100" 
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1616684000067-36952fde56ec?auto=format&fit=crop&w=600&q=80";
                      }}
                    />
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-amber-950 bg-amber-100 px-2 py-0.5 rounded-lg text-xs border border-amber-300/70">
                          #{p.id}
                        </span>
                        <span className="font-bold text-stone-900 text-sm sm:text-base truncate">{p.name || p.title}</span>
                        {p.badge && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold shrink-0">
                            {p.badge}
                          </span>
                        )}
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-950 border border-amber-200 font-semibold shrink-0">
                          {currentCat?.label || catKey}
                        </span>
                      </div>
                      <span className="text-stone-600 text-xs sm:text-sm font-mono font-semibold block">
                        {priceVal.toLocaleString('vi-VN')}đ / {typeof p.unit === 'object' ? p.unit?.label : (p.unit || 'kg')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditProduct(p)}
                      className="p-2 text-stone-400 hover:text-amber-700 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Chỉnh sửa sản phẩm & cập nhật ảnh"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleStock(p.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs active:scale-95 ${
                        isAvailable 
                          ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300' 
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200'
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