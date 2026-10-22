// src/services/orderService.js
import { supabase } from '../supabaseClient';

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
      // Chuẩn hóa productId: nếu dạng 'prd01-opt-1' -> bóc lấy 'prd01'
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

    // 1. Kiểm tra hồ sơ rủi ro chuyên biệt
    const { data: riskProfile } = await supabase
      .from('customer_risk_profiles')
      .select('risk_level, is_pardoned, last_bad_reason')
      .ilike('phone', `%${last8Digits}`)
      .maybeSingle();

    // 2. Tra cứu lịch sử đơn hàng
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
 * Hỗ trợ tìm kiếm theo Số điện thoại (8 số đuôi) hoặc Mã đơn hàng (không phân biệt hoa thường)
 */
export async function lookupOrderDirect(queryValue) {
  const rawVal = String(queryValue || '').trim();
  if (!rawVal) return [];

  const cleanDigits = rawVal.replace(/\D/g, '');
  const isPhoneSearch = cleanDigits.length >= 8;
  const upperCode = rawVal.toUpperCase();

  try {
    let query = supabase
      .from('orders')
      .select(`
        id,
        code,
        customer_name,
        phone,
        email,
        address,
        payment_method,
        subtotal,
        discount,
        final_total,
        voucher_codes,
        payment_gift,
        campaign_gifts,
        customer_note,
        cancel_reason,
        status,
        created_at,
        order_items (
          id,
          order_code,
          product_id,
          name,
          weight_label,
          price,
          quantity,
          line_total,
          campaign_gift_title
        )
      `);

    if (isPhoneSearch) {
      const suffix = cleanDigits.slice(-8);
      query = query.or(`phone.ilike.%${suffix}%,phone.ilike.%${cleanDigits}%`);
    } else {
      query = query.or(`code.eq.${upperCode},code.ilike.%${upperCode}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.warn('Lỗi query kèm order_items, fallback truy vấn orders lẻ:', error.message);
      
      let fallbackQuery = supabase.from('orders').select('*');
      if (isPhoneSearch) {
        fallbackQuery = fallbackQuery.ilike('phone', `%${cleanDigits.slice(-8)}%`);
      } else {
        fallbackQuery = fallbackQuery.or(`code.eq.${upperCode},code.ilike.%${upperCode}%`);
      }

      const { data: fallbackData, error: fbErr } = await fallbackQuery.order('created_at', { ascending: false });
      if (fbErr) throw fbErr;
      return fallbackData || [];
    }

    return data || [];
  } catch (err) {
    console.error('Lỗi thực thi lookupOrderDirect:', err);
    throw err;
  }
}

/**
 * 4. HỦY ĐƠN HÀNG (Khách tự hủy trong cửa sổ 30 phút đầu)
 */
export async function cancelOrderDirect(orderCode, cancelReason) {
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
 * 5. TẢI ĐƠN HÀNG ĐANG VẬN HÀNH (Ăn thẳng Partial Index idx_orders_active_processing)
 * Dùng cho màn hình Admin Dashboard và màn hình Packing đóng gói
 */
export async function fetchActiveProcessingOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      code,
      customer_name,
      phone,
      email,
      address,
      payment_method,
      subtotal,
      discount,
      final_total,
      payment_gift,
      campaign_gifts,
      customer_note,
      cancel_reason,
      status,
      created_at,
      order_items (
        id,
        order_code,
        product_id,
        name,
        weight_label,
        price,
        quantity,
        line_total,
        campaign_gift_title
      )
    `)
    .in('status', ['Chờ xác nhận', 'Đã xác nhận', 'Đang đóng gói', 'Đang giao'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Lỗi fetchActiveProcessingOrders:', error);
    throw error;
  }

  return data || [];
}