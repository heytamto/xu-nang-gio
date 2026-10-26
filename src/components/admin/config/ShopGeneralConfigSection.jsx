import React, { useState, useEffect } from "react";
import { QrCode, Building2, Loader2 } from "lucide-react";
import { VIETQR_BANKS } from "../../../config/shopConfig";
import { shopConfigRepo } from "../../../repositories";
import CustomDropdown from "../../CustomDropdown";

// Helper trích xuất chuỗi thông báo an toàn, phòng ngừa trường hợp database trả về object { text: "..." }
const resolveAnnouncementText = (raw) => {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object") return raw.text || raw.content || "";
  return String(raw);
};

export default function ShopGeneralConfigSection({ initialConfig = {}, onSaveConfig, onShowAlert }) {
  const [cfg, setCfg] = useState({
    bankBin: initialConfig.bankBin || "970422",
    bankName: initialConfig.bankName || "MBBank",
    accountNo: initialConfig.accountNo || "0848957345",
    accountName: initialConfig.accountName || "TO THANH TAM",
    depositAmount: initialConfig.depositAmount ?? 50000,
    shippingFee: initialConfig.shippingFee ?? 30000,
    freeShippingThreshold: initialConfig.freeShippingThreshold ?? 300000,
    hotline: initialConfig.hotline || "0848.957.345",
    warehousePin: initialConfig.warehousePin || "1234",
    address: initialConfig.address || "Thôn Trường Sanh, Xã Phước Hậu, Tỉnh Ninh Thuận",
    announcement: resolveAnnouncementText(initialConfig.announcement) || "Nông sản cắt giàn hái sớm - Gửi xe khách trong đêm",
    loyaltyDiscountPercent: initialConfig.loyaltyDiscountPercent ?? 10,
    loyaltyMaxDiscount: initialConfig.loyaltyMaxDiscount ?? 50000,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialConfig && Object.keys(initialConfig).length > 0) {
      setCfg((prev) => ({
        ...prev,
        bankBin: initialConfig.bankBin || prev.bankBin,
        bankName: initialConfig.bankName || prev.bankName,
        accountNo: initialConfig.accountNo || prev.accountNo,
        accountName: initialConfig.accountName || prev.accountName,
        depositAmount: initialConfig.depositAmount ?? prev.depositAmount,
        shippingFee: initialConfig.shippingFee ?? prev.shippingFee,
        freeShippingThreshold: initialConfig.freeShippingThreshold ?? prev.freeShippingThreshold,
        hotline: initialConfig.hotline || prev.hotline,
        warehousePin: initialConfig.warehousePin || prev.warehousePin,
        address: initialConfig.address || prev.address,
        announcement: resolveAnnouncementText(initialConfig.announcement) || prev.announcement,
        loyaltyDiscountPercent: initialConfig.loyaltyDiscountPercent ?? prev.loyaltyDiscountPercent,
        loyaltyMaxDiscount: initialConfig.loyaltyMaxDiscount ?? prev.loyaltyMaxDiscount,
      }));
    }
  }, [initialConfig]);

  const bankOptions = VIETQR_BANKS.map((b) => ({
    value: b.bin,
    label: `${b.shortName} - ${b.name}`,
    shortName: b.shortName,
    fullName: b.name,
    bin: b.bin,
    logo: b.logo
  }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const nowIso = new Date().toISOString();

      await Promise.all([
        shopConfigRepo.update("payment", {
          value: {
            bankBin: cfg.bankBin,
            bankName: cfg.bankName,
            accountNo: cfg.accountNo,
            accountName: cfg.accountName,
            depositAmount: Number(cfg.depositAmount) || 0,
            shippingFee: Number(cfg.shippingFee) || 0,
            freeShippingThreshold: Number(cfg.freeShippingThreshold) || 0,
          },
          updated_at: nowIso,
        }, "key"),
        shopConfigRepo.update("general", {
          value: {
            address: cfg.address,
            hotline: cfg.hotline,
            warehousePin: cfg.warehousePin,
          },
          updated_at: nowIso,
        }, "key"),
        shopConfigRepo.update("loyalty", {
          value: {
            percent: Number(cfg.loyaltyDiscountPercent) || 0,
            maxDiscount: Number(cfg.loyaltyMaxDiscount) || 0,
          },
          updated_at: nowIso,
        }, "key"),
        shopConfigRepo.update("announcement", {
          value: { text: cfg.announcement },
          updated_at: nowIso,
        }, "key"),
      ]);

      if (onSaveConfig) onSaveConfig(cfg);
      onShowAlert?.("Đã lưu toàn bộ cấu hình vận hành thành công!");
    } catch (err) {
      console.error("Lỗi lưu cấu hình:", err);
      onShowAlert?.("Lỗi lưu cấu hình: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-7 space-y-5 shadow-xs font-sans text-stone-800">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
        <div className="flex items-center gap-2.5 text-stone-900 font-black text-sm sm:text-base">
          <QrCode className="w-5 h-5 text-amber-700" />
          <span>Cấu Hình Vận Hành, VietQR & Giao Nhận</span>
        </div>
        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className="h-10 px-5 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          <span>Lưu Cấu Hình</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
        <div>
          <CustomDropdown
            label="Ngân hàng thụ hưởng"
            headerLabel="HỆ THỐNG NGÂN HÀNG VIETQR:"
            icon={Building2}
            options={bankOptions}
            value={cfg.bankBin}
            onChange={(selectedBin) => {
              const selected = VIETQR_BANKS.find((b) => b.bin === selectedBin);
              setCfg({ ...cfg, bankBin: selectedBin, bankName: selected?.shortName || cfg.bankName });
            }}
            searchable={true}
            searchPlaceholder="Tìm tên ngân hàng..."
            renderSelected={(opt) => (
              <span className="font-bold text-stone-900 truncate">
                {opt?.shortName} ({opt?.bin})
              </span>
            )}
            renderOption={(opt, isSelected) => (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-bold text-stone-900 block truncate">{opt.shortName}</span>
                  <span className="text-[11px] text-stone-400 block truncate">{opt.fullName}</span>
                </div>
                <span className={`text-xs font-mono font-bold shrink-0 ${isSelected ? "text-amber-900" : "text-stone-400"}`}>
                  {opt.bin}
                </span>
              </div>
            )}
          />
        </div>

        <div>
          <label className="font-bold text-stone-700 block mb-1.5">Số Tài Khoản</label>
          <input
            type="text"
            value={cfg.accountNo}
            onChange={(e) => setCfg({ ...cfg, accountNo: e.target.value })}
            className="w-full h-11 px-3.5 border border-stone-200 rounded-2xl bg-stone-50 font-mono font-bold focus:outline-none focus:border-amber-600 shadow-2xs"
          />
        </div>

        <div>
          <label className="font-bold text-stone-700 block mb-1.5">Tên Chủ Tài Khoản</label>
          <input
            type="text"
            value={cfg.accountName}
            onChange={(e) => setCfg({ ...cfg, accountName: e.target.value.toUpperCase() })}
            className="w-full h-11 px-3.5 border border-stone-200 rounded-2xl bg-stone-50 uppercase font-bold focus:outline-none focus:border-amber-600 shadow-2xs"
          />
        </div>

        <div>
          <label className="font-bold text-stone-700 block mb-1.5">Tiền Cọc Giữ Đơn (VNĐ)</label>
          <input
            type="number"
            step="5000"
            value={cfg.depositAmount}
            onChange={(e) => setCfg({ ...cfg, depositAmount: Number(e.target.value) || 0 })}
            className="w-full h-11 px-3.5 border border-stone-200 rounded-2xl bg-stone-50 font-mono font-bold text-amber-950 focus:outline-none focus:border-amber-600 shadow-2xs"
          />
        </div>

        <div>
          <label className="font-bold text-stone-700 block mb-1.5">Phí Vận Chuyển</label>
          <input
            type="number"
            value={cfg.shippingFee}
            onChange={(e) => setCfg({ ...cfg, shippingFee: Number(e.target.value) || 0 })}
            className="w-full h-11 px-3.5 border border-stone-200 rounded-2xl bg-stone-50 font-mono font-bold focus:outline-none focus:border-amber-600 shadow-2xs"
          />
        </div>

        <div>
          <label className="font-bold text-stone-700 block mb-1.5">Mốc Freeship</label>
          <input
            type="number"
            value={cfg.freeShippingThreshold}
            onChange={(e) => setCfg({ ...cfg, freeShippingThreshold: Number(e.target.value) || 0 })}
            className="w-full h-11 px-3.5 border border-stone-200 rounded-2xl bg-stone-50 font-mono font-bold text-emerald-700 focus:outline-none focus:border-amber-600 shadow-2xs"
          />
        </div>

        <div>
          <label className="font-bold text-stone-700 block mb-1.5">Hotline Hỗ Trợ</label>
          <input
            type="text"
            value={cfg.hotline}
            onChange={(e) => setCfg({ ...cfg, hotline: e.target.value })}
            className="w-full h-11 px-3.5 border border-stone-200 rounded-2xl bg-stone-50 font-mono font-bold focus:outline-none focus:border-amber-600 shadow-2xs"
          />
        </div>

        <div>
          <label className="font-bold text-stone-700 block mb-1.5">Mã PIN Kho / Admin</label>
          <input
            type="text"
            maxLength={6}
            value={cfg.warehousePin}
            onChange={(e) => setCfg({ ...cfg, warehousePin: e.target.value })}
            className="w-full h-11 px-3.5 border border-stone-200 rounded-2xl bg-stone-50 font-mono font-bold tracking-widest focus:outline-none focus:border-amber-600 shadow-2xs"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="font-bold text-stone-700 block mb-1.5">
            Chiết Khấu Đơn Cũ: {cfg.loyaltyDiscountPercent}% (Tối đa {Number(cfg.loyaltyMaxDiscount).toLocaleString("vi-VN")}đ)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={cfg.loyaltyDiscountPercent}
              onChange={(e) => setCfg({ ...cfg, loyaltyDiscountPercent: Number(e.target.value) || 0 })}
              className="w-24 h-11 px-3.5 border border-stone-200 rounded-2xl bg-stone-50 font-bold focus:outline-none focus:border-amber-600 shadow-2xs"
            />
            <input
              type="number"
              value={cfg.loyaltyMaxDiscount}
              onChange={(e) => setCfg({ ...cfg, loyaltyMaxDiscount: Number(e.target.value) || 0 })}
              className="flex-1 h-11 px-3.5 border border-stone-200 rounded-2xl bg-stone-50 font-bold focus:outline-none focus:border-amber-600 shadow-2xs"
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="font-bold text-stone-700 block mb-1.5">Thông Báo Chạy Chân Trang</label>
          <input
            type="text"
            value={cfg.announcement}
            onChange={(e) => setCfg({ ...cfg, announcement: e.target.value })}
            className="w-full h-11 px-3.5 border border-stone-200 rounded-2xl bg-stone-50 font-bold text-stone-800 focus:outline-none focus:border-amber-600 shadow-2xs"
          />
        </div>
      </div>
    </div>
  );
}