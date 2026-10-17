import React, { useState } from 'react';
import { X, Check, Calendar, MapPin } from 'lucide-react';
import ImageUploadField from './ImageUploadField';
import { formatDate } from '../../utils/dateUtils';

export default function EditStoryModal({ story = {}, uploadUrl, onClose, onSave }) {
  // Hàm tự động sửa sai khi các cột Sheet bị lệch vị trí
  const resolveInitialData = () => {
    let rawDate = story.date || '';
    let rawSeason = story.season || '';
    let rawQuote = story.quote || '';
    let rawStory = story.story || story.content || '';
    let rawImage = story.image || '';
    let rawLocation = story.location || 'Giàn nho Thái An';
    let rawAuthor = story.author || 'Tâm Xứ Nắng';

    const isTimeStr = (str) => {
      if (!str) return false;
      const s = String(str);
      return /GMT|\d{4}|(0[1-9]|[12]\d|3[01])\//i.test(s) && !s.includes('nho') && !s.includes('nắng');
    };

    const isImageUrl = (str) => /^https?:\/\/|^\/|data:image/i.test(String(str || '').trim());

    // 1. Nếu rawStory chứa chuỗi GMT/ngày tháng -> Đó chính là Date thật
    if (isTimeStr(rawStory) && !isTimeStr(rawDate)) {
      const realQuote = rawDate; // rawDate đang giữ câu văn tiếng Việt
      rawDate = rawStory;
      rawStory = realQuote;
      if (!rawQuote) rawQuote = realQuote;
    }

    // 2. Nếu rawImage chứa chữ như "Vụ Thu Đông" -> Đó là Season, không phải Image
    if (!isImageUrl(rawImage) && rawImage.trim() !== '') {
      if (!rawSeason || rawSeason === 'std') {
        rawSeason = rawImage;
      }
      rawImage = ''; // Xóa chữ tiếng Việt khỏi ô URL ảnh
    }

    // 3. Nếu rawQuote bị rỗng nhưng rawStory có câu văn ngắn
    if (!rawQuote && rawStory && !isTimeStr(rawStory)) {
      rawQuote = rawStory;
    }

    return {
      id: story.id || '',
      title: story.title || '',
      date: formatDate(rawDate, '15/10/2026'),
      season: rawSeason || 'Vụ Thu Đông',
      quote: rawQuote,
      story: rawStory,
      image: rawImage,
      location: rawLocation,
      author: rawAuthor
    };
  };

  const [formData, setFormData] = useState(resolveInitialData);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title?.trim()) return;

    onSave({
      ...formData,
      // Đảm bảo tương thích ngược cho cả content và story
      content: formData.story || formData.quote,
      desc: formData.quote
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="text-sm font-black text-stone-900">Cập Nhật Chuyện Vườn & Ảnh</h3>
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
            <label className="font-semibold text-stone-600 block mb-1">Tiêu đề mẩu chuyện *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 font-medium focus:outline-none focus:border-amber-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-stone-600 block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-500" />
                <span>Ngày đăng</span>
              </label>
              <input
                type="text"
                value={formData.date}
                placeholder="15/10/2026"
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 font-mono focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-600 block mb-1">Mùa vụ (season)</label>
              <input
                type="text"
                placeholder="Vụ Thu Đông"
                value={formData.season}
                onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-600 block mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-500" />
                <span>Địa điểm</span>
              </label>
              <input
                type="text"
                placeholder="Giàn nho Thái An"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          <ImageUploadField
            label="Ảnh đại diện mẩu chuyện (Tải trực tiếp lên Google Drive hoặc dán URL)"
            value={formData.image}
            uploadUrl={uploadUrl}
            onChange={(newUrl) => setFormData({ ...formData, image: newUrl })}
          />

          <div>
            <label className="font-semibold text-stone-600 block mb-1">Lời đề từ / Trích dẫn ngắn (quote)</label>
            <input
              type="text"
              placeholder="VD: Nắng rát mặt nhưng trái nho lại mọng mật nhất..."
              value={formData.quote}
              onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-700 italic focus:outline-none focus:border-amber-600"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-600 block mb-1">Nội dung câu chuyện chi tiết (story) *</label>
            <textarea
              rows="5"
              required
              placeholder="Nội dung đầy đủ về đời sống làm vườn, gió cát..."
              value={formData.story}
              onChange={(e) => setFormData({ ...formData, story: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-700 resize-y focus:outline-none focus:border-amber-600 leading-relaxed"
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
              <span>Lưu Thay Đổi Chuyện Vườn</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}