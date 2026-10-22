// src/pages/HomePage.jsx
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
  ChevronLeft,
  ChevronRight,
  Droplets,
  Wind,
  HelpCircle,
  AlertCircle,
  Clock,
  Award,
  Calendar,
  Star,
  PackageCheck
} from 'lucide-react';
import ProductCard from '../components/ProductCard';

// Bản đồ Icon dự phòng theo chuẩn 3NF
const CATEGORY_ID_ICON_MAP = {
  cat01: Sparkles,    // Combo Ưu Đãi
  cat02: Apple,       // Trái Cây Tươi Giàn
  cat03: Flame,       // Nem & Chả Đặc Sản
  cat04: Fish,        // Hải Sản Gió Biển
  cat05: Wine,        // Gia Vị Xứ Nắng / Mật Nho
  cat06: Leaf         // Đặc Sản Sấy Dẻo
};

// DỮ LIỆU LỊCH MÙA VỤ BẢN ĐỊA PHAN RANG
const HARVEST_SEASONS = [
  {
    name: "Nho Đỏ Red Cardinal",
    season: "Tháng 3 - Tháng 8",
    status: "Đang chính vụ rộ",
    statusColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    desc: "Cắt giàn quả ngọt lịm, vị thanh mát, mọng nước nhất năm."
  },
  {
    name: "Táo Gió Mật Phước Hậu",
    season: "Quanh năm (Rộ T11 - T4)",
    status: "Thu hoạch mỗi sớm",
    statusColor: "bg-amber-100 text-amber-900 border-amber-300",
    desc: "Bọc túi màn sinh học, cắn rôm rốp giòn tan mọng nước."
  },
  {
    name: "Tỏi Cô Đơn Nhơn Hải",
    season: "Tháng 1 - Tháng 3",
    status: "Hàng gác bếp ráo nắng",
    statusColor: "bg-stone-200 text-stone-800 border-stone-300",
    desc: "Phơi khô ráo vỏ, dược tính và tinh dầu đậm đặc nhất."
  },
  {
    name: "Mực Một Nắng Cà Ná",
    season: "Tháng 4 - Tháng 9",
    status: "Câu đêm phơi gắt",
    statusColor: "bg-cyan-100 text-cyan-900 border-cyan-300",
    desc: "Dong thuyền câu mực ống đêm, dẻo ngọt thơm lừng mùi biển."
  }
];

// DỮ LIỆU ĐÁNH GIÁ CHÂN THỰC TỪ KHÁCH HÀNG
const CUSTOMER_REVIEWS = [
  {
    name: "Chị Ánh Tuyết",
    role: "Khách quen tại Quận 7, TP.HCM",
    content: "Được bạn đồng nghiệp giới thiệu đặt thử chùm nho xanh với táo gió, mở thùng xốp ra cuống còn tươi rói chảy mủ luôn. Vị chua ngọt tự nhiên chứ không phải ngọt kiểu ngâm đường. Cả nhà ai cũng khen!",
    rating: 5,
    tag: "Đơn mua lần 4"
  },
  {
    name: "Anh Hoàng Nam",
    role: "Khách gửi quà ra Ba Đình, Hà Nội",
    content: "Ấn tượng khâu đóng gói chèn rơm với đá gel cực kỳ chu đáo. Gửi xe ra tới Hà Nội 2 ngày mà quả táo không hề bị thâm hay cấn dập một quả nào. Mật nho sền sệt pha đá uống giải nhiệt bao đã.",
    rating: 5,
    tag: "Đã kiểm chứng"
  },
  {
    name: "Cô Mỹ Hạnh",
    role: "Khách quen tại Hải Châu, Đà Nẵng",
    content: "Chả cá quết dẻo dai thơm tiêu sọ, nướng sơ qua chấm muối ớt chanh ăn nghiện luôn. Thích nhất cách nhà vườn thật thà, có sao nói vậy, nông sản nguồn gốc rõ ràng nên rất yên tâm.",
    rating: 5,
    tag: "Khách thân thiết"
  }
];

