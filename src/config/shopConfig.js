// src/config/shopConfig.js
import { VIETQR_BANKS } from '../constants/vietqrBanks';

// Trích xuất số điện thoại sạch (chỉ giữ lại ký tự số) để gắn link tel:
const rawHotline = import.meta.env.VITE_HOTLINE || '0848.957.345';
const cleanPhone = rawHotline.replace(/\D/g, '');
const rawZalo = import.meta.env.VITE_ZALO_PHONE || '0848957345';

export { VIETQR_BANKS };

export const DEFAULT_SHOP_CONFIG = {
  // 1. Nhóm cấu hình Thanh toán & VietQR (Hỗ trợ cả dạng lồng & phẳng)
  bankBin: String(import.meta.env.VITE_BANK_BIN || '970422'),
  bankName: import.meta.env.VITE_BANK_NAME || 'MBBank',
  accountNo: String(import.meta.env.VITE_ACCOUNT_NO || '0848957345'),
  accountName: import.meta.env.VITE_ACCOUNT_NAME || 'TO THANH TAM',
  depositAmount: 50000,
  enablePaymentGifts: true,

  payment: {
    bankBin: String(import.meta.env.VITE_BANK_BIN || '970422'),
    bankName: import.meta.env.VITE_BANK_NAME || 'MBBank',
    accountNo: String(import.meta.env.VITE_ACCOUNT_NO || '0848957345'),
    accountName: import.meta.env.VITE_ACCOUNT_NAME || 'TO THANH TAM',
    depositAmount: 50000,
  },

  // 2. Nhóm cấu hình Vận chuyển (Shipping)
  shippingFee: 30000,
  freeShippingThreshold: 500000,
  shipping: {
    standardFee: 30000,
    freeShippingMin: 500000,
  },

  // 3. Nhóm cấu hình Khách hàng thân thiết (Loyalty)
  loyaltyDiscountPercent: 10,
  loyaltyMaxDiscount: 50000,
  loyalty: {
    percent: 10,
    maxDiscount: 50000,
  },

  // 4. Thông tin liên hệ, Địa chỉ & Mạng xã hội từ .env
  brandName: 'Xứ Nắng Gió',
  tagline: 'Đặc sản hái giàn chuẩn đất Ninh Thuận',
  hotline: rawHotline,
  phoneNumber: cleanPhone || rawZalo,
  zaloPhone: rawZalo,
  email: import.meta.env.VITE_EMAIL || 'cskh@xunanggio.com',
  address: import.meta.env.VITE_STORE_ADDRESS || 'Thôn Trường Sanh, Xã Phước Hậu, Tỉnh Ninh Thuận',
  originProvince: import.meta.env.VITE_ORIGIN_PROVINCE || 'Ninh Thuận',
  warehousePin: '1234',
  autoSendEmail: true,
  announcement: 'Nông sản cắt giàn hái sớm - Gửi xe khách trong đêm tới TP.HCM',
  zaloUrl: rawZalo ? `https://zalo.me/${rawZalo}` : '',
  facebookUrl: import.meta.env.VITE_FACEBOOK_URL || 'https://facebook.com/xunanggio',
  tiktokUrl: import.meta.env.VITE_TIKTOK_URL || 'https://tiktok.com/@xunanggio',
  telegramUrl: import.meta.env.VITE_TELEGRAM_URL || 'https://t.me/xunanggio',
  twitterUrl: import.meta.env.VITE_TWITTER_URL || 'https://twitter.com/xunanggio',

  // 5. Google Maps (Tọa độ giàn vườn)
  mapDirectionsUrl: import.meta.env.VITE_MAP_DIRECTIONS_URL || 'https://www.google.com/maps/dir/?api=1&destination=11.563539,108.930892',
  mapEmbedUrl: import.meta.env.VITE_MAP_EMBED_URL || 'https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d251.61865863961202!2d108.93089242170359!3d11.563539363791506!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1svi!2s!4v1792144018447!5m2!1svi!2s',

  // 6. Danh mục quà tặng mặc định (Khớp bảng gifts: gft01 -> gft07)
  giftsCatalog: [
    { id: 'gft01', title: 'Hũ muối ớt tôm rang hạt', tag: 'Quà Quê', type: 'combo_bonus' },
    { id: 'gft02', title: 'Hũ mứt nho sấy dẻo', tag: 'Giàn Tươi', type: 'combo_bonus' },
    { id: 'gft03', title: 'Xấp bánh tráng mè nướng', tag: 'Đặc Sản', type: 'combo_bonus' },
    { id: 'gft04', title: 'Hộp thiệp chúc & túi quà', tag: 'Biếu Tặng', type: 'combo_bonus' },
    { id: 'gft05', title: 'Bánh tráng mắm ruốc nướng', tag: 'Quà Quê', type: 'combo_bonus' },
    { id: 'gft06', title: 'Hũ muối ớt xiêm xanh', tag: 'Gió Biển', type: 'combo_bonus' },
    { id: 'gft07', title: 'Chai mật nho mini 100ml', tag: 'Tri Ân', type: 'payment_reward' }
  ]
};

// =========================================================================
// CÁC HÀM HELPER ĐỌC GIÁ TRỊ ĐỘNG AN TOÀN
// =========================================================================

