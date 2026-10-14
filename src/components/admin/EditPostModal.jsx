import React, { useState } from 'react';
import { X } from 'lucide-react';
import ImageUploadField from './ImageUploadField';

export default function EditPostModal({ post, onClose, onSave }) {
  const [formData, setFormData] = useState({ ...post });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="text-sm font-black text-stone-900">Cập Nhật Bài Viết & Ảnh Bìa</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-stone-600 block mb-1">Tiêu đề bài viết</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-600 block mb-1">Chuyên mục</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800"
              >
                <option value="Chuyện Vườn">Chuyện Vườn</option>
                <option value="Mẹo Nhà Nông">Mẹo Nhà Nông</option>
                <option value="Đặc Sản Bản Địa">Đặc Sản Bản Địa</option>
                <option value="Món Ngon">Món Ngon Gia Đình</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-stone-600 block mb-1">Tác giả</label>
              <input
                type="text"
                value={formData.author || ''}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800"
              />
            </div>
          </div>

          {/* Cập nhật ảnh bìa Google Drive */}
          <ImageUploadField
            label="Cập nhật ảnh bìa bài viết"
            value={formData.image || ''}
            onChange={(newUrl) => setFormData({ ...formData, image: newUrl })}
          />

          <div>
            <label className="font-semibold text-stone-600 block mb-1">Tóm tắt ngắn</label>
            <textarea
              rows="2"
              value={formData.desc || ''}
              onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-700 resize-none"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-600 block mb-1">Nội dung chi tiết</label>
            <textarea
              rows="4"
              value={formData.content || ''}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-700 resize-y"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-all active:scale-95"
            >
              Lưu Thay Đổi Bài Viết
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}