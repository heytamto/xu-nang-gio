// src/components/ProductCard.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Check, ShoppingBag, MapPin, Gift, Images, SlidersHorizontal } from 'lucide-react';

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

  // 3. Chuẩn hóa ảnh
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

  // Kiểm tra xem sản phẩm có nhiều lựa chọn hay không
  const hasMultipleOptions = weightsList.length > 1 || flavorsList.length > 1;

  const defaultWeight = useMemo(() => {
    return weightsList.find((w) => w.isDefault) || weightsList[0] || { id: 'std', label: product?.unit || 'Tiêu chuẩn', multiplier: 1 };
  }, [weightsList, product?.unit]);

  const [isHovered, setIsHovered] = useState(false);
  const [isJustAdded, setIsJustAdded] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const addedTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    };
  }, []);

  const isOutOfStock = product?.inStock === false || product?.in_stock === false;
  const primaryImage = imagesList[0];
  const secondaryImage = imagesList[1] || imagesList[0];
  const hasMultipleImages = imagesList.length > 1;

  const campaignTag = product?.campaign_tag || product?.campaign_gift_title || product?.campaignGiftTitle || null;
  const base = Number(product?.basePrice ?? product?.base_price ?? product?.price ?? 0);
  const multiplier = Number(defaultWeight.multiplier) || 1;

  // Tính giá hiển thị từ quy cách khởi điểm
  const displayPrice = useMemo(() => {
    if (defaultWeight.priceOverride != null && defaultWeight.priceOverride > 0) {
      if (defaultWeight.priceOverride < 10000 && base >= 20000) {
        return base + defaultWeight.priceOverride;
      }
      return defaultWeight.priceOverride;
    }
    return Math.round(base * multiplier);
  }, [defaultWeight.priceOverride, base, multiplier]);

  // Xử lý nút hành động
  const handleActionClick = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;

    // NẾU CÓ NHIỀU QUY CÁCH / VỊ -> BẬT POPUP CHI TIẾT ĐỂ KHÁCH CHỌN
    if (hasMultipleOptions) {
      if (onViewDetail) onViewDetail(product);
      return;
    }

    // NẾU CHỈ CÓ 1 MẪU ĐƠN GIẢN -> THÊM NHANH VÀO GIỎ
    const prodId = product?.id || product?.code || 'prd_unknown';
    const weightId = defaultWeight.id || 'std';

    const itemToAdd = {
      ...product,
      id: prodId,
      productId: prodId,
      product_id: prodId,
      weightId: weightId,
      weight_id: weightId,
      cartItemId: `${prodId}_${weightId}`,
      name: product?.name || product?.title,
      title: product?.title || product?.name,
      basePrice: base,
      base_price: base,
      price: displayPrice,
      image: primaryImage,
      image_url: primaryImage,
      images: imagesList,
      weightLabel: defaultWeight.label,
      weight_label: defaultWeight.label,
      flavor: null,
      multiplier: multiplier,
      campaign_gift_title: campaignTag,
      campaignGiftTitle: campaignTag,
    };

    if (onAddToCart) {
      onAddToCart(itemToAdd, defaultWeight, 1);
    }

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
      onClick={handleOpenDetail}
      className={`bg-white rounded-3xl border border-stone-200/90 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group font-sans text-stone-800 h-full ${
        onViewDetail ? 'cursor-pointer' : ''
      }`}
    >
      {/* 1. KHỐI TRÊN: ẢNH + BADGES + NGUỒN GỐC */}
      <div className="relative aspect-4/3 overflow-hidden bg-stone-100 shrink-0">
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
        
        {/* Badges */}
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

        {/* Số lượng ảnh */}
        {hasMultipleImages && (
          <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 z-10 shadow-xs">
            <Images className="w-3 h-3 text-amber-300" />
            <span>{isHovered ? '2' : '1'}/{imagesList.length}</span>
          </div>
        )}

        {/* Nguồn gốc */}
        {product?.source && (
          <span className={`absolute bottom-2.5 left-2.5 ${hasMultipleImages ? 'right-16' : 'right-2.5'} bg-white/95 backdrop-blur-md text-stone-700 text-xs font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1.5 truncate shadow-2xs z-10`}>
            <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="truncate">{product.source}</span>
          </span>
        )}

        {/* Trạng thái hết hàng */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-stone-900/70 backdrop-blur-2xs flex items-center justify-center z-20">
            <span className="px-4 py-1.5 bg-rose-600 text-white font-bold text-sm rounded-full shadow-md">
              Tạm hết lứa
            </span>
          </div>
        )}
      </div>

      {/* 2. KHỐI THÂN: GỌN GÀNG DUY NHẤT TÊN SẢN PHẨM */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-center">
        <h3 className="font-black text-stone-900 text-base sm:text-lg leading-snug line-clamp-2 group-hover:text-amber-800 transition-colors">
          {product?.name || product?.title}
        </h3>
      </div>

      {/* 3. KHỐI CHÂN: GIÁ & NÚT HÀNH ĐỘNG THÔNG MINH */}
      <div className="p-4 sm:p-5 pt-0">
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-stone-400 font-semibold block leading-tight">
              {hasMultipleOptions ? 'Giá từ:' : 'Đơn giá:'}
            </span>
            <span className="font-mono font-black text-amber-950 text-lg sm:text-xl leading-none">
              {displayPrice.toLocaleString('vi-VN')}đ
            </span>
          </div>

          <button
            key={animKey}
            type="button"
            disabled={isOutOfStock}
            onClick={handleActionClick}
            className={`h-11 px-4 sm:px-5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all active:scale-90 shadow-xs cursor-pointer ${
              isJustAdded
                ? 'bg-emerald-600 text-white animate-scale-pop'
                : hasMultipleOptions
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                  : 'bg-stone-900 hover:bg-amber-800 text-white disabled:bg-stone-300 disabled:cursor-not-allowed'
            }`}
            title={hasMultipleOptions ? "Mở bảng tùy chọn quy cách & hương vị" : "Thêm vào giỏ"}
          >
            {isJustAdded ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Đã thêm</span>
              </>
            ) : hasMultipleOptions ? (
              <>
                <SlidersHorizontal className="w-4 h-4 text-amber-800" />
                <span>Chọn mua</span>
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