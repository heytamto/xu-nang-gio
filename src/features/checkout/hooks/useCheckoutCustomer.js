import { useState, useMemo } from "react";
import { isValidVietnamesePhone } from "../../../shared/utils/validationUtils";

export function useCheckoutCustomer() {
  const [customer, setCustomer] = useState(() => {
    try {
      const saved = localStorage.getItem("shop_last_customer");
      return saved
        ? JSON.parse(saved)
        : { name: "", phone: "", email: "", note: "" };
    } catch {
      return { name: "", phone: "", email: "", note: "" };
    }
  });

  const [shippingAddress, setShippingAddress] = useState(() => {
    try {
      return localStorage.getItem("shop_last_address") || "";
    } catch {
      return "";
    }
  });
  const [formErrors, setFormErrors] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const cleanPhone = useMemo(
    () => customer.phone.trim().replace(/[^0-9]/g, ""),
    [customer.phone],
  );
  const isPhoneValid = useMemo(
    () => isValidVietnamesePhone(cleanPhone),
    [cleanPhone],
  );
  // No unverified phone-based history or risk-profile reads. The atomic RPC enforces risk.
  // Unknown history is not the same as a first-time customer.
  const customerHistory = null;
  return { customer, setCustomer, shippingAddress, setShippingAddress, formErrors, setFormErrors, cleanPhone, isPhoneValid, customerHistory };
}