// DỮ LIỆU CẨM NANG 10 NÔNG SẢN NINH THUẬN CHUẨN GỐC
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
    storageTip: 'Chưa rửa khi chưa ăn; để ngăn mát tủ lạnh bọc giấy báo giữ được 7–10 ngày cuống vẫn xanh tươi.',
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
    storageTip: 'Rửa sạch ngâm nước muối loãng, để mát ăn giòn rụm mát lạnh suốt tuần.',
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
    storageTip: 'Treo nơi thoáng gió râm mát, tuyệt đối không bỏ túi nilon kín hay để trong tủ lạnh.',
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
    storageTip: 'Rải ra rổ tre hoặc túi lưới nơi thoáng gió, bảo quản được 4–6 tháng.',
    badge: 'Gia Vị Gác Bếp'
  },
  {
    id: 'mang_tay',
    tabLabel: 'Măng Tây Xanh',
    title: 'Măng Tây Xanh Đất Cát Phù Sa',
    origin: 'Cánh đồng cát An Hải, Ninh Phước',
    realSigns: [
      'Đọt măng thon thẳng, chồi búp bọc chặt không bung nở, gốc măng mướt giòn không bị xơ xơ già cỗi.',
      'Thu hoạch tinh mơ lúc 4h sáng khi sương còn đọng, thân cây giòn ngọt, giàu chất xơ tự nhiên.',
      'Trồng bằng phân ủ mục hữu cơ và bón phân chuồng tự nhiên trên bãi cát ven biển.'
    ],
    fakeWarning: 'Cẩn thận măng ngâm nước tẩy trắng phần gốc, thân teo tóp uể oải, búp hoa nở bung rơi rụng.',
    storageTip: 'Cắm gốc vào cốc nước sâu 2cm hoặc bọc khăn ẩm quấn gốc rồi cất ngăn mát tủ lạnh.',
    badge: 'Vua Rau Màu Cát'
  },
  {
    id: 'cha_ca',
    tabLabel: 'Chả Cá Quết',
    title: 'Chả Cá Đỏ Củ & Cá Nhồng Quết Mộc',
    origin: 'Cảng cá Đông Hải & Cà Ná',
    realSigns: [
      'Quết 100% từ cá đỏ củ, cá mối, cá nhồng tươi cập bến trong ngày, dẻo quánh tự nhiên nhờ lực quết tay.',
      'Miếng chả khi chiên hoặc hấp phồng đều, thơm dậy mùi tiêu sọ hành tím, vị ngọt đượm thịt cá biển sâu.',
      'Mặt chả hơi sần sùi mộc mạc chứ không bóng loáng, nhẵn thín hay dai giòn sần sật bất thường.'
    ],
    fakeWarning: 'Tránh xa loại chả cá dai đanh do trộn hàn the hoặc độn nhiều bột mì, khi chiên teo xẹp nhăn nheo.',
    storageTip: 'Hút chân không để ngăn đông giữ vị ngon 3 tháng; trước khi ăn rã đông tự nhiên rồi áp chảo sơ.',
    badge: 'Đặc Sản Làng Biển'
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
    storageTip: 'Bọc kín túi zipper hoặc hút chân không để ngăn đông -18°C, tránh lẫn mùi với đồ sống.',
    badge: 'Hải Sản Khô Thượng Hạng'
  },
  {
    id: 'nuoc_mam',
    tabLabel: 'Nước Mắm Cà Ná',
    title: 'Nước Mắm Nhĩ Cá Cơm Than Truyền Thống',
    origin: 'Làng nghề nước mắm Cà Ná',
    realSigns: [
      'Ủ ròng rã 12–18 tháng từ cá cơm than béo mẫm và muối hạt sạch Phan Rang theo tỷ lệ vàng 3 cá : 1 muối.',
      'Nước mắm có màu hổ phách nâu đỏ sóng sánh, mùi thơm nồng nàn dịu êm, hậu vị ngọt đượm nơi cuống họng.',
      'Độ đạm tự nhiên từ 30–40 độ đạm nguyên chất, không cần pha hương liệu hay chất tạo sánh.'
    ],
    fakeWarning: 'Cảnh giác nước mắm công nghiệp lỏng le lỏng lét, ngọt lợ vị bột ngọt mì chính và phẩm màu hóa học.',
    storageTip: 'Đậy chặt nắp sau khi rót, để nơi khô mát tránh ánh nắng trực tiếp; có thể đọng muối đáy chai là bình thường.',
    badge: 'Gia Vị Biển Mặn'
  },
  {
    id: 'mat_nho',
    tabLabel: 'Mật Nho',
    title: 'Mật Nho & Rượu Nho Men Chum Sành',
    origin: 'Ủ gia truyền Phước Sanh, Phan Rang',
    realSigns: [
      'Chưng cất từ 100% trái nho chín kỹ ủ cùng đường phèn nguyên chất trong chum sành phơi nắng trời.',
      'Mật có màu đỏ cánh gián sánh quyện tự nhiên, vị ngọt thanh mát, chua nhẹ hậu vị chứ không gắt khé cổ.',
      'Mở nắp dậy mùi thơm nồng nàn của men nho ủ ráo nắng, để càng lâu hương vị càng sâu.'
    ],
    fakeWarning: 'Cảnh giác mật nho pha hương liệu màu tổng hợp: nước lỏng toẹt, ngọt gắt đường hóa học và lắng cặn đục đáy.',
    storageTip: 'Để ở nhiệt độ phòng hoặc ngăn mát; pha với nước đá và vài giọt tắc/chanh giải nhiệt cực đã.',
    badge: 'Ủ Men Truyền Thống'
  },
  {
    id: 'hat_dieu',
    tabLabel: 'Hạt Điều Rang Củi',
    title: 'Hạt Điều Vỏ Lụa Rang Củi Truyền Thống',
    origin: 'Nương rẫy Bình Sơn, Ninh Hải',
    realSigns: [
      'Hạt điều kích cỡ đều vừa vặn, còn nguyên lớp vỏ lụa nâu mỏng bảo vệ nhân hạt khỏi cháy xém.',
      'Rang thủ công trên chảo gang đun củi cà phê, hạt giòn rụm, vị ngọt bùi béo ngậy nguyên bản.',
      'Chỉ rang cùng một lượng muối biển hạt vừa đủ để tăng độ ngọt bùi chứ không mặn chát.'
    ],
    fakeWarning: 'Tránh hạt điều ngâm hóa chất tẩy trắng vỏ, hạt ẩm mốc ỉu mềm hoặc chiên dầu công nghiệp hôi dầu.',
    storageTip: 'Đậy kín nắp hũ sau khi ăn, tránh để hở gió làm hạt bị ỉu mất độ giòn.',
    badge: 'Hạt Dinh Dưỡng Rừng Khô'
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

  const scrollCategories = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
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

  const featuredProducts = Array.isArray(products) && products.length > 0 
    ? [...products]
        .sort((a, b) => {
          if (a.category === 'cat01' && b.category !== 'cat01') return -1;
          if (b.category === 'cat01' && a.category !== 'cat01') return 1;
          return 0;
        })
        .slice(0, 8) 
    : [];

  const displayCategories = categories.filter(c => c.id !== 'all');

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-16 animate-fadeIn font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* ================= 1. HERO BANNER MẶT TIỀN: PHONG CÁCH VƯỜN ĐẲNG CẤP ================= */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-stone-950 via-[#1c1917] to-amber-950 text-white shadow-2xl border border-stone-800/80 p-6 sm:p-10 lg:p-14">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* CỘT TRÁI: THƯƠNG HIỆU & HÀNH ĐỘNG */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-black tracking-wide shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>NÔNG SẢN CẮT GIÀN & KÝ SỰ BẢN ĐỊA PHAN RANG</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black tracking-tight text-white leading-[1.15]">
              Nắng Gom Vị Ngọt, <br />
              <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-orange-300 bg-clip-text text-transparent">
                Gió Chắt Vị Đậm Đà.
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-light max-w-xl">
              Nông sản thuần tự nhiên dưới chân dãy Núi Chúa: từ vườn táo giòn rụm Phước Hậu, giàn nho chín mọng Thái An đến mẻ chả cá quết tươi làng biển Cà Ná. Hái sớm tinh mơ và gửi đến bạn nguyên vẹn vị đất trời.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => goToShop('all')}
                className="group px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-lg shadow-amber-950/50 transition-all active:scale-95 cursor-pointer"
              >
                <span>Ghé Chợ Quê Xứ Nắng</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                type="button"
                onClick={goToStory}
                className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-stone-200 hover:text-white font-bold text-xs sm:text-sm border border-white/20 backdrop-blur-xs transition-all active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Sprout className="w-4 h-4 text-amber-400" />
                <span>Chuyện Người Làm Vườn</span>
              </button>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-5 text-[11px] text-stone-300 font-medium border-t border-white/10">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Cắt cành sớm 5h30
              </span>
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-400" /> Gửi xe khách trong đêm
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Bao ăn từng trái
              </span>
            </div>
          </div>

          {/* CỘT PHẢI: HÌNH ẢNH SẢN PHẨM & BADGES */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border-2 border-stone-700/80 shadow-2xl bg-stone-900 group">
              <img
                src="https://images.unsplash.com/photo-1596363505729-4190a9506133?auto=format&fit=crop&w=1000&q=80"
                alt="Nho Ninh Thuận chín giàn"
                className="w-full h-72 sm:h-80 object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 block">
                    Vườn Thái An • Vĩnh Hải
                  </span>
                  <strong className="text-sm font-black text-white">
                    Nho Xanh NH01-48 Cắt Giàn
                  </strong>
                </div>

                <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 backdrop-blur-md border border-amber-400/40 text-[11px] font-bold text-amber-300">
                  Chuẩn loại 1
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3 shadow-inner">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-xs font-black text-white block">2.800+ Giờ</strong>
                  <span className="text-[10px] text-stone-400">Nắng gắt gom vị ngọt</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3 shadow-inner">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-xs font-black text-white block">100% Giàn Tươi</strong>
                  <span className="text-[10px] text-stone-400">Không chất bảo quản</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ================= 2. KHÁM PHÁ GIAN HÀNG QUÊ ================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-black uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-amber-700" />
            <span>Khám phá các gian hàng quê</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollCategories('left')}
              className="w-8 h-8 rounded-full bg-white border border-stone-200 hover:border-amber-500 text-stone-600 hover:text-amber-800 flex items-center justify-center shadow-xs transition-all cursor-pointer active:scale-95"
              title="Cuộn sang trái"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollCategories('right')}
              className="w-8 h-8 rounded-full bg-white border border-stone-200 hover:border-amber-500 text-stone-600 hover:text-amber-800 flex items-center justify-center shadow-xs transition-all cursor-pointer active:scale-95"
              title="Cuộn sang phải"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            
            <button
              type="button"
              onClick={() => goToShop('all')}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 inline-flex items-center gap-1 ml-2"
            >
              <span>Xem tất cả ({products.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
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
              className="shrink-0 px-4 py-2.5 rounded-2xl bg-amber-800 text-white text-xs font-black shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer hover:bg-amber-900"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Toàn Bộ ({products.length})</span>
            </button>

            {displayCategories.map((cat) => {
              const IconComponent = CATEGORY_ID_ICON_MAP[cat.id] || Sparkles;
              const catTitle = cat.name || cat.label || 'Danh mục';

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => goToShop(cat.id)}
                  className="shrink-0 px-4 py-2.5 rounded-2xl bg-white border border-stone-200/90 hover:border-amber-600 hover:text-amber-900 text-stone-700 text-xs font-bold shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer group"
                >
                  <IconComponent className="w-3.5 h-3.5 text-amber-700 group-hover:scale-110 transition-transform" />
                  <span>{catTitle}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= 3. LỊCH MÙA VỤ THU HOẠCH PHAN RANG ================= */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-amber-800 text-xs font-black tracking-wider uppercase">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Thời điểm trái ngon nhất</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-stone-900 mt-0.5">
              Lịch Mùa Vụ Thu Hoạch Nông Sản Xứ Nắng
            </h3>
          </div>
          <p className="text-xs text-stone-500 max-w-sm font-light">
            Trái cây hái đúng độ chín cây tự nhiên luôn cho lượng đường và hương thơm sâu sắc nhất.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HARVEST_SEASONS.map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-[#faf8f5] border border-stone-200/80 space-y-2 hover:border-amber-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-stone-500">{item.season}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.statusColor}`}>
                  {item.status}
                </span>
              </div>
              <h4 className="text-sm font-black text-stone-900">{item.name}</h4>
              <p className="text-xs text-stone-600 font-light leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
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

      {/* ================= 5. QUY TRÌNH ĐÓNG THÙNG BẢO ĐẢM TƯƠI NGON ================= */}
      <section className="bg-gradient-to-br from-stone-900 to-stone-950 text-white rounded-3xl p-6 sm:p-10 border border-stone-800 shadow-xl space-y-6">
        <div className="max-w-2xl space-y-1">
          <span className="text-amber-400 text-xs font-black tracking-wider uppercase flex items-center gap-1.5">
            <PackageCheck className="w-4 h-4 text-amber-400" />
            <span>Quy chuẩn nhà vườn</span>
          </span>
          <h3 className="text-xl sm:text-2xl font-black">
            Làm Sao Để Nho & Táo Đi Hàng Trăm Cây Số Vẫn Tươi Rót?
          </h3>
          <p className="text-xs sm:text-sm text-stone-400 font-light">
            Chúng tôi hiểu nỗi lo dập nát khi đặt hoa quả tươi từ xa. Đây là cách nhà vườn bảo vệ từng thùng hàng:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {[
            { step: "01", title: "Cắt Hái Đúng Độ Chín", desc: "Chỉ chọn chùm nho cuống xanh, táo đủ độ giòn hái lúc sáng sớm." },
            { step: "02", title: "Chèn Rơm & Lưới Xốp", desc: "Từng chùm được bọc túi khí hoặc lưới xốp êm, chèn rơm khô chống xóc." },
            { step: "03", title: "Ướp Lạnh Đá Gel Kín", desc: "Thùng xốp dán kín băng keo kèm túi đá gel giữ nhiệt độ mát mẻ suốt hành trình." },
            { step: "04", title: "Gửi Xe Khách Trong Đêm", desc: "Xe chạy xuyên đêm tới Sài Gòn, giao tận tay vào sáng hôm sau." }
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-2xl font-black font-mono text-amber-400">{item.step}</span>
              <h4 className="text-xs sm:text-sm font-bold text-stone-100">{item.title}</h4>
              <p className="text-xs text-stone-400 font-light leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= 6. GÓC VĂN HÓA THỔ NHƯỠNG BẢN ĐỊA ================= */}
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

      {/* ================= 7. CẨM NANG 10 NÔNG SẢN SẠCH BẢN ĐỊA ================= */}
      <ExperienceGuideSection />

      {/* ================= 8. ĐÁNH GIÁ CHÂN THỰC TỪ KHÁCH HÀNG ================= */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-stone-200 pb-4 gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5 fill-amber-700 text-amber-700" />
              <span>Tình cảm của khách thương</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight mt-1">
              Khách Ăn Quả Xứ Nắng Nói Gì?
            </h3>
          </div>
          <span className="text-xs text-stone-500 font-medium">
            Hơn 1.200+ thùng nông sản đã giao tận tay khắp cả nước
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {CUSTOMER_REVIEWS.map((rev, idx) => (
            <div key={idx} className="p-5 sm:p-6 rounded-3xl bg-white border border-stone-200/90 shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {rev.tag}
                  </span>
                </div>
                <p className="text-xs text-stone-600 font-light leading-relaxed italic">
                  "{rev.content}"
                </p>
              </div>

              <div className="pt-3 border-t border-stone-100">
                <strong className="text-xs font-bold text-stone-900 block">{rev.name}</strong>
                <span className="text-[11px] text-stone-400 font-light">{rev.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= 9. BỐN CAM KẾT VƯỜN QUÊ ================= */}
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

      {/* ================= 10. BANNER KÝ SỰ BẢN ĐỊA ================= */}
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
// COMPONENT CON: KINH NGHIỆM CHỌN NÔNG SẢN SẠCH (10 MÓN + BẢO QUẢN + PROGRESS)
// =========================================================================
function ExperienceGuideSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const tabsContainerRef = useRef(null);

  const changeTab = (newIndex) => {
    if (newIndex === currentIndex || isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setIsAnimating(false);
    }, 200);
  };

  const handlePrev = () => {
    const nextIdx = (currentIndex - 1 + NINH_THUAN_EXPERIENCES.length) % NINH_THUAN_EXPERIENCES.length;
    changeTab(nextIdx);
  };

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % NINH_THUAN_EXPERIENCES.length;
    changeTab(nextIdx);
  };

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      handleNext();
    }, 6000);

    return () => clearInterval(timer);
  }, [isPaused, currentIndex]);

  useEffect(() => {
    if (tabsContainerRef.current) {
      const activeBtn = tabsContainerRef.current.children[currentIndex];
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex]);

  const currentItem = NINH_THUAN_EXPERIENCES[currentIndex];

  return (
    <section 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6 relative overflow-hidden"
    >
      {/* THANH TIẾN TRÌNH TỰ ĐỘNG CHẠY 6S */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-stone-100 overflow-hidden">
        <div 
          key={currentIndex + (isPaused ? '-paused' : '-running')}
          className={`h-full bg-gradient-to-r from-amber-500 to-amber-700 transition-all duration-300 ${
            isPaused ? 'opacity-40' : 'animate-progress-6s'
          }`}
          style={{
            animationPlayState: isPaused ? 'paused' : 'running'
          }}
        />
      </div>

      <style>{`
        @keyframes progress6s {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-progress-6s {
          animation: progress6s 6s linear forwards;
        }
      `}</style>

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4 pt-1">
        <div>
          <div className="flex items-center gap-2 text-amber-800 text-xs font-black tracking-wider uppercase">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>Kinh nghiệm nhà nông • 10 đặc sản chuẩn gốc</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-stone-900 mt-0.5">
            Mẹo Phân Biệt & Nhận Diện Nông Sản Ninh Thuận Thật
          </h3>
        </div>

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

      {/* DẢI 10 TABS CHỌN ĐẶC SẢN (CUỘN NGANG MƯỢT) */}
      <div 
        ref={tabsContainerRef}
        className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] scroll-smooth"
      >
        {NINH_THUAN_EXPERIENCES.map((exp, idx) => (
          <button
            key={exp.id}
            type="button"
            onClick={() => changeTab(idx)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 shrink-0 cursor-pointer ${
              idx === currentIndex
                ? 'bg-amber-800 text-white shadow-xs scale-[1.02]'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
            }`}
          >
            {exp.tabLabel}
          </button>
        ))}
      </div>

      {/* NỘI DUNG CHI TIẾT (FADE TRANSITION) */}
      <div 
        className={`grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch transition-all duration-300 ease-out transform ${
          isAnimating ? 'opacity-0 translate-y-2 scale-[0.99]' : 'opacity-100 translate-y-0 scale-100'
        }`}
      >
        {/* CỘT TRÁI: DẤU HIỆU CHUẨN + MẸO BẢO QUẢN */}
        <div className="lg:col-span-8 p-5 sm:p-6 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-4 flex flex-col justify-between shadow-2xs">
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

            {/* Dấu hiệu nhận biết */}
            <div className="space-y-2 pt-1">
              {currentItem.realSigns.map((sign, sIdx) => (
                <div key={sIdx} className="flex items-start gap-2.5 text-xs text-stone-700 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{sign}</span>
                </div>
              ))}
            </div>

            {/* Khối Mẹo Bảo Quản Mới */}
            {currentItem.storageTip && (
              <div className="mt-3 p-3 rounded-xl bg-white/80 border border-amber-200/60 text-xs text-stone-700 flex items-start gap-2 shadow-2xs">
                <span className="font-bold text-amber-900 shrink-0">🧊 Mẹo bảo quản:</span>
                <span className="font-light">{currentItem.storageTip}</span>
              </div>
            )}
          </div>

          <div className="pt-2 text-[11px] text-stone-400 italic flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Di chuột vào khung để tạm dừng đọc kỹ, rời chuột để tiếp tục tự động chuyển.</span>
          </div>
        </div>

        {/* CỘT PHẢI: CẢNH BÁO TRÁNH HÀNG KÉM CHẤT LƯỢNG */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-2xl bg-rose-50/60 border border-rose-200/80 flex flex-col justify-between space-y-3 shadow-2xs">
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Cách tránh hàng kém chất lượng</span>
            </div>

            <p className="text-xs text-rose-950/80 leading-relaxed font-light">
              {currentItem.fakeWarning}
            </p>
          </div>

          <div className="pt-3 border-t border-rose-200/60 flex items-center justify-between text-[11px] text-rose-700 font-bold">
            <span>🛡️ Bao ăn tận miệng</span>
            <span>🌿 Chuẩn gốc hái giàn</span>
          </div>
        </div>
      </div>
    </section>
  );
}