import React, { useState, useEffect, useRef } from 'react';
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
  Compass,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Wind,
  HelpCircle,
  AlertCircle
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

// DỮ LIỆU CẨM NANG 6 NÔNG SẢN NINH THUẬN CHUẨN GỐC (KÈM TABLABEL RÕ NGHĨA)
const NINH_THUAN_EXPERIENCES = [
  {
    id: 'nho',
    tabLabel: 'Nho Đỏ & Xanh',
    title: 'Nho Đỏ & Nho Xanh Cắt Giàn Thái An',
    origin: 'Làng nho Thái An, Vĩnh Hải',
    realSigns: [
      'Chùm nho tự nhiên cuống tươi xanh, quả khít đều vừa phải chứ không tròn to căng bóng bất thường.',
      'Nho đỏ Red Cardinal có màu đỏ tím phơn phớt cánh gián, hạt giòn dễ tách, vị chua ngọt thanh nhẹ.',
      'Nho xanh NH01-48 vỏ dày dặn hơn một chút, có lớp phấn tự nhiên bảo vệ quả, ngọt thanh giòn rụm.'
    ],
    fakeWarning: 'Tránh loại nho vỏ đen thẫm, trái to mọng mướt mắt không hạt, cuống héo rũ nhưng quả vẫn mềm nhũn tẩm ướp.',
    badge: 'Nông Sản Giàn Nắng'
  },
  {
    id: 'tao',
    tabLabel: 'Táo Gió Mật',
    title: 'Táo Gió Giòn Mật Hái Sớm',
    origin: 'Vườn Phước Hậu, Ninh Phước',
    realSigns: [
      'Vỏ quả táo gió màu xanh ngả vàng mơ tự nhiên, da căng bóng vừa phải, có thể có vết rám nắng nhẹ.',
      'Cầm chắc tay, cắn vào giòn tan rôm rốp, mọng nước, hậu vị ngọt thơm thanh tao mát cổ.',
      'Người làm vườn bọc màn lưới bao trái từ nhỏ để ngừa ruồi đục quả mà không phun xịt hóa chất.'
    ],
    fakeWarning: 'Cẩn thận táo trữ lạnh lâu ngày cuống thâm đen, thịt quả xốp mềm, vỏ ngoài bóng nhẫy sáp bảo quản.',
    badge: 'Đặc Sản Giòn Ngọt'
  },
  {
    id: 'toi',
    tabLabel: 'Tỏi Cô Đơn',
    title: 'Tỏi Cô Đơn & Tỏi Nhánh Nhơn Hải',
    origin: 'Bán đảo Nhơn Hải - Vĩnh Hải',
    realSigns: [
      'Củ tỏi chắc nịch, tép nhỏ đều, rễ cắt sát khô sạch, vỏ ngoài trắng ngà vân tím nhạt tự nhiên.',
      'Khi bóc vỏ tép tỏi thơm nồng nàn, vị cay đượm ấm bụng mà không hăng rát cuống họng.',
      'Trồng trên đất cát pha san hô biển và tưới nước lợ nên hàm lượng tinh dầu và dược tính cao vượt trội.'
    ],
    fakeWarning: 'Tránh nhầm với tỏi nhập củ to tròn đều chằn chặn, tép to xốp, ruột nhiều nước nhưng mùi vị nhạt nhẽo.',
    badge: 'Dược Liệu Đất Nắng'
  },
  {
    id: 'hanh',
    tabLabel: 'Hành Tím',
    title: 'Hành Tím Đất Cát Phan Rang',
    origin: 'Vựa hành Mỹ Tường, Ninh Hải',
    realSigns: [
      'Củ hành tròn chắc, vỏ khô nhiều lớp mỏng màu đỏ tía rực rỡ, bảo quản tự nhiên 4-6 tháng không teo tóp.',
      'Tép hành cay thơm đậm vị, phi lên vàng giòn thơm nức mũi mà không bị ỉu mềm.',
      'Thu hoạch chính vụ mùa nắng gắt nên củ khô ráo, không bị ẩm mốc ruột trong.'
    ],
    fakeWarning: 'Không chọn loại hành củ dài to bất thường, vỏ ướt sũng hoặc nhuộm phẩm màu dễ thối rữa sau vài ngày.',
    badge: 'Gia Vị Gác Bếp'
  },
  {
    id: 'muc',
    tabLabel: 'Mực Một Nắng',
    title: 'Mực Một Nắng Dẻo Nước Sâu Cà Ná',
    origin: 'Làng chài biển mặn Cà Ná',
    realSigns: [
      'Chỉ xẻ từ mực ống tươi dong thuyền câu trong đêm, ráo nước biển rồi phơi đúng duy nhất 1 nắng giòn gắt.',
      'Bề mặt mực khô ráo, thịt bên trong mềm ngọt dẻo quánh, khi nướng nở phồng thơm phức vị biển.',
      'Bụng mực trắng đục tự nhiên, lưng còn nguyên lớp phấn hồng phơn phớt.'
    ],
    fakeWarning: 'Tránh mực ngâm nước tăng trọng lượng: sờ vào mềm nhũn ướt tay, khi nướng teo tóp ra nhiều nước đục.',
    badge: 'Hải Sản Khô Thượng Hạng'
  },
  {
    id: 'mat_nho',
    tabLabel: 'Mật Nho Chum',
    title: 'Mật Nho & Rượu Nho Men Chum Sành',
    origin: 'Ủ gia truyền Phước Sanh, Phan Rang',
    realSigns: [
      'Chưng cất từ 100% trái nho chín kỹ ủ cùng đường phèn nguyên chất trong chum sành phơi nắng trời.',
      'Mật có màu đỏ cánh gián sánh quyện tự nhiên, vị ngọt thanh mát, chua nhẹ hậu vị chứ không gắt khé cổ.',
      'Mở nắp dậy mùi thơm nồng nàn của men nho ủ ráo nắng, để càng lâu hương vị càng sâu.'
    ],
    fakeWarning: 'Cảnh giác mật nho pha hương liệu màu tổng hợp: nước lỏng toẹt, ngọt gắt đường hóa học và lắng cặn đục đáy.',
    badge: 'Ủ Men Truyền Thống'
  }
];

