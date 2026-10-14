// Trích xuất số điện thoại sạch (chỉ giữ lại số) để gắn link gọi điện
const rawHotline = import.meta.env.VITE_HOTLINE || '0848.957.345';
const cleanPhone = rawHotline.replace(/\D/g, '');
const rawZalo = import.meta.env.VITE_ZALO_PHONE || '0848957345';

export const DEFAULT_SHOP_CONFIG = {
  // 1. Tài khoản ngân hàng VietQR
  bankBin: import.meta.env.VITE_BANK_BIN || '970422',
  bankName: import.meta.env.VITE_BANK_NAME || 'MB',
  accountNo: import.meta.env.VITE_ACCOUNT_NO || '0848957345',
  accountName: import.meta.env.VITE_ACCOUNT_NAME || 'TO THANH TAM',
  depositAmount: 50000,
  loyaltyDiscountPercent: 10,

  // 2. Thông tin liên hệ & Mạng xã hội từ .env
  hotline: rawHotline,
  phoneNumber: cleanPhone || rawZalo,
  email: import.meta.env.VITE_EMAIL || 'xunanggio@gmail.com',
  zaloUrl: rawZalo ? `https://zalo.me/${rawZalo}` : '',
  facebookUrl: import.meta.env.VITE_FACEBOOK_URL || '',
  tiktokUrl: import.meta.env.VITE_TIKTOK_URL || '',

  // 3. Google Maps
  mapDirectionsUrl: import.meta.env.VITE_MAP_DIRECTIONS_URL || 'https://www.google.com/maps/search/?api=1&query=TP.+Th%E1%BB%A7+%C4%90%E1%BB%A9c,+TP.HCM',
  mapEmbedUrl: import.meta.env.VITE_MAP_EMBED_URL || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.739108197779!2d106.762955!3d10.831267!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317527027d0a6889%3A0x7df61a9ba30d2fc2!2zVGjhu6cgxJDhu6ljLCBI4buTIENow60gTWluaA!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s',

  // 4. Mã giảm giá
  vouchers: [
    {
      code: 'LAMQUEN',
      type: 'fixed',
      value: 15000,
      minOrder: 0,
      requireNewCustomer: true,
      requireOldCustomer: false,
      desc: 'Quà làm quen từ vườn (Giảm 15.000đ)'
    },
    {
      code: 'XUNANGGIO',
      type: 'fixed',
      value: 20000,
      minOrder: 150000,
      requireNewCustomer: false,
      requireOldCustomer: false,
      desc: 'Ưu đãi đơn từ 150k (Giảm 20.000đ)'
    }
  ]
};

export function getShopConfig() {
  try {
    const saved = localStorage.getItem('shop_config');
    if (saved) {
      const parsed = JSON.parse(saved);

      // Nếu trong localStorage đang lưu số tài khoản mẫu cũ thì tự động đồng bộ sang số thật từ .env
      const validAccountNo = (parsed.accountNo && parsed.accountNo !== '0987654321')
        ? parsed.accountNo 
        : DEFAULT_SHOP_CONFIG.accountNo;

      const currentVouchers = Array.isArray(parsed.vouchers) ? parsed.vouchers : [];
      const mergedVouchers = [...currentVouchers];

      DEFAULT_SHOP_CONFIG.vouchers.forEach((defV) => {
        if (!mergedVouchers.some((v) => v.code === defV.code)) {
          mergedVouchers.push(defV);
        }
      });

      const updatedConfig = {
        ...DEFAULT_SHOP_CONFIG,
        ...parsed,
        accountNo: validAccountNo,
        accountName: parsed.accountName || DEFAULT_SHOP_CONFIG.accountName,
        bankBin: parsed.bankBin || DEFAULT_SHOP_CONFIG.bankBin,
        bankName: parsed.bankName || DEFAULT_SHOP_CONFIG.bankName,
        // Luôn ưu tiên đồng bộ các link mới nhất từ .env nếu localStorage chưa có
        zaloUrl: parsed.zaloUrl || DEFAULT_SHOP_CONFIG.zaloUrl,
        facebookUrl: parsed.facebookUrl || DEFAULT_SHOP_CONFIG.facebookUrl,
        tiktokUrl: parsed.tiktokUrl || DEFAULT_SHOP_CONFIG.tiktokUrl,
        mapDirectionsUrl: parsed.mapDirectionsUrl || DEFAULT_SHOP_CONFIG.mapDirectionsUrl,
        mapEmbedUrl: parsed.mapEmbedUrl || DEFAULT_SHOP_CONFIG.mapEmbedUrl,
        vouchers: mergedVouchers
      };

      localStorage.setItem('shop_config', JSON.stringify(updatedConfig));
      return updatedConfig;
    }
  } catch (e) {
    console.error('Lỗi đọc shop_config:', e);
  }
  return DEFAULT_SHOP_CONFIG;
}