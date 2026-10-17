import React from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2,
  Apple, 
  Fish, 
  Wine, 
  Sun, 
  Flame, 
  ShoppingBag, 
  Leaf, 
  Heart,
  Sprout,
  Compass
} from 'lucide-react';
import ProductCard from '../components/ProductCard';

const ICON_MAP = {
  Apple, 
  Sparkles, 
  Fish, 
  Wine, 
  Sun, 
  Flame, 
  ShoppingBag, 
  Leaf, 
  Heart
};

export default function HomePage({ 
  products = [], 
  categories = [], 
  onAddToCart, 
  onNavigateShop, 
  onNavigateStory, 
  onNavigate 
}) {
  const goToShop = (catId = 'all') => {
    if (onNavigateShop) {
      onNavigateShop(catId);
    } else if (onNavigate) {
      onNavigate('shop');
    }
  };

  const goToStory = () => {
    if (onNavigateStory) onNavigateStory();
    else if (onNavigate) onNavigate('story');
  };

  // Lấy 8 sản phẩm tiêu biểu để lấp đầy 2 hàng (mỗi hàng 4 card chuẩn max-w-7xl)
  const featuredProducts = Array.isArray(products) && products.length > 0 
    ? products.slice(0, 8) 
    : [];

  const displayCategories = categories.filter(c => c.id !== 'all');

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14 animate-fadeIn font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* ================= 1. HERO BANNER: TINH THẦN ĐẤT NẮNG ================= */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 text-white shadow-2xl border border-stone-800/80 min-h-[480px] sm:min-h-[520px] flex items-center">
        {/* Ảnh nền phủ lớp gradient mờ */}
        <img
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1600&q=80"
          alt="Nắng Gió Ninh Thuận"
          className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity scale-105 hover:scale-100 transition-transform duration-1000 ease-out"
        />
        
        {/* Vệt sáng trang trí */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl p-6 sm:p-12 lg:p-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-amber-400/30 text-amber-300 text-xs font-bold tracking-wide shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>NÔNG SẢN & ĐẶC SẢN CHÍNH GỐC PHAN RANG</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
            Vị Ngọt Giàn Nắng, <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200 bg-clip-text text-transparent">
              Đậm Đà Vị Biển Quê Hương.
            </span>
          </h1>

          <p className="text-xs sm:text-base text-stone-300 leading-relaxed font-light max-w-2xl">
            Trực tiếp từ vườn nhà Phước Hậu và làng chài Cà Ná: Táo gió giòn tan mọng nước, nho sấy dẻo phơi nắng trời, chả cá quết tươi không hàn the và mật nho ủ men chum sành truyền thống.
          </p>

          {/* Nút hành động */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              type="button"
              onClick={() => goToShop('all')}
              className="group px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2.5 shadow-lg shadow-amber-950/40 transition-all active:scale-95 cursor-pointer"
            >
              <span>Xem Toàn Bộ Đặc Sản</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              type="button"
              onClick={goToStory}
              className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-stone-200 hover:text-white font-semibold text-xs sm:text-sm border border-white/20 backdrop-blur-xs transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Sprout className="w-4 h-4 text-amber-400" />
              <span>Chuyện Người Làm Vườn</span>
            </button>
          </div>

          {/* Quick checklist */}
          <div className="pt-2 flex flex-wrap items-center gap-5 text-[11px] text-stone-400 font-medium border-t border-white/10">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Hái sớm tinh mơ 5h30
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Gửi xe khách trong đêm
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Đổi trả nếu dập hỏng
            </span>
          </div>
        </div>
      </section>

      {/* ================= 2. KHÁM PHÁ THEO DANH MỤC (PILLS) ================= */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-amber-600" />
            <span>Khám phá các gian hàng quê</span>
          </p>
          <button
            type="button"
            onClick={() => goToShop('all')}
            className="text-xs font-bold text-amber-800 hover:underline inline-flex items-center gap-1"
          >
            <span>Tất cả ({products.length})</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto py-2 px-1 [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Nút Xem tất cả */}
          <button
            type="button"
            onClick={() => goToShop('all')}
            className="shrink-0 px-4 py-2.5 rounded-2xl bg-amber-800 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Toàn Bộ ({products.length})</span>
          </button>

          {/* Các danh mục động từ Sheet */}
          {displayCategories.map((cat) => {
            const IconComponent = ICON_MAP[cat.icon] || Sparkles;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => goToShop(cat.id)}
                className="shrink-0 px-4 py-2.5 rounded-2xl bg-white border border-stone-200/90 hover:border-amber-600 hover:text-amber-800 text-stone-700 text-xs font-bold shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer group"
              >
                <IconComponent className="w-3.5 h-3.5 text-amber-700 group-hover:scale-110 transition-transform" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ================= 3. BỐN CAM KẾT VƯỜN QUÊ ================= */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {[
          { 
            icon: CheckCircle2, 
            title: "Bao Ăn Tận Miệng", 
            desc: "Chuẩn vị giòn ngọt, không ngon hoàn tiền" 
          },
          { 
            icon: ShieldCheck, 
            title: "100% Nguyên Bản", 
            desc: "Nắng phơi mộc, không tẩm ướp phẩm màu" 
          },
          { 
            icon: Truck, 
            title: "Ship Thùng Xốp", 
            desc: "Chèn rơm chống dập, ướp đá gel cẩn thận" 
          },
          { 
            icon: RefreshCw, 
            title: "Bảo Hành Tươi Ngon", 
            desc: "Bù hàng ngay lập tức nếu dập nát gửi xe" 
          },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div 
              key={i} 
              className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 flex flex-col sm:flex-row items-start sm:items-center gap-3.5 shadow-2xs hover:shadow-xs hover:border-amber-300 transition-all duration-200"
            >
              <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/70 shrink-0">
                <Icon className="w-5 h-5 text-amber-600" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs sm:text-sm font-bold text-stone-900">{item.title}</h4>
                <p className="text-[11px] text-stone-500 leading-snug font-light">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* ================= 4. MÓN NGON TUYỂN CHỌN HÔM NAY ================= */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-stone-200 pb-4 gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider">
              <Sun className="w-4 h-4 text-amber-600" />
              <span>Thu hoạch sáng nay</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-1">
              Món Ngon Tuyển Chọn Vừa Cắt Giàn
            </h2>
          </div>
          
          <button
            type="button"
            onClick={() => goToShop('all')}
            className="group text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>Xem tất cả gian hàng ({products.length} món)</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="p-16 text-center text-stone-400 text-xs bg-white rounded-3xl border border-dashed border-stone-300 space-y-2">
            <ShoppingBag className="w-8 h-8 mx-auto text-stone-300 stroke-[1.5]" />
            <p>Đang cập nhật danh sách nông sản thu hoạch hôm nay...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((p) => (
              <ProductCard 
                key={p.id} 
                product={p} 
                onAddToCart={onAddToCart} 
              />
            ))}
          </div>
        )}
      </section>

      {/* ================= 5. BANNER DẪN LỐI: CHUYỆN VƯỜN & MÙA VỤ ================= */}
      <section className="relative overflow-hidden bg-gradient-to-r from-amber-900 via-stone-900 to-stone-900 text-white rounded-3xl p-7 sm:p-10 shadow-xl border border-stone-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-bold">
            <Heart className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Ký sự người trồng nho & táo Phan Rang</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Muốn hiểu vì sao quả ngọt đậm sâu giữa đất nung rát nắng?
          </h3>
          <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed">
            Mời bạn ghé xem nhật ký mùa vụ, xem cách người làm vườn bọc từng túi táo sinh học và phơi ráo từng mẻ nho dưới gió biển Cà Ná.
          </p>
        </div>

        <button
          type="button"
          onClick={goToStory}
          className="group px-6 py-3.5 rounded-2xl bg-white text-stone-900 hover:bg-amber-100 font-bold text-xs shrink-0 transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
        >
          <span>Đọc Chuyện Xứ Nắng Gió</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-amber-800" />
        </button>
      </section>

    </div>
  );
}