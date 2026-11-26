import { supabase } from '../../../infrastructure/supabase/supabaseClient';
import React, { useState, useEffect } from "react";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { generatePrefixedDateId } from "../../../shared/utils/idGenerator";
import { validateName, validatePhone, validateEmail } from "../../../shared/utils/validationUtils";
import ConfirmModal from "../../admin/components/ConfirmModal";
import OrderItemsList from "../components/OrderItemsList";
import PaymentGiftSelector from "../../payment/components/PaymentGiftSelector";
import CustomerInfoForm from "../components/CustomerInfoForm";
import ShippingPolicyCard from "../components/ShippingPolicyCard";
import VoucherSection from "../../vouchers/components/VoucherSection";
import PaymentMethodSelector from "../../payment/components/PaymentMethodSelector";
import CodTimeline from "../components/CodTimeline";
import VietQrBox from "../../payment/components/VietQrBox";
import OrderSummaryCard from "../components/OrderSummaryCard";
import EmptyCheckout from "../components/EmptyCheckout";
import { useCheckoutPricing } from "../hooks/useCheckoutPricing";
import { useCheckoutLiveData } from "../hooks/useCheckoutLiveData";
import { useCheckoutCustomer } from "../hooks/useCheckoutCustomer";
import { useCheckoutVoucherState, useCheckoutVoucherActions } from "../hooks/useCheckoutVouchers";
import { useCheckoutPayment } from "../hooks/useCheckoutPayment";
import { useCheckoutSubmission } from "../hooks/useCheckoutSubmission";

