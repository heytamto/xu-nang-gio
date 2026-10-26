// src/pages/HomePage.jsx
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
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
  PackageCheck,
  TrendingUp,
  Quote,
  X,
  Loader2,
  MoveHorizontal,
} from "lucide-react";
import ProductCard from "../components/ProductCard";
import {
  fetchTotalOrdersCount,
  fetchPaginatedApprovedReviews,
} from "../services/orderService";
import { formatDate } from "../utils/dateUtils";

// Bản đồ Icon dự phòng cho danh mục
const CATEGORY_ID_ICON_MAP = {
  cat01: Sparkles, // Combo Ưu Đãi
  cat02: Apple,    // Trái Cây Tươi Giàn
  cat03: Flame,    // Nem & Chả Đặc Sản
  cat04: Fish,     // Hải Sản Gió Biển
  cat05: Wine,     // Gia Vị Xứ Nắng / Mật Nho
  cat06: Leaf,     // Đặc Sản Sấy Dẻo
};

// DỮ LIỆU ĐẶC SẢN 12 THÁNG NẮNG GIÓ PHAN RANG
const MONTHLY_HARVEST_CALENDAR = [
  {
    month: 1,
    title: "Vào Vụ Tỏi Cô Đơn & Hành Tím Gác Bếp",
    highlight: "Tỏi Cô Đơn Nhơn Hải",
    status: "Chính vụ đầu năm",
    statusBadge: "bg-amber-100 text-amber-900 border-amber-300",
    desc: "Đầu năm đất cát Nhơn Hải ráo gắt, tỏi cô đơn củ chắc nịch tích tụ dược tính và tinh dầu thơm nồng nhất năm.",
    categoryTarget: "cat05",
    image:
      "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=1000&q=80",
    tips: "Tỏi đầu mùa củ vỏ bóng trắng vân tía nhạt, mua gác bếp ăn cả năm không lo óp lép.",
  },
  {
    month: 2,
    title: "Táo Gió Mật Đón Nắng Xuân Phước Hậu",
    highlight: "Táo Gió Mật Giòn",
    status: "Rộ ngọt mọng nước",
    statusBadge: "bg-emerald-100 text-emerald-900 border-emerald-300",
    desc: "Vườn táo giòn ngọt, vỏ phớt vàng mơ, cắn vào giòn rụm mọng nước giải nhiệt ngày nắng.",
    categoryTarget: "cat02",
    image:
      "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=1000&q=80",
    tips: "Táo bọc lưới sinh học không phun xịt, rửa nước muối loãng là có thể ăn cả vỏ giòn tan.",
  },
  {
    month: 3,
    title: "Khai Vụ Nho Đỏ Red Cardinal Cắt Giàn",
    highlight: "Nho Đỏ Cắt Giàn",
    status: "Chính vụ mùa khô",
    statusBadge: "bg-rose-100 text-rose-900 border-rose-300",
    desc: "Nho đỏ bắt đầu chín rộ các giàn Thái An. Trái đỏ tím cánh gián, vị chua ngọt thanh mát tự nhiên.",
    categoryTarget: "cat02",
    image:
      "https://images.unsplash.com/photo-1596363505729-4190a9506133?auto=format&fit=crop&w=1000&q=80",
    tips: "Chùm cuống tươi xanh mướt, quả khít đều. Ăn tươi hoặc làm siro nho đá tuyết cực đã.",
  },
  {
    month: 4,
    title: "Mực Ống Một Nắng Cà Ná Dong Thuyền Đêm",
    highlight: "Mực Một Nắng Cà Ná",
    status: "Mùa biển êm trúng lộc",
    statusBadge: "bg-cyan-100 text-cyan-900 border-cyan-300",
    desc: "Mực ống câu đêm vừa cập bến rạng sáng, xẻ phơi đúng 1 nắng gắt giòn, dày cơm dẻo quánh.",
    categoryTarget: "cat04",
    image:
      "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1000&q=80",
    tips: "Nướng than hoa hoặc chiên nước mắm, xé ra thịt mực nở phồng thơm nức mùi biển Cà Ná.",
  },
  {
    month: 5,
    title: "Rộ Nho Xanh NH01-48 Giòn Ngọt",
    highlight: "Nho Xanh Ninh Thuận",
    status: "Cao điểm thu hái giàn",
    statusBadge: "bg-emerald-100 text-emerald-900 border-emerald-300",
    desc: "Nắng rực rỡ nhất giúp nho xanh tích lũy lượng đường cực đại, vỏ bóng phấn, giòn ngọt thanh tao.",
    categoryTarget: "cat02",
    image:
      "https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=1000&q=80",
    tips: "Nho có phấn trắng tự nhiên bọc quanh vỏ là dấu hiệu của chùm mới cắt sớm, chưa qua xử lý.",
  },
  {
    month: 6,
    title: "Măng Tây Xanh Cát Phù Sa An Hải",
    highlight: "Măng Tây Xanh Giòn",
    status: "Đọt non tươi rói",
    statusBadge: "bg-emerald-100 text-emerald-800 border-emerald-300",
    desc: "Măng thu hoạch tinh mơ khi sương còn đọng, thân giòn bùi mọng nước, giàu dinh dưỡng.",
    categoryTarget: "cat02",
    image:
      "https://images.unsplash.com/photo-1515471204630-e4b2d30560a6?auto=format&fit=crop&w=1000&q=80",
    tips: "Xào tỏi, nấu súp hoặc luộc chấm kho quẹt giòn ngọt mát ruột.",
  },
  {
    month: 7,
    title: "Chả Cá Đỏ Củ Quết Mộc Đông Hải",
    highlight: "Chả Cá Quết Tay",
    status: "Mùa cá cơm & cá đỏ củ",
    statusBadge: "bg-amber-100 text-amber-900 border-amber-300",
    desc: "Cá biển sâu tươi rói cập cảng quết ngay cùng tiêu sọ và hành tím, dẻo dai tự nhiên không pha bột.",
    categoryTarget: "cat03",
    image:
      "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=1000&q=80",
    tips: "Chiên phồng chấm mắm tỏi ớt hoặc thả lẩu, nấu bánh canh cá ngọt nước đậm đà.",
  },
  {
    month: 8,
    title: "Mật Nho Chum Sành Ủ Men Nắng Trời",
    highlight: "Mật Nho Chum Sành",
    status: "Ủ ráo đượm vị",
    statusBadge: "bg-purple-100 text-purple-900 border-purple-300",
    desc: "Nho chín rộ tháng 6-7 được ủ đường phèn trong chum sành phơi nắng ráo, chắt ra mẻ mật sền sệt đỏ cánh gián.",
    categoryTarget: "cat05",
    image:
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1000&q=80",
    tips: "Pha cùng đá lạnh và vài giọt nước cốt tắc giải khát cực sâu cổ họng.",
  },
  {
    month: 9,
    title: "Nước Mắm Nhĩ Cá Cơm Than Cà Ná Khai Thùng",
    highlight: "Nước Mắm Cà Ná",
    status: "Đủ 12 tháng ủ ròng",
    statusBadge: "bg-amber-100 text-amber-900 border-amber-300",
    desc: "Cá cơm than béo mẫm ủ muối tinh khiết 12-18 tháng ráo nắng, giọt mắm màu cánh gián thơm phức đượm vị biển.",
    categoryTarget: "cat05",
    image:
      "https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&w=1000&q=80",
    tips: "Chấm thịt luộc, rau sống hoặc làm quà biếu chuẩn phong vị làng nghề cổ truyền.",
  },
  {
    month: 10,
    title: "Táo Gió Mật Trở Lại Vụ Đông Xuân",
    highlight: "Táo Gió Giòn Mật",
    status: "Bắt đầu rộ lứa mới",
    statusBadge: "bg-emerald-100 text-emerald-900 border-emerald-300",
    desc: "Thời tiết se lạnh hanh hao làm thịt quả táo dày chắc, cắn ngập răng giòn ngọt thanh lành.",
    categoryTarget: "cat02",
    image:
      "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=1000&q=80",
    tips: "Chọn trái căng đều, cuống còn tươi xanh là táo vừa cắt giàn buổi sớm.",
  },
  {
    month: 11,
    title: "Nho Đen Không Hạt & Nho Kẹo Sấy Dẻo",
    highlight: "Nho Sấy Dẻo Tự Nhiên",
    status: "Phơi sấy chuẩn bị Tết",
    statusBadge: "bg-purple-100 text-purple-900 border-purple-300",
    desc: "Nho chín mọng đưa vào lò sấy nhiệt chậm, giữ nguyên lớp mật dẻo tự nhiên, không ngậm đường công nghiệp.",
    categoryTarget: "cat06",
    image:
      "https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&w=1000&q=80",
    tips: "Thích hợp làm món ăn vặt lành mạnh, làm bánh hoặc làm quà Tết quê thơm thảo.",
  },
  {
    month: 12,
    title: "Hạt Điều Rang Củi & Combo Giỏ Quà Nắng Gió",
    highlight: "Hạt Điều Rang Củi",
    status: "Mùa lễ hội & biếu tặng",
    statusBadge: "bg-amber-100 text-amber-900 border-amber-300",
    desc: "Hạt điều nương rẫy Bình Sơn rang chảo gang đun củi thơm lừng, giòn bùi ngậy béo phục vụ mùa Tết sum vầy.",
    categoryTarget: "cat01",
    image:
      "https://images.unsplash.com/photo-1509912760195-4f6cfd939638?auto=format&fit=crop&w=1000&q=80",
    tips: "Bóc nhẹ lớp vỏ lụa mỏng để thưởng thức trọn vẹn vị béo ngậy nguyên bản không khét dầu.",
  },
];

