// src/components/checkout/CustomerInfoForm.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, Phone, Mail, FileText, AlertCircle, 
  ShieldBan, UserCheck, X, Sparkles, MapPin, Plus, CheckCircle2
} from 'lucide-react';
import AddressField from '../AddressField';
import { sanitizeVietnamesePhone, isValidVietnamesePhone } from '../../utils/checkoutValidation';

export default function CustomerInfoForm({
  customer,
  setCustomer,
  shippingAddress,
  setShippingAddress,
  formErrors,
  setFormErrors,
  validateName,
  validatePhone,
  validateEmail,
  customerHistory,
  singleSuggestedVoucher,
  isPromoDismissed,
  setIsPromoDismissed,
  onApplySpecificCode,
}) {
  // Mode chọn địa chỉ: 'saved' (địa chỉ cũ) hoặc 'new' (nhập mới)
  const [addressMode, setAddressMode] = useState('saved');
  // State lưu tạm địa chỉ mới để không bị mất khi chuyển qua lại giữa 2 lựa chọn
  const [customAddress, setCustomAddress] = useState('');

  const isPhoneStrictlyValid = useMemo(() => {
    return isValidVietnamesePhone(customer.phone);
  }, [customer.phone]);

  const prevInfo = customerHistory?.previousInfo;
  const isPardoned = Boolean(customerHistory?.isPardoned);
  const hasSavedAddress = Boolean(isPhoneStrictlyValid && customerHistory?.isOldCustomer && prevInfo?.address);

  // Tự động điền tên và địa chỉ cũ khi phát hiện khách quen
  useEffect(() => {
    if (hasSavedAddress && addressMode === 'saved') {
      if (prevInfo?.address && shippingAddress !== prevInfo.address) {
        setShippingAddress(prevInfo.address);
        if (formErrors?.address) {
          setFormErrors((prev) => ({ ...prev, address: '' }));
        }
      }
      if (prevInfo?.name && !customer.name?.trim()) {
        setCustomer((prev) => ({ ...prev, name: prevInfo.name }));
      }
    }
  }, [
    hasSavedAddress, 
    addressMode, 
    prevInfo?.address, 
    prevInfo?.name, 
    shippingAddress, 
    customer.name, 
    setShippingAddress, 
    setCustomer, 
    formErrors?.address, 
    setFormErrors
  ]);

  const handlePhoneChange = (e) => {
    const formatted = sanitizeVietnamesePhone(e.target.value);
    setCustomer((prev) => ({ ...prev, phone: formatted }));

    if (formatted.length < 10) {
      if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: '' }));
    } else if (formatted.length === 10) {
      const err = validatePhone(formatted);
      setFormErrors((prev) => ({ ...prev, phone: err }));
    }
  };

  const handlePhonePaste = (e) => {
    e.preventDefault();
    const formatted = sanitizeVietnamesePhone(e.clipboardData.getData('text'));
    setCustomer((prev) => ({ ...prev, phone: formatted }));
    if (formatted.length === 10) {
      const err = validatePhone(formatted);
      setFormErrors((prev) => ({ ...prev, phone: err }));
    }
  };

  // Chuyển sang nhập địa chỉ mới
  const handleSelectNewAddressMode = () => {
    setAddressMode('new');
    setShippingAddress(customAddress);
    if (formErrors?.address && customAddress.trim()) {
      setFormErrors((prev) => ({ ...prev, address: '' }));
    }
  };

  // Dùng lại địa chỉ cũ
  const handleSelectSavedAddressMode = () => {
    setAddressMode('saved');
    if (prevInfo?.address) {
      setShippingAddress(prevInfo.address);
      if (formErrors?.address) {
        setFormErrors((prev) => ({ ...prev, address: '' }));
      }
    }
  };

  // Nhận địa chỉ mới từ AddressField
  const handleNewAddressInput = (newAddr) => {
    setCustomAddress(newAddr);
    setShippingAddress(newAddr);
    if (newAddr && formErrors?.address) {
      setFormErrors((prev) => ({ ...prev, address: '' }));
    }
  };

  return (
    <div className="bg-stone-50/90 rounded-3xl p-5 sm:p-6 border border-stone-200/90 space-y-4 sm:space-y-5 font-sans text-stone-800">
      
      {/* Tiêu đề nhóm */}
      <div className="flex items-center justify-between border-b border-stone-200/70 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-black shadow-2xs">
            2
          </span>
          <h3 className="text-sm sm:text-base font-black text-stone-900 uppercase tracking-wide">
            Thông Tin Khách Hàng & Địa Chỉ Nhận Hàng
          </h3>
        </div>

        {isPhoneStrictlyValid && customerHistory?.isOldCustomer && (
          <span className="text-xs font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Khách thân thiết</span>
          </span>
        )}
      </div>

      {/* Họ tên & Số điện thoại */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <div className="relative">
            <User className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              placeholder="Họ và tên người nhận *"
              value={customer.name}
              onChange={(e) => {
                setCustomer((prev) => ({ ...prev, name: e.target.value }));
                if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }));
              }}
              onBlur={() => {
                setFormErrors((prev) => ({ ...prev, name: validateName(customer.name) }));
              }}
              className={`w-full text-sm sm:text-base pl-11 pr-4 py-3 rounded-2xl border bg-white focus:outline-none font-medium text-stone-900 shadow-2xs transition-colors ${
                formErrors.name ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30' : 'border-stone-200 focus:border-amber-600 ring-2 ring-transparent focus:ring-amber-500/10'
              }`}
            />
          </div>
          {formErrors.name && (
            <p className="text-xs sm:text-sm text-rose-600 font-semibold flex items-center gap-1.5 mt-1.5 pl-1 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formErrors.name}</span>
            </p>
          )}
        </div>

        <div>
          <div className="relative">
            <Phone className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="tel"
              required
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
              placeholder="Số điện thoại (đúng 10 số)*"
              value={customer.phone}
              onChange={handlePhoneChange}
              onPaste={handlePhonePaste}
              onBlur={() => {
                setFormErrors((prev) => ({ ...prev, phone: validatePhone(customer.phone) }));
              }}
              className={`w-full text-sm sm:text-base pl-11 pr-4 py-3 rounded-2xl border bg-white focus:outline-none font-mono font-bold text-stone-900 shadow-2xs transition-colors ${
                formErrors.phone ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30' : 'border-stone-200 focus:border-amber-600 ring-2 ring-transparent focus:ring-amber-500/10'
              }`}
            />
          </div>
          {formErrors.phone && (
            <p className="text-xs sm:text-sm text-rose-600 font-semibold flex items-center gap-1.5 mt-1.5 pl-1 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formErrors.phone}</span>
            </p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <div className="relative">
          <Mail className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" />
          <input
            type="email"
            placeholder="Email nhận thư cảm ơn & hóa đơn (không bắt buộc)"
            value={customer.email || ''}
            onChange={(e) => {
              setCustomer((prev) => ({ ...prev, email: e.target.value }));
              if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: '' }));
            }}
            onBlur={() => {
              setFormErrors((prev) => ({ ...prev, email: validateEmail(customer.email) }));
            }}
            className={`w-full text-sm sm:text-base pl-11 pr-4 py-3 rounded-2xl border bg-white focus:outline-none text-stone-800 shadow-2xs transition-colors ${
              formErrors.email ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30' : 'border-stone-200 focus:border-amber-600 ring-2 ring-transparent focus:ring-amber-500/10'
            }`}
          />
        </div>
        {formErrors?.email && (
          <p className="text-xs sm:text-sm text-rose-600 font-semibold flex items-center gap-1.5 mt-1.5 pl-1 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formErrors.email}</span>
          </p>
        )}
      </div>

      {/* Cảnh báo rủi ro Bom hàng */}
      {isPhoneStrictlyValid && customerHistory?.hasBombedHistory && !isPardoned && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 text-xs sm:text-sm flex items-start gap-3 animate-fadeIn">
          <ShieldBan className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-rose-900 leading-relaxed font-normal">
            Số điện thoại này từng có đơn hoàn về. Quý khách vui lòng <strong>thanh toán chuyển khoản 100%</strong> qua VietQR để nhà vườn tiến hành cắt hái và gửi xe.
          </p>
        </div>
      )}

      {/* Huy hiệu khôi phục uy tín thành công */}
      {isPhoneStrictlyValid && isPardoned && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs sm:text-sm flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs sm:text-sm text-emerald-900 font-medium">
            Cảm ơn quý khách đã tin tưởng nhận hàng ở đơn gần nhất. Chúc quý khách chọn được những chùm quả ưng ý!
          </span>
        </div>
      )}

      {/* BANNER VOUCHER TRI ÂN */}
      {isPhoneStrictlyValid && singleSuggestedVoucher && !isPromoDismissed && (
        <div className="animate-fadeIn">
          <div className="p-3.5 rounded-2xl border bg-emerald-50/90 border-emerald-300 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <UserCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold text-emerald-950 block truncate">
                  {singleSuggestedVoucher.title}
                </span>
                <span className="text-xs text-emerald-700 block truncate font-normal">
                  {singleSuggestedVoucher.desc}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onApplySpecificCode(singleSuggestedVoucher.code)}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                Áp dụng mã
              </button>
              <button
                type="button"
                onClick={() => setIsPromoDismissed(true)}
                className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MỤC ĐỊA CHỈ NHẬN HÀNG */}
      <div className="space-y-2.5 pt-1">
        <label className="text-xs sm:text-sm font-bold text-stone-700 flex items-center justify-between">
          <span>Địa chỉ nhận hàng *</span>
          {hasSavedAddress && (
            <span className="text-xs font-normal text-stone-500">
              {addressMode === 'saved' ? 'Đang dùng địa chỉ đơn trước' : 'Đang nhập địa chỉ mới'}
            </span>
          )}
        </label>

        {hasSavedAddress ? (
          <div className="space-y-2.5">
            {/* Thẻ 1: Địa chỉ cũ */}
            <div
              onClick={handleSelectSavedAddressMode}
              className={`p-4 rounded-2xl border text-xs sm:text-sm cursor-pointer transition-all flex items-start gap-3 ${
                addressMode === 'saved'
                  ? 'bg-amber-50/80 border-amber-500 shadow-2xs ring-2 ring-amber-500/20'
                  : 'bg-white border-stone-200 hover:border-stone-300'
              }`}
            >
              <input
                type="radio"
                name="addressChoice"
                checked={addressMode === 'saved'}
                onChange={handleSelectSavedAddressMode}
                className="mt-1 text-amber-600 focus:ring-amber-500 cursor-pointer w-4 h-4"
              />
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 font-bold text-stone-900 text-xs sm:text-sm">
                  <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Địa chỉ đã giao gần nhất:</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
                  {prevInfo.address}
                </p>
              </div>
            </div>

            {/* Thẻ 2: Tùy chọn nhập địa chỉ khác */}
            <div
              onClick={handleSelectNewAddressMode}
              className={`p-4 rounded-2xl border text-xs sm:text-sm cursor-pointer transition-all flex items-center gap-3 ${
                addressMode === 'new'
                  ? 'bg-white border-amber-500 shadow-2xs ring-2 ring-amber-500/20'
                  : 'bg-white border-stone-200 hover:border-stone-300 text-stone-600'
              }`}
            >
              <input
                type="radio"
                name="addressChoice"
                checked={addressMode === 'new'}
                onChange={handleSelectNewAddressMode}
                className="text-amber-600 focus:ring-amber-500 cursor-pointer w-4 h-4"
              />
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-stone-800">
                <Plus className="w-4 h-4 text-stone-500" />
                <span>Giao đến địa chỉ khác</span>
              </div>
            </div>

            {/* Render AddressField khi chọn nhập mới */}
            {addressMode === 'new' && (
              <div className="pt-1.5 animate-fadeIn">
                <AddressField 
                  value={customAddress} 
                  onChange={handleNewAddressInput}
                  error={formErrors?.address}
                />
              </div>
            )}

            {/* Lỗi địa chỉ cũ */}
            {addressMode === 'saved' && formErrors?.address && (
              <p className="text-xs sm:text-sm text-rose-600 font-semibold flex items-center gap-1.5 pl-1 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formErrors.address}</span>
              </p>
            )}
          </div>
        ) : (
          <AddressField 
            value={shippingAddress} 
            onChange={(newAddr) => {
              setShippingAddress(newAddr);
              if (newAddr && formErrors?.address) {
                setFormErrors((prev) => ({ ...prev, address: '' }));
              }
            }}
            error={formErrors?.address}
          />
        )}
      </div>

      {/* Ghi chú */}
      <div className="relative pt-1">
        <FileText className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Ghi chú đóng gói (VD: Giao giờ hành chính, bọc kỹ chống dập...)"
          value={customer.note || ''}
          onChange={(e) => setCustomer((prev) => ({ ...prev, note: e.target.value }))}
          className="w-full text-xs sm:text-sm pl-11 pr-4 py-3 rounded-2xl border border-stone-200 bg-white focus:outline-none focus:border-amber-600 text-stone-800 shadow-2xs font-normal transition-colors"
        />
      </div>
    </div>
  );
}