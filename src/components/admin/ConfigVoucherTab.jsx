import React, { useState, useEffect } from 'react';
import { QrCode, Tag, Layers, Plus, Trash2, Check, Pencil, X, ShieldCheck } from 'lucide-react';
import { VIETQR_BANKS } from '../../config/shopConfig';

export default function ConfigVoucherTab({
  config = {},
  onSaveConfig,
  onShowAlert
}) {
  const [cfg, setCfg] = useState(() => ({
    bankBin: config.bankBin || '970422',
    bankName: config.bankName || 'MBBank',
    accountNo: config.accountNo || '0848957345',
    accountName: config.accountName || 'TO THANH TAM',
    depositAmount: config.depositAmount || 50000,
    hotline: config.hotline || '0848.957.345',
    zaloPhone: config.zaloPhone || config.hotline || '0848957345',
    warehousePin: config.warehousePin || '1234',
    loyaltyDiscountPercent: config.loyaltyDiscountPercent || 10,
    loyaltyMaxDiscount: config.loyaltyMaxDiscount || 50000,
    vouchers: (config.vouchers || []).map(v => ({
      ...v,
      canStack: v.canStack ?? true,
      maxDiscount: v.maxDiscount || 0,
      usageLimit: v.usageLimit !== undefined ? v.usageLimit : 0,
      usedCount: v.usedCount || 0
    }))
  }));

  const [editingVoucher, setEditingVoucher] = useState(null);

  useEffect(() => {
    if (config) {
      setCfg({
        bankBin: config.bankBin || '970422',
        bankName: config.bankName || 'MBBank',
        accountNo: config.accountNo || '0848957345',
        accountName: config.accountName || 'TO THANH TAM',
        depositAmount: config.depositAmount || 50000,
        hotline: config.hotline || '0848.957.345',
        zaloPhone: config.zaloPhone || config.hotline || '0848957345',
        warehousePin: config.warehousePin || '1234',
        loyaltyDiscountPercent: config.loyaltyDiscountPercent || 10,
        loyaltyMaxDiscount: config.loyaltyMaxDiscount || 50000,
        vouchers: (config.vouchers || []).map(v => ({
          ...v,
          canStack: v.canStack ?? true,
          maxDiscount: v.maxDiscount || 0,
          usageLimit: v.usageLimit !== undefined ? v.usageLimit : 0,
          usedCount: v.usedCount || 0
        }))
      });
    }
  }, [config]);

  const handleSelectBank = (e) => {
    const selectedBin = e.target.value;
    const matchedBank = VIETQR_BANKS.find(b => b.bin === selectedBin);
    if (matchedBank) {
      setCfg(prev => ({
        ...prev,
        bankBin: matchedBank.bin,
        bankName: matchedBank.shortName
      }));
    }
  };

  const [newVoucher, setNewVoucher] = useState({
    code: '',
    type: 'percent',
    value: 10,
    maxDiscount: 50000,
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
        maxDiscount: newVoucher.type === 'percent' ? (Number(newVoucher.maxDiscount) || 0) : 0,
        minOrder: Number(newVoucher.minOrder) || 0,
        usageLimit: Number(newVoucher.usageLimit) || 0,
        usedCount: 0,
        canStack: Boolean(newVoucher.canStack),
        desc: newVoucher.desc.trim() || `Ưu đãi mã ${formattedCode}`
      }
    ];

    setCfg(prev => ({ ...prev, vouchers: updatedVouchers }));
    setNewVoucher({
      code: '',
      type: 'percent',
      value: 10,
      maxDiscount: 50000,
      minOrder: 0,
      canStack: true,
      usageLimit: 0,
      desc: ''
    });
  };

  const handleToggleVoucherStack = (code) => {
    setCfg(prev => ({
      ...prev,
      vouchers: prev.vouchers.map(v => v.code === code ? { ...v, canStack: !v.canStack } : v)
    }));
  };

  const handleRemoveVoucher = (code) => {
    setCfg(prev => ({
      ...prev,
      vouchers: prev.vouchers.filter(v => v.code !== code)
    }));
  };

  const handleSaveEditedVoucher = (e) => {
    e.preventDefault();
    if (!editingVoucher) return;

    setCfg(prev => ({
      ...prev,
      vouchers: prev.vouchers.map(v =>
        v.code === editingVoucher.code
          ? {
              ...editingVoucher,
              value: Number(editingVoucher.value) || 0,
              maxDiscount: editingVoucher.type === 'percent' ? (Number(editingVoucher.maxDiscount) || 0) : 0,
              minOrder: Number(editingVoucher.minOrder) || 0,
              usageLimit: Number(editingVoucher.usageLimit) || 0,
              canStack: Boolean(editingVoucher.canStack),
              desc: (editingVoucher.desc || '').trim()
            }
          : v
      )
    }));

    setEditingVoucher(null);
  };

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      {/* 1. CẤU HÌNH THANH TOÁN, VIETQR & LOYALTY */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
          <QrCode className="w-4 h-4 text-amber-600" />
          <span>Cấu Hình Thanh Toán, VietQR & Ưu Đãi Khách Quen</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
          <div className="sm:col-span-2">
            <label className="font-semibold text-stone-600 block mb-1">Ngân hàng nhận tiền:</label>
            <select
              value={cfg.bankBin}
              onChange={handleSelectBank}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-medium text-stone-800 cursor-pointer"
            >
              {VIETQR_BANKS.map((b) => (
                <option key={b.bin} value={b.bin}>
                  {b.name} ({b.shortName})
                </option>
              ))}
            </select>
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
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-mono uppercase font-bold"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-600 block mb-1">Tiền Cọc Giữ Đơn (VNĐ):</label>
            <input
              type="number"
              value={cfg.depositAmount}
              onChange={(e) => setCfg({ ...cfg, depositAmount: Number(e.target.value) || 0 })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-mono font-bold text-amber-700"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-600 block mb-1">Hotline / Zalo hỗ trợ:</label>
            <input
              type="text"
              placeholder="VD: 0848.957.345"
              value={cfg.hotline}
              onChange={(e) => setCfg({ ...cfg, hotline: e.target.value, zaloPhone: e.target.value.replace(/[^0-9]/g, '') })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-mono text-stone-800"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-600 block mb-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Mã PIN Vào Kho / Admin:</span>
            </label>
            <input
              type="text"
              maxLength={6}
              value={cfg.warehousePin}
              onChange={(e) => setCfg({ ...cfg, warehousePin: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-mono font-bold text-amber-900"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-600 block mb-1">% Giảm Khách Cũ (Loyalty):</label>
            <input
              type="number"
              value={cfg.loyaltyDiscountPercent}
              onChange={(e) => setCfg({ ...cfg, loyaltyDiscountPercent: Number(e.target.value) || 0 })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-mono font-bold text-emerald-700"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <label className="font-semibold text-stone-600 block mb-1">Trần Giảm Khách Cũ (VNĐ):</label>
            <input
              type="number"
              value={cfg.loyaltyMaxDiscount}
              onChange={(e) => setCfg({ ...cfg, loyaltyMaxDiscount: Number(e.target.value) || 0 })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-mono font-bold text-emerald-700"
            />
          </div>
        </div>
      </div>

      {/* 2. CẤU HÌNH VOUCHER */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
            <Tag className="w-4 h-4 text-amber-600" />
            <span>Danh Sách Voucher ({cfg.vouchers.length})</span>
          </div>
          <span className="text-xs text-stone-500 hidden sm:inline">
            Cài đặt <strong>Trần giảm</strong>, <strong>Lượt dùng</strong> và <strong>Cờ gộp mã (canStack)</strong>
          </span>
        </div>

        {/* Danh sách voucher */}
        <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-stone-50/50">
          {cfg.vouchers.map((v) => {
            const limit = Number(v.usageLimit) || 0;
            const used = Number(v.usedCount) || 0;
            const remaining = limit > 0 ? Math.max(0, limit - used) : 'Vô hạn';
            const isOutOfStock = limit > 0 && remaining === 0;

            return (
              <div key={v.code} className="p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                      {v.code}
                    </span>
                    <span className="font-bold text-stone-800">
                      {v.type === 'percent'
                        ? `Giảm ${v.value}%${v.maxDiscount ? ` (Tối đa ${Number(v.maxDiscount).toLocaleString('vi-VN')}đ)` : ''}`
                        : `Giảm ${Number(v.value).toLocaleString('vi-VN')}đ`}
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
                    {v.desc ? `${v.desc} • ` : ''}Đơn tối thiểu: <strong className="text-stone-700 font-mono">{v.minOrder ? `${Number(v.minOrder).toLocaleString('vi-VN')}đ` : '0đ'}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleVoucherStack(v.code)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                      v.canStack
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                    }`}
                  >
                    {v.canStack ? 'Cho phép gộp' : 'Không cho gộp'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingVoucher({ ...v })}
                    className="p-1.5 text-stone-400 hover:text-amber-600 rounded-lg hover:bg-stone-200/60 transition-colors cursor-pointer"
                    title="Chỉnh sửa voucher"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveVoucher(v.code)}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-200/60 transition-colors cursor-pointer"
                    title="Xóa voucher"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Form thêm voucher mới */}
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
                className="w-full p-2 rounded-xl border border-stone-200 bg-white font-mono uppercase font-bold text-stone-900"
              />
            </div>

            <div>
              <label className="text-[10px] text-stone-500 font-semibold block mb-1">Loại giảm</label>
              <select
                value={newVoucher.type}
                onChange={(e) => setNewVoucher({ ...newVoucher, type: e.target.value })}
                className="w-full p-2 rounded-xl border border-stone-200 bg-white font-medium cursor-pointer"
              >
                <option value="percent">Giảm theo %</option>
                <option value="fixed">Giảm số tiền (VNĐ)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-stone-500 font-semibold block mb-1">
                {newVoucher.type === 'percent' ? 'Mức giảm (%) *' : 'Mức giảm (VNĐ) *'}
              </label>
              <input
                type="number"
                required
                min="0"
                value={newVoucher.value}
                onChange={(e) => setNewVoucher({ ...newVoucher, value: e.target.value })}
                className="w-full p-2 rounded-xl border border-stone-200 bg-white font-mono font-bold"
              />
            </div>

            {newVoucher.type === 'percent' && (
              <div>
                <label className="text-[10px] text-stone-500 font-semibold block mb-1">Giảm tối đa (VNĐ)</label>
                <input
                  type="number"
                  placeholder="0 = Không giới hạn"
                  value={newVoucher.maxDiscount}
                  onChange={(e) => setNewVoucher({ ...newVoucher, maxDiscount: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-200 bg-white font-mono text-emerald-800 font-bold"
                />
              </div>
            )}

            <div>
              <label className="text-[10px] text-stone-500 font-semibold block mb-1">Đơn tối thiểu (VNĐ)</label>
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

            <div className={newVoucher.type === 'percent' ? 'lg:col-span-6' : 'lg:col-span-2'}>
              <label className="text-[10px] text-stone-500 font-semibold block mb-1">Mô tả hiển thị</label>
              <input
                type="text"
                placeholder="VD: Hỗ trợ tiền xe cho đơn từ 200k"
                value={newVoucher.desc}
                onChange={(e) => setNewVoucher({ ...newVoucher, desc: e.target.value })}
                className="w-full p-2 rounded-xl border border-stone-200 bg-white font-medium"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200/60">
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
              className="px-4 py-2 bg-stone-900 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Voucher Vào Hệ Thống</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. NÚT LƯU CẤU HÌNH */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => onSaveConfig(cfg)}
          className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>Lưu Cấu Hình Voucher</span>
        </button>
      </div>

      {/* 4. MODAL CHỈNH SỬA VOUCHER */}
      {editingVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                <span>Chỉnh Sửa Voucher:</span>
                <span className="font-mono text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                  {editingVoucher.code}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingVoucher(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedVoucher} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] text-stone-500 font-semibold block mb-1">Loại giảm</label>
                  <select
                    value={editingVoucher.type}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, type: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 bg-white font-medium cursor-pointer"
                  >
                    <option value="percent">Giảm theo %</option>
                    <option value="fixed">Giảm số tiền (VNĐ)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-stone-500 font-semibold block mb-1">
                    {editingVoucher.type === 'percent' ? 'Mức giảm (%) *' : 'Mức giảm (VNĐ) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingVoucher.value}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, value: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 bg-white font-mono font-bold"
                  />
                </div>
              </div>

              {editingVoucher.type === 'percent' && (
                <div>
                  <label className="text-[10px] text-stone-500 font-semibold block mb-1">Giảm tối đa (VNĐ)</label>
                  <input
                    type="number"
                    placeholder="0 = Không giới hạn"
                    value={editingVoucher.maxDiscount}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, maxDiscount: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 bg-white font-mono text-emerald-800 font-bold"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] text-stone-500 font-semibold block mb-1">Đơn tối thiểu (VNĐ)</label>
                  <input
                    type="number"
                    value={editingVoucher.minOrder}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, minOrder: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-stone-500 font-semibold block mb-1">SL Giới hạn (0 = Vô hạn)</label>
                  <input
                    type="number"
                    value={editingVoucher.usageLimit}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, usageLimit: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 bg-white font-mono font-bold text-amber-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-stone-500 font-semibold block mb-1">Mô tả hiển thị</label>
                <input
                  type="text"
                  value={editingVoucher.desc || ''}
                  onChange={(e) => setEditingVoucher({ ...editingVoucher, desc: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-200 bg-white font-medium"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-950 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                <input
                  type="checkbox"
                  checked={editingVoucher.canStack}
                  onChange={(e) => setEditingVoucher({ ...editingVoucher, canStack: e.target.checked })}
                  className="w-4 h-4 rounded-md accent-amber-600"
                />
                <span>Cho phép gộp với các voucher khác (canStack)</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingVoucher(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Cập Nhật Voucher</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}