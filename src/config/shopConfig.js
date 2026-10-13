export const DEFAULT_SHOP_CONFIG = {
  bankBin: '970422',
  bankName: 'MB Bank',
  accountNo: '0987654321',
  accountName: 'TO THANH TAM',
  depositAmount: 50000,
  hotline: '0987.654.321',
  loyaltyDiscountPercent: 10,
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
      // Đảm bảo voucher hệ thống như LAMQUEN không bị mất nếu bản lưu cũ chưa có
      const currentVouchers = Array.isArray(parsed.vouchers) ? parsed.vouchers : [];
      const mergedVouchers = [...currentVouchers];

      DEFAULT_SHOP_CONFIG.vouchers.forEach((defV) => {
        if (!mergedVouchers.some((v) => v.code === defV.code)) {
          mergedVouchers.push(defV);
        }
      });

      return {
        ...DEFAULT_SHOP_CONFIG,
        ...parsed,
        vouchers: mergedVouchers
      };
    }
  } catch (e) {
    console.error('Lỗi đọc shop_config:', e);
  }
  return DEFAULT_SHOP_CONFIG;
}
