// src/services/masterDataService.js
import { supabase } from '../supabaseClient';

/**
 * Tải toàn bộ Master Data trực tiếp từ Supabase (3NF Products + Product Weights + Safe Config + Reviews)
 */
export async function fetchAllMasterDataFromSupabase() {
  try {
    const [
      { data: categories, error: errCats },
      { data: products, error: errProds },
      { data: posts, error: errPosts },
      { data: stories, error: errStories },
      { data: vouchers, error: errVouchers },
      { data: gifts, error: errGifts },
      configRes,
      reviewRes
    ] = await Promise.all([
      supabase.from('categories').select('*').order('id', { ascending: true }),
      // Quan hệ 1-N chuẩn 3NF với bảng product_weights
      supabase.from('products').select(`
        id,
        name,
        category,
        base_price,
        unit,
        badge,
        source,
        description,
        image_url,
        in_stock,
        campaign_gift_id,
        campaign_tag,
        product_weights (
          id,
          weight_key,
          label,
          multiplier,
          price_override,
          is_default,
          sort_order
        )
      `).order('id', { ascending: true }),
      supabase.from('posts').select('*').order('created_at', { ascending: false }),
      supabase.from('stories').select('*').order('created_at', { ascending: false }),
      supabase.from('vouchers').select('*'),
      supabase.from('gifts').select('*'),
      // Safe Query cho shop_config: Tránh crash nếu bảng chưa tồn tại
      supabase.from('shop_config').select('*').then(res => res).catch(() => ({ data: null, error: null })),
      // Safe Query cho reviews đã duyệt
      supabase.from('reviews').select('*').eq('is_approved', true).order('created_at', { ascending: false }).limit(8).then(res => res).catch(() => ({ data: null, error: null }))
    ]);

    if (errCats) console.warn('Lưu ý categories:', errCats.message);
    if (errProds) console.warn('Lưu ý products:', errProds.message);

    // Chuẩn hóa cấu hình shop an toàn
    let parsedConfig = {};
    const configs = configRes?.data;
    if (Array.isArray(configs) && configs.length > 0) {
      if (configs[0].bank_bin || configs[0].bank_name || configs[0].hotline) {
        // Cấu hình dạng 1 row (main_config / default_config)
        const row = configs[0];
        parsedConfig = {
          bankBin: row.bank_bin,
          bankName: row.bank_name,
          accountNo: row.account_no || row.bank_account,
          accountName: row.account_name || row.bank_holder,
          depositAmount: row.deposit_amount,
          hotline: row.hotline,
          address: row.address,
          announcement: row.announcement,
          zaloPhone: row.zalo_phone,
          warehousePin: row.warehouse_pin,
          loyaltyDiscountPercent: row.loyalty_discount_percent,
          loyaltyMaxDiscount: row.loyalty_max_discount,
          autoSendEmail: row.auto_send_email,
          vouchers: row.vouchers || []
        };
      } else {
        // Cấu hình dạng key-value
        configs.forEach((item) => {
          if (item.key) parsedConfig[item.key] = item.value;
        });
      }
    }

    return {
      categories: categories || [],
      products: (products || []).map((p) => {
        // Chuẩn hóa mảng weights từ quan hệ bảng product_weights
        const weightsList = Array.isArray(p.product_weights) && p.product_weights.length > 0
          ? [...p.product_weights]
              .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              .map((w) => ({
                id: w.weight_key || w.id,
                weight_key: w.weight_key,
                label: w.label,
                multiplier: Number(w.multiplier) || 1,
                priceOverride: w.price_override != null ? Number(w.price_override) : null,
                isDefault: Boolean(w.is_default)
              }))
          : [{ id: 'std', weight_key: 'std', label: `1 ${p.unit || 'kg'}`, multiplier: 1, isDefault: true }];

        return {
          id: p.id,
          name: p.name,
          category: p.category,
          basePrice: Number(p.base_price) || 0,
          unit: p.unit,
          badge: p.badge,
          source: p.source,
          desc: p.description,
          image: p.image_url,
          inStock: p.in_stock,
          campaign_gift_id: p.campaign_gift_id,
          campaign_tag: p.campaign_tag,
          weights: weightsList
        };
      }),
      posts: (posts || []).map((post) => ({
        ...post,
        image: post.image_url || post.image,
        excerpt: post.excerpt || post.description || post.desc,
        readTime: post.read_time || post.readTime
      })),
      stories: (stories || []).map((s) => ({
        ...s,
        image: s.image_url || s.image,
        story: s.story || s.content
      })),
      vouchers: vouchers || parsedConfig.vouchers || [],
      giftsCatalog: gifts || [],
      config: parsedConfig,
      reviews: reviewRes?.data || [] // Kèm theo danh sách reviews đã duyệt
    };
  } catch (err) {
    console.error('Lỗi fetchAllMasterDataFromSupabase:', err);
    return null;
  }
}