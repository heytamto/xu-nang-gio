// src/components/admin/EditProductModal.jsx
import React, { useState } from 'react';
import { X, Check, Plus, Trash2, Star } from 'lucide-react';
import ImageUploadField from './ImageUploadField';

const CATEGORY_OPTIONS = [
  { value: 'fresh', label: 'Trái Cây Tươi Hái Giàn' },
  { value: 'nem-cha', label: 'Nem Chua & Chả Truyền Thống' },
  { value: 'seafood', label: 'Hải Sản & Đồ Khô Cà Ná' },
  { value: 'condiments', label: 'Mật Nho, Rượu & Gia Vị' },
  { value: 'dried', label: 'Đặc Sản Phơi Nắng & Sấy Dẻo' }
];

export default function EditProductModal({ product, onClose, onSave }) {
  const [formData, setFormData] = useState(() => {
    const rawWeights = product?.product_weights || product?.weights;
    let initialWeights = [];

    if (Array.isArray(rawWeights) && rawWeights.length > 0) {
      initialWeights = rawWeights.map((w, idx) => ({
        id: w.id || `opt_${idx + 1}`,
        weight_key: w.weight_key || w.key || `w_${idx + 1}`,
        label: w.label || w.weight_label || `Quy cách ${idx + 1}`,
        multiplier: parseFloat(w.multiplier) || 1,
        price_override: w.price_override ? Number(w.price_override) : null,
        is_default: Boolean(w.is_default || idx === 0),
        sort_order: w.sort_order ?? idx
      }));
    } else {
      initialWeights = [
        {
          id: 'std',
          weight_key: '1kg',
          label: `1 ${product?.unit || 'kg'}`,
          multiplier: 1,
          price_override: null,
          is_default: true,
          sort_order: 0
        }
      ];
    }

    return {
      ...product,
      name: product?.name || '',
      category: product?.category || 'fresh',
      unit: product?.unit || 'kg',
      basePrice: Number(product?.basePrice ?? product?.base_price ?? product?.price ?? 0),
      badge: product?.badge || '',
      source: product?.source || 'Vườn nhà Ninh Thuận',
      image: product?.image_url || product?.image || '',
      desc: product?.desc || product?.description || '',
      inStock: product?.inStock ?? product?.in_stock ?? true,
      weights: initialWeights
    };
  });

  const handleWeightChange = (index, field, value) => {
    const updatedWeights = [...formData.weights];
    let parsedVal = value;

    if (field === 'multiplier') {
      parsedVal = parseFloat(value) || 0;
    } else if (field === 'price_override') {
      parsedVal = value === '' ? null : Number(value) || 0;
    }

    updatedWeights[index] = {
      ...updatedWeights[index],
      [field]: parsedVal
    };
    setFormData({ ...formData, weights: updatedWeights });
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
          label: 'Quy cách mới',
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

    // Chuẩn hóa payload sẵn sàng đồng bộ bảng products & product_weights
    const payload = {
      ...formData,
      price: formData.basePrice,
      base_price: formData.basePrice,
      in_stock: formData.inStock,
      image_url: formData.image,
      description: formData.desc,
      product_weights: formData.weights.map((w, idx) => ({
        ...w,
        sort_order: idx,
        weight_key: w.weight_key || `w_${idx + 1}`
      }))
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="text-sm font-black text-stone-900">Chỉnh Sửa Đặc Sản & Quy Cách</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-stone-600 block mb-1">Tên đặc sản *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-stone-600 block mb-1">Danh mục</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 cursor-pointer"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-stone-600 block mb-1">Giá bán cơ bản (VNĐ) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) || 0 })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-mono font-bold text-amber-900"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-600 block mb-1">Đơn vị tính</label>
              <input
                type="text"
                placeholder="VD: kg, hũ 500g, chai..."
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800"
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
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-600 block mb-1">Huy hiệu (Badge nổi bật)</label>
              <input
                type="text"
                placeholder="VD: BÁN CHẠY, HÁI SỚM, MỚI..."
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800"
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

          {/* Quy cách & Đóng gói (Bảng product_weights) */}
          <div className="bg-stone-50/80 p-3.5 rounded-2xl border border-stone-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-stone-800 text-xs block">Quy cách & Giá bán (product_weights):</span>
                <span className="text-[10px] text-stone-500">Bấm dấu sao để chọn quy cách mặc định khi mở xem</span>
              </div>
              <button
                type="button"
                onClick={handleAddWeight}
                className="text-amber-800 hover:text-amber-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm quy cách</span>
              </button>
            </div>

            <div className="space-y-2">
              {formData.weights.map((w, index) => (
                <div key={w.id || index} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-stone-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleSetDefaultWeight(index)}
                    className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                      w.is_default
                        ? 'bg-amber-100 text-amber-700'
                        : 'text-stone-300 hover:text-stone-500'
                    }`}
                    title={w.is_default ? 'Quy cách mặc định' : 'Đặt làm mặc định'}
                  >
                    <Star className={`w-3.5 h-3.5 ${w.is_default ? 'fill-amber-600 text-amber-600' : ''}`} />
                  </button>

                  <input
                    type="text"
                    placeholder="Tên quy cách (VD: Thùng 3kg)"
                    value={w.label}
                    onChange={(e) => handleWeightChange(index, 'label', e.target.value)}
                    className="flex-1 p-1.5 rounded-lg border border-stone-200 text-xs text-stone-800"
                  />

                  <div className="flex items-center gap-1 w-20">
                    <span className="text-[10px] text-stone-400">Hệ số:</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      value={w.multiplier ?? 1}
                      onChange={(e) => handleWeightChange(index, 'multiplier', e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-stone-200 text-xs font-mono font-bold text-center"
                    />
                  </div>

                  <div className="flex items-center gap-1 w-28">
                    <span className="text-[10px] text-stone-400">Giá riêng:</span>
                    <input
                      type="number"
                      placeholder="Tự tính"
                      value={w.price_override ?? ''}
                      onChange={(e) => handleWeightChange(index, 'price_override', e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-stone-200 text-xs font-mono text-emerald-800 text-right"
                    />
                  </div>

                  {formData.weights.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveWeight(index)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg cursor-pointer"
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
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-700 resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-700">
              <input
                type="checkbox"
                checked={formData.inStock}
                onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                className="w-4 h-4 rounded-md accent-amber-600"
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