// CẨM NANG 10 ĐẶC SẢN CHUẨN GỐC NINH THUẬN
const NINH_THUAN_EXPERIENCES = [
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

const FALLBACK_CUSTOMER_REVIEWS = [
  {
    id: "fb-1",
    customer_name: "Chị Ánh Tuyết",
    role: "Quận 7, TP.HCM",
    content:
      "Chùm nho xanh với táo gió mở thùng xốp ra cuống còn tươi rói chảy mủ luôn. Vị ngọt thanh mát tự nhiên chứ không gắt đường. Cả nhà ai cũng khen!",
    rating: 5,
    order_code: "XNG2609-8812",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "fb-2",
    customer_name: "Anh Hoàng Nam",
    role: "Ba Đình, Hà Nội",
    content:
      "Đóng gói chèn rơm với đá gel cực kỳ chu đáo. Gửi xe ra tới Hà Nội 2 ngày mà quả táo không hề bị cấn dập. Mật nho sền sệt pha đá uống giải nhiệt bao đã.",
    rating: 5,
    order_code: "XNG2610-4109",
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "fb-3",
    customer_name: "Cô Mỹ Hạnh",
    role: "Hải Châu, Đà Nẵng",
    content:
      "Chả cá quết dẻo dai thơm tiêu sọ, nướng sơ qua chấm muối ớt chanh ăn nghiện luôn. Thích nhất cách nhà vườn thật thà, bao ăn từng quả.",
    rating: 5,
    order_code: "XNG2608-1123",
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
];

export default function HomePage({
  products = [],
  categories = [],
  reviews = [],
  shopConfig = {},
  onAddToCart,
  onNavigateShop,
  onNavigateStory,
  onNavigate,
}) {
  const scrollRef = useRef(null);
  const reviewsScrollRef = useRef(null);

  const [realOrderCount, setRealOrderCount] = useState(1200);

  const currentRealMonth = useMemo(() => new Date().getMonth() + 1, []);
  const [selectedMonth, setSelectedMonth] = useState(currentRealMonth);

  const [reviewsList, setReviewsList] = useState([]);
  const [totalReviewsCount, setTotalReviewsCount] = useState(0);
  const [reviewPage, setReviewPage] = useState(0);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const [isLoadingMoreReviews, setIsLoadingMoreReviews] = useState(false);
  const isFetchingRef = useRef(false);

  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const isDragMoved = useRef(false);
  const autoScrollRafRef = useRef(null);
  const isLoopResetting = useRef(false);

  const [activeLightboxImg, setActiveLightboxImg] = useState(null);

  const isReviewsEnabled =
    shopConfig?.showCustomerReviews !== false &&
    String(shopConfig?.showCustomerReviews).toUpperCase() !== "FALSE";

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setActiveLightboxImg(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const scrollCategories = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -280 : 280;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const loadReviewsBatch = useCallback(
    async (pageToLoad = 0, isInitial = false) => {
      if (isFetchingRef.current) return;
      if (!isInitial && !hasMoreReviews) return;

      isFetchingRef.current = true;
      setIsLoadingMoreReviews(true);

      try {
        const res = await fetchPaginatedApprovedReviews(pageToLoad, 6);
        setTotalReviewsCount(res.totalCount || 0);
        setHasMoreReviews(res.hasMore);

        if (res.reviews && res.reviews.length > 0) {
          setReviewsList((prev) => {
            if (isInitial) return res.reviews;
            const existingIds = new Set(
              prev.map((r) => r.id || r.code || r.order_code),
            );
            const newUnique = res.reviews.filter(
              (r) => !existingIds.has(r.id || r.code || r.order_code),
            );
            return [...prev, ...newUnique];
          });
          setReviewPage(pageToLoad);
        } else if (isInitial) {
          setReviewsList(FALLBACK_CUSTOMER_REVIEWS);
        }
      } catch (err) {
        console.warn("Lỗi tải đánh giá:", err);
        if (isInitial) setReviewsList(FALLBACK_CUSTOMER_REVIEWS);
      } finally {
        setIsLoadingMoreReviews(false);
        isFetchingRef.current = false;
      }
    },
    [hasMoreReviews],
  );

  useEffect(() => {
    if (isReviewsEnabled) {
      loadReviewsBatch(0, true);
    }
    fetchTotalOrdersCount()
      .then((count) => {
        if (count > 0) setRealOrderCount(count);
      })
      .catch(() => {});
  }, [isReviewsEnabled, loadReviewsBatch]);

  // LOGIC AUTO-SCROLL CHỐNG GIẬT & TỰ ĐỘNG CHẠY LẠI TỪ ĐẦU KHI TRÔI ĐẾN CUỐI
  useEffect(() => {
    if (!isReviewsEnabled) return;

    const scrollContainer = reviewsScrollRef.current;
    if (!scrollContainer) return;

    let lastTimestamp = performance.now();

    const step = (timestamp) => {
      if (!isHovered && !isDragging && scrollContainer && !isLoopResetting.current) {
        const delta = timestamp - lastTimestamp;
        const move = (30 * delta) / 1000;

        const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;

        if (scrollContainer.scrollLeft >= maxScroll - 4) {
          if (hasMoreReviews && !isLoadingMoreReviews && !isFetchingRef.current) {
            loadReviewsBatch(reviewPage + 1);
          } else if (!hasMoreReviews) {
            isLoopResetting.current = true;
            scrollContainer.scrollTo({ left: 0, behavior: "smooth" });
            setTimeout(() => {
              isLoopResetting.current = false;
            }, 1200);
          }
        } else {
          scrollContainer.scrollLeft += move;
        }
      }
      lastTimestamp = timestamp;
      autoScrollRafRef.current = requestAnimationFrame(step);
    };

    autoScrollRafRef.current = requestAnimationFrame(step);

    return () => {
      if (autoScrollRafRef.current) {
        cancelAnimationFrame(autoScrollRafRef.current);
      }
    };
  }, [
    isHovered,
    isDragging,
    hasMoreReviews,
    isLoadingMoreReviews,
    reviewPage,
    loadReviewsBatch,
    isReviewsEnabled,
  ]);

  const handleMouseDown = (e) => {
    if (!reviewsScrollRef.current) return;
    setIsDragging(true);
    isDragMoved.current = false;
    setStartX(e.pageX - reviewsScrollRef.current.offsetLeft);
    setScrollLeftState(reviewsScrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !reviewsScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - reviewsScrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 4) {
      isDragMoved.current = true;
    }
    reviewsScrollRef.current.scrollLeft = scrollLeftState - walk;

    const { scrollLeft, scrollWidth, clientWidth } = reviewsScrollRef.current;
    if (
      scrollLeft + clientWidth + 150 >= scrollWidth &&
      hasMoreReviews &&
      !isLoadingMoreReviews &&
      !isFetchingRef.current
    ) {
      loadReviewsBatch(reviewPage + 1);
    }
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleReviewsScroll = (e) => {
    const { scrollLeft, scrollWidth, clientWidth } = e.currentTarget;
    if (
      scrollLeft + clientWidth + 150 >= scrollWidth &&
      hasMoreReviews &&
      !isLoadingMoreReviews &&
      !isFetchingRef.current
    ) {
      loadReviewsBatch(reviewPage + 1);
    }
  };

  const goToShop = (catId = "all") => {
    if (onNavigateShop) {
      onNavigateShop(catId);
    } else if (onNavigate) {
      onNavigate("shop");
    }
  };

  const goToStory = () => {
    if (onNavigateStory) onNavigateStory();
    else if (onNavigate) onNavigate("story");
  };

  // Tính toán sản phẩm nổi bật
  const featuredProducts = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) return [];
    const salesCountMap = new Map();

    try {
      const allOrders = [
        ...(Array.isArray(shopConfig?.orders) ? shopConfig.orders : []),
        ...JSON.parse(localStorage.getItem("shop_orders") || "[]"),
      ];

      allOrders.forEach((ord) => {
        const items = ord.order_items || ord.cart || [];
        if (Array.isArray(items)) {
          items.forEach((item) => {
            const rawId = String(
              item.productId || item.product_id || item.id || "",
            );
            const cleanId = rawId.split("-")[0] || rawId;
            const qty = Number(item.quantity) || 1;
            salesCountMap.set(cleanId, (salesCountMap.get(cleanId) || 0) + qty);
          });
        }
      });
    } catch (e) {
      console.warn("Lỗi tính sản phẩm bán chạy:", e);
    }

    const sorted = [...products].sort((a, b) => {
      const cleanIdA = String(a.id || "").split("-")[0];
      const cleanIdB = String(b.id || "").split("-")[0];

      const salesA =
        salesCountMap.get(cleanIdA) || Number(a.soldCount || a.sold || 0);
      const salesB =
        salesCountMap.get(cleanIdB) || Number(b.soldCount || b.sold || 0);

      if (salesA !== salesB) {
        return salesB - salesA;
      }

      const catA = a.category || a.category_id;
      const catB = b.category || b.category_id;
      if (catA === "cat01" && catB !== "cat01") return -1;
      if (catB === "cat01" && catA !== "cat01") return 1;

      return 0;
    });

    return sorted.slice(0, 8);
  }, [products, shopConfig?.orders]);

  const displayCategories = useMemo(() => {
    return categories.filter((c) => c.id !== "all");
  }, [categories]);

  const activeMonthData = useMemo(() => {
    return (
      MONTHLY_HARVEST_CALENDAR.find((m) => m.month === selectedMonth) ||
      MONTHLY_HARVEST_CALENDAR[0]
    );
  }, [selectedMonth]);

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
              Nông sản thuần tự nhiên dưới chân dãy Núi Chúa: từ vườn táo giòn
              rụm Phước Hậu, giàn nho chín mọng Thái An đến mẻ chả cá quết tươi
              làng biển Cà Ná. Hái sớm tinh mơ và gửi đến bạn nguyên vẹn vị đất
              trời.
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
                  <strong className="text-sm font-black text-white block">
                    2.800+ Giờ
                  </strong>
                  <span className="text-xs text-stone-300 font-normal">
                    Nắng gắt gom vị ngọt
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3 shadow-inner">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <strong className="text-sm font-black text-white block">
                    100% Giàn Tươi
                  </strong>
                  <span className="text-xs text-stone-300 font-normal">
                    Không chất bảo quản
                  </span>
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

      {/* 3. LỊCH MÙA VỤ 12 THÁNG */}
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

        {/* GIAO DIỆN MOBILE (< md) */}
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    goToShop(activeMonthData.categoryTarget || "all");
                  }}
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

        {/* GIAO DIỆN TABLET & DESKTOP */}
        <div className="hidden md:flex flex-row items-stretch gap-1.5 h-[600px] lg:h-[640px] w-full select-none rounded-3xl p-2 pt-9 pb-3 bg-[#FAF6F0] border border-stone-200/90 shadow-inner overflow-hidden">
          {MONTHLY_HARVEST_CALENDAR.map((item) => {
            const isExpanded = item.month === selectedMonth;
            const isRealMonth = item.month === currentRealMonth;
            const highlightShort =
              item.highlight.split(" ")[0] +
              " " +
              (item.highlight.split(" ")[1] || "");

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

                {/* DẠNG THU NHỎ */}
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
                        fontFamily:
                          '"Nunito", "Montserrat", "Arial Rounded MT Bold", system-ui, sans-serif',
                      }}
                    >
                      {highlightShort}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-black text-white/90 drop-shadow-md pb-0.5">
                    #{item.month < 10 ? `0${item.month}` : item.month}
                  </span>
                </div>

                {/* DẠNG PHÓNG TO */}
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
                          <span className="shrink-0 text-amber-400 font-bold">
                            🌾 Đặc trưng:
                          </span>
                          <span className="text-stone-100 break-words leading-relaxed font-normal">
                            {item.desc}
                          </span>
                        </div>
                        <div className="flex items-start gap-2.5 pt-2.5 border-t border-white/10">
                          <span className="shrink-0 text-amber-300 font-bold">
                            💡 Thưởng thức:
                          </span>
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
                          goToShop(item.categoryTarget || "all");
                        }}
                        className="w-full h-11 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs lg:text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer shadow-md pointer-events-auto"
                      >
                        <ShoppingBag className="w-4 h-4 text-stone-950 shrink-0" />
                        <span className="truncate">
                          Xem Nông Sản Tháng {item.month}
                        </span>
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
            Chúng tôi hiểu nỗi lo dập nát khi đặt hoa quả tươi từ xa. Đây là
            cách nhà vườn bảo vệ từng thùng hàng:
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
              <span className="text-3xl font-black font-mono text-amber-400">
                {item.step}
              </span>
              <h4 className="text-base font-bold text-stone-100">
                {item.title}
              </h4>
              <p className="text-sm text-stone-300 font-normal leading-relaxed">
                {item.desc}
              </p>
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
            Ninh Thuận có hơn 2.800 giờ nắng/năm — lượng bốc hơi cao gấp 2 lần
            lượng mưa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-2xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Sun className="w-5 h-5" />
            </div>
            <h4 className="text-base sm:text-lg font-bold text-stone-900">
              Quang Hợp Cực Đại
            </h4>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
              Nắng chiếu từ sáng sớm đến tận chiều tà giúp cây nho và táo gió
              tích lũy lượng đường tự nhiên cao vượt trội so với các vùng đất ẩm
              mát.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-2xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center font-bold">
              <Wind className="w-5 h-5" />
            </div>
            <h4 className="text-base sm:text-lg font-bold text-stone-900">
              Gió Biển Chống Nấm Mốc
            </h4>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
              Gió biển thổi qua giàn liên tục làm khô ráo tán lá tự nhiên, hạn
              chế sâu bệnh mà không cần can thiệp hóa chất bảo vệ thực vật.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-2xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Droplets className="w-5 h-5" />
            </div>
            <h4 className="text-base sm:text-lg font-bold text-stone-900">
              Mạch Nước Phù Sa Pha Cát
            </h4>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
              Hệ thống mương dẫn thủy lợi cổ Champa đưa nguồn nước phù sa sông
              Dinh bồi đắp cho từng gốc nho, giữ cho thịt quả chắc, vỏ mỏng.
            </p>
          </div>
        </div>
      </section>

      {/* 7. CẨM NANG 10 NÔNG SẢN SẠCH BẢN ĐỊA */}
      <ExperienceGuideSection />

      {/* 8. ĐÁNH GIÁ CỦA KHÁCH THƯƠNG */}
      {isReviewsEnabled && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-800 uppercase tracking-wider">
                <Heart className="w-4 h-4 fill-amber-700 text-amber-700" />
                <span>
                  Tình cảm của khách thương (
                  {totalReviewsCount > 0
                    ? `${totalReviewsCount}+`
                    : `${reviewsList.length}+`}{" "}
                  đánh giá)
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight mt-1">
                Khách Ăn Quả Xứ Nắng Nói Gì?
              </h3>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 bg-stone-100 px-3.5 py-2 rounded-full border border-stone-200/80">
              <MoveHorizontal className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>Tự động trượt • Kéo để xem thêm</span>
            </div>
          </div>

          <div
            ref={reviewsScrollRef}
            onScroll={handleReviewsScroll}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
              setIsHovered(false);
              handleMouseUpOrLeave();
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            className={`flex items-stretch gap-4 overflow-x-auto pb-4 pt-1 px-1 select-none overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
            {reviewsList.map((rev, idx) => {
              const customerName = rev.customer_name || rev.name || "Khách quý";
              const orderCode = rev.order_code || rev.orderCode || "";
              const ratingNum = Number(rev.rating) || 5;

              const customerImages = Array.isArray(rev.image_urls)
                ? rev.image_urls
                : rev.image_url
                  ? [rev.image_url]
                  : [];

              const shopImage =
                rev.shop_packing_image ||
                rev.packing_image ||
                rev.packing_image_url ||
                rev.orders?.packing_image ||
                rev.orders?.packing_image_url ||
                rev.orders?.packed_image_url ||
                null;

              const hasAnyPhoto = Boolean(shopImage || customerImages.length > 0);

              return (
                <div
                  key={rev.id || `${orderCode}-${idx}`}
                  className="w-[300px] sm:w-[350px] min-h-[240px] shrink-0 p-5 rounded-3xl bg-white border border-stone-200/90 shadow-2xs hover:shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between relative group select-none"
                >
                  <div className="space-y-2.5">
                    {/* Header: Sao & Mã đơn */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-500">
                        {[...Array(ratingNum)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-4 h-4 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>

                      {orderCode ? (
                        <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100/80 px-2.5 py-0.5 rounded-md border border-amber-200">
                          #{orderCode}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                          {rev.tag || "Khách đã mua"}
                        </span>
                      )}
                    </div>

                    {/* Lời nhận xét */}
                    <div className="relative min-h-[50px] flex items-start">
                      <Quote className="w-4 h-4 text-stone-300 absolute -top-1 -left-1 opacity-60 shrink-0" />
                      <p className="text-sm text-stone-700 font-normal leading-relaxed italic line-clamp-3 pl-3">
                        "{rev.content}"
                      </p>
                    </div>

                    {/* Khối ảnh đối chiếu */}
                    {hasAnyPhoto && (
                      <div className="flex items-center gap-2.5 pt-1 pl-3 overflow-x-auto [scrollbar-width:none]">
                        {shopImage && (
                          <div className="relative shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                if (isDragMoved.current) {
                                  e.stopPropagation();
                                  return;
                                }
                                setActiveLightboxImg(shopImage);
                              }}
                              className="relative w-11 h-11 rounded-xl overflow-hidden border-2 border-emerald-500/80 shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-zoom-in block"
                              title="Bấm để xem ảnh kiện hàng lúc vườn đóng thùng"
                            >
                              <img
                                src={shopImage}
                                alt="Ảnh vườn đóng"
                                className="w-full h-full object-cover pointer-events-none"
                                onError={(e) => {
                                  e.currentTarget.parentElement.parentElement.style.display = "none";
                                }}
                              />
                            </button>
                            <span className="absolute -bottom-1 -right-1 text-[9px] font-black text-emerald-950 bg-emerald-200 border border-emerald-300 px-1 rounded shadow-2xs pointer-events-none">
                              Vườn
                            </span>
                          </div>
                        )}

                        {customerImages.slice(0, shopImage ? 2 : 3).map((imgUrl, imgIdx) => (
                          <div key={imgIdx} className="relative shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                if (isDragMoved.current) {
                                  e.stopPropagation();
                                  return;
                                }
                                setActiveLightboxImg(imgUrl);
                              }}
                              className="relative w-11 h-11 rounded-xl overflow-hidden border-2 border-amber-400 shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-zoom-in block"
                              title="Bấm để xem ảnh khách nhận hàng"
                            >
                              <img
                                src={imgUrl}
                                alt={`Khách chụp-${imgIdx}`}
                                className="w-full h-full object-cover pointer-events-none"
                                onError={(e) => {
                                  e.currentTarget.parentElement.parentElement.style.display = "none";
                                }}
                              />
                            </button>
                            <span className="absolute -bottom-1 -right-1 text-[9px] font-black text-amber-950 bg-amber-200 border border-amber-300 px-1 rounded shadow-2xs pointer-events-none">
                              Khách
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Thông tin người đánh giá */}
                  <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <strong className="text-sm font-bold text-stone-900 block truncate">
                        {customerName}
                      </strong>
                      <span className="text-xs text-stone-500 font-normal block truncate">
                        {rev.role ||
                          (orderCode
                            ? "Đã nhận hàng thành công"
                            : "Khách thân thiết")}
                      </span>
                    </div>

                    <span className="text-xs font-medium text-stone-400 font-mono flex items-center gap-1 shrink-0 bg-stone-50 px-2 py-0.5 rounded-md border border-stone-100">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>
                        {formatDate(
                          rev.created_at || rev.createdAt || new Date(),
                        )}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}

            {isLoadingMoreReviews && (
              <div className="w-[140px] min-h-[240px] shrink-0 p-5 rounded-3xl bg-stone-50 border border-dashed border-stone-200 flex flex-col items-center justify-center gap-2 text-stone-400 text-xs">
                <Loader2 className="w-5 h-5 animate-spin text-amber-700" />
                <span className="text-xs font-medium">
                  Đang tải tiếp...
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 9. BỐN CAM KẾT VƯỜN QUÊ */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            icon: CheckCircle2,
            title: "Bao Ăn Tận Miệng",
            desc: "Chuẩn vị giòn ngọt, không ngon hoàn tiền",
          },
          {
            icon: ShieldCheck,
            title: "100% Nguyên Bản",
            desc: "Nắng phơi mộc, không phẩm màu hóa chất",
          },
          {
            icon: Truck,
            title: "Ship Thùng Xốp",
            desc: "Chèn rơm chống dập, ướp đá gel mát lạnh",
          },
          {
            icon: RefreshCw,
            title: "Bảo Hành Tươi Ngon",
            desc: "Bù hàng ngay nếu dập nát gửi xe",
          },
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
                <h4 className="text-sm sm:text-base font-bold text-stone-900">
                  {item.title}
                </h4>
                <p className="text-xs sm:text-sm text-stone-500 leading-snug font-normal">
                  {item.desc}
                </p>
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
            Mời bạn ghé xem nhật ký mùa vụ, xem cách người làm vườn bọc từng túi
            táo sinh học và phơi ráo từng mẻ nho dưới gió biển Cà Ná.
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

      {/* MODAL LIGHTBOX PHÓNG TO ẢNH REVIEW */}
      {activeLightboxImg && (
        <div
          onClick={() => setActiveLightboxImg(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fadeIn cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl max-h-[90vh] bg-stone-950 rounded-3xl overflow-hidden border border-white/20 shadow-2xl p-2 cursor-default"
          >
            <button
              type="button"
              onClick={() => setActiveLightboxImg(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
              title="Đóng (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activeLightboxImg}
              alt="Review Fullsize"
              className="w-full max-h-[82vh] object-contain rounded-2xl"
            />
            <div className="text-center py-2.5 text-xs text-stone-400 font-sans">
              Ảnh thực tế đối chiếu kiểm tra • Nhấn vùng tối để đóng
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// COMPONENT CON: KINH NGHIỆM CHỌN NÔNG SẢN SẠCH
function ExperienceGuideSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const tabsContainerRef = useRef(null);

  const changeTab = (newIndex) => {
    if (newIndex === currentIndex || isFading) return;
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setIsFading(false);
    }, 150);
  };

  const handlePrev = () => {
    const nextIdx =
      (currentIndex - 1 + NINH_THUAN_EXPERIENCES.length) %
      NINH_THUAN_EXPERIENCES.length;
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