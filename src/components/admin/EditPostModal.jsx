import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import ImageUploadField from './ImageUploadField';

const CATEGORY_OPTIONS = [
  { value: 'cam-nang', label: 'Cẩm nang' },
  { value: 'suc-khoe', label: 'Sức khỏe' },
  { value: 'mon-ngon', label: 'Món ngon' },
  { value: 'meo-vat', label: 'Mẹo vặt' }
];

export default function EditPostModal({ post, uploadUrl, onClose, onSave }) {
  const [formData, setFormData] = useState({
    ...post,
    category: post.category || post.tag || 'cam-nang',
    excerpt: post.excerpt || post.desc || post.summary || '',
    readTime: post.readTime || '3 phút đọc',
    author: post.author || 'Tâm (Vườn Xứ Nắng Gió)',
    image: post.image || '',
    content: post.content || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      desc: formData.excerpt,
      summary: formData.excerpt
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="text-sm font-black text-stone-900">Cập Nhật Bài Viết & Ảnh Bìa</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer transition-colors"
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
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-stone-600 block mb-1">Chuyên mục (Chuẩn Sheet)</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 cursor-pointer"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.value})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-stone-600 block mb-1">Thời gian đọc</label>
              <input
                type="text"
                placeholder="VD: 3 phút đọc"
                value={formData.readTime}
                onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-600 block mb-1">Tác giả</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800"
              />
            </div>
          </div>

          {/* Cập nhật ảnh bìa Google Drive */}
          <ImageUploadField
            label="Cập nhật ảnh bìa bài viết"
            value={formData.image}
            uploadUrl={uploadUrl}
            onChange={(newUrl) => setFormData({ ...formData, image: newUrl })}
          />

          <div>
            <label className="font-semibold text-stone-600 block mb-1">Tóm tắt ngắn (Excerpt) *</label>
            <textarea
              rows="2"
              required
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-700 resize-none"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-600 block mb-1">Nội dung chi tiết</label>
            <textarea
              rows="4"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-700 resize-y"
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
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
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