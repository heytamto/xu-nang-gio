import React, { useState, useEffect, useCallback } from "react";
import { Tag, Trash2, Loader2, Percent } from "lucide-react";
import { voucherRepo } from "../../../repositories";
import CustomDropdown from "../../CustomDropdown";

const VOUCHER_TYPE_OPTIONS = [
  { value: "percent", label: "Phần trăm (%)" },
  { value: "fixed", label: "Tiền mặt (VNĐ)" }
];

export default function VoucherConfigSection({ onShowAlert, setConfirmModalConfig }) {
  const [vouchers, setVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newVoucher, setNewVoucher] = useState({
    code: "",
    type: "percent",
    value: 10,
    maxDiscount: 50000,
    minOrder: 0,
    canStack: true,
    usageLimit: 0,
    desc: "",
  });

  const loadVouchers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await voucherRepo.getAll();
      setVouchers(data || []);
    } catch (err) {
      console.error("Lỗi tải vouchers:", err);
      onShowAlert?.("Không thể tải danh sách mã khuyến mãi.");
    } finally {
      setIsLoading(false);
    }
  }, [onShowAlert]);

  useEffect(() => {
    loadVouchers();
  }, [loadVouchers]);

  const handleToggleStack = async (code, currentVal) => {
    try {
      await voucherRepo.update(code, { can_stack: !currentVal }, "code");
      setVouchers((prev) => prev.map((v) => (v.code === code ? { ...v, can_stack: !currentVal } : v)));
      onShowAlert?.(`Đã đổi trạng thái gộp cho mã ${code}`);
    } catch (err) {
      console.error("Lỗi cập nhật voucher:", err);
      onShowAlert?.("Lỗi cập nhật voucher: " + err.message);
    }
  };

  const handleAddVoucher = async (e) => {
    e.preventDefault();
    const formattedCode = newVoucher.code.trim().toUpperCase();
    if (!formattedCode) return;

    const payload = {
      code: formattedCode,
      type: newVoucher.type,
      value: Number(newVoucher.value) || 0,
      max_discount: newVoucher.type === "percent" ? Number(newVoucher.maxDiscount) || 0 : 0,
      min_order: Number(newVoucher.minOrder) || 0,
      can_stack: Boolean(newVoucher.canStack),
      usage_limit: Number(newVoucher.usageLimit) || 0,
      used_count: 0,
      description: newVoucher.desc.trim() || `Ưu đãi mã ${formattedCode}`,
    };

    try {
      const data = await voucherRepo.create(payload);
      setVouchers((prev) => [data, ...prev]);
      setNewVoucher({
        code: "",
        type: "percent",
        value: 10,
        maxDiscount: 50000,
        minOrder: 0,
        canStack: true,
        usageLimit: 0,
        desc: "",
      });
      onShowAlert?.(`Đã tạo mã ${formattedCode} thành công!`);
    } catch (err) {
      console.error("Lỗi thêm voucher:", err);
      onShowAlert?.("Không thể thêm voucher: " + err.message);
    }
  };

  const executeDelete = async (code) => {
    try {
      await voucherRepo.remove(code, "code");
      setVouchers((prev) => prev.filter((v) => v.code !== code));
      onShowAlert?.(`Đã xóa voucher ${code}!`);
    } catch (err) {
      console.error("Lỗi xóa voucher:", err);
      onShowAlert?.("Lỗi xóa: " + err.message);
    }
  };

  const handleDelete = (code) => {
    if (!setConfirmModalConfig) {
      if (window.confirm(`Bạn có chắc muốn xóa vĩnh viễn voucher "${code}"?`)) {
        executeDelete(code);
      }
      return;
    }

    setConfirmModalConfig({
      isAlert: false,
      title: "Xóa Voucher",
      message: `Bạn có chắc muốn xóa vĩnh viễn voucher "${code}"?`,
      confirmLabel: "Xác nhận xóa",
      onConfirm: () => executeDelete(code),
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-7 space-y-5 shadow-xs font-sans text-stone-800">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
        <div className="flex items-center gap-2.5 text-stone-900 font-black text-sm sm:text-base">
          <Tag className="w-5 h-5 text-amber-700" />
          <span>Danh Sách Mã Khuyến Mãi ({vouchers.length} mã)</span>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-stone-500 flex justify-center items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
          <span>Đang tải vouchers...</span>
        </div>
      ) : vouchers.length === 0 ? (
        <div className="py-10 text-center text-stone-400 text-xs sm:text-sm italic font-medium bg-stone-50 rounded-2xl border border-dashed border-stone-200">
          Chưa có mã khuyến mãi nào được tạo.
        </div>
      ) : (
        <div className="divide-y divide-stone-100 border border-stone-200 rounded-3xl overflow-hidden bg-white">
          {vouchers.map((v) => (
            <div key={v.code} className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 hover:bg-stone-50/50 transition-colors">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-950 font-mono font-black text-xs border border-amber-300/60">
                    {v.code}
                  </span>
                  <span className="text-sm font-bold text-stone-900">
                    {v.type === "percent" ? `Giảm ${v.value}%` : `Giảm ${Number(v.value).toLocaleString("vi-VN")}đ`}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${v.can_stack ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-stone-100 text-stone-600 border-stone-200"}`}>
                    {v.can_stack ? "Gộp mã: BẬT" : "Độc quyền"}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Đơn tối thiểu: <strong>{Number(v.min_order || 0).toLocaleString("vi-VN")}đ</strong> • Đã dùng: {v.used_count || 0}/{v.usage_limit || "∞"}
                  {v.type === "percent" && Number(v.max_discount) > 0 && (
                    <span> • Giảm tối đa: <strong>{Number(v.max_discount).toLocaleString("vi-VN")}đ</strong></span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleStack(v.code, v.can_stack)}
                  className="h-9 px-3 rounded-xl border border-stone-200 hover:bg-stone-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  {v.can_stack ? "Tắt gộp" : "Cho gộp"}
                </button>
                <button 
                  type="button" 
                  onClick={() => handleDelete(v.code)} 
                  className="p-2 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                  title="Xóa mã này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAddVoucher} className="bg-stone-50 p-5 rounded-3xl border border-stone-200 space-y-4 text-xs sm:text-sm shadow-2xs">
        <span className="font-bold text-stone-900 block text-xs uppercase tracking-wide">Tạo voucher mới:</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            required
            placeholder="MÃ CODE (GIAM10)"
            value={newVoucher.code}
            onChange={(e) => setNewVoucher({ ...newVoucher, code: e.target.value.toUpperCase() })}
            className="h-11 px-4 border border-stone-200 rounded-2xl bg-white font-mono font-bold uppercase focus:outline-none focus:border-amber-600 shadow-2xs"
          />
          
          <CustomDropdown
            options={VOUCHER_TYPE_OPTIONS}
            value={newVoucher.type}
            onChange={(val) => setNewVoucher({ ...newVoucher, type: val })}
            searchable={false}
          />

          <input
            type="number"
            required
            min="0"
            placeholder="Giá trị giảm"
            value={newVoucher.value}
            onChange={(e) => setNewVoucher({ ...newVoucher, value: e.target.value })}
            className="h-11 px-4 border border-stone-200 rounded-2xl bg-white font-mono font-bold focus:outline-none focus:border-amber-600 shadow-2xs"
          />
          <input
            type="number"
            min="0"
            step="1000"
            placeholder="Đơn tối thiểu"
            value={newVoucher.minOrder}
            onChange={(e) => setNewVoucher({ ...newVoucher, minOrder: e.target.value })}
            className="h-11 px-4 border border-stone-200 rounded-2xl bg-white font-mono focus:outline-none focus:border-amber-600 shadow-2xs"
          />
          <button 
            type="submit" 
            className="h-11 px-4 bg-stone-900 hover:bg-amber-800 text-white rounded-2xl font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            Thêm Mã
          </button>
        </div>
      </form>
    </div>
  );
}