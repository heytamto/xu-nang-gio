// src/services/orderService.js
import { 
  orderRepo, 
  orderItemRepo, 
  voucherRepo, 
  reviewRepo, 
  shopConfigRepo,
  customerRiskRepo 
} from '../repositories';
import { supabase } from '../supabaseClient';
import { parseOrderTimestampToMs } from '../utils/dateUtils';
import { generatePrefixedDateId } from '../utils/idGenerator';
import { 
  ORDER_STATUS, 
  normalizeOrderStatus 
} from '../constants/orderStatus';

/**
 * 1. TẠO ĐƠN HÀNG NGUYÊN TỬ VÀO POSTGRESQL (GỌI QUA ORDER REPOSITORY)
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

  // Tự sinh mã đơn dạng 1 gạch nối: XNG261026-9812 nếu chưa có
  const finalOrderCode = orderData.code || orderData.orderCode || generatePrefixedDateId('XNG');

  const orderPayload = {
    code: finalOrderCode,
    customer_name: (customer?.name || orderData.name || '').trim(),
    phone: cleanPhone,
    email: customer?.email ? customer.email.trim() : (orderData.email ? orderData.email.trim() : null),
    address: (customer?.address || orderData.address || '').trim(),
    payment_method: paymentMethod || 'cod',
    subtotal: Number(subtotal) || 0,
    discount: Number(discount) || 0,
    final_total: Number(finalTotal) || 0,
    voucher_codes: voucherCode || null,
    payment_gift: paymentGift || null,
    campaign_gifts: campaignGifts || null,
    customer_note: (customerNote || customer?.note || orderData.note || '').trim() || null,
    edge_signature: edgeSignature || null,
    used_previous_order_code: usedPreviousOrderCode || null,
    status: ORDER_STATUS.PENDING
  };

  let createdOrder;
  try {
    createdOrder = await orderRepo.create(orderPayload);
  } catch (err) {
    console.error('Lỗi tạo đơn hàng qua Repository:', err);
    throw new Error(err.message || 'Không thể tạo đơn hàng');
  }

  const generatedCode = createdOrder?.code || finalOrderCode;

  // Ghi nhận các sản phẩm trong đơn hàng
  if (formattedItems.length > 0) {
    const itemsPayload = formattedItems.map((it) => ({
      order_code: generatedCode,
      product_id: it.productId,
      name: it.name,
      weight_label: it.weightLabel,
      price: it.price,
      quantity: it.quantity,
      line_total: it.price * it.quantity,
      campaign_gift_title: it.campaign_gift_title
    }));

    try {
      if (typeof orderItemRepo.createMany === 'function') {
        await orderItemRepo.createMany(itemsPayload);
      } else {
        await supabase.from('order_items').insert(itemsPayload);
      }
    } catch (itemErr) {
      console.warn('Lỗi lưu order_items:', itemErr);
    }
  }

  // Tăng used_count cho các voucher hệ thống vừa được áp dụng
  if (voucherCode) {
    const codesToUpdate = String(voucherCode)
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c && !c.startsWith('XNG'));

    if (codesToUpdate.length > 0) {
      for (const vCode of codesToUpdate) {
        try {
          const vouchersList = await voucherRepo.getAll();
          const vRow = vouchersList.find((v) => String(v.code).toUpperCase() === vCode);

          if (vRow) {
            await voucherRepo.update(vCode, { 
              used_count: (Number(vRow.used_count) || 0) + 1 
            }, 'code');
          }
        } catch (vErr) {
          console.warn(`Không thể tăng lượt dùng cho voucher ${vCode}:`, vErr);
        }
      }
    }
  }

  return { success: true, orderCode: generatedCode };
}

/**
 * 2. KIỂM TRA & XÁC THỰC MÃ VOUCHER TRỰC TIẾP TỪ BẢNG VOUCHERS & ĐƠN HÀNG CŨ
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

  try {
    const vouchersList = await voucherRepo.getAll();
    const vData = vouchersList.find((v) => String(v.code).toUpperCase() === cleanCode);

    if (!vData) {
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
 * 3. TRA CỨU LỊCH SỬ KHÁCH HÀNG QUA REPOSITORIES
 */
