// src/services/productService.js
import { supabase } from '../supabaseClient';

export async function createProductWithWeights(productData) {
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