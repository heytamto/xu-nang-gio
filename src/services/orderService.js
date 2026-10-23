// src/services/orderService.js
import { supabase } from '../supabaseClient';
import { parseOrderTimestampToMs } from '../utils/dateUtils';
import { 
  ORDER_STATUS, 
  normalizeOrderStatus 
} from '../constants/orderStatus';

/**
 * 1. TẠO ĐƠN HÀNG NGUYÊN TỬ VÀO POSTGRESQL (GỌI RPC create_order_atomic HOẶC FALLBACK)
 * Tự động cập nhật tăng used_count cho các mã voucher thuộc bảng public.vouchers
 */
export async function submitOrderToSupabase(orderData) {
  const {
    customer,
    cart,
    paymentMethod,
    subtotal,
    discount,
    finalTotal,
    voucherCode,
    paymentGift,
    campaignGifts,
    edgeSignature,
    customerNote,
    usedPreviousOrderCode
  } = orderData;

  const code = orderData.code || `XNG${Date.now().toString().slice(-6)}`;
  const cleanPhone = String(customer?.phone || orderData.phone || '').replace(/\D/g, '');

  const formattedItems = (cart || []).map((item) => {
    const rawId = String(item.productId || item.id || '');
    const cleanProductId = rawId.split('-')[0] || rawId;

    return {
      productId: cleanProductId,
      name: item.name,
      weightLabel: item.weightLabel || '',
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      campaign_gift_title: item.campaign_gift_title || null
    };
  });

  const rpcParams = {
    p_code: code,
    p_customer_name: (customer?.name || orderData.name || '').trim(),
    p_phone: cleanPhone,
    p_email: customer?.email ? customer.email.trim() : (orderData.email ? orderData.email.trim() : null),
    p_address: (customer?.address || orderData.address || '').trim(),
    p_payment_method: paymentMethod || 'cod',
    p_subtotal: Number(subtotal) || 0,
    p_discount: Number(discount) || 0,
    p_final_total: Number(finalTotal) || 0,
    p_voucher_codes: voucherCode || null,
    p_payment_gift: paymentGift || null,
    p_campaign_gifts: campaignGifts || null,
    p_customer_note: (customerNote || customer?.note || orderData.note || '').trim() || null,
    p_edge_signature: edgeSignature || null,
    p_status: ORDER_STATUS.PENDING,
    p_items: formattedItems,
    p_used_previous_order_code: usedPreviousOrderCode || null
  };

  let orderCreated = false;

  // A. Thử ghi nhận bằng Transaction RPC
  try {
    const { data, error } = await supabase.rpc('create_order_atomic', rpcParams);
    if (!error && data?.success) {
      orderCreated = true;
    } else if (error) {
      console.warn('RPC create_order_atomic warning, thử fallback:', error.message);
    }
  } catch (rpcErr) {
    console.warn('RPC exception, thử fallback:', rpcErr);
  }

  // B. Fallback dự phòng: Insert trực tiếp vào bảng orders & order_items
  if (!orderCreated) {
    const { error: orderErr } = await supabase.from('orders').insert([
      {
        code: code,
        customer_name: rpcParams.p_customer_name,
        phone: rpcParams.p_phone,
        email: rpcParams.p_email,
        address: rpcParams.p_address,
        payment_method: rpcParams.p_payment_method,
        subtotal: rpcParams.p_subtotal,
        discount: rpcParams.p_discount,
        final_total: rpcParams.p_final_total,
        voucher_codes: rpcParams.p_voucher_codes,
        payment_gift: rpcParams.p_payment_gift,
        campaign_gifts: rpcParams.p_campaign_gifts,
        customer_note: rpcParams.p_customer_note,
        edge_signature: rpcParams.p_edge_signature,
        used_previous_order_code: usedPreviousOrderCode || null,
        status: ORDER_STATUS.PENDING,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]);

    if (orderErr) {
      console.error('Lỗi fallback insert orders:', orderErr);
      throw new Error(orderErr.message || 'Không thể tạo đơn hàng');
    }

    if (formattedItems.length > 0) {
      const itemsPayload = formattedItems.map((it) => ({
        order_code: code,
        product_id: it.productId,
        name: it.name,
        weight_label: it.weightLabel,
        price: it.price,
        quantity: it.quantity,
        line_total: it.price * it.quantity,
        campaign_gift_title: it.campaign_gift_title
      }));

      await supabase.from('order_items').insert(itemsPayload);
    }
  }

  // C. Tăng used_count cho các voucher hệ thống vừa được áp dụng
  if (voucherCode) {
    const codesToUpdate = String(voucherCode)
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c && !c.startsWith('XNG'));

    if (codesToUpdate.length > 0) {
      for (const vCode of codesToUpdate) {
        try {
          const { data: vRow } = await supabase
            .from('vouchers')
            .select('used_count')
            .eq('code', vCode)
            .maybeSingle();

          if (vRow) {
            await supabase
              .from('vouchers')
              .update({ used_count: (Number(vRow.used_count) || 0) + 1 })
              .eq('code', vCode);
          }
        } catch (vErr) {
          console.warn(`Không thể tăng lượt dùng cho voucher ${vCode}:`, vErr);
        }
      }
    }
  }

  return { success: true, orderCode: code };
}

