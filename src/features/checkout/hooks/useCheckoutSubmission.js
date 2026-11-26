import { calculatePaymentAmounts } from "../utils/checkoutPaymentPolicy";
import { useState, useCallback, useRef } from "react";
import { ORDER_STATUS } from "../../orders/constants/orderStatus";
import { validateName, validatePhone, validateEmail, validateAddress } from "../../../shared/utils/validationUtils";

export function useCheckoutSubmission({ paymentGifts, selectedGiftId, isPaymentGiftsEnabled, appliedVouchers, orderCode, customer, cleanPhone, shippingAddress, paymentMethod, setPaymentMethod, depositAmount, activeSubtotal, shippingFee, activeFinalTotal, activeDiscount, activeCart, onSubmitOrder, setFormErrors, customerHistory, showNotice }) {
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const requestId = useRef(null);
  const submitting = useRef(false);
  const processCheckoutSubmission = useCallback(async () => {
    const chosenGiftObj = paymentGifts.find((g) => g.id === selectedGiftId);

    const isGiftInStock =
      chosenGiftObj &&
      chosenGiftObj.is_active !== false &&
      chosenGiftObj.inStock !== false;
    const isGiftApplicable =
      isPaymentGiftsEnabled && paymentMethod !== "cod" && isGiftInStock;
    const giftTitleToSave = isGiftApplicable
      ? chosenGiftObj?.title || chosenGiftObj?.name || ""
      : "Không áp dụng (COD / Hết quà)";

    const previousOrderCodeUsed =
      appliedVouchers.find((v) => v.isLoyalty || v.isPreviousOrder)?.code || "";

    const { currentDepositExpected, currentRemainingCod } = calculatePaymentAmounts(
      paymentMethod, depositAmount, activeFinalTotal
    );

    const orderPayload = {
      requestId: requestId.current,
      code: orderCode,
      orderCode: orderCode,
      customer,
      customer_name: customer.name.trim(),
      name: customer.name.trim(),
      phone: cleanPhone,
      email: customer.email.trim(),
      note: customer.note.trim(),
      address: shippingAddress.trim(),
      payment_method: paymentMethod,
      paymentMethod,
      payment_verified: false,
      paymentVerified: false,

      deposit_amount_expected: currentDepositExpected,
      deposit_paid: 0,
      remaining_cod: currentRemainingCod,
      giftTitle: giftTitleToSave,
      payment_gift: isGiftApplicable ? giftTitleToSave : null,
      paymentGiftId: isGiftApplicable ? selectedGiftId : null,

      subtotal: activeSubtotal,
      shipping_fee: shippingFee,
      shippingFee: shippingFee,
      final_total: activeFinalTotal,
      finalTotal: activeFinalTotal,
      total: activeFinalTotal,
      rawTotal: activeSubtotal,
      discount: activeDiscount,
      discountAmount: activeDiscount,

      voucherCode: appliedVouchers
        .map((v) => v.code)
        .filter(Boolean)
        .join(", "),
      usedPreviousOrderCode: previousOrderCodeUsed,
      used_previous_order_code: previousOrderCodeUsed,
      appliedVouchers,
      cart: activeCart,
      status: ORDER_STATUS.PENDING,
    };

    try {
      localStorage.setItem("shop_last_customer", JSON.stringify(customer));
      localStorage.setItem("shop_last_address", shippingAddress);
    } catch (err) {
      console.error(err);
    }

    if (onSubmitOrder) {
      await onSubmitOrder(orderPayload);
    }
  }, [
    paymentGifts,
    selectedGiftId,
    isPaymentGiftsEnabled,
    appliedVouchers,
    orderCode,
    customer,
    cleanPhone,
    shippingAddress,
    paymentMethod,
    depositAmount,
    activeSubtotal,
    shippingFee,
    activeFinalTotal,
    activeDiscount,
    activeCart,
    onSubmitOrder,
  ]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (submitting.current) return;

    const nameErr = validateName(customer.name);
    const phoneErr = validatePhone(customer.phone);
    const emailErr = validateEmail(customer.email);
    const addressErr = validateAddress(shippingAddress);

    setFormErrors({
      name: nameErr,
      phone: phoneErr,
      email: emailErr,
      address: addressErr,
    });
    if (nameErr || phoneErr || emailErr || addressErr) return;

    if (
      customerHistory?.hasBombedHistory &&
      !customerHistory?.isPardoned &&
      paymentMethod !== "full_qr"
    ) {
      showNotice(
        "Đơn hàng này cần thanh toán chuyển khoản 100% trước khi nhà vườn cắt hái!",
      );
      setPaymentMethod("full_qr");
      return;
    }

    submitting.current = true;
    setIsSubmittingOrder(true);
    try {
      requestId.current ??= crypto.randomUUID();
      await processCheckoutSubmission();
    } catch (err) {
      console.error("Lỗi khi gửi đơn hàng:", err);
      const failure=String(err?.message || '');
      if(failure.includes('XNG_CHECKOUT_PAUSED')) {showNotice('Vườn đang tạm ngừng nhận đơn. Giỏ hàng vẫn được giữ nguyên. Vui lòng quay lại sau.', 'Tạm ngừng nhận đơn');return;}
      if(failure.includes('XNG_INVENTORY_INSUFFICIENT')) {showNotice('Sản phẩm không đủ tồn kho. Vui lòng giảm số lượng hoặc liên hệ vườn. Giỏ hàng vẫn được giữ.', 'Không đủ tồn kho');return;}
      if(failure.includes('XNG_FULL_PAYMENT_REQUIRED')) {setPaymentMethod('full_qr');showNotice('Đơn này cần chuyển khoản 100%. Vui lòng kiểm tra lại số tiền và xác nhận đặt hàng.');return;}
      if(failure.includes('XNG_DEPOSIT_REQUIRED')) {setPaymentMethod('deposit');showNotice('Đơn này cần đặt cọc. Vui lòng kiểm tra lại số tiền và xác nhận đặt hàng.');return;}
      showNotice(failure.includes("XNG_") ? "Dữ liệu đơn không còn phù hợp với quy định của vườn. Vui lòng liên hệ cửa hàng hoặc kiểm tra lại giỏ hàng. Giỏ hàng vẫn được giữ." : "Chưa xác nhận được đơn hàng. Giỏ hàng vẫn được giữ. Nếu thử lại, giữ nguyên thông tin đơn để tránh tạo trùng.");
    } finally {
      submitting.current = false;
      setIsSubmittingOrder(false);
    }
  };
  return { handleSubmit, isSubmittingOrder };
}
