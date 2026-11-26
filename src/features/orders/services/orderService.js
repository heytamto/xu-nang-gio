// Compatibility facade: preserve existing imports.
export { submitOrderToSupabase, cancelOrderDirect } from './orderCommandService';
export { lookupOrderDirect, fetchActiveProcessingOrders, fetchTotalOrdersCount } from './orderLookupService';
export { validateVoucherCode, verifyPreviousOrderVoucher, findEligiblePreviousOrderVoucher, verifyReviewVoucher } from '../../vouchers/services/voucherService';
export { fetchCustomerHistory, checkCustomerOrderRisk } from '../../customers/services/customerService';
export { submitOrderReview, fetchAllReviewsForAdmin, toggleReviewApproval, deleteReviewById, fetchApprovedReviews, checkOrderReviewStatus, fetchPaginatedApprovedReviews } from '../../reviews/services/reviewService';
