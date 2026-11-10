// src/components/ProductCard.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Check, ShoppingBag, MapPin, Gift, Images } from 'lucide-react';

export default function ProductCard({ product, onAddToCart, onViewDetail }) {
  // 1. Chuẩn hóa weights
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

    return [{ 
      id: 'std', 
      label: product?.unit || product?.weight_label || 'Tiêu chuẩn', 
      multiplier: 1, 
      priceOverride: null, 
      isDefault: true 
    }];
  }, [product?.product_weights, product?.weights, product?.unit, product?.weight_label]);

  // 2. Chuẩn hóa flavors
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

  // 3. Chuẩn hóa danh sách nhiều ảnh
  const imagesList = useMemo(() => {
    const fallback = "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80";
    if (Array.isArray(product?.images) && product.images.length > 0) {
      return product.images.filter(Boolean);
    }
    if (typeof product?.images === 'string' && product.images.trim()) {
      return product.images.split(/[,|\n]/).map(s => s.trim()).filter(Boolean);
    }
    const single = product?.image || product?.image_url;
    return single ? [single] : [fallback];
  }, [product?.images, product?.image, product?.image_url]);

  const defaultWeight = useMemo(() => {
    return weightsList.find((w) => w.isDefault) || weightsList[0] || null;
  }, [weightsList]);

  const [selectedWeight, setSelectedWeight] = useState(defaultWeight);
  const [selectedFlavor, setSelectedFlavor] = useState(() => flavorsList[0] || null);
  const [isHovered, setIsHovered] = useState(false);

  // States quản lý animation phản hồi click
  const [isJustAdded, setIsJustAdded] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const addedTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!selectedWeight || !weightsList.some((w) => w.id === selectedWeight.id)) {
      setSelectedWeight(defaultWeight);
    }
  }, [weightsList, defaultWeight]);

  useEffect(() => {
    if (flavorsList.length > 0 && (!selectedFlavor || !flavorsList.some((f) => f.id === selectedFlavor.id))) {
      setSelectedFlavor(flavorsList[0] || null);
    }
  }, [flavorsList]);

  const isOutOfStock = product?.inStock === false || product?.in_stock === false;
  const primaryImage = imagesList[0];
  const secondaryImage = imagesList[1] || imagesList[0];
  const hasMultipleImages = imagesList.length > 1;

  const productDesc = product?.desc || product?.description || '';
  const campaignTag = product?.campaign_tag || product?.campaign_gift_title || product?.campaignGiftTitle || null;

  const activeWeight = selectedWeight || defaultWeight || { id: 'std', label: 'Tiêu chuẩn', multiplier: 1 };
  const base = Number(product?.basePrice ?? product?.base_price ?? product?.price ?? 0);
  const multiplier = Number(activeWeight.multiplier) || 1;
  const priceBonus = selectedFlavor?.priceBonus || 0;

  // 4. Tính giá phòng thủ
  const currentPrice = useMemo(() => {
    if (activeWeight.priceOverride != null && activeWeight.priceOverride > 0) {
      if (activeWeight.priceOverride < 10000 && base >= 20000) {
        return base + activeWeight.priceOverride + priceBonus;
      }
      return activeWeight.priceOverride + priceBonus;
    }
    return Math.round((base + priceBonus) * multiplier);
  }, [activeWeight.priceOverride, base, priceBonus, multiplier]);

  const handleAddToCartClick = (e) => {
    e.stopPropagation();
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
      basePrice: base,
      base_price: base,
      price: currentPrice,
      image: primaryImage,
      image_url: primaryImage,
      images: imagesList,
      weightLabel: activeWeight.label,
      weight_label: activeWeight.label,
      flavor: flavorStr,
      multiplier: multiplier,
      campaign_gift_title: campaignTag,
      campaignGiftTitle: campaignTag,
    };

    if (onAddToCart) {
      onAddToCart(itemToAdd, activeWeight, 1);
    }

    // Reset timer & force re-trigger animation ngay thao tác mới nhất
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    setAnimKey((k) => k + 1);
    setIsJustAdded(true);

    addedTimerRef.current = setTimeout(() => {
      setIsJustAdded(false);
    }, 1000);
  };

  const handleOpenDetail = () => {
    if (onViewDetail) {
      onViewDetail(product);
    }
  };

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group font-sans text-stone-800 h-full"
    >
      {/* 1. KHỐI TRÊN: ẢNH ĐA TẦNG + NGUỒN GỐC + BADGE */}
      <div 
        onClick={handleOpenDetail}
        className={`relative aspect-4/3 overflow-hidden bg-stone-100 shrink-0 ${onViewDetail ? 'cursor-pointer' : ''}`}
      >
        <img
          src={primaryImage}
          alt={product?.name || "Đặc sản Ninh Thuận"}
          className={`w-full h-full object-cover transition-all duration-700 ${
            hasMultipleImages && isHovered ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
          }`}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80";
          }}
        />

        {hasMultipleImages && (
          <img
            src={secondaryImage}
            alt={`${product?.name || "Đặc sản"} - góc chụp khác`}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
              isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
            }`}
            loading="lazy"
          />
        )}
        
        <div className="absolute top-2.5 left-2.5 right-2.5 flex flex-wrap items-center justify-between gap-1.5 pointer-events-none z-10">
          {product?.badge ? (
            <span className="bg-stone-900/90 backdrop-blur-md text-amber-300 text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm shrink-0 whitespace-nowrap">
              {product.badge}
            </span>
          ) : <span />}

          {campaignTag ? (
            <span className="bg-emerald-700/95 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm shrink-0 whitespace-nowrap">
              <Gift className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
              <span>{campaignTag}</span>
            </span>
          ) : <span />}
        </div>

        {hasMultipleImages && (
          <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 z-10 shadow-xs">
            <Images className="w-3 h-3 text-amber-300" />
            <span>{isHovered ? '2' : '1'}/{imagesList.length}</span>
          </div>
        )}

        {product?.source && (
          <span className={`absolute bottom-2.5 left-2.5 ${hasMultipleImages ? 'right-16' : 'right-2.5'} bg-white/95 backdrop-blur-md text-stone-700 text-xs font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1.5 truncate shadow-2xs z-10`}>
            <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="truncate">{product.source}</span>
          </span>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-stone-900/70 backdrop-blur-2xs flex items-center justify-center z-20">
            <span className="px-4 py-1.5 bg-rose-600 text-white font-bold text-sm rounded-full shadow-md">
              Tạm hết lứa
            </span>
          </div>
        )}
      </div>

      {/* 2. KHỐI THÂN: TIÊU ĐỀ + MÔ TẢ + TÙY CHỌN */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <h3 
            onClick={handleOpenDetail}
            className={`font-black text-stone-900 text-base sm:text-lg leading-snug line-clamp-2 min-h-[3rem] group-hover:text-amber-800 transition-colors ${onViewDetail ? 'cursor-pointer' : ''}`}
          >
            {product?.name || product?.title}
          </h3>
          {productDesc && (
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed font-normal line-clamp-4 min-h-[5rem]">
              {productDesc}
            </p>
          )}
        </div>

        <div className="space-y-2.5 pt-1">
          {flavorsList.length > 1 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                Chọn vị:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {flavorsList.map((f) => {
                  const isFlavorActive = selectedFlavor?.id === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFlavor(f)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all border cursor-pointer ${
                        isFlavorActive
                          ? 'bg-amber-100 text-amber-950 border-amber-500 shadow-2xs ring-1 ring-amber-500'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {weightsList.length > 1 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                Chọn quy cách:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {weightsList.map((w) => {
                  const isWeightActive = activeWeight.id === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setSelectedWeight(w)}
                      className={`text-xs px-3.5 py-2 rounded-2xl font-bold transition-all border cursor-pointer ${
                        isWeightActive
                          ? 'bg-amber-100/90 text-amber-950 border-amber-500 shadow-2xs ring-1 ring-amber-500'
                          : 'bg-stone-50 text-stone-700 border-stone-200/90 hover:bg-stone-100 hover:border-stone-300'
                      }`}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. KHỐI CHÂN TRANG: ĐƠN GIÁ & NÚT THÊM GIỎ HÀNG */}
      <div className="p-4 sm:p-5 pt-0">
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-stone-400 font-semibold block leading-tight">Đơn giá:</span>
            <span className="font-mono font-black text-amber-950 text-lg sm:text-xl leading-none">
              {currentPrice.toLocaleString('vi-VN')}đ
            </span>
          </div>

          <button
            key={animKey}
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddToCartClick}
            className={`h-11 px-5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all active:scale-90 shadow-xs cursor-pointer ${
              isJustAdded
                ? 'bg-emerald-600 text-white animate-scale-pop'
                : 'bg-stone-900 hover:bg-amber-800 text-white disabled:bg-stone-300 disabled:cursor-not-allowed'
            }`}
          >
            {isJustAdded ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Đã thêm</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Thêm giỏ</span>
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}