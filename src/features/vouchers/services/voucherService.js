import { orderRepo, voucherRepo, reviewRepo, shopConfigRepo } from '../../../infrastructure/supabase/repositories/index';
import { ORDER_STATUS, normalizeOrderStatus } from '../../orders/constants/orderStatus';

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

    if (!vData || vData.is_active === false) {
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
    if (appliedList.length > 0 && (!canStack || appliedList.some(v => v.canStack === false))) {
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
        maxDiscount,
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
