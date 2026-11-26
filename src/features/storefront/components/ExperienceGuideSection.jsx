// src/components/home/ExperienceGuideSection.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { HelpCircle, ChevronLeft, ChevronRight, MapPin, CheckCircle2, AlertCircle } from "lucide-react";

export const NINH_THUAN_EXPERIENCES = [
  {
    id: "nho",
    tabLabel: "Nho Đỏ & Xanh",
    title: "Nho Đỏ & Nho Xanh Cắt Giàn Thái An",
    origin: "Làng nho Thái An, Vĩnh Hải",
    realSigns: [
      "Chùm nho tự nhiên cuống tươi xanh, quả khít đều vừa phải chứ không tròn to căng bóng bất thường.",
      "Nho đỏ Red Cardinal có màu đỏ tím phơn phớt cánh gián, hạt giòn dễ tách, vị chua ngọt thanh nhẹ.",
      "Nho xanh NH01-48 vỏ dày dặn hơn một chút, có lớp phấn tự nhiên bảo vệ quả, ngọt thanh giòn rụm.",
    ],
    fakeWarning:
      "Tránh loại nho vỏ đen thẫm, trái to mọng mướt mắt không hạt, cuống héo rũ nhưng quả vẫn mềm nhũn tẩm ướp.",
    storageTip:
      "Chưa rửa khi chưa ăn; để ngăn mát tủ lạnh bọc giấy báo giữ được 7–10 ngày cuống vẫn xanh tươi.",
    badge: "Nông Sản Giàn Nắng",
  },
  {
    id: "tao",
    tabLabel: "Táo Gió Mật",
    title: "Táo Gió Giòn Mật Hái Sớm",
    origin: "Vườn Phước Hậu, Ninh Phước",
    realSigns: [
      "Vỏ quả táo gió màu xanh ngả vàng mơ tự nhiên, da căng bóng vừa phải, có thể có vết rám nắng nhẹ.",
      "Cầm chắc tay, cắn vào giòn tan rôm rốp, mọng nước, hậu vị ngọt thơm thanh tao mát cổ.",
      "Người làm vườn bọc màn lưới bao trái từ nhỏ để ngừa ruồi đục quả mà không phun xịt hóa chất.",
    ],
    fakeWarning:
      "Cẩn thận táo trữ lạnh lâu ngày cuống thâm đen, thịt quả xốp mềm, vỏ ngoài bóng nhẫy sáp bảo quản.",
    storageTip:
      "Rửa sạch ngâm nước muối loãng, để mát ăn giòn rụm mát lạnh suốt tuần.",
    badge: "Đặc Sản Giòn Ngọt",
  },
  {
    id: "toi",
    tabLabel: "Tỏi Cô Đơn",
    title: "Tỏi Cô Đơn & Tỏi Nhánh Nhơn Hải",
    origin: "Bán đảo Nhơn Hải - Vĩnh Hải",
    realSigns: [
      "Củ tỏi chắc nịch, tép nhỏ đều, rễ cắt sát khô sạch, vỏ ngoài trắng ngà vân tím nhạt tự nhiên.",
      "Khi bóc vỏ tép tỏi thơm nồng nàn, vị cay đượm ấm bụng mà không hăng rát cuống họng.",
      "Trồng trên đất cát pha san hô biển và tưới nước lợ nên hàm lượng tinh dầu và dược tính cao vượt trội.",
    ],
    fakeWarning:
      "Tránh nhầm với tỏi nhập củ to tròn đều chằn chặn, tép to xốp, ruột nhiều nước nhưng mùi vị nhạt nhẽo.",
    storageTip:
      "Treo nơi thoáng gió râm mát, tuyệt đối không bỏ túi nilon kín hay để trong tủ lạnh.",
    badge: "Dược Liệu Đất Nắng",
  },
  {
    id: "hanh",
    tabLabel: "Hành Tím",
    title: "Hành Tím Đất Cát Phan Rang",
    origin: "Vựa hành Mỹ Tường, Ninh Hải",
    realSigns: [
      "Củ hành tròn chắc, vỏ khô nhiều lớp mỏng màu đỏ tía rực rỡ, bảo quản tự nhiên 4-6 tháng không teo tóp.",
      "Tép hành cay thơm đậm vị, phi lên vàng giòn thơm nức mũi mà không bị ỉu mềm.",
      "Thu hoạch chính vụ mùa nắng gắt nên củ khô ráo, không bị ẩm mốc ruột trong.",
    ],
    fakeWarning:
      "Không chọn loại hành củ dài to bất thường, vỏ ướt sũng hoặc nhuộm phẩm màu dễ thối rữa sau vài ngày.",
    storageTip:
      "Rải ra rổ tre hoặc túi lưới nơi thoáng gió, bảo quản được 4–6 tháng.",
    badge: "Gia Vị Gác Bếp",
  },
  {
    id: "mang_tay",
    tabLabel: "Măng Tây Xanh",
    title: "Măng Tây Xanh Đất Cát Phù Sa",
    origin: "Cánh đồng cát An Hải, Ninh Phước",
    realSigns: [
      "Đọt măng thon thẳng, chồi búp bọc chặt không bung nở, gốc măng mướt giòn không bị xơ già cỗi.",
      "Thu hoạch tinh mơ lúc 4h sáng khi sương còn đọng, thân cây giòn ngọt, giàu chất xơ tự nhiên.",
      "Trồng bằng phân ủ mục hữu cơ và bón phân chuồng tự nhiên trên bãi cát ven biển.",
    ],
    fakeWarning:
      "Cẩn thận măng ngâm nước tẩy trắng phần gốc, thân teo tóp uể oải, búp hoa nở bung rơi rụng.",
    storageTip:
      "Cắm gốc vào cốc nước sâu 2cm hoặc bọc khăn ẩm quấn gốc rồi cất ngăn mát tủ lạnh.",
    badge: "Vua Rau Màu Cát",
  },
  {
    id: "cha_ca",
    tabLabel: "Chả Cá Quết",
    title: "Chả Cá Đỏ Củ & Cá Nhồng Quết Mộc",
    origin: "Cảng cá Đông Hải & Cà Ná",
    realSigns: [
      "Quết 100% từ cá đỏ củ, cá mối, cá nhồng tươi cập bến trong ngày, dẻo quánh tự nhiên nhờ lực quết tay.",
      "Miếng chả khi chiên hoặc hấp phồng đều, thơm dậy mùi tiêu sọ hành tím, vị ngọt đượm thịt cá biển sâu.",
      "Mặt chả hơi sần sùi mộc mạc chứ không bóng loáng, nhẵn thín hay dai giòn sần sật bất thường.",
    ],
    fakeWarning:
      "Tránh xa loại chả cá dai đanh do trộn hàn the hoặc độn nhiều bột mì, khi chiên teo xẹp nhăn nheo.",
    storageTip:
      "Hút chân không để ngăn đông giữ vị ngon 3 tháng; trước khi ăn rã đông tự nhiên rồi áp chảo sơ.",
    badge: "Đặc Sản Làng Biển",
  },
  {
    id: "muc",
    tabLabel: "Mực Một Nắng",
    title: "Mực Một Nắng Dẻo Nước Sâu Cà Ná",
    origin: "Làng chài biển mặn Cà Ná",
    realSigns: [
      "Chỉ xẻ từ mực ống tươi dong thuyền câu trong đêm, ráo nước biển rồi phơi đúng duy nhất 1 nắng giòn gắt.",
      "Bề mặt mực khô ráo, thịt bên trong mềm ngọt dẻo quánh, khi nướng nở phồng thơm phức vị biển.",
      "Bụng mực trắng đục tự nhiên, lưng còn nguyên lớp phấn hồng phơn phớt.",
    ],
    fakeWarning:
      "Tránh mực ngâm nước tăng trọng lượng: sờ vào mềm nhũn ướt tay, khi nướng teo tóp ra nhiều nước đục.",
    storageTip:
      "Bọc kín túi zipper hoặc hút chân không để ngăn đông -18°C, tránh lẫn mùi với đồ sống.",
    badge: "Hải Sản Khô Thượng Hạng",
  },
  {
    id: "nuoc_mam",
    tabLabel: "Nước Mắm Cà Ná",
    title: "Nước Mắm Nhĩ Cá Cơm Than Truyền Thống",
    origin: "Làng nghề nước mắm Cà Ná",
    realSigns: [
      "Ủ ròng rã 12–18 tháng từ cá cơm than béo mẫm và muối hạt sạch Phan Rang theo tỷ lệ vàng 3 cá : 1 muối.",
      "Nước mắm có màu hổ phách nâu đỏ sóng sánh, mùi thơm nồng nàn dịu êm, hậu vị ngọt đượm nơi cuống họng.",
      "Độ đạm tự nhiên từ 30–40 độ đạm nguyên chất, không cần pha hương liệu hay chất tạo sánh.",
    ],
    fakeWarning:
      "Cảnh giác nước mắm công nghiệp lỏng le lỏng lét, ngọt lợ vị bột ngọt mì chính và phẩm màu hóa học.",
    storageTip:
      "Đậy chặt nắp sau khi rót, để nơi khô mát tránh ánh nắng trực tiếp; có thể đọng muối đáy chai là bình thường.",
    badge: "Gia Vị Biển Mặn",
  },
  {
    id: "mat_nho",
    tabLabel: "Mật Nho",
    title: "Mật Nho & Rượu Nho Men Chum Sành",
    origin: "Ủ gia truyền Phước Sanh, Phan Rang",
    realSigns: [
      "Chưng cất từ 100% trái nho chín kỹ ủ cùng đường phèn nguyên chất trong chum sành phơi nắng trời.",
      "Mật có màu đỏ cánh gián sánh quyện tự nhiên, vị ngọt thanh mát, chua nhẹ hậu vị chứ không gắt khé cổ.",
      "Mở nắp dậy mùi thơm nồng nàn của men nho ủ ráo nắng, để càng lâu hương vị càng sâu.",
    ],
    fakeWarning:
      "Cảnh giác mật nho pha hương liệu màu tổng hợp: nước lỏng toẹt, ngọt gắt đường hóa học và lắng cặn đục đáy.",
    storageTip:
      "Để ở nhiệt độ phòng hoặc ngăn mát; pha với nước đá và vài giọt tắc/chanh giải nhiệt cực đã.",
    badge: "Ủ Men Truyền Thống",
  },
  {
    id: "hat_dieu",
    tabLabel: "Hạt Điều Rang Củi",
    title: "Hạt Điều Vỏ Lụa Rang Củi Truyền Thống",
    origin: "Nương rẫy Bình Sơn, Ninh Hải",
    realSigns: [
      "Hạt điều kích cỡ đều vừa vặn, còn nguyên lớp vỏ lụa nâu mỏng bảo vệ nhân hạt khỏi cháy xém.",
      "Rang thủ công trên chảo gang đun củi cà phê, hạt giòn rụm, vị ngọt bùi béo ngậy nguyên bản.",
      "Chỉ rang cùng một lượng muối biển hạt vừa đủ để tăng độ ngọt bùi chứ không mặn chát.",
    ],
    fakeWarning:
      "Tránh hạt điều ngâm hóa chất tẩy trắng vỏ, hạt ẩm mốc ỉu mềm hoặc chiên dầu công nghiệp hôi dầu.",
    storageTip:
      "Đậy kín nắp hũ sau khi ăn, tránh để hở gió làm hạt bị ỉu mất độ giòn.",
    badge: "Hạt Dinh Dưỡng Rừng Khô",
  },
];

