// src/components/admin/EditProductModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Plus, Trash2, Star, Layers, ChevronDown } from 'lucide-react';
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
    <div className="relative w-36 shrink-0 font-sans text-stone-800" ref={ref}>
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

function CustomCategorySelect({ label, options = [], value, onChange }) {
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

  const selectedOpt = options.find((opt) => opt.id === value) || options[0];

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
            : 'bg-white hover:bg-stone-50/80 border-amber-400/90 hover:border-amber-500 shadow-2xs text-stone-800 font-medium'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-stone-900 whitespace-nowrap">{selectedOpt?.label}</span>
          <span className="text-xs font-mono text-stone-400 font-normal shrink-0">
            ({selectedOpt?.id})
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180 text-amber-700' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 p-2 rounded-2xl bg-white border border-amber-200/90 shadow-2xl space-y-1 animate-fadeIn text-xs sm:text-sm min-w-[260px]">
          <div className="px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-stone-400">
            DANH SÁCH DANH MỤC DATABASE:
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {options.map((opt) => {
              const isSelected = opt.id === value;

              return (
                <div
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`p-3 rounded-xl cursor-pointer flex items-center justify-between gap-2 transition-all ${
                    isSelected
                      ? 'bg-amber-100/80 text-amber-950 font-bold border border-amber-300 shadow-2xs'
                      : 'hover:bg-amber-50/70 text-stone-700 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate">{opt.label}</span>
                    <span className={`text-xs font-mono font-bold ${isSelected ? 'text-amber-900' : 'text-stone-400'}`}>
                      ({opt.id})
                    </span>
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

export default function EditProductModal({ product, onClose, onSave }) {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

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
      } catch (e) {
        // Fallback dùng DEFAULT_CATEGORIES
      }
    }
    loadDbCategories();
  }, []);

  const [formData, setFormData] = useState(() => {
    const rawWeights = product?.product_weights || product?.weights;
    let initialWeights = [];

    if (Array.isArray(rawWeights) && rawWeights.length > 0) {
      initialWeights = rawWeights.map((w, idx) => {
        const hasPriceOverride = w.price_override !== null && w.price_override !== undefined && w.price_override !== '';
        return {
          id: w.id || `opt_${idx + 1}`,
          weight_key: w.weight_key || w.key || `w_${idx + 1}`,
          label: w.label || w.weight_label || `Quy cách ${idx + 1}`,
          calcType: hasPriceOverride ? 'fixed' : 'multiplier',
          val: hasPriceOverride ? Number(w.price_override) : (parseFloat(w.multiplier) || 1),
          multiplier: parseFloat(w.multiplier) || 1,
          price_override: hasPriceOverride ? Number(w.price_override) : null,
          is_default: Boolean(w.is_default || idx === 0),
          sort_order: w.sort_order ?? idx
        };
      });
    } else {
      initialWeights = [
        {
          id: 'std',
          weight_key: 'std',
          label: `1 ${product?.unit || 'kg'}`,
          calcType: 'multiplier',
          val: 1,
          multiplier: 1,
          price_override: null,
          is_default: true,
          sort_order: 0
        }
      ];
    }

    const currentCatId = product?.category_id || product?.category || 'cat02';

    return {
      ...product,
      name: product?.name || '',
      category: currentCatId,
      unit: typeof product?.unit === 'object' ? (product?.unit?.label || 'kg') : (product?.unit || 'kg'),
      basePrice: Number(product?.basePrice ?? product?.base_price ?? product?.price ?? 0),
      badge: product?.badge || '',
      source: product?.source || 'Vườn nhà Tâm (Phước Hậu)',
      image: product?.image_url || product?.image || '',
      desc: product?.desc || product?.description || '',
      inStock: product?.inStock ?? product?.in_stock ?? true,
      weights: initialWeights
    };
  });

  const handleUpdateWeightRow = (index, field, value) => {
    const updated = [...formData.weights];
    const currentRow = { ...updated[index], [field]: value };

    if (field === 'calcType' || field === 'val') {
      const type = field === 'calcType' ? value : currentRow.calcType;
      const valNum = Number(field === 'val' ? value : currentRow.val) || 0;

      if (type === 'fixed') {
        currentRow.price_override = valNum;
        currentRow.multiplier = 1;
      } else {
        currentRow.price_override = null;
        currentRow.multiplier = valNum > 0 ? valNum : 1;
      }
    }

    updated[index] = currentRow;
    setFormData({ ...formData, weights: updated });
  };

  const handleSetDefaultWeight = (index) => {
    const updatedWeights = formData.weights.map((w, i) => ({
      ...w,
      is_default: i === index
    }));
    setFormData({ ...formData, weights: updatedWeights });
  };

  const handleAddWeight = () => {
    const nextIdx = formData.weights.length;
    setFormData({
      ...formData,
      weights: [
        ...formData.weights,
        {
          id: 'opt_' + Date.now(),
          weight_key: `opt_${nextIdx + 1}`,
          label: '',
          calcType: 'multiplier',
          val: 1,
          multiplier: 1,
          price_override: null,
          is_default: formData.weights.length === 0,
          sort_order: nextIdx
        }
      ]
    });
  };

  const handleRemoveWeight = (index) => {
    if (formData.weights.length <= 1) return;
    const removedWasDefault = formData.weights[index].is_default;
    const remaining = formData.weights.filter((_, i) => i !== index);

    if (removedWasDefault && remaining.length > 0) {
      remaining[0].is_default = true;
    }

    setFormData({ ...formData, weights: remaining });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formattedWeights = formData.weights
      .filter((w) => w.label.trim())
      .map((w, idx) => ({
        id: w.id,
        weight_key: w.weight_key || `opt_${idx + 1}`,
        label: w.label.trim(),
        multiplier: w.calcType === 'multiplier' ? (Number(w.val) || 1) : 1,
        price_override: w.calcType === 'fixed' ? (Number(w.val) || 0) : null,
        is_default: Boolean(w.is_default),
        sort_order: idx
      }));

    const payload = {
      ...formData,
      name: formData.name.trim(),
      category: formData.category,
      category_id: formData.category,
      price: formData.basePrice,
      base_price: formData.basePrice,
      in_stock: formData.inStock,
      image_url: formData.image,
      description: formData.desc,
      product_weights: formattedWeights.length > 0 ? formattedWeights : formData.weights,
      weights: formattedWeights.length > 0 ? formattedWeights : formData.weights
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-950/75 backdrop-blur-xs animate-fadeIn font-sans text-stone-800">
      {/* Khung modal mở rộng max-w-5xl (1024px) tạo không gian thoáng đãng */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-5xl w-full shadow-2xl border border-stone-200 space-y-5 max-h-[92vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        
        {/* HEADER MODAL */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <h3 className="text-base sm:text-xl font-black text-stone-900 tracking-tight">
              Chỉnh Sửa Đặc Sản & Quy Cách
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 font-mono mt-0.5">Mã: #{formData.id || 'N/A'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-2 rounded-2xl hover:bg-stone-100 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="font-bold text-stone-700 block mb-1.5">Tên đặc sản *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-medium focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
            />
          </div>

          {/* Grid 12 cột: Danh mục 6 cột, Giá chuẩn 3 cột, Đơn vị chuẩn 3 cột */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 sm:gap-4">
            <div className="sm:col-span-6">
              <CustomCategorySelect
                label="Danh mục *"
                options={categories}
                value={formData.category}
                onChange={(newCatId) => setFormData({ ...formData, category: newCatId })}
              />
            </div>

            <div className="sm:col-span-3">
              <label className="font-bold text-stone-700 block mb-1.5">Giá chuẩn 1 đơn vị (VNĐ) *</label>
              <input
                type="number"
                required
                min="0"
                step="1000"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) || 0 })}
                className="w-full h-11 px-3.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white font-mono font-black text-amber-950 text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="font-bold text-stone-700 block mb-1.5">Đơn vị chuẩn</label>
              <input
                type="text"
                placeholder="VD: kg, thùng..."
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full h-11 px-3.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-medium text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="font-bold text-stone-700 block mb-1.5">Nguồn gốc xuất xứ</label>
              <input
                type="text"
                placeholder="VD: Vườn Phước Hậu, Làng chài Cà Ná..."
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-medium focus:outline-none focus:border-amber-600 shadow-2xs"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1.5">Huy hiệu (Badge)</label>
              <input
                type="text"
                placeholder="VD: BÁN CHẠY, HÁI SỚM, MỚI..."
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-medium focus:outline-none focus:border-amber-600 shadow-2xs"
              />
            </div>
          </div>

          <ImageUploadField
            label="Cập nhật ảnh đặc sản (Supabase Storage)"
            value={formData.image}
            bucket="products"
            onChange={(newUrl) => setFormData({ ...formData, image: newUrl })}
          />

          {/* QUY CÁCH ĐÓNG GÓI & CƠ CHẾ ĐỊNH GIÁ */}
          <div className="bg-stone-50/90 p-4 sm:p-5 rounded-3xl border border-stone-200/90 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 font-bold text-stone-900 text-xs sm:text-sm">
                <Layers className="w-4 h-4 text-amber-700" />
                <span>Quy cách đóng gói & Cơ chế định giá</span>
              </div>
              <button
                type="button"
                onClick={handleAddWeight}
                className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs active:scale-95"
              >
                <Plus className="w-4 h-4 text-amber-800" />
                <span>Thêm quy cách</span>
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed font-normal">
              Bấm biểu tượng <strong>Sao vàng</strong> để chọn quy cách mở đầu. Hỗ trợ tính theo <strong>Hệ số x</strong> hoặc <strong>Giá chẵn trực tiếp</strong>.
            </p>

            <div className="space-y-3">
              {formData.weights.map((w, index) => {
                const calculatedPrice = w.calcType === 'fixed'
                  ? Number(w.val || 0)
                  : (Number(formData.basePrice) || 0) * (Number(w.val) || 0);

                return (
                  <div 
                    key={w.id || index} 
                    className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs hover:border-amber-300 transition-all"
                  >
                    {/* Nút sao vàng mặc định: cố định 44x44px */}
                    <button
                      type="button"
                      onClick={() => handleSetDefaultWeight(index)}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        w.is_default
                          ? 'bg-amber-100 text-amber-700 border border-amber-300 shadow-2xs'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-300 hover:text-stone-500 border border-stone-200'
                      }`}
                      title={w.is_default ? 'Quy cách mặc định' : 'Bấm để đặt làm mặc định'}
                    >
                      <Star className={`w-4 h-4 ${w.is_default ? 'fill-amber-600 text-amber-600' : ''}`} />
                    </button>

                    {/* Tên quy cách: chiếm toàn bộ phần diện tích còn lại */}
                    <div className="flex-1 min-w-[240px]">
                      <input
                        type="text"
                        placeholder="Tên quy cách (VD: Thùng 10kg Đại Gia Đình...)"
                        value={w.label}
                        onChange={(e) => handleUpdateWeightRow(index, 'label', e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-stone-200 text-xs sm:text-sm font-semibold text-stone-900 focus:outline-none focus:border-amber-600 bg-stone-50/40 focus:bg-white shadow-2xs transition-colors"
                      />
                    </div>

                    {/* Dropdown cơ chế tính giá: w-36 */}
                    <div className="w-36 shrink-0">
                      <CustomCalcTypeSelect
                        value={w.calcType}
                        onChange={(val) => handleUpdateWeightRow(index, 'calcType', val)}
                      />
                    </div>

                    {/* Ô nhập hệ số hoặc số tiền: w-24 */}
                    <div className="w-24 shrink-0">
                      <input
                        type="number"
                        step={w.calcType === 'multiplier' ? '0.1' : '1000'}
                        min="0"
                        placeholder={w.calcType === 'multiplier' ? '1.9' : '299000'}
                        value={w.val ?? ''}
                        onChange={(e) => handleUpdateWeightRow(index, 'val', e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-stone-200 font-mono font-bold text-amber-950 text-xs sm:text-sm focus:outline-none focus:border-amber-600 text-right bg-stone-50/40 focus:bg-white shadow-2xs transition-colors"
                      />
                    </div>

                    {/* Thẻ hiển thị thành tiền: w-28 */}
                    <div className="hidden sm:flex h-11 px-3 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 font-mono font-black text-xs sm:text-sm items-center justify-center shrink-0 w-28 shadow-2xs">
                      {calculatedPrice.toLocaleString('vi-VN')}đ
                    </div>

                    {/* Nút xóa quy cách: cố định 44x44px */}
                    {formData.weights.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveWeight(index)}
                        className="w-11 h-11 rounded-xl bg-stone-50 hover:bg-rose-50 border border-stone-200 hover:border-rose-200 text-stone-400 hover:text-rose-600 flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-2xs"
                        title="Xóa quy cách này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="w-11 h-11 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1.5">Mô tả đặc điểm</label>
            <textarea
              rows="3"
              placeholder="Giới thiệu hương vị, độ ngọt, độ giòn và cách dùng..."
              value={formData.desc}
              onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
              className="w-full p-3.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 text-xs sm:text-sm resize-none focus:outline-none focus:border-amber-600 leading-relaxed shadow-2xs transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
            <label className="flex items-center gap-2.5 cursor-pointer font-bold text-stone-800 text-xs sm:text-sm select-none">
              <input
                type="checkbox"
                checked={formData.inStock}
                onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                className="w-4 h-4 rounded-md accent-amber-600 cursor-pointer"
              />
              <span>Đang mở bán (Còn hàng trên kệ)</span>
            </label>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-amber-700 hover:bg-amber-800 text-white shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Lưu Thay Đổi Sản Phẩm</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}