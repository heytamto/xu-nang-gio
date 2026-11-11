// src/components/shop/ProductDetailModal.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, ChevronLeft, ChevronRight, Maximize2, Minimize2, 
  ShoppingBag, Check, MapPin, Gift, ShieldCheck, Sparkles, Plus, Minus,
  Video, Images as ImageIcon, ExternalLink
} from 'lucide-react';

// Hàm bóc tách ID YouTube Shorts / Video
function getYouTubeEmbedId(url) {
  if (!url) return null;
  const regExp = /(?:shorts\/|youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[1].length === 11 ? match[1] : null;
}

export default function ProductDetailModal({
  product = null,
  isOpen = false,
  onClose,
  onAddToCart
}) {
  // 1. Chuẩn hóa danh sách ảnh
  const imagesList = useMemo(() => {
    const fallback = "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80";
    if (Array.isArray(product?.images) && product.images.length > 0) {
      return product.images.filter(Boolean);
    }
    if (typeof product?.images === 'string' && product.images.trim()) {
      return product.images.split(/[,|\n]/).map(s => s.trim()).filter(Boolean);
    }
    const single = product?.image || product?.image_url;
    return single ? [single] : [fallback];
  }, [product?.images, product?.image, product?.image_url]);

  // 2. Chuẩn hóa weights
  const weightsList = useMemo(() => {
    const rawWeights = product?.product_weights || product?.weights;
    if (Array.isArray(rawWeights) && rawWeights.length > 0) {
      return rawWeights.map((w, idx) => ({
        id: w.id || `opt-${idx + 1}`,
        label: w.weight_label || w.label || w.unit || 'Tiêu chuẩn',
        multiplier: parseFloat(w.multiplier) || 1,
        priceOverride: w.price_override != null && w.price_override !== '' ? Number(w.price_override) : null,
        isDefault: Boolean(w.is_default)
      }));
    }
    if (typeof rawWeights === 'string' && rawWeights.trim()) {
      return rawWeights.split('|').map((part, idx) => {
        const [label, mult] = part.split(':');
        return {
          id: `opt-${idx + 1}`,
          label: label?.trim() || 'Tiêu chuẩn',
          multiplier: parseFloat(mult) || 1,
          priceOverride: null,
          isDefault: idx === 0
        };
      });
    }
    return [{ id: 'std', label: product?.unit || product?.weight_label || 'Tiêu chuẩn', multiplier: 1, priceOverride: null, isDefault: true }];
  }, [product?.product_weights, product?.weights, product?.unit, product?.weight_label]);

  // 3. Chuẩn hóa flavors
  const flavorsList = useMemo(() => {
    if (Array.isArray(product?.flavors)) return product.flavors;
    if (typeof product?.flavors === 'string' && product.flavors.trim()) {
      return product.flavors.split('|').map((item, idx) => ({
        id: `flv-${idx + 1}`,
        label: item.trim(),
        priceBonus: 0
      }));
    }
    return [];
  }, [product?.flavors]);

  // 4. Nhận diện video Shorts
  const rawVideoUrl = product?.video_url || product?.videoUrl;
  const youtubeVideoId = useMemo(() => getYouTubeEmbedId(rawVideoUrl), [rawVideoUrl]);

  // States nội bộ
  const [mediaTab, setMediaTab] = useState('gallery'); // 'gallery' | 'video'
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedWeight, setSelectedWeight] = useState(null);
  const [selectedFlavor, setSelectedFlavor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isJustAdded, setIsJustAdded] = useState(false);

  // Đồng bộ state khi mở modal sản phẩm mới
  useEffect(() => {
    if (isOpen && product) {
      setMediaTab('gallery');
      setActiveImgIndex(0);
      setIsLightboxOpen(false);
      setQuantity(1);
      setSelectedWeight(weightsList.find(w => w.isDefault) || weightsList[0] || null);
      setSelectedFlavor(flavorsList[0] || null);
    }
  }, [isOpen, product, weightsList, flavorsList]);

  // Phím tắt bàn phím (ESC đóng modal, Trái/Phải đổi ảnh)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isLightboxOpen) setIsLightboxOpen(false);
        else onClose();
      } else if (mediaTab === 'gallery') {
        if (e.key === 'ArrowRight') {
          nextImage();
        } else if (e.key === 'ArrowLeft') {
          prevImage();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLightboxOpen, mediaTab, imagesList.length]);

  if (!isOpen || !product) return null;

  const nextImage = () => {
    setActiveImgIndex((prev) => (prev + 1) % imagesList.length);
  };

  const prevImage = () => {
    setActiveImgIndex((prev) => (prev - 1 + imagesList.length) % imagesList.length);
  };

  // Tính giá
  const isOutOfStock = product?.inStock === false || product?.in_stock === false;
  const activeWeight = selectedWeight || weightsList[0] || { id: 'std', label: 'Tiêu chuẩn', multiplier: 1 };
  const basePrice = Number(product?.basePrice ?? product?.base_price ?? product?.price ?? 0);
  const multiplier = Number(activeWeight.multiplier) || 1;
  const priceBonus = selectedFlavor?.priceBonus || 0;

  const unitPrice = activeWeight.priceOverride != null && activeWeight.priceOverride > 0
    ? (activeWeight.priceOverride < 10000 && basePrice >= 20000 ? basePrice + activeWeight.priceOverride + priceBonus : activeWeight.priceOverride + priceBonus)
    : Math.round((basePrice + priceBonus) * multiplier);

  const totalPrice = unitPrice * quantity;
  const campaignTag = product?.campaign_tag || product?.campaign_gift_title || product?.campaignGiftTitle;

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    const prodId = product?.id || product?.code || 'prd_unknown';
    const weightId = activeWeight.id || 'std';
    const flavorStr = selectedFlavor?.label || null;

    const itemToAdd = {
      ...product,
      id: prodId,
      productId: prodId,
      product_id: prodId,
      weightId: weightId,
      weight_id: weightId,
      cartItemId: `${prodId}_${weightId}${flavorStr ? `_${flavorStr}` : ''}`,
      name: product?.name || product?.title,
      title: product?.title || product?.name,
      basePrice: basePrice,
      base_price: basePrice,
      price: unitPrice,
      image: imagesList[0],
      image_url: imagesList[0],
      images: imagesList,
      video_url: rawVideoUrl,
      weightLabel: activeWeight.label,
      weight_label: activeWeight.label,
      flavor: flavorStr,
      multiplier: multiplier,
      campaign_gift_title: campaignTag,
      campaignGiftTitle: campaignTag,
    };

    if (onAddToCart) {
      onAddToCart(itemToAdd, activeWeight, quantity);
    }

    setIsJustAdded(true);
    setTimeout(() => {
      setIsJustAdded(false);
      onClose();
    }, 900);
  };

  return (
    <>
      {/* 1. MODAL CHÍNH */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs font-sans text-stone-800 animate-fadeIn"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden relative max-h-[92vh] flex flex-col md:flex-row">
          
          {/* Nút đóng */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-white/90 hover:bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-600 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>

          {/* CỘT TRÁI: GALLERY ẢNH & VIDEO SHORTS */}
          <div className="w-full md:w-1/2 bg-stone-50 p-4 sm:p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-stone-200/80">
            
            {/* Tab chuyển đổi Ảnh / Video (Nếu sản phẩm có video_url) */}
            {youtubeVideoId && (
              <div className="mb-3 flex items-center justify-center gap-1.5 p-1 bg-stone-200/70 rounded-2xl border border-stone-300/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setMediaTab('gallery')}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    mediaTab === 'gallery'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5 text-amber-700" />
                  <span>Hình ảnh ({imagesList.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMediaTab('video')}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    mediaTab === 'video'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video thực tế</span>
                </button>
              </div>
            )}

            {/* Khung hiển thị chính */}
            {mediaTab === 'video' && youtubeVideoId ? (
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-black border border-stone-300 shadow-2xs flex flex-col items-center justify-center">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=0&loop=1&playlist=${youtubeVideoId}&playsinline=1&rel=0`}
                  title={product?.name || "Video thực tế sản phẩm"}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                <a
                  href={`https://www.youtube.com/shorts/${youtubeVideoId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black text-white text-[11px] font-bold flex items-center gap-1 backdrop-blur-xs transition-colors shadow-xs"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Mở app YouTube</span>
                </a>
              </div>
            ) : (
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-white border border-stone-200 shadow-2xs group">
                <img
                  src={imagesList[activeImgIndex]}
                  alt={product?.name || 'Nông sản'}
                  className="w-full h-full object-cover transition-transform duration-500 cursor-zoom-in"
                  onClick={() => setIsLightboxOpen(true)}
                />

                {/* Nút phóng to Lightbox */}
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-black/50 hover:bg-black/70 backdrop-blur-xs text-white transition-all cursor-pointer opacity-80 hover:opacity-100 shadow-sm"
                  title="Phóng to ảnh"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                {/* Nút mũi tên lướt ảnh */}
                {imagesList.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); prevImage(); }}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-stone-800 flex items-center justify-center shadow-md transition-all cursor-pointer opacity-90 hover:scale-105"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); nextImage(); }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-stone-800 flex items-center justify-center shadow-md transition-all cursor-pointer opacity-90 hover:scale-105"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Chỉ số ảnh góc dưới */}
                    <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] font-black">
                      {activeImgIndex + 1}/{imagesList.length}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Dàn thumbnail trượt (Khi ở tab ảnh) */}
            {mediaTab === 'gallery' && imagesList.length > 1 && (
              <div className="flex gap-2.5 pt-4 overflow-x-auto scrollbar-none">
                {imagesList.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImgIndex(idx)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                      activeImgIndex === idx
                        ? 'border-amber-800 ring-2 ring-amber-700/20 scale-95'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CỘT PHẢI: THÔNG TIN CHI TIẾT & CHỐT ĐƠN */}
          <div className="w-full md:w-1/2 p-5 sm:p-7 flex flex-col justify-between overflow-y-auto max-h-[60vh] md:max-h-[85vh] space-y-5">
            <div className="space-y-4">
              {/* Badges & Nguồn gốc */}
              <div className="flex flex-wrap items-center gap-2">
                {product?.badge && (
                  <span className="bg-stone-900 text-amber-300 text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {product.badge}
                  </span>
                )}
                {campaignTag && (
                  <span className="bg-emerald-700 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5 text-emerald-200" />
                    <span>{campaignTag}</span>
                  </span>
                )}
                {product?.source && (
                  <span className="bg-stone-100 text-stone-700 text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-700" />
                    <span>{product.source}</span>
                  </span>
                )}
              </div>

              {/* Tên sản phẩm & Đơn giá */}
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 leading-snug">
                  {product?.name || product?.title}
                </h2>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-mono font-black text-amber-950">
                    {unitPrice.toLocaleString('vi-VN')}đ
                  </span>
                  <span className="text-xs text-stone-400 font-semibold">
                    /{activeWeight.label}
                  </span>
                </div>
              </div>

              {/* Cam kết tươi */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center gap-2 text-xs font-bold text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Nông sản cắt cành tươi trong ngày, bao bù 1 đổi 1 nếu dập nát.</span>
              </div>

              {/* Mô tả sản phẩm */}
              {(product?.desc || product?.description) && (
                <div className="space-y-1">
                  <span className="text-xs font-black uppercase text-stone-400 tracking-wider">Hương vị & Đặc điểm:</span>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {product?.desc || product?.description}
                  </p>
                </div>
              )}

              {/* Chọn Hương vị */}
              {flavorsList.length > 1 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Chọn vị:</span>
                  <div className="flex flex-wrap gap-2">
                    {flavorsList.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFlavor(f)}
                        className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all border cursor-pointer ${
                          selectedFlavor?.id === f.id
                            ? 'bg-amber-100 text-amber-950 border-amber-500 ring-1 ring-amber-500'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chọn Quy cách */}
              {weightsList.length > 1 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Quy cách đóng gói:</span>
                  <div className="flex flex-wrap gap-2">
                    {weightsList.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setSelectedWeight(w)}
                        className={`text-xs px-3.5 py-2 rounded-2xl font-bold transition-all border cursor-pointer ${
                          activeWeight.id === w.id
                            ? 'bg-amber-100 text-amber-950 border-amber-500 ring-1 ring-amber-500 shadow-2xs'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CHÂN KHỐI: SỐ LƯỢNG & NÚT ĐẶT */}
            <div className="pt-4 border-t border-stone-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500">Số lượng:</span>
                <div className="flex items-center gap-3 bg-stone-100 rounded-2xl p-1 border border-stone-200">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-xl bg-white hover:bg-stone-200 flex items-center justify-center text-stone-700 transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-bold text-sm w-6 text-center text-stone-900">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-xl bg-white hover:bg-stone-200 flex items-center justify-center text-stone-700 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <div>
                  <span className="text-[11px] text-stone-400 font-semibold block">Tạm tính:</span>
                  <span className="font-mono font-black text-amber-950 text-xl leading-none">
                    {totalPrice.toLocaleString('vi-VN')}đ
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                  className={`flex-1 h-12 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md cursor-pointer ${
                    isJustAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-800 hover:bg-amber-900 text-white disabled:bg-stone-300 disabled:cursor-not-allowed'
                  }`}
                >
                  {isJustAdded ? (
                    <>
                      <Check className="w-5 h-5 stroke-[3]" />
                      <span>Đã thêm vào giỏ</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      <span>Thêm vào giỏ</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* 2. CHẾ ĐỘ LIGHTBOX PHÓNG TO TOÀN MÀN HÌNH */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Nút thoát phóng to */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-5 right-5 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Ảnh phóng đại to */}
          <div 
            className="relative max-w-4xl max-h-[80vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imagesList[activeImgIndex]}
              alt="Phóng to nông sản"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />

            {imagesList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute -left-4 sm:-left-12 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute -right-4 sm:-right-12 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <ChevronRight className="w-7 h-7" />
                </button>
              </>
            )}
          </div>

          <div className="absolute bottom-6 text-white text-xs font-bold bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-xs">
            {activeImgIndex + 1} / {imagesList.length} • Bấm ra ngoài hoặc nhấn phím ESC để thu nhỏ
          </div>
        </div>
      )}
    </>
  );
}