export default function ExperienceGuideSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const tabsContainerRef = useRef(null);

  const changeTab = useCallback(
    (newIndex) => {
      if (newIndex === currentIndex || isFading) return;
      setIsFading(true);
      setTimeout(() => {
        setCurrentIndex(newIndex);
        setIsFading(false);
      }, 150);
    },
    [currentIndex, isFading]
  );

  const handlePrev = useCallback(() => {
    const nextIdx =
      (currentIndex - 1 + NINH_THUAN_EXPERIENCES.length) %
      NINH_THUAN_EXPERIENCES.length;
    changeTab(nextIdx);
  }, [currentIndex, changeTab]);

  const handleNext = useCallback(() => {
    const nextIdx = (currentIndex + 1) % NINH_THUAN_EXPERIENCES.length;
    changeTab(nextIdx);
  }, [currentIndex, changeTab]);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      handleNext();
    }, 6000);

    return () => clearInterval(timer);
  }, [isPaused, handleNext]);

  useEffect(() => {
    const container = tabsContainerRef.current;
    if (!container) return;

    const activeBtn = container.children[currentIndex];
    if (activeBtn) {
      const containerWidth = container.offsetWidth;
      const btnOffsetLeft = activeBtn.offsetLeft;
      const btnWidth = activeBtn.offsetWidth;

      container.scrollTo({
        left: btnOffsetLeft - containerWidth / 2 + btnWidth / 2,
        behavior: "smooth",
      });
    }
  }, [currentIndex]);

  const currentItem = NINH_THUAN_EXPERIENCES[currentIndex];

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="bg-white rounded-[2rem] p-6 sm:p-9 border border-stone-200/90 shadow-xs space-y-6 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-stone-100 overflow-hidden">
        <div
          key={currentIndex + (isPaused ? "-paused" : "-running")}
          className={`h-full bg-gradient-to-r from-amber-500 to-amber-700 transition-all duration-300 ${
            isPaused ? "opacity-40" : "animate-progress-6s"
          }`}
          style={{
            animationPlayState: isPaused ? "paused" : "running",
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4 pt-1">
        <div>
          <div className="flex items-center gap-2 text-amber-800 text-xs sm:text-sm font-black tracking-wider uppercase">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>Kinh nghiệm nhà nông • 10 đặc sản chuẩn gốc</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-stone-900 mt-1">
            Mẹo Phân Biệt & Nhận Diện Nông Sản Ninh Thuận Thật
          </h3>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="text-sm font-mono font-bold text-stone-500">
            {currentIndex + 1} / {NINH_THUAN_EXPERIENCES.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="w-9 h-9 rounded-full border border-stone-200 hover:border-amber-600 hover:bg-amber-50 text-stone-600 hover:text-amber-800 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              title="Xem đặc sản trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="w-9 h-9 rounded-full border border-stone-200 hover:border-amber-600 hover:bg-amber-50 text-stone-600 hover:text-amber-800 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              title="Xem đặc sản kế tiếp"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={tabsContainerRef}
        className="flex items-center gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] scroll-smooth"
      >
        {NINH_THUAN_EXPERIENCES.map((exp, idx) => (
          <button
            key={exp.id}
            type="button"
            onClick={() => changeTab(idx)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 shrink-0 cursor-pointer ${
              idx === currentIndex
                ? "bg-amber-800 text-white shadow-xs scale-[1.02]"
                : "bg-stone-100 hover:bg-stone-200 text-stone-700"
            }`}
          >
            {exp.tabLabel}
          </button>
        ))}
      </div>

      <div
        className={`grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[460px] sm:min-h-[400px] lg:min-h-[380px] transition-opacity duration-200 ease-in-out ${
          isFading ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="lg:col-span-8 p-6 sm:p-7 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-4 flex flex-col justify-between shadow-2xs">
          <div className="space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs font-black text-amber-900 bg-amber-100/90 border border-amber-300 px-3 py-1 rounded-lg">
                {currentItem.badge}
              </span>
              <span className="text-xs sm:text-sm text-stone-600 font-semibold flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-700" />
                {currentItem.origin}
              </span>
            </div>

            <h4 className="text-lg sm:text-xl font-black text-stone-900">
              {currentItem.title}
            </h4>

            <div className="space-y-2.5 pt-1">
              {currentItem.realSigns.map((sign, sIdx) => (
                <div
                  key={sIdx}
                  className="flex items-start gap-2.5 text-sm sm:text-base text-stone-700 leading-relaxed font-normal"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                  <span>{sign}</span>
                </div>
              ))}
            </div>

            {currentItem.storageTip ? (
              <div className="mt-3 sm:mt-4 p-3.5 sm:p-4 rounded-2xl bg-white/90 border border-amber-200/70 text-xs sm:text-sm text-stone-700 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2.5 shadow-2xs">
                <span className="font-bold text-amber-900 shrink-0 flex items-center gap-1.5">
                  <span>🧊</span>
                  <span>Mẹo bảo quản:</span>
                </span>
                <p className="text-stone-700 leading-relaxed font-normal">
                  {currentItem.storageTip}
                </p>
              </div>
            ) : (
              <div className="mt-3 sm:mt-4 p-3.5 sm:p-4 rounded-2xl bg-white/40 border border-amber-200/40 text-xs sm:text-sm text-stone-500 italic flex items-center gap-2">
                <span>🍃</span>
                <span>Sản phẩm tươi tự nhiên, nên dùng sớm để trọn vị ngon.</span>
              </div>
            )}
          </div>

          <div className="pt-2 text-xs text-stone-500 italic flex items-center gap-2 border-t border-amber-200/40">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>
              Di chuột vào khung để tạm dừng đọc kỹ, rời chuột để tiếp tục tự động chuyển.
            </span>
          </div>
        </div>

        <div className="lg:col-span-4 p-6 sm:p-7 rounded-2xl bg-rose-50/60 border border-rose-200/80 flex flex-col justify-between space-y-4 shadow-2xs">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Cách tránh hàng kém chất lượng</span>
            </div>

            <p className="text-sm sm:text-base text-rose-950 leading-relaxed font-normal">
              {currentItem.fakeWarning}
            </p>
          </div>

          <div className="pt-3.5 border-t border-rose-200/60 flex items-center justify-between text-xs sm:text-sm text-rose-700 font-bold">
            <span>🛡️ Bao ăn tận miệng</span>
            <span>🌿 Chuẩn gốc hái giàn</span>
          </div>
        </div>
      </div>
    </section>
  );
}