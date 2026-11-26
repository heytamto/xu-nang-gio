// src/repositories/contentRepository.js
import { supabase } from '../supabaseClient';

export const contentRepo = {
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, "order", created_at')
      .order('order', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getStories() {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
};