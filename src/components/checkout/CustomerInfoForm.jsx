// src/components/checkout/CustomerInfoForm.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, Phone, Mail, FileText, AlertCircle, 
  AlertTriangle, ShieldBan, UserCheck, Gift, X, Sparkles, MapPin, Plus
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

  const isPhoneStrictlyValid = useMemo(() => {
    return isValidVietnamesePhone(customer.phone);
  }, [customer.phone]);

  const prevInfo = customerHistory?.previousInfo;
  const hasSavedAddress = Boolean(isPhoneStrictlyValid && customerHistory?.isOldCustomer && prevInfo?.address);

  // Khi nhận diện đúng là khách cũ có địa chỉ -> Tự chọn mode 'saved' và set địa chỉ
  useEffect(() => {
    if (hasSavedAddress && addressMode === 'saved') {
      setShippingAddress(prevInfo.address);
      if (prevInfo.name && !customer.name?.trim()) {
        setCustomer((prev) => ({ ...prev, name: prevInfo.name }));
      }
    }
  }, [hasSavedAddress, prevInfo?.address]);

  const handlePhoneChange = (e) => {
    const formatted = sanitizeVietnamesePhone(e.target.value);
    setCustomer({ ...customer, phone: formatted });

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
    setCustomer({ ...customer, phone: formatted });
    if (formatted.length === 10) {
      const err = validatePhone(formatted);
      setFormErrors((prev) => ({ ...prev, phone: err }));
    }
  };

  return (
    <div className="bg-stone-50/90 rounded-3xl p-4 sm:p-5 border border-stone-200/80 space-y-4 font-sans">
      {/* Tiêu đề nhóm */}
      <div className="flex items-center justify-between border-b border-stone-200/70 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[11px] font-black shadow-2xs">
            2
          </span>
          <h3 className="text-xs sm:text-sm font-black text-stone-900 uppercase tracking-wide">
            Thông Tin Khách Hàng & Địa Chỉ Nhận Hàng
          </h3>
        </div>

        {isPhoneStrictlyValid && customerHistory?.isOldCustomer && (
          <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-700" />
            <span>Khách thân thiết</span>
          </span>
        )}
      </div>

      {/* Họ tên & Số điện thoại */}
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
                if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
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
              onChange={handlePhoneChange}
              onPaste={handlePhonePaste}
              onBlur={() => {
                setFormErrors((prev) => ({ ...prev, phone: validatePhone(customer.phone) }));
              }}
              className={`w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border bg-white focus:outline-none font-mono text-stone-800 shadow-2xs transition-colors ${
                formErrors.phone ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30' : 'border-stone-200 focus:border-amber-600'
              }`}
            />
          </div>
          {formErrors.phone && (
            <p className="text-[10.5px] text-rose-600 font-medium flex items-center gap-1 mt-1 pl-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{formErrors.phone}</span>
            </p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <div className="relative">
          <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="email"
            placeholder="Email nhận thư cảm ơn & hóa đơn (không bắt buộc)"
            value={customer.email || ''}
            onChange={(e) => {
              setCustomer({ ...customer, email: e.target.value });
              if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
            }}
            onBlur={() => {
              setFormErrors((prev) => ({ ...prev, email: validateEmail(customer.email) }));
            }}
            className={`w-full text-xs pl-9 pr-3 py-2 rounded-xl border bg-white focus:outline-none text-stone-800 shadow-2xs transition-colors ${
              formErrors.email ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30' : 'border-stone-200 focus:border-amber-600'
            }`}
          />
        </div>
      </div>

      {/* Cảnh báo rủi ro Bom hàng */}
      {isPhoneStrictlyValid && customerHistory?.hasBombedHistory && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 text-xs flex items-start gap-2.5">
          <ShieldBan className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-[10.5px] text-rose-800">
            Số điện thoại này từng có đơn hoàn về. Quý khách vui lòng <strong>thanh toán chuyển khoản 100%</strong> qua VietQR để nhà vườn tiến hành hái quả.
          </p>
        </div>
      )}

      {/* BANNER VOUCHER TRI ÂN (GỌN GÀNG, CHUYÊN BIỆT CHO MÃ) */}
      {isPhoneStrictlyValid && singleSuggestedVoucher && !isPromoDismissed && (
        <div className="animate-fadeIn">
          <div className="p-2.5 rounded-2xl border bg-emerald-50/90 border-emerald-300 flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-emerald-950 block truncate">
                  {singleSuggestedVoucher.title}
                </span>
                <span className="text-[10px] text-emerald-700 block truncate">
                  {singleSuggestedVoucher.desc}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onApplySpecificCode(singleSuggestedVoucher.code)}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[10.5px] font-bold shadow-xs cursor-pointer active:scale-95"
              >
                Áp dụng mã
              </button>
              <button
                type="button"
                onClick={() => setIsPromoDismissed(true)}
                className="p-1 text-emerald-700 hover:bg-emerald-100 rounded-lg cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MỤC ĐỊA CHỈ NHẬN HÀNG (TỰ ĐỘNG NHẬN DIỆN THÔNG MINH) */}
      <div className="space-y-2 pt-1">
        <label className="text-[11px] font-bold text-stone-700 flex items-center justify-between">
          <span>Địa chỉ nhận hàng *</span>
          {hasSavedAddress && (
            <span className="text-[10px] font-normal text-stone-500">
              {addressMode === 'saved' ? 'Đang dùng địa chỉ đơn trước' : 'Đang nhập địa chỉ mới'}
            </span>
          )}
        </label>

        {/* NẾU LÀ KHÁCH CŨ: HIỂN THỊ THẺ CHỌN ĐỊA CHỈ TRỰC QUAN */}
        {hasSavedAddress ? (
          <div className="space-y-2">
            {/* Thẻ 1: Địa chỉ cũ */}
            <div
              onClick={() => {
                setAddressMode('saved');
                setShippingAddress(prevInfo.address);
              }}
              className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                addressMode === 'saved'
                  ? 'bg-amber-50/80 border-amber-500 shadow-2xs ring-1 ring-amber-500/30'
                  : 'bg-white border-stone-200 hover:border-stone-300'
              }`}
            >
              <input
                type="radio"
                name="addressChoice"
                checked={addressMode === 'saved'}
                onChange={() => {}}
                className="mt-0.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 font-bold text-stone-900 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Địa chỉ đã giao gần nhất:</span>
                </div>
                <p className="text-[11px] text-stone-700 leading-relaxed font-medium">
                  {prevInfo.address}
                </p>
              </div>
            </div>

            {/* Thẻ 2: Tùy chọn nhập địa chỉ khác */}
            <div
              onClick={() => {
                setAddressMode('new');
                setShippingAddress('');
              }}
              className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex items-center gap-2.5 ${
                addressMode === 'new'
                  ? 'bg-white border-amber-500 shadow-2xs ring-1 ring-amber-500/30'
                  : 'bg-white border-stone-200 hover:border-stone-300 text-stone-600'
              }`}
            >
              <input
                type="radio"
                name="addressChoice"
                checked={addressMode === 'new'}
                onChange={() => {}}
                className="text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <div className="flex items-center gap-1.5 font-bold text-[11px] text-stone-800">
                <Plus className="w-3.5 h-3.5 text-stone-500" />
                <span>Giao đến địa chỉ khác</span>
              </div>
            </div>

            {/* Nếu chọn nhập địa chỉ mới thì mới render ô AddressField */}
            {addressMode === 'new' && (
              <div className="pt-1 animate-fadeIn">
                <AddressField value={shippingAddress} onChange={setShippingAddress} />
              </div>
            )}
          </div>
        ) : (
          /* NẾU LÀ KHÁCH MỚI: HIỂN THỊ Ô ADDRESSFIELD BÌNH THƯỜNG */
          <AddressField value={shippingAddress} onChange={setShippingAddress} />
        )}
      </div>

      {/* Ghi chú */}
      <div className="relative pt-1">
        <FileText className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
        <input
          type="text"
          placeholder="Ghi chú đóng gói (VD: Giao giờ hành chính, bọc kỹ chống dập...)"
          value={customer.note || ''}
          onChange={(e) => setCustomer({ ...customer, note: e.target.value })}
          className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-amber-600 text-stone-600 shadow-2xs"
        />
      </div>
    </div>
  );
}