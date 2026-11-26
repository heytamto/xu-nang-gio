import { useMemo, useEffect } from "react";
import { requiredPaymentMethod } from "../utils/checkoutPaymentPolicy";
import { resolveBankConfig } from "../utils/checkoutUtils";

export function useCheckoutPayment({ paymentMethod, setPaymentMethod, liveConfig, customerHistory }) {
  const bankConfig = useMemo(() => resolveBankConfig(liveConfig), [liveConfig]);

  const isPaymentGiftsEnabled = useMemo(() => {
    return (
      liveConfig?.enablePaymentGifts ?? liveConfig?.payment?.enableGifts ?? true
    );
  }, [liveConfig]);
  useEffect(() => {
    const required = requiredPaymentMethod(paymentMethod, customerHistory);
    if (required !== paymentMethod) setPaymentMethod(required);
  }, [customerHistory, paymentMethod, setPaymentMethod]);
  return { bankConfig, isPaymentGiftsEnabled };
}
