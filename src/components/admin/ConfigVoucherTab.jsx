import React, { useState } from 'react';
import { QrCode, Tag, Layers, Plus, Trash2, Check } from 'lucide-react';

export default function ConfigVoucherTab({
  config,
  onSaveConfig,
  onShowAlert
}) {
  const [cfg, setCfg] = useState(() => ({
    bankBin: config.bankBin || '970422',
    bankName: config.bankName || 'MB',
    accountNo: config.accountNo || '0848957345',
    accountName: config.accountName || 'TO THANH TAM',
    depositAmount: config.depositAmount || 50000,
    hotline: config.hotline || '',
    loyaltyDiscountPercent: config.loyaltyDiscountPercent || 10,
    vouchers: (config.vouchers || []).map(v => ({
      ...v,
      canStack: v.canStack ?? true,
      usageLimit: v.usageLimit !== undefined ? v.usageLimit : 0,
      usedCount: v.usedCount || 0
    }))
  }));

  const [newVoucher, setNewVoucher] = useState({
    code: '',
    type: 'percent',
    value: 10,
    minOrder: 0,
    canStack: true,
    usageLimit: 0,
    desc: ''
  });

  const handleAddVoucher = (e) => {
    e.preventDefault();
    if (!newVoucher.code.trim()) return;
    const formattedCode = newVoucher.code.trim().toUpperCase();

    if (cfg.vouchers.some(v => v.code === formattedCode)) {
      if (onShowAlert) onShowAlert('Mã voucher này đã có trong danh sách.');
      return;
    }

    const updatedVouchers = [
      ...cfg.vouchers,
      {
        ...newVoucher,
        code: formattedCode,
        value: Number(newVoucher.value) || 0,
        minOrder: Number(newVoucher.minOrder) || 0,
        usageLimit: Number(newVoucher.usageLimit) || 0,
        usedCount: 0,
        canStack: Boolean(newVoucher.canStack),
        desc: newVoucher.desc.trim() || `Ưu đãi mã ${formattedCode}`
      }
    ];

    setCfg({ ...cfg, vouchers: updatedVouchers });
    setNewVoucher({
      code: '',
      type: 'percent',
      value: 10,
      minOrder: 0,
      canStack: true,
      usageLimit: 0,
      desc: ''
    });
  };

  const handleToggleVoucherStack = (code) => {
    setCfg({
      ...cfg,
      vouchers: cfg.vouchers.map(v => v.code === code ? { ...v, canStack: !v.canStack } : v)
    });
  };

  const handleRemoveVoucher = (code) => {
    setCfg({
      ...cfg,
      vouchers: cfg.vouchers.filter(v => v.code !== code)
    });
  };

  return (
    <div className="space-y-6">
      {/* Cấu hình VietQR */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
          <QrCode className="w-4 h-4 text-amber-600" />
          <span>Cấu Hình Thanh Toán & VietQR</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
          <div>
            <label className="font-semibold text-stone-600 block mb-1">Mã BIN Ngân Hàng:</label>
            <input
              type="text"
              value={cfg.bankBin}
              onChange={(e) => setCfg({ ...cfg, bankBin: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-600 block mb-1">Tên Ngân Hàng hiển thị:</label>
            <input
              type="text"
              value={cfg.bankName}
              onChange={(e) => setCfg({ ...cfg, bankName: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-medium"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-600 block mb-1">Số Tài Khoản:</label>
            <input
              type="text"
              value={cfg.accountNo}
              onChange={(e) => setCfg({ ...cfg, accountNo: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-mono font-bold text-stone-800"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-600 block mb-1">Tên Chủ Tài Khoản:</label>
            <input
              type="text"
              value={cfg.accountName}
              onChange={(e) => setCfg({ ...cfg, accountName: e.target.value.toUpperCase() })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-mono uppercase"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-600 block mb-1">Số Tiền Cọc Mặc Định (VNĐ):</label>
            <input
              type="number"
              value={cfg.depositAmount}
              onChange={(e) => setCfg({ ...cfg, depositAmount: Number(e.target.value) || 0 })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-mono font-bold text-amber-700"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-600 block mb-1">% Giảm Khi Nhập Mã Đơn Cũ (XNG):</label>
            <input
              type="number"
              value={cfg.loyaltyDiscountPercent}
              onChange={(e) => setCfg({ ...cfg, loyaltyDiscountPercent: Number(e.target.value) || 0 })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-mono font-bold text-emerald-700"
            />
          </div>
        </div>
      </div>

      {/* Cấu hình Voucher */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
            <Tag className="w-4 h-4 text-amber-600" />
            <span>Danh Sách Voucher ({cfg.vouchers.length})</span>
          </div>
          <span className="text-xs text-stone-500">
            Hỗ trợ cài đặt <strong>Số lượng giới hạn</strong> và quyền <strong>Gộp (canStack)</strong>
          </span>
        </div>

        <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-stone-50/50">
          {cfg.vouchers.map((v) => {
            const limit = Number(v.usageLimit) || 0;
            const used = Number(v.usedCount) || 0;
            const remaining = limit > 0 ? Math.max(0, limit - used) : 'Vô hạn';
            const isOutOfStock = limit > 0 && remaining === 0;

            return (
              <div key={v.code} className="p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                      {v.code}
                    </span>
                    <span className="font-bold text-stone-800">
                      {v.type === 'percent' ? `Giảm ${v.value}%` : `Giảm ${Number(v.value).toLocaleString('vi-VN')}đ`}
                    </span>

                    {v.canStack ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[10px]">
                        <Layers className="w-3 h-3 text-emerald-600" />
                        <span>ĐƯỢC GỘP MÃ</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-md text-[10px]">
                        <span>ĐỘC QUYỀN (1 MÃ)</span>
                      </span>
                    )}

                    {isOutOfStock ? (
                      <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-md text-[10px]">
                        HẾT LƯỢT DÙNG
                      </span>
                    ) : (
                      <span className="bg-stone-200 text-stone-700 font-semibold px-2 py-0.5 rounded-md text-[10px]">
                        Còn lại: <strong className="font-mono text-amber-900">{remaining}</strong> {limit > 0 ? `(${used}/${limit} đã dùng)` : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-stone-500 text-[11px]">
                    {v.desc} • Đơn tối thiểu: {v.minOrder ? `${Number(v.minOrder).toLocaleString('vi-VN')}đ` : '0đ'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleVoucherStack(v.code)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors ${
                      v.canStack
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                    }`}
                  >
                    {v.canStack ? 'Cho phép gộp' : 'Không cho gộp'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveVoucher(v.code)}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-200/60 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Form thêm voucher */}
        <form onSubmit={handleAddVoucher} className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
          <span className="font-bold text-xs text-stone-800 block">Tạo voucher mới:</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
            <div>
              <label className="text-[10px] text-stone-500 font-semibold block mb-1">Mã CODE *</label>
              <input
                type="text"
                required
                placeholder="VD: FREESHIP"
                value={newVoucher.code}
                onChange={(e) => setNewVoucher({ ...newVoucher, code: e.target.value.toUpperCase() })}
                className="w-full p-2 rounded-xl border border-stone-200 bg-white font-mono uppercase font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] text-stone-500 font-semibold block mb-1">Loại giảm</label>
              <select
                value={newVoucher.type}
                onChange={(e) => setNewVoucher({ ...newVoucher, type: e.target.value })}
                className="w-full p-2 rounded-xl border border-stone-200 bg-white"
              >
                <option value="percent">Giảm theo %</option>
                <option value="fixed">Giảm số tiền (VNĐ)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-stone-500 font-semibold block mb-1">Mức giảm (%/VNĐ) *</label>
              <input
                type="number"
                required
                value={newVoucher.value}
                onChange={(e) => setNewVoucher({ ...newVoucher, value: e.target.value })}
                className="w-full p-2 rounded-xl border border-stone-200 bg-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] text-stone-500 font-semibold block mb-1">Đơn tối thiểu</label>
              <input
                type="number"
                value={newVoucher.minOrder}
                onChange={(e) => setNewVoucher({ ...newVoucher, minOrder: e.target.value })}
                placeholder="0"
                className="w-full p-2 rounded-xl border border-stone-200 bg-white font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-stone-500 font-semibold block mb-1">SL Giới Hạn (Lượt)</label>
              <input
                type="number"
                value={newVoucher.usageLimit}
                onChange={(e) => setNewVoucher({ ...newVoucher, usageLimit: e.target.value })}
                placeholder="0 = Vô hạn"
                className="w-full p-2 rounded-xl border border-stone-200 bg-white font-mono font-bold text-amber-800"
              />
            </div>

            <div>
              <label className="text-[10px] text-stone-500 font-semibold block mb-1">Mô tả</label>
              <input
                type="text"
                placeholder="VD: Hỗ trợ tiền xe"
                value={newVoucher.desc}
                onChange={(e) => setNewVoucher({ ...newVoucher, desc: e.target.value })}
                className="w-full p-2 rounded-xl border border-stone-200 bg-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-stone-200/60">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-950 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
              <input
                type="checkbox"
                checked={newVoucher.canStack}
                onChange={(e) => setNewVoucher({ ...newVoucher, canStack: e.target.checked })}
                className="w-4 h-4 rounded-md accent-amber-600"
              />
              <span>Cho phép gộp với các voucher khác (canStack)</span>
            </label>

            <button
              type="submit"
              className="px-4 py-2 bg-stone-900 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Voucher Vào Hệ Thống</span>
            </button>
          </div>
        </form>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => onSaveConfig(cfg)}
          className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all active:scale-95"
        >
          <Check className="w-4 h-4" />
          <span>Lưu Cấu Hình Voucher</span>
        </button>
      </div>
    </div>
  );
}