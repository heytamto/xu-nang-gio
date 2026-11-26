export function mapProductToEditForm(product) {
    const rawWeights = product?.product_weights || product?.weights;
    let initialWeights = [];

    if (Array.isArray(rawWeights) && rawWeights.length > 0) {
      initialWeights = rawWeights.map((w, idx) => {
        const hasPriceOverride = w.price_override !== null && w.price_override !== undefined && w.price_override !== '';
        return {
          id: w.id || `opt_${idx + 1}`,
          weight_key: w.weight_key || w.key || `opt_${idx + 1}`,
          label: w.label || w.weight_label || `Quy cách ${idx + 1}`,
          calcType: hasPriceOverride ? 'fixed' : 'multiplier',
          val: hasPriceOverride ? Number(w.price_override) : (parseFloat(w.multiplier) || 1),
          multiplier: parseFloat(w.multiplier) || 1,
          price_override: hasPriceOverride ? Number(w.price_override) : null,
          is_default: Boolean(w.is_default || idx === 0),
          sort_order: w.sort_order ?? idx
        };
      });
    } else {
      initialWeights = [
        {
          id: 'std',
          weight_key: 'std',
          label: `1 ${product?.unit || 'kg'}`,
          calcType: 'multiplier',
          val: 1,
          multiplier: 1,
          price_override: null,
          is_default: true,
          sort_order: 0
        }
      ];
    }

    // Chuẩn hóa danh sách nhiều ảnh (Multi-images)
    const rawImages = Array.isArray(product?.images) && product.images.length > 0
      ? product.images.filter(Boolean)
      : (typeof product?.images === 'string' && product.images.trim()
          ? product.images.split(/[,|\n]/).map(s => s.trim()).filter(Boolean)
          : []);

    const primaryCover = product?.image_url || product?.image || rawImages[0] || '';
    const secondaryImages = rawImages.filter(img => img !== primaryCover);

    // Chuẩn hóa flavors thành chuỗi để hiển thị trên input
    let initialFlavorsStr = '';
    if (Array.isArray(product?.flavors)) {
      initialFlavorsStr = product.flavors.map(f => (typeof f === 'string' ? f : f?.label)).filter(Boolean).join(', ');
    } else if (typeof product?.flavors === 'string') {
      initialFlavorsStr = product.flavors.split('|').map(s => s.trim()).filter(Boolean).join(', ');
    }

    const currentCat = product?.category || product?.category_id || '';

    return {
      ...product,
      name: product?.name || '',
      category: currentCat,
      unit: typeof product?.unit === 'object' ? (product?.unit?.label || 'kg') : (product?.unit || 'kg'),
      basePrice: Number(product?.basePrice ?? product?.base_price ?? product?.price ?? 0),
      badge: product?.badge || '',
      source: product?.source || 'Vườn nhà Tâm (Phước Hậu)',
      image: primaryCover,
      images: secondaryImages,
      videoUrl: product?.video_url || product?.videoUrl || '',
      flavorsInput: initialFlavorsStr,
      desc: product?.description || product?.desc || '',
      inStock: product?.inStock ?? product?.in_stock ?? true,
      weights: initialWeights
    };
}
