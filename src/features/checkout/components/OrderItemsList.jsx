// src/features/checkout/components/OrderItemsList.jsx
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
    <div className="@container bg-stone-50/90 rounded-3xl p-3 sm:p-5 border border-stone-200/90 space-y-4 font-sans text-stone-800">
      
      {/* Header nhóm */}
      <div className="flex items-center justify-between border-b border-stone-200/80 pb-3 flex-wrap gap-x-4 gap-y-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="w-6 h-6 shrink-0 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-black shadow-2xs">
            1
          </span>
          <h3 className="text-sm sm:text-base font-black text-stone-900 uppercase tracking-wide flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-amber-700" />
            <span>Danh Sách Món Đã Chọn ({cart.length} món)</span>
          </h3>
        </div>
        <span className="text-sm sm:text-base font-black text-amber-950 font-mono">
          Tạm tính: {safeTotal.toLocaleString('vi-VN')}đ
        </span>
      </div>

      {/* Danh sách món responsive */}
      <div className="divide-y divide-stone-200/80">
        {cart.map((item, idx) => {
          const qty = Number(item.quantity) || 1;
          const unitPrice = Number(item.price ?? item.base_price ?? item.basePrice ?? 0);
          const itemTotal = unitPrice * qty;
          const specLabel = item.weight_label || item.weightLabel || item.weight || item.unit || 'Tiêu chuẩn';
          const itemName = item.name || item.title || item.product_name || 'Nông sản Ninh Thuận';
          const giftTitle = item.campaign_gift_title || item.campaignGiftTitle;
          const uniqueKey = item.cartItemId || item.id || `${item.product_id || item.productId || idx}_${item.weight_id || item.weightId || 'std'}`;

          return (
            <div key={uniqueKey} className="py-3 first:pt-1 last:pb-0 flex flex-col gap-3 text-xs sm:text-sm">
              
              {/* Tên món chiếm toàn bộ chiều rộng; xuống dòng tự nhiên trên mobile */}
              <h4 className="font-bold text-stone-900 text-sm sm:text-base leading-snug [overflow-wrap:anywhere]">
                {itemName}
              </h4>
              {/* Hai hàng trên mobile, một hàng khi container đủ rộng */}
              <div className="grid min-w-0 grid-cols-1 gap-3 @min-[560px]:grid-cols-[minmax(0,1fr)_auto] @min-[560px]:items-center">
                <div className="flex min-w-0 items-center gap-3">
                {item.image && (
                  <img
                    src={item.image}
                    alt={itemName}
                    className="w-14 h-14 @min-[420px]:w-16 @min-[420px]:h-16 rounded-2xl object-cover shrink-0 border border-stone-200/90 shadow-2xs bg-stone-100"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      if (e.currentTarget.dataset.fallback) return;
                      e.currentTarget.dataset.fallback = "true";
                      e.currentTarget.src = "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80";
                    }}
                  />
                )}

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="text-xs sm:text-sm font-semibold text-stone-800 leading-normal [overflow-wrap:anywhere]">
                      {specLabel}
                      {item.flavor && <span> • {item.flavor}</span>}
                    </div>
                    {unitPrice > 0 && qty > 1 && (
                      <div className="text-xs text-stone-500 font-mono">
                        Đơn giá: {unitPrice.toLocaleString('vi-VN')}đ
                      </div>
                    )}
                    {giftTitle && (
                      <div className="inline-flex max-w-full items-center gap-1 text-[11px] font-semibold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                        <Gift className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="min-w-0 [overflow-wrap:anywhere]">{giftTitle}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-2 @min-[560px]:flex-nowrap @min-[560px]:gap-3">
                <div className="flex shrink-0 items-center bg-white p-1 rounded-2xl border border-stone-200/90 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleQtyChange(item, -1)}
                    className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 flex items-center justify-center font-bold text-base transition-colors cursor-pointer active:scale-95"
                    aria-label="Giảm số lượng"
                    title={qty === 1 ? "Bỏ món này khỏi giỏ" : "Giảm 1"}
                  >
                    -
                  </button>
                  
                  <span className="min-w-7 px-1 text-center font-black font-mono text-stone-900 text-sm sm:text-base">
                    {qty}
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => handleQtyChange(item, 1)}
                    className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 flex items-center justify-center font-bold text-base transition-colors cursor-pointer active:scale-95"
                    aria-label="Tăng số lượng"
                    title="Tăng 1"
                  >
                    +
                  </button>
                </div>
                  <span className="ml-auto font-mono font-black text-amber-950 whitespace-nowrap text-sm sm:text-base text-right">
                    {itemTotal.toLocaleString('vi-VN')}đ
                  </span>

                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}