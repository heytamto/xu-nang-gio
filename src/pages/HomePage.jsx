import React from 'react';
import { ArrowRight, ShieldCheck, Truck, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import ProductCard from '../components/ProductCard';

export default function HomePage({ products = [], onAddToCart, onNavigateShop, onNavigateStory, onNavigate }) {
  // Điều hướng linh hoạt dù App truyền kiểu nào
  const goToShop = () => {
    if (onNavigateShop) onNavigateShop();
    else if (onNavigate) onNavigate('shop');
  };

  const goToStory = () => {
    if (onNavigateStory) onNavigateStory();
    else if (onNavigate) onNavigate('story');
  };

  const featuredProducts = Array.isArray(products) ? products.slice(0, 3) : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-12 sm:space-y-16 overflow-hidden">
      {/* Hero Banner */}
      <section className="relative rounded-3xl overflow-hidden bg-stone-900 text-white shadow-xl min-h-[460px] flex items-center">
        <img
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1400&q=80"
          alt="Vườn Nắng Gió Trường Sanh"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div className="relative max-w-2xl p-6 sm:p-12 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/25 border border-amber-400/40 text-amber-300 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CAM KẾT VƯỜN NHÀ: KHÔNG NGỌT KHÔNG LẤY TIỀN</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Táo Xanh Ninh Thuận, <br />
            <span className="text-amber-400">Giòn Rụm & Ngọt Thanh.</span>
          </h1>
          <p className="text-sm sm:text-base text-stone-200 leading-relaxed font-light">
            Trực tiếp từ giàn vườn nhà Thôn Trường Sanh, Xã Phước Hậu. Táo xanh hái già đẫy cành, cắn giòn ngập nước, táo sấy dẻo 3 vị thủ công và rượu nho ủ chum sành 12 tháng.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={goToShop}
              className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95"
            >
              <span>Đặt Mua Ăn Thử Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={goToStory}
              className="px-5 py-3 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-200 font-semibold text-sm border border-stone-600 transition-all active:scale-95"
            >
              Chuyện Vườn Nhà
            </button>
          </div>
        </div>
      </section>

      {/* Cam kết 4 trụ cột */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: CheckCircle2, title: "Bao Ăn Tận Miệng", desc: "Không ngọt không lấy tiền" },
          { icon: ShieldCheck, title: "100% Tự Nhiên", desc: "Không hóa chất bảo quản" },
          { icon: Truck, title: "Ship Tỉnh An Toàn", desc: "Bọc xốp chống dập từng quả" },
          { icon: RefreshCw, title: "Đổi Bù 100%", desc: "Hỏng bù ngay không đôi co" },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="bg-white p-4 rounded-2xl border border-stone-200 flex items-start gap-3 shadow-xs">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-800">{item.title}</h4>
                <p className="text-[11px] text-stone-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Sản phẩm nổi bật */}
      <section className="space-y-6">
        <div className="flex justify-between items-end border-b border-stone-200 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900">Món Ngon Vườn Tuyển Chọn</h2>
            <p className="text-xs text-stone-500 mt-1">Hái tươi mỗi sáng & Chế biến thủ công gia đình</p>
          </div>
          <button
            type="button"
            onClick={goToShop}
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 transition-colors"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="p-12 text-center text-stone-400 text-xs bg-white rounded-2xl border border-stone-200">
            Đang cập nhật danh sách nông sản hôm nay...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
