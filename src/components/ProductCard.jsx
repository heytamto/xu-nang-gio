// src/components/ProductCard.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { Check, ShoppingBag, MapPin, Gift } from 'lucide-react';

export default function ProductCard({ product, onAddToCart }) {
  // 1. Chuẩn hóa weights từ nhiều nguồn (Mảng quan hệ product_weights, chuỗi text hoặc fallback unit)
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

  // 2. Chuẩn hóa flavors (biến thể hương vị nếu có)
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

  // Ưu tiên chọn quy cách mặc định (isDefault: true)
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

  // Hỗ trợ song song cả camelCase (Sheet/Local) và snake_case (Supabase)
  const isOutOfStock = product?.inStock === false || product?.in_stock === false;
  const productImage = product?.image || product?.image_url || "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80";
  const productDesc = product?.desc || product?.description || '';
  const campaignTag = product?.campaign_tag || product?.campaign_gift_title || null;

  const activeWeight = selectedWeight || defaultWeight || { id: 'std', label: 'Tiêu chuẩn', multiplier: 1 };
  const base = Number(product?.basePrice ?? product?.base_price ?? product?.price ?? 0);
  const multiplier = Number(activeWeight.multiplier) || 1;
  const priceBonus = selectedFlavor?.priceBonus || 0;

  // 3. Cơ chế tính giá phòng thủ:
  // - Nếu priceOverride >= base * 0.4: là giá độc lập trọn gói hợp lệ.
  // - Nếu priceOverride nhỏ bất thường (< 10.000đ trong khi base >= 20.000đ): là tiền chênh lệch (priceDiff) -> cộng vào base.
  // - Ngược lại: tính theo công thức multiplier * base.
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

    // Cart item payload chuẩn hóa
    const itemToAdd = {
      ...product,
      id: prodId,
      productId: prodId,
      weightId: weightId,
      cartItemId: `${prodId}_${weightId}${flavorStr ? `_${flavorStr}` : ''}`,
      name: product?.name || product?.title,
      title: product?.title || product?.name,
      basePrice: base,
      base_price: base,
      price: currentPrice,
      image: productImage,
      weightLabel: activeWeight.label,
      weight_label: activeWeight.label,
      flavor: flavorStr,
      multiplier: multiplier,
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
    <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group font-sans">
      {/* 1. Ảnh sản phẩm + Nguồn gốc + Badge */}
      <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
        <img
          src={productImage}
          alt={product?.name || "Đặc sản Ninh Thuận"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80";
          }}
        />
        
        {/* Badge nổi bật */}
        {product?.badge && (
          <span className="absolute top-3 left-3 bg-stone-900/85 backdrop-blur-xs text-amber-200 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-2xs">
            {product.badge}
          </span>
        )}

        {/* Badge Quà tặng Combo Campaign */}
        {campaignTag && (
          <span className="absolute top-3 right-3 bg-emerald-700/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
            <Gift className="w-3 h-3 text-emerald-200" />
            <span>{campaignTag}</span>
          </span>
        )}

        {/* Nguồn gốc xuất xứ */}
        {product?.source && (
          <span className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-xs text-stone-700 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 truncate shadow-2xs">
            <MapPin className="w-3 h-3 text-amber-700 shrink-0" />
            <span className="truncate">{product.source}</span>
          </span>
        )}

        {/* Trạng thái tạm hết hàng */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-2xs flex items-center justify-center">
            <span className="px-3 py-1 bg-rose-600 text-white font-bold text-xs rounded-full shadow-sm">
              Tạm hết lứa
            </span>
          </div>
        )}
      </div>

      {/* 2. Nội dung card */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="font-bold text-stone-900 text-sm leading-snug line-clamp-2 group-hover:text-amber-800 transition-colors">
            {product?.name || product?.title}
          </h3>
          {productDesc && (
            <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">
              {productDesc}
            </p>
          )}
        </div>

        {/* Biến thể Hương vị */}
        {flavorsList.length > 1 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              Chọn vị / biến thể:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {flavorsList.map((f) => {
                const isFlavorActive = selectedFlavor?.id === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFlavor(f)}
                    className={`text-[10.5px] px-2.5 py-1 rounded-xl font-bold transition-all border cursor-pointer ${
                      isFlavorActive
                        ? 'bg-amber-50 text-amber-900 border-amber-600 shadow-2xs'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Lựa chọn quy cách (weights) */}
        {weightsList.length > 1 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
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
                    className={`text-[10.5px] px-2.5 py-1 rounded-xl font-bold transition-all border cursor-pointer ${
                      isWeightActive
                        ? 'bg-amber-50 text-amber-900 border-amber-600 shadow-2xs'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {w.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Giá & Nút Thêm Vào Giỏ */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-stone-400 block">Đơn giá:</span>
            <span className="font-mono font-black text-amber-900 text-base">
              {currentPrice.toLocaleString('vi-VN')}đ
            </span>
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddToCartClick}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer ${
              isJustAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-900 hover:bg-amber-700 text-white disabled:bg-stone-300 disabled:cursor-not-allowed'
            }`}
          >
            {isJustAdded ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Đã thêm</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Thêm giỏ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}