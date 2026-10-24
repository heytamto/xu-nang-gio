// src/components/admin/EditStoryModal.jsx
import React, { useState } from 'react';
import { X, Check, Calendar, MapPin } from 'lucide-react';
import ImageUploadField from '../ImageUploadField';
import { formatDate } from '../../utils/dateUtils';

export default function EditStoryModal({ story = {}, onClose, onSave }) {
  const [formData, setFormData] = useState(() => ({
    id: story.id || '',
    title: story.title || '',
    date: formatDate(story.created_at || story.date || new Date(), '15/10/2026'),
    season: story.season || 'Vụ Thu Đông',
    quote: story.quote || story.desc || '',
    story: story.story || story.content || '',
    image: story.image_url || story.image || '',
    location: story.location || 'Giàn nho Thái An',
    author: story.author || 'Tâm Xứ Nắng'
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title?.trim()) return;

    onSave({
      ...formData,
      // Đảm bảo tương thích song song cả Postgres schema và frontend
      content: formData.story || formData.quote,
      desc: formData.quote,
      image_url: formData.image
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-950/75 backdrop-blur-xs animate-fadeIn font-sans text-stone-800">
      {/* Khung modal chuẩn rộng max-w-5xl (1024px) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-5xl w-full shadow-2xl border border-stone-200 space-y-5 max-h-[92vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        
        {/* HEADER MODAL */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <h3 className="text-base sm:text-xl font-black text-stone-900 tracking-tight">
            Cập Nhật Chuyện Vườn & Ảnh
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-2 rounded-2xl hover:bg-stone-100 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="font-bold text-stone-700 block mb-1.5">
              Tiêu đề mẩu chuyện *
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
            <div>
              <label className="font-bold text-stone-700 block mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-stone-500" />
                <span>Ngày đăng</span>
              </label>
              <input
                type="text"
                value={formData.date}
                placeholder="15/10/2026"
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-mono font-bold focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1.5">
                Mùa vụ (season)
              </label>
              <input
                type="text"
                placeholder="Vụ Thu Đông"
                value={formData.season}
                onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-medium focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-stone-500" />
                <span>Địa điểm</span>
              </label>
              <input
                type="text"
                placeholder="Giàn nho Thái An"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-medium focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
              />
            </div>
          </div>

          {/* Cập nhật ảnh qua Supabase Storage */}
          <ImageUploadField
            label="Ảnh đại diện mẩu chuyện (Supabase Storage)"
            value={formData.image}
            bucket="stories"
            onChange={(newUrl) => setFormData({ ...formData, image: newUrl })}
          />

          <div>
            <label className="font-bold text-stone-700 block mb-1.5">
              Lời đề từ / Trích dẫn ngắn (quote)
            </label>
            <input
              type="text"
              placeholder="VD: Nắng rát mặt nhưng trái nho lại mọng mật nhất vào những ngày gió khan..."
              value={formData.quote}
              onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
              className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 italic focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1.5">
              Nội dung câu chuyện chi tiết (story) *
            </label>
            <textarea
              rows="7"
              required
              placeholder="Nội dung đầy đủ về đời sống làm vườn, gió cát..."
              value={formData.story}
              onChange={(e) => setFormData({ ...formData, story: e.target.value })}
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
              className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-amber-700 hover:bg-amber-800 text-white shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Lưu Thay Đổi Chuyện Vườn</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}