export default function HomePage({ 
  products = [], 
  categories = [], 
  onAddToCart, 
  onNavigateShop, 
  onNavigateStory, 
  onNavigate 
}) {
  const scrollRef = useRef(null);

  // Cuộn ngang dải danh mục 1 hàng
  const scrollCategories = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

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

  // 8 sản phẩm tiêu biểu cho 2 hàng
  const featuredProducts = Array.isArray(products) && products.length > 0 
    ? products.slice(0, 8) 
    : [];

  const displayCategories = categories.filter(c => c.id !== 'all');

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16 animate-fadeIn font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* ================= 1. HERO BANNER: VĂN HÓA & TINH THẦN ĐẤT NẮNG ================= */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 text-white shadow-2xl border border-stone-800/80 min-h-[460px] sm:min-h-[500px] flex items-center">
        <img
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1600&q=80"
          alt="Nắng Gió Ninh Thuận"
          className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity scale-105 hover:scale-100 transition-transform duration-1000 ease-out"
        />
        
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl p-6 sm:p-12 lg:p-16 space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-amber-400/30 text-amber-300 text-xs font-bold tracking-wide shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>NÔNG SẢN & KÝ SỰ BẢN ĐỊA PHAN RANG</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
            Nắng Gom Vị Ngọt, <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200 bg-clip-text text-transparent">
              Gió Biển Chắt Vị Đậm Đà.
            </span>
          </h1>

          <p className="text-xs sm:text-base text-stone-300 leading-relaxed font-light max-w-2xl">
            Không chỉ là buôn bán nông sản — đây là góc sẻ chia nếp sống dưới chân dãy Núi Chúa: từ vườn táo ngọt giòn Phước Hậu, giàn nho chín rộm Thái An đến những mẻ chả cá quết tươi ở làng biển nước mặn Cà Ná.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              type="button"
              onClick={() => goToShop('all')}
              className="group px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2.5 shadow-lg shadow-amber-950/40 transition-all active:scale-95 cursor-pointer"
            >
              <span>Ghé Chợ Quê Xứ Nắng</span>
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

      {/* ================= 2. KHÁM PHÁ DANH MỤC: GIỮ NGUYÊN 1 HÀNG TUYỆT ĐỐI (NOWRAP) + NÚT TRƯỢT & THANH CUỘN ================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-amber-600" />
            <span>Khám phá các gian hàng quê</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollCategories('left')}
              className="w-7 h-7 rounded-full bg-white border border-stone-200 hover:border-amber-500 text-stone-600 hover:text-amber-700 flex items-center justify-center shadow-2xs transition-all cursor-pointer"
              title="Cuộn sang trái"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollCategories('right')}
              className="w-7 h-7 rounded-full bg-white border border-stone-200 hover:border-amber-500 text-stone-600 hover:text-amber-700 flex items-center justify-center shadow-2xs transition-all cursor-pointer"
              title="Cuộn sang phải"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            
            <button
              type="button"
              onClick={() => goToShop('all')}
              className="text-xs font-bold text-amber-800 hover:underline inline-flex items-center gap-1 ml-2"
            >
              <span>Tất cả ({products.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="relative group/scroll">
          <div 
            ref={scrollRef}
            className="flex items-center gap-2.5 overflow-x-auto pb-2.5 pt-1 px-1 scroll-smooth select-none [scrollbar-color:#d6d3d1_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-300 hover:[&::-webkit-scrollbar-thumb]:bg-amber-400 [&::-webkit-scrollbar-track]:bg-transparent"
            style={{ whiteSpace: 'nowrap' }}
          >
            <button
              type="button"
              onClick={() => goToShop('all')}
              className="shrink-0 px-4 py-2.5 rounded-2xl bg-amber-800 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer hover:bg-amber-900"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Toàn Bộ ({products.length})</span>
            </button>

            {displayCategories.map((cat) => {
              const IconComponent = ICON_MAP[cat.icon] || Sparkles;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => goToShop(cat.id)}
                  className="shrink-0 px-4 py-2.5 rounded-2xl bg-white border border-stone-200 hover:border-amber-600 hover:text-amber-800 text-stone-700 text-xs font-bold shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer group"
                >
                  <IconComponent className="w-3.5 h-3.5 text-amber-700 group-hover:scale-110 transition-transform" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= 3. GÓC VĂN HÓA BẢN ĐỊA: KHÍ HẬU & THỔ NHƯỠNG ĐẶC THÙ ================= */}
      <section className="bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 rounded-3xl p-6 sm:p-8 border border-amber-200/70 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/50 pb-4">
          <div className="space-y-1">
            <span className="text-amber-800 text-xs font-black tracking-wider uppercase flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-600" />
              <span>Gió như phang, nắng như rang</span>
            </span>
            <h3 className="text-lg sm:text-xl font-black text-stone-900">
              Vì Sao Đất Càng Khắc Nghiệt, Trái Lại Càng Đậm Vị?
            </h3>
          </div>
          <p className="text-xs text-stone-500 max-w-sm">
            Ninh Thuận có hơn 2.800 giờ nắng/năm — lượng bốc hơi cao gấp 2 lần lượng mưa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Sun className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-stone-900">Quang Hợp Cực Đại</h4>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              Nắng chiếu từ sáng sớm đến tận chiều tà giúp cây nho và táo gió tích lũy lượng đường tự nhiên cao vượt trội so với các vùng đất ẩm mát.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center font-bold">
              <Wind className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-stone-900">Gió Biển Chống Nấm Mốc</h4>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              Gió biển thổi qua giàn liên tục làm khô ráo tán lá tự nhiên, hạn chế sâu bệnh mà không cần can thiệp hóa chất bảo vệ thực vật.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Droplets className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-stone-900">Mạch Nước Phù Sa Pha Cát</h4>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              Hệ thống mương dẫn thủy lợi cổ Champa đưa nguồn nước phù sa sông Dinh bồi đắp cho từng gốc nho, giữ cho thịt quả chắc, vỏ mỏng.
            </p>
          </div>
        </div>
      </section>

      {/* ================= 4. KINH NGHIỆM CHỌN NÔNG SẢN SẠCH (TỰ ĐỔI MỖI 5 GIÂY, TAB ĐẦY ĐỦ TÊN) ================= */}
      <ExperienceGuideSection />

      {/* ================= 5. BỐN CAM KẾT VƯỜN QUÊ ================= */}
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
            desc: "Nắng phơi mộc, không phẩm màu" 
          },
          { 
            icon: Truck, 
            title: "Ship Thùng Xốp", 
            desc: "Chèn rơm chống dập, ướp đá gel" 
          },
          { 
            icon: RefreshCw, 
            title: "Bảo Hành Tươi Ngon", 
            desc: "Bù hàng ngay nếu dập nát gửi xe" 
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

      {/* ================= 6. MÓN NGON TUYỂN CHỌN HÔM NAY ================= */}
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

      {/* ================= 7. BANNER KÝ SỰ: MỜI GHÉ THĂM CHUYỆN VƯỜN ================= */}
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

// =========================================================================
// COMPONENT CON: KINH NGHIỆM CHỌN NÔNG SẢN SẠCH (AUTO ROTATE 5S)
// =========================================================================
function ExperienceGuideSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Tự động chuyển đổi sau mỗi 5 giây (tự dừng khi người dùng hover chuột để đọc kỹ)
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % NINH_THUAN_EXPERIENCES.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused]);

  const currentItem = NINH_THUAN_EXPERIENCES[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + NINH_THUAN_EXPERIENCES.length) % NINH_THUAN_EXPERIENCES.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % NINH_THUAN_EXPERIENCES.length);
  };

  return (
    <section 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6 transition-all"
    >
      {/* Header thanh điều hướng */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-amber-800 text-xs font-black tracking-wider uppercase">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>Kinh nghiệm chọn nông sản sạch bản địa</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-stone-900 mt-0.5">
            Mẹo Nhà Nông Phân Biệt Đặc Sản Ninh Thuận Thật
          </h3>
        </div>

        {/* Nút lướt và bộ đếm */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <span className="text-xs font-mono font-bold text-stone-400">
            {currentIndex + 1} / {NINH_THUAN_EXPERIENCES.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              className="w-8 h-8 rounded-full border border-stone-200 hover:border-amber-600 hover:bg-amber-50 text-stone-600 hover:text-amber-800 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              title="Xem đặc sản trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="w-8 h-8 rounded-full border border-stone-200 hover:border-amber-600 hover:bg-amber-50 text-stone-600 hover:text-amber-800 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              title="Xem đặc sản kế tiếp"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs chọn nhanh từng nông sản: Dùng chính xác tabLabel đầy đủ */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none]">
        {NINH_THUAN_EXPERIENCES.map((exp, idx) => (
          <button
            key={exp.id}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              idx === currentIndex
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
            }`}
          >
            {exp.tabLabel}
          </button>
        ))}
      </div>

      {/* Nội dung chi tiết hiển thị mượt mà */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Cột trái: Dấu hiệu hàng thật chuẩn gốc */}
        <div className="lg:col-span-8 p-5 sm:p-6 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[11px] font-black text-amber-900 bg-amber-100/90 border border-amber-300 px-2.5 py-0.5 rounded-lg">
                {currentItem.badge}
              </span>
              <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-700" />
                {currentItem.origin}
              </span>
            </div>

            <h4 className="text-base sm:text-lg font-black text-stone-900">
              {currentItem.title}
            </h4>

            <div className="space-y-2 pt-1">
              {currentItem.realSigns.map((sign, sIdx) => (
                <div key={sIdx} className="flex items-start gap-2.5 text-xs text-stone-700 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{sign}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 text-[11px] text-stone-400 italic">
            * Mẹo nhỏ: Di chuột vào khung để tạm dừng tự động lướt.
          </div>
        </div>

        {/* Cột phải: Dấu hiệu cảnh báo hàng tẩm ướp / trôi nổi */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-2xl bg-rose-50/60 border border-rose-200/80 flex flex-col justify-center space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Cách tránh hàng kém chất lượng</span>
          </div>

          <p className="text-xs text-rose-950/80 leading-relaxed font-light">
            {currentItem.fakeWarning}
          </p>

          <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between text-[11px] text-rose-700 font-bold">
            <span>Bao ăn tận miệng</span>
            <span>Đổi trả nếu dập hỏng</span>
          </div>
        </div>
      </div>
    </section>
  );
}