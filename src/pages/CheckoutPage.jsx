import React, { useState, useMemo, useEffect } from "react";
import { 
  User, Phone, Mail, FileText, ShieldCheck, 
  QrCode, Truck, ArrowRight, ArrowLeft, Loader2, Tag, Sparkles, Gift, UserCheck, ShoppingBag,
  Download, Copy, Check, ExternalLink, HeartHandshake, PackageCheck, Headphones, Sparkle,
  Printer, CheckCircle2, X, BadgeCheck, AlertCircle
} from 'lucide-react';
import AddressField from "../components/AddressField";

const MAX_VOUCHERS = 3;

export default function CheckoutPage({
  cart = [],
  onSubmitOrder,
  onNavigate,
  shopConfig = {},
}) {
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    note: "",
  });

  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("deposit");
  const [selectedGiftId, setSelectedGiftId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printStage, setPrintStage] = useState(1);
  const [isPromoDismissed, setIsPromoDismissed] = useState(false);

  const [formErrors, setFormErrors] = useState({
    name: "",
    phone: "",
    email: "",
  });

  // 1. Quà tặng chuyển khoản: Lấy 100% động từ Google Sheet
  const paymentGifts = useMemo(() => {
    return Array.isArray(shopConfig?.paymentGifts) ? shopConfig.paymentGifts : [];
  }, [shopConfig?.paymentGifts]);

  // Tự động chọn món quà đầu tiên khi chọn cọc/chuyển khoản nếu có danh sách quà
  useEffect(() => {
    if (paymentMethod !== "cod" && paymentGifts.length > 0) {
      const isCurrentGiftValid = paymentGifts.some((g) => g.id === selectedGiftId);
      if (!isCurrentGiftValid) {
        setSelectedGiftId(paymentGifts[0].id);
      }
    } else if (paymentMethod === "cod") {
      setSelectedGiftId("");
    }
  }, [paymentMethod, paymentGifts, selectedGiftId]);

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
  }, [cart]);

  const actualAccountNo =
    shopConfig.accountNo && shopConfig.accountNo !== "0987654321"
      ? shopConfig.accountNo
      : import.meta.env.VITE_ACCOUNT_NO || "0848957345";

  const actualBankName =
    shopConfig.bankName || import.meta.env.VITE_BANK_NAME || "MB";
  const actualBankBin =
    shopConfig.bankBin || import.meta.env.VITE_BANK_BIN || "970422";
  const actualAccountName =
    shopConfig.accountName ||
    import.meta.env.VITE_ACCOUNT_NAME ||
    "TO THANH TAM";

  const [copiedField, setCopiedField] = useState("");
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVouchers, setAppliedVouchers] = useState([]);
  const [voucherError, setVoucherError] = useState("");

  const cleanPhone = useMemo(() => {
    return customer.phone.trim().replace(/[^0-9]/g, "");
  }, [customer.phone]);

  const validatePhone = (phone) => {
    const raw = phone.trim();
    if (!raw) return "Vui lòng nhập số điện thoại người nhận.";
    if (raw.length !== 10) return `Số điện thoại phải có đúng 10 số (hiện có ${raw.length} số).`;
    const vnPhoneRegex = /^0(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
    if (!vnPhoneRegex.test(raw)) {
      return "Đầu số không hợp lệ (cần bắt đầu bằng 03, 05, 07, 08, 09).";
    }
    return "";
  };

  const validateName = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return "Vui lòng nhập họ và tên người nhận.";
    const vnNameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/;
    if (!vnNameRegex.test(trimmed)) return "Họ tên chỉ được chứa chữ cái, không chứa số hoặc ký tự lạ.";
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length < 2 || trimmed.length < 4) {
      return "Vui lòng nhập đầy đủ cả họ và tên (tối thiểu 2 từ).";
    }
    return "";
  };

  const validateEmail = (email) => {
    const trimmed = email.trim();
    if (!trimmed) return "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return "Email không đúng định dạng (VD: example@gmail.com).";
    }
    return "";
  };

  // Tra cứu lịch sử khách hàng dựa trên 10 số điện thoại
  const customerHistory = useMemo(() => {
    if (!cleanPhone || cleanPhone.length < 10) return null;

    try {
      const pastOrders = JSON.parse(localStorage.getItem("shop_orders") || "[]");
      const matchedOrders = pastOrders.filter((ord) => {
        const ordPhone = (
          ord.phone ||
          ord["Số Điện Thoại"] ||
          ord.customer?.phone ||
          ""
        ).replace(/[^0-9]/g, "");
        return ordPhone === cleanPhone;
      });

      if (matchedOrders.length > 0) {
        const latestOrder = matchedOrders[0];
        const hasUnusedOldCode = !pastOrders.some(
          (ord) => ord.usedPreviousOrderCode === latestOrder.code,
        );

        return {
          isOldCustomer: true,
          orderCount: matchedOrders.length,
          latestOrderCode: latestOrder.code,
          canUseOldCode: hasUnusedOldCode,
        };
      }
    } catch (e) {
      console.error(e);
    }

    return {
      isOldCustomer: false,
      orderCount: 0,
      latestOrderCode: null,
      canUseOldCode: false,
    };
  }, [cleanPhone]);

  // =========================================================================
  // BỘ THANH LỌC TỰ ĐỘNG CHỐNG TRÁO ĐỔI SĐT ĐỂ TRỤC LỢI VOUCHER
  // =========================================================================
  useEffect(() => {
    if (!customerHistory) return;

    // 1. Nếu SĐT hiện tại nhận diện là KHÁCH CŨ:
    // Tự động đá văng mã chào mừng "LAMQUEN" nếu khách từng nhập trước đó bằng số lạ
    if (customerHistory.isOldCustomer) {
      setAppliedVouchers((prev) => {
        const hasWelcome = prev.some((v) => v.code === "LAMQUEN");
        if (hasWelcome) {
          setVoucherError(
            'Số điện thoại này là khách quen của vườn, mã chào mừng "LAMQUEN" đã tự động được thu hồi!',
          );
          return prev.filter((v) => v.code !== "LAMQUEN");
        }
        return prev;
      });
    }

    // 2. Nếu SĐT hiện tại nhận diện là KHÁCH MỚI:
    // Tự động thu hồi mã tri ân đơn cũ (XNG...) nếu trước đó từng nhập
    if (!customerHistory.isOldCustomer) {
      setAppliedVouchers((prev) => {
        const hasOldCode = prev.some(
          (v) => v.usedPreviousOrderCode || v.code.startsWith("XNG"),
        );
        if (hasOldCode) {
          setVoucherError(
            "Số điện thoại hiện tại không khớp với mã đơn hàng tri ân đã áp dụng.",
          );
          return prev.filter(
            (v) => !v.usedPreviousOrderCode && !v.code.startsWith("XNG"),
          );
        }
        return prev;
      });
    }
  }, [customerHistory]);

  // Cờ kiểm tra mã voucher đã được đưa vào giỏ hàng chưa
  const isLoyaltyCodeApplied = useMemo(() => {
    return appliedVouchers.some(
      (v) =>
        v.code === customerHistory?.latestOrderCode ||
        v.usedPreviousOrderCode ||
        v.code.startsWith("XNG")
    );
  }, [appliedVouchers, customerHistory?.latestOrderCode]);

  const isWelcomeCodeApplied = useMemo(() => {
    return appliedVouchers.some((v) => v.code === "LAMQUEN");
  }, [appliedVouchers]);

  // GỢI Ý DUY NHẤT 1 MÃ KHI ĐÃ NHẬP ĐỦ 10 SỐ ĐIỆN THOẠI
  const singleSuggestedVoucher = useMemo(() => {
    if (!customerHistory) return null;

    // A. Khách cũ -> Chỉ gợi ý duy nhất mã tri ân đơn cũ
    if (customerHistory.isOldCustomer) {
      if (customerHistory.canUseOldCode && !isLoyaltyCodeApplied) {
        const rate = Number(shopConfig?.loyaltyDiscountPercent) || 10;
        return {
          isLoyalty: true,
          code: customerHistory.latestOrderCode,
          title: `Tri ân khách quen (Đơn thứ ${customerHistory.orderCount + 1})`,
          desc: `Giảm ${rate}% từ đơn cũ ${customerHistory.latestOrderCode}`,
        };
      }
      return null;
    }

    // B. Khách mới -> Chỉ gợi ý duy nhất mã LAMQUEN (nếu chưa dùng)
    if (!isWelcomeCodeApplied) {
      const welcomeVoucher = shopConfig?.vouchers?.find((v) => v.code === "LAMQUEN");
      if (welcomeVoucher) {
        const isAvailable = !(
          welcomeVoucher.usageLimit > 0 &&
          Number(welcomeVoucher.usedCount || 0) >= Number(welcomeVoucher.usageLimit)
        );
        if (isAvailable) {
          return {
            isLoyalty: false,
            code: "LAMQUEN",
            title: "Chào bạn mới ghé vườn!",
            desc: welcomeVoucher.desc || "Ưu đãi 15.000đ cho đơn hàng đầu tiên",
          };
        }
      }
    }

    return null;
  }, [
    customerHistory,
    isLoyaltyCodeApplied,
    isWelcomeCodeApplied,
    shopConfig?.loyaltyDiscountPercent,
    shopConfig?.vouchers,
  ]);

  // Tính toán số tiền giảm giá chi tiết
  const { calculatedVouchers, discountAmount } = useMemo(() => {
    if (appliedVouchers.length === 0)
      return { calculatedVouchers: [], discountAmount: 0 };

    let totalDisc = 0;
    const list = appliedVouchers.map((v) => {
      let currentVal = 0;
      if (v.type === "percent") {
        const raw = Math.round((totalAmount * (v.value || 0)) / 100);
        currentVal = v.maxDiscount ? Math.min(raw, v.maxDiscount) : raw;
      } else {
        currentVal = Number(v.value) || 0;
      }

      totalDisc += currentVal;
      return {
        ...v,
        currentDiscount: currentVal,
      };
    });

    return {
      calculatedVouchers: list,
      discountAmount: Math.min(totalAmount, totalDisc),
    };
  }, [appliedVouchers, totalAmount]);

  useEffect(() => {
    if (appliedVouchers.length > 0) {
      const invalidVoucher = appliedVouchers.find(
        (v) => v.minOrder && totalAmount < Number(v.minOrder),
      );
      if (invalidVoucher) {
        setAppliedVouchers((prev) =>
          prev.filter((v) => v.code !== invalidVoucher.code),
        );
        setVoucherError(
          `Mã "${invalidVoucher.code}" đã tự hủy do đơn chưa đủ ${Number(invalidVoucher.minOrder).toLocaleString("vi-VN")}đ.`,
        );
      }
    }
  }, [totalAmount, appliedVouchers]);

  // Áp dụng mã với kiểm tra chặn từ vòng ngoài
  const applySpecificCode = (codeToApply) => {
    setVoucherError("");
    const code = codeToApply.trim().toUpperCase();
    if (!code) return;

    // CHẶN GÕ TAY: Khách cũ cố tình gõ mã LAMQUEN
    if (code === "LAMQUEN" && customerHistory?.isOldCustomer) {
      setVoucherError('Mã "LAMQUEN" chỉ áp dụng cho số điện thoại đặt đơn lần đầu!');
      return;
    }

    if (appliedVouchers.some((v) => v.code === code)) {
      setVoucherError(`Mã "${code}" đã được áp dụng.`);
      return;
    }

    // Khống chế tối đa 3 voucher cùng lúc
    if (appliedVouchers.length >= MAX_VOUCHERS) {
      setVoucherError("Đơn hàng đã áp dụng số lượng mã ưu đãi tối đa.");
      return;
    }

    let voucherCandidate = null;

    if (code.startsWith("XNG")) {
      // Chặn nếu là khách mới mà nhập bừa mã XNG
      if (customerHistory && !customerHistory.isOldCustomer) {
        setVoucherError("Mã tri ân này không thuộc số điện thoại hiện tại của bạn.");
        return;
      }

      const pastOrders = JSON.parse(localStorage.getItem("shop_orders") || "[]");
      const isUsed = pastOrders.some((ord) => ord.usedPreviousOrderCode === code);
      if (isUsed) {
        setVoucherError(`Mã ${code} đã được dùng trước đó.`);
        return;
      }

      const rate = Number(shopConfig?.loyaltyDiscountPercent) || 10;
      const maxLoyalty = Number(shopConfig?.loyaltyMaxDiscount) || 50000;

      voucherCandidate = {
        code: code,
        type: "percent",
        value: rate,
        maxDiscount: maxLoyalty,
        canStack: true,
        desc: `Tri ân đơn cũ ${code} (Giảm ${rate}%, tối đa ${maxLoyalty.toLocaleString("vi-VN")}đ)`,
        usedPreviousOrderCode: code,
      };
    } else {
      const availableVouchers = Array.isArray(shopConfig?.vouchers) ? shopConfig.vouchers : [];
      const matched = availableVouchers.find((v) => v.code === code);

      if (!matched) {
        setVoucherError(`Mã "${code}" không tồn tại hoặc đã hết hạn.`);
        return;
      }

      if (matched.usageLimit > 0 && Number(matched.usedCount || 0) >= Number(matched.usageLimit)) {
        setVoucherError(`Mã "${code}" đã hết lượt sử dụng.`);
        return;
      }

      if (matched.minOrder && totalAmount < Number(matched.minOrder)) {
        setVoucherError(
          `Đơn hàng cần từ ${Number(matched.minOrder).toLocaleString("vi-VN")}đ để dùng mã này.`,
        );
        return;
      }

      voucherCandidate = {
        code: matched.code,
        type: matched.type || "fixed",
        value: Number(matched.value) || 0,
        maxDiscount: matched.maxDiscount ? Number(matched.maxDiscount) : null,
        minOrder: Number(matched.minOrder) || 0,
        canStack: matched.canStack ?? true,
        desc: matched.desc || `Mã giảm ${matched.code}`,
      };
    }

    const existingNonStackable = appliedVouchers.find((v) => !v.canStack);
    if (existingNonStackable) {
      setVoucherError(
        `Đơn đang có mã độc quyền "${existingNonStackable.code}". Hãy gỡ ra trước.`,
      );
      return;
    }

    if (!voucherCandidate.canStack) {
      if (appliedVouchers.length > 0) {
        setVoucherError(
          `Mã "${voucherCandidate.code}" là mã độc quyền. Hãy gỡ các mã cũ để áp dụng.`,
        );
        return;
      }
      setAppliedVouchers([voucherCandidate]);
      setVoucherInput("");
      return;
    }

    setAppliedVouchers((prev) => [...prev, voucherCandidate]);
    setVoucherInput("");
  };

  const handleApplyVoucher = (e) => {
    e.preventDefault();
    if (voucherInput.trim()) {
      applySpecificCode(voucherInput);
    }
  };

  const handleRemoveVoucher = (codeToRemove) => {
    setAppliedVouchers((prev) => prev.filter((v) => v.code !== codeToRemove));
    setVoucherError("");
  };

  const finalTotalAmount = Math.max(0, totalAmount - discountAmount);
  const depositAmount = Number(shopConfig?.depositAmount) || 50000;
  const qrTransferAmount =
    paymentMethod === "full_qr" ? finalTotalAmount : depositAmount;
  const rawTransferMemo = `XNG ${cleanPhone || "DATNHO"}`;
  const transferMemo = encodeURIComponent(rawTransferMemo);

  const qrImageUrl = `https://img.vietqr.io/image/${actualBankBin}-${actualAccountNo}-compact.png?amount=${qrTransferAmount}&addInfo=${transferMemo}&accountName=${encodeURIComponent(actualAccountName)}`;

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const handleDownloadQR = async () => {
    if (!qrImageUrl) return;
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `VietQR-${actualAccountNo}-${rawTransferMemo}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(qrImageUrl, "_blank");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nameErr = validateName(customer.name);
    const phoneErr = validatePhone(customer.phone);
    const emailErr = validateEmail(customer.email);

    setFormErrors({
      name: nameErr,
      phone: phoneErr,
      email: emailErr,
    });

    if (nameErr || phoneErr || emailErr) return;

    if (!shippingAddress.trim()) {
      alert("Vui lòng chọn Tỉnh/Thành, Phường/Xã và nhập địa chỉ nhận hàng!");
      return;
    }

    setIsSubmitting(true);
    setPrintStage(1);

    setTimeout(() => setPrintStage(2), 600);
    setTimeout(() => setPrintStage(3), 1200);

    const appliedCodesString = appliedVouchers.map((v) => v.code).join(", ");
    const usedOldCodeItem = appliedVouchers.find((v) => v.usedPreviousOrderCode);
    const chosenGiftObj = paymentGifts.find((g) => g.id === selectedGiftId);

    const orderPayload = {
      customer,
      name: customer.name.trim(),
      phone: customer.phone.trim(),
      email: customer.email.trim(),
      note: customer.note.trim(),
      address: shippingAddress.trim(),
      paymentMethod,
      giftTitle: paymentMethod !== "cod" ? (chosenGiftObj?.title || "") : "Không áp dụng (COD)",
      total: finalTotalAmount,
      rawTotal: totalAmount,
      discount: discountAmount,
      voucherCode: appliedCodesString,
      appliedVouchers: calculatedVouchers,
      usedPreviousOrderCode: usedOldCodeItem?.usedPreviousOrderCode || null,
      cart,
    };

    try {
      await onSubmitOrder(orderPayload);
    } catch (err) {
      console.error("Lỗi đặt hàng:", err);
      alert("Không thể tạo đơn hàng, vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Co giãn chính sách tự động
  const shouldShowFullPolicy = useMemo(() => {
    if (paymentMethod !== "cod" && paymentGifts.length > 0) return cart.length <= 2;
    return cart.length <= 3;
  }, [paymentMethod, paymentGifts.length, cart.length]);

  if (!cart || cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4 font-sans animate-fadeIn">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-inner">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-stone-900">Giỏ hàng của bạn đang trống</h2>
        <p className="text-xs text-stone-500 max-w-sm mx-auto">
          Bạn chưa chọn đặc sản nào từ vườn Xứ Nắng Gió. Hãy ghé gian hàng để lựa chọn nhé!
        </p>
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('shop')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Khám Phá Gian Hàng Ngay</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 font-sans animate-fadeIn">
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden relative">
        {/* HIỆU ỨNG MÁY IN HÓA ĐƠN NHIỆT */}
        {isSubmitting && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="w-80 sm:w-96 bg-stone-800 rounded-t-2xl p-3 border-t-2 border-x-2 border-stone-700 shadow-2xl relative z-20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
                <span className="font-mono text-[11px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5" />
                  <span>Máy In Vườn Xứ Nắng</span>
                </span>
              </div>
              <span className="text-[10px] font-mono text-stone-400">FEEDING...</span>
            </div>

            <div className="w-80 sm:w-96 h-2 bg-stone-900 border-x-2 border-stone-700 relative z-20 shadow-inner flex items-center justify-center">
              <div className="w-3/4 h-0.5 bg-black rounded-full"></div>
            </div>

            <div className="w-72 sm:w-88 bg-[#fffef9] text-stone-900 shadow-2xl p-5 border-x border-b border-stone-300 relative z-10 font-mono text-xs space-y-3.5 transition-all duration-500 ease-out animate-receiptSlideDown">
              <div className="text-center border-b border-dashed border-stone-400 pb-2.5 space-y-0.5">
                <h3 className="font-black text-sm uppercase tracking-wider text-amber-950">XỨ NẮNG GIÓ</h3>
                <p className="text-[10px] text-stone-500">Đặc sản hái giàn chuẩn đất Ninh Thuận</p>
                <p className="text-[9.5px] text-stone-400">Hotline: {shopConfig?.hotline || "0848.957.345"}</p>
              </div>

              <div className="space-y-1 text-[11px] text-stone-700 border-b border-dashed border-stone-400 pb-2.5">
                <div className="flex justify-between">
                  <span className="text-stone-500">Khách hàng:</span>
                  <strong className="text-stone-900">{customer.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Số ĐT:</span>
                  <strong className="text-stone-900">{customer.phone}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Hình thức:</span>
                  <span className="font-semibold text-stone-800">
                    {paymentMethod === "deposit"
                      ? "Cọc giữ hàng"
                      : paymentMethod === "full_qr"
                        ? "Chuyển khoản 100%"
                        : "Trả sau (COD)"}
                  </span>
                </div>
              </div>

              <div className={`space-y-1.5 transition-opacity duration-300 ${printStage >= 2 ? "opacity-100" : "opacity-0"}`}>
                <div className="flex justify-between font-bold text-[10.5px] text-stone-500 border-b border-stone-200 pb-1">
                  <span>TÊN MÓN</span>
                  <span>T.TIỀN</span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-[11px] leading-tight">
                      <span className="truncate pr-2">{item.name} <span className="text-stone-500">x{item.quantity}</span></span>
                      <span className="font-bold shrink-0">{((item.price || 0) * (item.quantity || 1)).toLocaleString("vi-VN")}đ</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`border-t border-dashed border-stone-400 pt-2 space-y-1.5 transition-opacity duration-300 ${printStage >= 3 ? "opacity-100" : "opacity-0"}`}>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[11px] text-emerald-700">
                    <span>Giảm ưu đãi:</span>
                    <span>-{discountAmount.toLocaleString("vi-VN")}đ</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-black text-stone-950 pt-0.5">
                  <span>TỔNG CỘNG:</span>
                  <span className="text-sm font-mono text-amber-900">{finalTotalAmount.toLocaleString("vi-VN")}đ</span>
                </div>

                <div className="pt-2 flex items-center justify-center gap-1.5 text-emerald-700 font-bold text-xs uppercase tracking-wide">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-bounce" />
                  <span>Đã ghi nhận đơn vào hệ thống</span>
                </div>
              </div>

              <div className="absolute -bottom-2 left-0 right-0 h-2 bg-[radial-gradient(circle,transparent_3px,#fffef9_4px)] bg-[length:8px_8px] repeat-x"></div>
            </div>

            <p className="mt-4 text-xs font-mono text-stone-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              <span>Đang xé hóa đơn gửi bếp & đóng thùng xốp...</span>
            </p>
          </div>
        )}

        {/* Header Form */}
        <div className="bg-stone-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('shop')}
              className="p-2 hover:bg-stone-800 rounded-xl text-stone-400 hover:text-white transition-colors cursor-pointer"
              title="Quay lại gian hàng"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide">Xác Nhận Đặt Hàng - Xứ Nắng Gió</h2>
              <p className="text-xs text-stone-400 mt-0.5">Nông sản thu hái tại giàn, bao ăn từng trái, bọc xốp cẩn thận</p>
            </div>
          </div>
        </div>

        {/* LƯỚI 12 CỘT: CỘT TRÁI (7/12 ~ 58%) | CỘT PHẢI (5/12 ~ 42%) */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* ========================================================================= */}
          {/* CỘT TRÁI (7 CỘT): MÓN ĐÃ CHỌN -> QUÀ TẶNG TRƯỢT NGANG -> FORM KHÁCH -> CHÍNH SÁCH */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-5 h-full">
            <div className="space-y-4">
              
              {/* 1. DANH SÁCH SẢN PHẨM */}
              <div className="bg-stone-50/90 rounded-3xl p-4 sm:p-5 border border-stone-200/80 space-y-3.5">
                <div className="flex items-center justify-between border-b border-stone-200/70 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[11px] font-black shadow-2xs">
                      1
                    </span>
                    <h3 className="text-xs sm:text-sm font-black text-stone-900 uppercase tracking-wide flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-amber-700" />
                      <span>Danh Sách Món Đã Chọn ({cart.length} món)</span>
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-amber-900 font-mono">
                    Tạm tính: {totalAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>

                <div className="divide-y divide-stone-200/70 max-h-60 sm:max-h-72 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
                  {cart.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-11 h-11 rounded-xl object-cover shrink-0 border border-stone-200/80 shadow-2xs"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-stone-900 block leading-snug truncate">{item.name}</span>
                          <span className="text-[11px] text-stone-500 block mt-0.5">
                            Quy cách: <strong className="text-stone-700">{item.weightLabel || "Tiêu chuẩn"}</strong>
                            {item.flavor ? ` • ${item.flavor}` : ""} | SL: <strong className="text-amber-800 font-mono font-bold">x{item.quantity}</strong>
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-black text-stone-900 whitespace-nowrap text-sm pl-2">
                        {((item.price || 0) * (item.quantity || 1)).toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. CHỌN QUÀ TẶNG CUỘN NGANG (HORIZONTAL SNAP SCROLL) */}
              {paymentMethod !== "cod" && paymentGifts.length > 0 && (
                <div className="bg-amber-50/80 rounded-3xl p-4 sm:p-5 border border-amber-200/80 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-amber-700 shrink-0" />
                      <span className="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-wide">
                        Chọn Quà Quê Tặng Kèm (Ưu Đãi Chuyển Khoản)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                      Miễn phí 100%
                    </span>
                  </div>

                  <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1.5 pt-0.5 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:thin]">
                    {paymentGifts.map((gift) => {
                      const isSelected = selectedGiftId === gift.id;
                      return (
                        <div
                          key={gift.id}
                          onClick={() => setSelectedGiftId(gift.id)}
                          className={`min-w-[210px] sm:min-w-[230px] max-w-[240px] p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 snap-start shrink-0 select-none ${
                            isSelected
                              ? "bg-white border-amber-600 ring-2 ring-amber-600/20 shadow-sm"
                              : "bg-white/80 border-amber-200/70 hover:bg-white hover:border-amber-400"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-[9.5px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                                {gift.tag || "Quà Quê"}
                              </span>
                              <div
                                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                                  isSelected ? "bg-amber-600 border-amber-600 text-white" : "border-stone-300 bg-white"
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                            </div>

                            <strong className="font-bold text-xs text-stone-900 block leading-snug line-clamp-2">
                              {gift.title}
                            </strong>
                          </div>

                          <p className="text-[10px] text-stone-500 line-clamp-1 leading-tight">
                            {gift.description || "Gửi kèm thùng xốp hái tươi"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. THÔNG TIN KHÁCH HÀNG & ĐỊA CHỈ */}
              <div className="bg-stone-50/90 rounded-3xl p-4 sm:p-5 border border-stone-200/80 space-y-3.5">
                <div className="flex items-center gap-2 border-b border-stone-200/70 pb-3">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[11px] font-black shadow-2xs">
                    2
                  </span>
                  <h3 className="text-xs sm:text-sm font-black text-stone-900 uppercase tracking-wide">
                    Thông Tin Khách Hàng & Địa Chỉ Nhận Hàng
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <div className="relative">
                      <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="Họ và tên người nhận *"
                        value={customer.name}
                        onChange={(e) => {
                          setCustomer({ ...customer, name: e.target.value });
                          if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
                        }}
                        onBlur={() => {
                          setFormErrors((prev) => ({ ...prev, name: validateName(customer.name) }));
                        }}
                        className={`w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border bg-white focus:outline-none font-medium text-stone-800 shadow-2xs transition-colors ${
                          formErrors.name ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30' : 'border-stone-200 focus:border-amber-600'
                        }`}
                      />
                    </div>
                    {formErrors.name && (
                      <p className="text-[10.5px] text-rose-600 font-medium flex items-center gap-1 mt-1 pl-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{formErrors.name}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={10}
                        placeholder="Số điện thoại (đúng 10 số)*"
                        value={customer.phone}
                        onChange={(e) => {
                          const numericOnly = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                          setCustomer({ ...customer, phone: numericOnly });
                          if (formErrors.phone) setFormErrors({ ...formErrors, phone: "" });
                        }}
                        onBlur={() => {
                          setFormErrors((prev) => ({ ...prev, phone: validatePhone(customer.phone) }));
                        }}
                        className={`w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border bg-white focus:outline-none font-mono text-stone-800 shadow-2xs transition-colors ${
                          formErrors.phone ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30' : 'border-stone-200 focus:border-amber-600'
                        }`}
                      />
                    </div>
                    {formErrors.phone && (
                      <p className="text-[10.5px] text-rose-600 font-medium flex items-center gap-1 mt-1 pl-1 animate-fadeIn">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{formErrors.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      placeholder="Email nhận thư cảm ơn & hóa đơn (không bắt buộc)"
                      value={customer.email}
                      onChange={(e) => {
                        setCustomer({ ...customer, email: e.target.value });
                        if (formErrors.email) setFormErrors({ ...formErrors, email: "" });
                      }}
                      onBlur={() => {
                        setFormErrors((prev) => ({ ...prev, email: validateEmail(customer.email) }));
                      }}
                      className={`w-full text-xs pl-9 pr-3 py-2 rounded-xl border bg-white focus:outline-none text-stone-800 shadow-2xs transition-colors ${
                        formErrors.email ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30' : 'border-stone-200 focus:border-amber-600'
                      }`}
                    />
                  </div>
                  {formErrors.email && (
                    <p className="text-[10.5px] text-rose-600 font-medium flex items-center gap-1 mt-1 pl-1 animate-fadeIn">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{formErrors.email}</span>
                    </p>
                  )}
                </div>

                {/* BANNER GỢI Ý DUY NHẤT 1 MÃ KHI NHẬP SĐT */}
                {singleSuggestedVoucher && !isPromoDismissed && (
                  <div className="animate-fadeIn">
                    <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 shadow-2xs ${
                      singleSuggestedVoucher.isLoyalty 
                        ? "bg-emerald-50/90 border-emerald-200" 
                        : "bg-amber-50/90 border-amber-200"
                    }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        {singleSuggestedVoucher.isLoyalty ? (
                          <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Gift className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <span className={`text-[11px] font-bold block truncate ${
                            singleSuggestedVoucher.isLoyalty ? "text-emerald-800" : "text-amber-800"
                          }`}>
                            {singleSuggestedVoucher.title}
                          </span>
                          <span className={`text-[10px] block truncate ${
                            singleSuggestedVoucher.isLoyalty ? "text-emerald-600" : "text-amber-600"
                          }`}>
                            {singleSuggestedVoucher.desc}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => applySpecificCode(singleSuggestedVoucher.code)}
                          className={`px-2.5 py-1 text-white rounded-lg text-[10px] font-bold shadow-xs cursor-pointer ${
                            singleSuggestedVoucher.isLoyalty 
                              ? "bg-emerald-700 hover:bg-emerald-800" 
                              : "bg-amber-600 hover:bg-amber-700"
                          }`}
                        >
                          Dùng mã {singleSuggestedVoucher.code}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsPromoDismissed(true)}
                          className={`p-1 rounded-md cursor-pointer ${
                            singleSuggestedVoucher.isLoyalty 
                              ? "text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100/60" 
                              : "text-amber-600 hover:text-amber-800 hover:bg-amber-100/60"
                          }`}
                          title="Đóng thông báo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-stone-600 block">Địa chỉ nhận hàng *</label>
                  <AddressField value={shippingAddress} onChange={setShippingAddress} />
                </div>

                <div className="relative pt-1">
                  <FileText className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="Ghi chú đóng gói (VD: Giao giờ hành chính, bọc kỹ chống dập...)"
                    value={customer.note}
                    onChange={(e) => setCustomer({ ...customer, note: e.target.value })}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-amber-600 text-stone-600 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* 4. CHÍNH SÁCH CO GIÃN ĐỘNG */}
            <div className="pt-1">
              {shouldShowFullPolicy ? (
                <div className="bg-gradient-to-br from-amber-50/70 via-stone-50 to-emerald-50/40 rounded-3xl p-4 sm:p-5 border border-amber-200/70 shadow-2xs space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-amber-200/50 pb-2">
                    <span className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                      <HeartHandshake className="w-4 h-4 text-amber-700" />
                      <span>Chính Sách Giao Hàng & Bảo Vệ Khách Hàng</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <Sparkle className="w-2.5 h-2.5" />
                      <span>Bao ăn từng quả</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="bg-white/90 p-3 rounded-2xl border border-stone-200/80 space-y-1 shadow-2xs">
                      <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold mb-1">
                        <PackageCheck className="w-3.5 h-3.5" />
                      </div>
                      <strong className="block text-[11px] text-stone-900 font-bold">
                        Đóng thùng xốp dày
                      </strong>
                      <p className="text-[10px] text-stone-500 leading-relaxed">
                        Lưới xốp từng chùm, chèn vụn chống dập khi xe chạy.
                      </p>
                    </div>

                    <div className="bg-white/90 p-3 rounded-2xl border border-stone-200/80 space-y-1 shadow-2xs">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <strong className="block text-[11px] text-stone-900 font-bold">
                        Bao ăn - Bao dập
                      </strong>
                      <p className="text-[10px] text-stone-500 leading-relaxed">
                        Quả dập úng, vườn gửi bù ngay hoặc hoàn tiền 24h.
                      </p>
                    </div>

                    <div className="bg-white/90 p-3 rounded-2xl border border-stone-200/80 space-y-1 shadow-2xs">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold mb-1">
                        <Headphones className="w-3.5 h-3.5" />
                      </div>
                      <strong className="block text-[11px] text-stone-900 font-bold">
                        Báo giờ xe đến
                      </strong>
                      <p className="text-[10px] text-stone-500 leading-relaxed">
                        Thông báo biển số xe và giờ xe tới để bạn đón hàng.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gradient-to-r from-amber-50/90 via-white to-amber-50/50 rounded-2xl border border-amber-200/80 shadow-2xs flex items-center justify-between text-xs animate-fadeIn">
                  <span className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
                    <BadgeCheck className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Bao ăn từng quả • Đóng thùng xốp dày • Đổi trả bù trong 24h</span>
                  </span>
                  <span className="text-[10.5px] font-mono font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md shrink-0">
                    Hotline: {shopConfig?.hotline || "0848.957.345"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CỘT PHẢI (5 CỘT): VOUCHER -> THANH TOÁN -> VIETQR / COD TIMELINE */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 bg-stone-50/90 rounded-3xl p-4 sm:p-5 border border-stone-200/90 shadow-xs flex flex-col justify-between gap-4 h-full">
            <div className="space-y-4">
              <div className="border-b border-stone-200/70 pb-3">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white inline-flex items-center justify-center text-[11px] font-black mr-2 shadow-2xs">
                  3
                </span>
                <span className="text-xs sm:text-sm font-black text-stone-900 uppercase tracking-wide">
                  Ưu Đãi & Thanh Toán
                </span>
                <p className="text-[11px] text-stone-500 mt-0.5 pl-7">
                  Nhập mã giảm giá và chọn phương thức nhận
                </p>
              </div>

              {/* Ô Nhập Voucher */}
              <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                    <span>Mã Ưu Đãi / Voucher</span>
                  </span>
                </div>

                <div className="flex gap-1.5">
                  <input
                    type="text"
                    disabled={appliedVouchers.length >= MAX_VOUCHERS}
                    placeholder="Nhập mã ưu đãi..."
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value)}
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-amber-600 font-mono uppercase text-stone-800 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    disabled={appliedVouchers.length >= MAX_VOUCHERS}
                    onClick={handleApplyVoucher}
                    className="px-3.5 py-2 bg-stone-900 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer"
                  >
                    Áp dụng
                  </button>
                </div>

                {voucherError && (
                  <p className="text-[10.5px] text-red-600 font-medium leading-tight">{voucherError}</p>
                )}

                {calculatedVouchers.length > 0 && (
                  <div className="space-y-1.5 pt-1 max-h-32 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
                    {calculatedVouchers.map((v) => (
                      <div key={v.code} className="flex items-center justify-between bg-amber-50/90 border border-amber-300 px-2.5 py-1.5 rounded-xl text-xs shadow-2xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <div className="truncate">
                            <span className="font-mono font-bold text-amber-900">{v.code}</span>
                            <span className="text-[10.5px] text-amber-800 ml-1 font-medium">(-{v.currentDiscount.toLocaleString("vi-VN")}đ)</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVoucher(v.code)}
                          className="text-stone-400 hover:text-red-500 p-1 cursor-pointer"
                          title="Gỡ mã này"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3 Tùy chọn thanh toán */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-stone-700 block">Chọn hình thức thanh toán:</label>
                <div className="grid grid-cols-1 gap-2">
                  <label className={`cursor-pointer p-2.5 rounded-2xl border transition-all flex items-center justify-between ${
                    paymentMethod === "deposit" ? "border-amber-600 bg-amber-50 ring-1 ring-amber-600 shadow-xs" : "border-stone-200 bg-white hover:bg-stone-50"
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className={`w-4 h-4 shrink-0 ${paymentMethod === "deposit" ? "text-amber-700" : "text-stone-400"}`} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <strong className="text-xs text-stone-900 font-bold">Cọc {depositAmount.toLocaleString("vi-VN")}đ</strong>
                          <span className="text-[9.5px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-md font-bold">+ Tặng Quà</span>
                        </div>
                        <span className="text-[10px] text-stone-500 block leading-tight">Giữ đơn hái tươi • Phần còn lại nhà xe thu</span>
                      </div>
                    </div>
                    <input type="radio" name="paymentMethod" value="deposit" checked={paymentMethod === "deposit"} onChange={() => setPaymentMethod("deposit")} className="accent-amber-600" />
                  </label>

                  <label className={`cursor-pointer p-2.5 rounded-2xl border transition-all flex items-center justify-between ${
                    paymentMethod === "full_qr" ? "border-amber-600 bg-amber-50 ring-1 ring-amber-600 shadow-xs" : "border-stone-200 bg-white hover:bg-stone-50"
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <QrCode className={`w-4 h-4 shrink-0 ${paymentMethod === "full_qr" ? "text-amber-700" : "text-stone-400"}`} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <strong className="text-xs text-stone-900 font-bold">Chuyển khoản 100%</strong>
                          <span className="text-[9.5px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded-md font-bold">+ Tặng Quà</span>
                        </div>
                        <span className="text-[10px] text-stone-500 block leading-tight">Quét VietQR • Nhận hàng không cần tiền mặt</span>
                      </div>
                    </div>
                    <input type="radio" name="paymentMethod" value="full_qr" checked={paymentMethod === "full_qr"} onChange={() => setPaymentMethod("full_qr")} className="accent-amber-600" />
                  </label>

                  <label className={`cursor-pointer p-2.5 rounded-2xl border transition-all flex items-center justify-between ${
                    paymentMethod === "cod" ? "border-amber-600 bg-amber-50 ring-1 ring-amber-600 shadow-xs" : "border-stone-200 bg-white hover:bg-stone-50"
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <Truck className={`w-4 h-4 shrink-0 ${paymentMethod === "cod" ? "text-amber-700" : "text-stone-400"}`} />
                      <div>
                        <strong className="block text-xs text-stone-900 font-bold">Trả sau (COD Toàn Phần)</strong>
                        <span className="text-[10px] text-stone-500 block leading-tight">Vườn gọi xác nhận • Thanh toán 100% khi nhận hàng</span>
                      </div>
                    </div>
                    <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="accent-amber-600" />
                  </label>
                </div>
              </div>

              {/* KHỐI ĐỘNG CỘT PHẢI: TIMELINE COD HOẶC MÃ VIETQR */}
              <div>
                {paymentMethod === "cod" ? (
                  <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-3.5 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-xs font-black text-stone-900 uppercase tracking-wide">
                          Quy Trình Giao Xe Thu COD
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Trả sau 100%
                      </span>
                    </div>

                    <div className="relative pl-5 space-y-3 text-xs before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                      <div className="relative">
                        <span className="absolute -left-5 top-0.5 w-4 h-4 rounded-full bg-amber-500 text-white font-bold text-[9px] flex items-center justify-center ring-2 ring-white">
                          1
                        </span>
                        <div>
                          <strong className="text-stone-900 font-bold block text-[11px]">
                            Vườn chốt giờ xe
                          </strong>
                          <p className="text-[10px] text-stone-500 leading-tight mt-0.5">
                            Gọi thông báo biển số xe và giờ xe tới điểm đón.
                          </p>
                        </div>
                      </div>

                      <div className="relative">
                        <span className="absolute -left-5 top-0.5 w-4 h-4 rounded-full bg-amber-600 text-white font-bold text-[9px] flex items-center justify-center ring-2 ring-white">
                          2
                        </span>
                        <div>
                          <div className="flex items-center justify-between">
                            <strong className="text-stone-900 font-bold text-[11px]">
                              Đóng thùng xốp dán tem COD
                            </strong>
                            <span className="text-[10px] text-amber-700 font-mono font-bold bg-amber-50 px-1 rounded border border-amber-200/60">
                              {finalTotalAmount.toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                          <p className="text-[10px] text-stone-500 leading-tight mt-0.5">
                            Thùng niêm phong ghi đúng tiền thu hộ, không phụ phí.
                          </p>
                        </div>
                      </div>

                      <div className="relative">
                        <span className="absolute -left-5 top-0.5 w-4 h-4 rounded-full bg-emerald-600 text-white font-bold text-[9px] flex items-center justify-center ring-2 ring-white">
                          3
                        </span>
                        <div>
                          <strong className="text-stone-900 font-bold block text-[11px]">
                            Kiểm tra thùng & nhận hàng
                          </strong>
                          <p className="text-[10px] text-stone-500 leading-tight mt-0.5">
                            Nhận thùng nguyên vẹn từ tài xế rồi thanh toán tiền mặt.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-2xs space-y-3 animate-fadeIn text-center">
                    <div>
                      <span className="text-xs font-black text-amber-900 block">
                        {paymentMethod === "deposit" ? `Quét VietQR Cọc ${depositAmount.toLocaleString("vi-VN")}đ` : "Quét VietQR Chuyển Khoản 100%"}
                      </span>
                      <span className="text-[10px] text-stone-400 block mt-0.5">
                        Tự động khớp số tài khoản, số tiền & nội dung
                      </span>
                    </div>

                    <div className="relative inline-block mx-auto py-0.5">
                      <img
                        src={qrImageUrl}
                        alt="VietQR Chuyển khoản"
                        className="w-40 h-40 sm:w-44 sm:h-44 mx-auto rounded-2xl border border-amber-100 shadow-2xs object-contain p-2 bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto w-full">
                      <a
                        href={`https://dl.vietqr.io/pay?app=&ba=${actualBankBin}&acc=${actualAccountNo}&am=${qrTransferAmount}&des=${transferMemo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-2 bg-stone-900 hover:bg-amber-600 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Mở App Ngân Hàng</span>
                      </a>
                      <button
                        type="button"
                        onClick={handleDownloadQR}
                        className="py-1.5 px-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-colors border border-stone-200 shadow-2xs cursor-pointer"
                      >
                        <Download className="w-3 h-3 text-amber-600" />
                        <span>Lưu ảnh QR</span>
                      </button>
                    </div>

                    <div className="bg-stone-50/90 p-2.5 rounded-xl border border-stone-200/80 space-y-1 text-[11px] text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Ngân hàng:</span>
                        <strong className="text-stone-800">{actualBankName}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Số tài khoản:</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(actualAccountNo, "stk")}
                          className="flex items-center gap-1 font-mono font-bold text-stone-900 hover:text-amber-700 bg-white px-2 py-0.5 rounded-md border border-stone-200 shadow-2xs cursor-pointer"
                        >
                          <span>{actualAccountNo}</span>
                          {copiedField === "stk" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-stone-400" />}
                        </button>
                      </div>
                      <div className="flex items-center justify-between pt-0.5 border-t border-stone-200/60">
                        <span className="text-stone-500">Nội dung CK:</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(rawTransferMemo, "memo")}
                          className="flex items-center gap-1 font-mono font-bold text-amber-900 hover:text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200/80 shadow-2xs cursor-pointer"
                        >
                          <span>{rawTransferMemo}</span>
                          {copiedField === "memo" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-amber-600" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* BẢNG TÍNH TIỀN & NÚT ĐẶT HÀNG (NEO CHÂN CỘT PHẢI) */}
            <div className="space-y-3 pt-2">
              <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Tạm tính tiền hàng:</span>
                  <span className="font-mono font-bold">{totalAmount.toLocaleString("vi-VN")}đ</span>
                </div>

                {calculatedVouchers.length > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Giảm ưu đãi:</span>
                    <span className="font-mono font-bold">-{discountAmount.toLocaleString("vi-VN")}đ</span>
                  </div>
                )}

                <div className="flex justify-between text-stone-900 font-black border-t border-stone-100 pt-2 text-sm">
                  <span>Tổng thanh toán:</span>
                  <span className="font-mono text-amber-900">{finalTotalAmount.toLocaleString("vi-VN")}đ</span>
                </div>

                <div className="flex justify-between text-stone-500 text-[11px] pt-0.5">
                  <span>Thanh toán ngay:</span>
                  <span className="font-mono font-bold text-stone-800">
                    {paymentMethod === "cod" ? "0đ (Trả khi nhận)" : `${qrTransferAmount.toLocaleString("vi-VN")}đ`}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang Gửi Đơn Về Vườn...</span>
                  </>
                ) : (
                  <>
                    <span>Xác Nhận Đặt Hàng Ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}