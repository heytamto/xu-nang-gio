// src/services/masterDataService.js
import { productRepo } from '../../infrastructure/supabase/repositories/productRepository';
import { contentRepo } from '../../infrastructure/supabase/repositories/contentRepository';
import { marketingRepo } from '../../infrastructure/supabase/repositories/marketingRepository';

/**
 * Tải toàn bộ Master Data thông qua các Repository đã tách biệt
 */
export async function fetchAllMasterDataFromSupabase(groups = ['catalog', 'content', 'config', 'reviews']) {
  const has = (group) => groups.includes(group);
  try {
    // Gọi song song qua các Repository
    const [
      categories,
      rawProducts,
      posts,
      stories,
      vouchers,
      gifts,
      configs,
      reviews
    ] = await Promise.all([
      has('catalog') ? contentRepo.getCategories() : null,
      has('catalog') ? productRepo.getAllWithWeights() : null,
      has('content') ? contentRepo.getPosts() : null,
      has('content') ? contentRepo.getStories() : null,
      has('config') ? marketingRepo.getVouchers() : null,
      has('config') ? marketingRepo.getPaymentRewardsGifts() : null,
      has('config') ? marketingRepo.getShopConfigs() : null,
      has('reviews') ? marketingRepo.getApprovedReviews(8) : null
    ]);

    // Cấu hình mặc định của shop
    let parsedConfig = {
      hotline: '0848.957.345',
      zaloPhone: '0848957345',
      bankBin: '970422',
      bankName: 'MBBank',
      accountNo: '0848957345',
      accountName: 'TO THANH TAM',
      depositAmount: 50000,
      shippingFee: 30000,
      freeShippingThreshold: 300000,
      enablePaymentGifts: true,
      vouchers: []
    };

    if (Array.isArray(configs) && configs.length > 0) {
      if (configs[0].bank_bin || configs[0].bank_name || configs[0].hotline) {
        const row = configs[0];
        parsedConfig = {
          ...parsedConfig,
          bankBin: row.bank_bin || parsedConfig.bankBin,
          bankName: row.bank_name || parsedConfig.bankName,
          accountNo: row.account_no || row.bank_account || parsedConfig.accountNo,
          accountName: row.account_name || row.bank_holder || parsedConfig.accountName,
          depositAmount: row.deposit_amount != null ? Number(row.deposit_amount) : parsedConfig.depositAmount,
          shippingFee: row.shipping_fee != null ? Number(row.shipping_fee) : parsedConfig.shippingFee,
          freeShippingThreshold: row.free_shipping_threshold != null ? Number(row.free_shipping_threshold) : parsedConfig.freeShippingThreshold,
          hotline: row.hotline || parsedConfig.hotline,
          address: row.address,
          announcement: row.announcement,
          zaloPhone: row.zalo_phone || parsedConfig.zaloPhone,
          loyaltyDiscountPercent: row.loyalty_discount_percent,
          loyaltyMaxDiscount: row.loyalty_max_discount,
          autoSendEmail: row.auto_send_email,
          enablePaymentGifts: row.enable_payment_gifts !== false,
          vouchers: row.vouchers || []
        };
      } else {
        const rawMap = {};
        configs.forEach((item) => {
          if (!item.key) return;
          try {
            rawMap[item.key] = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
          } catch {
            rawMap[item.key] = item.value;
          }
        });

        const gen = rawMap.general || rawMap.general_config || {};
        const pay = rawMap.payment || rawMap.payment_config || {};
        const ship = rawMap.shipping || {};
        const loyalty = rawMap.loyalty || {};

        const isGiftsActive = gen.enablePaymentGifts !== undefined
          ? gen.enablePaymentGifts !== false && String(gen.enablePaymentGifts) !== 'false'
          : pay.enablePaymentGifts !== undefined
          ? pay.enablePaymentGifts !== false && String(pay.enablePaymentGifts) !== 'false'
          : true;

        parsedConfig = {
          ...parsedConfig,
          ...rawMap,
          hotline: gen.hotline || parsedConfig.hotline,
          zaloPhone: gen.zaloPhone || parsedConfig.zaloPhone,
          address: gen.address,
          brandName: gen.brandName,
          tagline: gen.tagline,
          logoUrl: gen.logoUrl ?? "",
          autoSendEmail: gen.autoSendEmail,
          enablePaymentGifts: isGiftsActive,
          bankBin: pay.bankBin || parsedConfig.bankBin,
          bankName: pay.bankName || parsedConfig.bankName,
          accountNo: pay.accountNo || parsedConfig.accountNo,
          accountName: pay.accountName || parsedConfig.accountName,
          depositAmount: pay.depositAmount != null ? Number(pay.depositAmount) : parsedConfig.depositAmount,
          shippingCarrier: ship.carrier,
          shippingFee: ship.standardFee ?? ship.shippingFee ?? pay.shippingFee ?? parsedConfig.shippingFee,
          freeShippingThreshold: ship.freeShippingMin ?? ship.freeShippingThreshold ?? pay.freeShippingThreshold ?? parsedConfig.freeShippingThreshold,
          loyaltyDiscountPercent: loyalty.percent ?? parsedConfig.loyaltyDiscountPercent,
          loyaltyMaxDiscount: loyalty.maxDiscount ?? parsedConfig.loyaltyMaxDiscount
        };
      }
    }

    // Chuẩn hóa danh sách sản phẩm, quy cách & bộ ảnh
    const formattedProducts = (rawProducts || []).map((p) => {
      const weightsList = Array.isArray(p.product_weights) && p.product_weights.length > 0
        ? [...p.product_weights]
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((w) => ({
              id: w.weight_key || String(w.id),
              weight_key: w.weight_key,
              label: w.label,
              weight_label: w.label,
              multiplier: Number(w.multiplier) || 1,
              priceOverride: w.price_override != null ? Number(w.price_override) : null,
              price_override: w.price_override != null ? Number(w.price_override) : null,
              isDefault: Boolean(w.is_default)
            }))
        : [{ id: 'std', weight_key: 'std', label: `1 ${p.unit || 'kg'}`, weight_label: `1 ${p.unit || 'kg'}`, multiplier: 1, isDefault: true }];

      // Chuẩn hóa mảng ảnh (Multi-images)
      const imagesList = Array.isArray(p.images) && p.images.length > 0
        ? p.images.filter(Boolean)
        : (typeof p.images === 'string' && p.images.trim()
            ? p.images.split(/[,|\n]/).map((s) => s.trim()).filter(Boolean)
            : [p.image_url || p.image || ''].filter(Boolean));

      // Chuẩn hóa flavors
      const flavorsList = Array.isArray(p.flavors)
        ? p.flavors
        : (typeof p.flavors === 'string' && p.flavors.trim()
            ? p.flavors.split('|').map((item, idx) => ({ id: `flv-${idx + 1}`, label: item.trim(), priceBonus: 0 }))
            : []);

      const primaryCover = imagesList[0] || p.image_url || p.image || '';

      return {
        id: p.id,
        name: p.name,
        category: p.category,
        category_id: p.category,
        basePrice: Number(p.base_price) || 0,
        base_price: Number(p.base_price) || 0,
        price: Number(p.base_price) || 0,
        unit: p.unit,
        badge: p.badge,
        source: p.source,
        desc: p.description,
        description: p.description,
        image: primaryCover,
        image_url: primaryCover,
        images: imagesList,
        flavors: flavorsList,
        inStock: p.in_stock !== false,
        in_stock: p.in_stock !== false,
        campaign_gift_id: p.campaign_gift_id,
        campaign_tag: p.campaign_tag,
        weights: weightsList,
        product_weights: weightsList,
        created_at: p.created_at,
        updated_at: p.updated_at
      };
    });

    const validPaymentGifts = (gifts || []).filter(g => g.type === 'payment_reward' && g.is_active !== false);

    const result = {
      categories: (categories || []).map(c => ({ ...c, label: c.name })),
      products: formattedProducts,
      posts: (posts || []).map((post) => ({
        ...post,
        image: post.image_url || post.image,
        image_url: post.image_url || post.image,
        excerpt: post.excerpt || post.description || post.desc,
        readTime: post.read_time || post.readTime
      })),
      stories: (stories || []).map((s) => ({
        ...s,
        image: s.image_url || s.image,
        image_url: s.image_url || s.image,
        story: s.story || s.content,
        content: s.story || s.content
      })),
      vouchers: vouchers || parsedConfig.vouchers || [],
      giftsCatalog: validPaymentGifts,
      paymentGifts: validPaymentGifts,
      config: parsedConfig,
      reviews: reviews || []
    };
    const keys = { catalog: ['categories', 'products'], content: ['posts', 'stories'], config: ['vouchers', 'giftsCatalog', 'paymentGifts', 'config'], reviews: ['reviews'] };
    return Object.fromEntries(groups.flatMap(group => (keys[group] || []).map(key => [key, result[key]])));
  } catch (err) {
    console.error('Lỗi fetchAllMasterDataFromSupabase:', err);
    return null;
  }
}