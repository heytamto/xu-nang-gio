// src/services/orderService.js
import { supabase } from '../supabaseClient';
import { parseOrderTimestampToMs } from '../utils/dateUtils';

/**
 * 1. TẠO ĐƠN HÀNG NGUYÊN TỬ VÀO POSTGRESQL (GỌI RPC create_order_atomic)
 * Ghi đồng thời vào cả 2 bảng: orders và order_items trong 1 Transaction duy nhất
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
    customerNote
  } = orderData;

  const code = orderData.code || `XNG${Date.now().toString().slice(-6)}`;
  const cleanPhone = String(customer?.phone || orderData.phone || '').replace(/\D/g, '');

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
    p_items: (cart || []).map((item) => {
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
    })
  };

  const { data, error } = await supabase.rpc('create_order_atomic', rpcParams);

  if (error) {
    console.error('Lỗi Supabase RPC create_order_atomic:', error);
    throw new Error(error.message || 'Không thể tạo đơn hàng');
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Tạo đơn hàng thất bại');
  }

  return { success: true, orderCode: code };
}

/**
 * 2. TRA CỨU LỊCH SỬ KHÁCH HÀNG (Nhận diện khách quen & phát hiện rủi ro bom đơn)
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
      .select('code, customer_name, phone, address, email, payment_method, status, created_at')
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
        previousInfo: null
      };
    }

    const latestOrder = matchedOrders[0];
    const isBadStatus = (st) => {
      const s = String(st || '').toLowerCase();
      return s.includes('hủy') || s.includes('cancel') || s.includes('bom');
    };

    const validOrders = matchedOrders.filter((o) => !isBadStatus(o.status));
    const hasSuccess = validOrders.length > 0;
    const isLatestSuccess = latestOrder && !isBadStatus(latestOrder.status);
    const isPardoned = riskProfile?.is_pardoned || (isLatestSuccess && hasSuccess);

    const hasBombedHistory = (riskProfile?.risk_level === 'BOMBED_RISK' && !isPardoned) ||
      (!isPardoned && matchedOrders.some((o) => String(o.status || '').toLowerCase().includes('bom')));

    const hasCancelHistory = (riskProfile?.risk_level === 'CANCELLED_RISK' && !isPardoned) ||
      (!isPardoned && matchedOrders.filter((o) => String(o.status || '').toLowerCase().includes('hủy')).length >= 2);

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
 * 3. TRA CỨU CHI TIẾT ĐƠN HÀNG (OrderLookupModal)
 * Tách độc lập 2 query orders & order_items để triệt tiêu lỗi PGRST201
 */
export async function lookupOrderDirect(queryValue) {
  const rawVal = String(queryValue || '').trim().replace(/\s+/g, '');
  if (!rawVal) return [];

  const cleanDigits = rawVal.replace(/\D/g, '');
  const upperCode = rawVal.toUpperCase();

  // CHUẨN ĐOÁN CHÍNH XÁC:
  // Chỉ coi là tìm số điện thoại nếu:
  // 1. Không chứa tiền tố 'XNG'
  // 2. Không chứa ký tự chữ cái alphabet
  // 3. Có ít nhất 8 chữ số
  const hasLetters = /[A-Z]/i.test(rawVal);
  const isPhoneSearch = !hasLetters && cleanDigits.length >= 8;

  try {
    let ordersData = null;

    if (isPhoneSearch) {
      // Nhánh tìm theo SỐ ĐIỆN THOẠI
      const suffix = cleanDigits.slice(-8);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`phone.ilike."%${suffix}%",phone.ilike."%${cleanDigits}%"`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      ordersData = data;
    } else {
      // Nhánh tìm theo MÃ ĐƠN HÀNG (VD: XNG261022-X31G)
      let { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('code', upperCode);

      // Nếu không khớp tuyệt đối, tìm gần đúng
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

    // Lấy items cho các đơn tìm được
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
      order_items: itemsByOrder[ord.code] || ord.cart || []
    }));
  } catch (err) {
    console.error('Lỗi thực thi lookupOrderDirect:', err);
    throw err;
  }
}

/**
 * 4. HỦY ĐƠN HÀNG (Khách tự hủy trong cửa sổ 30 phút đầu)
 * Kiểm tra chặt thời gian created_at trước khi cập nhật
 */
export async function cancelOrderDirect(orderCode, cancelReason) {
  // 1. Kiểm tra đơn và thời gian tạo đơn
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

  // 2. Cập nhật trạng thái
  const { data, error } = await supabase
    .from('orders')
    .update({
      status: 'Đã hủy',
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

  return data;
}

/**
 * 5. TẢI ĐƠN HÀNG ĐANG VẬN HÀNH (KHẮC PHỤC TRIỆT ĐỂ LỖI PGRST201)
 */
export async function fetchActiveProcessingOrders() {
  try {
    const { data: ordersData, error: ordersErr } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['Chờ xác nhận', 'Đã xác nhận', 'Đang đóng gói', 'Đang giao', 'Đang giao xe', 'Đã nhận hàng'])
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
 * 6. GỬI ĐÁNH GIÁ ĐƠN HÀNG KÈM XÁC THỰC MÃ ĐƠN
 */
export async function submitOrderReview({ orderCode, phone, customerName, rating, content, productTags }) {
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

    const currentStatus = String(existingOrder.status || '').toLowerCase();
    const isCompleted = currentStatus.includes('đã nhận hàng') || currentStatus.includes('completed') || currentStatus.includes('hoàn tất');
    
    if (!isCompleted) {
      return { 
        success: false, 
        error: 'Đơn hàng này chưa hoàn tất giao nhận. Hệ thống chỉ mở tính năng đánh giá sau khi bạn đã nhận được nông sản từ nhà xe.' 
      };
    }

    const orderPhone = String(existingOrder.phone || '').trim();
    if (orderPhone && cleanPhone && !orderPhone.endsWith(cleanPhone.slice(-4))) {
      return { success: false, error: 'Số điện thoại không khớp với thông tin đặt đơn.' };
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

    let rewardedVoucher = null;
    if (ratingNum === 5) {
      rewardedVoucher = {
        code: `XNG5_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        value: 15000,
        type: 'fixed',
        desc: 'Mã tri ân đánh giá 5 sao'
      };
    }

    return { success: true, data, rewardedVoucher };
  } catch (err) {
    console.error('Lỗi khi gửi review:', err);
    return { success: false, error: 'Không thể kết nối máy chủ, vui lòng thử lại sau.' };
  }
}

/**
 * 7. TẢI TOÀN BỘ REVIEWS CHO ADMIN DASHBOARD
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
 * 8. CẬP NHẬT TRẠNG THÁI DUYỆT / ẨN REVIEW
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
 * 9. XÓA REVIEW THEO ID
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
 * 10. LẤY REVIEWS ĐÃ DUYỆT HIỂN THỊ TRANG CHỦ
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
 * 11. ĐẾM SỐ ĐƠN THỰC TẾ
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