import React, { useState } from 'react';
import { X, Check, Plus, Trash2 } from 'lucide-react';
import ImageUploadField from './ImageUploadField';

const CATEGORY_OPTIONS = [
  { value: 'fresh', label: 'Trái Cây Tươi Hái Giàn' },
  { value: 'nem-cha', label: 'Nem Chua & Chả Truyền Thống' },
  { value: 'seafood', label: 'Hải Sản & Đồ Khô Cà Ná' },
  { value: 'condiments', label: 'Mật Nho, Rượu & Gia Vị' },
  { value: 'dried', label: 'Đặc Sản Phơi Nắng & Sấy Dẻo' }
];

export default function EditProductModal({ product, uploadUrl, onClose, onSave }) {
  const [formData, setFormData] = useState({
    ...product,
    name: product.name || '',
    category: product.category || 'fresh',
    unit: product.unit || 'kg',
    basePrice: Number(product.basePrice || product.price || 0),
    badge: product.badge || '',
    source: product.source || 'Vườn nhà Ninh Thuận',
    image: product.image || '',
    desc: product.desc || '',
    inStock: product.inStock ?? true,
    weights: Array.isArray(product.weights) && product.weights.length > 0
      ? product.weights
      : [{ id: 'std', label: `1 ${product.unit || 'kg'}`, multiplier: 1, priceBonus: 0 }]
  });

  const handleWeightChange = (index, field, value) => {
    const updatedWeights = [...formData.weights];
    updatedWeights[index] = {
      ...updatedWeights[index],
      [field]: (field === 'multiplier' || field === 'priceBonus') ? (Number(value) || 0) : value
    };
    setFormData({ ...formData, weights: updatedWeights });
  };

  const handleAddWeight = () => {
    setFormData({
      ...formData,
      weights: [
        ...formData.weights,
        { id: 'opt_' + Date.now(), label: 'Quy cách mới', multiplier: 1, priceBonus: 0 }
      ]
    });
  };

  const handleRemoveWeight = (index) => {
    if (formData.weights.length <= 1) return;
    setFormData({
      ...formData,
      weights: formData.weights.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      price: formData.basePrice
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="text-sm font-black text-stone-900">Chỉnh Sửa Đặc Sản & Cập Nhật Ảnh</h3>
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
              <label className="font-semibold text-stone-600 block mb-1">Danh mục (Tab DANH_MUC)</label>
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

          {/* Cập nhật ảnh Google Drive */}
          <ImageUploadField
            label="Cập nhật ảnh đặc sản (Tải trực tiếp lên Drive hoặc dán URL)"
            value={formData.image}
            uploadUrl={uploadUrl}
            onChange={(newUrl) => setFormData({ ...formData, image: newUrl })}
          />

          {/* Quy cách & Đóng gói */}
          <div className="bg-stone-50/80 p-3.5 rounded-2xl border border-stone-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-700 text-xs">Các quy cách đóng gói (Weights/Combo):</span>
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
                <div key={w.id || index} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Tên quy cách (VD: Thùng 3kg)"
                    value={w.label}
                    onChange={(e) => handleWeightChange(index, 'label', e.target.value)}
                    className="flex-1 p-2 rounded-xl border border-stone-200 bg-white text-xs text-stone-800"
                  />
                  <div className="flex items-center gap-1 w-24">
                    <span className="text-[10px] text-stone-400">Hệ số:</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      value={w.multiplier ?? 1}
                      onChange={(e) => handleWeightChange(index, 'multiplier', e.target.value)}
                      className="w-full p-2 rounded-xl border border-stone-200 bg-white text-xs font-mono font-bold text-center"
                    />
                  </div>
                  {formData.weights.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveWeight(index)}
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg cursor-pointer"
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