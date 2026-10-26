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
  FolderTree,
} from "lucide-react";
import { VIETQR_BANKS } from "../../config/shopConfig";
import { supabase } from "../../supabaseClient";
import ConfirmModal from "./ConfirmModal";

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
    <div className="relative w-full font-sans text-stone-800" ref={containerRef}>
      {label && (
        <label className="font-bold text-stone-700 block mb-1.5 text-xs sm:text-sm">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full h-11 px-4 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all duration-200 cursor-pointer text-xs sm:text-sm ${
          isOpen
            ? "bg-amber-50/60 border-amber-500 ring-2 ring-amber-400/20 shadow-xs text-stone-900 font-bold"
            : "bg-white hover:bg-stone-50/80 border-stone-200 hover:border-amber-500 shadow-2xs text-stone-800 font-medium"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon className="w-4 h-4 text-amber-700 shrink-0" />}
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
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 p-2 rounded-2xl bg-white border border-amber-200/90 shadow-2xl space-y-1 animate-fadeIn text-xs sm:text-sm">
          {headerLabel && (
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">
              {headerLabel}
            </div>
          )}

          <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                  className={`p-3 rounded-xl cursor-pointer flex items-center justify-between gap-2 transition-all ${
                    isSelected
                      ? "bg-amber-100/80 text-amber-950 font-bold border border-amber-300 shadow-2xs"
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
    enablePaymentGifts:
      config.enablePaymentGifts !== false &&
      String(config.enablePaymentGifts).toUpperCase() !== "FALSE",
  }));

  // State categories
  const [categoriesList, setCategoriesList] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [newCategory, setNewCategory] = useState({ id: "", name: "", order: 0 });
  const [editingCategory, setEditingCategory] = useState(null);

  // State gifts (type = payment_reward)
  const [giftsList, setGiftsList] = useState([]);
  const [isLoadingGifts, setIsLoadingGifts] = useState(false);
  const [newGift, setNewGift] = useState({
    id: "",
    title: "",
    tag: "Quà Quê",
    description: "",
    type: "payment_reward",
  });
  const [editingGift, setEditingGift] = useState(null);

  // State vouchers
  const [vouchers, setVouchers] = useState([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);
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
  const [editingVoucher, setEditingVoucher] = useState(null);

  // State email templates
  const [templates, setTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [isNewTemplateModalOpen, setIsNewTemplateModalOpen] = useState(false);
  const [newTemplateForm, setNewTemplateForm] = useState({ name: "", subject: "" });
  const [isCreatingTpl, setIsCreatingTpl] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState(null);

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

  // -------------------------------------------------------------
  // 1. TẢI VÀ QUẢN LÝ DANH MỤC SẢN PHẨM (categories)
  // -------------------------------------------------------------
  const loadCategoriesFromDb = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .select('id, name, "order", created_at')
        .order("order", { ascending: true });

      if (error) throw error;
      if (Array.isArray(data)) {
        setCategoriesList(data);
      }
    } catch (err) {
      console.error("Lỗi tải categories:", err);
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;

    const catId = (newCategory.id.trim() || `cat_${Date.now()}`).toLowerCase();
    const payload = {
      id: catId,
      name: newCategory.name.trim(),
      order: Number(newCategory.order) || 0,
    };

    try {
      const { data, error } = await supabase
        .from("categories")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      setCategoriesList((prev) => [...prev, data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      setNewCategory({ id: "", name: "", order: 0 });
      onShowAlert?.(`Đã thêm danh mục "${data.name}" (#${data.id})!`);
    } catch (err) {
      console.error("Lỗi thêm category:", err);
      onShowAlert?.("Không thể thêm danh mục: " + err.message);
    }
  };

  const handleSaveEditedCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) return;

    try {
      const { error } = await supabase
        .from("categories")
        .update({
          name: editingCategory.name.trim(),
          order: Number(editingCategory.order) || 0,
        })
        .eq("id", editingCategory.id);

      if (error) throw error;

      setCategoriesList((prev) =>
        prev
          .map((c) => (c.id === editingCategory.id ? { ...c, ...editingCategory } : c))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      );
      setEditingCategory(null);
      onShowAlert?.(`Đã cập nhật danh mục #${editingCategory.id}!`);
    } catch (err) {
      console.error("Lỗi cập nhật category:", err);
      onShowAlert?.("Lỗi cập nhật danh mục: " + err.message);
    }
  };

  const handleDeleteCategory = (catId, catName) => {
    setConfirmModalConfig({
      isAlert: false,
      title: "Xóa Danh Mục",
      message: `Bạn có chắc chắn muốn xóa danh mục "${catName}" (#${catId}) khỏi hệ thống?`,
      confirmLabel: "Xác nhận xóa",
      onConfirm: async () => {
        try {
          const { error } = await supabase.from("categories").delete().eq("id", catId);
          if (error) throw error;

          setCategoriesList((prev) => prev.filter((c) => c.id !== catId));
          onShowAlert?.(`Đã xóa danh mục "${catName}"!`);
        } catch (err) {
          console.error("Lỗi xóa category:", err);
          onShowAlert?.("Lỗi xóa danh mục: " + err.message);
        }
      },
    });
  };

  // -------------------------------------------------------------
  // 2. TẢI VÀ QUẢN LÝ QUÀ TẶNG (gifts - type = payment_reward)
  // -------------------------------------------------------------
  const loadGiftsFromDb = useCallback(async () => {
    setIsLoadingGifts(true);
    try {
      const { data, error } = await supabase
        .from("gifts")
        .select("*")
        .eq("type", "payment_reward")
        .order("id", { ascending: true });

      if (error) throw error;
      if (Array.isArray(data)) {
        setGiftsList(data);
      }
    } catch (err) {
      console.error("Lỗi tải bảng gifts:", err);
    } finally {
      setIsLoadingGifts(false);
    }
  }, []);

  const handleAddGift = async (e) => {
    e.preventDefault();
    if (!newGift.title.trim()) return;

    const giftId = (newGift.id.trim() || `gift_${Date.now()}`).toLowerCase();
    const payload = {
      id: giftId,
      title: newGift.title.trim(),
      tag: newGift.tag.trim() || "Quà Quê",
      description: newGift.description.trim() || null,
      type: "payment_reward",
      is_active: true,
    };

    try {
      const { data, error } = await supabase
        .from("gifts")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      setGiftsList((prev) => [...prev, data]);
      setNewGift({
        id: "",
        title: "",
        tag: "Quà Quê",
        description: "",
        type: "payment_reward",
      });
      onShowAlert?.(`Đã thêm quà tặng "${data.title}"!`);
    } catch (err) {
      console.error("Lỗi thêm quà tặng:", err);
      onShowAlert?.("Lỗi thêm quà tặng: " + err.message);
    }
  };

  const handleToggleGiftStock = async (giftId, currentStatus) => {
    const nextStatus = !currentStatus;

    setGiftsList((prev) =>
      prev.map((g) => (g.id === giftId ? { ...g, is_active: nextStatus } : g))
    );

    try {
      const { error } = await supabase
        .from("gifts")
        .update({ is_active: nextStatus })
        .eq("id", giftId);

      if (error) throw error;
      onShowAlert?.(`Đã ${nextStatus ? "bật" : "tắt"} món quà thành công!`);
    } catch (err) {
      console.error("Lỗi cập nhật bảng gifts:", err);
      onShowAlert?.("Lỗi cập nhật trạng thái quà: " + err.message);
      setGiftsList((prev) =>
        prev.map((g) => (g.id === giftId ? { ...g, is_active: currentStatus } : g))
      );
    }
  };

  const handleSaveEditedGift = async (e) => {
    e.preventDefault();
    if (!editingGift || !editingGift.title.trim()) return;

    try {
      const { error } = await supabase
        .from("gifts")
        .update({
          title: editingGift.title.trim(),
          tag: editingGift.tag.trim() || "Quà Quê",
          description: editingGift.description?.trim() || null,
          is_active: Boolean(editingGift.is_active),
        })
        .eq("id", editingGift.id);

      if (error) throw error;

      setGiftsList((prev) =>
        prev.map((g) => (g.id === editingGift.id ? { ...g, ...editingGift } : g))
      );
      setEditingGift(null);
      onShowAlert?.(`Đã cập nhật thông tin quà tặng!`);
    } catch (err) {
      console.error("Lỗi sửa quà tặng:", err);
      onShowAlert?.("Lỗi sửa quà: " + err.message);
    }
  };

  const handleDeleteGift = (giftId, giftTitle) => {
    setConfirmModalConfig({
      isAlert: false,
      title: "Xóa Quà Tặng",
      message: `Bạn có chắc chắn muốn xóa quà tặng "${giftTitle}" (#${giftId})?`,
      confirmLabel: "Xác nhận xóa",
      onConfirm: async () => {
        try {
          const { error } = await supabase.from("gifts").delete().eq("id", giftId);
          if (error) throw error;

          setGiftsList((prev) => prev.filter((g) => g.id !== giftId));
          onShowAlert?.(`Đã xóa quà tặng "${giftTitle}"!`);
        } catch (err) {
          console.error("Lỗi xóa quà tặng:", err);
          onShowAlert?.("Lỗi xóa quà: " + err.message);
        }
      },
    });
  };

  // -------------------------------------------------------------
  // 3. TẢI VOUCHER, EMAIL TEMPLATES & CẤU HÌNH HỆ THỐNG
  // -------------------------------------------------------------
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

  const loadVouchersFromDb = useCallback(async () => {
    setIsLoadingVouchers(true);
    try {
      const { data, error } = await supabase
        .from("vouchers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (Array.isArray(data)) {
        const formatted = data.map((v) => ({
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
      }
    } catch (err) {
      console.error("Lỗi tải vouchers:", err);
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

        const isGiftsActive =
          merged.enablePaymentGifts !== undefined
            ? merged.enablePaymentGifts !== false && String(merged.enablePaymentGifts) !== "false"
            : merged.enableGifts !== undefined
            ? merged.enableGifts !== false && String(merged.enableGifts) !== "false"
            : true;

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
            merged.autoSendEmail !== false &&
            String(merged.autoSendEmail).toUpperCase() !== "FALSE",
          enablePaymentGifts: isGiftsActive,
          carrier: merged.carrier || prev.carrier,
        }));
      }
    } catch (err) {
      console.error("Lỗi tải shop_configs:", err);
    }
  }, []);

  useEffect(() => {
    loadCategoriesFromDb();
    loadGiftsFromDb();
    loadTemplatesFromDb();
    loadVouchersFromDb();
    loadShopConfigsFromDb();
  }, [
    loadCategoriesFromDb,
    loadGiftsFromDb,
    loadTemplatesFromDb,
    loadVouchersFromDb,
    loadShopConfigsFromDb,
  ]);

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
        message: "Hệ thống phải có ít nhất 1 mẫu email để gửi thông báo cho khách hàng!",
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
            tagline: "Nông sản cắt giàn hái sớm - Gửi xe khách trong đêm tới TP.HCM",
            warehousePin: cfg.warehousePin,
            autoSendEmail: cfg.autoSendEmail,
            shippingFee: Number(cfg.shippingFee) || 0,
            freeShippingThreshold: Number(cfg.freeShippingThreshold) || 0,
            enablePaymentGifts: Boolean(cfg.enablePaymentGifts),
          },
          description: "Thông tin liên hệ chung, phí vận chuyển và cấu hình vận hành",
          updated_at: nowIso,
        },
        {
          key: "payment",
          value: {
            bankBin: cfg.bankBin,
            bankName: cfg.bankName,
            accountNo: cfg.accountNo,
            accountName: cfg.accountName,
            depositAmount: Number(cfg.depositAmount) || 0,
            shippingFee: Number(cfg.shippingFee) || 0,
            freeShippingThreshold: Number(cfg.freeShippingThreshold) || 0,
            enablePaymentGifts: Boolean(cfg.enablePaymentGifts),
            enableGifts: Boolean(cfg.enablePaymentGifts),
          },
          description: "Thông tin tài khoản VietQR, tiền cọc và cước vận chuyển",
          updated_at: nowIso,
        },
        {
          key: "loyalty",
          value: {
            percent: Number(cfg.loyaltyDiscountPercent) || 0,
            maxDiscount: Number(cfg.loyaltyMaxDiscount) || 0,
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
        "Đã lưu thành công cấu hình vận hành & Email templates vào Database!",
      );
    } catch (err) {
      console.error("Lỗi lưu cấu hình:", err);
      onShowAlert?.("Lỗi kết nối khi lưu: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-7 font-sans animate-fadeIn text-stone-800">
      
      {/* 1. CẤU HÌNH DANH MỤC SẢN PHẨM (public.categories) */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-7 space-y-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
          <div className="flex items-center gap-2.5 text-stone-900 font-black text-sm sm:text-base">
            <FolderTree className="w-5 h-5 text-amber-700" />
            <span>Quản Lý Danh Mục Sản Phẩm ({categoriesList.length} nhóm)</span>
          </div>
          <span className="text-xs text-stone-500 hidden sm:inline font-medium">
            Đồng bộ trực tiếp bảng public.categories
          </span>
        </div>

        {isLoadingCategories ? (
          <div className="p-6 text-center text-xs sm:text-sm text-stone-500 flex items-center justify-center gap-2 font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
            <span>Đang tải danh mục sản phẩm...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {categoriesList.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-2xl border border-stone-200/90 bg-stone-50/50 hover:bg-white hover:border-amber-300 transition-all flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                      {cat.name}
                    </span>
                    <span className="text-[11px] font-bold text-amber-950 bg-amber-100 px-2 py-0.5 rounded-md">
                      #{cat.id}
                    </span>
                  </div>
                  <span className="text-xs text-stone-500 block">
                    Thứ tự sắp xếp: <strong className="text-stone-800 font-bold">{cat.order ?? 0}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingCategory({ ...cat })}
                    className="p-2 text-stone-400 hover:text-amber-700 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                    title="Chỉnh sửa danh mục"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    className="p-2 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                    title="Xóa danh mục"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FORM THÊM DANH MỤC */}
        <form
          onSubmit={handleAddCategory}
          className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200/90 flex flex-wrap items-end gap-3.5 text-xs sm:text-sm"
        >
          <div className="flex-1 min-w-[140px]">
            <label className="font-bold text-stone-700 block mb-1 text-xs sm:text-sm">Mã danh mục (ID)</label>
            <input
              type="text"
              placeholder="VD: cat07 (tự sinh nếu trống)"
              value={newCategory.id}
              onChange={(e) => setNewCategory({ ...newCategory, id: e.target.value })}
              className="w-full h-11 px-3.5 rounded-2xl border border-stone-200 bg-white font-medium text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs"
            />
          </div>

          <div className="flex-2 min-w-[200px]">
            <label className="font-bold text-stone-700 block mb-1 text-xs sm:text-sm">Tên danh mục *</label>
            <input
              type="text"
              required
              placeholder="VD: Rượu Vang & Mật Nho"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              className="w-full h-11 px-3.5 rounded-2xl border border-stone-200 bg-white font-bold text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs"
            />
          </div>

          <div className="w-28 shrink-0">
            <label className="font-bold text-stone-700 block mb-1 text-xs sm:text-sm">Thứ tự ("order")</label>
            <input
              type="number"
              value={newCategory.order}
              onChange={(e) => setNewCategory({ ...newCategory, order: e.target.value })}
              className="w-full h-11 px-3.5 rounded-2xl border border-stone-200 bg-white font-bold text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-amber-600 text-center shadow-2xs"
            />
          </div>

          <button
            type="submit"
            className="h-11 px-6 bg-amber-800 hover:bg-amber-900 text-white rounded-2xl font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 transition-all shrink-0 text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Thêm Danh Mục</span>
          </button>
        </form>
      </div>

      {/* 2. CẤU HÌNH QUÀ TẶNG THANH TOÁN (public.gifts) */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-7 space-y-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
          <div className="flex items-center gap-2.5 text-stone-900 font-black text-sm sm:text-base">
            <Gift className="w-5 h-5 text-amber-700" />
            <span>Quản Lý Quà Tặng Thanh Toán ({giftsList.length} món)</span>
          </div>
          <span className="text-xs text-stone-500 hidden sm:inline font-medium">
            Đồng bộ trực tiếp bảng public.gifts
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-amber-50/70 border border-amber-200/80 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
              <Gift className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <strong className="text-sm sm:text-base font-black text-stone-900 block">
                Chương Trình Tặng Quà Quê (Ưu đãi Chuyển khoản VietQR)
              </strong>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
                Bật công tắc này để kích hoạt khung chọn quà tặng kèm tại trang Checkout khi khách thanh toán cọc hoặc trả trước 100%.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={Boolean(cfg.enablePaymentGifts)}
              onChange={async (e) => {
                const nextVal = e.target.checked;
                setCfg((prev) => ({ ...prev, enablePaymentGifts: nextVal }));

                try {
                  const nowIso = new Date().toISOString();
                  await supabase.from("shop_configs").upsert(
                    [
                      {
                        key: "general",
                        value: { enablePaymentGifts: nextVal },
                        updated_at: nowIso,
                      },
                      {
                        key: "payment",
                        value: { ...cfg, enablePaymentGifts: nextVal, enableGifts: nextVal },
                        updated_at: nowIso,
                      },
                    ],
                    { onConflict: "key" }
                  );
                  onShowAlert?.(`Đã ${nextVal ? "bật" : "tắt"} chương trình quà tặng!`);
                } catch (err) {
                  console.error("Lỗi lưu cấu hình quà:", err);
                }
              }}
              className="sr-only peer"
            />
            <div className="w-12 h-6.5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600 shadow-inner"></div>
          </label>
        </div>

        {cfg.enablePaymentGifts && (
          <div className="space-y-4 pt-2">
            {isLoadingGifts ? (
              <div className="p-6 text-center text-xs sm:text-sm text-stone-500 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                <span>Đang tải danh sách quà tặng...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {giftsList.map((gift) => {
                  const isAvailable = gift.is_active !== false;
                  return (
                    <div
                      key={gift.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 shadow-2xs ${
                        isAvailable ? "bg-white border-stone-200" : "bg-stone-100/70 border-stone-200/90 opacity-75"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                            {gift.title}
                          </span>
                          <span className="text-[11px] text-stone-400 shrink-0">
                            #{gift.id}
                          </span>
                        </div>
                        {gift.description && (
                          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                            {gift.description}
                          </p>
                        )}
                        <span className="inline-block text-[11px] font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md">
                          {gift.tag || "Quà Quê"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={() => handleToggleGiftStock(gift.id, isAvailable)}
                          className={`h-9 px-3.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isAvailable
                              ? "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100"
                          }`}
                        >
                          {isAvailable ? "Đang bật" : "Đã tắt"}
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingGift({ ...gift })}
                            className="p-2 text-stone-400 hover:text-amber-700 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                            title="Sửa thông tin quà"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGift(gift.id, gift.title)}
                            className="p-2 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                            title="Xóa món quà"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* FORM THÊM QUÀ MỚI */}
            <form
              onSubmit={handleAddGift}
              className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200/90 space-y-3 text-xs sm:text-sm"
            >
              <span className="font-bold text-stone-800 block text-xs sm:text-sm">Thêm quà tặng chuyển khoản mới:</span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    placeholder="Mã quà (ID - VD: g_tao)"
                    value={newGift.id}
                    onChange={(e) => setNewGift({ ...newGift, id: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-2xl border border-stone-200 bg-white text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                </div>
                <div className="sm:col-span-6">
                  <input
                    type="text"
                    required
                    placeholder="Tên món quà (VD: 1 Hũ Muối Ớt Tây Ninh 150g)*"
                    value={newGift.title}
                    onChange={(e) => setNewGift({ ...newGift, title: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-2xl border border-stone-200 bg-white font-bold text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    placeholder="Huy hiệu (Tag - VD: Quà Quê)"
                    value={newGift.tag}
                    onChange={(e) => setNewGift({ ...newGift, tag: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-2xl border border-stone-200 bg-white text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                </div>
                <div className="sm:col-span-12 flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Mô tả quà tặng (tùy chọn)..."
                    value={newGift.description}
                    onChange={(e) => setNewGift({ ...newGift, description: e.target.value })}
                    className="flex-1 h-11 px-3.5 rounded-2xl border border-stone-200 bg-white text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                  <button
                    type="submit"
                    className="h-11 px-6 bg-amber-800 hover:bg-amber-900 text-white rounded-2xl font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 transition-all shrink-0 text-xs sm:text-sm"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Thêm Quà</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 3. CẤU HÌNH THANH TOÁN, VIETQR & VẬN HÀNH */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-7 space-y-5 shadow-xs">
        <div className="flex items-center gap-2.5 text-stone-900 font-black text-sm sm:text-base border-b border-stone-100 pb-3.5">
          <QrCode className="w-5 h-5 text-amber-700" />
          <span>Cấu Hình Thanh Toán, VietQR, Vận Chuyển & Ưu Đãi Khách Quen</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
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
                  <span className="font-bold text-stone-900">{opt?.shortName}</span>
                  <span className="text-xs font-normal text-stone-500 truncate">({opt?.name})</span>
                </div>
              )}
              renderOption={(opt, isSelected) => (
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate">
                    <span className="font-bold">{opt.shortName}</span>
                    <span className="text-xs text-stone-500 pl-2 font-normal truncate">{opt.name}</span>
                  </div>
                  <span className={`text-xs font-bold shrink-0 ${isSelected ? "text-amber-900" : "text-stone-400"}`}>
                    BIN: {opt.bin}
                  </span>
                </div>
              )}
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1.5 text-xs sm:text-sm">Số Tài Khoản:</label>
            <input
              type="text"
              value={cfg.accountNo}
              onChange={(e) => setCfg({ ...cfg, accountNo: e.target.value })}
              className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white font-bold text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1.5 text-xs sm:text-sm">Tên Chủ Tài Khoản:</label>
            <input
              type="text"
              value={cfg.accountName}
              onChange={(e) => setCfg({ ...cfg, accountName: e.target.value.toUpperCase() })}
              className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white uppercase font-bold text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1.5 text-xs sm:text-sm">Tiền Cọc Giữ Đơn (VNĐ):</label>
            <input
              type="number"
              step="5000"
              value={cfg.depositAmount}
              onChange={(e) => setCfg({ ...cfg, depositAmount: Number(e.target.value) || 0 })}
              className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white font-black text-amber-950 text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1.5 flex items-center gap-1.5 text-xs sm:text-sm">
              <Truck className="w-4 h-4 text-amber-700" />
              <span>Phí Vận Chuyển Mặc Định:</span>
            </label>
            <input
              type="number"
              step="1000"
              value={cfg.shippingFee}
              onChange={(e) => setCfg({ ...cfg, shippingFee: Number(e.target.value) || 0 })}
              className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white font-bold text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1.5 flex items-center gap-1.5 text-xs sm:text-sm">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>Mốc Miễn Phí Vận Chuyển:</span>
            </label>
            <input
              type="number"
              step="10000"
              value={cfg.freeShippingThreshold}
              onChange={(e) => setCfg({ ...cfg, freeShippingThreshold: Number(e.target.value) || 0 })}
              className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white font-black text-emerald-700 text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1.5 text-xs sm:text-sm">Hotline / Zalo hỗ trợ:</label>
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
              className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-bold text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1.5 flex items-center gap-1.5 text-xs sm:text-sm">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Mã PIN Vào Kho / Admin:</span>
            </label>
            <input
              type="text"
              maxLength={6}
              value={cfg.warehousePin}
              onChange={(e) => setCfg({ ...cfg, warehousePin: e.target.value })}
              className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white font-black text-amber-950 text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs tracking-widest"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1.5 text-xs sm:text-sm">% Giảm Khách Cũ (Loyalty):</label>
            <input
              type="number"
              value={cfg.loyaltyDiscountPercent}
              onChange={(e) => setCfg({ ...cfg, loyaltyDiscountPercent: Number(e.target.value) || 0 })}
              className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white font-black text-emerald-700 text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1.5 text-xs sm:text-sm">Trần Giảm Khách Cũ (VNĐ):</label>
            <input
              type="number"
              value={cfg.loyaltyMaxDiscount}
              onChange={(e) => setCfg({ ...cfg, loyaltyMaxDiscount: Number(e.target.value) || 0 })}
              className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white font-black text-emerald-700 text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-2">
            <label className="font-bold text-stone-700 block mb-1.5 flex items-center gap-1.5 text-xs sm:text-sm">
              <MapPin className="w-4 h-4 text-amber-700" />
              <span>Địa Chỉ Vườn Chính / Điểm Gửi Xe:</span>
            </label>
            <input
              type="text"
              value={cfg.address || ""}
              onChange={(e) => setCfg({ ...cfg, address: e.target.value })}
              placeholder="VD: Thôn Trường Sanh, Xã Phước Hậu, Tỉnh Ninh Thuận"
              className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-medium text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4">
            <label className="font-bold text-stone-700 block mb-1.5 flex items-center gap-1.5 text-xs sm:text-sm">
              <Megaphone className="w-4 h-4 text-amber-700" />
              <span>Thông Báo Chạy Chân Trang (Banner Marquee):</span>
            </label>
            <input
              type="text"
              value={cfg.announcement || ""}
              onChange={(e) => setCfg({ ...cfg, announcement: e.target.value })}
              placeholder="VD: Nông sản cắt giàn hái sớm - Gửi xe khách trong đêm tới TP.HCM..."
              className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-medium text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* 4. CẤU HÌNH VOUCHER (ĐÃ ĐỒNG BỘ 100% TYPOGRAPHY SANS-SERIF) */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-7 space-y-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
          <div className="flex items-center gap-2.5 text-stone-900 font-black text-sm sm:text-base">
            <Tag className="w-5 h-5 text-amber-700" />
            <span>Danh Sách Mã Khuyến Mãi ({vouchers.length} mã)</span>
          </div>
          <span className="text-xs text-stone-500 hidden sm:inline font-medium">
            Đồng bộ trực tiếp bảng public.vouchers
          </span>
        </div>

        {isLoadingVouchers ? (
          <div className="p-8 text-center text-xs sm:text-sm text-stone-500 flex items-center justify-center gap-2 font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
            <span>Đang tải danh sách voucher từ hệ thống...</span>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="p-8 text-center text-xs sm:text-sm text-stone-600 bg-stone-50 rounded-2xl border border-dashed border-stone-200 font-medium">
            Chưa có voucher nào trong bảng vouchers.
          </div>
        ) : (
          <div className="divide-y divide-stone-100 border border-stone-200 rounded-3xl overflow-hidden bg-white shadow-2xs font-sans">
            {vouchers.map((v) => {
              const limit = Number(v.usageLimit) || 0;
              const used = Number(v.usedCount) || 0;
              const remaining = limit > 0 ? Math.max(0, limit - used) : "Vô hạn";
              const isOutOfStock = limit > 0 && remaining === 0;

              return (
                <div
                  key={v.code}
                  className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-white hover:bg-stone-50/60 transition-colors"
                >
                  <div className="space-y-2 flex-1 min-w-[260px]">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="h-7 px-3 inline-flex items-center rounded-lg bg-amber-100 border border-amber-300/80 text-amber-950 font-black text-xs tracking-wider">
                        {v.code}
                      </span>

                      <span className="text-sm font-bold text-stone-900">
                        {v.type === "percent"
                          ? `Giảm ${v.value}%${v.maxDiscount ? ` (Tối đa ${Number(v.maxDiscount).toLocaleString("vi-VN")}đ)` : ""}`
                          : `Giảm ${Number(v.value).toLocaleString("vi-VN")}đ`}
                      </span>

                      {v.canStack ? (
                        <span className="h-7 px-2.5 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs">
                          <Layers className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>ĐƯỢC GỘP MÃ</span>
                        </span>
                      ) : (
                        <span className="h-7 px-2.5 inline-flex items-center rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs">
                          ĐỘC QUYỀN (1 MÃ)
                        </span>
                      )}

                      {isOutOfStock ? (
                        <span className="h-7 px-2.5 inline-flex items-center rounded-lg bg-red-100 text-red-800 font-bold text-xs">
                          HẾT LƯỢT DÙNG
                        </span>
                      ) : (
                        <span className="h-7 px-2.5 inline-flex items-center rounded-lg bg-stone-100 border border-stone-200/80 text-stone-700 text-xs font-medium">
                          <span>Còn lại:&nbsp;</span>
                          <strong className="text-stone-900 font-bold">
                            {remaining}
                          </strong>
                          {limit > 0 && (
                            <span className="ml-1 text-stone-400 font-normal">
                              ({used}/{limit} đã dùng)
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    <p className="text-stone-600 text-xs sm:text-sm leading-relaxed font-normal">
                      {v.desc ? `${v.desc} • ` : ""}Đơn tối thiểu:{" "}
                      <strong className="text-stone-800 font-bold">
                        {v.minOrder ? `${Number(v.minOrder).toLocaleString("vi-VN")}đ` : "0đ"}
                      </strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleVoucherStack(v.code)}
                      className={`h-10 px-4 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer active:scale-95 shadow-2xs ${
                        v.canStack
                          ? "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100"
                          : "bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200"
                      }`}
                    >
                      {v.canStack ? "Cho phép gộp" : "Không cho gộp"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingVoucher({ ...v })}
                      className="w-10 h-10 text-stone-400 hover:text-amber-700 rounded-xl hover:bg-stone-100 flex items-center justify-center transition-colors cursor-pointer"
                      title="Chỉnh sửa voucher"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveVoucher(v.code)}
                      className="w-10 h-10 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-stone-100 flex items-center justify-center transition-colors cursor-pointer"
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

        <form
          onSubmit={handleAddVoucher}
          className="bg-stone-50 p-5 sm:p-6 rounded-3xl border border-stone-200 space-y-4 shadow-2xs"
        >
          <span className="font-black text-sm sm:text-base text-stone-900 block">
            Tạo voucher mới vào cơ sở dữ liệu:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 sm:gap-4 text-xs sm:text-sm">
            <div>
              <label className="text-xs text-stone-600 font-bold block mb-1.5">Mã CODE *</label>
              <input
                type="text"
                required
                placeholder="VD: FREESHIP"
                value={newVoucher.code}
                onChange={(e) =>
                  setNewVoucher({ ...newVoucher, code: e.target.value.toUpperCase() })
                }
                className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-white uppercase font-bold text-stone-900 focus:outline-none focus:border-amber-600 shadow-2xs tracking-wider"
              />
            </div>

            <div className="lg:col-span-2">
              <CustomDropdown
                label="Loại giảm"
                options={VOUCHER_TYPE_OPTIONS}
                value={newVoucher.type}
                onChange={(val) => setNewVoucher({ ...newVoucher, type: val })}
                renderSelected={(opt) => <span>{opt?.label}</span>}
                renderOption={(opt) => (
                  <div className="space-y-0.5">
                    <span className="font-bold block">{opt.label}</span>
                    <span className="text-xs text-stone-500 block font-normal">{opt.subLabel}</span>
                  </div>
                )}
              />
            </div>

            <div>
              <label className="text-xs text-stone-600 font-bold block mb-1.5">
                {newVoucher.type === "percent" ? "Mức giảm (%) *" : "Mức giảm (VNĐ) *"}
              </label>
              <input
                type="number"
                required
                min="0"
                value={newVoucher.value}
                onChange={(e) => setNewVoucher({ ...newVoucher, value: e.target.value })}
                className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-white font-bold text-stone-900 focus:outline-none focus:border-amber-600 shadow-2xs"
              />
            </div>

            {newVoucher.type === "percent" && (
              <div>
                <label className="text-xs text-stone-600 font-bold block mb-1.5">Giảm tối đa (VNĐ)</label>
                <input
                  type="number"
                  placeholder="0 = Không giới hạn"
                  value={newVoucher.maxDiscount}
                  onChange={(e) => setNewVoucher({ ...newVoucher, maxDiscount: e.target.value })}
                  className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-white font-bold text-emerald-800 focus:outline-none focus:border-amber-600 shadow-2xs"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-stone-600 font-bold block mb-1.5">Đơn tối thiểu (VNĐ)</label>
              <input
                type="number"
                value={newVoucher.minOrder}
                onChange={(e) => setNewVoucher({ ...newVoucher, minOrder: e.target.value })}
                placeholder="0"
                className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-white font-bold text-stone-900 focus:outline-none focus:border-amber-600 shadow-2xs"
              />
            </div>

            <div>
              <label className="text-xs text-stone-600 font-bold block mb-1.5">SL Giới Hạn (Lượt)</label>
              <input
                type="number"
                value={newVoucher.usageLimit}
                onChange={(e) => setNewVoucher({ ...newVoucher, usageLimit: e.target.value })}
                placeholder="0 = Vô hạn"
                className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-white font-bold text-amber-900 focus:outline-none focus:border-amber-600 shadow-2xs"
              />
            </div>

            <div className="lg:col-span-6">
              <label className="text-xs text-stone-600 font-bold block mb-1.5">Mô tả hiển thị</label>
              <input
                type="text"
                placeholder="VD: Miễn phí vận chuyển cho đơn từ 300k"
                value={newVoucher.desc}
                onChange={(e) => setNewVoucher({ ...newVoucher, desc: e.target.value })}
                className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-white font-medium text-stone-800 focus:outline-none focus:border-amber-600 shadow-2xs"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-200/60">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-bold text-amber-950 bg-amber-50 h-11 px-4 rounded-2xl border border-amber-200 shadow-2xs">
              <input
                type="checkbox"
                checked={newVoucher.canStack}
                onChange={(e) => setNewVoucher({ ...newVoucher, canStack: e.target.checked })}
                className="w-4 h-4 rounded-md accent-amber-600 cursor-pointer"
              />
              <span>Cho phép gộp với các voucher khác (canStack)</span>
            </label>

            <button
              type="submit"
              className="h-11 px-6 bg-stone-900 hover:bg-amber-800 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Thêm Voucher Vào Hệ Thống</span>
            </button>
          </div>
        </form>
      </div>

      {/* 5. CẤU HÌNH EMAIL TEMPLATES */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-7 space-y-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3.5">
          <div className="flex items-center gap-3 text-stone-900 font-black text-sm sm:text-base">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-inner">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <span>Mẫu Email Hệ Thống ({templates.length} mẫu)</span>
              <p className="text-xs font-normal text-stone-500 mt-0.5">
                Đồng bộ trực tiếp bảng public.email_templates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsNewTemplateModalOpen(true)}
              className="h-11 px-4 rounded-2xl bg-amber-800 hover:bg-amber-900 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-amber-200" />
              <span>Tạo Mẫu Mới</span>
            </button>

            <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-bold text-amber-950 bg-amber-50 h-11 px-4 rounded-2xl border border-amber-200 shadow-2xs">
              <input
                type="checkbox"
                checked={cfg.autoSendEmail}
                onChange={(e) => setCfg({ ...cfg, autoSendEmail: e.target.checked })}
                className="w-4 h-4 rounded-md accent-amber-600 cursor-pointer"
              />
              <span>Tự động gửi khi có đơn</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm bg-amber-50/50 p-5 rounded-3xl border border-amber-200/70 relative">
          <div className="relative" ref={dropdownRef}>
            <label className="font-bold text-amber-950 mb-1.5 flex items-center justify-between text-xs sm:text-sm">
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-amber-700" />
                <span>Mẫu thư đang chỉnh sửa:</span>
              </span>
              {templates.length > 1 && (
                <button
                  type="button"
                  onClick={handleDeleteActiveTemplate}
                  className="text-stone-400 hover:text-rose-600 flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer"
                  title="Xóa mẫu thư này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa mẫu</span>
                </button>
              )}
            </label>

            <button
              type="button"
              disabled={isLoadingTemplates || templates.length === 0}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full h-11 flex items-center justify-between px-4 bg-white border border-stone-200 hover:border-amber-400 rounded-2xl text-stone-900 font-bold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-amber-950 font-black">{activeTemplate.name}</span>
                <span className="text-xs text-stone-400 font-normal">({activeTemplate.id})</span>
              </div>
              {isDropdownOpen ? (
                <ChevronUp className="w-4 h-4 text-stone-500 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-stone-500 shrink-0" />
              )}
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-full sm:w-96 bg-white border border-stone-200/80 rounded-3xl p-3 shadow-2xl z-30 space-y-1 animate-fadeIn">
                <div className="px-3.5 py-2 text-xs font-black uppercase text-stone-400 tracking-wider">
                  DANH SÁCH MẪU TRONG DATABASE:
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
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
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-colors cursor-pointer text-left ${
                          isSelected ? "bg-[#fffbeb] text-amber-950 font-black" : "text-stone-700 hover:bg-stone-50 font-medium"
                        }`}
                      >
                        <div className="flex flex-col space-y-0.5">
                          <span>{tpl.name}</span>
                          <span className="text-[11px] text-stone-400 font-normal">{tpl.id}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-amber-800 stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1.5 text-xs sm:text-sm">Tên gợi nhớ của mẫu:</label>
            <input
              type="text"
              value={activeTemplate.name || ""}
              onChange={(e) => handleUpdateActiveTemplate("name", e.target.value)}
              className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-white font-medium text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-amber-600 transition-colors shadow-2xs"
            />
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-stone-50/80 rounded-2xl border border-stone-200/70 text-xs sm:text-sm space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-stone-800">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Các biến tự động chèn dữ liệu vào mẫu:</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
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
                className="bg-white text-amber-950 px-3 py-1 rounded-xl border border-stone-200 shadow-2xs font-bold"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="font-bold text-stone-700 block mb-1.5">Tiêu đề thư gửi khách:</label>
            <input
              type="text"
              value={activeTemplate.subject || ""}
              onChange={(e) => handleUpdateActiveTemplate("subject", e.target.value)}
              className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white font-medium text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-amber-600 transition-colors shadow-2xs"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1.5">Nội dung thư (HTML từ database):</label>
            <textarea
              rows={12}
              value={activeTemplate.body || ""}
              onChange={(e) => handleUpdateActiveTemplate("body", e.target.value)}
              className="w-full p-4 rounded-3xl border border-stone-200 bg-stone-50 focus:bg-white text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-amber-600 transition-colors leading-relaxed shadow-2xs"
            />
          </div>

          <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
            <span className="text-xs sm:text-sm text-stone-600">
              Kiểm tra hiển thị của mẫu <strong>{activeTemplate.name}</strong>:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="Nhập email của bạn để nhận thử..."
                value={testEmailInput}
                onChange={(e) => setTestEmailInput(e.target.value)}
                className="w-full sm:w-80 h-11 px-4 rounded-2xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-amber-600 bg-white shadow-2xs"
              />
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={isSendingTest}
                className="h-11 px-5 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer shrink-0 disabled:opacity-50 shadow-2xs"
              >
                {isSendingTest ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                ) : (
                  <Send className="w-4 h-4 text-amber-700" />
                )}
                <span>{isSendingTest ? "Đang gửi..." : "Gửi Test"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. NÚT LƯU TOÀN BỘ CẤU HÌNH & TEMPLATES */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          disabled={isSaving}
          onClick={handleSaveAll}
          className="h-12 px-8 bg-amber-800 hover:bg-amber-900 text-white rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2.5 shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 stroke-[2.5]" />}
          <span>{isSaving ? "Đang lưu hệ thống..." : "Lưu Toàn Bộ Cấu Hình & Templates"}</span>
        </button>
      </div>

      {/* 7. MODAL CHỈNH SỬA DANH MỤC */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-950/75 backdrop-blur-xs animate-fadeIn font-sans text-stone-800">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base sm:text-lg font-black text-stone-900">
                Sửa Danh Mục: <span className="text-amber-800">#{editingCategory.id}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="w-9 h-9 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedCategory} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Tên danh mục *</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-stone-200 bg-white font-bold text-stone-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Thứ tự sắp xếp ("order")</label>
                <input
                  type="number"
                  value={editingCategory.order ?? 0}
                  onChange={(e) => setEditingCategory({ ...editingCategory, order: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-stone-200 bg-white font-bold text-stone-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="h-10 px-5 rounded-xl font-bold text-stone-700 hover:bg-stone-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="h-10 px-6 bg-amber-800 hover:bg-amber-900 text-white rounded-xl font-bold cursor-pointer shadow-2xs"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL CHỈNH SỬA QUÀ TẶNG */}
      {editingGift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-950/75 backdrop-blur-xs animate-fadeIn font-sans text-stone-800">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base sm:text-lg font-black text-stone-900">
                Sửa Quà Tặng: <span className="text-amber-800">#{editingGift.id}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingGift(null)}
                className="w-9 h-9 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedGift} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Tên món quà *</label>
                <input
                  type="text"
                  required
                  value={editingGift.title}
                  onChange={(e) => setEditingGift({ ...editingGift, title: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-stone-200 bg-white font-bold text-stone-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Huy hiệu (Tag)</label>
                <input
                  type="text"
                  value={editingGift.tag || ""}
                  onChange={(e) => setEditingGift({ ...editingGift, tag: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Mô tả quà tặng</label>
                <textarea
                  rows={3}
                  value={editingGift.description || ""}
                  onChange={(e) => setEditingGift({ ...editingGift, description: e.target.value })}
                  className="w-full p-3 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingGift(null)}
                  className="h-10 px-5 rounded-xl font-bold text-stone-700 hover:bg-stone-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="h-10 px-6 bg-amber-800 hover:bg-amber-900 text-white rounded-xl font-bold cursor-pointer shadow-2xs"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. MODAL TẠO MẪU EMAIL MỚI */}
      {isNewTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-950/75 backdrop-blur-xs animate-fadeIn font-sans text-stone-800">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-stone-200 space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <h3 className="text-base sm:text-xl font-black text-stone-900 flex items-center gap-2.5">
                <PlusCircle className="w-6 h-6 text-amber-700" />
                <span>Thêm Mẫu Email Mới</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewTemplateModalOpen(false)}
                className="w-10 h-10 rounded-2xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewTemplate} className="space-y-5 text-xs sm:text-sm">
              <div>
                <label className="text-xs sm:text-sm text-stone-700 font-bold block mb-1.5">
                  Tên gợi nhớ của mẫu *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Thông báo xe đã xuất bến"
                  value={newTemplateForm.name}
                  onChange={(e) => setNewTemplateForm({ ...newTemplateForm, name: e.target.value })}
                  className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50/70 focus:bg-white font-medium text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm text-stone-700 font-bold block mb-1.5">
                  Tiêu đề email mặc định:
                </label>
                <input
                  type="text"
                  placeholder="VD: [Xứ Nắng Gió] Thùng hàng {{ORDER_CODE}} đang trên đường giao đến bạn"
                  value={newTemplateForm.subject}
                  onChange={(e) => setNewTemplateForm({ ...newTemplateForm, subject: e.target.value })}
                  className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50/70 focus:bg-white font-medium text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsNewTemplateModalOpen(false)}
                  className="h-11 px-6 rounded-2xl text-xs sm:text-sm font-bold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTpl}
                  className="h-11 px-7 rounded-2xl text-xs sm:text-sm font-bold bg-amber-800 hover:bg-amber-900 text-white shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isCreatingTpl ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang tạo...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Tạo Mẫu Ngay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. MODAL CHỈNH SỬA VOUCHER */}
      {editingVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-950/75 backdrop-blur-xs animate-fadeIn font-sans text-stone-800">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-stone-200 space-y-6 max-h-[92vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <h3 className="text-base sm:text-xl font-black text-stone-900 flex items-center gap-2.5">
                <span>Chỉnh Sửa Voucher:</span>
                <span className="text-amber-950 bg-amber-100 px-3 py-1 rounded-xl text-xs sm:text-sm border border-amber-300/60 shadow-2xs font-bold">
                  {editingVoucher.code}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingVoucher(null)}
                className="w-10 h-10 rounded-2xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedVoucher} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <CustomDropdown
                    label="Loại giảm"
                    options={VOUCHER_TYPE_OPTIONS}
                    value={editingVoucher.type}
                    onChange={(val) => setEditingVoucher({ ...editingVoucher, type: val })}
                    renderSelected={(opt) => (
                      <span>
                        {opt?.value === "percent" ? "Giảm theo %" : "Giảm tiền (VNĐ)"}
                      </span>
                    )}
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm text-stone-700 font-bold block mb-1.5">
                    {editingVoucher.type === "percent" ? "Mức giảm (%) *" : "Mức giảm (VNĐ) *"}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingVoucher.value}
                    onChange={(e) =>
                      setEditingVoucher({ ...editingVoucher, value: e.target.value })
                    }
                    className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-white font-bold text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                </div>
              </div>

              {editingVoucher.type === "percent" && (
                <div>
                  <label className="text-xs sm:text-sm text-stone-700 font-bold block mb-1.5">
                    Giảm tối đa (VNĐ)
                  </label>
                  <input
                    type="number"
                    placeholder="0 = Không giới hạn"
                    value={editingVoucher.maxDiscount}
                    onChange={(e) =>
                      setEditingVoucher({ ...editingVoucher, maxDiscount: e.target.value })
                    }
                    className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-white font-bold text-emerald-800 text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs sm:text-sm text-stone-700 font-bold block mb-1.5">
                    Đơn tối thiểu (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={editingVoucher.minOrder}
                    onChange={(e) =>
                      setEditingVoucher({ ...editingVoucher, minOrder: e.target.value })
                    }
                    className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-white font-bold text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm text-stone-700 font-bold block mb-1.5">
                    SL Giới hạn (0 = Vô hạn)
                  </label>
                  <input
                    type="number"
                    value={editingVoucher.usageLimit}
                    onChange={(e) =>
                      setEditingVoucher({ ...editingVoucher, usageLimit: e.target.value })
                    }
                    className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-white font-bold text-amber-900 text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs sm:text-sm text-stone-700 font-bold block mb-1.5">
                  Mô tả hiển thị
                </label>
                <input
                  type="text"
                  value={editingVoucher.desc || ""}
                  onChange={(e) =>
                    setEditingVoucher({ ...editingVoucher, desc: e.target.value })
                  }
                  className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-white font-medium text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-2xs"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer text-xs sm:text-sm font-bold text-amber-950 bg-amber-50 h-11 px-4 rounded-2xl border border-amber-200 shadow-2xs">
                <input
                  type="checkbox"
                  checked={editingVoucher.canStack}
                  onChange={(e) =>
                    setEditingVoucher({ ...editingVoucher, canStack: e.target.checked })
                  }
                  className="w-4 h-4 rounded-md accent-amber-600"
                />
                <span>Cho phép gộp với các voucher khác (canStack)</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingVoucher(null)}
                  className="h-11 px-6 rounded-2xl text-xs sm:text-sm font-bold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="h-11 px-7 rounded-2xl text-xs sm:text-sm font-bold bg-amber-800 hover:bg-amber-900 text-white shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Cập Nhật Voucher</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. CONFIRM MODAL ĐỒNG BỘ */}
      <ConfirmModal
        modalConfig={confirmModalConfig}
        onClose={() => setConfirmModalConfig(null)}
      />
    </div>
  );
}