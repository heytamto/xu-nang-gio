// src/pages/HomePage.jsx
import React, { useRef, useMemo } from "react";
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
  ChevronLeft,
  ChevronRight,
  Droplets,
  Wind,
  Clock,
  Award,
  PackageCheck,
  TrendingUp,
} from "lucide-react";
import ProductCard from "../components/ProductCard";
import HarvestCalendarSection from "../components/home/HarvestCalendarSection";
import ExperienceGuideSection from "../components/home/ExperienceGuideSection";
import CustomerReviewsSection from "../components/home/CustomerReviewsSection";

const CATEGORY_ID_ICON_MAP = {
  cat01: Sparkles,
  cat02: Apple,
  cat03: Flame,
  cat04: Fish,
  cat05: Wine,
  cat06: Leaf,
};

export default function HomePage({
  products = [],
  categories = [],
  shopConfig = {},
  onAddToCart,
  onNavigateShop,
  onNavigateStory,
  onNavigate,
}) {
  const scrollRef = useRef(null);

  const isReviewsEnabled =
    shopConfig?.showCustomerReviews !== false &&
    String(shopConfig?.showCustomerReviews).toUpperCase() !== "FALSE";

  const scrollCategories = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -280 : 280;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const goToShop = (catId = "all") => {
    if (onNavigateShop) onNavigateShop(catId);
    else if (onNavigate) onNavigate("shop");
  };

  const goToStory = () => {
    if (onNavigateStory) onNavigateStory();
    else if (onNavigate) onNavigate("story");
  };

  // Tính sản phẩm bán chạy từ mảng products
  const featuredProducts = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) return [];
    return [...products]
      .sort((a, b) => (Number(b.soldCount || b.sold || 0) - Number(a.soldCount || a.sold || 0)))
      .slice(0, 8);
  }, [products]);

  const displayCategories = useMemo(() => {
    return categories.filter((c) => c.id !== "all");
  }, [categories]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-16 animate-fadeIn font-sans selection:bg-amber-100 selection:text-amber-900 text-stone-800">
      
      {/* 1. HERO BANNER MẶT TIỀN */}
      <section className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-stone-950 via-[#1c1917] to-amber-950 text-white shadow-2xl border border-stone-800/80 p-6 sm:p-10 lg:p-14">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs sm:text-sm font-black tracking-wide shadow-inner">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>NÔNG SẢN CẮT GIÀN & KÝ SỰ BẢN ĐỊA PHAN RANG</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black tracking-tight text-white leading-[1.15]">
              Nắng Gom Vị Ngọt, <br />
              <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-orange-300 bg-clip-text text-transparent">
                Gió Chắt Vị Đậm Đà.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-stone-200 leading-relaxed font-normal max-w-xl">
              Nông sản thuần tự nhiên dưới chân dãy Núi Chúa: từ vườn táo giòn rụm Phước Hậu, giàn nho chín mọng Thái An đến mẻ chả cá quết tươi làng biển Cà Ná. Hái sớm tinh mơ và gửi đến bạn nguyên vẹn vị đất trời.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => goToShop("all")}
                className="group px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-black text-sm flex items-center gap-2.5 shadow-lg shadow-amber-950/50 transition-all active:scale-95 cursor-pointer"
              >
                <span>Ghé Chợ Quê Xứ Nắng</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={goToStory}
                className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-stone-100 hover:text-white font-bold text-sm border border-white/20 backdrop-blur-xs transition-all active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Sprout className="w-4 h-4 text-amber-400" />
                <span>Chuyện Người Làm Vườn</span>
              </button>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-5 text-xs sm:text-sm text-stone-300 font-semibold border-t border-white/10">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" /> Cắt cành sớm 5h30
              </span>
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-400" /> Gửi xe khách trong đêm
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Bao ăn từng trái
              </span>
            </div>
          </div>

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
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 block">
                    Vườn Thái An • Vĩnh Hải
                  </span>
                  <strong className="text-base sm:text-lg font-black text-white">
                    Nho Xanh NH01-48 Cắt Giàn
                  </strong>
                </div>

                <span className="px-3 py-1 rounded-xl bg-amber-500/20 backdrop-blur-md border border-amber-400/40 text-xs font-bold text-amber-300">
                  Chuẩn loại 1
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3 shadow-inner">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <strong className="text-sm font-black text-white block">2.800+ Giờ</strong>
                  <span className="text-xs text-stone-300 font-normal">Nắng gắt gom vị ngọt</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3 shadow-inner">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <strong className="text-sm font-black text-white block">100% Giàn Tươi</strong>
                  <span className="text-xs text-stone-300 font-normal">Không chất bảo quản</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. KHÁM PHÁ GIAN HÀNG QUÊ */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <p className="text-sm font-black uppercase tracking-wider text-stone-700 flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-700" />
            <span>Khám phá các gian hàng quê</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollCategories("left")}
              className="w-9 h-9 rounded-full bg-white border border-stone-200 hover:border-amber-500 text-stone-600 hover:text-amber-800 flex items-center justify-center shadow-xs transition-all cursor-pointer active:scale-95"
              title="Cuộn sang trái"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollCategories("right")}
              className="w-9 h-9 rounded-full bg-white border border-stone-200 hover:border-amber-500 text-stone-600 hover:text-amber-800 flex items-center justify-center shadow-xs transition-all cursor-pointer active:scale-95"
              title="Cuộn sang phải"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => goToShop("all")}
              className="text-sm font-bold text-amber-800 hover:text-amber-950 inline-flex items-center gap-1 ml-2 cursor-pointer"
            >
              <span>Xem tất cả ({products.length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative group/scroll">
          <div
            ref={scrollRef}
            className="flex items-center gap-3 overflow-x-auto pb-1 pt-1 px-1 scroll-smooth select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{ whiteSpace: "nowrap" }}
          >
            <button
              type="button"
              onClick={() => goToShop("all")}
              className="shrink-0 px-4 py-3 rounded-2xl bg-amber-800 text-white text-sm font-black shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer hover:bg-amber-900"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Toàn Bộ ({products.length})</span>
            </button>

            {displayCategories.map((cat) => {
              const IconComponent = CATEGORY_ID_ICON_MAP[cat.id] || Sparkles;
              const catTitle = cat.name || cat.label || "Danh mục";

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => goToShop(cat.id)}
                  className="shrink-0 px-4 py-3 rounded-2xl bg-white border border-stone-200/90 hover:border-amber-600 hover:text-amber-900 text-stone-700 text-sm font-bold shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer group"
                >
                  <IconComponent className="w-4 h-4 text-amber-700 group-hover:scale-110 transition-transform" />
                  <span>{catTitle}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. LỊCH MÙA VỤ 12 THÁNG (Component tách riêng) */}
      <HarvestCalendarSection onNavigateShop={goToShop} />

      {/* 4. MÓN NGON TUYỂN CHỌN */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-stone-200 pb-4 gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-800 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>Được chọn mua nhiều nhất</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-1">
              Món Ngon Tuyển Chọn Vừa Cắt Giàn
            </h2>
          </div>

          <button
            type="button"
            onClick={() => goToShop("all")}
            className="group text-sm font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>Xem tất cả gian hàng ({products.length} món)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="p-16 text-center text-stone-500 text-sm bg-white rounded-3xl border border-dashed border-stone-300 space-y-2">
            <ShoppingBag className="w-8 h-8 mx-auto text-stone-400 stroke-[1.5]" />
            <p>Đang cập nhật danh sách nông sản thu hoạch hôm nay...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
            ))}
          </div>
        )}
      </section>

      {/* 5. QUY TRÌNH ĐÓNG THÙNG BẢO ĐẢM TƯƠI NGON */}
      <section className="bg-gradient-to-br from-stone-900 to-stone-950 text-white rounded-[2rem] p-6 sm:p-10 border border-stone-800 shadow-xl space-y-6">
        <div className="max-w-2xl space-y-2">
          <span className="text-amber-400 text-xs sm:text-sm font-black tracking-wider uppercase flex items-center gap-1.5">
            <PackageCheck className="w-4 h-4 text-amber-400" />
            <span>Quy chuẩn nhà vườn</span>
          </span>
          <h3 className="text-xl sm:text-3xl font-black text-white">
            Làm Sao Để Nho & Táo Đi Hàng Trăm Cây Số Vẫn Tươi Rót?
          </h3>
          <p className="text-sm sm:text-base text-stone-300 font-normal leading-relaxed">
            Chúng tôi hiểu nỗi lo dập nát khi đặt hoa quả tươi từ xa. Đây là cách nhà vườn bảo vệ từng thùng hàng:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {[
            {
              step: "01",
              title: "Cắt Hái Đúng Độ Chín",
              desc: "Chỉ chọn chùm nho cuống xanh, táo đủ độ giòn hái lúc sáng sớm.",
            },
            {
              step: "02",
              title: "Chèn Rơm & Lưới Xốp",
              desc: "Từng chùm được bọc túi khí hoặc lưới xốp êm, chèn rơm khô chống xóc.",
            },
            {
              step: "03",
              title: "Ướp Lạnh Đá Gel Kín",
              desc: "Thùng xốp dán kín băng keo kèm túi đá gel giữ nhiệt độ mát mẻ suốt hành trình.",
            },
            {
              step: "04",
              title: "Gửi Xe Khách Trong Đêm",
              desc: "Xe chạy xuyên đêm tới Sài Gòn, giao tận tay vào sáng hôm sau.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5"
            >
              <span className="text-3xl font-black font-mono text-amber-400">{item.step}</span>
              <h4 className="text-base font-bold text-stone-100">{item.title}</h4>
              <p className="text-sm text-stone-300 font-normal leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. GÓC VĂN HÓA THỔ NHƯỠNG */}
      <section className="bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 rounded-[2rem] p-6 sm:p-9 border border-amber-200/70 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/50 pb-4">
          <div className="space-y-1">
            <span className="text-amber-800 text-xs sm:text-sm font-black tracking-wider uppercase flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-600" />
              <span>Gió như phang, nắng như rang</span>
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-stone-900">
              Vì Sao Đất Càng Khắc Nghiệt, Trái Lại Càng Đậm Vị?
            </h3>
          </div>
          <p className="text-sm text-stone-600 max-w-sm font-normal">
            Ninh Thuận có hơn 2.800 giờ nắng/năm — lượng bốc hơi cao gấp 2 lần lượng mưa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-2xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Sun className="w-5 h-5" />
            </div>
            <h4 className="text-base sm:text-lg font-bold text-stone-900">Quang Hợp Cực Đại</h4>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
              Nắng chiếu từ sáng sớm đến tận chiều tà giúp cây nho và táo gió tích lũy lượng đường tự nhiên cao vượt trội.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-2xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center font-bold">
              <Wind className="w-5 h-5" />
            </div>
            <h4 className="text-base sm:text-lg font-bold text-stone-900">Gió Biển Chống Nấm Mốc</h4>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
              Gió biển thổi qua giàn liên tục làm khô ráo tán lá tự nhiên, hạn chế sâu bệnh.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-2xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Droplets className="w-5 h-5" />
            </div>
            <h4 className="text-base sm:text-lg font-bold text-stone-900">Mạch Nước Phù Sa Pha Cát</h4>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
              Hệ thống mương dẫn thủy lợi cổ Champa đưa nguồn nước phù sa sông Dinh bồi đắp cho từng gốc nho.
            </p>
          </div>
        </div>
      </section>

      {/* 7. CẨM NANG 10 NÔNG SẢN SẠCH BẢN ĐỊA (Component tách riêng) */}
      <ExperienceGuideSection />

      {/* 8. ĐÁNH GIÁ CỦA KHÁCH THƯƠNG (Component tách riêng) */}
      {isReviewsEnabled && <CustomerReviewsSection />}

      {/* 9. BỐN CAM KẾT VƯỜN QUÊ */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: CheckCircle2, title: "Bao Ăn Tận Miệng", desc: "Chuẩn vị giòn ngọt, không ngon hoàn tiền" },
          { icon: ShieldCheck, title: "100% Nguyên Bản", desc: "Nắng phơi mộc, không phẩm màu hóa chất" },
          { icon: Truck, title: "Ship Thùng Xốp", desc: "Chèn rơm chống dập, ướp đá gel mát lạnh" },
          { icon: RefreshCw, title: "Bảo Hành Tươi Ngon", desc: "Bù hàng ngay nếu dập nát gửi xe" },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-2xs hover:shadow-xs hover:border-amber-300 transition-all duration-200"
            >
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/70 shrink-0">
                <Icon className="w-6 h-6 text-amber-600" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-bold text-stone-900">{item.title}</h4>
                <p className="text-xs sm:text-sm text-stone-500 leading-snug font-normal">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* 10. BANNER KÝ SỰ BẢN ĐỊA */}
      <section className="relative overflow-hidden bg-gradient-to-r from-amber-900 via-stone-900 to-stone-900 text-white rounded-[2rem] p-7 sm:p-12 shadow-xl border border-stone-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2.5 text-center md:text-left max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs sm:text-sm font-bold">
            <Heart className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>Ký sự người trồng nho & táo Phan Rang</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Muốn hiểu vì sao quả ngọt đậm sâu giữa đất nung rát nắng?
          </h3>
          <p className="text-sm sm:text-base text-stone-300 font-normal leading-relaxed">
            Mời bạn ghé xem nhật ký mùa vụ, xem cách người làm vườn bọc từng túi táo sinh học và phơi ráo từng mẻ nho dưới gió biển Cà Ná.
          </p>
        </div>

        <button
          type="button"
          onClick={goToStory}
          className="group px-7 py-4 rounded-2xl bg-white text-stone-900 hover:bg-amber-100 font-bold text-sm shrink-0 transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
        >
          <span>Đọc Chuyện Xứ Nắng Gió</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-amber-800" />
        </button>
      </section>
    </div>
  );
}