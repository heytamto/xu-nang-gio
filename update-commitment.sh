#!/usr/bin/env bash
set -e

# 1. Cập nhật products.js với cam kết bao ngọt
cat << 'FILE_EOF' > src/data/products.js
export const PRODUCTS = [
  {
    id: "tao-xanh-tuoi",
    name: "Táo Xanh Ninh Thuận (Táo Gió Giòn Tan)",
    basePrice: 45000,
    unit: "kg",
    badge: "Bao ăn: Không ngọt không lấy tiền",
    category: "fresh",
    image: "https://images.unsplash.com/photo-1616684000067-36952fde56ec?auto=format&fit=crop&w=600&q=80",
    source: "Vườn nhà Tâm (hết vụ gom tuyển vườn bà con Phước Hậu)",
    desc: "Táo xanh Ninh Thuận chính gốc, cắn giòn rụm nhiều nước, vị ngọt thanh mát. Cam kết bao ngọt từng quả!",
    story: "Táo xanh được thu hái khi quả đã già đẫy, vỏ căng bóng và chuyển độ ngọt đậm đà nhất. Nhà mình cam kết: Khách nhận hàng ăn thử không giòn ngọt xin hoàn tiền 100%.",
    inStock: true,
    flavors: [
      { id: "standard", label: "Táo xanh tươi nguyên cành", priceBonus: 0 }
    ],
    weights: [
      { id: "2kg", label: "Thùng 2kg (Ăn thử bao ngọt)", multiplier: 2 },
      { id: "5kg", label: "Thùng 5kg (Tiết kiệm cho cả nhà)", multiplier: 4.8 }
    ]
  },
  {
    id: "tao-say-deo",
    name: "Táo Xanh Sấy Dẻo Thủ Công",
    basePrice: 75000,
    unit: "hộp",
    badge: "Đặc sản bán chạy",
    category: "dried",
    image: "https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?auto=format&fit=crop&w=600&q=80",
    source: "Chế biến thủ công từ táo xanh vườn nhà",
    desc: "100% táo xanh Ninh Thuận tách hạt, sấy dẻo nhiệt thấp 28h, giữ trọn vị chua thanh dẻo mềm óng ả.",
    story: "Táo xanh được thu hái, rửa sạch, xâm kim giảm chát rồi ướp đường phèn nhẹ kèm tắc hoặc muối ớt. Táo sấy dẻo giữ được vị chua thanh tự nhiên đặc trưng của giống táo xanh xứ nắng gió.",
    inStock: true,
    flavors: [
      { id: "original", label: "Táo Xanh Nguyên Vị (Không tắc)", priceBonus: 0 },
      { id: "kumquat", label: "Táo Xanh Thêm Lát Tắc Thơm", priceBonus: 5000 },
      { id: "chili_salt", label: "Táo Xanh Lắc Muối Ớt Cay Ngọt", priceBonus: 5000 }
    ],
    weights: [
      { id: "250g", label: "Hũ 250g", multiplier: 1 },
      { id: "500g", label: "Túi Zip 500g", multiplier: 1.9 },
      { id: "1kg", label: "Hộp quà 1kg (2 x 500g)", multiplier: 3.7 }
    ]
  },
  {
    id: "nho-do-phan-rang",
    name: "Nho Đỏ Ninh Thuận (Red Cardinal)",
    basePrice: 65000,
    unit: "kg",
    badge: "Chính gốc Phan Rang",
    category: "fresh",
    image: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=600&q=80",
    source: "Giàn nho tuyển chọn Phước Hậu",
    desc: "Chùm khít, trái mọng đỏ cánh gián, vị ngọt thanh dịu pha chua nhẹ tự nhiên.",
    story: "Cắt trực tiếp từ các giàn nho đạt chuẩn, bao trái tự nhiên tránh sâu rầy, bảo đảm tươi mới khi ship tỉnh.",
    inStock: true,
    flavors: [
      { id: "standard", label: "Tươi nguyên chùm", priceBonus: 0 }
    ],
    weights: [
      { id: "2kg", label: "Hộp 2kg biếu tặng", multiplier: 2 },
      { id: "4kg", label: "Thùng 4kg", multiplier: 3.8 }
    ]
  },
  {
    id: "ruou-nho-truyen-thong",
    name: "Rượu Nho Phan Rang Ủ Chum Sành (12 Tháng)",
    basePrice: 165000,
    unit: "chai",
    badge: "Ủ chum sành 1 năm",
    category: "drinks",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80",
    source: "Ủ thủ công gia truyền",
    desc: "Lên men tự nhiên từ nho tươi và đường phèn, ủ trong chum sành đất nung hơn 365 ngày.",
    story: "Nước rượu mận chín sóng sánh, nồng nàn men quả tự nhiên, êm dịu không gắt.",
    inStock: true,
    flavors: [
      { id: "standard", label: "Vị truyền thống 12°", priceBonus: 0 }
    ],
    weights: [
      { id: "750ml", label: "Chai thủy tinh 750ml", multiplier: 1 },
      { id: "combo2", label: "Cặp 2 chai quà tặng", multiplier: 1.95 }
    ]
  },
  {
    id: "mat-nho-co-dac",
    name: "Mật Nho Ninh Thuận Cô Đặc Nguyên Chất",
    basePrice: 95000,
    unit: "chai",
    badge: "Thủ công nguyên chất",
    category: "drinks",
    image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=600&q=80",
    source: "Nấu thủ công lửa nhỏ",
    desc: "Nấu cô đặc lửa nhỏ suốt 14 giờ từ nho tươi nguyên trái, sánh mịn, pha nước uống giải khát.",
    story: "Không chất bảo quản, giữ trọn vị ngọt tự nhiên của trái nho chín mọng.",
    inStock: true,
    flavors: [
      { id: "standard", label: "Nguyên chất", priceBonus: 0 }
    ],
    weights: [
      { id: "500ml", label: "Chai 500ml", multiplier: 1 },
      { id: "1000ml", label: "Chai 1 Lít (Tiết kiệm)", multiplier: 1.8 }
    ]
  }
];
FILE_EOF

