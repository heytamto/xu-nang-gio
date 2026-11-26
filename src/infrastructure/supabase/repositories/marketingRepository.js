// src/repositories/marketingRepository.js
import { supabase } from '../supabaseClient';

export const marketingRepo = {
  async getVouchers() {
    // Voucher codes are not public catalog data; use voucher quote API.
    return [];
  },

  async getPaymentRewardsGifts() {
    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .eq('type', 'payment_reward')
      .order('id', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getShopConfigs() {
    const { data, error } = await supabase.rpc('xng_public_config_staging');
    if (error) throw error;
    return data || [];
  },

  async getApprovedReviews(limit = 8) {
    try {
      const { data, error } = await supabase.rpc('xng_public_reviews_staging', {p_page:0,p_page_size:Math.min(24,Math.max(1,limit))});
      if (error) return [];
      return data?.reviews || [];
    } catch {
      return [];
    }
  }
};