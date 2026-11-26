import { supabase } from '../../../infrastructure/supabase/supabaseClient';
import { orderRepo, reviewRepo } from '../../../infrastructure/supabase/repositories/index';
import { ORDER_STATUS, normalizeOrderStatus } from '../../orders/constants/orderStatus';

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
  const result = await fetchPaginatedApprovedReviews(0,limit);
  return result.reviews;
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
 * 17. LẤY DANH SÁCH REVIEW ĐÃ DUYỆT PHÂN TRANG
 */
export async function fetchPaginatedApprovedReviews(page = 0, pageSize = 6) {
  if (!Number.isSafeInteger(page) || page < 0 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 24) throw new Error('Phân trang đánh giá không hợp lệ.');
  const { data, error } = await supabase.rpc('xng_public_reviews_staging', {p_page:page,p_page_size:pageSize});
  if (error) throw error;
  if (!Array.isArray(data?.reviews) || !Number.isSafeInteger(data.totalCount) || typeof data.hasMore !== 'boolean') throw new Error('Phản hồi đánh giá không hợp lệ.');
  return data;
}
