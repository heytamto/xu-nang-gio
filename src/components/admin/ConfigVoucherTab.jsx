// src/components/admin/ConfigVoucherTab.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  QrCode,
  Tag,
  Layers,
  Plus,
  Trash2,
  Check,
  Pencil,
  X,
  ShieldCheck,
  Mail,
  Send,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Megaphone,
  PlusCircle,
  Building2,
  Percent,
  Truck,
  Gift,
} from "lucide-react";
import { VIETQR_BANKS } from "../../config/shopConfig";
import { supabase } from "../../supabaseClient";
import ConfirmModal from "./ConfirmModal";

// COMPONENT DROPDOWN TỰ VIẾT ĐỒNG BỘ THEO FORM MẪU THƯ
function CustomDropdown({
  label,
  headerLabel = "DANH SÁCH TÙY CHỌN:",
  options = [],
  value,
  onChange,
  renderSelected,
  renderOption,
  icon: Icon,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOpt =
    options.find(
      (opt) => opt.value === value || opt.id === value || opt.bin === value,
    ) || options[0];

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="font-semibold text-stone-600 block mb-1 text-xs">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full py-2.5 px-3.5 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all duration-200 cursor-pointer text-xs ${
          isOpen
            ? "bg-amber-50/60 border-amber-500 ring-2 ring-amber-400/20 shadow-xs"
            : "bg-white hover:bg-stone-50/80 border-amber-400/90 hover:border-amber-500 shadow-2xs"
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {Icon && <Icon className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
          <div className="truncate font-bold text-stone-900">
            {renderSelected
              ? renderSelected(selectedOpt)
              : selectedOpt?.label || selectedOpt?.name}
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-180 text-amber-700" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 p-2 rounded-2xl bg-white border border-amber-200/90 shadow-2xl space-y-1 animate-fadeIn text-xs">
          {headerLabel && (
            <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">
              {headerLabel}
            </div>
          )}

          <div className="max-h-56 overflow-y-auto space-y-1 pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {options.map((opt) => {
              const optVal =
                opt.value !== undefined
                  ? opt.value
                  : opt.bin !== undefined
                    ? opt.bin
                    : opt.id;
              const isSelected = optVal === value;

              return (
                <div
                  key={String(optVal)}
                  onClick={() => {
                    onChange(optVal, opt);
                    setIsOpen(false);
                  }}
                  className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-2 transition-all ${
                    isSelected
                      ? "bg-amber-100/70 text-amber-950 font-bold border border-amber-300/80 shadow-2xs"
                      : "hover:bg-amber-50/70 text-stone-700 font-medium"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    {renderOption ? (
                      renderOption(opt, isSelected)
                    ) : (
                      <span className="truncate">{opt.label || opt.name}</span>
                    )}
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-amber-800 shrink-0 stroke-[2.5]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// CÁC LỰA CHỌN LOẠI GIẢM VOUCHER
const VOUCHER_TYPE_OPTIONS = [
  {
    value: "percent",
    label: "Giảm theo phần trăm (%)",
    subLabel: "Áp dụng tỷ lệ % trên tổng giá trị đơn",
  },
  {
    value: "fixed",
    label: "Giảm số tiền cố định (VNĐ)",
    subLabel: "Trừ trực tiếp số tiền cụ thể vào đơn",
  },
];

export default function ConfigVoucherTab({
  config = {},
  onSaveConfig,
  onShowAlert,
}) {
  const [cfg, setCfg] = useState(() => ({
    bankBin: config.bankBin || "970422",
    bankName: config.bankName || "MBBank",
    accountNo: config.accountNo || "0848957345",
    accountName: config.accountName || "TO THANH TAM",
    depositAmount: config.depositAmount ?? 50000,
    shippingFee: config.shippingFee ?? 30000,
    freeShippingThreshold: config.freeShippingThreshold ?? 300000,
    hotline: config.hotline || "0848.957.345",
    zaloPhone: config.zaloPhone || config.hotline || "0848957345",
    warehousePin: config.warehousePin || "1234",
    address:
      config.address || "Thôn Trường Sanh, Xã Phước Hậu, Tỉnh Ninh Thuận",
    announcement:
      config.announcement ||
      "Nông sản cắt giàn hái sớm - Gửi xe khách trong đêm tới TP.HCM",
    loyaltyDiscountPercent: config.loyaltyDiscountPercent ?? 10,
    loyaltyMaxDiscount: config.loyaltyMaxDiscount ?? 50000,
    autoSendEmail:
      config.autoSendEmail !== false &&
      String(config.autoSendEmail).toUpperCase() !== "FALSE",
  }));

  const [vouchers, setVouchers] = useState([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);

  const [templates, setTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [isNewTemplateModalOpen, setIsNewTemplateModalOpen] = useState(false);
  const [newTemplateForm, setNewTemplateForm] = useState({
    name: "",
    subject: "",
  });
  const [isCreatingTpl, setIsCreatingTpl] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState(null);

  const [editingVoucher, setEditingVoucher] = useState(null);
  const [testEmailInput, setTestEmailInput] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadTemplatesFromDb = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;
      if (Array.isArray(data) && data.length > 0) {
        setTemplates(data);
        setSelectedTemplateId((prev) => prev || data[0].id);
      }
    } catch (err) {
      console.error("Lỗi tải email templates:", err);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  const mapAndSetVouchers = (rows) => {
    const formatted = rows.map((v) => ({
      code: v.code,
      type: v.type || "percent",
      value: Number(v.value) || 0,
      maxDiscount: Number(v.max_discount ?? v.maxDiscount ?? 0),
      minOrder: Number(v.min_order ?? v.minOrder ?? 0),
      canStack: v.can_stack ?? v.canStack ?? true,
      usageLimit: Number(v.usage_limit ?? v.usageLimit ?? 0),
      usedCount: Number(v.used_count ?? v.usedCount ?? 0),
      desc: v.description || v.desc || `Ưu đãi mã ${v.code}`,
    }));
    setVouchers(formatted);
  };

  const loadVouchersFromDb = useCallback(async () => {
    setIsLoadingVouchers(true);
    try {
      const { data, error } = await supabase
        .from("vouchers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        const { data: fallbackData, error: err2 } = await supabase
          .from("vouchers")
          .select("*");
        if (err2) throw err2;
        mapAndSetVouchers(fallbackData || []);
      } else {
        mapAndSetVouchers(data || []);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách vouchers:", err);
    } finally {
      setIsLoadingVouchers(false);
    }
  }, []);

  const loadShopConfigsFromDb = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("shop_configs").select("*");

      if (error) throw error;
      if (Array.isArray(data) && data.length > 0) {
        let merged = {};
        data.forEach((row) => {
          let val = row.value;
          if (typeof val === "string") {
            try {
              val = JSON.parse(val);
            } catch {
              val = {};
            }
          }
          if (val && typeof val === "object") {
            if (row.key === "general" || row.key === "general_config") {
              merged = { ...merged, ...val };
            } else if (row.key === "payment" || row.key === "payment_config") {
              merged = { ...merged, ...val };
            } else if (row.key === "loyalty") {
              merged.loyaltyDiscountPercent = val?.percent ?? 10;
              merged.loyaltyMaxDiscount = val?.maxDiscount ?? 50000;
            } else if (row.key === "announcement") {
              merged.announcement = val?.text || "";
            } else if (row.key === "shipping") {
              merged.shippingFee =
                val?.standardFee ?? val?.shippingFee ?? 30000;
              merged.freeShippingThreshold =
                val?.freeShippingMin ?? val?.freeShippingThreshold ?? 500000;
              merged.carrier = val?.carrier || "";
            }
          }
        });

        setCfg((prev) => ({
          ...prev,
          bankBin: merged.bankBin || prev.bankBin,
          bankName: merged.bankName || prev.bankName,
          accountNo: merged.accountNo || prev.accountNo,
          accountName: merged.accountName || prev.accountName,
          depositAmount:
            merged.depositAmount !== undefined
              ? Number(merged.depositAmount)
              : prev.depositAmount,
          shippingFee:
            merged.shippingFee !== undefined
              ? Number(merged.shippingFee)
              : prev.shippingFee,
          freeShippingThreshold:
            merged.freeShippingThreshold !== undefined
              ? Number(merged.freeShippingThreshold)
              : prev.freeShippingThreshold,
          hotline: merged.hotline || prev.hotline,
          zaloPhone: merged.zaloPhone || merged.hotline || prev.zaloPhone,
          warehousePin: merged.warehousePin || prev.warehousePin,
          address: merged.address || prev.address,
          announcement: merged.announcement || prev.announcement,
          loyaltyDiscountPercent:
            merged.loyaltyDiscountPercent ?? prev.loyaltyDiscountPercent,
          loyaltyMaxDiscount:
            merged.loyaltyMaxDiscount ?? prev.loyaltyMaxDiscount,
          autoSendEmail:
            merged.autoSendEmail !== undefined
              ? merged.autoSendEmail
              : prev.autoSendEmail,
          carrier: merged.carrier || prev.carrier,
        }));
      }
    } catch (err) {
      console.error("Lỗi load shop_configs:", err);
    }
  }, []);

  useEffect(() => {
    loadTemplatesFromDb();
    loadVouchersFromDb();
    loadShopConfigsFromDb();
  }, [loadTemplatesFromDb, loadVouchersFromDb, loadShopConfigsFromDb]);

  const activeTemplate = templates.find((t) => t.id === selectedTemplateId) ||
    templates[0] || {
      id: "empty",
      name: "Chưa có mẫu nào",
      subject: "",
      body: "",
    };

  const handleUpdateActiveTemplate = (field, value) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === activeTemplate.id ? { ...t, [field]: value } : t,
      ),
    );
  };

  const handleCreateNewTemplate = async (e) => {
    e.preventDefault();
    const tplName = newTemplateForm.name.trim();
    if (!tplName) return;

    setIsCreatingTpl(true);
    try {
      const defaultBody = `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e5e5; border-radius: 16px; padding: 24px;">
  <h2 style="color: #92400e; margin-top: 0;">Chào bạn {{CUSTOMER_NAME}},</h2>
  <p>Nhà vườn Xứ Nắng Gió xin thông báo về đơn hàng <strong>{{ORDER_CODE}}</strong> của bạn.</p>
  <div style="background-color: #fef3c7; padding: 16px; border-radius: 12px; margin: 16px 0;">
    <p style="margin: 0;"><strong>Tổng thanh toán:</strong> {{TOTAL}}đ</p>
    <p style="margin: 8px 0 0 0;"><strong>Hình thức:</strong> {{PAYMENT_METHOD}}</p>
  </div>
  <p>Chi tiết sản phẩm:<br/>{{ITEMS_SUMMARY}}</p>
  <p>Địa chỉ nhận: {{ADDRESS}}</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
  <p style="font-size: 12px; color: #888;">Hotline hỗ trợ: ${cfg.hotline} • Cảm ơn bạn đã tin chọn nông sản sạch Ninh Thuận!</p>
</div>`;

      const { data, error } = await supabase
        .from("email_templates")
        .insert([
          {
            name: tplName,
            subject:
              newTemplateForm.subject.trim() ||
              `[Xứ Nắng Gió] Thông báo đơn hàng {{ORDER_CODE}}`,
            body: defaultBody,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setTemplates((prev) => [...prev, data]);
        setSelectedTemplateId(data.id);
        setIsNewTemplateModalOpen(false);
        setNewTemplateForm({ name: "", subject: "" });
        onShowAlert?.(`Đã tạo thành công mẫu "${data.name}"!`);
      }
    } catch (err) {
      console.error("Lỗi tạo template mới:", err);
      onShowAlert?.("Lỗi tạo mẫu email: " + err.message);
    } finally {
      setIsCreatingTpl(false);
    }
  };

  const handleDeleteActiveTemplate = () => {
    if (templates.length <= 1) {
      setConfirmModalConfig({
        isAlert: true,
        title: "Không Thể Xóa",
        message:
          "Hệ thống phải có ít nhất 1 mẫu email để gửi thông báo cho khách hàng!",
      });
      return;
    }

    setConfirmModalConfig({
      isAlert: false,
      title: "Xóa Mẫu Email",
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn mẫu thư "${activeTemplate.name}"?`,
      confirmLabel: "Xác nhận xóa",
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from("email_templates")
            .delete()
            .eq("id", activeTemplate.id);

          if (error) throw error;

          const remaining = templates.filter((t) => t.id !== activeTemplate.id);
          setTemplates(remaining);
          setSelectedTemplateId(remaining[0].id);
          onShowAlert?.("Đã xóa mẫu email thành công!");
        } catch (err) {
          console.error("Lỗi xóa template:", err);
          onShowAlert?.("Không thể xóa template: " + err.message);
        }
      },
    });
  };

  const handleSelectBankBin = (bin, bankObj) => {
    setCfg((prev) => ({
      ...prev,
      bankBin: bin,
      bankName: bankObj?.shortName || prev.bankName,
    }));
  };

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

  const handleAddVoucher = async (e) => {
    e.preventDefault();
    if (!newVoucher.code.trim()) return;
    const formattedCode = newVoucher.code.trim().toUpperCase();

    if (vouchers.some((v) => v.code === formattedCode)) {
      onShowAlert?.("Mã voucher này đã có trong danh sách.");
      return;
    }

    const payload = {
      code: formattedCode,
      type: newVoucher.type,
      value: Number(newVoucher.value) || 0,
      max_discount:
        newVoucher.type === "percent" ? Number(newVoucher.maxDiscount) || 0 : 0,
      min_order: Number(newVoucher.minOrder) || 0,
      can_stack: Boolean(newVoucher.canStack),
      usage_limit: Number(newVoucher.usageLimit) || 0,
      used_count: 0,
    };

    try {
      const { error } = await supabase.from("vouchers").insert([payload]);

      if (error) throw error;

      setVouchers((prev) => [
        {
          ...newVoucher,
          code: formattedCode,
          value: Number(newVoucher.value) || 0,
          maxDiscount:
            newVoucher.type === "percent"
              ? Number(newVoucher.maxDiscount) || 0
              : 0,
          minOrder: Number(newVoucher.minOrder) || 0,
          usageLimit: Number(newVoucher.usageLimit) || 0,
          usedCount: 0,
          canStack: Boolean(newVoucher.canStack),
          desc: newVoucher.desc.trim() || `Ưu đãi mã ${formattedCode}`,
        },
        ...prev,
      ]);

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

      onShowAlert?.(`Đã tạo và kích hoạt mã ${formattedCode} thành công!`);
    } catch (err) {
      console.error("Lỗi thêm voucher:", err);
      onShowAlert?.("Không thể thêm voucher: " + err.message);
    }
  };

  const handleToggleVoucherStack = async (code) => {
    const current = vouchers.find((v) => v.code === code);
    if (!current) return;
    const nextVal = !current.canStack;

    try {
      const { error } = await supabase
        .from("vouchers")
        .update({ can_stack: nextVal })
        .eq("code", code);

      if (error) throw error;

      setVouchers((prev) =>
        prev.map((v) => (v.code === code ? { ...v, canStack: nextVal } : v)),
      );
    } catch (err) {
      console.error("Lỗi cập nhật gộp mã:", err);
      onShowAlert?.("Lỗi cập nhật voucher: " + err.message);
    }
  };

  const handleRemoveVoucher = (code) => {
    setConfirmModalConfig({
      isAlert: false,
      title: "Xóa Voucher",
      message: `Bạn có chắc chắn muốn gỡ vĩnh viễn voucher "${code}" khỏi cơ sở dữ liệu?`,
      confirmLabel: "Xác nhận xóa",
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from("vouchers")
            .delete()
            .eq("code", code);

          if (error) throw error;

          setVouchers((prev) => prev.filter((v) => v.code !== code));
          onShowAlert?.(`Đã xóa mã ${code} thành công!`);
        } catch (err) {
          console.error("Lỗi xóa voucher:", err);
          onShowAlert?.("Lỗi khi xóa voucher: " + err.message);
        }
      },
    });
  };

  const handleSaveEditedVoucher = async (e) => {
    e.preventDefault();
    if (!editingVoucher) return;

    const payload = {
      type: editingVoucher.type,
      value: Number(editingVoucher.value) || 0,
      max_discount:
        editingVoucher.type === "percent"
          ? Number(editingVoucher.maxDiscount) || 0
          : 0,
      min_order: Number(editingVoucher.minOrder) || 0,
      usage_limit: Number(editingVoucher.usageLimit) || 0,
      can_stack: Boolean(editingVoucher.canStack),
    };

    try {
      const { error } = await supabase
        .from("vouchers")
        .update(payload)
        .eq("code", editingVoucher.code);

      if (error) throw error;

      setVouchers((prev) =>
        prev.map((v) =>
          v.code === editingVoucher.code
            ? {
                ...editingVoucher,
                value: Number(editingVoucher.value) || 0,
                maxDiscount:
                  editingVoucher.type === "percent"
                    ? Number(editingVoucher.maxDiscount) || 0
                    : 0,
                minOrder: Number(editingVoucher.minOrder) || 0,
                usageLimit: Number(editingVoucher.usageLimit) || 0,
                canStack: Boolean(editingVoucher.canStack),
                desc: (editingVoucher.desc || "").trim(),
              }
            : v,
        ),
      );

      setEditingVoucher(null);
      onShowAlert?.(`Đã cập nhật voucher ${editingVoucher.code}!`);
    } catch (err) {
      console.error("Lỗi cập nhật voucher:", err);
      onShowAlert?.("Lỗi cập nhật: " + err.message);
    }
  };

  const handleSendTestEmail = async () => {
    const targetEmail = testEmailInput.trim();
    if (!targetEmail || !targetEmail.includes("@")) {
      onShowAlert?.("Vui lòng nhập địa chỉ email hợp lệ!");
      return;
    }

    setIsSendingTest(true);
    try {
      const sampleHtml = activeTemplate.body
        .replace(/{{CUSTOMER_NAME}}/g, "Khách Quý")
        .replace(/{{ORDER_CODE}}/g, "XNG-TEST")
        .replace(/{{TOTAL}}/g, "250.000")
        .replace(
          /{{ITEMS_SUMMARY}}/g,
          "• 2kg Táo Gió Ninh Thuận x1<br/>• 1 Chai Mật Nho x1",
        )
        .replace(/{{PAYMENT_METHOD}}/g, "Chuyển khoản VietQR")
        .replace(/{{ADDRESS}}/g, "TP. Thủ Đức, TP. Hồ Chí Minh")
        .replace(/{{VOUCHER_CODE}}/g, "LAMQUEN")
        .replace(/{{VOUCHER_DESC}}/g, "Giảm 15.000đ");

      const sampleSubject = activeTemplate.subject
        .replace(/{{CUSTOMER_NAME}}/g, "Khách Quý")
        .replace(/{{ORDER_CODE}}/g, "XNG-TEST");

      const { error } = await supabase.functions.invoke("send-order-email", {
        body: {
          is_test: true,
          to: targetEmail,
          subject: sampleSubject,
          html: sampleHtml,
        },
      });

      if (error) throw error;
      onShowAlert?.(
        `Đã gửi mẫu "${activeTemplate.name}" thử nghiệm tới: ${targetEmail}`,
      );
    } catch (err) {
      console.error("Lỗi test email:", err);
      onShowAlert?.(
        `Lỗi gửi mail: ${err.message || "Không thể kết nối Edge Function"}`,
      );
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      if (onSaveConfig) {
        onSaveConfig({ ...cfg, vouchers });
      }

      const nowIso = new Date().toISOString();

      const configsToUpsert = [
        {
          key: "general",
          value: {
            address: cfg.address,
            hotline: cfg.hotline,
            zaloPhone: cfg.zaloPhone,
            brandName: "Xứ Nắng Gió",
            shopName: "Xứ Nắng Gió",
            tagline:
              "Nông sản cắt giàn hái sớm - Gửi xe khách trong đêm tới TP.HCM",
            warehousePin: cfg.warehousePin,
            autoSendEmail: cfg.autoSendEmail,
            shippingFee: cfg.shippingFee,
            freeShippingThreshold: cfg.freeShippingThreshold,
          },
          description:
            "Thông tin liên hệ chung, phí vận chuyển và cấu hình vận hành",
          updated_at: nowIso,
        },
        {
          key: "payment",
          value: {
            bankBin: cfg.bankBin,
            bankName: cfg.bankName,
            accountNo: cfg.accountNo,
            accountName: cfg.accountName,
            depositAmount: cfg.depositAmount,
            shippingFee: cfg.shippingFee,
            freeShippingThreshold: cfg.freeShippingThreshold,
          },
          description:
            "Thông tin tài khoản VietQR, tiền cọc và cước vận chuyển",
          updated_at: nowIso,
        },
        {
          key: "loyalty",
          value: {
            percent: cfg.loyaltyDiscountPercent,
            maxDiscount: cfg.loyaltyMaxDiscount,
          },
          description: "Chính sách chiết khấu tri ân khách quen",
          updated_at: nowIso,
        },
        {
          key: "announcement",
          value: {
            text: cfg.announcement,
          },
          description: "Thông báo chạy chữ chân trang",
          updated_at: nowIso,
        },
        {
          key: "shipping",
          value: {
            carrier:
              cfg.carrier ||
              "Gửi xe khách liên tỉnh & Chuyển phát nhanh đóng thùng xốp",
            standardFee: Number(cfg.shippingFee) || 30000,
            freeShippingMin: Number(cfg.freeShippingThreshold) || 500000,
          },
          description: "Cấu hình đơn vị vận chuyển, phí ship và mốc freeship",
          updated_at: nowIso,
        },
      ];

      const { error: cfgErr } = await supabase
        .from("shop_configs")
        .upsert(configsToUpsert, { onConflict: "key" });

      if (cfgErr) throw cfgErr;

      if (templates.length > 0) {
        const payloadTemplates = templates.map((t) => ({
          id: t.id,
          name: t.name,
          subject: t.subject,
          body: t.body,
          is_active: t.is_active ?? true,
          updated_at: nowIso,
        }));

        const { error: tplErr } = await supabase
          .from("email_templates")
          .upsert(payloadTemplates, { onConflict: "id" });

        if (tplErr) throw tplErr;
      }

      onShowAlert?.(
        "Đã lưu thành công cấu hình vận hành, phí ship & Email templates!",
      );
    } catch (err) {
      console.error("Lỗi lưu cấu hình:", err);
      onShowAlert?.("Lỗi kết nối khi lưu: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      {/* 1. CẤU HÌNH THANH TOÁN, VIETQR, VẬN CHUYỂN & VẬN HÀNH */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
          <QrCode className="w-4 h-4 text-amber-600" />
          <span>
            Cấu Hình Thanh Toán, VietQR, Vận Chuyển & Ưu Đãi Khách Quen
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
          {/* CUSTOM DROPDOWN CHỌN NGÂN HÀNG VIETQR */}
          <div className="sm:col-span-2">
            <CustomDropdown
              label="Ngân hàng nhận tiền:"
              headerLabel="DANH SÁCH NGÂN HÀNG VIETQR:"
              icon={Building2}
              options={VIETQR_BANKS}
              value={cfg.bankBin}
              onChange={handleSelectBankBin}
              renderSelected={(opt) => (
                <div className="flex items-center gap-2 truncate">
                  <span className="font-bold text-stone-900">
                    {opt?.shortName}
                  </span>
                  <span className="text-[11px] font-normal text-stone-500 truncate">
                    ({opt?.name})
                  </span>
                </div>
              )}
              renderOption={(opt, isSelected) => (
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate">
                    <span className="font-bold">{opt.shortName}</span>
                    <span className="text-[10.5px] text-stone-500 pl-1.5 font-normal truncate">
                      {opt.name}
                    </span>
                  </div>
                  <span
                    className={`text-[10.5px] font-mono shrink-0 ${isSelected ? "text-amber-800" : "text-stone-400"}`}
                  >
                    BIN: {opt.bin}
                  </span>
                </div>
              )}
            />
          </div>

          <div>
            <label className="font-semibold text-stone-600 block mb-1">
              Số Tài Khoản:
            </label>
            <input
              type="text"
              value={cfg.accountNo}
              onChange={(e) => setCfg({ ...cfg, accountNo: e.target.value })}
              className="w-full p-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white font-mono font-bold text-stone-800 focus:outline-none focus:border-amber-600"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-600 block mb-1">
              Tên Chủ Tài Khoản:
            </label>
            <input
              type="text"
              value={cfg.accountName}
              onChange={(e) =>
                setCfg({ ...cfg, accountName: e.target.value.toUpperCase() })
              }
              className="w-full p-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white font-mono uppercase font-bold focus:outline-none focus:border-amber-600"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-600 block mb-1">
              Tiền Cọc Giữ Đơn (VNĐ):
            </label>
            <input
              type="number"
              step="5000"
              value={cfg.depositAmount}
              onChange={(e) =>
                setCfg({ ...cfg, depositAmount: Number(e.target.value) || 0 })
              }
              className="w-full p-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white font-mono font-bold text-amber-700 focus:outline-none focus:border-amber-600"
            />
          </div>

          {/* CẤU HÌNH PHÍ SHIP MẶC ĐỊNH */}
          <div>
            <label className="font-semibold text-stone-600 block mb-1 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-amber-700" />
              <span>Phí Vận Chuyển Mặc Định:</span>
            </label>
            <input
              type="number"
              step="1000"
              value={cfg.shippingFee}
              onChange={(e) =>
                setCfg({ ...cfg, shippingFee: Number(e.target.value) || 0 })
              }
              className="w-full p-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white font-mono font-bold text-stone-900 focus:outline-none focus:border-amber-600"
            />
          </div>

          {/* CẤU HÌNH MỐC MIỄN PHÍ VẬN CHUYỂN */}
          <div>
            <label className="font-semibold text-stone-600 block mb-1 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mốc Miễn Phí Vận Chuyển:</span>
            </label>
            <input
              type="number"
              step="10000"
              value={cfg.freeShippingThreshold}
              onChange={(e) =>
                setCfg({
                  ...cfg,
                  freeShippingThreshold: Number(e.target.value) || 0,
                })
              }
              className="w-full p-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white font-mono font-bold text-emerald-700 focus:outline-none focus:border-amber-600"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-600 block mb-1">
              Hotline / Zalo hỗ trợ:
            </label>
            <input
              type="text"
              placeholder="VD: 0848.957.345"
              value={cfg.hotline}
              onChange={(e) =>
                setCfg({
                  ...cfg,
                  hotline: e.target.value,
                  zaloPhone: e.target.value.replace(/[^0-9]/g, ""),
                })
              }
              className="w-full p-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white font-mono text-stone-800 focus:outline-none focus:border-amber-600"
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
              className="w-full p-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white font-mono font-bold text-amber-900 focus:outline-none focus:border-amber-600"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-600 block mb-1">
              % Giảm Khách Cũ (Loyalty):
            </label>
            <input
              type="number"
              value={cfg.loyaltyDiscountPercent}
              onChange={(e) =>
                setCfg({
                  ...cfg,
                  loyaltyDiscountPercent: Number(e.target.value) || 0,
                })
              }
              className="w-full p-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white font-mono font-bold text-emerald-700 focus:outline-none focus:border-amber-600"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-600 block mb-1">
              Trần Giảm Khách Cũ (VNĐ):
            </label>
            <input
              type="number"
              value={cfg.loyaltyMaxDiscount}
              onChange={(e) =>
                setCfg({
                  ...cfg,
                  loyaltyMaxDiscount: Number(e.target.value) || 0,
                })
              }
              className="w-full p-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white font-mono font-bold text-emerald-700 focus:outline-none focus:border-amber-600"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-2">
            <label className="font-semibold text-stone-600 block mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-700" />
              <span>Địa Chỉ Vườn Chính / Điểm Gửi Xe:</span>
            </label>
            <input
              type="text"
              value={cfg.address || ""}
              onChange={(e) => setCfg({ ...cfg, address: e.target.value })}
              placeholder="VD: Thôn Trường Sanh, Xã Phước Hậu, Tỉnh Ninh Thuận"
              className="w-full p-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 font-medium focus:outline-none focus:border-amber-600"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4">
            <label className="font-semibold text-stone-600 block mb-1 flex items-center gap-1">
              <Megaphone className="w-3.5 h-3.5 text-amber-700" />
              <span>Thông Báo Chạy Chân Trang (Banner Marquee):</span>
            </label>
            <input
              type="text"
              value={cfg.announcement || ""}
              onChange={(e) => setCfg({ ...cfg, announcement: e.target.value })}
              placeholder="VD: Nông sản cắt giàn hái sớm - Gửi xe khách trong đêm tới TP.HCM..."
              className="w-full p-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 font-medium focus:outline-none focus:border-amber-600"
            />
          </div>
        </div>
      </div>

      {/* 2. CẤU HÌNH VOUCHER */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
            <Tag className="w-4 h-4 text-amber-600" />
            <span>Danh Sách Mã Khuyến Mãi ({vouchers.length} mã)</span>
          </div>
          <span className="text-xs text-stone-500 hidden sm:inline">
            Dữ liệu đồng bộ trực tiếp từ bảng <strong>public.vouchers</strong>
          </span>
        </div>

        {isLoadingVouchers ? (
          <div className="p-8 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
            <span>Đang tải danh sách voucher từ hệ thống...</span>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="p-6 text-center text-xs text-stone-500 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
            Chưa có voucher nào trong bảng <code>vouchers</code>. Hãy tạo mã đầu
            tiên bên dưới!
          </div>
        ) : (
          <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-stone-50/50">
            {vouchers.map((v) => {
              const limit = Number(v.usageLimit) || 0;
              const used = Number(v.usedCount) || 0;
              const remaining =
                limit > 0 ? Math.max(0, limit - used) : "Vô hạn";
              const isOutOfStock = limit > 0 && remaining === 0;

              return (
                <div
                  key={v.code}
                  className="p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs bg-white"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                        {v.code}
                      </span>
                      <span className="font-bold text-stone-800">
                        {v.type === "percent"
                          ? `Giảm ${v.value}%${v.maxDiscount ? ` (Tối đa ${Number(v.maxDiscount).toLocaleString("vi-VN")}đ)` : ""}`
                          : `Giảm ${Number(v.value).toLocaleString("vi-VN")}đ`}
                      </span>

                      {v.canStack ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[10px]">
                          <Layers className="w-3.5 h-3.5 text-emerald-600" />
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
                        <span className="bg-stone-100 text-stone-600 font-semibold px-2 py-0.5 rounded-md text-[10px]">
                          Còn lại:{" "}
                          <strong className="font-mono text-amber-900">
                            {remaining}
                          </strong>{" "}
                          {limit > 0 ? `(${used}/${limit} đã dùng)` : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-stone-500 text-[11px]">
                      {v.desc ? `${v.desc} • ` : ""}Đơn tối thiểu:{" "}
                      <strong className="text-stone-700 font-mono">
                        {v.minOrder
                          ? `${Number(v.minOrder).toLocaleString("vi-VN")}đ`
                          : "0đ"}
                      </strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleVoucherStack(v.code)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                        v.canStack
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                          : "bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200"
                      }`}
                    >
                      {v.canStack ? "Cho phép gộp" : "Không cho gộp"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingVoucher({ ...v })}
                      className="p-1.5 text-stone-400 hover:text-amber-600 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Chỉnh sửa voucher"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveVoucher(v.code)}
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Xóa voucher"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Form thêm voucher mới */}
        <form
          onSubmit={handleAddVoucher}
          className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3"
        >
          <span className="font-bold text-xs text-stone-800 block">
            Tạo voucher mới vào cơ sở dữ liệu:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
            <div>
              <label className="text-[10px] text-stone-500 font-semibold block mb-1">
                Mã CODE *
              </label>
              <input
                type="text"
                required
                placeholder="VD: FREESHIP"
                value={newVoucher.code}
                onChange={(e) =>
                  setNewVoucher({
                    ...newVoucher,
                    code: e.target.value.toUpperCase(),
                  })
                }
                className="w-full p-2 rounded-2xl border border-stone-200 bg-white font-mono uppercase font-bold text-stone-900 focus:outline-none focus:border-amber-600"
              />
            </div>

            {/* CUSTOM DROPDOWN CHỌN LOẠI GIẢM */}
            <div className="lg:col-span-2">
              <CustomDropdown
                label="Loại giảm"
                headerLabel="HÌNH THỨC CHIẾT KHẤU:"
                icon={Percent}
                options={VOUCHER_TYPE_OPTIONS}
                value={newVoucher.type}
                onChange={(val) => setNewVoucher({ ...newVoucher, type: val })}
                renderSelected={(opt) => <span>{opt?.label}</span>}
                renderOption={(opt) => (
                  <div className="space-y-0.5">
                    <span className="font-bold block">{opt.label}</span>
                    <span className="text-[10px] text-stone-400 block font-light">
                      {opt.subLabel}
                    </span>
                  </div>
                )}
              />
            </div>

            <div>
              <label className="text-[10px] text-stone-500 font-semibold block mb-1">
                {newVoucher.type === "percent"
                  ? "Mức giảm (%) *"
                  : "Mức giảm (VNĐ) *"}
              </label>
              <input
                type="number"
                required
                min="0"
                value={newVoucher.value}
                onChange={(e) =>
                  setNewVoucher({ ...newVoucher, value: e.target.value })
                }
                className="w-full p-2 rounded-2xl border border-stone-200 bg-white font-mono font-bold focus:outline-none focus:border-amber-600"
              />
            </div>

            {newVoucher.type === "percent" && (
              <div>
                <label className="text-[10px] text-stone-500 font-semibold block mb-1">
                  Giảm tối đa (VNĐ)
                </label>
                <input
                  type="number"
                  placeholder="0 = Không giới hạn"
                  value={newVoucher.maxDiscount}
                  onChange={(e) =>
                    setNewVoucher({
                      ...newVoucher,
                      maxDiscount: e.target.value,
                    })
                  }
                  className="w-full p-2 rounded-2xl border border-stone-200 bg-white font-mono text-emerald-800 font-bold focus:outline-none focus:border-amber-600"
                />
              </div>
            )}

            <div>
              <label className="text-[10px] text-stone-500 font-semibold block mb-1">
                Đơn tối thiểu (VNĐ)
              </label>
              <input
                type="number"
                value={newVoucher.minOrder}
                onChange={(e) =>
                  setNewVoucher({ ...newVoucher, minOrder: e.target.value })
                }
                placeholder="0"
                className="w-full p-2 rounded-2xl border border-stone-200 bg-white font-mono focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="text-[10px] text-stone-500 font-semibold block mb-1">
                SL Giới Hạn (Lượt)
              </label>
              <input
                type="number"
                value={newVoucher.usageLimit}
                onChange={(e) =>
                  setNewVoucher({ ...newVoucher, usageLimit: e.target.value })
                }
                placeholder="0 = Vô hạn"
                className="w-full p-2 rounded-2xl border border-stone-200 bg-white font-mono font-bold text-amber-800 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div className="lg:col-span-6">
              <label className="text-[10px] text-stone-500 font-semibold block mb-1">
                Mô tả hiển thị
              </label>
              <input
                type="text"
                placeholder="VD: Miễn phí vận chuyển cho đơn từ 300k"
                value={newVoucher.desc}
                onChange={(e) =>
                  setNewVoucher({ ...newVoucher, desc: e.target.value })
                }
                className="w-full p-2 rounded-2xl border border-stone-200 bg-white font-medium focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200/60">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-950 bg-amber-50 px-3 py-1.5 rounded-2xl border border-amber-200">
              <input
                type="checkbox"
                checked={newVoucher.canStack}
                onChange={(e) =>
                  setNewVoucher({ ...newVoucher, canStack: e.target.checked })
                }
                className="w-4 h-4 rounded-md accent-amber-600 cursor-pointer"
              />
              <span>Cho phép gộp với các voucher khác (canStack)</span>
            </label>

            <button
              type="submit"
              className="px-5 py-2.5 bg-stone-900 hover:bg-amber-800 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Voucher Vào Hệ Thống</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. CẤU HÌNH EMAIL TEMPLATES */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <span>Mẫu Email Hệ Thống ({templates.length} mẫu)</span>
              <p className="text-[11px] font-normal text-stone-500">
                Được đồng bộ trực tiếp từ bảng email_templates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsNewTemplateModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-amber-200" />
              <span>Tạo Mẫu Mới</span>
            </button>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-950 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
              <input
                type="checkbox"
                checked={cfg.autoSendEmail}
                onChange={(e) =>
                  setCfg({ ...cfg, autoSendEmail: e.target.checked })
                }
                className="w-4 h-4 rounded-md accent-amber-600 cursor-pointer"
              />
              <span>Tự động gửi khi có đơn</span>
            </label>
          </div>
        </div>

        {/* Khung chọn mẫu thư */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-amber-50/40 p-3.5 rounded-2xl border border-amber-200/60 relative">
          <div className="relative" ref={dropdownRef}>
            <label className="font-bold text-amber-900 mb-1.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-700" />
                <span>Mẫu thư đang chỉnh sửa:</span>
              </span>
              {templates.length > 1 && (
                <button
                  type="button"
                  onClick={handleDeleteActiveTemplate}
                  className="text-stone-400 hover:text-rose-600 flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer"
                  title="Xóa mẫu thư này"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Xóa mẫu</span>
                </button>
              )}
            </label>

            <button
              type="button"
              disabled={isLoadingTemplates || templates.length === 0}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-stone-200 hover:border-amber-400 rounded-2xl text-stone-800 font-bold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-amber-800 font-bold">
                  {activeTemplate.name}
                </span>
                <span className="text-[11px] font-mono text-stone-400 font-normal">
                  ({activeTemplate.id})
                </span>
              </div>
              {isDropdownOpen ? (
                <ChevronUp className="w-4 h-4 text-stone-500 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-stone-500 shrink-0" />
              )}
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-full sm:w-80 bg-white border border-stone-200/80 rounded-3xl p-2.5 shadow-2xl z-30 space-y-1 animate-fadeIn [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="px-3 py-1.5 text-[10px] font-black uppercase text-stone-400 tracking-wider">
                  DANH SÁCH MẪU TRONG DATABASE:
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {templates.map((tpl) => {
                    const isSelected = tpl.id === activeTemplate.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => {
                          setSelectedTemplateId(tpl.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-colors cursor-pointer text-left ${
                          isSelected
                            ? "bg-[#fffbeb] text-amber-950 font-black"
                            : "text-stone-700 hover:bg-stone-50 font-medium"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span>{tpl.name}</span>
                          <span className="text-[10px] font-mono text-stone-400 font-normal">
                            {tpl.id}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-amber-800 stroke-[2.5]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1.5 text-xs">
              Tên gợi nhớ của mẫu:
            </label>
            <input
              type="text"
              value={activeTemplate.name || ""}
              onChange={(e) =>
                handleUpdateActiveTemplate("name", e.target.value)
              }
              className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 bg-white font-medium text-stone-800 text-xs sm:text-sm focus:outline-none focus:border-amber-600 transition-colors shadow-2xs"
            />
          </div>
        </div>

        {/* Biến chèn tự động */}
        <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-200/70 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-stone-700 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Các biến tự động chèn dữ liệu vào mẫu:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
            {[
              "{{CUSTOMER_NAME}}",
              "{{ORDER_CODE}}",
              "{{TOTAL}}",
              "{{ITEMS_SUMMARY}}",
              "{{PAYMENT_METHOD}}",
              "{{ADDRESS}}",
              "{{VOUCHER_CODE}}",
              "{{VOUCHER_DESC}}",
            ].map((tag) => (
              <span
                key={tag}
                className="bg-white text-amber-900 px-2 py-0.5 rounded-md border border-stone-200 shadow-2xs font-semibold"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-stone-700 block mb-1">
              Tiêu đề thư gửi khách:
            </label>
            <input
              type="text"
              value={activeTemplate.subject || ""}
              onChange={(e) =>
                handleUpdateActiveTemplate("subject", e.target.value)
              }
              className="w-full p-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white font-medium text-stone-800 focus:outline-none focus:border-amber-600 transition-colors"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">
              Nội dung thư (HTML từ database):
            </label>
            <textarea
              rows={12}
              value={activeTemplate.body || ""}
              onChange={(e) =>
                handleUpdateActiveTemplate("body", e.target.value)
              }
              className="w-full p-3 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white font-mono text-xs text-stone-800 focus:outline-none focus:border-amber-600 transition-colors leading-relaxed"
            />
          </div>

          <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <span className="text-[11px] text-stone-500">
              Kiểm tra hiển thị của mẫu <strong>{activeTemplate.name}</strong>:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="Nhập email của bạn để nhận thử..."
                value={testEmailInput}
                onChange={(e) => setTestEmailInput(e.target.value)}
                className="w-full sm:w-64 p-2 rounded-2xl border border-stone-200 text-xs focus:outline-none focus:border-amber-600 bg-white"
              />
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={isSendingTest}
                className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isSendingTest ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-amber-700" />
                )}
                <span>{isSendingTest ? "Đang gửi..." : "Gửi Test"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. NÚT LƯU TOÀN BỘ CẤU HÌNH & TEMPLATES */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          disabled={isSaving}
          onClick={handleSaveAll}
          className="px-6 py-3 bg-amber-800 hover:bg-amber-900 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          <span>
            {isSaving
              ? "Đang lưu hệ thống..."
              : "Lưu Toàn Bộ Cấu Hình & Templates"}
          </span>
        </button>
      </div>

      {/* 5. MODAL TẠO MẪU EMAIL MỚI */}
      {isNewTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn font-sans">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-amber-700" />
                <span>Thêm Mẫu Email Mới</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewTemplateModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-xl hover:bg-stone-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreateNewTemplate}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="text-[11px] text-stone-700 font-bold block mb-1">
                  Tên gợi nhớ của mẫu *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Thông báo xe đã xuất bến"
                  value={newTemplateForm.name}
                  onChange={(e) =>
                    setNewTemplateForm({
                      ...newTemplateForm,
                      name: e.target.value,
                    })
                  }
                  className="w-full p-2.5 rounded-2xl border border-stone-200 bg-white font-medium text-stone-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="text-[11px] text-stone-700 font-bold block mb-1">
                  Tiêu đề email mặc định:
                </label>
                <input
                  type="text"
                  placeholder="VD: [Xứ Nắng Gió] Thùng hàng {{ORDER_CODE}} đang trên đường tới bạn"
                  value={newTemplateForm.subject}
                  onChange={(e) =>
                    setNewTemplateForm({
                      ...newTemplateForm,
                      subject: e.target.value,
                    })
                  }
                  className="w-full p-2.5 rounded-2xl border border-stone-200 bg-white font-medium text-stone-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsNewTemplateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTpl}
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-amber-800 hover:bg-amber-900 text-white shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isCreatingTpl ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang tạo...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tạo Mẫu Ngay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL CHỈNH SỬA VOUCHER */}
      {editingVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn font-sans">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 space-y-4 max-h-[92vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-xl hover:bg-stone-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSaveEditedVoucher}
              className="space-y-3.5 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* CUSTOM DROPDOWN CHỌN LOẠI GIẢM TRONG MODAL EDIT */}
                <div>
                  <CustomDropdown
                    label="Loại giảm"
                    options={VOUCHER_TYPE_OPTIONS}
                    value={editingVoucher.type}
                    onChange={(val) =>
                      setEditingVoucher({ ...editingVoucher, type: val })
                    }
                    renderSelected={(opt) => (
                      <span>
                        {opt?.value === "percent"
                          ? "Giảm theo %"
                          : "Giảm tiền (VNĐ)"}
                      </span>
                    )}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-stone-500 font-semibold block mb-1">
                    {editingVoucher.type === "percent"
                      ? "Mức giảm (%) *"
                      : "Mức giảm (VNĐ) *"}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingVoucher.value}
                    onChange={(e) =>
                      setEditingVoucher({
                        ...editingVoucher,
                        value: e.target.value,
                      })
                    }
                    className="w-full p-2.5 rounded-2xl border border-stone-200 bg-white font-mono font-bold focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              {editingVoucher.type === "percent" && (
                <div>
                  <label className="text-[10px] text-stone-500 font-semibold block mb-1">
                    Giảm tối đa (VNĐ)
                  </label>
                  <input
                    type="number"
                    placeholder="0 = Không giới hạn"
                    value={editingVoucher.maxDiscount}
                    onChange={(e) =>
                      setEditingVoucher({
                        ...editingVoucher,
                        maxDiscount: e.target.value,
                      })
                    }
                    className="w-full p-2.5 rounded-2xl border border-stone-200 bg-white font-mono text-emerald-800 font-bold focus:outline-none focus:border-amber-600"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] text-stone-500 font-semibold block mb-1">
                    Đơn tối thiểu (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={editingVoucher.minOrder}
                    onChange={(e) =>
                      setEditingVoucher({
                        ...editingVoucher,
                        minOrder: e.target.value,
                      })
                    }
                    className="w-full p-2.5 rounded-2xl border border-stone-200 bg-white font-mono focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-stone-500 font-semibold block mb-1">
                    SL Giới hạn (0 = Vô hạn)
                  </label>
                  <input
                    type="number"
                    value={editingVoucher.usageLimit}
                    onChange={(e) =>
                      setEditingVoucher({
                        ...editingVoucher,
                        usageLimit: e.target.value,
                      })
                    }
                    className="w-full p-2.5 rounded-2xl border border-stone-200 bg-white font-mono font-bold text-amber-800 focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-stone-500 font-semibold block mb-1">
                  Mô tả hiển thị
                </label>
                <input
                  type="text"
                  value={editingVoucher.desc || ""}
                  onChange={(e) =>
                    setEditingVoucher({
                      ...editingVoucher,
                      desc: e.target.value,
                    })
                  }
                  className="w-full p-2.5 rounded-2xl border border-stone-200 bg-white font-medium focus:outline-none focus:border-amber-600"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-950 bg-amber-50 p-2.5 rounded-2xl border border-amber-200">
                <input
                  type="checkbox"
                  checked={editingVoucher.canStack}
                  onChange={(e) =>
                    setEditingVoucher({
                      ...editingVoucher,
                      canStack: e.target.checked,
                    })
                  }
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
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Cập Nhật Voucher</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. CONFIRM MODAL ĐỒNG BỘ */}
      <ConfirmModal
        modalConfig={confirmModalConfig}
        onClose={() => setConfirmModalConfig(null)}
      />
    </div>
  );
}
