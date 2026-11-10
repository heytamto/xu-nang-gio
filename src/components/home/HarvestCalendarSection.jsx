// src/components/home/HarvestCalendarSection.jsx
import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  ShoppingBag, 
  ArrowRight, 
  MapPin, 
  Compass, 
  RotateCw, 
  Camera, 
  Sparkles,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

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
    destination: {
      spot: "Đồng Muối Đầm Vua & Làng Tỏi Nhơn Hải",
      badge: "Mùa nắng vàng ươm",
      tagline: "Chiêm ngưỡng núi muối trắng tinh khôi và cánh đồng tỏi ngút ngàn",
      experience: "Buổi sớm tinh mơ dạo quanh đồng tỏi Nhơn Hải ngửi hương cay nồng đặc trưng, check-in 'núi tuyết' muối Đầm Vua dưới nền trời trong vắt không một gợn mây.",
      bestTime: "05:30 - 08:30 sáng",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80"
    }
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
    destination: {
      spot: "Tháp Chàm Po Klong Garai & Vườn Táo Sông Dinh",
      badge: "Không gian di sản",
      tagline: "Hương sắc Champa cổ kính bên vườn cây trĩu quả",
      experience: "Khám phá cụm tháp gạch nung sừng sững trên đồi Trầu, ngắm trọn đồng bằng Phan Rang rồi ghé vào vườn táo bên bờ sông Dinh tự tay hái và thưởng thức quả ngọt mát lạnh ngay tại gốc.",
      bestTime: "Buổi chiều 15:30 - 17:30",
      image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1000&q=80"
    }
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
    destination: {
      spot: "Đồng Cừu An Hòa & Cung Đường Nho Thái An",
      badge: "Bình yên thảo nguyên",
      tagline: "Hóa thân thành dân du mục giữa bầy cừu trắng muốt",
      experience: "Ngắm hàng ngàn chú cừu gặm cỏ quanh hồ đập nước An Hòa vào sáng sớm, sau đó xuyên qua con đường hoa giấy rực rỡ để ghé giàn nho Thái An chụp hình dưới vòm lá xum xuê.",
      bestTime: "06:30 - 08:30 hoặc 16:00 - 17:30",
      image: "https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?auto=format&fit=crop&w=1000&q=80"
    }
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
    destination: {
      spot: "Vịnh Vĩnh Hy - Đệ Nhất Vịnh Biển",
      badge: "Mùa lặn san hô đẹp nhất",
      tagline: "Nước biển trong vắt như gương, êm đềm lọt thỏm giữa lòng núi Chúa",
      experience: "Đi thuyền đáy kính chiêm ngưỡng rạn san hô nguyên sơ, đắm mình tắm biển bãi Cóc, bãi Bà Điên và thưởng thức hải sản tươi rói ngay trên bè nổi.",
      bestTime: "Cả ngày (biển cực êm)",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=80"
    }
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
    destination: {
      spot: "Hang Rái & Vườn Quốc Gia Núi Chúa",
      badge: "Kỳ quan thiên nhiên",
      tagline: "Thác nước trên biển độc nhất vô nhị từ thềm san hô cổ nghìn năm",
      experience: "Đón bình minh kỳ ảo khi từng đợt sóng biển tràn qua mặt đá vôi cổ tạo thành dòng thác nước đổ ngoạn mục; khám phá hệ sinh thái rừng khô hạn độc đáo của Khu dự trữ sinh quyển thế giới.",
      bestTime: "05:00 - 07:00 sáng",
      image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80"
    }
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
    destination: {
      spot: "Đồi Cát Nam Cương - Tiểu Sa Mạc",
      badge: "Sóng cát biến hình",
      tagline: "Những dải cát vàng óng ả uốn lượn theo từng làn gió biển",
      experience: "Đi chân trần cảm nhận sự mịn màng của hạt cát còn vương chút nắng ấm, chụp những bức ảnh silhouette ngược sáng tuyệt đẹp và ngắm các thiếu nữ Chăm đội thúng băng qua đồi.",
      bestTime: "05:30 - 07:00 hoặc 16:30 - 18:00",
      image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1000&q=80"
    }
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
    destination: {
      spot: "Mũi Dinh & Hải Đăng Cổ Hơn Trăm Năm",
      badge: "Chinh phục địa đầu gió",
      tagline: "Vách đá sừng sững cheo leo giữa sa mạc và đại dương xanh ngắt",
      experience: "Trải nghiệm xe địa hình vượt cồn cát sa mạc hoang sơ, lội qua bãi Tràng biển xanh màu ngọc bích rồi leo lên ngọn hải đăng Pháp cổ ngắm trọn dải bờ biển lộng gió.",
      bestTime: "15:00 - 18:00",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80"
    }
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
    destination: {
      spot: "Cung Đường Biển Vĩnh Hy - Bình Tiên",
      badge: "Top cung đường ven biển",
      tagline: "Một bên là sườn Núi Chúa hùng vĩ, một bên là vịnh biển xanh ngọc",
      experience: "Lái xe máy thong dong hít hà gió biển, dừng chân tại các chòi vọng cảnh để thu vào tầm mắt toàn cảnh biển trời bao la và những mũi đá nhô ra mặt biển kỳ vĩ.",
      bestTime: "08:00 - 10:00 hoặc 15:30 - 17:30",
      image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=80"
    }
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
    destination: {
      spot: "Làng Gốm Bàu Trúc & Làng Dệt Mỹ Nghiệp",
      badge: "Làng nghề cổ xưa nhất ĐNA",
      tagline: "Nghệ thuật nhào nặn đất sét không bàn xoay và sắc màu thổ cẩm",
      experience: "Hòa cùng không khí chuẩn bị lễ hội Katê linh thiêng, tự tay xoay thân mình quanh khối đất sét nung lộ thiên của nghệ nhân Bàu Trúc và chiêm ngưỡng khung cửi dệt tay trăm tuổi.",
      bestTime: "08:30 - 11:00 hoặc 14:00 - 16:30",
      image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1000&q=80"
    }
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
    destination: {
      spot: "Thác Chapơr (Bác Ái) & Rừng Nguyên Sinh",
      badge: "Bản tình ca miền sơn cước",
      tagline: "Dải lụa trắng xóa đổ thẳng từ vách đá dựng đứng giữa đại ngàn",
      experience: "Khám phá vùng đất Raglai mộc mạc, trekking nhẹ qua tán rừng nguyên sinh râm mát và hòa mình vào làn nước trong vắt mát rượi dưới chân dòng thác linh thiêng.",
      bestTime: "09:00 - 14:00",
      image: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1000&q=80"
    }
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
    destination: {
      spot: "Cánh Đồng Điện Gió Đầm Nại",
      badge: "Khung cảnh tựa trời Âu",
      tagline: "Những cánh quạt gió khổng lồ quay thong thả giữa đồng lúa bao la",
      experience: "Đạp xe dạo quanh bờ đầm, thả hồn theo những cánh quạt gió sừng sững vươn lên nền mây trời lúc hoàng hôn đỏ rực buông xuống mặt nước phẳng lặng.",
      bestTime: "16:00 - 17:45",
      image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1000&q=80"
    }
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
    destination: {
      spot: "Vườn Quốc Gia Phước Bình & Thung Lũng Mây",
      badge: "Đà Lạt thu nhỏ của Ninh Thuận",
      tagline: "Khí hậu mát lạnh sương mù và vẻ hoang dã của núi rừng giáp ranh cao nguyên",
      experience: "Tận hưởng không khí se lạnh cuối năm, ngắm thảo nguyên cỏ lau trập trùng, thưởng thức chuối hột mồ côi và thịt heo đen nướng than hồng bên bếp củi đồng bào Churu.",
      bestTime: "07:00 - 11:00 hoặc cắm trại qua đêm",
      image: "https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1000&q=80"
    }
  },
];

