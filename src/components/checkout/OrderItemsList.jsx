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
    <div className="bg-stone-50/90 rounded-3xl p-5 sm:p-6 border border-stone-200/90 space-y-4 font-sans text-stone-800">
      
      {/* Header nhóm */}
      <div className="flex items-center justify-between border-b border-stone-200/80 pb-3.5 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-black shadow-2xs">
            1
          </span>
          <h3 className="text-sm sm:text-base font-black text-stone-900 uppercase tracking-wide flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
            <span>Danh Sách Món Đã Chọn ({cart.length} món)</span>
          </h3>
        </div>
        <span className="text-sm sm:text-base font-black text-amber-950 font-mono">
          Tạm tính: {safeTotal.toLocaleString('vi-VN')}đ
        </span>
      </div>

      {/* Danh sách món cuộn dọc */}
      <div className="divide-y divide-stone-200/80 max-h-80 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
        {cart.map((item, idx) => {
          const qty = Number(item.quantity) || 1;
          const unitPrice = Number(item.price ?? item.base_price ?? item.basePrice ?? 0);
          const itemTotal = unitPrice * qty;
          const specLabel = item.weight_label || item.weightLabel || item.weight || item.unit || 'Tiêu chuẩn';
          const itemName = item.name || item.title || item.product_name || 'Nông sản Ninh Thuận';
          const giftTitle = item.campaign_gift_title || item.campaignGiftTitle;
          const uniqueKey = item.cartItemId || item.id || `${item.product_id || item.productId || idx}_${item.weight_id || item.weightId || 'std'}`;

          return (
            <div key={uniqueKey} className="py-4 flex items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm">
              
              {/* Ảnh và thông tin món */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {item.image && (
                  <img
                    src={item.image}
                    alt={itemName}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover shrink-0 border border-stone-200/90 shadow-2xs bg-stone-100"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80";
                    }}
                  />
                )}
                
                <div className="min-w-0 flex-1 space-y-1">
                  <span className="font-bold text-stone-900 block text-sm sm:text-base leading-snug">
                    {itemName}
                  </span>
                  
                  <div className="text-xs sm:text-sm text-stone-600 leading-normal flex flex-wrap items-center gap-1">
                    <span>Quy cách:</span>
                    <strong className="text-stone-800 font-semibold">{specLabel}</strong>
                    {item.flavor && <span>• {item.flavor}</span>}
                    {unitPrice > 0 && (
                      <span className="text-stone-400 font-mono ml-1">
                        ({unitPrice.toLocaleString('vi-VN')}đ)
                      </span>
                    )}
                  </div>

                  {/* Quà tặng theo món */}
                  {giftTitle && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/80 mt-0.5 shadow-2xs">
                      <Gift className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Tặng: {giftTitle}</span>
                    </div>
                  )}

                  {/* Thành tiền trên mobile */}
                  <div className="text-xs sm:text-sm font-black text-amber-950 font-mono sm:hidden pt-0.5">
                    {itemTotal.toLocaleString('vi-VN')}đ
                  </div>
                </div>
              </div>

              {/* Cụm điều khiển số lượng & Giá tiền */}
              <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                {/* Cụm tăng giảm số lượng tinh gọn (Nút trừ luôn là dấu trừ nhẹ nhàng) */}
                <div className="flex items-center bg-white p-1 rounded-2xl border border-stone-200/90 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleQtyChange(item, -1)}
                    className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 flex items-center justify-center font-bold text-base transition-colors cursor-pointer active:scale-95"
                    title={qty === 1 ? "Bỏ món này khỏi giỏ" : "Giảm 1"}
                  >
                    -
                  </button>
                  
                  <span className="w-8 text-center font-black font-mono text-stone-900 text-sm sm:text-base">
                    {qty}
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => handleQtyChange(item, 1)}
                    className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 flex items-center justify-center font-bold text-base transition-colors cursor-pointer active:scale-95"
                    title="Tăng 1"
                  >
                    +
                  </button>
                </div>

                {/* Duy nhất 1 nút Thùng rác xóa nhanh */}
                <button
                  type="button"
                  onClick={() => onRemoveItem && onRemoveItem(item)}
                  className="w-9 h-9 rounded-2xl bg-stone-100 hover:bg-rose-50 text-stone-400 hover:text-rose-600 border border-stone-200/80 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                  title="Xóa hẳn món này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Thành tiền Desktop */}
                <span className="hidden sm:inline-block font-mono font-black text-amber-950 whitespace-nowrap text-sm sm:text-base w-24 text-right">
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