import React from 'react';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import CheckoutSection from '../components/CheckoutSection';

export default function CheckoutPage({ 
  cart = [], 
  onSubmitOrder, 
  onNavigate, 
  shopConfig = {} 
}) {
  const cartList = Array.isArray(cart) ? cart : [];
  const totalAmount = cartList.reduce(
    (sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 
    0
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-8 overflow-hidden">
      <div>
        <button
          type="button"
          onClick={() => (onNavigate ? onNavigate('shop') : window.history.back())}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-amber-700 transition-colors bg-white px-3.5 py-2 rounded-xl border border-stone-200/80 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tiếp tục chọn thêm đặc sản</span>
        </button>
      </div>

      {cartList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200/90 p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
            <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h2 className="text-lg font-black text-stone-900">Giỏ hàng của bạn đang trống</h2>
          <p className="text-xs text-stone-500 leading-relaxed">
            Bạn chưa chọn món nào vào giỏ. Hãy ghé qua cửa hàng để chọn táo xanh, táo sấy dẻo hoặc rượu nho nhé!
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('shop')}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
            >
              Ghé Cửa Hàng Ngay
            </button>
          </div>
        </div>
      ) : (
        <CheckoutSection
          cart={cartList}
          totalAmount={totalAmount}
          onClose={() => onNavigate && onNavigate('home')}
          onSubmitOrder={onSubmitOrder}
          shopConfig={shopConfig}
        />
      )}
    </div>
  );
}
