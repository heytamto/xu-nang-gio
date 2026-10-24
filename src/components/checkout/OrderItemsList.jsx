// src/components/checkout/OrderItemsList.jsx
import React from 'react';
import { ShoppingBag, Trash2, Gift } from 'lucide-react';

export default function OrderItemsList({ 
  cart = [], 
  totalAmount = 0, 
  onUpdateQuantity, 
  onRemoveItem 
}) {
  const safeTotal = Number(totalAmount) || 0;

  const handleQtyChange = (item, delta) => {
    const currentQty = Number(item.quantity) || 1;
    const newQty = currentQty + delta;
    
    if (newQty <= 0) {
      if (onRemoveItem) {
        onRemoveItem(item);
      }
    } else if (onUpdateQuantity) {
      onUpdateQuantity(item, delta);
    }
  };

  return (
    <div className="bg-stone-50/90 rounded-3xl p-4 sm:p-5 border border-stone-200/80 space-y-3.5 font-sans">
      <div className="flex items-center justify-between border-b border-stone-200/70 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[11px] font-black shadow-2xs">
            1
          </span>
          <h3 className="text-xs sm:text-sm font-black text-stone-900 uppercase tracking-wide flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-amber-700" />
            <span>Danh Sách Món Đã Chọn ({cart.length} món)</span>
          </h3>
        </div>
        <span className="text-xs font-bold text-amber-900 font-mono">
          Tạm tính: {safeTotal.toLocaleString('vi-VN')}đ
        </span>
      </div>

      <div className="divide-y divide-stone-200/70 max-h-72 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
        {cart.map((item, idx) => {
          const qty = Number(item.quantity) || 1;
          const unitPrice = Number(item.price ?? item.base_price ?? item.basePrice ?? 0);
          const itemTotal = unitPrice * qty;
          const specLabel = item.weight_label || item.weightLabel || item.weight || item.unit || 'Tiêu chuẩn';
          const itemName = item.name || item.title || item.product_name || 'Nông sản Ninh Thuận';
          const giftTitle = item.campaign_gift_title || item.campaignGiftTitle;
          const uniqueKey = item.cartItemId || item.id || `${item.product_id || item.productId || idx}_${item.weight_id || item.weightId || 'std'}`;

          return (
            <div key={uniqueKey} className="py-3 flex items-center justify-between gap-3 text-xs">
              {/* Ảnh và thông tin món */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {item.image && (
                  <img
                    src={item.image}
                    alt={itemName}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-stone-200/80 shadow-2xs bg-stone-100"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80";
                    }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-stone-900 block leading-snug truncate">
                    {itemName}
                  </span>
                  
                  <span className="text-[11px] text-stone-500 block mt-0.5 truncate">
                    Quy cách: <strong className="text-stone-700">{specLabel}</strong>
                    {item.flavor ? ` • ${item.flavor}` : ''}
                    {unitPrice > 0 && (
                      <span className="text-stone-400 font-mono ml-1.5">
                        ({unitPrice.toLocaleString('vi-VN')}đ)
                      </span>
                    )}
                  </span>

                  {/* Quà tặng theo món nếu có */}
                  {giftTitle && (
                    <div className="inline-flex items-center gap-1 text-[9.5px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-1">
                      <Gift className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                      <span className="truncate">Tặng: {giftTitle}</span>
                    </div>
                  )}

                  <div className="text-[11px] font-bold text-amber-700 font-mono mt-0.5 sm:hidden">
                    {itemTotal.toLocaleString('vi-VN')}đ
                  </div>
                </div>
              </div>

              {/* Cụm điều khiển số lượng */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center bg-white p-1 rounded-xl border border-stone-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleQtyChange(item, -1)}
                    className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                    title={qty === 1 ? "Bỏ món này khỏi giỏ" : "Giảm 1"}
                  >
                    {qty === 1 ? (
                      <Trash2 className="w-3.5 h-3.5 text-stone-400 hover:text-rose-600 transition-colors" />
                    ) : (
                      "-"
                    )}
                  </button>
                  <span className="w-7 text-center font-bold font-mono text-stone-900 text-xs">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQtyChange(item, 1)}
                    className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                    title="Tăng 1"
                  >
                    +
                  </button>
                </div>

                {/* Thành tiền Desktop */}
                <span className="hidden sm:inline-block font-mono font-black text-stone-900 whitespace-nowrap text-sm w-24 text-right">
                  {itemTotal.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}