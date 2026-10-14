import React, { useState } from 'react';
import { Plus, RotateCcw, Pencil, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import ImageUploadField from './ImageUploadField';

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
    inStock: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newProduct.name.trim() || !newProduct.basePrice) return;
    onAddProduct(newProduct);
    setNewProduct({
      name: '',
      basePrice: '',
      unit: 'kg',
      category: 'fresh',
      badge: 'Đặc sản mới',
      source: 'Vườn nhà Tâm (Phước Hậu)',
      desc: '',
      image: '',
      inStock: true
    });
  };

  return (
    <div className="space-y-6">
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
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-medium text-stone-800"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-600 block mb-1">Phân loại</label>
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-medium text-stone-800"
              >
                <option value="fresh">Trái cây tươi hái tại giàn</option>
                <option value="dried">Đặc sản sấy dẻo thủ công</option>
                <option value="drinks">Rượu nho / Mật nho nguyên chất</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-stone-600 block mb-1">Giá bán cơ bản (VNĐ) *</label>
              <input
                type="number"
                required
                placeholder="VD: 65000"
                value={newProduct.basePrice}
                onChange={(e) => setNewProduct({ ...newProduct, basePrice: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-mono font-bold text-stone-800"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-600 block mb-1">Đơn vị tính</label>
              <input
                type="text"
                placeholder="kg, hộp, chai, túi..."
                value={newProduct.unit}
                onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 font-medium"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-600 block mb-1">Huy hiệu (Badge)</label>
              <input
                type="text"
                placeholder="VD: Bao ngọt từng quả"
                value={newProduct.badge}
                onChange={(e) => setNewProduct({ ...newProduct, badge: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800"
              />
            </div>
          </div>

          <ImageUploadField
            label="Ảnh đặc sản (Tải trực tiếp lên Google Drive hoặc dán URL)"
            value={newProduct.image}
            onChange={(url) => setNewProduct({ ...newProduct, image: url })}
          />

          <div>
            <label className="font-semibold text-stone-600 block mb-1">Mô tả đặc điểm</label>
            <textarea
              rows="2"
              placeholder="Quả mọng, ngọt đậm vị..."
              value={newProduct.desc}
              onChange={(e) => setNewProduct({ ...newProduct, desc: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-700 resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-700">
              <input
                type="checkbox"
                checked={newProduct.inStock}
                onChange={(e) => setNewProduct({ ...newProduct, inStock: e.target.checked })}
                className="w-4 h-4 rounded-md accent-amber-600"
              />
              <span>Đang có sẵn ở vườn (Mở bán ngay)</span>
            </label>

            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
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
          <button
            type="button"
            onClick={onResetProducts}
            className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục mặc định</span>
          </button>
        </div>

        <div className="divide-y divide-stone-100">
          {products.map((p) => (
            <div key={p.id} className="py-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <img 
                  src={p.image || "https://images.unsplash.com/photo-1616684000067-36952fde56ec?auto=format&fit=crop&w=600&q=80"} 
                  alt={p.name} 
                  className="w-12 h-12 rounded-xl object-cover shrink-0 border border-stone-100" 
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900">{p.name}</span>
                    {p.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-stone-500 text-[11px] font-mono block mt-0.5">
                    {p.basePrice?.toLocaleString('vi-VN')}đ / {typeof p.unit === 'object' ? p.unit?.label : p.unit}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEditProduct(p)}
                  className="p-1.5 text-stone-400 hover:text-amber-600 rounded-lg hover:bg-stone-100 transition-colors"
                  title="Chỉnh sửa sản phẩm & cập nhật ảnh"
                >
                  <Pencil className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onToggleStock(p.id)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors ${
                    p.inStock 
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' 
                      : 'bg-stone-100 text-stone-500 hover:bg-stone-200 border border-stone-200'
                  }`}
                >
                  {p.inStock ? (
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
                  className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}