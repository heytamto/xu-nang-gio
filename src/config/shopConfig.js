// src/config/shopConfig.js
import { VIETQR_BANKS } from '../constants/vietqrBanks';

// Trích xuất số điện thoại sạch (chỉ giữ lại ký tự số) để gắn link tel:
const rawHotline = import.meta.env.VITE_HOTLINE || '0848.957.345';
const cleanPhone = rawHotline.replace(/\D/g, '');
const rawZalo = import.meta.env.VITE_ZALO_PHONE || '0848957345';

export { VIETQR_BANKS };

export const DEFAULT_SHOP_CONFIG = {
  // 1. Tài khoản ngân hàng VietQR
  bankBin: String(import.meta.env.VITE_BANK_BIN || '970422'),
  bankName: import.meta.env.VITE_BANK_NAME || 'MBBank',
  accountNo: String(import.meta.env.VITE_ACCOUNT_NO || '0848957345'),
  accountName: import.meta.env.VITE_ACCOUNT_NAME || 'TO THANH TAM',
  depositAmount: 50000,
  loyaltyDiscountPercent: 10,
  loyaltyMaxDiscount: 50000,

  // 2. Thông tin liên hệ, Địa chỉ & Mạng xã hội từ .env
  brandName: 'Xứ Nắng Gió',
  tagline: 'Đặc sản hái giàn chuẩn đất Phan Rang',
  hotline: rawHotline,
  phoneNumber: cleanPhone || rawZalo,
  zaloPhone: rawZalo,
  email: import.meta.env.VITE_EMAIL || 'xunanggio@gmail.com',
  address: import.meta.env.VITE_STORE_ADDRESS || 'Trường Sanh, Phước Hậu, Ninh Phước',
  originProvince: import.meta.env.VITE_ORIGIN_PROVINCE || 'Ninh Thuận',
  warehousePin: '1234',
  zaloUrl: rawZalo ? `https://zalo.me/${rawZalo}` : '',
  facebookUrl: import.meta.env.VITE_FACEBOOK_URL || 'https://facebook.com/xunanggio',
  tiktokUrl: import.meta.env.VITE_TIKTOK_URL || 'https://tiktok.com/@xunanggio',

  // 3. Google Maps (Tọa độ giàn vườn)
  mapDirectionsUrl: import.meta.env.VITE_MAP_DIRECTIONS_URL || 'https://www.google.com/maps/dir/?api=1&destination=11.563539,108.930892',
  mapEmbedUrl: import.meta.env.VITE_MAP_EMBED_URL || 'https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d251.61865863961202!2d108.93089242170359!3d11.563539363791506!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1svi!2s!4v1792144018447!5m2!1svi!2s',

  // 4. Danh mục quà tặng mặc định (Khớp bảng gifts: gft01 -> gft07)
  giftsCatalog: [
    { id: 'gft01', title: 'Hũ muối ớt tôm rang hạt', tag: 'Quà Quê', type: 'combo_bonus' },
    { id: 'gft02', title: 'Hũ mứt nho sấy dẻo', tag: 'Giàn Tươi', type: 'combo_bonus' },
    { id: 'gft03', title: 'Xấp bánh tráng mè nướng', tag: 'Đặc Sản', type: 'combo_bonus' },
    { id: 'gft04', title: 'Hộp thiệp chúc & túi quà', tag: 'Biếu Tặng', type: 'combo_bonus' },
    { id: 'gft05', title: 'Bánh tráng mắm ruốc nướng', tag: 'Quà Quê', type: 'combo_bonus' },
    { id: 'gft06', title: 'Hũ muối ớt xiêm xanh', tag: 'Gió Biển', type: 'combo_bonus' },
    { id: 'gft07', title: 'Chai mật nho mini 100ml', tag: 'Tri Ân', type: 'payment_reward' }
  ],

  // 5. Mã giảm giá (Khớp bảng vouchers PostgreSQL)
  vouchers: [
    {
      code: 'TRIAN10',
      type: 'percent',
      value: 10,
      minOrder: 200000,
      maxDiscount: 50000,
      canStack: true,
      usageLimit: 100,
      usedCount: 0,
      desc: 'Giảm 10% tối đa 50k cho khách thân thiết ghé vườn'
    },
    {
      code: 'FREESHIP',
      type: 'fixed',
      value: 30000,
      minOrder: 300000,
      maxDiscount: 30000,
      canStack: true,
      usageLimit: 200,
      usedCount: 0,
      desc: 'Hỗ trợ 30k cước gửi xe khách đơn từ 300k'
    },
    {
      code: 'LAMQUEN',
      type: 'fixed',
      value: 15000,
      minOrder: 100000,
      maxDiscount: 15000,
      canStack: true,
      usageLimit: 0,
      usedCount: 0,
      desc: 'Quà làm quen từ vườn (Giảm 15.000đ cho đơn từ 100k)'
    }
  ]
};

/**
 * Đọc cấu hình từ LocalStorage kèm Fallback an toàn
 */
export function getShopConfig() {
  try {
    const saved = localStorage.getItem('shop_config');
    if (saved) {
      const parsed = JSON.parse(saved);

      const validAccountNo = (parsed.accountNo && String(parsed.accountNo) !== '0987654321')
        ? String(parsed.accountNo) 
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
        bankBin: String(parsed.bankBin || DEFAULT_SHOP_CONFIG.bankBin),
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
        giftsCatalog: Array.isArray(parsed.giftsCatalog) && parsed.giftsCatalog.length > 0 
          ? parsed.giftsCatalog 
          : DEFAULT_SHOP_CONFIG.giftsCatalog,
        vouchers: mergedVouchers
      };

      localStorage.setItem('shop_config', JSON.stringify(updatedConfig));
      return updatedConfig;
    }
  } catch (e) {
    console.error('Lỗi đọc shop_config từ LocalStorage:', e);
  }
  return DEFAULT_SHOP_CONFIG;
}