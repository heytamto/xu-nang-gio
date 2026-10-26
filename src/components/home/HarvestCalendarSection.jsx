// src/components/home/HarvestCalendarSection.jsx
import React, { useState, useMemo } from "react";
import { Calendar, ShoppingBag, ArrowRight } from "lucide-react";

export const MONTHLY_HARVEST_CALENDAR = [
  {
    month: 1,
    title: "Vào Vụ Tỏi Cô Đơn & Hành Tím Gác Bếp",
    highlight: "Tỏi Cô Đơn Nhơn Hải",
    status: "Chính vụ đầu năm",
    desc: "Đầu năm đất cát Nhơn Hải ráo gắt, tỏi cô đơn củ chắc nịch tích tụ dược tính và tinh dầu thơm nồng nhất năm.",
    categoryTarget: "cat05",
    image: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=1000&q=80",
    tips: "Tỏi đầu mùa củ vỏ bóng trắng vân tía nhạt, mua gác bếp ăn cả năm không lo óp lép.",
  },
  {
    month: 2,
    title: "Táo Gió Mật Đón Nắng Xuân Phước Hậu",
    highlight: "Táo Gió Mật Giòn",
    status: "Rộ ngọt mọng nước",
    desc: "Vườn táo giòn ngọt, vỏ phớt vàng mơ, cắn vào giòn rụm mọng nước giải nhiệt ngày nắng.",
    categoryTarget: "cat02",
    image: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=1000&q=80",
    tips: "Táo bọc lưới sinh học không phun xịt, rửa nước muối loãng là có thể ăn cả vỏ giòn tan.",
  },
  {
    month: 3,
    title: "Khai Vụ Nho Đỏ Red Cardinal Cắt Giàn",
    highlight: "Nho Đỏ Cắt Giàn",
    status: "Chính vụ mùa khô",
    desc: "Nho đỏ bắt đầu chín rộ các giàn Thái An. Trái đỏ tím cánh gián, vị chua ngọt thanh mát tự nhiên.",
    categoryTarget: "cat02",
    image: "https://images.unsplash.com/photo-1596363505729-4190a9506133?auto=format&fit=crop&w=1000&q=80",
    tips: "Chùm cuống tươi xanh mướt, quả khít đều. Ăn tươi hoặc làm siro nho đá tuyết cực đã.",
  },
  {
    month: 4,
    title: "Mực Ống Một Nắng Cà Ná Dong Thuyền Đêm",
    highlight: "Mực Một Nắng Cà Ná",
    status: "Mùa biển êm trúng lộc",
    desc: "Mực ống câu đêm vừa cập bến rạng sáng, xẻ phơi đúng 1 nắng gắt giòn, dày cơm dẻo quánh.",
    categoryTarget: "cat04",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1000&q=80",
    tips: "Nướng than hoa hoặc chiên nước mắm, xé ra thịt mực nở phồng thơm nức mùi biển Cà Ná.",
  },
  {
    month: 5,
    title: "Rộ Nho Xanh NH01-48 Giòn Ngọt",
    highlight: "Nho Xanh Ninh Thuận",
    status: "Cao điểm thu hái giàn",
    desc: "Nắng rực rỡ nhất giúp nho xanh tích lũy lượng đường cực đại, vỏ bóng phấn, giòn ngọt thanh tao.",
    categoryTarget: "cat02",
    image: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=1000&q=80",
    tips: "Nho có phấn trắng tự nhiên bọc quanh vỏ là dấu hiệu của chùm mới cắt sớm, chưa qua xử lý.",
  },
  {
    month: 6,
    title: "Măng Tây Xanh Cát Phù Sa An Hải",
    highlight: "Măng Tây Xanh Giòn",
    status: "Đọt non tươi rói",
    desc: "Măng thu hoạch tinh mơ khi sương còn đọng, thân giòn bùi mọng nước, giàu dinh dưỡng.",
    categoryTarget: "cat02",
    image: "https://images.unsplash.com/photo-1515471204630-e4b2d30560a6?auto=format&fit=crop&w=1000&q=80",
    tips: "Xào tỏi, nấu súp hoặc luộc chấm kho quẹt giòn ngọt mát ruột.",
  },
  {
    month: 7,
    title: "Chả Cá Đỏ Củ Quết Mộc Đông Hải",
    highlight: "Chả Cá Quết Tay",
    status: "Mùa cá cơm & cá đỏ củ",
    desc: "Cá biển sâu tươi rói cập cảng quết ngay cùng tiêu sọ và hành tím, dẻo dai tự nhiên không pha bột.",
    categoryTarget: "cat03",
    image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=1000&q=80",
    tips: "Chiên phồng chấm mắm tỏi ớt hoặc thả lẩu, nấu bánh canh cá ngọt nước đậm đà.",
  },
  {
    month: 8,
    title: "Mật Nho Chum Sành Ủ Men Nắng Trời",
    highlight: "Mật Nho Chum Sành",
    status: "Ủ ráo đượm vị",
    desc: "Nho chín rộ tháng 6-7 được ủ đường phèn trong chum sành phơi nắng ráo, chắt ra mẻ mật sền sệt đỏ cánh gián.",
    categoryTarget: "cat05",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1000&q=80",
    tips: "Pha cùng đá lạnh và vài giọt nước cốt tắc giải khát cực sâu cổ họng.",
  },
  {
    month: 9,
    title: "Nước Mắm Nhĩ Cá Cơm Than Cà Ná Khai Thùng",
    highlight: "Nước Mắm Cà Ná",
    status: "Đủ 12 tháng ủ ròng",
    desc: "Cá cơm than béo mẫm ủ muối tinh khiết 12-18 tháng ráo nắng, giọt mắm màu cánh gián thơm phức đượm vị biển.",
    categoryTarget: "cat05",
    image: "https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&w=1000&q=80",
    tips: "Chấm thịt luộc, rau sống hoặc làm quà biếu chuẩn phong vị làng nghề cổ truyền.",
  },
  {
    month: 10,
    title: "Táo Gió Mật Trở Lại Vụ Đông Xuân",
    highlight: "Táo Gió Giòn Mật",
    status: "Bắt đầu rộ lứa mới",
    desc: "Thời tiết se lạnh hanh hao làm thịt quả táo dày chắc, cắn ngập răng giòn ngọt thanh lành.",
    categoryTarget: "cat02",
    image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=1000&q=80",
    tips: "Chọn trái căng đều, cuống còn tươi xanh là táo vừa cắt giàn buổi sớm.",
  },
  {
    month: 11,
    title: "Nho Đen Không Hạt & Nho Kẹo Sấy Dẻo",
    highlight: "Nho Sấy Dẻo Tự Nhiên",
    status: "Phơi sấy chuẩn bị Tết",
    desc: "Nho chín mọng đưa vào lò sấy nhiệt chậm, giữ nguyên lớp mật dẻo tự nhiên, không ngậm đường công nghiệp.",
    categoryTarget: "cat06",
    image: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&w=1000&q=80",
    tips: "Thích hợp làm món ăn vặt lành mạnh, làm bánh hoặc làm quà Tết quê thơm thảo.",
  },
  {
    month: 12,
    title: "Hạt Điều Rang Củi & Combo Giỏ Quà Nắng Gió",
    highlight: "Hạt Điều Rang Củi",
    status: "Mùa lễ hội & biếu tặng",
    desc: "Hạt điều nương rẫy Bình Sơn rang chảo gang đun củi thơm lừng, giòn bùi ngậy béo phục vụ mùa Tết sum vầy.",
    categoryTarget: "cat01",
    image: "https://images.unsplash.com/photo-1509912760195-4f6cfd939638?auto=format&fit=crop&w=1000&q=80",
    tips: "Bóc nhẹ lớp vỏ lụa mỏng để thưởng thức trọn vẹn vị béo ngậy nguyên bản không khét dầu.",
  },
];

