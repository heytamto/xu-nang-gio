// src/components/admin/product/ProductsTab.jsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  RotateCcw, 
  Pencil, 
  ToggleLeft, 
  ToggleRight, 
  Trash2, 
  Layers, 
  Tag,
  Loader2,
  ShoppingBag,
  FolderTree,
  Sparkles,
  Images,
  Video,
  X
} from 'lucide-react';
import ImageUploadField from '../../ImageUploadField';
import CustomDropdown from '../../CustomDropdown';
import CategoryConfigSection from './CategoryConfigSection';
import { productRepo, productWeightRepo, categoryRepo } from '../../../repositories';

const CALC_TYPE_OPTIONS = [
  { value: 'multiplier', label: 'Nhân hệ số (x)' },
  { value: 'fixed', label: 'Giá cố định (VNĐ)' }
];

const STOCK_STATUS_OPTIONS = [
  {
    value: true,
    label: 'Đang có sẵn ở vườn',
    subLabel: 'Còn lứa hái, đang mở bán',
    dotClass: 'bg-emerald-500'
  },
  {
    value: false,
    label: 'Tạm hết lứa',
    subLabel: 'Chờ đợt thu hoạch kế tiếp',
    dotClass: 'bg-stone-400'
  }
];

// Trích xuất videoId YouTube Shorts hoặc URL thông thường
function getYouTubeEmbedId(url) {
  if (!url) return null;
  const regExp = /(?:shorts\/|youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[1].length === 11 ? match[1] : null;
}

export default function ProductsTab({
  products = [],
  categories: propCategories = [],
  onAddProduct,
  onEditProduct,
  onToggleStock,
  onDeleteProduct,
  onResetProducts,
  onShowAlert,
  setConfirmModalConfig
}) {
  const [activeSubTab, setActiveSubTab] = useState('products');
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // 1. Tải danh mục động qua categoryRepo hoặc props
  useEffect(() => {
    if (Array.isArray(propCategories) && propCategories.length > 0) {
      setCategories(
        propCategories
          .filter((c) => c.id !== 'all')
          .map((c) => ({ id: c.id, label: c.name || c.label, name: c.name || c.label }))
      );
      return;
    }

    async function loadDbCategories() {
      try {
        const data = await categoryRepo.getAll();
        if (Array.isArray(data) && data.length > 0) {
          const sorted = data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          setCategories(
            sorted
              .filter((c) => c.id !== 'all')
              .map((c) => ({ id: c.id, label: c.name, name: c.name }))
          );
        }
      } catch (err) {
        console.error('Lỗi tải categories qua repo:', err);
      }
    }
    loadDbCategories();
  }, [propCategories]);

  const [newProduct, setNewProduct] = useState({
    name: '',
    basePrice: '',
    unit: 'kg',
    category: '',
    badge: 'Đặc sản mới',
    source: 'Vườn nhà Tâm (Phước Hậu)',
    desc: '',
    image: '',
    images: [],
    videoUrl: '',
    flavorsInput: '',
    inStock: true,
  });

  const [extraImageInput, setExtraImageInput] = useState('');

  useEffect(() => {
    if (categories.length > 0 && !newProduct.category) {
      setNewProduct((prev) => ({ ...prev, category: categories[0].id }));
    }
  }, [categories, newProduct.category]);

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

  const handleAddExtraImage = (url) => {
    const trimmed = (url || extraImageInput).trim();
    if (!trimmed) return;
    if (!newProduct.images.includes(trimmed)) {
      setNewProduct((prev) => ({ ...prev, images: [...prev.images, trimmed] }));
    }
    setExtraImageInput('');
  };

  const handleRemoveExtraImage = (index) => {
    setNewProduct((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index)
    }));
  };

  const handleTriggerDelete = async (productId, productName) => {
    if (!onDeleteProduct) return;
    try {
      setDeletingId(productId);
      await onDeleteProduct(productId, productName);
    } catch (err) {
      console.error('Lỗi xóa sản phẩm:', err);
      onShowAlert?.(err.message || 'Lỗi khi xóa sản phẩm.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newProduct.name.trim() || !newProduct.basePrice) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      const basePriceNum = Number(newProduct.basePrice) || 0;
      const defaultUnitLabel = newProduct.unit.trim() || 'kg';
      const categoryToSave = newProduct.category || (categories[0]?.id || 'fresh');
      const generatedProductId = `prd_${Date.now()}`;

      // Xử lý bộ ảnh
      const primaryCover = newProduct.image.trim() || 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80';
      const allImagesList = Array.from(new Set([primaryCover, ...newProduct.images].filter(Boolean)));

      // Xử lý danh sách hương vị
      const parsedFlavors = newProduct.flavorsInput
        ? newProduct.flavorsInput.split(/[,|\n]/).map(s => s.trim()).filter(Boolean).map((label, idx) => ({
            id: `flv-${idx + 1}`,
            label,
            priceBonus: 0
          }))
        : [];

      const productInsertPayload = {
        id: generatedProductId,
        name: newProduct.name.trim(),
        base_price: basePriceNum,
        unit: defaultUnitLabel,
        category: categoryToSave,
        badge: newProduct.badge.trim(),
        source: newProduct.source.trim(),
        description: newProduct.desc.trim(),
        image_url: primaryCover,
        images: allImagesList,
        video_url: newProduct.videoUrl.trim() || null,
        flavors: parsedFlavors,
        in_stock: newProduct.inStock
      };

      const insertedProduct = await productRepo.create(productInsertPayload);

      const finalWeights = weightsList
        .filter((w) => w.label.trim())
        .map((w, idx) => {
          const isMultiplier = w.calcType === 'multiplier';
          const numVal = Number(w.value) || 0;

          return {
            product_id: insertedProduct.id,
            weight_key: `opt_${idx + 1}`,
            label: w.label.trim(),
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
          label: `1 ${defaultUnitLabel}`,
          multiplier: 1,
          price_override: null,
          is_default: true,
          sort_order: 0
        }
      ];

      let insertedWeights = [];
      try {
        insertedWeights = await Promise.all(
          resolvedWeightsPayload.map((item) => productWeightRepo.create(item))
        );
      } catch (weightErr) {
        console.warn('Lỗi ghi product_weights qua repo:', weightErr);
      }

      const resolvedWeightsForState = (insertedWeights && insertedWeights.length > 0 ? insertedWeights : resolvedWeightsPayload).map(w => ({
        ...w,
        id: w.weight_key || String(w.id),
        weight_label: w.label
      }));

      const completedProduct = {
        ...insertedProduct,
        id: insertedProduct.id,
        category_id: insertedProduct.category,
        category: insertedProduct.category,
        basePrice: insertedProduct.base_price,
        image: primaryCover,
        image_url: primaryCover,
        images: allImagesList,
        video_url: insertedProduct.video_url,
        videoUrl: insertedProduct.video_url,
        flavors: parsedFlavors,
        inStock: insertedProduct.in_stock,
        desc: insertedProduct.description,
        weights: resolvedWeightsForState,
        product_weights: resolvedWeightsForState
      };

      if (onAddProduct) onAddProduct(completedProduct);
      onShowAlert?.(`Đã thêm đặc sản "${completedProduct.name}" lên kệ (#${completedProduct.id})!`);

      // Reset form
      setNewProduct({
        name: '',
        basePrice: '',
        unit: 'kg',
        category: categories[0]?.id || '',
        badge: 'Đặc sản mới',
        source: 'Vườn nhà Tâm (Phước Hậu)',
        desc: '',
        image: '',
        images: [],
        videoUrl: '',
        flavorsInput: '',
        inStock: true,
      });
      setExtraImageInput('');

      setWeightsList([
        { label: 'Thùng 2kg (Ăn thử)', calcType: 'multiplier', value: 2 },
        { label: 'Thùng 5kg (Tiết kiệm)', calcType: 'fixed', value: 299000 }
      ]);
    } catch (err) {
      console.error('Lỗi lưu sản phẩm:', err);
      setFormError(err.message || 'Lỗi khi lưu vào cơ sở dữ liệu.');
      onShowAlert?.('Lỗi thêm sản phẩm: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewEmbedId = getYouTubeEmbedId(newProduct.videoUrl);

  return (
    <div className="space-y-6 sm:space-y-7 font-sans animate-fadeIn text-stone-800">
      {/* 1. THANH CHUYỂN SUB-TAB */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-3xl border border-stone-200/90 shadow-xs">
        <div className="inline-flex p-1 bg-stone-100 rounded-2xl border border-stone-200/60">
          <button
            type="button"
            onClick={() => setActiveSubTab('products')}
            className={`h-10 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'products'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Kệ Hàng ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('categories')}
            className={`h-10 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'categories'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <FolderTree className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Danh Mục Phân Loại ({categories.length})</span>
          </button>
        </div>

        {activeSubTab === 'products' && onResetProducts && (
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

      {activeSubTab === 'categories' ? (
        <CategoryConfigSection 
          onShowAlert={onShowAlert} 
          setConfirmModalConfig={setConfirmModalConfig} 
        />
      ) : (
        <>
          {/* Form thêm đặc sản */}
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
                  <CustomDropdown
                    label="Danh mục phân loại *"
                    headerLabel="DANH MỤC TRONG CƠ SỞ DỮ LIỆU:"
                    icon={Tag}
                    options={categories}
                    value={newProduct.category}
                    onChange={(newCatId) => setNewProduct({ ...newProduct, category: newCatId })}
                    searchable={true}
                    searchPlaceholder="Tìm danh mục..."
                    renderSelected={(opt) => (
                      <span className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{opt?.name || opt?.label}</span>
                        <span className="text-xs font-mono text-stone-400 font-normal">({opt?.id})</span>
                      </span>
                    )}
                    renderOption={(opt, isSelected) => (
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold">{opt.name || opt.label}</span>
                        <span className={`text-xs font-mono font-bold ${isSelected ? 'text-amber-900' : 'text-stone-400'}`}>
                          {opt.id}
                        </span>
                      </div>
                    )}
                  />
                </div>
              </div>

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
                  <CustomDropdown
                    label="Tình trạng kho"
                    headerLabel="TRẠNG THÁI MỞ BÁN:"
                    options={STOCK_STATUS_OPTIONS}
                    value={newProduct.inStock}
                    onChange={(newStockVal) => setNewProduct({ ...newProduct, inStock: newStockVal })}
                    searchable={false}
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

              {/* Tùy chọn Hương vị */}
              <div>
                <label className="font-bold text-stone-700 block mb-1.5">
                  Tùy chọn hương vị (Nếu có, cách nhau bởi dấu phẩy)
                </label>
                <input
                  type="text"
                  placeholder="VD: Nguyên bản, Vị tỏi ớt, Ít ngọt..."
                  value={newProduct.flavorsInput}
                  onChange={(e) => setNewProduct({ ...newProduct, flavorsInput: e.target.value })}
                  className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-medium focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
                />
              </div>

              {/* Video thực tế YouTube Shorts */}
              <div className="p-4 sm:p-5 bg-amber-50/50 rounded-3xl border border-amber-200/80 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-bold text-stone-900 text-xs sm:text-sm">
                    <Video className="w-4 h-4 text-amber-700" />
                    <span>Video thực tế nông sản (YouTube Shorts / Clip dọc 9:16)</span>
                  </label>
                  <span className="text-[11px] font-medium text-amber-900/70 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    Tùy chọn
                  </span>
                </div>
                
                <input
                  type="url"
                  placeholder="VD: https://www.youtube.com/shorts/dQw4w9WgXcQ hoặc https://youtu.be/..."
                  value={newProduct.videoUrl}
                  onChange={(e) => setNewProduct({ ...newProduct, videoUrl: e.target.value })}
                  className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-white font-medium text-stone-900 focus:outline-none focus:border-amber-600 shadow-2xs transition-colors text-xs sm:text-sm"
                />

                {previewEmbedId && (
                  <div className="pt-2 flex items-center gap-3">
                    <div className="w-16 h-24 rounded-xl overflow-hidden bg-black shrink-0 border border-stone-300 shadow-xs">
                      <iframe
                        src={`https://www.youtube.com/embed/${previewEmbedId}?controls=0&mute=1`}
                        title="Preview Shorts"
                        className="w-full h-full border-0 pointer-events-none"
                      />
                    </div>
                    <div className="text-xs space-y-0.5">
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Đã nhận diện link Shorts hợp lệ</span>
                      </span>
                      <p className="text-stone-500 font-mono">ID: {previewEmbedId}</p>
                      <button
                        type="button"
                        onClick={() => setNewProduct({ ...newProduct, videoUrl: '' })}
                        className="text-rose-600 hover:text-rose-700 font-semibold cursor-pointer underline text-[11px]"
                      >
                        Xóa video
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Ảnh bìa chính */}
              <ImageUploadField
                label="Ảnh bìa chính (Cover Image)"
                value={newProduct.image}
                bucket="products"
                onChange={(url) => setNewProduct({ ...newProduct, image: url })}
              />

              {/* Bộ sưu tập nhiều ảnh (Multi-images Gallery) */}
              <div className="p-4 sm:p-5 bg-stone-50/90 rounded-3xl border border-stone-200 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-stone-900 text-xs sm:text-sm">
                    <Images className="w-4 h-4 text-amber-700" />
                    <span>Bộ ảnh đa góc chụp (Hover & Chi tiết sản phẩm)</span>
                  </div>
                  <span className="text-xs text-stone-500 font-medium font-mono">
                    {newProduct.images.length} ảnh phụ
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Dán URL ảnh phụ (https://...)"
                    value={extraImageInput}
                    onChange={(e) => setExtraImageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddExtraImage();
                      }
                    }}
                    className="flex-1 h-10 px-3.5 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium bg-white focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddExtraImage()}
                    className="h-10 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm ảnh</span>
                  </button>
                </div>

                {newProduct.images.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 pt-1">
                    {newProduct.images.map((imgUrl, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-stone-200 bg-white group shadow-2xs">
                        <img src={imgUrl} alt={`Ảnh phụ ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveExtraImage(i)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                          title="Gỡ ảnh này"
                        >
                          <X className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quy cách đóng gói & Cơ chế định giá */}
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
                    const basePriceNum = Number(newProduct.basePrice) || 0;
                    const isMultiplier = row.calcType === 'multiplier';
                    const rowValNum = Number(row.value) || 0;

                    // Tính tổng tiền hiển thị
                    const calculatedPrice = isMultiplier
                      ? basePriceNum * rowValNum
                      : rowValNum;

                    return (
                      <div 
                        key={idx} 
                        className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs hover:border-amber-300 transition-all"
                      >
                        {/* 1. Tên quy cách */}
                        <div className="flex-1 min-w-[180px]">
                          <input
                            type="text"
                            placeholder="Tên quy cách (VD: Thùng 5kg...)"
                            value={row.label}
                            onChange={(e) => handleUpdateWeightRow(idx, 'label', e.target.value)}
                            className="w-full h-11 px-4 border border-stone-200 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 focus:outline-none focus:border-amber-600 bg-stone-50/40 focus:bg-white transition-colors shadow-2xs"
                          />
                        </div>

                        {/* 2. Loại định giá - Chiều rộng w-48 đảm bảo hiển thị đủ chữ "Giá cố định (VNĐ)" */}
                        <div className="w-48 shrink-0">
                          <CustomDropdown
                            options={CALC_TYPE_OPTIONS}
                            value={row.calcType}
                            onChange={(val) => handleUpdateWeightRow(idx, 'calcType', val)}
                            searchable={false}
                          />
                        </div>

                        {/* 3. Giá trị nhập vào (Hệ số hoặc Giá tiền) */}
                        <div className="w-24 sm:w-28 shrink-0">
                          <input
                            type="number"
                            step={isMultiplier ? '0.1' : '1000'}
                            min="0"
                            placeholder={isMultiplier ? 'Hệ số (x)' : 'Số tiền'}
                            value={row.value}
                            onChange={(e) => handleUpdateWeightRow(idx, 'value', e.target.value)}
                            className="w-full h-11 px-3 border border-stone-200 rounded-xl font-mono font-bold text-amber-950 text-xs sm:text-sm focus:outline-none focus:border-amber-600 transition-colors text-right bg-stone-50/40 focus:bg-white shadow-2xs"
                          />
                        </div>

                        {/* 4. Ô hiển thị số tiền tổng đầy đủ */}
                        <div className="hidden sm:flex h-11 px-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 font-mono font-black text-xs sm:text-sm items-center justify-center shrink-0 min-w-[110px] shadow-2xs">
                          {calculatedPrice.toLocaleString('vi-VN')}đ
                        </div>

                        {/* 5. Nút xóa */}
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

          {/* Danh sách đặc sản trên kệ */}
          <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-7 space-y-5 shadow-xs">
            <div className="border-b border-stone-100 pb-3.5">
              <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                Danh Sách Đặc Sản ({products.length})
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 font-medium mt-0.5">
                Chỉnh sửa thông tin, giá, đổi ảnh hoặc bật/tắt bán
              </p>
            </div>

            {products.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs sm:text-sm italic font-medium">
                Chưa có sản phẩm nào trên kệ.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {products.map((p) => {
                  const catKey = p.category || p.category_id;
                  const currentCat = categories.find((c) => c.id === catKey);
                  const isAvailable = p.inStock ?? p.in_stock ?? true;
                  const productImg = p.image_url || p.image || "https://images.unsplash.com/photo-1616684000067-36952fde56ec?auto=format&fit=crop&w=600&q=80";
                  const priceVal = Number(p.basePrice ?? p.base_price ?? p.price ?? 0);
                  const isItemDeleting = deletingId === p.id;
                  const hasMultiImgs = Array.isArray(p.images) && p.images.length > 1;
                  const hasVideo = Boolean(p.video_url || p.videoUrl);

                  return (
                    <div key={p.id} className="py-4 flex items-center justify-between gap-4 text-xs sm:text-sm">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative shrink-0">
                          <img 
                            src={productImg} 
                            alt={p.name || p.title} 
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-stone-200 shadow-2xs bg-stone-100" 
                            onError={(e) => {
                              e.currentTarget.src = "https://images.unsplash.com/photo-1616684000067-36952fde56ec?auto=format&fit=crop&w=600&q=80";
                            }}
                          />
                          <div className="absolute bottom-1 right-1 flex items-center gap-1">
                            {hasVideo && (
                              <span className="bg-amber-600/90 text-white p-0.5 rounded-md shadow-xs" title="Có video Shorts">
                                <Video className="w-3 h-3" />
                              </span>
                            )}
                            {hasMultiImgs && (
                              <span className="bg-black/70 backdrop-blur-xs text-white text-[9px] font-black px-1.5 py-0.2 rounded-md">
                                {p.images.length}
                              </span>
                            )}
                          </div>
                        </div>

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
                              {currentCat?.name || currentCat?.label || catKey}
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
                          disabled={isItemDeleting}
                          onClick={() => handleTriggerDelete(p.id, p.name || p.title)}
                          className="p-2 text-stone-400 hover:text-red-600 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer disabled:opacity-50"
                          title="Xóa đặc sản"
                        >
                          {isItemDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}