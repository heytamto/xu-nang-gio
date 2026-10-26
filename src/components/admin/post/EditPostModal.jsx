// src/components/admin/post/EditPostModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Check, Loader2, BookOpen } from 'lucide-react';
import ImageUploadField from '../../ImageUploadField';
import CustomDropdown from '../../CustomDropdown';
import { postRepo } from '../../../repositories';

// BỘ CATEGORY TIẾNG ANH ĐỒNG BỘ CHUẨN
const CATEGORY_OPTIONS = [
  { value: 'handbook', label: 'Cẩm nang' },
  { value: 'health', label: 'Sức khỏe' },
  { value: 'cuisine', label: 'Món ngon' },
  { value: 'tips', label: 'Mẹo vặt' }
];

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
      // Chuẩn hóa payload khớp với schema bảng posts
      const updatePayload = {
        title: formData.title.trim(),
        category: formData.category || 'handbook',
        excerpt: formData.excerpt.trim(),
        content: formData.content.trim() || formData.excerpt.trim(),
        image: formData.image.trim() || null,
        author: formData.author.trim() || 'Vườn Xứ Nắng',
        read_time: formData.readTime.trim() || '3 phút đọc',
        updated_at: new Date().toISOString()
      };

      // 1. Cập nhật qua postRepo
      const updatedPost = await postRepo.update(post.id, updatePayload);

      const savedResult = updatedPost || { ...post, ...updatePayload };

      // 2. Báo toast thành công
      onShowAlert?.(`Đã cập nhật bài viết #${post.id} thành công!`);

      // 3. Đồng bộ lên state component cha
      if (onSave) {
        onSave(savedResult);
      }

      onClose();
    } catch (err) {
      console.error('Lỗi khi cập nhật bài viết qua postRepo:', err);
      setErrorMessage(err.message || 'Không thể cập nhật bài viết vào cơ sở dữ liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-950/75 backdrop-blur-xs animate-fadeIn font-sans text-stone-800">
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
              className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-bold focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
            <div>
              <CustomDropdown
                label="Chuyên mục"
                headerLabel="DANH SÁCH CHUYÊN MỤC:"
                icon={BookOpen}
                options={CATEGORY_OPTIONS}
                value={formData.category}
                onChange={(val) => setFormData({ ...formData, category: val })}
                searchable={false}
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
                className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-bold focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
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
                className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-bold focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
              />
            </div>
          </div>

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
              rows={3}
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
              rows={7}
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
              className="px-7 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2"
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