/**
 * Trích xuất số tiền cọc chuẩn từ cấu hình (Ưu tiên DB payment.depositAmount)
 */
export function resolveDepositAmount(shopConfig) {
  const amount = 
    shopConfig?.payment?.depositAmount ?? 
    shopConfig?.payment_config?.depositAmount ?? 
    shopConfig?.depositAmount ?? 
    shopConfig?.deposit_amount;
    
  const num = Number(amount);
  return !isNaN(num) && num > 0 ? num : 50000;
}

/**
 * Trích xuất cấu hình tài khoản VietQR
 */
export function resolveBankConfig(shopConfig) {
  return {
    bankBin: String(shopConfig?.payment?.bankBin || shopConfig?.bankBin || import.meta.env?.VITE_BANK_BIN || '970422'),
    bankName: shopConfig?.payment?.bankName || shopConfig?.bankName || import.meta.env?.VITE_BANK_NAME || 'MBBank',
    accountNo: String(shopConfig?.payment?.accountNo || shopConfig?.accountNo || import.meta.env?.VITE_ACCOUNT_NO || '0848957345'),
    accountName: shopConfig?.payment?.accountName || shopConfig?.accountName || import.meta.env?.VITE_ACCOUNT_NAME || 'TO THANH TAM',
  };
}

/**
 * Trích xuất phí ship và hạn mức freeship
 */
export function resolveShippingConfig(shopConfig) {
  const standardFee = Number(
    shopConfig?.shipping?.standardFee ?? 
    shopConfig?.standardFee ?? 
    shopConfig?.shippingFee ?? 
    30000
  );

  const freeShippingMin = Number(
    shopConfig?.shipping?.freeShippingMin ?? 
    shopConfig?.freeShippingMin ?? 
    shopConfig?.freeShippingThreshold ?? 
    500000
  );

  return { standardFee, freeShippingMin };
}

/**
 * Chuyển đổi dữ liệu raw từ bảng `shop_configs` Supabase sang Object đồng bộ
 */
export function parseShopConfigFromDb(rawRows = []) {
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    return DEFAULT_SHOP_CONFIG;
  }

  const configMap = {};
  rawRows.forEach((row) => {
    let val = row.value;
    if (typeof val === 'string') {
      try {
        val = JSON.parse(val);
      } catch {
        // Giữ nguyên chuỗi nếu không phải JSON
      }
    }
    configMap[row.key] = val;
  });

  const payment = configMap['payment'] || {};
  const shipping = configMap['shipping'] || {};
  const loyalty = configMap['loyalty'] || {};
  const general = configMap['general'] || {};
  const announcement = configMap['announcement'] || {};

  return {
    ...DEFAULT_SHOP_CONFIG,
    ...configMap,
    
    // Nhóm thanh toán
    payment: { ...DEFAULT_SHOP_CONFIG.payment, ...payment },
    bankBin: String(payment.bankBin || DEFAULT_SHOP_CONFIG.bankBin),
    bankName: payment.bankName || DEFAULT_SHOP_CONFIG.bankName,
    accountNo: String(payment.accountNo || DEFAULT_SHOP_CONFIG.accountNo),
    accountName: payment.accountName || DEFAULT_SHOP_CONFIG.accountName,
    depositAmount: Number(payment.depositAmount) || DEFAULT_SHOP_CONFIG.depositAmount,

    // Nhóm vận chuyển
    shipping: { ...DEFAULT_SHOP_CONFIG.shipping, ...shipping },
    shippingFee: Number(shipping.standardFee) || DEFAULT_SHOP_CONFIG.shippingFee,
    freeShippingThreshold: Number(shipping.freeShippingMin) || DEFAULT_SHOP_CONFIG.freeShippingThreshold,

    // Nhóm ưu đãi
    loyalty: { ...DEFAULT_SHOP_CONFIG.loyalty, ...loyalty },
    loyaltyDiscountPercent: Number(loyalty.percent) || DEFAULT_SHOP_CONFIG.loyaltyDiscountPercent,
    loyaltyMaxDiscount: Number(loyalty.maxDiscount) || DEFAULT_SHOP_CONFIG.loyaltyMaxDiscount,

    // Nhóm thông tin chung
    brandName: general.brandName || general.shop_name || DEFAULT_SHOP_CONFIG.brandName,
    address: general.address || DEFAULT_SHOP_CONFIG.address,
    hotline: general.hotline || general.zaloPhone || DEFAULT_SHOP_CONFIG.hotline,
    announcement: typeof announcement === 'string' ? announcement : (announcement.text || DEFAULT_SHOP_CONFIG.announcement),
  };
}

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
        announcement: parsed.announcement || DEFAULT_SHOP_CONFIG.announcement,
        autoSendEmail: parsed.autoSendEmail !== undefined ? parsed.autoSendEmail : DEFAULT_SHOP_CONFIG.autoSendEmail,
        giftsCatalog: Array.isArray(parsed.giftsCatalog) && parsed.giftsCatalog.length > 0 
          ? parsed.giftsCatalog 
          : DEFAULT_SHOP_CONFIG.giftsCatalog
      };

      localStorage.setItem('shop_config', JSON.stringify(updatedConfig));
      return updatedConfig;
    }
  } catch (e) {
    console.error('Lỗi đọc shop_config từ LocalStorage:', e);
  }
  return DEFAULT_SHOP_CONFIG;
}