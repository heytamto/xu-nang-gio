// src/components/ProductCard.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { Check, ShoppingBag, MapPin, Gift } from 'lucide-react';

export default function ProductCard({ product, onAddToCart }) {
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

  const defaultWeight = useMemo(() => {
    return weightsList.find((w) => w.isDefault) || weightsList[0] || null;
  }, [weightsList]);

  const [selectedWeight, setSelectedWeight] = useState(defaultWeight);
  const [selectedFlavor, setSelectedFlavor] = useState(() => flavorsList[0] || null);
  const [isJustAdded, setIsJustAdded] = useState(false);

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
  const productImage = product?.image || product?.image_url || "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80";
  const productDesc = product?.desc || product?.description || '';
  const campaignTag = product?.campaign_tag || product?.campaign_gift_title || product?.campaignGiftTitle || null;

  const activeWeight = selectedWeight || defaultWeight || { id: 'std', label: 'Tiêu chuẩn', multiplier: 1 };
  const base = Number(product?.basePrice ?? product?.base_price ?? product?.price ?? 0);
  const multiplier = Number(activeWeight.multiplier) || 1;
  const priceBonus = selectedFlavor?.priceBonus || 0;

  // 3. Tính giá phòng thủ
  const currentPrice = useMemo(() => {
    if (activeWeight.priceOverride != null && activeWeight.priceOverride > 0) {
      if (activeWeight.priceOverride < 10000 && base >= 20000) {
        return base + activeWeight.priceOverride + priceBonus;
      }
      return activeWeight.priceOverride + priceBonus;
    }
    return Math.round((base + priceBonus) * multiplier);
  }, [activeWeight.priceOverride, base, priceBonus, multiplier]);

  const handleAddToCartClick = () => {
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
      image: productImage,
      image_url: productImage,
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

    setIsJustAdded(true);
    setTimeout(() => {
      setIsJustAdded(false);
    }, 1200);
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group font-sans text-stone-800 h-full">
      
      {/* 1. KHỐI TRÊN: ẢNH + NGUỒN GỐC */}
      <div className="relative aspect-4/3 overflow-hidden bg-stone-100 shrink-0">
        <img
          src={productImage}
          alt={product?.name || "Đặc sản Ninh Thuận"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80";
          }}
        />
        
{/* Cụm Badge trên đỉnh ảnh: Tự do hiển thị toàn bộ nội dung, tự xuống dòng khi cần */}
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

        {/* Nguồn gốc xuất xứ ghim chân ảnh */}
        {product?.source && (
          <span className="absolute bottom-2.5 left-2.5 right-2.5 bg-white/95 backdrop-blur-md text-stone-700 text-xs font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1.5 truncate shadow-2xs z-10">
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

      {/* 2. KHỐI THÂN: TIÊU ĐỀ + MÔ TẢ 4 DÒNG + TÙY CHỌN */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        {/* Tiêu đề & Mô tả 4 dòng lấp đầy không gian trống */}
        <div className="space-y-1.5">
          <h3 className="font-black text-stone-900 text-base sm:text-lg leading-snug line-clamp-2 min-h-[3rem] group-hover:text-amber-800 transition-colors">
            {product?.name || product?.title}
          </h3>
          {productDesc && (
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed font-normal line-clamp-4 min-h-[5rem]">
              {productDesc}
            </p>
          )}
        </div>

        {/* Cụm tùy chọn (Hương vị & Quy cách) ghim tự nhiên */}
        <div className="space-y-2.5 pt-1">
          {/* Lựa chọn Hương vị */}
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

          {/* Lựa chọn Quy cách */}
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

      {/* 3. KHỐI CHÂN TRANG: ĐƠN GIÁ & NÚT THÊM GIỎ HÀNG CHUẨN h-11 */}
      <div className="p-4 sm:p-5 pt-0">
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-stone-400 font-semibold block leading-tight">Đơn giá:</span>
            <span className="font-mono font-black text-amber-950 text-lg sm:text-xl leading-none">
              {currentPrice.toLocaleString('vi-VN')}đ
            </span>
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddToCartClick}
            className={`h-11 px-5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all active:scale-95 shadow-xs cursor-pointer ${
              isJustAdded
                ? 'bg-emerald-600 text-white'
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