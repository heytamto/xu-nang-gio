// src/components/admin/ProductsTab.jsx
import React, { useState } from 'react';
import { Plus, RotateCcw, Pencil, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import ImageUploadField from './ImageUploadField';

const PRODUCT_CATEGORIES = [
  { id: 'fresh', label: 'Trái Cây Tươi Hái Giàn' },
  { id: 'nem-cha', label: 'Nem Chua & Chả Truyền Thống' },
  { id: 'seafood', label: 'Hải Sản & Đồ Khô Cà Ná' },
  { id: 'condiments', label: 'Mật Nho, Rượu & Gia Vị' },
  { id: 'dried', label: 'Đặc Sản Phơi Nắng & Sấy Dẻo' }
];

export default function ProductsTab({
  products = [],
  onAddProduct,
  onEditProduct,
  onToggleStock,
  onDeleteProduct,
  onResetProducts
}) {
  const [newProduct, setNewProduct] = useState({
    name: '',
    basePrice: '',
    unit: 'kg',
    category: 'fresh',
    badge: 'Đặc sản mới',
    source: 'Vườn nhà Tâm (Phước Hậu)',
    desc: '',
    image: '',
    inStock: true,
    weightsText: 'Thùng 2kg (Ăn thử):2\nThùng 5kg (Tiết kiệm):4.8'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newProduct.name.trim() || !newProduct.basePrice) return;

    const basePriceNum = Number(newProduct.basePrice) || 0;

    // Phân tích weightsText thành cấu trúc bảng product_weights chuẩn
    const parsedWeights = newProduct.weightsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, idx) => {
        // Hỗ trợ cú pháp "Tên quy cách:Hệ số" hoặc "Tên:Hệ số:Giá_override"
        const [label, mult, priceOverride] = line.split(':');
        return {
          id: `opt-${idx + 1}`,
          weight_key: `opt_${idx + 1}`,
          label: label?.trim() || 'Tiêu chuẩn',
          multiplier: parseFloat(mult) || 1,
          price_override: priceOverride ? Number(priceOverride) : null,
          is_default: idx === 0,
          sort_order: idx
        };
      });

    const finalWeights = parsedWeights.length > 0 ? parsedWeights : [
      { 
        id: 'opt-1', 
        weight_key: 'std',
        label: `1 ${newProduct.unit || 'kg'}`, 
        multiplier: 1, 
        price_override: null,
        is_default: true,
        sort_order: 0 
      }
    ];

    const payload = {
      name: newProduct.name.trim(),
      basePrice: basePriceNum,
      base_price: basePriceNum,
      price: basePriceNum,
      unit: newProduct.unit.trim() || 'kg',
      category: newProduct.category,
      badge: newProduct.badge.trim(),
      source: newProduct.source.trim(),
      desc: newProduct.desc.trim(),
      description: newProduct.desc.trim(),
      image: newProduct.image.trim() || 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
      image_url: newProduct.image.trim() || 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
      inStock: newProduct.inStock,
      in_stock: newProduct.inStock,
      weights: finalWeights,
      product_weights: finalWeights
    };

    onAddProduct(payload);

    setNewProduct({
      name: '',
      basePrice: '',
      unit: 'kg',
      category: 'fresh',
      badge: 'Đặc sản mới',
      source: 'Vườn nhà Tâm (Phước Hậu)',
      desc: '',
      image: '',
      inStock: true,
      weightsText: 'Thùng 2kg (Ăn thử):2\nThùng 5kg (Tiết kiệm):4.8'
    });
  };

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      {/* Form thêm đặc sản */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
          <Plus className="w-4 h-4 text-amber-600" />
          <span>Thêm Đặc Sản Mới Lên Kệ</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="font-semibold text-stone-600 block mb-1">Tên đặc sản *</label>
              <input
                type="text"
                required
                placeholder="VD: Nho Xanh Ninh Thuận (NH01-48)"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-medium text-stone-800 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-600 block mb-1">Danh mục phân loại *</label>
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-medium text-stone-800 cursor-pointer focus:outline-none focus:border-amber-600"
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-stone-600 block mb-1">Giá bán cơ bản (VNĐ) *</label>
              <input
                type="number"
                required
                min="0"
                step="1000"
                placeholder="VD: 65000"
                value={newProduct.basePrice}
                onChange={(e) => setNewProduct({ ...newProduct, basePrice: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-mono font-bold text-amber-900 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-600 block mb-1">Đơn vị tính</label>
              <input
                type="text"
                placeholder="kg, hộp, chai, túi, đòn..."
                value={newProduct.unit}
                onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 font-medium focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-600 block mb-1">Huy hiệu (Badge)</label>
              <input
                type="text"
                placeholder="VD: Bao ngọt giàn, Hái sáng sớm"
                value={newProduct.badge}
                onChange={(e) => setNewProduct({ ...newProduct, badge: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="font-semibold text-stone-600 block mb-1">Nguồn gốc / Xuất xứ</label>
              <input
                type="text"
                placeholder="VD: Vườn nhà Tâm (Phước Hậu, Ninh Phước) hoặc Cảng cá Cà Ná"
                value={newProduct.source}
                onChange={(e) => setNewProduct({ ...newProduct, source: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-600 block mb-1">Tình trạng kho</label>
              <select
                value={newProduct.inStock ? 'true' : 'false'}
                onChange={(e) => setNewProduct({ ...newProduct, inStock: e.target.value === 'true' })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-medium text-stone-800 cursor-pointer focus:outline-none focus:border-amber-600"
              >
                <option value="true">Đang có sẵn ở vườn (Đang bán)</option>
                <option value="false">Tạm hết lứa</option>
              </select>
            </div>
          </div>

          {/* Tải ảnh đặc sản lên Supabase Storage bucket products */}
          <ImageUploadField
            label="Ảnh đặc sản (Supabase Storage)"
            value={newProduct.image}
            bucket="products"
            onChange={(url) => setNewProduct({ ...newProduct, image: url })}
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-stone-600">Quy cách đóng gói & Hệ số giá (Mỗi dòng 1 loại)</label>
              <span className="text-[10px] text-stone-400 font-mono">Cú pháp: Tên quy cách:Hệ số</span>
            </div>
            <textarea
              rows="2"
              placeholder={"Thùng 2kg (Ăn thử):2\nThùng 5kg (Tiết kiệm):4.8"}
              value={newProduct.weightsText}
              onChange={(e) => setNewProduct({ ...newProduct, weightsText: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-mono text-[11px] text-stone-700 resize-none focus:outline-none focus:border-amber-600 leading-relaxed"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-600 block mb-1">Mô tả đặc điểm</label>
            <textarea
              rows="2"
              placeholder="Quả mọng, ngọt đậm vị thanh mát tự nhiên..."
              value={newProduct.desc}
              onChange={(e) => setNewProduct({ ...newProduct, desc: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-700 resize-none focus:outline-none focus:border-amber-600 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Đăng Sản Phẩm Mới</span>
            </button>
          </div>
        </form>
      </div>

      {/* Danh sách đặc sản */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-stone-900">Danh Sách Đặc Sản ({products.length})</h2>
            <p className="text-xs text-stone-500">Chỉnh sửa thông tin, giá, đổi ảnh hoặc bật/tắt bán</p>
          </div>
          {onResetProducts && (
            <button
              type="button"
              onClick={onResetProducts}
              className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục mặc định</span>
            </button>
          )}
        </div>

        {products.length === 0 ? (
          <div className="py-10 text-center text-stone-400 text-xs italic">
            Chưa có sản phẩm nào trên kệ.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {products.map((p) => {
              const currentCat = PRODUCT_CATEGORIES.find((c) => c.id === p.category);
              const isAvailable = p.inStock ?? p.in_stock ?? true;
              const productImg = p.image_url || p.image || "https://images.unsplash.com/photo-1616684000067-36952fde56ec?auto=format&fit=crop&w=600&q=80";
              const priceVal = Number(p.basePrice ?? p.base_price ?? p.price ?? 0);

              return (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={productImg} 
                      alt={p.name} 
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-stone-100 shadow-2xs" 
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1616684000067-36952fde56ec?auto=format&fit=crop&w=600&q=80";
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-stone-900 truncate">{p.name}</span>
                        {p.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold shrink-0">
                            {p.badge}
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium shrink-0">
                          {currentCat?.label || p.category}
                        </span>
                      </div>
                      <span className="text-stone-500 text-[11px] font-mono block mt-0.5">
                        {priceVal.toLocaleString('vi-VN')}đ / {typeof p.unit === 'object' ? p.unit?.label : (p.unit || 'kg')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditProduct(p)}
                      className="p-1.5 text-stone-400 hover:text-amber-600 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Chỉnh sửa sản phẩm & cập nhật ảnh"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleStock(p.id)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
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
                      onClick={() => onDeleteProduct(p.id, p.name)}
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
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