export default function HarvestCalendarSection({ onNavigateShop }) {
  const currentRealMonth = useMemo(() => new Date().getMonth() + 1, []);
  const [selectedMonth, setSelectedMonth] = useState(currentRealMonth);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // State hiệu ứng nhấn lún đàn hồi
  const [isPressing, setIsPressing] = useState(false);
  const pressTimerRef = useRef(null);

  const activeMonthData = useMemo(() => {
    return (
      MONTHLY_HARVEST_CALENDAR.find((m) => m.month === selectedMonth) ||
      MONTHLY_HARVEST_CALENDAR[0]
    );
  }, [selectedMonth]);

  // Click chọn tháng hoặc lật thẻ khi click vào thẻ đang mở
  const handleCardClick = (month) => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);

    if (selectedMonth === month) {
      setIsPressing(true);
      pressTimerRef.current = setTimeout(() => {
        setIsFlipped((prev) => !prev);
        setIsPressing(false);
      }, 160);
    } else {
      setIsPressing(true);
      pressTimerRef.current = setTimeout(() => {
        setSelectedMonth(month);
        setIsFlipped(false);
        setIsPressing(false);
      }, 130);
    }
  };

  // Nút chuyển tháng lùi / tiến
  const handlePrevMonth = () => {
    const prev = selectedMonth === 1 ? 12 : selectedMonth - 1;
    handleCardClick(prev);
  };

  const handleNextMonth = () => {
    const next = selectedMonth === 12 ? 1 : selectedMonth + 1;
    handleCardClick(next);
  };

  // Điều hướng bằng bàn phím (Phím mũi tên ← →)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") handlePrevMonth();
      if (e.key === "ArrowRight") handleNextMonth();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedMonth]);

  return (
    <section className="bg-white rounded-3xl p-5 sm:p-8 border border-stone-200/90 shadow-xs space-y-5 font-sans">
      {/* 1. HEADER SECTION (CHỨA CỤM 7 / 10 VÀ 2 NÚT TRÒN ĐIỀU HƯỚNG) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-amber-800 text-xs sm:text-sm font-black tracking-wider uppercase">
            <Compass className="w-4 h-4 text-amber-700 animate-spin-slow" />
            <span>Xứ Nắng Gió • Nông Sản & Điểm Đến Phan Rang</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-stone-900 mt-1">
            Lịch Mùa Vụ Thu Hoạch & Trải Nghiệm 12 Tháng
          </h3>
        </div>

        {/* CỤM ĐIỀU HƯỚNG THEO MẪU: [ THÁNG / 12 ] [ < ] [ > ] */}
        <div className="flex items-center gap-4 self-end sm:self-auto">
          {/* Chỉ số tháng */}
          <div className="font-mono font-bold text-stone-600 text-base sm:text-lg tracking-wider select-none">
            <span className="text-stone-900 font-black">{selectedMonth}</span>
            <span className="text-stone-400 mx-1.5">/</span>
            <span>12</span>
          </div>

          {/* Cặp nút mũi tên tròn */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-10 h-10 rounded-full border border-stone-200 hover:border-stone-400 bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-900 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-90"
              title="Tháng trước (Phím ←)"
            >
              <ChevronLeft className="w-5 h-5 -ml-0.5" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-10 h-10 rounded-full border border-stone-200 hover:border-stone-400 bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-900 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-90"
              title="Tháng tiếp theo (Phím →)"
            >
              <ChevronRight className="w-5 h-5 -mr-0.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-stone-500 px-1 font-medium">
        <span className="flex items-center gap-1.5 text-amber-800">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Click vào thẻ đang mở để <strong>nhún lật 3D</strong> xem địa danh Ninh Thuận. Dùng nút mũi tên hoặc phím <strong>← →</strong> để chuyển tháng.</span>
        </span>
        <span className="font-mono hidden sm:inline text-stone-400">
          Mặt hiển thị: {isFlipped ? "🗺️ Điểm đến du lịch" : "🍇 Nông sản mùa màng"}
        </span>
      </div>

      {/* =========================================================================
          2. GIAO DIỆN MOBILE (3D FLIP CARD)
          ========================================================================= */}
      <div className="block md:hidden space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {MONTHLY_HARVEST_CALENDAR.map((item) => {
            const isSelected = item.month === selectedMonth;
            const isCurrent = item.month === currentRealMonth;

            return (
              <button
                key={item.month}
                type="button"
                onClick={() => handleCardClick(item.month)}
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
          <div className="perspective-card min-h-[530px] w-full">
            <div 
              onClick={() => handleCardClick(activeMonthData.month)}
              className={`relative w-full min-h-[530px] rounded-3xl transition-transform duration-700 mac-spring transform-style-preserve-3d cursor-pointer ${
                isFlipped ? "rotate-y-180" : ""
              } ${isPressing ? "scale-[0.97]" : "scale-100"}`}
            >
              {/* MẶT TRƯỚC (NÔNG SẢN) */}
              <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl overflow-hidden bg-stone-900 text-white p-6 border border-stone-700/80 shadow-xl flex flex-col justify-between">
                <div className="absolute inset-0 pointer-events-none">
                  <img
                    src={activeMonthData.image}
                    alt={activeMonthData.title}
                    className="w-full h-full object-cover filter brightness-[0.62] contrast-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/65 to-black/45" />
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
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-md">
                    <RotateCw className="w-3 h-3 text-amber-300" />
                    <span>Chạm để lật</span>
                  </div>
                </div>

                <div className="relative z-10 space-y-3.5 my-auto py-3">
                  <h4 className="text-xl sm:text-2xl font-black text-white leading-snug drop-shadow-md">
                    {activeMonthData.title}
                  </h4>
                  <div className="p-4 rounded-2xl bg-black/55 border border-white/15 backdrop-blur-md text-xs sm:text-sm text-stone-100 leading-relaxed space-y-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">🌾 Đặc trưng mùa màng:</span>
                      <p className="text-stone-100 font-normal leading-relaxed">{activeMonthData.desc}</p>
                    </div>
                    <div className="flex flex-col gap-1 pt-2.5 border-t border-white/10">
                      <span className="text-amber-300 font-bold text-xs uppercase tracking-wider">💡 Thưởng thức:</span>
                      <p className="text-amber-100 font-normal leading-relaxed">{activeMonthData.tips}</p>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 space-y-3 pt-1" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between text-xs px-1 text-stone-300">
                    <span className="text-amber-400 font-mono uppercase font-bold">Đặc sản chọn lọc:</span>
                    <span className="font-bold text-white">{activeMonthData.highlight}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateShop?.(activeMonthData.categoryTarget || "all")}
                    className="w-full h-11 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-stone-950 font-black text-sm flex items-center justify-center gap-2 active:scale-95 shadow-md cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Xem Nông Sản Tháng {activeMonthData.month}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* MẶT SAU (ĐIỂM ĐẾN) */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl overflow-hidden bg-stone-900 text-white p-6 border border-emerald-500/50 shadow-xl flex flex-col justify-between">
                <div className="absolute inset-0 pointer-events-none">
                  <img
                    src={activeMonthData.destination.image}
                    alt={activeMonthData.destination.spot}
                    className="w-full h-full object-cover filter brightness-[0.62] contrast-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/65 to-black/45" />
                </div>

                <div className="relative z-10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs px-3 py-1 rounded-xl bg-emerald-400 text-stone-950 shadow-md">
                      THÁNG {activeMonthData.month}
                    </span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-400/30 text-emerald-300 backdrop-blur-md">
                      Khám Phá Điểm Đến
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-md">
                    <RotateCw className="w-3 h-3 text-emerald-300" />
                    <span>Lật lại</span>
                  </div>
                </div>

                <div className="relative z-10 space-y-3.5 my-auto py-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{activeMonthData.destination.badge}</span>
                  </div>
                  <h4 className="text-xl sm:text-2xl font-black text-white leading-snug drop-shadow-md">
                    {activeMonthData.destination.spot}
                  </h4>
                  <div className="p-4 rounded-2xl bg-black/60 border border-emerald-400/25 backdrop-blur-md text-xs sm:text-sm text-stone-100 leading-relaxed space-y-3">
                    <p className="text-emerald-200 font-semibold italic text-xs">"{activeMonthData.destination.tagline}"</p>
                    <div className="flex flex-col gap-1 pt-1.5 border-t border-white/10">
                      <span className="text-amber-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5" />
                        <span>Trải nghiệm không thể bỏ qua:</span>
                      </span>
                      <p className="text-stone-100 font-normal leading-relaxed">{activeMonthData.destination.experience}</p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 text-stone-300 font-mono">
                      <span>Khung giờ đẹp nhất:</span>
                      <strong className="text-white">{activeMonthData.destination.bestTime}</strong>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 space-y-3 pt-1" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between text-xs px-1 text-stone-300">
                    <span className="text-emerald-400 font-mono uppercase font-bold">Địa danh gợi ý:</span>
                    <span className="font-bold text-white truncate ml-2">{activeMonthData.destination.spot}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateShop?.(activeMonthData.categoryTarget || "all")}
                    className="w-full h-11 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-500 to-emerald-600 text-stone-950 font-black text-sm flex items-center justify-center gap-2 active:scale-95 shadow-md cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Xem Nông Sản Vùng {activeMonthData.destination.spot.split("&")[0]}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          3. GIAO DIỆN DESKTOP (MÔ HÌNH MẶT NỊT FLOAT CHÍNH GIỮA CÂN ĐỐI 100%)
          ========================================================================= */}
      <div className="hidden md:block relative w-full h-[620px] lg:h-[660px] select-none rounded-3xl p-3.5 bg-[#FAF6F0] border border-stone-200/90 shadow-inner overflow-visible">
        
        {/* LỚP 1: 12 THẺ CỘT ĐỨNG PHÂN BỐ CÂN XỨNG */}
        <div className="w-full h-full flex flex-row items-stretch gap-2">
          {MONTHLY_HARVEST_CALENDAR.map((item) => {
            const isCurrent = item.month === currentRealMonth;
            const isSelected = item.month === selectedMonth;
            const highlightShort =
              item.highlight.split(" ")[0] + " " + (item.highlight.split(" ")[1] || "");

            return (
              <div
                key={item.month}
                onClick={() => handleCardClick(item.month)}
                className={`relative flex-1 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 group/card ${
                  isSelected 
                    ? "opacity-20 scale-95 pointer-events-none"
                    : "opacity-100 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-lg hover:z-10"
                }`}
              >
                <div className="absolute inset-0 bg-stone-900 border border-white/20">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover filter brightness-95 contrast-105 group-hover/card:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/45" />
                </div>

                <div className="absolute inset-0 py-4 px-1 flex flex-col items-center justify-between pointer-events-none z-10">
                  <div className="flex flex-col items-center gap-1.5">
                    <span
                      className={`font-mono font-black text-xs px-2 py-0.5 rounded-lg shadow-2xs backdrop-blur-md transition-colors ${
                        isCurrent
                          ? "bg-amber-400 text-stone-950 ring-1 ring-amber-300"
                          : "bg-black/60 text-white border border-white/30 group-hover/card:border-amber-400 group-hover/card:text-amber-300"
                      }`}
                    >
                      T{item.month}
                    </span>
                    {isCurrent && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </div>

                  <div className="my-auto py-2 flex items-center justify-center overflow-visible">
                    <span
                      className="font-black text-lg lg:text-[26px] tracking-[0.1em] uppercase text-transparent select-none whitespace-nowrap transition-transform duration-300 group-hover/card:scale-105"
                      style={{
                        writingMode: "vertical-rl",
                        transform: "rotate(180deg)",
                        WebkitTextStroke: "1.2px rgba(255, 255, 255, 0.45)",
                        filter: `
                          drop-shadow(-1px -1px 1px rgba(255, 255, 255, 0.95))
                          drop-shadow(1px 1px 2px rgba(255, 255, 255, 0.4))
                          drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.65))
                        `,
                        fontFamily: '"Nunito", "Montserrat", system-ui, sans-serif',
                      }}
                    >
                      {highlightShort}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-black text-white/90 drop-shadow-md pb-0.5">
                    #{item.month < 10 ? `0${item.month}` : item.month}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* LỚP 2: THẺ NỔI "MẶT NỊT" NUỐT TRỌN CHIỀU CAO CHÂN THẺ */}
        <div className="absolute -top-3.5 -bottom-3.5 left-1/2 -translate-x-1/2 w-[520px] lg:w-[580px] z-40 pointer-events-none perspective-card">
          <div
            onClick={() => handleCardClick(activeMonthData.month)}
            style={{ transitionProperty: "transform, box-shadow" }}
            className={`w-full h-full rounded-3xl pointer-events-auto cursor-pointer mac-spring duration-500 transform-style-preserve-3d ${
              isFlipped ? "rotate-y-180" : ""
            } ${
              isPressing 
                ? "scale-[0.97] shadow-xl"
                : "scale-100 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.65)]"
            }`}
          >
            {/* ----------------- MẶT TRƯỚC: NÔNG SẢN ----------------- */}
            <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl overflow-hidden bg-stone-900 border-2 border-amber-400/90 ring-4 ring-amber-500/30 flex flex-col justify-between p-7 lg:p-9 shadow-2xl">
              <div className="absolute inset-0 pointer-events-none">
                <img
                  src={activeMonthData.image}
                  alt={activeMonthData.title}
                  className="w-full h-full object-cover filter brightness-[0.70] contrast-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/60 to-black/45" />
              </div>

              <div className="relative z-10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs lg:text-sm px-3.5 py-1 rounded-xl bg-amber-400 text-stone-950 shadow-md">
                    THÁNG {activeMonthData.month}
                  </span>
                  <span className="text-xs font-bold px-3.5 py-1 rounded-full bg-black/50 border border-white/20 text-amber-200 backdrop-blur-md">
                    {activeMonthData.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-200 bg-black/40 border border-white/20 px-3 py-1 rounded-full backdrop-blur-md hover:bg-black/60 transition-colors">
                    <RotateCw className="w-3 h-3 text-amber-300" />
                    <span>Click để lật sang điểm đến</span>
                  </span>

                  {activeMonthData.month === currentRealMonth && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-400/40 px-3 py-1 rounded-full backdrop-blur-md shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Chính vụ</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="relative z-10 space-y-4 my-auto py-2">
                <h4 className="text-2xl lg:text-3xl font-black text-white tracking-tight leading-snug drop-shadow-md">
                  {activeMonthData.title}
                </h4>

                <div className="p-5 rounded-2xl bg-black/60 border border-white/15 backdrop-blur-md text-xs lg:text-sm text-stone-100 leading-relaxed font-normal space-y-3.5 shadow-lg">
                  <div className="flex items-start gap-2.5">
                    <span className="shrink-0 text-amber-400 font-bold">🌾 Đặc trưng:</span>
                    <span className="text-stone-100 leading-relaxed">
                      {activeMonthData.desc}
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 pt-2.5 border-t border-white/10">
                    <span className="shrink-0 text-amber-300 font-bold">💡 Thưởng thức:</span>
                    <span className="text-amber-100 leading-relaxed">
                      {activeMonthData.tips}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 relative z-30 pt-1" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between text-xs lg:text-sm px-1 text-stone-300">
                  <span className="text-amber-400 font-mono tracking-wider uppercase text-xs font-bold">
                    Đặc sản chính vụ:
                  </span>
                  <span className="font-bold text-white text-sm">
                    {activeMonthData.highlight}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onNavigateShop?.(activeMonthData.categoryTarget || "all");
                  }}
                  className="w-full h-12 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs lg:text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer shadow-md"
                >
                  <ShoppingBag className="w-4 h-4 text-stone-950" />
                  <span>Ghé Xem Nông Sản Tháng {activeMonthData.month}</span>
                  <ArrowRight className="w-4 h-4 text-stone-950" />
                </button>
              </div>
            </div>

            {/* ----------------- MẶT SAU: ĐIỂM ĐẾN DU LỊCH ----------------- */}
            <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl overflow-hidden bg-stone-900 border-2 border-emerald-400/90 ring-4 ring-emerald-500/30 flex flex-col justify-between p-7 lg:p-9 shadow-2xl">
              <div className="absolute inset-0 pointer-events-none">
                <img
                  src={activeMonthData.destination.image}
                  alt={activeMonthData.destination.spot}
                  className="w-full h-full object-cover filter brightness-[0.65] contrast-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/60 to-black/45" />
              </div>

              <div className="relative z-10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs lg:text-sm px-3.5 py-1 rounded-xl bg-emerald-400 text-stone-950 shadow-md">
                    THÁNG {activeMonthData.month}
                  </span>
                  <span className="text-xs font-bold px-3.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-400/30 text-emerald-300 backdrop-blur-md">
                    Trải Nghiệm Du Lịch Bản Địa
                  </span>
                </div>

                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-200 bg-black/40 border border-white/20 px-3 py-1 rounded-full backdrop-blur-md hover:bg-black/60 transition-colors">
                  <RotateCw className="w-3 h-3 text-emerald-300" />
                  <span>Click để lật lại nông sản</span>
                </span>
              </div>

              <div className="space-y-4 my-auto py-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{activeMonthData.destination.badge}</span>
                </div>

                <h4 className="text-2xl lg:text-3xl font-black text-white tracking-tight leading-snug drop-shadow-md">
                  {activeMonthData.destination.spot}
                </h4>

                <div className="p-5 rounded-2xl bg-black/60 border border-emerald-400/25 backdrop-blur-md text-xs lg:text-sm text-stone-100 leading-relaxed font-normal space-y-3 shadow-lg">
                  <p className="text-emerald-200 font-semibold italic text-xs lg:text-sm">
                    "{activeMonthData.destination.tagline}"
                  </p>
                  <div className="flex items-start gap-2.5 pt-2 border-t border-white/10">
                    <span className="shrink-0 text-amber-300 font-bold flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Trải nghiệm:</span>
                    </span>
                    <span className="text-stone-100 leading-relaxed">
                      {activeMonthData.destination.experience}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs text-stone-300 font-mono">
                    <span>Khung giờ chụp ảnh đẹp:</span>
                    <strong className="text-white font-bold">{activeMonthData.destination.bestTime}</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-3 relative z-30 pt-1" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between text-xs lg:text-sm px-1 text-stone-300">
                  <span className="text-emerald-400 font-mono uppercase font-bold">
                    Địa danh gợi ý:
                  </span>
                  <span className="font-bold text-white text-sm">
                    {activeMonthData.destination.spot}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onNavigateShop?.(activeMonthData.categoryTarget || "all");
                  }}
                  className="w-full h-12 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-stone-950 font-black text-xs lg:text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer shadow-md"
                >
                  <ShoppingBag className="w-4 h-4 text-stone-950" />
                  <span>Xem Nông Sản Vùng {activeMonthData.destination.spot.split("&")[0]}</span>
                  <ArrowRight className="w-4 h-4 text-stone-950" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 4. CHỈ MỤC 12 CHẤM TRÒN (MONTH INDICATOR DOTS) */}
      <div className="hidden md:flex items-center justify-center gap-2 pt-2">
        {MONTHLY_HARVEST_CALENDAR.map((item) => {
          const isSelected = item.month === selectedMonth;
          const isCurrent = item.month === currentRealMonth;

          return (
            <button
              key={item.month}
              type="button"
              onClick={() => handleCardClick(item.month)}
              title={`Chuyển đến Tháng ${item.month} (${item.highlight})`}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                isSelected 
                  ? "w-8 bg-amber-700" 
                  : isCurrent 
                    ? "w-3 bg-emerald-500 hover:w-5" 
                    : "w-2 bg-stone-300 hover:bg-stone-400 hover:w-4"
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}