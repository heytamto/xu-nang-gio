// Danh mục phân loại sản phẩm
export const CATEGORIES = [
  { id: 'all', label: 'Tất Cả Đặc Sản', icon: 'Sparkles' },
  { id: 'fresh', label: 'Trái Cây Tươi Hái Giàn', icon: 'Apple' },
  { id: 'dried', label: 'Ăn Vặt & Đặc Sản Sấy', icon: 'Flame' },
  { id: 'condiments', label: 'Mật Nho, Rượu & Gia Vị', icon: 'Wine' },
  { id: 'seafood', label: 'Hải sản & Đồ Khô', icon: 'Fish' }
];

export const PRODUCTS = [
  // ================= 1. TRÁI CÂY TƯƠI HÁI GIÀN (FRESH) =================
  {
    id: 'sp-tao-gio',
    name: 'Táo Xanh Phan Rang (Táo Gió Giòn Ngọt)',
    category: 'fresh',
    basePrice: 45000,
    unit: 'kg',
    badge: 'Hái sáng sớm',
    source: 'Vườn nhà (Phước Hậu, Ninh Phước)',
    desc: 'Táo gió quả mọng nước, vị ngọt thanh tự nhiên, giòn tan từng miếng. Thu hoạch sáng sớm và gửi xe thùng xốp bọc lưới chống dập.',
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    weights: [
      { id: 'opt-2kg', label: 'Thùng 2kg (Ăn thử)', multiplier: 2 },
      { id: 'opt-5kg', label: 'Thùng 5kg (Tiết kiệm)', multiplier: 4.8 }
    ]
  },
  {
    id: 'sp-nho-xanh',
    name: 'Nho Xanh Ninh Thuận (Giống NH01-48)',
    category: 'fresh',
    basePrice: 75000,
    unit: 'kg',
    badge: 'Bao ngọt giàn',
    source: 'Giàn nho Thái An, Ninh Hải',
    desc: 'Chùm nho dày trái, vỏ mỏng, giòn ngọt thanh tao đặc trưng xứ nắng. Cắt trực tiếp tại giàn đóng thùng xốp lót giấy chống sốc.',
    image: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    weights: [
      { id: 'opt-2kg', label: 'Hộp 2kg biếu tặng', multiplier: 2 },
      { id: 'opt-5kg', label: 'Thùng 5kg giá vườn', multiplier: 4.8 }
    ]
  },
  {
    id: 'sp-nho-do',
    name: 'Nho Đỏ Ninh Thuận (Red Cardinal)',
    category: 'fresh',
    basePrice: 55000,
    unit: 'kg',
    badge: 'Chín mọng',
    source: 'Vườn nho Ninh Phước',
    desc: 'Trái tròn mọng, vị ngọt hài hòa phảng phất hương vị truyền thống. Thích hợp ăn tươi hoặc ép nước giải khát.',
    image: 'https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    weights: [
      { id: 'opt-2kg', label: 'Hộp 2kg', multiplier: 2 },
      { id: 'opt-5kg', label: 'Thùng 5kg', multiplier: 4.8 }
    ]
  },

  // ================= 2. ĂN VẶT & ĐẶC SẢN SẤY (DRIED) =================
  {
    id: 'sp-nho-say-deo',
    name: 'Nho Đỏ Sấy Dẻo Thủ Công',
    category: 'dried',
    basePrice: 85000,
    unit: 'hũ',
    badge: 'Không đường hóa học',
    source: 'Xưởng sấy gia đình',
    desc: 'Sấy dẻo từ nho tươi tuyển chọn, giữ trọn độ ẩm và vị ngọt mật tự nhiên, không tẩm ướp chất bảo quản. Hạn bảo quản 6-12 tháng.',
    image: 'https://images.unsplash.com/photo-1595231712325-9fdec6ddff7f?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    weights: [
      { id: 'opt-250g', label: 'Hũ Pet 250g', multiplier: 1 },
      { id: 'opt-500g', label: 'Túi Zip 500g', multiplier: 1.9 }
    ]
  },
  {
    id: 'sp-tao-say-deo',
    name: 'Táo Xanh Sấy Dẻo Chua Ngọt',
    category: 'dried',
    basePrice: 65000,
    unit: 'hũ',
    badge: 'Ăn vặt Healthy',
    source: 'Phan Rang, Ninh Thuận',
    desc: 'Vị chua thanh giòn nhẹ của táo gió hòa quyện vị ngọt dịu. Món ăn vặt lý tưởng cho dân văn phòng và trẻ nhỏ.',
    image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    weights: [
      { id: 'opt-250g', label: 'Hũ 250g', multiplier: 1 },
      { id: 'opt-500g', label: 'Hũ 500g', multiplier: 1.9 }
    ]
  },
  {
    id: 'sp-banh-trang-mam-ruoc',
    name: 'Bánh Tráng Mắm Ruốc Nướng Giòn',
    category: 'dried',
    basePrice: 35000,
    unit: 'xấp',
    badge: 'Đặc sản ăn vặt',
    source: 'Lò bánh truyền thống Phan Rang',
    desc: 'Bánh tráng mè dày nướng giòn rụm phết mắm ruốc xào đậm đà, mỡ hành thơm nức. Đóng gói túi zip kín giữ độ giòn lâu.',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    weights: [
      { id: 'opt-1xap', label: 'Túi 5 bánh nướng sẵn', multiplier: 1 },
      { id: 'opt-3xap', label: 'Combo 3 túi (15 bánh)', multiplier: 2.8 }
    ]
  },
  {
    id: 'sp-banh-trang-me',
    name: 'Bánh Tráng Mè Đen Phan Rang (Chưa nướng)',
    category: 'dried',
    basePrice: 40000,
    unit: 'xấp',
    badge: 'Rất dễ gửi xa',
    source: 'Làng nghề bánh tráng',
    desc: 'Bánh tráng gạo xay phủ mè đen dày đặc, nướng lên thơm lừng ăn kèm các món gỏi hoặc chấm nước mắm.',
    image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    weights: [
      { id: 'opt-10cai', label: 'Xấp 10 cái', multiplier: 1 },
      { id: 'opt-20cai', label: 'Xấp 20 cái', multiplier: 1.9 }
    ]
  },

  // ================= 3. MẬT NHO, RƯỢU & GIA VỊ (CONDIMENTS) =================
  {
    id: 'sp-mat-nho',
    name: 'Mật Nho Ninh Thuận Cô Đặc Nguyên Chất',
    category: 'condiments',
    basePrice: 80000,
    unit: 'chai',
    badge: 'Nấu thủ công',
    source: 'Lò mật truyền thống Thái An',
    desc: 'Nấu cô đặc từ 100% trái nho tươi chín giàn, không pha phẩm màu. Pha nước đá uống thanh mát hoặc dùng làm sốt ướp món ăn.',
    image: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    weights: [
      { id: 'opt-500ml', label: 'Chai 500ml', multiplier: 1 },
      { id: 'opt-1000ml', label: 'Chai 1 Lít', multiplier: 1.9 }
    ]
  },
  {
    id: 'sp-ruou-nho',
    name: 'Rượu Nho Phan Rang Ủ Chum Sành (12 Tháng)',
    category: 'condiments',
    basePrice: 120000,
    unit: 'chai',
    badge: 'Ủ men tự nhiên',
    source: 'Hầm rượu truyền thống',
    desc: 'Lên men tự nhiên từ quả nho và đường phèn trong chum sành. Vị nồng đượm, hậu ngọt êm dịu, tốt cho tiêu hóa.',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    weights: [
      { id: 'opt-750ml', label: 'Chai thủy tinh 750ml', multiplier: 1 },
      { id: 'opt-combo2', label: 'Cặp 2 chai quà biếu', multiplier: 1.95 }
    ]
  },
  {
    id: 'sp-toi-co-don',
    name: 'Tỏi Cô Đơn Ninh Thuận (Tỏi 1 Tép)',
    category: 'condiments',
    basePrice: 140000,
    unit: 'túi',
    badge: 'Dược liệu quý',
    source: 'Vùng đất cát Ninh Hải',
    desc: 'Củ tròn đều, tép duy nhất tích tụ tinh dầu thơm nồng, không hăng gắt. Chuyên dùng ngâm rượu, mật ong hoặc bồi bổ sức khỏe. Bảo quản 3-6 tháng.',
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    weights: [
      { id: 'opt-500g', label: 'Túi lưới 500g', multiplier: 1 },
      { id: 'opt-1kg', label: 'Túi 1kg chọn lọc', multiplier: 1.95 }
    ]
  },
  {
    id: 'sp-hanh-tim',
    name: 'Hành Tím Phan Rang (Củ Chắc, Thơm Nồng)',
    category: 'condiments',
    basePrice: 45000,
    unit: 'kg',
    badge: 'Gia vị bếp Việt',
    source: 'Đồng hành Mỹ Tường',
    desc: 'Củ hành tím giòn, chắc thịt, thơm cay đậm đà, để lâu ngoài không bị óp. Thích hợp muối chua, phi thơm hoặc xào nấu gia đình.',
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    weights: [
      { id: 'opt-1kg', label: 'Túi 1kg', multiplier: 1 },
      { id: 'opt-3kg', label: 'Chùm 3kg để gác bếp', multiplier: 2.85 }
    ]
  },
  {
    id: 'sp-nuoc-mam-ca-na',
    name: 'Nước Mắm Nhĩ Cà Ná 40° Đạm Truyền Thống',
    category: 'condiments',
    basePrice: 95000,
    unit: 'chai',
    badge: 'Cá cơm than 100%',
    source: 'Làng cá Cà Ná, Thuận Nam',
    desc: 'Ủ chượp ròng rã 12 tháng từ cá cơm than béo mập và muối hạt tinh khiết Cà Ná. Màu cánh gián sóng sánh, thơm lừng vị đượm ngọt hậu môn vị.',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    weights: [
      { id: 'opt-chai500ml', label: 'Chai thủy tinh 500ml', multiplier: 1 },
      { id: 'opt-hop2chai', label: 'Hộp 2 chai xách tay', multiplier: 1.95 }
    ]
  },

  // ================= 4. ĐẶC SẢN BIỂN & MÓN KHÔ (SEAFOOD) =================
  {
    id: 'sp-muc-kho',
    name: 'Mực Khô Câu Phan Rang (Dày Mình, Ngọt Thịt)',
    category: 'seafood',
    basePrice: 280000,
    unit: 'túi',
    badge: 'Hút chân không',
    source: 'Thuyền câu cảng Đông Hải',
    desc: 'Mực ống đánh bắt câu tay, xẻ phơi ngay trên boong thuyền dưới nắng gắt Ninh Thuận. Thân trắng phấn, nướng lên ngọt mềm không dai.',
    image: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    weights: [
      { id: 'opt-250g', label: 'Túi 250g (Khoảng 4-6 con)', multiplier: 1 },
      { id: 'opt-500g', label: 'Túi 500g (Khoảng 8-12 con)', multiplier: 1.95 }
    ]
  },
  {
    id: 'sp-muc-mot-nang',
    name: 'Mực Một Nắng Cà Ná (Cấp đông/Giao gần)',
    category: 'seafood',
    basePrice: 220000,
    unit: 'túi',
    badge: 'Chỉ ship gần / Gửi xe',
    source: 'Biển Cà Ná',
    desc: 'Mực lá tươi dày cơm phơi qua duy nhất một con nắng giòn. Bên ngoài ráo dẻo, bên trong giữ nguyên độ tươi ngọt sần sật. Đóng thùng xốp ướp đá gel.',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    weights: [
      { id: 'opt-500g', label: 'Túi 500g (2-3 con)', multiplier: 1 },
      { id: 'opt-1kg', label: 'Túi 1kg loại VIP', multiplier: 1.95 }
    ]
  },
  {
    id: 'sp-kho-ca-du',
    name: 'Khô Cá Đù 1 Nắng Ướp Vừa Ăn',
    category: 'seafood',
    basePrice: 110000,
    unit: 'túi',
    badge: 'Hút chân không',
    source: 'Vùng biển Ninh Chữ',
    desc: 'Cá đù xẻ bướm ướp muối ớt cay nhẹ vừa miệng, phơi ráo nắng. Chiên giòn hoặc nướng ăn kèm cơm nóng cực kỳ hao cơm.',
    image: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    weights: [
      { id: 'opt-500g', label: 'Túi 500g', multiplier: 1 },
      { id: 'opt-1kg', label: 'Túi 1kg', multiplier: 1.95 }
    ]
  },
  {
    id: 'sp-nem-chua',
    name: 'Nem Chua Phan Rang (Gói Lá Chuối)',
    category: 'seafood',
    basePrice: 60000,
    unit: 'xâu',
    badge: 'Đặc sản mồi nhậu',
    source: 'Lò nem gia truyền',
    desc: 'Thịt heo nạc tươi quết nhuyễn kết hợp tỏi ớt tiêu đen bọc nhiều lớp lá chuối lên men tự nhiên. Vị chua thanh, giòn sần sật đặc trưng.',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    weights: [
      { id: 'opt-1xau', label: 'Xâu 10 cây', multiplier: 1 },
      { id: 'opt-2xau', label: 'Combo 2 xâu (20 cây)', multiplier: 1.9 }
    ]
  }
];

export default PRODUCTS;
