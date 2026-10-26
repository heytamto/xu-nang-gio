import React, { useState, useEffect } from 'react';
import { X, Check, Calendar, MapPin, Loader2, Sun } from 'lucide-react';
import ImageUploadField from '../../ImageUploadField';
import CustomDropdown from '../../CustomDropdown';
import { formatDate } from '../../../utils/dateUtils';
import { storyRepo } from '../../../repositories';

const SEASON_OPTIONS = [
  { value: 'Vụ Thu Đông', label: 'Vụ Thu Đông (Tháng 9 - 12)' },
  { value: 'Vụ Xuân Hè', label: 'Vụ Xuân Hè (Tháng 1 - 4)' },
  { value: 'Vụ Hè Thu', label: 'Vụ Hè Thu (Tháng 5 - 8)' },
  { value: 'Mùa Gió Khan', label: 'Mùa Gió Khan Ninh Thuận' }
];

export default function EditStoryModal({ story = {}, onClose, onSave, onShowAlert }) {
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    date: '',
    season: 'Vụ Thu Đông',
    quote: '',
    story: '',
    image: '',
    location: 'Giàn nho Thái An',
    author: 'Tâm Xứ Nắng'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (story && story.id) {
      setFormData({
        id: story.id,
        title: story.title || '',
        date: formatDate(story.created_at || story.date || new Date(), '15/10/2026'),
        season: story.season || 'Vụ Thu Đông',
        quote: story.quote || '',
        story: story.story || story.content || '',
        image: story.image_url || story.image || '',
        location: story.location || 'Giàn nho Thái An',
        author: story.author || 'Tâm Xứ Nắng'
      });
      setErrorMessage('');
    }
  }, [story]);

  if (!story || !story.id) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title?.trim()) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const storyText = formData.story.trim() || formData.quote.trim();
      const imageUrl = formData.image.trim() || null;

      // Payload đồng bộ schema Supabase public.stories
      const updatePayload = {
        title: formData.title.trim(),
        season: formData.season.trim() || 'Vụ Thu Đông',
        location: formData.location.trim() || 'Ninh Thuận',
        author: formData.author.trim() || 'Tâm Xứ Nắng',
        quote: formData.quote.trim() || null,
        story: storyText,
        content: storyText,
        image: imageUrl,
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      };

      // 1. Cập nhật thông qua storyRepo
      const updatedStory = await storyRepo.update(story.id, updatePayload);

      const savedResult = updatedStory || { ...story, ...updatePayload };

      // 2. Thông báo thành công
      onShowAlert?.(`Đã cập nhật câu chuyện #${story.id} thành công!`);

      // 3. Cập nhật state ở component cha
      if (onSave) {
        onSave(savedResult);
      }

      onClose();
    } catch (err) {
      console.error('Lỗi khi cập nhật chuyện vườn qua storyRepo:', err);
      setErrorMessage(err.message || 'Không thể cập nhật câu chuyện vào cơ sở dữ liệu.');
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
              Cập Nhật Chuyện Vườn & Ảnh
            </h3>
            {story.id && (
              <span className="font-mono text-amber-950 bg-amber-100 px-2.5 py-0.5 rounded-xl text-xs font-bold border border-amber-300/70 shadow-2xs">
                #{story.id}
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
              Tiêu đề mẩu chuyện *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-bold focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 sm:gap-4">
            <div>
              <label className="font-bold text-stone-700 block mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-stone-500" />
                <span>Ngày đăng</span>
              </label>
              <input
                type="text"
                disabled
                value={formData.date}
                className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-100/70 text-stone-500 font-mono font-bold shadow-2xs cursor-not-allowed"
              />
            </div>

            <div>
              <CustomDropdown
                label="Mùa vụ"
                headerLabel="DANH SÁCH MÙA VỤ:"
                icon={Sun}
                options={SEASON_OPTIONS}
                value={formData.season}
                onChange={(val) => setFormData({ ...formData, season: val })}
                searchable={false}
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

            <div>
              <label className="font-bold text-stone-700 block mb-1.5">
                Người kể
              </label>
              <input
                type="text"
                placeholder="Tâm Xứ Nắng"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-medium focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
              />
            </div>
          </div>

          <ImageUploadField
            label="Ảnh đại diện mẩu chuyện (Supabase Storage)"
            value={formData.image}
            bucket="stories"
            onChange={(newUrl) => setFormData({ ...formData, image: newUrl })}
          />

          <div>
            <label className="font-bold text-stone-700 block mb-1.5">
              Lời đề từ / Trích dẫn ngắn (Quote)
            </label>
            <input
              type="text"
              placeholder="VD: Nắng rát mặt nhưng trái nho lại mọng mật nhất..."
              value={formData.quote}
              onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
              className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 italic focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1.5">
              Nội dung câu chuyện chi tiết (Story) *
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
              disabled={isSubmitting}
              className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Lưu Thay Đổi Chuyện Vườn</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}