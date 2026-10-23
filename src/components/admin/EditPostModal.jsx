// src/components/admin/EditPostModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Check, ChevronDown } from 'lucide-react';
import ImageUploadField from '../ImageUploadField';

// BỘ CATEGORY TIẾNG ANH ĐỒNG BỘ CHUẨN
const CATEGORY_OPTIONS = [
  { value: 'handbook', label: 'Cẩm nang' },
  { value: 'health', label: 'Sức khỏe' },
  { value: 'cuisine', label: 'Món ngon' },
  { value: 'tips', label: 'Mẹo vặt' }
];

// COMPONENT DROPDOWN CUSTOM BO GÓC TRÒN
function CustomCategorySelect({ label, options = [], value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedOpt = options.find((opt) => opt.value === value) || options[0];

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && <label className="font-semibold text-stone-600 block mb-1 text-xs">{label}</label>}

      {/* Button kích hoạt */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full py-2.5 px-3.5 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all duration-200 cursor-pointer text-xs ${
          isOpen
            ? 'bg-amber-50/60 border-amber-500 ring-2 ring-amber-400/20 shadow-xs'
            : 'bg-white hover:bg-stone-50/80 border-amber-400/90 hover:border-amber-500 shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-bold text-stone-900 truncate">{selectedOpt?.label}</span>
          <span className="text-[11px] font-mono text-stone-400 font-normal shrink-0">
            ({selectedOpt?.value})
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180 text-amber-700' : ''
          }`}
        />
      </button>

      {/* Menu dropdown xổ xuống */}
      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 p-2 rounded-2xl bg-white border border-amber-200/90 shadow-2xl space-y-1 animate-fadeIn text-xs">
          <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">
            DANH SÁCH CHUYÊN MỤC:
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1 pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {options.map((opt) => {
              const isSelected = opt.value === value;

              return (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-2 transition-all ${
                    isSelected
                      ? 'bg-amber-100/70 text-amber-950 font-bold border border-amber-300/80 shadow-2xs'
                      : 'hover:bg-amber-50/70 text-stone-700 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate">{opt.label}</span>
                    <span className={`text-[10.5px] font-mono ${isSelected ? 'text-amber-800' : 'text-stone-400'}`}>
                      ({opt.value})
                    </span>
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

export default function EditPostModal({ post, onClose, onSave }) {
  // Chuẩn hóa category cũ về giá trị tiếng Anh nếu có
  const normalizeCategory = (cat) => {
    const map = {
      'cam-nang': 'handbook',
      'suc-khoe': 'health',
      'mon-ngon': 'cuisine',
      'meo-vat': 'tips'
    };
    return map[cat] || cat || 'handbook';
  };

  const [formData, setFormData] = useState({
    ...post,
    title: post?.title || '',
    category: normalizeCategory(post?.category || post?.tag),
    excerpt: post?.excerpt || post?.desc || post?.summary || '',
    readTime: post?.read_time || post?.readTime || '3 phút đọc',
    author: post?.author || 'Tâm (Vườn Xứ Nắng Gió)',
    image: post?.image_url || post?.image || '',
    content: post?.content || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      desc: formData.excerpt,
      summary: formData.excerpt,
      read_time: formData.readTime,
      image_url: formData.image
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn font-sans">
      {/* KHUNG MODAL: ĐÃ TRIỆT TIÊU SCROLLBAR THÔ XẤU */}
      <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-stone-200 space-y-4 max-h-[92vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        
        {/* HEADER MODAL */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="text-sm font-black text-stone-900">Cập Nhật Bài Viết & Ảnh Bìa</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-xl hover:bg-stone-100 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-stone-600 block mb-1">Tiêu đề bài viết *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 font-medium focus:outline-none focus:border-amber-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* DROPDOWN CHUYÊN MỤC MỚI */}
            <div>
              <CustomCategorySelect
                label="Chuyên mục"
                options={CATEGORY_OPTIONS}
                value={formData.category}
                onChange={(val) => setFormData({ ...formData, category: val })}
              />
            </div>

            <div>
              <label className="font-semibold text-stone-600 block mb-1">Thời gian đọc</label>
              <input
                type="text"
                placeholder="VD: 3 phút đọc"
                value={formData.readTime}
                onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                className="w-full p-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-600 block mb-1">Tác giả</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full p-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          {/* Cập nhật ảnh bìa qua Supabase Storage */}
          <ImageUploadField
            label="Cập nhật ảnh bìa bài viết"
            value={formData.image}
            bucket="posts"
            onChange={(newUrl) => setFormData({ ...formData, image: newUrl })}
          />

          <div>
            <label className="font-semibold text-stone-600 block mb-1">Tóm tắt ngắn (Excerpt) *</label>
            <textarea
              rows="2"
              required
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full p-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-700 resize-none focus:outline-none focus:border-amber-600 leading-relaxed"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-600 block mb-1">Nội dung chi tiết</label>
            <textarea
              rows="5"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full p-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-700 resize-y focus:outline-none focus:border-amber-600 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Lưu Thay Đổi Bài Viết</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}