export default function HarvestCalendarSection({ onNavigateShop }) {
  const currentRealMonth = useMemo(() => new Date().getMonth() + 1, []);
  const [selectedMonth, setSelectedMonth] = useState(currentRealMonth);

  const activeMonthData = useMemo(() => {
    return (
      MONTHLY_HARVEST_CALENDAR.find((m) => m.month === selectedMonth) ||
      MONTHLY_HARVEST_CALENDAR[0]
    );
  }, [selectedMonth]);

  return (
    <section className="bg-white rounded-3xl p-5 sm:p-8 border border-stone-200/90 shadow-xs space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-amber-800 text-xs sm:text-sm font-black tracking-wider uppercase">
            <Calendar className="w-4 h-4 text-amber-700" />
            <span>Hành trình mùa màng Phan Rang</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-stone-900 mt-1">
            Lịch Mùa Vụ Thu Hoạch Nông Sản 12 Tháng
          </h3>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setSelectedMonth(currentRealMonth)}
            title={
              selectedMonth !== currentRealMonth
                ? `Bấm để quay về xem đặc sản Tháng ${currentRealMonth}`
                : undefined
            }
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer border active:scale-95 ${
              selectedMonth === currentRealMonth
                ? "bg-amber-100/90 text-amber-950 border-amber-300 shadow-2xs"
                : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 hover:border-amber-400 hover:shadow-xs"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>Đang là Tháng {currentRealMonth}</span>
            {selectedMonth !== currentRealMonth && (
              <span className="text-xs font-semibold text-amber-800 pl-1 border-l border-amber-300">
                (Quay lại)
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Giao diện Mobile */}
      <div className="block md:hidden space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {MONTHLY_HARVEST_CALENDAR.map((item) => {
            const isSelected = item.month === selectedMonth;
            const isCurrent = item.month === currentRealMonth;

            return (
              <button
                key={item.month}
                type="button"
                onClick={() => setSelectedMonth(item.month)}
                className={`shrink-0 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? "bg-amber-800 text-white border-amber-800 shadow-sm scale-105"
                    : "bg-stone-50 text-stone-700 border-stone-200/90 hover:bg-stone-100"
                }`}
              >
                {isCurrent && (
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? "bg-amber-300" : "bg-emerald-500"} animate-pulse`}
                  />
                )}
                <span>Tháng {item.month}</span>
              </button>
            );
          })}
        </div>

        {activeMonthData && (
          <div className="relative rounded-3xl overflow-hidden bg-stone-900 text-white min-h-[500px] flex flex-col justify-between p-6 border border-stone-700/80 shadow-lg">
            <div className="absolute inset-0 pointer-events-none">
              <img
                src={activeMonthData.image}
                alt={activeMonthData.title}
                className="w-full h-full object-cover filter brightness-[0.65] contrast-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-black/40" />
            </div>

            <div className="relative z-10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-xs px-3 py-1 rounded-xl bg-amber-400 text-stone-950 shadow-md">
                  THÁNG {activeMonthData.month}
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-black/50 border border-white/20 text-amber-200 backdrop-blur-md">
                  {activeMonthData.status}
                </span>
              </div>

              {activeMonthData.month === currentRealMonth && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-400/40 px-3 py-1 rounded-full backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Chính vụ</span>
                </span>
              )}
            </div>

            <div className="relative z-10 space-y-3.5 my-auto py-3">
              <h4 className="text-xl sm:text-2xl font-black text-white leading-snug drop-shadow-md">
                {activeMonthData.title}
              </h4>

              <div className="p-4 rounded-2xl bg-black/55 border border-white/15 backdrop-blur-md text-xs sm:text-sm text-stone-100 leading-relaxed space-y-3">
                <div className="flex flex-col gap-1">
                  <span className="text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span>🌾 Đặc trưng:</span>
                  </span>
                  <p className="text-stone-100 font-normal leading-relaxed break-words text-xs sm:text-sm">
                    {activeMonthData.desc}
                  </p>
                </div>

                <div className="flex flex-col gap-1 pt-2.5 border-t border-white/10">
                  <span className="text-amber-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span>💡 Thưởng thức:</span>
                  </span>
                  <p className="text-amber-100 font-normal leading-relaxed break-words text-xs sm:text-sm">
                    {activeMonthData.tips}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-10 space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs sm:text-sm px-1 text-stone-300">
                <span className="text-amber-400 font-mono tracking-wider uppercase text-xs font-bold">
                  Đặc sản chọn lọc:
                </span>
                <span className="font-bold text-white">
                  {activeMonthData.highlight}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onNavigateShop?.(activeMonthData.categoryTarget || "all")}
                className="w-full h-11 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer shadow-md"
              >
                <ShoppingBag className="w-4 h-4 text-stone-950" />
                <span>Xem Nông Sản Tháng {activeMonthData.month}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Giao diện Desktop */}
      <div className="hidden md:flex flex-row items-stretch gap-1.5 h-[600px] lg:h-[640px] w-full select-none rounded-3xl p-2 pt-9 pb-3 bg-[#FAF6F0] border border-stone-200/90 shadow-inner overflow-hidden">
        {MONTHLY_HARVEST_CALENDAR.map((item) => {
          const isExpanded = item.month === selectedMonth;
          const isRealMonth = item.month === currentRealMonth;
          const highlightShort =
            item.highlight.split(" ")[0] + " " + (item.highlight.split(" ")[1] || "");

          return (
            <div
              key={item.month}
              onClick={() => {
                if (!isExpanded) setSelectedMonth(item.month);
              }}
              style={{ transitionProperty: "flex-grow, transform" }}
              className={`relative rounded-2xl flex flex-col justify-between overflow-hidden duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-[flex-grow,transform] min-w-0 ${
                isExpanded
                  ? "flex-[6.5] lg:flex-[8] z-20 ring-2 ring-amber-500/90 bg-stone-900 -translate-y-3.5 cursor-default shadow-[0_20px_42px_rgba(0,0,0,0.4)]"
                  : "flex-1 z-0 translate-y-0 cursor-pointer shadow-none hover:z-30 hover:scale-[1.03] hover:-translate-y-3.5 hover:shadow-[0_12px_24px_rgba(0,0,0,0.25)] group/card"
              }`}
            >
              <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none bg-stone-800 border border-white/20">
                <img
                  src={item.image}
                  alt={item.title}
                  className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                    isExpanded
                      ? "scale-105 filter brightness-[0.72] contrast-105"
                      : "scale-100 filter brightness-95 contrast-105 group-hover/card:scale-110"
                  }`}
                />
                <div
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    isExpanded
                      ? "bg-gradient-to-t from-stone-950/95 via-stone-900/50 to-black/40"
                      : "bg-gradient-to-t from-black/60 via-transparent to-black/45 group-hover/card:from-black/70"
                  }`}
                />
              </div>

              {/* Thu nhỏ */}
              <div
                className={`absolute inset-0 py-4 px-1 flex flex-col items-center justify-between pointer-events-none transition-opacity duration-300 z-10 ${
                  isExpanded ? "opacity-0 invisible" : "opacity-100 visible"
                }`}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={`font-mono font-black text-xs px-2 py-0.5 rounded-lg shadow-2xs backdrop-blur-md transition-colors ${
                      isRealMonth
                        ? "bg-amber-400 text-stone-950 font-black ring-1 ring-amber-300"
                        : "bg-black/60 text-white border border-white/30 group-hover/card:border-amber-400 group-hover/card:text-amber-300"
                    }`}
                  >
                    T{item.month}
                  </span>
                  {isRealMonth && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>

                <div className="my-auto py-2 flex items-center justify-center overflow-visible">
                  <span
                    className="font-black text-xl lg:text-[32px] tracking-[0.1em] uppercase text-transparent select-none whitespace-nowrap transition-transform duration-300 group-hover/card:scale-105"
                    style={{
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                      WebkitTextStroke: "1.2px rgba(255, 255, 255, 0.45)",
                      filter: `
                        drop-shadow(-1px -1px 1px rgba(255, 255, 255, 0.95))
                        drop-shadow(1px 1px 2px rgba(255, 255, 255, 0.4))
                        drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.65))
                        drop-shadow(0 0 12px rgba(255, 255, 255, 0.25))
                      `,
                      fontFamily: '"Nunito", "Montserrat", "Arial Rounded MT Bold", system-ui, sans-serif',
                    }}
                  >
                    {highlightShort}
                  </span>
                </div>

                <span className="text-xs font-mono font-black text-white/90 drop-shadow-md pb-0.5">
                  #{item.month < 10 ? `0${item.month}` : item.month}
                </span>
              </div>

              {/* Phóng to */}
              <div
                className={`absolute inset-0 w-full h-full p-6 lg:p-8 flex flex-col justify-between text-white z-20 transition-opacity duration-300 ${
                  isExpanded
                    ? "opacity-100 visible pointer-events-auto"
                    : "opacity-0 invisible pointer-events-none"
                }`}
              >
                <div className="w-full h-full flex flex-col justify-between pointer-events-auto">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-black text-xs lg:text-sm px-3 py-1 rounded-xl bg-amber-400 text-stone-950 shadow-md shrink-0">
                        THÁNG {item.month}
                      </span>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-black/40 border border-white/20 text-amber-200 backdrop-blur-md truncate">
                        {item.status}
                      </span>
                    </div>

                    {isRealMonth && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-400/40 px-3 py-1 rounded-full backdrop-blur-md shadow-xs shrink-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Chính vụ</span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-4 my-auto py-2 min-w-0">
                    <h4 className="text-xl lg:text-3xl font-black text-white tracking-tight leading-snug drop-shadow-md break-words">
                      {item.title}
                    </h4>

                    <div className="p-4 sm:p-5 rounded-2xl bg-black/55 border border-white/15 backdrop-blur-md text-xs lg:text-sm text-stone-100 leading-relaxed font-normal space-y-3 shadow-lg">
                      <div className="flex items-start gap-2.5">
                        <span className="shrink-0 text-amber-400 font-bold">🌾 Đặc trưng:</span>
                        <span className="text-stone-100 break-words leading-relaxed font-normal">
                          {item.desc}
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 pt-2.5 border-t border-white/10">
                        <span className="shrink-0 text-amber-300 font-bold">💡 Thưởng thức:</span>
                        <span className="text-amber-100 break-words leading-relaxed font-normal">
                          {item.tips}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 relative z-30 pointer-events-auto pt-1">
                    <div className="flex items-center justify-between text-xs lg:text-sm px-1 text-stone-300">
                      <span className="text-amber-400 font-mono tracking-wider uppercase text-xs font-bold shrink-0">
                        Đặc sản:
                      </span>
                      <span className="font-bold text-white truncate ml-2">
                        {item.highlight}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onNavigateShop?.(item.categoryTarget || "all");
                      }}
                      className="w-full h-11 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs lg:text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer shadow-md pointer-events-auto"
                    >
                      <ShoppingBag className="w-4 h-4 text-stone-950 shrink-0" />
                      <span className="truncate">Xem Nông Sản Tháng {item.month}</span>
                      <ArrowRight className="w-4 h-4 text-stone-950 shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}