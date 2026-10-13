import React from 'react';
import { X, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  cartItems,
  onUpdateQuantity,
  onUpdateQty,
  onRemoveItem,
  onProceedCheckout,
  onGoToCheckout
}) {
  if (!isOpen) return null;

  // Hỗ trợ cả 2 tên prop: cart hoặc cartItems
  const items = Array.isArray(cart) ? cart : (Array.isArray(cartItems) ? cartItems : []);

  const subtotal = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);

  // Xử lý tăng giảm số lượng tương thích cả truyền id lẫn index
  const handleQtyChange = (item, idx, delta) => {
    if (onUpdateQuantity) {
      onUpdateQuantity(item.id, delta);
    } else if (onUpdateQty) {
      onUpdateQty(idx, (item.quantity || 1) + delta);
    }
  };

  const handleRemove = (item, idx) => {
    if (onRemoveItem) {
      // Nếu handler nhận id hay index đều an toàn
      onRemoveItem(item.id !== undefined ? item.id : idx);
    }
  };

  const handleCheckout = () => {
    onClose();
    if (onProceedCheckout) onProceedCheckout();
    else if (onGoToCheckout) onGoToCheckout();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Lớp nền tối mờ */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-[#faf8f5] shadow-2xl flex flex-col">
          
          {/* Header giỏ hàng */}
          <div className="p-4 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-sm tracking-wide">Giỏ Hàng Của Bạn</h2>
              <span className="text-[11px] bg-stone-800 text-amber-400 px-2.5 py-0.5 rounded-full font-bold border border-stone-700">
                {items.length} món
              </span>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Danh sách các món trong giỏ */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 space-y-3 py-16">
                <div className="w-16 h-16 rounded-full bg-stone-200/60 flex items-center justify-center text-stone-400">
                  <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-700">Giỏ hàng của bạn đang trống</p>
                  <p className="text-xs text-stone-400 mt-1">Dạo quanh vườn chọn ít thức quà nhé!</p>
                </div>
              </div>
            ) : (
              items.map((item, idx) => (
                <div 
                  key={item.id || idx} 
                  className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs flex gap-3 items-center"
                >
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-16 h-16 rounded-xl object-cover bg-stone-100 shrink-0 border border-stone-100" 
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-stone-900 truncate leading-snug">{item.name}</h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Quy cách: <span className="font-semibold text-stone-700">{item.weightLabel || item.weight || item.unit || 'Tiêu chuẩn'}</span>
                      {item.flavor && <span className="ml-1 text-amber-700">({item.flavor})</span>}
                    </p>
                    <div className="text-xs font-black text-amber-800 font-mono mt-1">
                      {((item.price || 0) * (item.quantity || 1)).toLocaleString('vi-VN')}đ
                    </div>
                  </div>

                  {/* Nút cộng/trừ số lượng */}
                  <div className="flex items-center gap-1 shrink-0 bg-stone-100 p-1 rounded-xl border border-stone-200">
                    <button
                      type="button"
                      onClick={() => handleQtyChange(item, idx, -1)}
                      className="w-6 h-6 rounded-lg bg-white text-stone-700 flex items-center justify-center font-bold hover:bg-stone-200 shadow-2xs text-xs transition-colors"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold w-5 text-center text-stone-800">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleQtyChange(item, idx, 1)}
                      className="w-6 h-6 rounded-lg bg-white text-stone-700 flex items-center justify-center font-bold hover:bg-stone-200 shadow-2xs text-xs transition-colors"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(item, idx)}
                      className="p-1 ml-1 text-stone-400 hover:text-red-500 transition-colors"
                      title="Xóa món này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer tổng tiền & nút tiến hành checkout */}
          {items.length > 0 && (
            <div className="p-4 bg-white border-t border-stone-200 space-y-3 shadow-lg">
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500 font-medium">Tạm tính:</span>
                <span className="text-base font-black text-stone-900 font-mono">
                  {subtotal.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1.5 rounded-xl text-center font-medium">
                🌿 Bao bù 1 đổi 1 tận nhà nếu hoa quả dập hỏng
              </p>
              <button
                type="button"
                onClick={handleCheckout}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
              >
                <span>Tiến Hành Đặt Hàng</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
