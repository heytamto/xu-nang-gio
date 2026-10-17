import { VIETQR_BANKS } from '../data/banks';

// Trích xuất số điện thoại sạch (chỉ giữ lại số) để gắn link gọi điện
const rawHotline = import.meta.env.VITE_HOTLINE || '0848.957.345';
const cleanPhone = rawHotline.replace(/\D/g, '');
const rawZalo = import.meta.env.VITE_ZALO_PHONE || '0848957345';

export { VIETQR_BANKS };

export const DEFAULT_SHOP_CONFIG = {
  // 1. Tài khoản ngân hàng VietQR
  bankBin: import.meta.env.VITE_BANK_BIN || '970422',
  bankName: import.meta.env.VITE_BANK_NAME || 'MBBank',
  accountNo: import.meta.env.VITE_ACCOUNT_NO || '0848957345',
  accountName: import.meta.env.VITE_ACCOUNT_NAME || 'TO THANH TAM',
  depositAmount: 50000,
  loyaltyDiscountPercent: 10,
  loyaltyMaxDiscount: 50000,

  // 2. Thông tin liên hệ, Địa chỉ & Mạng xã hội từ .env
  hotline: rawHotline,
  phoneNumber: cleanPhone || rawZalo,
  zaloPhone: rawZalo,
  email: import.meta.env.VITE_EMAIL || 'xunanggio@gmail.com',
  address: import.meta.env.VITE_STORE_ADDRESS || 'Trường Sanh, Phước Hậu, Khánh Hoà',
  originProvince: import.meta.env.VITE_ORIGIN_PROVINCE || 'Khánh Hoà',
  warehousePin: '1234',
  zaloUrl: rawZalo ? `https://zalo.me/${rawZalo}` : '',
  facebookUrl: import.meta.env.VITE_FACEBOOK_URL || '',
  tiktokUrl: import.meta.env.VITE_TIKTOK_URL || '',

  // 3. Google Maps (Tọa độ vườn Trường Sanh, Phước Hậu)
  mapDirectionsUrl: import.meta.env.VITE_MAP_DIRECTIONS_URL || 'https://www.google.com/maps/dir/?api=1&destination=11.563539,108.930892',
  mapEmbedUrl: import.meta.env.VITE_MAP_EMBED_URL || 'https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d251.61865863961202!2d108.93089242170359!3d11.563539363791506!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1svi!2s!4v1792144018447!5m2!1svi!2s',

  // 4. Mã giảm giá
  vouchers: [
    {
      code: 'LAMQUEN',
      type: 'fixed',
      value: 15000,
      minOrder: 100000,
      maxDiscount: 0,
      canStack: true,
      usageLimit: 0,
      usedCount: 0,
      desc: 'Quà làm quen từ vườn (Giảm 15.000đ cho đơn từ 100k)'
    },
    {
      code: 'XUNANGGIO',
      type: 'fixed',
      value: 20000,
      minOrder: 150000,
      maxDiscount: 0,
      canStack: false,
      usageLimit: 0,
      usedCount: 0,
      desc: 'Ưu đãi đơn từ 150k (Giảm 20.000đ)'
    }
  ]
};

export function getShopConfig() {
  try {
    const saved = localStorage.getItem('shop_config');
    if (saved) {
      const parsed = JSON.parse(saved);

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
        depositAmount: Number(parsed.depositAmount) || DEFAULT_SHOP_CONFIG.depositAmount,
        loyaltyDiscountPercent: Number(parsed.loyaltyDiscountPercent) || DEFAULT_SHOP_CONFIG.loyaltyDiscountPercent,
        loyaltyMaxDiscount: Number(parsed.loyaltyMaxDiscount) || DEFAULT_SHOP_CONFIG.loyaltyMaxDiscount,
        warehousePin: String(parsed.warehousePin || DEFAULT_SHOP_CONFIG.warehousePin),
        address: parsed.address || DEFAULT_SHOP_CONFIG.address,
        originProvince: parsed.originProvince || DEFAULT_SHOP_CONFIG.originProvince,
        hotline: parsed.hotline || DEFAULT_SHOP_CONFIG.hotline,
        zaloPhone: parsed.zaloPhone || DEFAULT_SHOP_CONFIG.zaloPhone,
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