# 2. Cập nhật HomePage với thông điệp "Không ngọt không lấy tiền"
cat << 'FILE_EOF' > src/pages/HomePage.jsx
import React from 'react';
import { ArrowRight, ShieldCheck, Truck, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import ProductCard from '../components/ProductCard';

export default function HomePage({ products, onAddToCart, onNavigateShop, onNavigateStory }) {
  const featuredProducts = products.slice(0, 3);

  return (
    <div className="space-y-16">
      {/* Hero Banner */}
      <section className="relative rounded-3xl overflow-hidden bg-stone-900 text-white shadow-xl min-h-[480px] flex items-center">
        <img
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1400&q=80"
          alt="Vườn Nắng Gió Trường Sanh"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div className="relative max-w-2xl p-8 sm:p-12 space-y-6">
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
              onClick={onNavigateShop}
              className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
            >
              <span>Đặt Mua Ăn Thử Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onNavigateStory}
              className="px-5 py-3 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-200 font-semibold text-sm border border-stone-600 transition-all"
            >
              Chuyện Vườn Nhà
            </button>
          </div>
        </div>
      </section>

      {/* Cam kết 4 trụ cột */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: CheckCircle2, title: "Bao Ăn Tận Miệng", desc: "Không ngọt không lấy tiền" },
          { icon: ShieldCheck, title: "100% Tự Nhiên", desc: "Không hóa chất bảo quản" },
          { icon: Truck, title: "Ship Tỉnh An Toàn", desc: "Bọc xốp chống dập từng quả" },
          { icon: RefreshCw, title: "Đổi Bù 100%", desc: "Hỏng bù ngay không đôi co" },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="bg-white p-4 rounded-2xl border border-stone-200 flex items-start gap-3 shadow-sm">
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
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black text-stone-900">Món Ngon Vườn Tuyển Chọn</h2>
            <p className="text-xs text-stone-500 mt-1">Hái tươi mỗi sáng & Chế biến thủ công gia đình</p>
          </div>
          <button
            onClick={onNavigateShop}
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProducts.map((p) => (
            <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
          ))}
        </div>
      </section>
    </div>
  );
}
FILE_EOF

chmod +x update-commitment.sh
./update-commitment.sh
echo "✅ Đã đưa thông điệp 'Không ngọt không lấy tiền' lên web!"
