// src/repositories/index.js
import { createRepository } from './baseRepository';
export { productRepo } from './productRepository';
export { contentRepo } from './contentRepository';
export { marketingRepo } from './marketingRepository';
export { orderRepo } from './orderRepository';

// 1. Nhóm Bán hàng & Giao dịch (Orders dùng client_retry sinh mã XNG-YYYYMMDD-XXXX)
export const orderItemRepo = createRepository('order_items', { strategy: 'db_uuid' });
export const orderStatusLogRepo = createRepository('order_status_logs', { strategy: 'db_uuid' });

// 2. Nhóm Khách hàng & Rủi ro
export const customerRepo = createRepository('customers', { strategy: 'db_sequence' }); // Tự sinh cus-0001
export const customerRiskRepo = createRepository('customer_risk_profiles', { strategy: 'db_uuid' });

// 3. Nhóm Sản phẩm & Kho hàng (Admin tự nhập ID slug hoặc mã SKU)
export const productWeightRepo = createRepository('product_weights', { strategy: 'db_sequence' }); // Tự sinh pw-0001
export const categoryRepo = createRepository('categories', { strategy: 'manual_slug' });
export const giftRepo = createRepository('gifts', { strategy: 'manual_slug' });
export const voucherRepo = createRepository('vouchers', { strategy: 'manual_slug' }); // Dùng cột code làm PK

// 4. Nhóm Nội dung & Marketing
export const postRepo = createRepository('posts', { strategy: 'manual_slug' });
export const storyRepo = createRepository('stories', { strategy: 'manual_slug' });
export const reviewRepo = createRepository('reviews', { strategy: 'db_uuid' });
export const emailTemplateRepo = createRepository('email_templates', { 
  strategy: 'db_sequence',
  orderBy: 'updated_at', 
  ascending: false
});

// 5. Nhóm Cấu hình hệ thống (Shop Configs thường là dạng bảng cấu hình chung 1 dòng hoặc key-value)
export const shopConfigRepo = createRepository('shop_configs', { 
  strategy: 'manual_slug',
  orderBy: 'updated_at', // Chỉ định rõ cột sắp xếp
  ascending: false
});