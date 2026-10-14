export const DEFAULT_SHOP_CONFIG = {
  bankBin: import.meta.env.VITE_BANK_BIN || '970422',
  bankName: import.meta.env.VITE_BANK_NAME || 'MB',
  accountNo: import.meta.env.VITE_ACCOUNT_NO || '0848957345',
  accountName: import.meta.env.VITE_ACCOUNT_NAME || 'TO THANH TAM',
  depositAmount: 50000,
  hotline: import.meta.env.VITE_HOTLINE || '0987.654.321',
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

      // Nếu trong localStorage đang lưu số giả lập cũ 0987654321 thì tự động đồng bộ sang số thật từ .env
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
        vouchers: mergedVouchers
      };

      // Lưu lại bản đã chuẩn hóa vào localStorage
      localStorage.setItem('shop_config', JSON.stringify(updatedConfig));
      return updatedConfig;
    }
  } catch (e) {
    console.error('Lỗi đọc shop_config:', e);
  }
  return DEFAULT_SHOP_CONFIG;
}
