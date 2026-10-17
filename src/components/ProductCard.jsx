import React, { useState, useMemo, useEffect } from 'react';
import { Check, ShoppingBag, MapPin } from 'lucide-react';

export default function ProductCard({ product, onAddToCart }) {
  // 1. Chuẩn hóa weights từ nhiều nguồn (Mảng, Chuỗi từ Sheet dạng "1kg:1|2kg:1.8", null/undefined)
  const weightsList = useMemo(() => {
    if (Array.isArray(product?.weights) && product.weights.length > 0) {
      return product.weights;
    }

    if (typeof product?.weights === 'string' && product.weights.trim()) {
      return product.weights.split('|').map((part, idx) => {
        const [label, mult] = part.split(':');
        return {
          id: `opt-${idx + 1}`,
          label: label?.trim() || 'Tiêu chuẩn',
          multiplier: parseFloat(mult) || 1
        };
      });
    }

    return [{ id: 'std', label: product?.unit || 'Tiêu chuẩn', multiplier: 1 }];
  }, [product?.weights, product?.unit]);

  // 2. Chuẩn hóa flavors (nếu có biến thể vị)
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

  const [selectedWeight, setSelectedWeight] = useState(() => weightsList[0] || null);
  const [selectedFlavor, setSelectedFlavor] = useState(() => flavorsList[0] || null);
  const [isJustAdded, setIsJustAdded] = useState(false);

  useEffect(() => {
    if (!selectedWeight || !weightsList.some((w) => w.id === selectedWeight.id)) {
      setSelectedWeight(weightsList[0] || null);
    }
  }, [weightsList]);

  useEffect(() => {
    if (flavorsList.length > 0 && (!selectedFlavor || !flavorsList.some((f) => f.id === selectedFlavor.id))) {
      setSelectedFlavor(flavorsList[0] || null);
    }
  }, [flavorsList]);

  const activeWeight = selectedWeight || weightsList[0] || { id: 'std', label: product?.unit || 'Tiêu chuẩn', multiplier: 1 };
  const base = Number(product?.basePrice || product?.price || 0);
  const multiplier = Number(activeWeight.multiplier) || 1;
  const priceBonus = selectedFlavor?.priceBonus || 0;
  const currentPrice = Math.round((base + priceBonus) * multiplier);

  const handleAddToCartClick = () => {
    if (product?.inStock === false) return;

    const weightPayload = {
      ...activeWeight,
      flavor: selectedFlavor?.label || null,
      priceBonus: priceBonus
    };

    if (onAddToCart) {
      onAddToCart(product, weightPayload, 1);
    }

    setIsJustAdded(true);
    setTimeout(() => {
      setIsJustAdded(false);
    }, 1200);
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group">
      {/* 1. Ảnh sản phẩm + Nguồn gốc + Badge */}
      <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
        <img
          src={product?.image || "https://images.unsplash.com/photo-1616684000067-36952fde56ec?auto=format&fit=crop&w=600&q=80"}
          alt={product?.name || "Đặc sản"}
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

        {/* Nguồn gốc xuất xứ */}
        {product?.source && (
          <span className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-xs text-stone-700 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 truncate shadow-2xs">
            <MapPin className="w-3 h-3 text-amber-700 shrink-0" />
            <span className="truncate">{product.source}</span>
          </span>
        )}

        {/* Trạng thái tạm hết hàng */}
        {product?.inStock === false && (
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
            {product?.name}
          </h3>
          {product?.desc && (
            <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">
              {product.desc}
            </p>
          )}
        </div>

        {/* Biến thể Hương vị (nếu có) */}
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
        {weightsList.length > 0 && (
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
            disabled={product?.inStock === false}
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