/**
 * 2. KIỂM TRA & XÁC THỰC MÃ VOUCHER TRỰC TIẾP TỪ BẢNG public.vouchers & ĐƠN HÀNG CŨ
 */
export async function validateVoucherCode(code, currentCartTotal = 0, currentPhone = '', appliedList = []) {
  const cleanCode = String(code || '').trim().toUpperCase();
  if (!cleanCode) {
    return { success: false, error: 'Vui lòng nhập mã ưu đãi.' };
  }

  const isAlreadyApplied = appliedList.some((v) => {
    const c = typeof v === 'string' ? v : v.code;
    return String(c).trim().toUpperCase() === cleanCode;
  });

  if (isAlreadyApplied) {
    return { success: false, error: 'Mã ưu đãi này đã được áp dụng trong đơn hàng rồi.' };
  }

  // 1. Nếu là Mã Đơn Cũ (Bắt đầu bằng XNG...) -> Tính động theo cấu hình Loyalty
  if (cleanCode.startsWith('XNG')) {
    const verifyRes = await verifyPreviousOrderVoucher(cleanCode, currentPhone, currentCartTotal);
    if (!verifyRes.valid) {
      return { success: false, error: verifyRes.message };
    }

    return {
      success: true,
      voucher: {
        code: cleanCode,
        isPreviousOrder: true,
        canStack: true,
        percent: verifyRes.percent,
        maxDiscount: verifyRes.maxDiscount,
        discount: verifyRes.discountAmount,
        desc: `Tri ân khách quen (Giảm ${verifyRes.percent}%, tối đa ${verifyRes.maxDiscount.toLocaleString('vi-VN')}đ)`
      }
    };
  }

  // 2. Tra cứu trực tiếp từ bảng public.vouchers
  try {
    const { data: vData, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', cleanCode)
      .maybeSingle();

    if (error || !vData) {
      return { success: false, error: 'Mã voucher không tồn tại hoặc đã hết hạn.' };
    }

    const limit = Number(vData.usage_limit ?? vData.usageLimit ?? 0);
    const used = Number(vData.used_count ?? vData.usedCount ?? 0);
    if (limit > 0 && used >= limit) {
      return { success: false, error: 'Mã ưu đãi này đã hết lượt sử dụng.' };
    }

    const minOrder = Number(vData.min_order ?? vData.minOrder ?? 0);
    if (minOrder > 0 && currentCartTotal < minOrder) {
      return { 
        success: false, 
        error: `Đơn hàng tối thiểu ${minOrder.toLocaleString('vi-VN')}đ để dùng mã này.` 
      };
    }

    const canStack = vData.can_stack ?? vData.canStack ?? true;
    if (!canStack && appliedList.length > 0) {
      return { 
        success: false, 
        error: 'Mã này là ưu đãi độc quyền, không thể dùng chung với các mã khác.' 
      };
    }

    const hasExclusive = appliedList.some((v) => {
      const stackable = v.canStack ?? v.can_stack ?? true;
      return !stackable;
    });

    if (hasExclusive) {
      return {
        success: false,
        error: 'Đơn hàng đang áp dụng mã độc quyền, không thể gộp thêm mã mới.'
      };
    }

    const val = Number(vData.value) || 0;
    const maxDiscount = Number(vData.max_discount ?? vData.maxDiscount ?? 0);
    let discountAmount = 0;

    if (vData.type === 'percent') {
      discountAmount = Math.round((currentCartTotal * val) / 100);
      if (maxDiscount > 0) {
        discountAmount = Math.min(discountAmount, maxDiscount);
      }
    } else {
      discountAmount = val;
    }

    return {
      success: true,
      voucher: {
        code: cleanCode,
        type: vData.type,
        value: val,
        discount: discountAmount,
        canStack: canStack,
        desc: vData.description || (vData.type === 'percent' ? `Giảm ${val}%` : `Giảm ${val.toLocaleString('vi-VN')}đ`)
      }
    };
  } catch (err) {
    console.error('Lỗi tra cứu validateVoucherCode:', err);
    return { success: false, error: 'Không thể kết nối máy chủ để kiểm tra mã.' };
  }
}

/**
 * 3. TRA CỨU LỊCH SỬ KHÁCH HÀNG
 */
export async function fetchCustomerHistory(phone) {
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  if (cleanPhone.length < 8) return null;

  try {
    const last8Digits = cleanPhone.slice(-8);

    const { data: riskProfile } = await supabase
      .from('customer_risk_profiles')
      .select('risk_level, is_pardoned, last_bad_reason')
      .ilike('phone', `%${last8Digits}`)
      .maybeSingle();

    const { data: matchedOrders, error } = await supabase
      .from('orders')
      .select('code, customer_name, phone, address, email, payment_method, status, created_at, used_previous_order_code')
      .ilike('phone', `%${last8Digits}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!matchedOrders || matchedOrders.length === 0) {
      return {
        isOldCustomer: false,
        isPardoned: false,
        onlyHasBadHistory: false,
        orderCount: 0,
        hasBombedHistory: riskProfile?.risk_level === 'BOMBED_RISK' && !riskProfile?.is_pardoned,
        isFrequentCanceller: riskProfile?.risk_level === 'CANCELLED_RISK' && !riskProfile?.is_pardoned,
        isRiskCustomer: Boolean(riskProfile && !riskProfile.is_pardoned && riskProfile.risk_level !== 'NORMAL'),
        latestOrderCode: null,
        canUseOldCode: false,
        previousInfo: null,
        validOrders: [],
        allCombinedOrders: []
      };
    }

    const latestOrder = matchedOrders[0];
    
    const isBadStatus = (st) => {
      const norm = normalizeOrderStatus(st);
      return norm === ORDER_STATUS.CANCELLED || norm === ORDER_STATUS.BOMBED;
    };

    const validOrders = matchedOrders.filter((o) => !isBadStatus(o.status));
    const hasSuccess = validOrders.length > 0;
    const isLatestSuccess = latestOrder && !isBadStatus(latestOrder.status);
    const isPardoned = riskProfile?.is_pardoned || (isLatestSuccess && hasSuccess);

    const hasBombedHistory = (riskProfile?.risk_level === 'BOMBED_RISK' && !isPardoned) ||
      (!isPardoned && matchedOrders.some((o) => normalizeOrderStatus(o.status) === ORDER_STATUS.BOMBED));

    const hasCancelHistory = (riskProfile?.risk_level === 'CANCELLED_RISK' && !isPardoned) ||
      (!isPardoned && matchedOrders.filter((o) => normalizeOrderStatus(o.status) === ORDER_STATUS.CANCELLED).length >= 2);

    const latestSuccessOrder = hasSuccess ? validOrders[0] : null;

    return {
      isOldCustomer: hasSuccess,
      isPardoned,
      onlyHasBadHistory: !hasSuccess && (hasBombedHistory || hasCancelHistory),
      orderCount: validOrders.length,
      hasBombedHistory,
      isFrequentCanceller: hasCancelHistory,
      isRiskCustomer: hasBombedHistory || hasCancelHistory,
      latestOrderCode: latestSuccessOrder ? latestSuccessOrder.code : null,
      canUseOldCode: Boolean(latestSuccessOrder),
      validOrders,
      allCombinedOrders: matchedOrders,
      previousInfo: latestSuccessOrder ? {
        name: latestSuccessOrder.customer_name || '',
        address: latestSuccessOrder.address || '',
        email: latestSuccessOrder.email || ''
      } : null
    };
  } catch (err) {
    console.warn('Lỗi fetchCustomerHistory:', err);
    return null;
  }
}

/**
 * 4. TRA CỨU CHI TIẾT ĐƠN HÀNG
 */
export async function lookupOrderDirect(queryValue) {
  const rawVal = String(queryValue || '').trim().replace(/\s+/g, '');
  if (!rawVal) return [];

  const cleanDigits = rawVal.replace(/\D/g, '');
  const upperCode = rawVal.toUpperCase();

  const hasLetters = /[A-Z]/i.test(rawVal);
  const isPhoneSearch = !hasLetters && cleanDigits.length >= 8;

  try {
    let ordersData = null;

    if (isPhoneSearch) {
      const suffix = cleanDigits.slice(-8);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`phone.ilike."%${suffix}%",phone.ilike."%${cleanDigits}%"`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      ordersData = data;
    } else {
      let { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('code', upperCode);

      if (!error && (!data || data.length === 0)) {
        const fallbackRes = await supabase
          .from('orders')
          .select('*')
          .ilike('code', `%${upperCode}%`);
        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (error) throw error;
      ordersData = data;
    }

    if (!Array.isArray(ordersData) || ordersData.length === 0) return [];

    const orderCodes = ordersData.map((o) => o.code).filter(Boolean);
    let itemsByOrder = {};

    if (orderCodes.length > 0) {
      const { data: itemsData, error: itemsErr } = await supabase
        .from('order_items')
        .select('*')
        .in('order_code', orderCodes);

      if (!itemsErr && Array.isArray(itemsData)) {
        itemsData.forEach((it) => {
          const key = it.order_code;
          if (!itemsByOrder[key]) itemsByOrder[key] = [];
          itemsByOrder[key].push({
            id: it.id,
            productId: it.product_id,
            name: it.name || it.product_name,
            weightLabel: it.weight_label,
            price: Number(it.price) || 0,
            quantity: Number(it.quantity) || 1,
            lineTotal: Number(it.line_total) || 0,
            campaignGiftTitle: it.campaign_gift_title
          });
        });
      }
    }

    return ordersData.map((ord) => ({
      ...ord,
      status: normalizeOrderStatus(ord.status),
      order_items: itemsByOrder[ord.code] || ord.cart || []
    }));
  } catch (err) {
    console.error('Lỗi thực thi lookupOrderDirect:', err);
    throw err;
  }
}

/**
 * 5. HỦY ĐƠN HÀNG (Khách tự hủy trong cửa sổ 30 phút đầu)
 */
export async function cancelOrderDirect(orderCode, cancelReason) {
  const { data: ord, error: fetchErr } = await supabase
    .from('orders')
    .select('code, status, created_at')
    .eq('code', orderCode)
    .single();

  if (fetchErr || !ord) {
    throw new Error('Không tìm thấy đơn hàng cần hủy.');
  }

  const orderTimeMs = parseOrderTimestampToMs(ord.created_at);
  const elapsedMs = Date.now() - orderTimeMs;
  const thirtyMinutesMs = 30 * 60 * 1000;

  if (orderTimeMs > 0 && elapsedMs > thirtyMinutesMs) {
    throw new Error('Đã quá thời gian 30 phút đổi ý. Đơn hàng đã được chốt đóng thùng.');
  }

  const { data, error } = await supabase
    .from('orders')
    .update({
      status: ORDER_STATUS.CANCELLED,
      cancel_reason: cancelReason || 'Khách đổi ý hủy đơn',
      updated_at: new Date().toISOString()
    })
    .eq('code', orderCode)
    .select()
    .single();

  if (error) {
    console.error('Lỗi cancelOrderDirect:', error);
    throw error;
  }

  return {
    ...data,
    status: normalizeOrderStatus(data.status)
  };
}

/**
 * 6. TẢI ĐƠN HÀNG ĐANG VẬN HÀNH
 */
export async function fetchActiveProcessingOrders() {
  try {
    const activeStatuses = [
      ORDER_STATUS.PENDING,
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.PACKING,
      ORDER_STATUS.SHIPPING,
      ORDER_STATUS.COMPLETED,
      'Chờ xác nhận',
      'Đã xác nhận',
      'Đang đóng gói',
      'Đang giao',
      'Đang giao xe',
      'Hoàn thành'
    ];

    const { data: ordersData, error: ordersErr } = await supabase
      .from('orders')
      .select('*')
      .in('status', activeStatuses)
      .order('created_at', { ascending: false });

    if (ordersErr) {
      console.warn('Lỗi Supabase khi tải orders:', ordersErr.message || ordersErr);
      const cached = localStorage.getItem('shop_orders');
      return cached ? JSON.parse(cached) : [];
    }

    if (!Array.isArray(ordersData) || ordersData.length === 0) {
      return [];
    }

    const orderCodes = ordersData.map((o) => o.code).filter(Boolean);
    let itemsByOrder = {};

    if (orderCodes.length > 0) {
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .in('order_code', orderCodes);

      if (Array.isArray(itemsData)) {
        itemsData.forEach((it) => {
          const key = it.order_code;
          if (!itemsByOrder[key]) itemsByOrder[key] = [];
          itemsByOrder[key].push({
            id: it.id,
            productId: it.product_id,
            name: it.name || it.product_name,
            weightLabel: it.weight_label,
            price: Number(it.price) || 0,
            quantity: Number(it.quantity) || 1,
            lineTotal: Number(it.line_total) || 0,
            campaignGiftTitle: it.campaign_gift_title
          });
        });
      }
    }

    return ordersData.map((ord) => {
      const cCode = ord.code || ord.order_code || ord.id;
      const itemsList = itemsByOrder[cCode] || ord.cart || [];

      return {
        ...ord,
        code: cCode,
        orderId: cCode,
        customer_name: ord.customer_name || ord.name || ord.customer?.name || 'Khách hàng',
        name: ord.customer_name || ord.name || ord.customer?.name || 'Khách hàng',
        phone: ord.phone || ord.customer?.phone || '',
        total: ord.final_total ?? ord.total ?? 0,
        final_total: ord.final_total ?? ord.total ?? 0,
        paymentMethod: ord.payment_method || ord.paymentMethod || 'deposit',
        payment_method: ord.payment_method || ord.paymentMethod || 'deposit',
        createdAt: ord.created_at || ord.createdAt || new Date().toISOString(),
        status: normalizeOrderStatus(ord.status),
        cart: itemsList,
        order_items: itemsList
      };
    });
  } catch (err) {
    console.warn('Lỗi kết nối fetchActiveProcessingOrders:', err);
    try {
      const cached = localStorage.getItem('shop_orders');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }
}

/**
 * 7. GỬI ĐÁNH GIÁ ĐƠN HÀNG KÈM XÁC THỰC MÃ ĐƠN
 */
export async function submitOrderReview({ 
  orderCode, 
  phone, 
  customerName, 
  rating, 
  content, 
  productTags = '', 
  imageUrls = [] 
}) {
  try {
    const cleanCode = String(orderCode || '').trim().toUpperCase();
    const cleanPhone = String(phone || '').trim();

    const { data: existingOrder, error: orderErr } = await supabase
      .from('orders')
      .select('code, phone, status')
      .eq('code', cleanCode)
      .maybeSingle();

    if (orderErr || !existingOrder) {
      return { success: false, error: 'Không tìm thấy mã đơn hàng này trên hệ thống.' };
    }

    const currentStatusCode = normalizeOrderStatus(existingOrder.status);
    if (currentStatusCode !== ORDER_STATUS.COMPLETED) {
      return { 
        success: false, 
        error: 'Đơn hàng này chưa hoàn tất giao nhận. Bạn chỉ có thể đánh giá sau khi đã nhận kiện hàng.' 
      };
    }

    const ratingNum = Number(rating) || 5;
    const { data, error: insertErr } = await supabase
      .from('reviews')
      .insert([
        {
          order_code: cleanCode,
          customer_name: customerName.trim(),
          customer_phone: cleanPhone,
          rating: ratingNum,
          content: content.trim(),
          product_tags: productTags || '',
          image_urls: Array.isArray(imageUrls) ? imageUrls : [],
          is_approved: true
        }
      ])
      .select()
      .single();

    if (insertErr) {
      if (insertErr.code === '23505') {
        return { success: false, error: 'Đơn hàng này đã được gửi đánh giá trước đó rồi.' };
      }
      return { success: false, error: insertErr.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Lỗi khi gửi review:', err);
    return { success: false, error: 'Không thể kết nối máy chủ, vui lòng thử lại sau.' };
  }
}

/**
 * 8. TẢI TOÀN BỘ REVIEWS CHO ADMIN DASHBOARD
 */
export async function fetchAllReviewsForAdmin() {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Lỗi query fetchAllReviewsForAdmin:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Lỗi kết nối fetchAllReviewsForAdmin:', err);
    return [];
  }
}

/**
 * 9. CẬP NHẬT TRẠNG THÁI DUYỆT / ẨN REVIEW
 */
export async function toggleReviewApproval(reviewId, currentStatus) {
  try {
    const nextStatus = !currentStatus;
    const { error } = await supabase
      .from('reviews')
      .update({ is_approved: nextStatus })
      .eq('id', reviewId);

    if (error) throw error;
    return { success: true, is_approved: nextStatus };
  } catch (err) {
    console.error('Lỗi toggleReviewApproval:', err);
    return { success: false, error: err.message };
  }
}

/**
 * 10. XÓA REVIEW THEO ID
 */
export async function deleteReviewById(reviewId) {
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Lỗi deleteReviewById:', err);
    return { success: false, error: err.message };
  }
}

/**
 * 11. LẤY REVIEWS ĐÃ DUYỆT HIỂN THỊ TRANG CHỦ
 */
export async function fetchApprovedReviews(limit = 6) {
  try {
    const { data, error } = await supabase
      .from('reviews')
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

/**
 * 12. ĐẾM SỐ ĐƠN THỰC TẾ
 */
export async function fetchTotalOrdersCount() {
  try {
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  } catch (err) {
    console.error('Lỗi đếm số lượng đơn hàng:', err);
    return 0;
  }
}

/**
 * 13. XÁC THỰC MÃ ĐƠN CŨ LÀM VOUCHER TRI ÂN (TÍNH ĐỘNG THEO CẤU HÌNH LOYALTY)
 */
export async function verifyPreviousOrderVoucher(rawCode, currentPhone, currentCartTotal = 0) {
  const cleanCode = String(rawCode || '').trim().toUpperCase();
  const cleanPhone = String(currentPhone || '').replace(/\D/g, '');

  if (!cleanCode.startsWith('XNG') && cleanCode.length < 6) {
    return { valid: false, message: 'Mã đơn hàng không hợp lệ.' };
  }

  try {
    // A. Kiểm tra đơn hàng cũ
    const { data: oldOrder, error: orderErr } = await supabase
      .from('orders')
      .select('code, phone, status')
      .eq('code', cleanCode)
      .maybeSingle();

    if (orderErr || !oldOrder) {
      return { valid: false, message: 'Không tìm thấy mã đơn hàng này trên hệ thống.' };
    }

    const oldPhone = String(oldOrder.phone || '').replace(/\D/g, '');
    if (cleanPhone && oldPhone && !oldPhone.endsWith(cleanPhone.slice(-8))) {
      return { valid: false, message: 'Mã đơn này không thuộc về số điện thoại đặt hàng hiện tại.' };
    }

    if (normalizeOrderStatus(oldOrder.status) !== ORDER_STATUS.COMPLETED) {
      return { valid: false, message: 'Đơn hàng này chưa hoàn tất giao nhận nên chưa thể dùng làm mã ưu đãi.' };
    }

    // B. Kiểm tra xem mã đã từng được dùng ở đơn nào khác chưa
    const { data: alreadyUsed, error: usedErr } = await supabase
      .from('orders')
      .select('code, status')
      .eq('used_previous_order_code', cleanCode)
      .limit(5);

    if (!usedErr && Array.isArray(alreadyUsed)) {
      const activeUsed = alreadyUsed.filter((o) => {
        const norm = normalizeOrderStatus(o.status);
        return norm !== ORDER_STATUS.CANCELLED && norm !== ORDER_STATUS.BOMBED;
      });

      if (activeUsed.length > 0) {
        return { 
          valid: false, 
          message: `Mã đơn ${cleanCode} đã được dùng cho đơn hàng ${activeUsed[0].code} trước đó rồi. Mỗi đơn chỉ áp dụng 1 lần!` 
        };
      }
    }

    // C. Đơn cũ phải được đánh giá từ 4 sao trở lên
    const { data: reviewData, error: revErr } = await supabase
      .from('reviews')
      .select('rating, is_approved')
      .eq('order_code', cleanCode)
      .maybeSingle();

    if (revErr || !reviewData) {
      return { 
        valid: false, 
        needReview: true, 
        message: 'Bạn chưa đánh giá đơn hàng này. Vui lòng gửi đánh giá từ 4★ trở lên để kích hoạt mã giảm giá nhé!' 
      };
    }

    const ratingNum = Number(reviewData.rating) || 0;
    if (ratingNum < 4) {
      return { 
        valid: false, 
        message: `Đơn hàng này được đánh giá ${ratingNum}★. Ưu đãi tri ân chỉ áp dụng cho đơn được đánh giá từ 4★ trở lên.` 
      };
    }

    // D. ĐỌC CẤU HÌNH LOYALTY TỪ BẢNG shop_configs
    const { data: loyaltyRow } = await supabase
      .from('shop_configs')
      .select('value')
      .eq('key', 'loyalty')
      .maybeSingle();

    let loyaltyCfg = loyaltyRow?.value || {};
    if (typeof loyaltyCfg === 'string') {
      try { loyaltyCfg = JSON.parse(loyaltyCfg); } catch {}
    }

    const percent = Number(loyaltyCfg.percent ?? 10);
    const maxDiscount = Number(loyaltyCfg.maxDiscount ?? 50000);

    // Tính chiết khấu theo % giỏ hàng hiện tại, trần maxDiscount
    let calculatedDiscount = Math.round((Number(currentCartTotal || 0) * percent) / 100);
    if (maxDiscount > 0) {
      calculatedDiscount = Math.min(calculatedDiscount, maxDiscount);
    }

    return { 
      valid: true, 
      discountAmount: calculatedDiscount, 
      code: cleanCode, 
      percent,
      maxDiscount,
      message: `Áp dụng thành công ưu đãi tri ân khách quen (-${calculatedDiscount.toLocaleString('vi-VN')}đ)` 
    };

  } catch (err) {
    console.error('Lỗi xác thực voucher đơn cũ:', err);
    return { valid: false, message: 'Lỗi kết nối kiểm tra mã đơn, vui lòng thử lại.' };
  }
}

/**
 * 14. KIỂM TRA ĐƠN HÀNG ĐÃ CÓ ĐÁNH GIÁ >= 4 SAO HAY CHƯA
 */
export async function checkOrderReviewStatus(orderCode) {
  if (!orderCode) return { isEligible: false, rating: 0 };
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating, is_approved')
      .eq('order_code', String(orderCode).trim().toUpperCase())
      .maybeSingle();

    if (error || !data) return { isEligible: false, rating: 0 };

    const ratingNum = Number(data.rating) || 0;
    return {
      isEligible: ratingNum >= 4,
      rating: ratingNum
    };
  } catch (err) {
    console.error('Lỗi checkOrderReviewStatus:', err);
    return { isEligible: false, rating: 0 };
  }
}

/**
 * 15. QUÉT TÌM ĐƠN CŨ ĐỦ ĐIỀU KIỆN LÀM VOUCHER TRI ÂN
 */
export async function findEligiblePreviousOrderVoucher(validOrders = [], combinedOrders = []) {
  if (!Array.isArray(validOrders) || validOrders.length === 0) return null;

  const usedCodesSet = new Set();
  combinedOrders.forEach((o) => {
    const usedCode = o.used_previous_order_code || o.usedPreviousOrderCode;
    const st = normalizeOrderStatus(o.status);
    if (usedCode && st !== ORDER_STATUS.CANCELLED && st !== ORDER_STATUS.BOMBED) {
      usedCodesSet.add(String(usedCode).trim().toUpperCase());
    }
  });

  const candidateOrders = validOrders.filter((ord) => {
    const code = String(ord.code || ord.orderId || '').trim().toUpperCase();
    const isCompleted = normalizeOrderStatus(ord.status) === ORDER_STATUS.COMPLETED;
    return isCompleted && !usedCodesSet.has(code);
  });

  if (candidateOrders.length === 0) return null;

  const candidateCodes = candidateOrders.map((o) => String(o.code || o.orderId).trim().toUpperCase());

  try {
    const { data: dbUsedOrders, error: usedOrdersError } = await supabase
      .from('orders')
      .select('used_previous_order_code, status')
      .in('used_previous_order_code', candidateCodes);

    if (!usedOrdersError && Array.isArray(dbUsedOrders)) {
      dbUsedOrders.forEach((row) => {
        const st = normalizeOrderStatus(row.status);
        if (row.used_previous_order_code && st !== ORDER_STATUS.CANCELLED && st !== ORDER_STATUS.BOMBED) {
          usedCodesSet.add(String(row.used_previous_order_code).trim().toUpperCase());
        }
      });
    }

    const strictlyUnusedOrders = candidateOrders.filter((ord) => {
      const code = String(ord.code || ord.orderId || '').trim().toUpperCase();
      return !usedCodesSet.has(code);
    });

    if (strictlyUnusedOrders.length === 0) return null;

    const strictlyUnusedCodes = strictlyUnusedOrders.map((o) => String(o.code || o.orderId).trim().toUpperCase());

    const { data: reviews, error: reviewError } = await supabase
      .from('reviews')
      .select('order_code, rating')
      .in('order_code', strictlyUnusedCodes);

    if (reviewError || !Array.isArray(reviews)) return null;

    const reviewMap = new Map();
    reviews.forEach((r) => {
      reviewMap.set(String(r.order_code).trim().toUpperCase(), Number(r.rating) || 0);
    });

    for (const ord of strictlyUnusedOrders) {
      const code = String(ord.code || ord.orderId).trim().toUpperCase();
      const rating = reviewMap.get(code) || 0;
      if (rating >= 4) {
        return {
          order: ord,
          code,
          rating
        };
      }
    }
  } catch (err) {
    console.error('Lỗi findEligiblePreviousOrderVoucher:', err);
  }

  return null;
}

/**
 * 16. KIỂM TRA RỦI RO BOM ĐƠN / HỦY ĐƠN CỦA SỐ ĐIỆN THOẠI
 */
export async function checkCustomerOrderRisk(phone) {
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  if (cleanPhone.length < 9) {
    return { lastOrderBombed: false, twoRecentCancelled: false, totalOrders: 0 };
  }

  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('code, status, created_at')
      .eq('phone', cleanPhone)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    if (!Array.isArray(orders) || orders.length === 0) {
      return { lastOrderBombed: false, twoRecentCancelled: false, totalOrders: 0 };
    }

    const normalizedOrders = orders.map((o) => ({
      ...o,
      status: normalizeOrderStatus(o.status),
    }));

    const lastOrder = normalizedOrders[0];
    const lastOrderBombed = lastOrder?.status === ORDER_STATUS.BOMBED;

    const twoRecentCancelled =
      normalizedOrders.length >= 2 &&
      normalizedOrders[0]?.status === ORDER_STATUS.CANCELLED &&
      normalizedOrders[1]?.status === ORDER_STATUS.CANCELLED;

    return {
      lastOrderBombed,
      twoRecentCancelled,
      totalOrders: normalizedOrders.length,
    };
  } catch (err) {
    console.warn('Lỗi tra cứu rủi ro khách hàng:', err);
    return { lastOrderBombed: false, twoRecentCancelled: false, totalOrders: 0 };
  }
}

/**
 * LẤY DANH SÁCH REVIEW ĐÃ DUYỆT PHÂN TRANG (ƯU TIÊN RATING CAO & MỚI NHẤT)
 */
export async function fetchPaginatedApprovedReviews(page = 0, pageSize = 6) {
  try {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await supabase
      .from('reviews')
      .select('*', { count: 'exact' })
      .eq('is_approved', true)
      .order('rating', { ascending: false })     // Ưu tiên 5 sao trước
      .order('created_at', { ascending: false }) // Ưu tiên mới nhất
      .range(from, to);

    if (error) throw error;

    return {
      reviews: data || [],
      totalCount: count || 0,
      hasMore: (count || 0) > to + 1
    };
  } catch (err) {
    console.warn('Lỗi fetchPaginatedApprovedReviews:', err);
    return { reviews: [], totalCount: 0, hasMore: false };
  }
}

/**
 * Kiểm tra mã đơn cũ dùng làm voucher:
 * 1. Phải khớp chính xác SĐT của người đặt đơn cũ (tránh share chéo mã).
 * 2. Đơn cũ phải có đánh giá hợp lệ (bảng reviews).
 * 3. Chưa từng được sử dụng thành công (đơn completed).
 * 4. Không đang bị treo ở các đơn đang xử lý (pending, confirmed, packing, shipping).
 */
export async function verifyReviewVoucher(voucherCodeInput, inputPhone = '') {
  const cleanCode = String(voucherCodeInput || '').trim().toUpperCase();
  const cleanPhone = String(inputPhone || '').replace(/\D/g, '').slice(-9); // Chuẩn hóa 9 số cuối

  if (!cleanCode) {
    return { valid: false, message: 'Vui lòng nhập mã đơn cũ để nhận ưu đãi!' };
  }

  if (!cleanPhone || cleanPhone.length < 8) {
    return { valid: false, message: 'Vui lòng điền Số điện thoại trước khi áp dụng mã giảm giá!' };
  }

  try {
    // BƯỚC 1: Truy vấn đơn hàng gốc để kiểm tra số điện thoại chính chủ
    const { data: originalOrder, error: orderErr } = await supabase
      .from('orders')
      .select('code, phone, status')
      .eq('code', cleanCode)
      .maybeSingle();

    if (orderErr || !originalOrder) {
      return { 
        valid: false, 
        message: `Mã đơn #${cleanCode} không tồn tại trên hệ thống!` 
      };
    }

    const originalPhoneClean = String(originalOrder.phone || '').replace(/\D/g, '').slice(-9);
    if (originalPhoneClean !== cleanPhone) {
      return {
        valid: false,
        message: `Mã #${cleanCode} chỉ áp dụng cho chính chủ SĐT đặt đơn này, không thể dùng cho số khác!`
      };
    }

    // BƯỚC 2: Kiểm tra đơn cũ đã có đánh giá được duyệt hay chưa
    const { data: reviewData } = await supabase
      .from('reviews')
      .select('id, order_code, is_approved')
      .eq('order_code', cleanCode)
      .eq('is_approved', true)
      .maybeSingle();

    if (!reviewData) {
      return { 
        valid: false, 
        message: `Đơn hàng #${cleanCode} chưa gửi đánh giá cảm nhận hoặc đánh giá chưa được duyệt!` 
      };
    }

    // BƯỚC 3: Kiểm tra xem mã này đã dùng hoặc đang bị treo ở đơn khác chưa
    const { data: existingUsage } = await supabase
      .from('orders')
      .select('code, status')
      .or(`used_previous_order_code.eq.${cleanCode},voucher_code.eq.${cleanCode}`);

    if (Array.isArray(existingUsage) && existingUsage.length > 0) {
      const activeLockOrder = existingUsage.find((ord) => {
        const st = normalizeOrderStatus(ord.status);
        return [
          ORDER_STATUS.PENDING,
          ORDER_STATUS.CONFIRMED,
          ORDER_STATUS.PACKING,
          ORDER_STATUS.SHIPPING,
          ORDER_STATUS.COMPLETED
        ].includes(st);
      });

      if (activeLockOrder) {
        const lockStatus = normalizeOrderStatus(activeLockOrder.status);
        if (lockStatus === ORDER_STATUS.COMPLETED) {
          return {
            valid: false,
            message: `Mã #${cleanCode} đã được dùng cho đơn #${activeLockOrder.code} trước đó!`
          };
        } else {
          return {
            valid: false,
            message: `Mã #${cleanCode} đang được giữ ở đơn #${activeLockOrder.code} (đang chờ duyệt/giao)!`
          };
        }
      }
    }

    // Hợp lệ: Giảm 10% tối đa 50k (hoặc theo shopConfig)
    return {
      valid: true,
      code: cleanCode,
      discountPercent: 10,
      maxDiscount: 50000,
      message: `Áp dụng thành công ưu đãi 10% từ đơn cũ #${cleanCode}!`
    };

  } catch (err) {
    console.error('Lỗi kiểm tra voucher:', err);
    return { valid: false, message: 'Lỗi đối soát voucher, vui lòng thử lại sau.' };
  }
}