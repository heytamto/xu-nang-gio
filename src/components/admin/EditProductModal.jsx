// src/components/admin/EditProductModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Trash2, Star, Layers } from 'lucide-react';
import ImageUploadField from './ImageUploadField';
import { supabase } from '../../supabaseClient';

// Danh mục chuẩn khớp 100% với Database Supabase
const DEFAULT_CATEGORIES = [
  { id: 'cat01', label: 'Combo Ưu Đãi' },
  { id: 'cat02', label: 'Trái Cây Tươi Giàn' },
  { id: 'cat03', label: 'Nem & Chả Đặc Sản' },
  { id: 'cat04', label: 'Hải Sản Gió Biển' },
  { id: 'cat05', label: 'Gia Vị Xứ Nắng' },
  { id: 'cat06', label: 'Đặc Sản Sấy Dẻo' }
];

export default function EditProductModal({ product, onClose, onSave }) {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  // Load danh mục động từ bảng categories nếu có
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

    // Tự động đồng bộ trường multiplier & price_override theo calcType
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-stone-900">Chỉnh Sửa Đặc Sản & Quy Cách</h3>
            <p className="text-[11px] text-stone-500">Mã: #{formData.id || 'N/A'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-stone-600 block mb-1">Tên đặc sản *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 font-medium focus:outline-none focus:border-amber-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-stone-600 block mb-1">Danh mục *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 cursor-pointer font-medium focus:outline-none focus:border-amber-600"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label} ({cat.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-stone-600 block mb-1">Giá chuẩn 1 đơn vị (VNĐ) *</label>
              <input
                type="number"
                required
                min="0"
                step="1000"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) || 0 })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-mono font-bold text-amber-900 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-600 block mb-1">Đơn vị chuẩn</label>
              <input
                type="text"
                placeholder="VD: kg, hộp, chai, đòn..."
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 font-medium focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-600 block mb-1">Nguồn gốc xuất xứ</label>
              <input
                type="text"
                placeholder="VD: Vườn Phước Hậu, Làng chài Cà Ná..."
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-600 block mb-1">Huy hiệu (Badge)</label>
              <input
                type="text"
                placeholder="VD: BÁN CHẠY, HÁI SỚM, MỚI..."
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          {/* Cập nhật ảnh qua Supabase Storage */}
          <ImageUploadField
            label="Cập nhật ảnh đặc sản (Supabase Storage)"
            value={formData.image}
            bucket="products"
            onChange={(newUrl) => setFormData({ ...formData, image: newUrl })}
          />

          {/* QUY CÁCH & ĐỊNH GIÁ ĐA DẠNG */}
          <div className="bg-stone-50/90 p-4 rounded-2xl border border-stone-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-stone-800 text-xs">
                <Layers className="w-4 h-4 text-amber-700" />
                <span>Quy cách đóng gói & Cơ chế định giá</span>
              </div>
              <button
                type="button"
                onClick={handleAddWeight}
                className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm quy cách</span>
              </button>
            </div>

            <p className="text-[11px] text-stone-500">
              Bấm biểu tượng <strong>Sao vàng</strong> để chọn quy cách mở đầu. Hỗ trợ tính theo <strong>Hệ số x</strong> hoặc <strong>Giá chẵn trực tiếp</strong>.
            </p>

            <div className="space-y-2">
              {formData.weights.map((w, index) => (
                <div key={w.id || index} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white p-2.5 rounded-xl border border-stone-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleSetDefaultWeight(index)}
                    className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                      w.is_default
                        ? 'bg-amber-100 text-amber-700'
                        : 'text-stone-300 hover:text-stone-500'
                    }`}
                    title={w.is_default ? 'Quy cách mặc định' : 'Bấm để đặt làm mặc định'}
                  >
                    <Star className={`w-3.5 h-3.5 ${w.is_default ? 'fill-amber-600 text-amber-600' : ''}`} />
                  </button>

                  <div className="flex-1 min-w-[130px]">
                    <input
                      type="text"
                      placeholder="Tên quy cách (VD: Thùng 5kg)"
                      value={w.label}
                      onChange={(e) => handleUpdateWeightRow(index, 'label', e.target.value)}
                      className="w-full p-2 rounded-lg border border-stone-200 text-xs font-semibold text-stone-800 focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  <div className="w-32 shrink-0">
                    <select
                      value={w.calcType}
                      onChange={(e) => handleUpdateWeightRow(index, 'calcType', e.target.value)}
                      className="w-full p-2 rounded-lg border border-stone-200 text-xs font-medium text-stone-700 cursor-pointer focus:outline-none focus:border-amber-600 bg-stone-50"
                    >
                      <option value="multiplier">Nhân hệ số (x)</option>
                      <option value="fixed">Giá cố định (VNĐ)</option>
                    </select>
                  </div>

                  <div className="w-28 shrink-0">
                    <input
                      type="number"
                      step={w.calcType === 'multiplier' ? '0.1' : '1000'}
                      min="0"
                      placeholder={w.calcType === 'multiplier' ? 'VD: 4.8' : 'VD: 299000'}
                      value={w.val ?? ''}
                      onChange={(e) => handleUpdateWeightRow(index, 'val', e.target.value)}
                      className="w-full p-2 rounded-lg border border-stone-200 font-mono font-bold text-amber-900 text-xs focus:outline-none focus:border-amber-600 text-right"
                    />
                  </div>

                  <div className="text-[11px] text-stone-500 font-mono w-24 text-right hidden sm:block">
                    {w.calcType === 'fixed' ? (
                      <span className="text-emerald-700 font-bold">{Number(w.val || 0).toLocaleString('vi-VN')}đ</span>
                    ) : (
                      <span>= {((Number(formData.basePrice) || 0) * (Number(w.val) || 0)).toLocaleString('vi-VN')}đ</span>
                    )}
                  </div>

                  {formData.weights.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveWeight(index)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                      title="Xóa quy cách này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="font-semibold text-stone-600 block mb-1">Mô tả đặc điểm</label>
            <textarea
              rows="3"
              placeholder="Giới thiệu hương vị, độ ngọt, độ giòn và cách dùng..."
              value={formData.desc}
              onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-700 resize-none focus:outline-none focus:border-amber-600"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-700">
              <input
                type="checkbox"
                checked={formData.inStock}
                onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                className="w-4 h-4 rounded-md accent-amber-600 cursor-pointer"
              />
              <span>Đang mở bán (Còn hàng trên kệ)</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Lưu Thay Đổi Sản Phẩm</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}