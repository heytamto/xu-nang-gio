// src/components/admin/EditProductModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Plus, 
  Trash2, 
  Star, 
  Layers, 
  Tag, 
  Loader2, 
  Images, 
  Video, 
  Sparkles 
} from 'lucide-react';
import ImageUploadField from '../../ImageUploadField';
import CustomDropdown from '../../CustomDropdown';
import { categoryRepo, productRepo, productWeightRepo } from '../../../repositories';
import { supabase } from '../../../supabaseClient';

const CALC_TYPE_OPTIONS = [
  { value: 'multiplier', label: 'Nhân hệ số (x)' },
  { value: 'fixed', label: 'Giá cố định (VNĐ)' }
];

// Trích xuất videoId YouTube Shorts hoặc URL thông thường
function getYouTubeEmbedId(url) {
  if (!url) return null;
  const regExp = /(?:shorts\/|youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[1].length === 11 ? match[1] : null;
}

export default function EditProductModal({ 
  product, 
  categories: propCategories = [], 
  onClose, 
  onSave, 
  onShowAlert 
}) {
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [extraImageInput, setExtraImageInput] = useState('');

  // 1. Tải danh mục động: Ưu tiên propCategories, nếu trống gọi qua categoryRepo
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
      } catch (e) {
        console.error('Lỗi tải categories trong EditProductModal:', e);
      }
    }
    loadDbCategories();
  }, [propCategories]);

  const [formData, setFormData] = useState(() => {
    const rawWeights = product?.product_weights || product?.weights;
    let initialWeights = [];

    if (Array.isArray(rawWeights) && rawWeights.length > 0) {
      initialWeights = rawWeights.map((w, idx) => {
        const hasPriceOverride = w.price_override !== null && w.price_override !== undefined && w.price_override !== '';
        return {
          id: w.id || `opt_${idx + 1}`,
          weight_key: w.weight_key || w.key || `opt_${idx + 1}`,
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

    // Chuẩn hóa danh sách nhiều ảnh (Multi-images)
    const rawImages = Array.isArray(product?.images) && product.images.length > 0
      ? product.images.filter(Boolean)
      : (typeof product?.images === 'string' && product.images.trim()
          ? product.images.split(/[,|\n]/).map(s => s.trim()).filter(Boolean)
          : []);

    const primaryCover = product?.image_url || product?.image || rawImages[0] || '';
    const secondaryImages = rawImages.filter(img => img !== primaryCover);

    // Chuẩn hóa flavors thành chuỗi để hiển thị trên input
    let initialFlavorsStr = '';
    if (Array.isArray(product?.flavors)) {
      initialFlavorsStr = product.flavors.map(f => (typeof f === 'string' ? f : f?.label)).filter(Boolean).join(', ');
    } else if (typeof product?.flavors === 'string') {
      initialFlavorsStr = product.flavors.split('|').map(s => s.trim()).filter(Boolean).join(', ');
    }

    const currentCat = product?.category || product?.category_id || '';

    return {
      ...product,
      name: product?.name || '',
      category: currentCat,
      unit: typeof product?.unit === 'object' ? (product?.unit?.label || 'kg') : (product?.unit || 'kg'),
      basePrice: Number(product?.basePrice ?? product?.base_price ?? product?.price ?? 0),
      badge: product?.badge || '',
      source: product?.source || 'Vườn nhà Tâm (Phước Hậu)',
      image: primaryCover,
      images: secondaryImages,
      videoUrl: product?.video_url || product?.videoUrl || '',
      flavorsInput: initialFlavorsStr,
      desc: product?.description || product?.desc || '',
      inStock: product?.inStock ?? product?.in_stock ?? true,
      weights: initialWeights
    };
  });

  useEffect(() => {
    if (categories.length > 0 && !formData.category) {
      setFormData((prev) => ({ ...prev, category: categories[0].id }));
    }
  }, [categories, formData.category]);

  if (!product) return null;

  const handleAddExtraImage = (url) => {
    const trimmed = (url || extraImageInput).trim();
    if (!trimmed) return;
    if (!formData.images.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, images: [...prev.images, trimmed] }));
    }
    setExtraImageInput('');
  };

  const handleRemoveExtraImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index)
    }));
  };

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

  // 2. Cập nhật dữ liệu qua productRepo và productWeightRepo
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.basePrice) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const basePriceNum = Number(formData.basePrice) || 0;
      const defaultUnit = (formData.unit || 'kg').trim();
      const resolvedCategory = formData.category || categories[0]?.id || 'fresh';

      // Xử lý bộ ảnh hoàn chỉnh
      const primaryCover = formData.image?.trim() || 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80';
      const allImagesList = Array.from(new Set([primaryCover, ...(formData.images || [])].filter(Boolean)));

      // Xử lý danh sách hương vị
      const parsedFlavors = formData.flavorsInput
        ? formData.flavorsInput.split(/[,|\n]/).map(s => s.trim()).filter(Boolean).map((label, idx) => ({
            id: `flv-${idx + 1}`,
            label,
            priceBonus: 0
          }))
        : [];

      // A. Cập nhật bản ghi chính qua productRepo
      const updateProductPayload = {
        name: formData.name.trim(),
        category: resolvedCategory,
        base_price: basePriceNum,
        unit: defaultUnit,
        badge: formData.badge?.trim() || '',
        source: formData.source?.trim() || '',
        description: formData.desc?.trim() || '',
        image_url: primaryCover,
        images: allImagesList,
        video_url: formData.videoUrl?.trim() || null,
        flavors: parsedFlavors,
        in_stock: Boolean(formData.inStock),
        updated_at: new Date().toISOString()
      };

      const updatedProduct = await productRepo.update(product.id, updateProductPayload);

      // B. Chuẩn hóa và làm mới quy cách
      const formattedWeights = formData.weights
        .filter((w) => w.label.trim())
        .map((w, idx) => ({
          product_id: product.id,
          weight_key: w.weight_key || `opt_${idx + 1}`,
          label: w.label.trim(),
          multiplier: w.calcType === 'multiplier' ? (Number(w.val) || 1) : 1,
          price_override: w.calcType === 'fixed' ? (Number(w.val) || 0) : null,
          is_default: Boolean(w.is_default),
          sort_order: idx
        }));

      const resolvedWeightsPayload = formattedWeights.length > 0 ? formattedWeights : [
        {
          product_id: product.id,
          weight_key: 'std',
          label: `1 ${defaultUnit}`,
          multiplier: 1,
          price_override: null,
          is_default: true,
          sort_order: 0
        }
      ];

      // Dọn toàn bộ quy cách cũ của product_id này
      const { error: delErr } = await supabase
        .from('product_weights')
        .delete()
        .eq('product_id', product.id);

      if (delErr) {
        console.warn('Lỗi dọn quy cách cũ:', delErr);
      }

      // Chèn lại bộ quy cách mới
      let insertedWeights = [];
      try {
        insertedWeights = await Promise.all(
          resolvedWeightsPayload.map((weightItem) => productWeightRepo.create(weightItem))
        );
      } catch (weightsErr) {
        console.warn('Lỗi khi chèn quy cách mới qua repo:', weightsErr);
      }

      // C. Đóng gói sản phẩm hoàn chỉnh để đồng bộ state cha
      const finalWeightsList = (insertedWeights && insertedWeights.length > 0 ? insertedWeights : resolvedWeightsPayload).map((w) => ({
        id: w.weight_key || String(w.id),
        weight_key: w.weight_key,
        label: w.label,
        weight_label: w.label,
        multiplier: Number(w.multiplier) || 1,
        priceOverride: w.price_override != null ? Number(w.price_override) : null,
        price_override: w.price_override != null ? Number(w.price_override) : null,
        isDefault: Boolean(w.is_default)
      }));

      const completedProduct = {
        ...product,
        ...updatedProduct,
        id: product.id,
        name: updateProductPayload.name,
        category: updateProductPayload.category,
        category_id: updateProductPayload.category,
        basePrice: updateProductPayload.base_price,
        base_price: updateProductPayload.base_price,
        price: updateProductPayload.base_price,
        unit: updateProductPayload.unit,
        badge: updateProductPayload.badge,
        source: updateProductPayload.source,
        desc: updateProductPayload.description,
        description: updateProductPayload.description,
        image: primaryCover,
        image_url: primaryCover,
        images: allImagesList,
        video_url: updateProductPayload.video_url,
        videoUrl: updateProductPayload.video_url,
        flavors: parsedFlavors,
        inStock: updateProductPayload.in_stock,
        in_stock: updateProductPayload.in_stock,
        weights: finalWeightsList,
        product_weights: finalWeightsList
      };

      onShowAlert?.(`Đã cập nhật đặc sản "${completedProduct.name}" (#${product.id}) thành công!`);

      if (onSave) {
        onSave(completedProduct);
      }

      onClose();
    } catch (err) {
      console.error('Lỗi cập nhật sản phẩm:', err);
      setErrorMessage(err.message || 'Không thể cập nhật sản phẩm vào cơ sở dữ liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewEmbedId = getYouTubeEmbedId(formData.videoUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-950/75 backdrop-blur-xs animate-fadeIn font-sans text-stone-800">
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

        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold rounded-2xl">
            {errorMessage}
          </div>
        )}

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

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 sm:gap-4">
            <div className="sm:col-span-6">
              <CustomDropdown
                label="Danh mục *"
                headerLabel="DANH MỤC TRONG CƠ SỞ DỮ LIỆU:"
                icon={Tag}
                options={categories}
                value={formData.category}
                onChange={(newCatId) => setFormData({ ...formData, category: newCatId })}
                searchable={true}
                searchPlaceholder="Gõ tìm danh mục..."
                renderSelected={(opt) => (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 truncate">
                      {opt?.name || opt?.label}
                    </span>
                    {opt?.id && (
                      <span className="text-xs font-mono text-stone-400 shrink-0">
                        ({opt.id})
                      </span>
                    )}
                  </div>
                )}
                renderOption={(opt, isSelected) => (
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">{opt.name || opt.label}</span>
                    <span className={`text-xs font-mono font-bold ${isSelected ? 'text-amber-900' : 'text-stone-400'}`}>
                      ({opt.id})
                    </span>
                  </div>
                )}
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

          {/* Tùy chọn Hương vị */}
          <div>
            <label className="font-bold text-stone-700 block mb-1.5">
              Tùy chọn hương vị (Nếu có, cách nhau bởi dấu phẩy)
            </label>
            <input
              type="text"
              placeholder="VD: Nguyên bản, Vị tỏi ớt, Ít ngọt..."
              value={formData.flavorsInput}
              onChange={(e) => setFormData({ ...formData, flavorsInput: e.target.value })}
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
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
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
                    onClick={() => setFormData({ ...formData, videoUrl: '' })}
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
            label="Cập nhật ảnh bìa chính (Cover Image)"
            value={formData.image}
            bucket="products"
            onChange={(newUrl) => setFormData({ ...formData, image: newUrl })}
          />

          {/* Bộ sưu tập nhiều ảnh (Multi-images Gallery) */}
          <div className="p-4 sm:p-5 bg-stone-50/90 rounded-3xl border border-stone-200 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-stone-900 text-xs sm:text-sm">
                <Images className="w-4 h-4 text-amber-700" />
                <span>Bộ ảnh đa góc chụp (Hover & Chi tiết sản phẩm)</span>
              </div>
              <span className="text-xs text-stone-500 font-medium font-mono">
                {formData.images.length} ảnh phụ
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

            {formData.images.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 pt-1">
                {formData.images.map((imgUrl, i) => (
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
                const basePriceNum = Number(formData.basePrice) || 0;
                const isMultiplier = w.calcType === 'multiplier';
                const rowValNum = Number(w.val) || 0;

                const calculatedPrice = isMultiplier
                  ? basePriceNum * rowValNum
                  : rowValNum;

                return (
                  <div 
                    key={w.id || index} 
                    className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs hover:border-amber-300 transition-all"
                  >
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

                    {/* Tên quy cách */}
                    <div className="flex-1 min-w-[180px]">
                      <input
                        type="text"
                        placeholder="Tên quy cách (VD: Thùng 10kg Đại Gia Đình...)"
                        value={w.label}
                        onChange={(e) => handleUpdateWeightRow(index, 'label', e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-stone-200 text-xs sm:text-sm font-semibold text-stone-900 focus:outline-none focus:border-amber-600 bg-stone-50/40 focus:bg-white shadow-2xs transition-colors"
                      />
                    </div>

                    {/* Loại định giá (w-48 tránh bị cụt text) */}
                    <div className="w-48 shrink-0">
                      <CustomDropdown
                        options={CALC_TYPE_OPTIONS}
                        value={w.calcType}
                        onChange={(val) => handleUpdateWeightRow(index, 'calcType', val)}
                        searchable={false}
                      />
                    </div>

                    {/* Giá trị số */}
                    <div className="w-24 sm:w-28 shrink-0">
                      <input
                        type="number"
                        step={isMultiplier ? '0.1' : '1000'}
                        min="0"
                        placeholder={isMultiplier ? 'Hệ số (x)' : 'Số tiền'}
                        value={w.val ?? ''}
                        onChange={(e) => handleUpdateWeightRow(index, 'val', e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-stone-200 font-mono font-bold text-amber-950 text-xs sm:text-sm focus:outline-none focus:border-amber-600 text-right bg-stone-50/40 focus:bg-white shadow-2xs transition-colors"
                      />
                    </div>

                    {/* Ô tổng tiền */}
                    <div className="hidden sm:flex h-11 px-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 font-mono font-black text-xs sm:text-sm items-center justify-center shrink-0 min-w-[110px] shadow-2xs">
                      {calculatedPrice.toLocaleString('vi-VN')}đ
                    </div>

                    {/* Xóa dòng */}
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
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Lưu Thay Đổi Sản Phẩm</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}