import { supabase } from '../../../infrastructure/supabase/supabaseClient';
import React, { useState, useEffect, useRef } from "react";
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
import { useCheckoutColumnBalance } from "../hooks/useCheckoutColumnBalance";
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
  const leftContent = useRef(null);
  const rightColumn = useRef(null);
  const policyBudget = useCheckoutColumnBalance(leftContent, rightColumn, cart.length > 0);
  if (!cart.length) return <EmptyCheckout onNavigate={onNavigate} />;

  return (
    <div className="xng-page xng-page--transaction checkout-mobile font-sans">
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden relative">
        <div className="bg-stone-900 text-white p-3 sm:p-4 flex items-center justify-between">
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
          className="p-3 sm:p-4 lg:p-5 grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-start"
        >
          <div className="contents lg:col-span-7 lg:flex min-w-0 flex-col gap-3">
            <div ref={leftContent} className="contents lg:block lg:space-y-3">
              <div className="order-1 min-w-0 lg:order-none"><OrderItemsList
                cart={activeCart}
                totalAmount={activeSubtotal}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={onRemoveItem}
              /></div>
              {paymentMethod !== "cod" && isPaymentGiftsEnabled && (
                <div className="order-5 min-w-0 lg:order-none"><PaymentGiftSelector
                  paymentGifts={paymentGifts}
                  selectedGiftId={selectedGiftId}
                  onSelectGift={setSelectedGiftId}
                  isEnabled={isPaymentGiftsEnabled}
                /></div>
              )}
              <div className="order-2 min-w-0 lg:order-none"><CustomerInfoForm
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
              /></div>
            </div>
            <div className="contents"><ShippingPolicyCard
              budget={policyBudget}
              hotline={liveConfig?.hotline}
              shopConfig={liveConfig}
            /></div>
          </div>

          <div ref={rightColumn} className="contents lg:col-span-5 min-w-0 lg:bg-stone-50/90 lg:rounded-3xl lg:p-4 lg:border lg:border-stone-200/90 lg:shadow-xs lg:flex flex-col gap-3">
            <div className="contents lg:block lg:space-y-3">
              <div className="order-3 min-w-0 lg:order-none"><VoucherSection
                voucherInput={voucherInput}
                setVoucherInput={setVoucherInput}
                appliedVouchers={appliedVouchers}
                calculatedVouchers={appliedVouchers}
                voucherError={voucherError}
                isValidating={isValidatingVoucher}
                onApplyVoucher={() => applySpecificCode(voucherInput)}
                onRemoveVoucher={handleRemoveVoucher}
              /></div>
              <div className="order-4 min-w-0 lg:order-none"><PaymentMethodSelector
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                customerHistory={customerHistory}
                depositAmount={depositAmount}
                finalTotalAmount={activeFinalTotal}
                isPaymentGiftsEnabled={isPaymentGiftsEnabled}
              /></div>
              <div className="order-6 min-w-0 lg:order-none">{paymentMethod === "cod" ? (
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
              )}</div>
            </div>
            <div className="order-8 min-w-0 lg:order-none"><OrderSummaryCard
              totalAmount={activeSubtotal}
              shippingFee={shippingFee}
              freeShippingThreshold={freeShippingThreshold}
              discountAmount={activeDiscount}
              finalTotalAmount={activeFinalTotal}
              paymentMethod={paymentMethod}
              depositAmount={depositAmount}
              isSubmitting={isSubmittingOrder}
            /></div>
          </div>
        </form>
      </div>
      <ConfirmModal modalConfig={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
