import React, { useState, useEffect, useCallback } from "react";
import { Mail, Send, Loader2, Sparkles, FileText } from "lucide-react";
import { emailTemplateRepo } from "../../../repositories";
import { supabase } from "../../../supabaseClient";
import CustomDropdown from "../../CustomDropdown";

export default function EmailTemplateConfigSection({ onShowAlert }) {
  const [templates, setTemplates] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await emailTemplateRepo.getAll({ orderBy: "updated_at", ascending: false });
      if (Array.isArray(data) && data.length > 0) {
        setTemplates(data);
        setSelectedId(data[0].id);
      }
    } catch (err) {
      console.error("Lỗi tải templates:", err);
      onShowAlert?.("Không thể tải danh sách mẫu email.");
    } finally {
      setIsLoading(false);
    }
  }, [onShowAlert]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const activeTemplate = templates.find((t) => t.id === selectedId) || templates[0] || {
    id: "",
    name: "Chưa có mẫu",
    subject: "",
    body: "",
  };

  const handleUpdateActive = (field, val) => {
    setTemplates((prev) => prev.map((t) => (t.id === activeTemplate.id ? { ...t, [field]: val } : t)));
  };

  const handleSaveTemplate = async () => {
    if (!activeTemplate.id) return;
    setIsSaving(true);
    try {
      await emailTemplateRepo.update(activeTemplate.id, {
        name: activeTemplate.name,
        subject: activeTemplate.subject,
        body: activeTemplate.body,
        updated_at: new Date().toISOString(),
      });
      onShowAlert?.(`Đã lưu mẫu email "${activeTemplate.name}"!`);
    } catch (err) {
      console.error("Lỗi lưu template:", err);
      onShowAlert?.("Lỗi lưu template: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      onShowAlert?.("Vui lòng nhập email hợp lệ!");
      return;
    }

    setIsSending(true);
    try {
      const sampleHtml = (activeTemplate.body || "")
        .replace(/{{CUSTOMER_NAME}}/g, "Khách Quý")
        .replace(/{{ORDER_CODE}}/g, "XNG-TEST")
        .replace(/{{TOTAL}}/g, "350.000đ");

      const { error } = await supabase.functions.invoke("send-order-email", {
        body: {
          is_test: true,
          to: testEmail.trim(),
          subject: activeTemplate.subject || "[Test] Thông báo đơn hàng",
          html: sampleHtml,
        },
      });

      if (error) throw error;
      onShowAlert?.(`Đã gửi mail thử nghiệm đến ${testEmail}!`);
    } catch (err) {
      console.error("Lỗi gửi mail:", err);
      onShowAlert?.("Lỗi gửi mail: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const templateDropdownOptions = templates.map((t) => ({
    value: t.id,
    label: t.name,
    id: t.id
  }));

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-7 space-y-5 shadow-xs font-sans text-stone-800">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
        <div className="flex items-center gap-2.5 text-stone-900 font-black text-sm sm:text-base">
          <Mail className="w-5 h-5 text-amber-700" />
          <span>Mẫu Email Thông Báo ({templates.length} mẫu)</span>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-amber-700" />}
        </div>
        <button
          type="button"
          disabled={isSaving || !activeTemplate.id}
          onClick={handleSaveTemplate}
          className="h-10 px-5 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          <span>Lưu Mẫu Này</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
        <div className="sm:col-span-6">
          <CustomDropdown
            label="Chọn mẫu email chỉnh sửa"
            headerLabel="DANH SÁCH MẪU EMAIL:"
            icon={FileText}
            options={templateDropdownOptions}
            value={selectedId}
            onChange={(val) => setSelectedId(val)}
            searchable={false}
            renderSelected={(opt) => (
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-900">{opt?.label}</span>
                <span className="text-xs font-mono text-stone-400">({opt?.value})</span>
              </div>
            )}
            renderOption={(opt, isSelected) => (
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold">{opt.label}</span>
                <span className={`text-xs font-mono font-bold ${isSelected ? "text-amber-900" : "text-stone-400"}`}>
                  {opt.value}
                </span>
              </div>
            )}
          />
        </div>
        <div className="sm:col-span-6">
          <label className="font-bold text-stone-700 block mb-1.5 text-xs sm:text-sm">Tên gợi nhớ của mẫu</label>
          <input
            type="text"
            value={activeTemplate.name}
            onChange={(e) => handleUpdateActive("name", e.target.value)}
            placeholder="Tên gợi nhớ"
            className="w-full h-11 px-4 border border-stone-200 rounded-2xl bg-white text-xs sm:text-sm font-medium focus:outline-none focus:border-amber-600 shadow-2xs"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="font-bold text-stone-700 block mb-1.5 text-xs sm:text-sm">Tiêu đề thư (Subject)</label>
          <input
            type="text"
            value={activeTemplate.subject}
            onChange={(e) => handleUpdateActive("subject", e.target.value)}
            placeholder="Tiêu đề thư"
            className="w-full h-11 px-4 border border-stone-200 rounded-2xl bg-stone-50 text-xs sm:text-sm font-bold focus:outline-none focus:border-amber-600 shadow-2xs"
          />
        </div>
        <div>
          <label className="font-bold text-stone-700 block mb-1.5 text-xs sm:text-sm">Nội dung HTML mẫu thư</label>
          <textarea
            rows={8}
            value={activeTemplate.body}
            onChange={(e) => handleUpdateActive("body", e.target.value)}
            className="w-full p-4 border border-stone-200 rounded-2xl bg-stone-50 font-mono text-xs leading-relaxed focus:outline-none focus:border-amber-600 shadow-2xs"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Biến động hỗ trợ: {"{{CUSTOMER_NAME}}"}, {"{{ORDER_CODE}}"}, {"{{TOTAL}}"}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="email"
            placeholder="Email nhận test..."
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="h-10 px-3.5 border border-stone-200 rounded-xl text-xs bg-white w-48 sm:w-64 focus:outline-none focus:border-amber-600 shadow-2xs"
          />
          <button
            type="button"
            disabled={isSending}
            onClick={handleSendTest}
            className="h-10 px-4 bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Gửi Test</span>
          </button>
        </div>
      </div>
    </div>
  );
}