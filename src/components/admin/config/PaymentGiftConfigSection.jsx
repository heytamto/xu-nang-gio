import React, { useState, useEffect, useCallback } from "react";
import { Gift, Plus, Trash2, Loader2 } from "lucide-react";
import { giftRepo, shopConfigRepo } from "../../../repositories";

export default function PaymentGiftConfigSection({ onShowAlert, setConfirmModalConfig }) {
  const [gifts, setGifts] = useState([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [newGift, setNewGift] = useState({ id: "", title: "", tag: "Quà Quê", description: "" });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Tải danh sách quà tặng thanh toán
      const allGifts = await giftRepo.getAll();
      setGifts((allGifts || []).filter((g) => g.type === "payment_reward"));

      // 2. Tải cấu hình bật/tắt (truyền rõ orderBy: 'updated_at' để tránh dính lỗi created_at)
      const configs = await shopConfigRepo.getAll({ orderBy: "updated_at", ascending: false });
      const generalRow = configs.find((c) => c.key === "general");
      let generalVal = generalRow?.value || {};
      if (typeof generalVal === "string") {
        try { generalVal = JSON.parse(generalVal); } catch {}
      }
      setIsEnabled(generalVal.enablePaymentGifts !== false);
    } catch (err) {
      console.error("Lỗi tải gifts:", err);
      onShowAlert?.("Không thể tải danh sách quà tặng thanh toán.");
    } finally {
      setIsLoading(false);
    }
  }, [onShowAlert]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleGlobalGift = async (e) => {
    const nextVal = e.target.checked;
    setIsEnabled(nextVal);
    try {
      const configs = await shopConfigRepo.getAll({ orderBy: "updated_at", ascending: false });
      const generalRow = configs.find((c) => c.key === "general");
      let generalVal = generalRow?.value || {};
      if (typeof generalVal === "string") {
        try { generalVal = JSON.parse(generalVal); } catch {}
      }

      await shopConfigRepo.update("general", {
        value: { ...generalVal, enablePaymentGifts: nextVal },
      }, "key");
      onShowAlert?.(`Đã ${nextVal ? "bật" : "tắt"} chương trình tặng quà chuyển khoản!`);
    } catch (err) {
      console.error("Lỗi lưu cấu hình quà:", err);
      onShowAlert?.("Lỗi lưu cấu hình: " + err.message);
    }
  };

  const handleToggleGiftStatus = async (giftId, currentStatus) => {
    const nextStatus = !currentStatus;
    try {
      await giftRepo.update(giftId, { is_active: nextStatus });
      setGifts((prev) => prev.map((g) => (g.id === giftId ? { ...g, is_active: nextStatus } : g)));
      onShowAlert?.(`Đã ${nextStatus ? "bật" : "tắt"} quà tặng!`);
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái quà:", err);
      onShowAlert?.("Lỗi cập nhật: " + err.message);
    }
  };

  const handleAddGift = async (e) => {
    e.preventDefault();
    if (!newGift.title.trim()) return;

    const payload = {
      id: (newGift.id.trim() || `gift_${Date.now()}`).toLowerCase(),
      title: newGift.title.trim(),
      tag: newGift.tag.trim() || "Quà Quê",
      description: newGift.description.trim() || null,
      type: "payment_reward",
      is_active: true,
    };

    try {
      const data = await giftRepo.create(payload);
      setGifts((prev) => [...prev, data]);
      setNewGift({ id: "", title: "", tag: "Quà Quê", description: "" });
      onShowAlert?.(`Đã thêm quà tặng "${data.title}"!`);
    } catch (err) {
      console.error("Lỗi thêm quà:", err);
      onShowAlert?.("Lỗi thêm quà: " + err.message);
    }
  };

  const executeDelete = async (giftId, giftTitle) => {
    try {
      await giftRepo.remove(giftId);
      setGifts((prev) => prev.filter((g) => g.id !== giftId));
      onShowAlert?.(`Đã xóa quà "${giftTitle}"!`);
    } catch (err) {
      console.error("Lỗi xóa quà:", err);
      onShowAlert?.("Lỗi xóa: " + err.message);
    }
  };

  const handleDelete = (giftId, giftTitle) => {
    if (!setConfirmModalConfig) {
      if (window.confirm(`Bạn có chắc muốn xóa món quà "${giftTitle}" (#${giftId})?`)) {
        executeDelete(giftId, giftTitle);
      }
      return;
    }

    setConfirmModalConfig({
      isAlert: false,
      title: "Xóa Quà Tặng",
      message: `Bạn có chắc muốn xóa món quà "${giftTitle}" (#${giftId})?`,
      confirmLabel: "Xóa quà",
      onConfirm: () => executeDelete(giftId, giftTitle),
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-7 space-y-5 shadow-xs font-sans text-stone-800">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
        <div className="flex items-center gap-2.5 text-stone-900 font-black text-sm sm:text-base">
          <Gift className="w-5 h-5 text-amber-700" />
          <span>Quản Lý Quà Tặng Thanh Toán ({gifts.length} món)</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 p-5 rounded-3xl bg-amber-50/70 border border-amber-200/80">
        <div className="space-y-1">
          <strong className="text-sm sm:text-base font-black text-stone-900 block">
            Chương Trình Tặng Quà Quê (Thanh toán VietQR)
          </strong>
          <p className="text-xs sm:text-sm text-stone-600">
            Hiển thị popup chọn quà tặng tại Checkout khi khách chuyển khoản cọc hoặc toàn phần.
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input 
            type="checkbox" 
            checked={isEnabled} 
            onChange={handleToggleGlobalGift} 
            className="sr-only peer" 
          />
          <div className="w-12 h-6.5 bg-stone-300 rounded-full peer peer-checked:bg-amber-600 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
        </label>
      </div>

      {isEnabled && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-6 text-center text-xs text-stone-500 flex justify-center items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
              <span>Đang tải danh sách quà...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {gifts.map((g) => {
                const active = g.is_active !== false;
                return (
                  <div 
                    key={g.id} 
                    className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-colors ${
                      active ? "bg-white border-stone-200/90 shadow-2xs" : "bg-stone-100/80 border-stone-200 opacity-70"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-bold text-sm text-stone-900 truncate">{g.title}</span>
                        <span className="text-[11px] font-mono text-stone-400 shrink-0">#{g.id}</span>
                      </div>
                      {g.description && <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">{g.description}</p>}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => handleToggleGiftStatus(g.id, active)}
                        className={`h-8 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer active:scale-95 ${
                          active 
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100" 
                            : "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100"
                        }`}
                      >
                        {active ? "Đang bật" : "Đã tắt"}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleDelete(g.id, g.title)} 
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-50 transition-colors cursor-pointer"
                        title="Xóa món quà này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <form onSubmit={handleAddGift} className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-3 text-xs sm:text-sm shadow-2xs">
            <span className="font-bold text-stone-800 block text-xs uppercase tracking-wide">Thêm Món Quà Quê Mới:</span>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <input
                type="text"
                placeholder="Mã ID (VD: g_me)"
                value={newGift.id}
                onChange={(e) => setNewGift({ ...newGift, id: e.target.value })}
                className="sm:col-span-3 h-11 px-3 border border-stone-200 rounded-xl bg-white font-mono focus:outline-none focus:border-amber-600 shadow-2xs"
              />
              <input
                type="text"
                required
                placeholder="Tên quà tặng *"
                value={newGift.title}
                onChange={(e) => setNewGift({ ...newGift, title: e.target.value })}
                className="sm:col-span-6 h-11 px-3 border border-stone-200 rounded-xl bg-white font-bold focus:outline-none focus:border-amber-600 shadow-2xs"
              />
              <input
                type="text"
                placeholder="Tag (Mặc định: Quà Quê)"
                value={newGift.tag}
                onChange={(e) => setNewGift({ ...newGift, tag: e.target.value })}
                className="sm:col-span-3 h-11 px-3 border border-stone-200 rounded-xl bg-white focus:outline-none focus:border-amber-600 shadow-2xs"
              />
              <div className="sm:col-span-12 flex gap-3">
                <input
                  type="text"
                  placeholder="Mô tả quà tặng (Hũ mủ trôm, túi táo sấy dẻo...)"
                  value={newGift.description}
                  onChange={(e) => setNewGift({ ...newGift, description: e.target.value })}
                  className="flex-1 h-11 px-3 border border-stone-200 rounded-xl bg-white focus:outline-none focus:border-amber-600 shadow-2xs"
                />
                <button 
                  type="submit" 
                  className="h-11 px-6 bg-amber-800 hover:bg-amber-900 text-white rounded-xl font-bold shrink-0 transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  Thêm Quà
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}