export default function CheckoutPage({
  cart = [],
  onSubmitOrder,
  onNavigate,
  shopConfig = {},
  onUpdateQuantity,
  onRemoveItem,
}) {
  const [orderCode] = useState(() => generatePrefixedDateId("XNG"));
  const [paymentMethod, setPaymentMethod] = useState("deposit");
  const [selectedGiftId, setSelectedGiftId] = useState("");
  const [isPromoDismissed, setIsPromoDismissed] = useState(false);
  const voucherState = useCheckoutVoucherState();
  const { voucherInput, setVoucherInput, appliedVouchers, setAppliedVouchers, voucherError, isValidatingVoucher } = voucherState;
  const { syncedCart, paymentGifts, liveConfig, priceChangeNotice, setPriceChangeNotice } = useCheckoutLiveData({ cart, shopConfig, selectedGiftId, setSelectedGiftId, setAppliedVouchers });
  const { customer, setCustomer, shippingAddress, setShippingAddress, formErrors, setFormErrors, cleanPhone, isPhoneValid, customerHistory } = useCheckoutCustomer(liveConfig);
  const { clientSubtotal, freeShippingThreshold, shippingFee, activeDiscount, activeFinalTotal, activeSubtotal, activeCart, depositAmount } = useCheckoutPricing(syncedCart, liveConfig, appliedVouchers);
  const { bankConfig, isPaymentGiftsEnabled } = useCheckoutPayment({ paymentMethod, setPaymentMethod, liveConfig, customerHistory });
  const { singleSuggestedVoucher, applySpecificCode, handleRemoveVoucher } = useCheckoutVoucherActions({ state: voucherState, cleanPhone, isPhoneValid, customerHistory, clientSubtotal, liveConfig });
  const [notice, setNotice] = useState(null);
  const showNotice = (message, title = "Thông báo đặt hàng") => {
    setNotice({ title, message, isAlert: true, isDanger: false, confirmLabel: "Đã hiểu" });
  };
  const { handleSubmit, isSubmittingOrder } = useCheckoutSubmission({ paymentGifts, selectedGiftId, isPaymentGiftsEnabled, appliedVouchers, orderCode, customer, cleanPhone, shippingAddress, paymentMethod, setPaymentMethod, depositAmount, activeSubtotal, shippingFee, activeFinalTotal, activeDiscount, activeCart, onSubmitOrder, setFormErrors, customerHistory, showNotice });

  const [accepting,setAccepting]=useState(null);
  useEffect(()=>{let alive=true;async function refresh(){try{const {data,error}=await supabase.rpc('xng_checkout_open');if(alive)setAccepting(error?null:data);}catch{if(alive)setAccepting(null);}} refresh();const timer=setInterval(refresh,30000);return()=>{alive=false;clearInterval(timer);};},[]);
  if (!cart.length) return <EmptyCheckout onNavigate={onNavigate} />;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 font-sans">
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden relative">
        <div className="bg-stone-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate?.("shop")}
              className="p-2 hover:bg-stone-800 rounded-xl text-stone-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-black">
                Xác Nhận Đặt Hàng - Xứ Nắng Gió
              </h2>
              <p className="text-xs text-stone-400">
                Nông sản thu hái tại giàn, bao ăn từng trái
              </p>
            </div>
          </div>
        </div>

        {accepting===false && <p role="alert" className="bg-amber-50 p-4 text-amber-900 font-bold">Vườn đang tạm ngừng nhận đơn. Giỏ hàng vẫn được giữ.</p>}
        {priceChangeNotice && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 px-6 flex items-center justify-between gap-3 text-xs text-amber-900 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{priceChangeNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setPriceChangeNotice(null)}
              className="text-amber-800 hover:text-amber-950 font-bold text-[11px] underline cursor-pointer"
            >
              Đã hiểu
            </button>
          </div>
        )}

        <form
          onSubmit={e=>{if(accepting===false){e.preventDefault();showNotice("Vườn đang tạm ngừng nhận đơn. Giỏ hàng vẫn được giữ nguyên. Vui lòng quay lại sau.", "Tạm ngừng nhận đơn");return;}handleSubmit(e);}}
          className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
        >
          <div className="lg:col-span-7 flex flex-col justify-between gap-5 h-full">
            <div className="space-y-4">
              <OrderItemsList
                cart={activeCart}
                totalAmount={activeSubtotal}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={onRemoveItem}
              />
              {paymentMethod !== "cod" && isPaymentGiftsEnabled && (
                <PaymentGiftSelector
                  paymentGifts={paymentGifts}
                  selectedGiftId={selectedGiftId}
                  onSelectGift={setSelectedGiftId}
                  isEnabled={isPaymentGiftsEnabled}
                />
              )}
              <CustomerInfoForm
                customer={customer}
                setCustomer={setCustomer}
                shippingAddress={shippingAddress}
                setShippingAddress={setShippingAddress}
                formErrors={formErrors}
                setFormErrors={setFormErrors}
                validateName={validateName}
                validatePhone={validatePhone}
                validateEmail={validateEmail}
                customerHistory={customerHistory}
                singleSuggestedVoucher={singleSuggestedVoucher}
                isPromoDismissed={isPromoDismissed}
                setIsPromoDismissed={setIsPromoDismissed}
                onApplySpecificCode={applySpecificCode}
              />
            </div>
            <ShippingPolicyCard
              shouldShowFullPolicy={activeCart.length <= 2}
              hotline={liveConfig?.hotline}
              shopConfig={liveConfig}
            />
          </div>

          <div className="lg:col-span-5 bg-stone-50/90 rounded-3xl p-4 sm:p-5 border border-stone-200/90 shadow-xs flex flex-col justify-between gap-4 h-full">
            <div className="space-y-4">
              <VoucherSection
                voucherInput={voucherInput}
                setVoucherInput={setVoucherInput}
                appliedVouchers={appliedVouchers}
                calculatedVouchers={appliedVouchers}
                voucherError={voucherError}
                isValidating={isValidatingVoucher}
                onApplyVoucher={() => applySpecificCode(voucherInput)}
                onRemoveVoucher={handleRemoveVoucher}
              />
              <PaymentMethodSelector
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                customerHistory={customerHistory}
                depositAmount={depositAmount}
                finalTotalAmount={activeFinalTotal}
                isPaymentGiftsEnabled={isPaymentGiftsEnabled}
              />
              {paymentMethod === "cod" ? (
                <CodTimeline finalTotalAmount={activeFinalTotal} />
              ) : (
                <VietQrBox
                  paymentMethod={paymentMethod}
                  depositAmount={depositAmount}
                  finalTotalAmount={activeFinalTotal}
                  orderCode={orderCode}
                  bankBin={bankConfig.bankBin}
                  bankName={bankConfig.bankName}
                  accountNo={bankConfig.accountNo}
                  accountName={bankConfig.accountName}
                  cleanPhone={cleanPhone}
                />
              )}
            </div>
            <OrderSummaryCard
              totalAmount={activeSubtotal}
              shippingFee={shippingFee}
              freeShippingThreshold={freeShippingThreshold}
              discountAmount={activeDiscount}
              finalTotalAmount={activeFinalTotal}
              paymentMethod={paymentMethod}
              depositAmount={depositAmount}
              isSubmitting={isSubmittingOrder}
            />
          </div>
        </form>
      </div>
      <ConfirmModal modalConfig={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
