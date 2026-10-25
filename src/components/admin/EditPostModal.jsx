// src/components/admin/EditPostModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Check, ChevronDown, Loader2 } from 'lucide-react';
import ImageUploadField from '../ImageUploadField';
import { supabase } from '../../supabaseClient';

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
    <div className="relative w-full font-sans text-stone-800" ref={containerRef}>
      {label && (
        <label className="font-bold text-stone-700 block mb-1.5 text-xs sm:text-sm">
          {label}
        </label>
      )}

      {/* Button kích hoạt */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full h-11 px-4 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all duration-200 cursor-pointer text-xs sm:text-sm ${
          isOpen
            ? 'bg-amber-50/60 border-amber-500 ring-2 ring-amber-400/20 shadow-xs text-stone-900 font-bold'
            : 'bg-white hover:bg-stone-50/80 border-stone-200 hover:border-amber-500 shadow-2xs text-stone-800 font-medium'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-stone-900 truncate">{selectedOpt?.label}</span>
          <span className="text-xs font-mono text-stone-400 font-normal shrink-0">
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
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 p-2 rounded-2xl bg-white border border-amber-200/90 shadow-2xl space-y-1 animate-fadeIn text-xs sm:text-sm min-w-[260px] backdrop-blur-md">
          <div className="px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-stone-400">
            DANH SÁCH CHUYÊN MỤC:
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {options.map((opt) => {
              const isSelected = opt.value === value;

              return (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`p-3 rounded-xl cursor-pointer flex items-center justify-between gap-2 transition-all ${
                    isSelected
                      ? 'bg-amber-100/80 text-amber-950 font-bold border border-amber-300 shadow-2xs'
                      : 'hover:bg-amber-50/70 text-stone-700 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate">{opt.label}</span>
                    <span className={`text-xs font-mono font-bold ${isSelected ? 'text-amber-900' : 'text-stone-400'}`}>
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

export default function EditPostModal({ post, onClose, onSave, onShowAlert }) {
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
    title: '',
    category: 'handbook',
    excerpt: '',
    readTime: '3 phút đọc',
    author: 'Vườn Xứ Nắng',
    image: '',
    content: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        category: normalizeCategory(post.category || post.tag),
        excerpt: post.excerpt || post.desc || post.summary || '',
        readTime: post.read_time || post.readTime || '3 phút đọc',
        author: post.author || 'Vườn Xứ Nắng',
        image: post.image || post.image_url || '',
        content: post.content || ''
      });
      setErrorMessage('');
    }
  }, [post]);

  if (!post) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.excerpt.trim()) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Chuẩn hóa payload KHỚP 100% với DDL public.posts (KHÔNG gửi 'desc' hay 'summary')
      const updatePayload = {
        title: formData.title.trim(),
        category: formData.category || 'handbook',
        excerpt: formData.excerpt.trim(),
        content: formData.content.trim() || formData.excerpt.trim(),
        image: formData.image.trim() || null,
        author: formData.author.trim() || 'Vườn Xứ Nắng',
        read_time: formData.readTime.trim() || '3 phút đọc'
      };

      // 1. Cập nhật trực tiếp vào Supabase Database
      const { data, error } = await supabase
        .from('posts')
        .update(updatePayload)
        .eq('id', post.id)
        .select()
        .single();

      if (error) throw error;

      const savedResult = data || { ...post, ...updatePayload };

      // 2. Báo alert thành công nếu có
      onShowAlert?.(`Đã cập nhật bài viết #${post.id} thành công!`);

      // 3. Đồng bộ lên state component cha
      if (onSave) {
        onSave(savedResult);
      }

      onClose();
    } catch (err) {
      console.error('Lỗi khi cập nhật bài viết vào Supabase:', err);
      setErrorMessage(err.message || 'Không thể cập nhật bài viết vào cơ sở dữ liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-950/75 backdrop-blur-xs animate-fadeIn font-sans text-stone-800">
      {/* KHUNG MODAL RỘNG max-w-5xl */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-5xl w-full shadow-2xl border border-stone-200 space-y-5 max-h-[92vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        
        {/* HEADER MODAL */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base sm:text-xl font-black text-stone-900 tracking-tight">
              Cập Nhật Bài Viết & Ảnh Bìa
            </h3>
            {post.id && (
              <span className="font-mono text-amber-950 bg-amber-100 px-2.5 py-0.5 rounded-xl text-xs font-bold border border-amber-300/70 shadow-2xs">
                #{post.id}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-2 rounded-2xl hover:bg-stone-100 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold rounded-2xl">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="font-bold text-stone-700 block mb-1.5">
              Tiêu đề bài viết *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-medium focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
            {/* DROPDOWN CHUYÊN MỤC */}
            <div>
              <CustomCategorySelect
                label="Chuyên mục"
                options={CATEGORY_OPTIONS}
                value={formData.category}
                onChange={(val) => setFormData({ ...formData, category: val })}
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1.5">
                Thời gian đọc
              </label>
              <input
                type="text"
                placeholder="VD: 3 phút đọc"
                value={formData.readTime}
                onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-medium focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1.5">
                Tác giả
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-medium focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
              />
            </div>
          </div>

          {/* Cập nhật ảnh bìa qua Supabase Storage bucket posts */}
          <ImageUploadField
            label="Cập nhật ảnh bìa bài viết"
            value={formData.image}
            bucket="posts"
            onChange={(newUrl) => setFormData({ ...formData, image: newUrl })}
          />

          <div>
            <label className="font-bold text-stone-700 block mb-1.5">
              Tóm tắt ngắn (Excerpt) *
            </label>
            <textarea
              rows="3"
              required
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full p-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 resize-none focus:outline-none focus:border-amber-600 leading-relaxed shadow-2xs transition-colors"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1.5">
              Nội dung chi tiết
            </label>
            <textarea
              rows="7"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full p-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 resize-y focus:outline-none focus:border-amber-600 leading-relaxed shadow-2xs transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Lưu Thay Đổi Bài Viết</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}