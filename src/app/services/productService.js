// src/services/productService.js
import { productRepo } from '../repositories/productRepository';

export async function createProductWithWeights(productData) {
  try {
    return await productRepo.createWithWeights(productData);
  } catch (error) {
    console.error('Lỗi gọi service createProductWithWeights:', error);
    throw error;
  }
}