// src/components/tenant/TenantRegisterModal.jsx
import React, { useState } from 'react';
import { Sparkles, X, Mail } from 'lucide-react';

export default function TenantRegisterModal({ isOpen, onClose, adminBankConfig }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    owner_name: '',
    phone: '',
    email: '',
    plan_tier: 'standard',
    bank_name: 'MBBank',
    bank_account: '',
  });
  const [invoice, setInvoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const fee = formData.plan_tier === 'pro' ? 1200000 : 500000;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const invoiceCode = `INV-${Date.now().toString().slice(-4)}`;
    const slug = formData.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');

    const newTenant = {
      ...formData,
      id: slug,
      fee_amount: fee,
      invoice_code: invoiceCode,
      status: 'pending_approval',
      payment_status: 'pending',
    };

    setInvoice(newTenant);
    setIsSubmitting(false);
    setStep(2);
  };

  const adminBank = adminBankConfig || {
    bankId: 'MB',
    accountNo: '0901234567',
    accountName: 'TO THANH TAM',
  };

  const qrUrl = invoice
    ? `https://img.vietqr.io/image/${adminBank.bankId}-${adminBank.accountNo}-compact2.png?amount=${invoice.fee_amount}&addInfo=${invoice.invoice_code}&accountName=${encodeURIComponent(adminBank.accountName)}`
    : '';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans text-stone-800"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-stone-900">Mở Gian Hàng Nhà Vườn</h3>
              <p className="text-xs text-stone-500">Gia nhập hệ sinh thái nông sản Vườn Ninh Thuận</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 1 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Tên Nhà Vườn *</label>
              <input
                required
                placeholder="VD: Vườn Táo Chú Tư, Nho Ba Mọi..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-stone-200 font-bold text-sm focus:border-amber-800 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Tên Chủ Vườn *</label>
                <input
                  required
                  placeholder="Họ và tên"
                  value={formData.owner_name}
                  onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl border border-stone-200 font-bold text-sm focus:border-amber-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Số Điện Thoại Zalo *</label>
                <input
                  required
                  placeholder="090xxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl border border-stone-200 font-bold text-sm focus:border-amber-800 outline-none"
                />
              </div>
            </div>

            {/* Trường Email Liên Hệ / Nhận Thông Báo */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Email Liên Hệ / Nhận Kích Hoạt *</label>
              <input
                required
                type="email"
                placeholder="chuvuon@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-stone-200 font-bold text-sm focus:border-amber-800 outline-none"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Dùng để nhận thông báo xác nhận thanh toán và thông tin đăng nhập quản trị gian hàng.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">Gói Nền Tảng</label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setFormData({ ...formData, plan_tier: 'standard' })}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    formData.plan_tier === 'standard'
                      ? 'border-amber-800 bg-amber-50/70 ring-2 ring-amber-700/20'
                      : 'border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <strong className="block text-xs font-black">Gói Cơ Bản</strong>
                  <span className="text-amber-900 font-bold text-sm">500.000đ</span>
                  <p className="text-[10px] text-stone-500 mt-0.5">Website riêng + Tra cứu đơn</p>
                </div>
                <div
                  onClick={() => setFormData({ ...formData, plan_tier: 'pro' })}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    formData.plan_tier === 'pro'
                      ? 'border-amber-800 bg-amber-50/70 ring-2 ring-amber-700/20'
                      : 'border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <strong className="block text-xs font-black">Gói Nâng Cao</strong>
                  <span className="text-amber-900 font-bold text-sm">1.200.000đ</span>
                  <p className="text-[10px] text-stone-500 mt-0.5">Banner mùa + VietQR tự động</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-amber-800 hover:bg-amber-900 text-white font-black text-sm rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Tiếp Tục Tất Toán Hóa Đơn
            </button>
          </form>
        )}

        {step === 2 && invoice && (
          <div className="space-y-5 text-center">
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2 text-left text-xs">
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Mã hóa đơn:</span>
                <span className="font-black text-amber-950 font-mono text-sm">{invoice.invoice_code}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Nhà vườn:</span>
                <span className="font-bold text-stone-900">{invoice.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Email:</span>
                <span className="font-medium text-stone-800">{invoice.email}</span>
              </div>
              <div className="flex justify-between items-center border-t border-amber-200/60 pt-2">
                <span className="text-stone-700 font-bold">Số tiền cần thanh toán:</span>
                <span className="font-black text-rose-700 text-base">
                  {invoice.fee_amount.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center p-4 bg-stone-50 rounded-2xl border border-stone-200">
              <img
                src={qrUrl}
                alt="VietQR Tất Toán"
                className="w-52 h-52 object-contain rounded-xl shadow-xs border border-stone-200 bg-white p-2"
              />
              <p className="text-[11px] text-stone-500 mt-2 font-medium">
                Quét mã qua app ngân hàng bất kỳ để tự động điền STK & Nội dung
              </p>
            </div>

            <div className="p-3 bg-stone-100 rounded-xl text-xs text-stone-600 font-medium leading-relaxed">
              Sau khi chuyển khoản thành công, thông báo sẽ gửi về quản trị viên để xác minh và kích hoạt gian hàng gửi về email <strong>{invoice.email}</strong>.
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Đã Hoàn Tất Chuyển Khoản / Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}