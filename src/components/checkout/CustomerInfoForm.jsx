// src/components/checkout/CustomerInfoForm.jsx
import React from 'react';
import { 
  User, Phone, Mail, FileText, AlertCircle, 
  AlertTriangle, ShieldBan, UserCheck, Gift, X 
} from 'lucide-react';
import AddressField from '../AddressField';

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
  return (
    <div className="bg-stone-50/90 rounded-3xl p-4 sm:p-5 border border-stone-200/80 space-y-3.5">
      {/* Tiêu đề nhóm */}
      <div className="flex items-center gap-2 border-b border-stone-200/70 pb-3">
        <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[11px] font-black shadow-2xs">
          2
        </span>
        <h3 className="text-xs sm:text-sm font-black text-stone-900 uppercase tracking-wide">
          Thông Tin Khách Hàng & Địa Chỉ Nhận Hàng
        </h3>
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

      {/* Email */}
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

      {/* Cảnh báo rủi ro (Bom hàng hoặc Hủy nhiều lần) */}
      {customerHistory?.hasBombedHistory ? (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 text-xs flex items-start gap-2.5 shadow-2xs animate-fadeIn">
          <ShieldBan className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <strong className="block text-[11px] font-black text-rose-900">
              Yêu cầu thanh toán trước 100%:
            </strong>
            <p className="text-[10.5px] text-rose-800">
              Số điện thoại này từng có kiện hàng gửi không người nhận hoặc không đón xe. Vì trái cây chín tới hái tại giàn chỉ bảo quản mát trong ngày, để đảm bảo xuất bến an toàn, quý khách vui lòng <strong>thanh toán chuyển khoản 100%</strong> qua VietQR. Cảm ơn sự hợp tác của quý khách!
            </p>
          </div>
        </div>
      ) : customerHistory?.isFrequentCanceller && (
        <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 text-xs flex items-start gap-2.5 shadow-2xs animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <strong className="block text-[11px] font-bold text-amber-900">
              Lưu ý đặt hàng nông sản tươi:
            </strong>
            <p className="text-[10.5px] text-amber-800">
              Để nhà vườn kịp sắp xếp chuyến xe và giữ quả ngon, đơn hàng này tạm thời không áp dụng COD toàn phần, quý khách vui lòng chọn đặt cọc hoặc chuyển khoản trước.
            </p>
          </div>
        </div>
      )}

      {/* Banner gợi ý voucher thông minh */}
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
                onClick={() => onApplySpecificCode(singleSuggestedVoucher.code)}
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

      {/* Địa chỉ giao hàng */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-stone-600 block">Địa chỉ nhận hàng *</label>
        <AddressField value={shippingAddress} onChange={setShippingAddress} />
      </div>

      {/* Ghi chú */}
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
  );
}