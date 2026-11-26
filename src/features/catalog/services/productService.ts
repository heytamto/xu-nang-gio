import type { NumericValue, EntityId, CheckoutWeight } from '../../../shared/types/contracts.ts';
export interface CreateProductInput {
  name: string;
  base_price: NumericValue;
  unit?: string;
  category?: EntityId | null;
  badge?: string | null;
  source?: string | null;
  desc?: string | null;
  description?: string | null;
  image_url?: string | null;
  images?: string[];
  flavors?: unknown[];
  in_stock?: boolean;
  product_weights?: CheckoutWeight[];
  weights?: CheckoutWeight[];
}
// src/services/productService.js
import { productRepo } from '../../../infrastructure/supabase/repositories/productRepository';

export async function createProductWithWeights(productData: CreateProductInput): Promise<unknown> {
  try {
    return await productRepo.createWithWeights(productData);
  } catch (error) {
    console.error('Lỗi gọi service createProductWithWeights:', error);
    throw error;
  }
}