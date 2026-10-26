// src/repositories/marketingRepository.js
import { supabase } from '../supabaseClient';

export const marketingRepo = {
  async getVouchers() {
    const { data, error } = await supabase.from('vouchers').select('*');
    if (error) throw error;
    return data || [];
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
    try {
      const { data, error } = await supabase.from('shop_configs').select('*');
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  },

  async getApprovedReviews(limit = 8) {
    try {
      const { data, error } = await supabase.from('reviews')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  }
};