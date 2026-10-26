// src/repositories/productRepository.js
import { createRepository } from './baseRepository';
import { supabase } from '../supabaseClient';

// 1. Khởi tạo base repo cho bảng products với chiến lược manual_slug
const baseProductRepo = createRepository('products', { strategy: 'manual_slug' });

// 2. Mở rộng thêm các hàm nghiệp vụ riêng của sản phẩm
export const productRepo = {
  // Kế thừa toàn bộ CRUD từ Base Repo (getAll, update, remove...)
  ...baseProductRepo,

  // Lấy toàn bộ sản phẩm kèm quy cách đóng gói (weights / product_weights)
  async getAllWithWeights() {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_weights(*)')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Lỗi truy vấn products kèm product_weights:', error);
      throw error;
    }

    if (!Array.isArray(data)) return [];

    // Chuẩn hóa dữ liệu tương thích cả snake_case và camelCase cho App
    return data.map((prod) => {
      const rawWeights = prod.product_weights || [];
      const sortedWeights = [...rawWeights].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

      const normalizedWeights = sortedWeights.map((w) => ({
        ...w,
        id: w.weight_key || String(w.id),
        weight_key: w.weight_key,
        label: w.label,
        weight_label: w.label,
        multiplier: Number(w.multiplier) || 1,
        priceOverride: w.price_override != null ? Number(w.price_override) : null,
        price_override: w.price_override != null ? Number(w.price_override) : null,
        isDefault: Boolean(w.is_default),
        is_default: Boolean(w.is_default)
      }));

      return {
        ...prod,
        id: prod.id,
        name: prod.name,
        category: prod.category,
        category_id: prod.category,
        basePrice: Number(prod.base_price ?? prod.price ?? 0),
        base_price: Number(prod.base_price ?? prod.price ?? 0),
        unit: prod.unit || 'kg',
        badge: prod.badge || '',
        source: prod.source || '',
        desc: prod.description || '',
        description: prod.description || '',
        image: prod.image_url || '',
        image_url: prod.image_url || '',
        inStock: prod.in_stock ?? true,
        in_stock: prod.in_stock ?? true,
        weights: normalizedWeights,
        product_weights: normalizedWeights
      };
    });
  },

  // Xóa sạch sản phẩm kèm theo bảng con product_weights an toàn
  async deleteCascade(productId) {
    // 1. Kiểm tra xem sản phẩm đã có trong đơn hàng nào chưa
    const { data: orderedItems, error: checkErr } = await supabase
      .from('order_items')
      .select('id')
      .eq('product_id', productId)
      .limit(1);

    if (orderedItems && orderedItems.length > 0) {
      throw new Error('Sản phẩm này đã có trong lịch sử đơn hàng, không thể xóa vĩnh viễn! Hãy chọn "Tạm hết lứa" để ngừng bán.');
    }

    // 2. Xóa quy cách đóng gói trước
    const { error: weightDelErr } = await supabase
      .from('product_weights')
      .delete()
      .eq('product_id', productId);

    if (weightDelErr) {
      console.error('Lỗi xóa product_weights:', weightDelErr);
      throw weightDelErr;
    }

    // 3. Xóa sản phẩm chính
    const { error: prodDelErr } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (prodDelErr) {
      console.error('Lỗi xóa sản phẩm:', prodDelErr);
      throw prodDelErr;
    }

    return true;
  },

  // Thêm mới sản phẩm kèm quy cách
  async createWithWeights(productData) {
    const { data, error } = await supabase.rpc('create_product_with_weights', {
      p_name: productData.name,
      p_base_price: productData.base_price,
      p_unit: productData.unit,
      p_category: productData.category,
      p_badge: productData.badge || null,
      p_source: productData.source || null,
      p_description: productData.desc || productData.description || null,
      p_image_url: productData.image_url || productData.image || null,
      p_in_stock: productData.in_stock ?? true,
      p_weights: productData.product_weights || productData.weights || []
    });

    if (error) {
      console.error('Lỗi gọi RPC create_product_with_weights:', error);
      throw error;
    }

    return data;
  }
};

export default productRepo;