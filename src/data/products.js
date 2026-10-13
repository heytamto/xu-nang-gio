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

export default PRODUCTS;
