import React, { useState } from 'react';
import { Plus, Minus, Check, Sparkles, ShoppingBag } from 'lucide-react';

export default function ProductCard({ product, onAddToCart }) {
  const [selectedFlavor, setSelectedFlavor] = useState(() => product.flavors?.[0] || null);
  const [selectedWeight, setSelectedWeight] = useState(() => product.weights?.[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  // Lấy chuỗi đơn vị an toàn (tránh render trực tiếp object)
  const defaultUnitLabel = typeof product.unit === 'object' && product.unit !== null
    ? (product.unit.label || 'món')
    : (product.unit || 'món');

  const activeWeightLabel = selectedWeight?.label || defaultUnitLabel;

  const priceBonus = selectedFlavor?.priceBonus || 0;
  const multiplier = selectedWeight?.multiplier || 1;
  const unitPrice = Math.round(((Number(product.basePrice) || 0) + priceBonus) * multiplier);
  const totalPrice = unitPrice * quantity;

  const handleDecrease = () => {
    if (quantity > 1) setQuantity((q) => q - 1);
  };

  const handleIncrease = () => {
    setQuantity((q) => q + 1);
  };

  const handleAdd = () => {
    const weightPayload = {
      id: selectedWeight?.id || 'std',
      label: activeWeightLabel,
      multiplier: multiplier,
      flavor: selectedFlavor?.label || null,
      priceBonus: priceBonus
    };

    onAddToCart(product, weightPayload, quantity);

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        {/* Ảnh & Badge */}
        <div className="relative aspect-4/3 w-full bg-stone-100 overflow-hidden">
          <img
            src={product.image || "https://images.unsplash.com/photo-1616684000067-36952fde56ec?auto=format&fit=crop&w=600&q=80"}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80";
            }}
          />
          {product.badge && (
            <span className="absolute top-3 left-3 px-3 py-1 bg-amber-500 text-stone-950 font-bold text-[10px] rounded-full shadow flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>{product.badge}</span>
            </span>
          )}
          {product.inStock === false && (
            <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-2xs flex items-center justify-center">
              <span className="px-3 py-1 bg-red-600 text-white font-bold text-xs rounded-full shadow-sm">
                Tạm hết lứa
              </span>
            </div>
          )}
        </div>

        {/* Nội dung thông tin */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-bold text-stone-900 text-sm line-clamp-1">{product.name}</h3>
            <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-2 leading-relaxed">{product.desc}</p>
          </div>

          {/* Chọn Hương vị */}
          {product.flavors && product.flavors.length > 1 && (
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-stone-500 block">Chọn vị / biến thể:</span>
              <div className="flex flex-wrap gap-1.5">
                {product.flavors.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFlavor(f)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-medium transition-colors border ${
                      selectedFlavor?.id === f.id
                        ? 'border-amber-600 bg-amber-50 text-amber-800 font-bold shadow-2xs'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chọn Quy cách đóng gói */}
          {product.weights && product.weights.length > 1 && (
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-stone-500 block">Quy cách đóng gói:</span>
              <div className="flex flex-wrap gap-1.5">
                {product.weights.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setSelectedWeight(w)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-medium transition-colors border ${
                      selectedWeight?.id === w.id
                        ? 'border-amber-600 bg-amber-50 text-amber-800 font-bold shadow-2xs'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chọn số lượng (+ / -) */}
          <div className="flex items-center justify-between pt-1 border-t border-stone-100">
            <span className="text-[11px] font-semibold text-stone-600">Số lượng:</span>
            <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden bg-stone-50 shadow-2xs">
              <button
                type="button"
                onClick={handleDecrease}
                disabled={quantity <= 1}
                className="w-7 h-7 flex items-center justify-center text-stone-600 hover:bg-stone-200 disabled:opacity-40 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center text-xs font-bold text-stone-800">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrease}
                className="w-7 h-7 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Giá tiền & Nút Mua */}
      <div className="p-4 pt-2 flex items-center justify-between border-t border-stone-100 bg-stone-50/50">
        <div>
          <span className="text-sm font-black text-amber-800 font-mono">
            {totalPrice.toLocaleString('vi-VN')}đ
          </span>
          <span className="text-[10px] text-stone-400 block">
            {unitPrice.toLocaleString('vi-VN')}đ / {activeWeightLabel}
          </span>
        </div>

        <button
          type="button"
          disabled={product.inStock === false}
          onClick={handleAdd}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
            isAdded
              ? 'bg-emerald-600 text-white'
              : 'bg-stone-900 hover:bg-amber-600 text-white disabled:bg-stone-300'
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Đã thêm ({quantity})</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Thêm Vào Giỏ</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