export async function fetchCustomerHistory(phone) {
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  if (cleanPhone.length < 8) return null;

  try {
    const last8Digits = cleanPhone.slice(-8);

    const riskProfiles = await customerRiskRepo.getAll();
    const riskProfile = riskProfiles.find((rp) => rp.phone && rp.phone.slice(-8) === last8Digits);

    const allOrders = await orderRepo.getAll();
    const matchedOrders = allOrders.filter((o) => o.phone && o.phone.replace(/\D/g, '').slice(-8) === last8Digits);

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
    const allOrders = await orderRepo.getAll();
    let ordersData = [];

    if (isPhoneSearch) {
      const suffix = cleanDigits.slice(-8);
      ordersData = allOrders.filter((o) => o.phone && o.phone.replace(/\D/g, '').includes(suffix));
    } else {
      ordersData = allOrders.filter((o) => o.code && o.code.toUpperCase().includes(upperCode));
    }

    if (!Array.isArray(ordersData) || ordersData.length === 0) return [];

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
 * 5. HỦY ĐƠN HÀNG (Gọi qua orderRepo)
 */
export async function cancelOrderDirect(orderCode, cancelReason) {
  const allOrders = await orderRepo.getAll();
  const ord = allOrders.find((o) => o.code === orderCode);

  if (!ord) {
    throw new Error('Không tìm thấy đơn hàng cần hủy.');
  }

  const orderTimeMs = parseOrderTimestampToMs(ord.created_at);
  const elapsedMs = Date.now() - orderTimeMs;
  const thirtyMinutesMs = 30 * 60 * 1000;

  if (orderTimeMs > 0 && elapsedMs > thirtyMinutesMs) {
    throw new Error('Đã quá thời gian 30 phút đổi ý. Đơn hàng đã được chốt đóng thùng.');
  }

  const updatedData = await orderRepo.update(orderCode, {
    status: ORDER_STATUS.CANCELLED,
    cancel_reason: cancelReason || 'Khách đổi ý hủy đơn'
  }, 'code');

  return {
    ...updatedData,
    status: normalizeOrderStatus(updatedData.status)
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

    const allOrders = await orderRepo.getAll();
    const ordersData = allOrders.filter((o) => activeStatuses.includes(o.status));

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
 * 7. GỬI ĐÁNH GIÁ ĐƠN HÀNG (Gọi qua reviewRepo)
 */
export async function submitOrderReview({ 
  orderCode, 
  phone, 
  customerName, 
  rating, 
  content, 
  productTags = '', 
  imageUrls = [],
  shopPackingImage = null
}) {
  try {
    const cleanCode = String(orderCode || '').trim().toUpperCase();
    const cleanPhone = String(phone || '').trim();

    const allOrders = await orderRepo.getAll();
    const existingOrder = allOrders.find((o) => String(o.code).toUpperCase() === cleanCode);

    if (!existingOrder) {
      return { success: false, error: 'Không tìm thấy mã đơn hàng này trên hệ thống.' };
    }

    const currentStatusCode = normalizeOrderStatus(existingOrder.status);
    if (currentStatusCode !== ORDER_STATUS.COMPLETED) {
      return { 
        success: false, 
        error: 'Đơn hàng này chưa hoàn tất giao nhận. Bạn chỉ có thể đánh giá sau khi đã nhận kiện hàng.' 
      };
    }

    const resolvedShopImage = shopPackingImage || 
      existingOrder.packing_image_url || 
      existingOrder.packed_image_url || 
      existingOrder.packing_image || 
      (Array.isArray(existingOrder.packing_photos) && existingOrder.packing_photos[0]) || 
      null;

    const ratingNum = Number(rating) || 5;
    
    try {
      const data = await reviewRepo.create({
        order_code: cleanCode,
        customer_name: customerName.trim(),
        customer_phone: cleanPhone,
        rating: ratingNum,
        content: content.trim(),
        product_tags: productTags || '',
        image_urls: Array.isArray(imageUrls) ? imageUrls : [],
        shop_packing_image: resolvedShopImage,
        is_approved: true
      });
      return { success: true, data };
    } catch (insertErr) {
      if (insertErr.code === '23505') {
        return { success: false, error: 'Đơn hàng này đã được gửi đánh giá trước đó rồi.' };
      }
      return { success: false, error: insertErr.message };
    }
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
    const reviewsData = await reviewRepo.getAll();
    const reviews = reviewsData || [];
    
    const missingCodes = reviews
      .filter((r) => !r.shop_packing_image && r.order_code)
      .map((r) => r.order_code);

    if (missingCodes.length > 0) {
      const allOrders = await orderRepo.getAll();
      const orderMap = new Map(allOrders.map((o) => [o.code, o.packing_image]));
      
      return reviews.map((r) => ({
        ...r,
        shop_packing_image: r.shop_packing_image || orderMap.get(r.order_code) || null
      }));
    }

    return reviews;
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
    await reviewRepo.update(reviewId, { is_approved: nextStatus });
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
    await reviewRepo.remove(reviewId);
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
    const reviewsData = await reviewRepo.getAll();
    const approved = reviewsData
      .filter((r) => r.is_approved === true)
      .slice(0, limit);

    return approved;
  } catch {
    return [];
  }
}

/**
 * 12. ĐẾM SỐ ĐƠN THỰC TẾ
 */
export async function fetchTotalOrdersCount() {
  try {
    const orders = await orderRepo.getAll();
    return orders.length;
  } catch (err) {
    console.error('Lỗi đếm số lượng đơn hàng:', err);
    return 0;
  }
}

/**
 * 13. XÁC THỰC MÃ ĐƠN CŨ LÀM VOUCHER TRI ÂN
 */
export async function verifyPreviousOrderVoucher(rawCode, currentPhone, currentCartTotal = 0) {
  const cleanCode = String(rawCode || '').trim().toUpperCase();
  const cleanPhone = String(currentPhone || '').replace(/\D/g, '');

  if (!cleanCode.startsWith('XNG') && cleanCode.length < 6) {
    return { valid: false, message: 'Mã đơn hàng không hợp lệ.' };
  }

  try {
    const allOrders = await orderRepo.getAll();
    const oldOrder = allOrders.find((o) => String(o.code).toUpperCase() === cleanCode);

    if (!oldOrder) {
      return { valid: false, message: 'Không tìm thấy mã đơn hàng này trên hệ thống.' };
    }

    const oldPhone = String(oldOrder.phone || '').replace(/\D/g, '');
    if (cleanPhone && oldPhone && !oldPhone.endsWith(cleanPhone.slice(-8))) {
      return { valid: false, message: 'Mã đơn này không thuộc về số điện thoại đặt hàng hiện tại.' };
    }

    if (normalizeOrderStatus(oldOrder.status) !== ORDER_STATUS.COMPLETED) {
      return { valid: false, message: 'Đơn hàng này chưa hoàn tất giao nhận nên chưa thể dùng làm mã ưu đãi.' };
    }

    const activeUsed = allOrders.filter((o) => {
      const usedCode = o.used_previous_order_code || o.usedPreviousOrderCode;
      const norm = normalizeOrderStatus(o.status);
      return usedCode && usedCode.toUpperCase() === cleanCode && norm !== ORDER_STATUS.CANCELLED && norm !== ORDER_STATUS.BOMBED;
    });

    if (activeUsed.length > 0) {
      return { 
        valid: false, 
        message: `Mã đơn ${cleanCode} đã được dùng cho đơn hàng ${activeUsed[0].code} trước đó rồi. Mỗi đơn chỉ áp dụng 1 lần!` 
      };
    }

    const allReviews = await reviewRepo.getAll();
    const reviewData = allReviews.find((r) => String(r.order_code).toUpperCase() === cleanCode);

    if (!reviewData) {
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

    const configs = await shopConfigRepo.getAll();
    const loyaltyRow = configs.find((c) => c.key === 'loyalty');

    let loyaltyCfg = loyaltyRow?.value || {};
    if (typeof loyaltyCfg === 'string') {
      try { loyaltyCfg = JSON.parse(loyaltyCfg); } catch {}
    }

    const percent = Number(loyaltyCfg.percent ?? 10);
    const maxDiscount = Number(loyaltyCfg.maxDiscount ?? 50000);

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
    const allReviews = await reviewRepo.getAll();
    const target = allReviews.find((r) => String(r.order_code).toUpperCase() === String(orderCode).trim().toUpperCase());

    if (!target) return { isEligible: false, rating: 0 };

    const ratingNum = Number(target.rating) || 0;
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

  try {
    const allReviews = await reviewRepo.getAll();
    const reviewMap = new Map();
    allReviews.forEach((r) => {
      reviewMap.set(String(r.order_code).trim().toUpperCase(), Number(r.rating) || 0);
    });

    for (const ord of candidateOrders) {
      const code = String(ord.code || ord.orderId).trim().toUpperCase();
      if (usedCodesSet.has(code)) continue;

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
    const allOrders = await orderRepo.getAll();
    const orders = allOrders.filter((o) => o.phone && o.phone.replace(/\D/g, '') === cleanPhone).slice(0, 5);

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
 * 17. LẤY DANH SÁCH REVIEW ĐÃ DUYỆT PHÂN TRANG
 */
export async function fetchPaginatedApprovedReviews(page = 0, pageSize = 6) {
  try {
    const allReviews = await reviewRepo.getAll();
    const approved = allReviews.filter((r) => r.is_approved === true);
    
    approved.sort((a, b) => {
      if ((b.rating || 5) !== (a.rating || 5)) {
        return (b.rating || 5) - (a.rating || 5);
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

    const total = approved.length;
    const from = page * pageSize;
    const reviewsSlice = approved.slice(from, from + pageSize);

    const missingCodes = reviewsSlice
      .filter((r) => !r.shop_packing_image && r.order_code)
      .map((r) => r.order_code);

    let finalReviews = reviewsSlice;
    if (missingCodes.length > 0) {
      const allOrders = await orderRepo.getAll();
      const orderMap = new Map(allOrders.map((o) => [o.code, o.packing_image]));
      
      finalReviews = reviewsSlice.map((r) => ({
        ...r,
        shop_packing_image: r.shop_packing_image || orderMap.get(r.order_code) || null
      }));
    }

    const hasMore = (from + finalReviews.length) < total;

    return {
      reviews: finalReviews,
      totalCount: total,
      hasMore
    };
  } catch (err) {
    console.warn('Lỗi fetchPaginatedApprovedReviews:', err);
    return { reviews: [], totalCount: 0, hasMore: false };
  }
}

/**
 * 18. KIỂM TRA MÃ ĐƠN CŨ DÙNG LÀM VOUCHER
 */
export async function verifyReviewVoucher(voucherCodeInput, inputPhone = '') {
  const cleanCode = String(voucherCodeInput || '').trim().toUpperCase();
  const cleanPhone = String(inputPhone || '').replace(/\D/g, '').slice(-9);

  if (!cleanCode) {
    return { valid: false, message: 'Vui lòng nhập mã đơn cũ để nhận ưu đãi!' };
  }

  if (!cleanPhone || cleanPhone.length < 8) {
    return { valid: false, message: 'Vui lòng điền Số điện thoại trước khi áp dụng mã giảm giá!' };
  }

  try {
    const allOrders = await orderRepo.getAll();
    const originalOrder = allOrders.find((o) => String(o.code).toUpperCase() === cleanCode);

    if (!originalOrder) {
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

    const allReviews = await reviewRepo.getAll();
    const reviewData = allReviews.find((r) => String(r.order_code).toUpperCase() === cleanCode && r.is_approved === true);

    if (!reviewData) {
      return { 
        valid: false, 
        message: `Đơn hàng #${cleanCode} chưa gửi đánh giá cảm nhận hoặc đánh giá chưa được duyệt!` 
      };
    }

    const activeLockOrder = allOrders.find((ord) => {
      const usedCode = ord.used_previous_order_code || ord.usedPreviousOrderCode;
      const vCode = ord.voucher_codes || ord.voucherCode;
      const isUsing = (usedCode && String(usedCode).toUpperCase() === cleanCode) || 
                      (vCode && String(vCode).toUpperCase().includes(cleanCode));
      if (!isUsing) return false;

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