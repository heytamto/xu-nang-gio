import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RotateCcw, Pencil, Trash2, Feather, Calendar, MapPin, Sparkles, Loader2, Sun } from 'lucide-react';
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

export default function StoriesTab({
  stories: parentStories = [],
  onAddStory,
  onEditStory,
  onDeleteStory,
  onResetStories,
  onShowAlert,
  setConfirmModalConfig
}) {
  const [localStories, setLocalStories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Tải dữ liệu qua storyRepo nếu danh sách từ props rỗng
  const fetchStories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await storyRepo.getAll();
      if (Array.isArray(data)) {
        const sorted = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setLocalStories(sorted);
      }
    } catch (err) {
      console.error('Lỗi tải stories qua storyRepo:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (Array.isArray(parentStories) && parentStories.length > 0) {
      setLocalStories(parentStories);
    } else {
      fetchStories();
    }
  }, [parentStories, fetchStories]);

  const [newStory, setNewStory] = useState({
    title: '',
    season: 'Vụ Thu Đông',
    quote: '',
    story: '',
    image: '',
    location: 'Giàn nho Thái An',
    author: 'Tâm Xứ Nắng'
  });

  // 2. Thêm mẩu chuyện mới qua storyRepo
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newStory.title.trim() || (!newStory.quote.trim() && !newStory.story.trim())) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const nowIso = new Date().toISOString();
      const storyText = newStory.story.trim() || newStory.quote.trim();
      const imageUrl = newStory.image.trim() || null;

      const payload = {
        title: newStory.title.trim(),
        season: newStory.season.trim() || 'Vụ Thu Đông',
        location: newStory.location.trim() || 'Ninh Thuận',
        author: newStory.author.trim() || 'Tâm Xứ Nắng',
        quote: newStory.quote.trim() || null,
        story: storyText,
        content: storyText,
        image: imageUrl,
        image_url: imageUrl,
        order: 0,
        created_at: nowIso
      };

      const createdStory = await storyRepo.create(payload);

      setLocalStories((prev) => [createdStory, ...prev]);

      if (onAddStory) {
        onAddStory(createdStory);
      }

      onShowAlert?.(`Đã đăng mẩu chuyện "${createdStory.title}" lên mục Chuyện Vườn!`);

      setNewStory({
        title: '',
        season: 'Vụ Thu Đông',
        quote: '',
        story: '',
        image: '',
        location: 'Giàn nho Thái An',
        author: 'Tâm Xứ Nắng'
      });
    } catch (err) {
      console.error('Lỗi khi lưu chuyện vườn qua storyRepo:', err);
      setErrorMessage(err.message || 'Không thể lưu câu chuyện vào cơ sở dữ liệu.');
      onShowAlert?.('Lỗi thêm chuyện vườn: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Xóa câu chuyện: Gọi trực tiếp onDeleteStory từ component cha để chỉ xác nhận 1 lần
  const handleDelete = async (id, title) => {
    if (onDeleteStory) {
      try {
        setDeletingId(id);
        await onDeleteStory(id, title);
      } finally {
        setDeletingId(null);
      }
      return;
    }

    if (setConfirmModalConfig) {
      setConfirmModalConfig({
        isAlert: false,
        title: 'Xóa Chuyện Vườn',
        message: `Bạn có chắc chắn muốn xóa mẩu chuyện "${title}" (#${id}) khỏi cơ sở dữ liệu?`,
        confirmLabel: 'Xác nhận xóa',
        onConfirm: async () => {
          try {
            setDeletingId(id);
            await storyRepo.remove(id);
            setLocalStories((prev) => prev.filter((item) => item.id !== id));
            onShowAlert?.(`Đã xóa mẩu chuyện "${title}"!`);
          } catch (err) {
            console.error('Lỗi xóa story:', err);
            onShowAlert?.('Không thể xóa: ' + (err.message || 'Lỗi hệ thống'));
          } finally {
            setDeletingId(null);
          }
        }
      });
      return;
    }

    if (!window.confirm(`Xóa câu chuyện "${title}"?`)) return;
    try {
      setDeletingId(id);
      await storyRepo.remove(id);
      setLocalStories((prev) => prev.filter((item) => item.id !== id));
      onShowAlert?.(`Đã xóa mẩu chuyện "${title}"!`);
    } catch (err) {
      alert('Không thể xóa: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const storiesList = localStories;

  return (
    <div className="space-y-6 sm:space-y-7 animate-fadeIn font-sans text-stone-800">
      {/* KHUNG SOẠN THẢO CHUYỆN VƯỜN */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-7 space-y-5 shadow-xs">
        <div className="flex items-center gap-2.5 text-stone-900 font-black text-sm sm:text-base border-b border-stone-100 pb-3.5">
          <Feather className="w-5 h-5 text-amber-700" />
          <span>Viết Chuyện Mới (Chuyện Vườn & Đời Sống Nắng Gió)</span>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold rounded-2xl">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="font-bold text-stone-700 block mb-1.5">Tiêu đề câu chuyện *</label>
            <input
              type="text"
              required
              placeholder="VD: Mùa gió chướng và vị ngọt giàn nho Thái An..."
              value={newStory.title}
              onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
              className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white font-medium text-stone-900 focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <CustomDropdown
                label="Mùa vụ (Season)"
                headerLabel="DANH SÁCH MÙA VỤ:"
                icon={Sun}
                options={SEASON_OPTIONS}
                value={newStory.season}
                onChange={(val) => setNewStory({ ...newStory, season: val })}
                searchable={false}
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-stone-500" />
                <span>Địa điểm (Location)</span>
              </label>
              <input
                type="text"
                placeholder="VD: Giàn nho Thái An, Ninh Thuận"
                value={newStory.location}
                onChange={(e) => setNewStory({ ...newStory, location: e.target.value })}
                className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-medium focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1.5">Người kể (Author)</label>
              <input
                type="text"
                placeholder="VD: Tâm Xứ Nắng"
                value={newStory.author}
                onChange={(e) => setNewStory({ ...newStory, author: e.target.value })}
                className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-medium focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
              />
            </div>
          </div>

          <ImageUploadField
            label="Ảnh mẩu chuyện (Supabase Storage)"
            value={newStory.image}
            bucket="stories"
            onChange={(url) => setNewStory({ ...newStory, image: url })}
          />

          <div>
            <label className="font-bold text-stone-700 block mb-1.5">Lời đề từ / Trích dẫn ngắn (Quote)</label>
            <input
              type="text"
              placeholder="VD: Nắng rát mặt nhưng trái nho lại mọng mật nhất vào những ngày gió khan..."
              value={newStory.quote}
              onChange={(e) => setNewStory({ ...newStory, quote: e.target.value })}
              className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 italic focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1.5">Nội dung câu chuyện chi tiết (Story) *</label>
            <textarea
              rows="5"
              required
              placeholder="Kể chi tiết về đời sống làm vườn, gió cát, sự tỉ mẩn chăm sóc từng chùm quả..."
              value={newStory.story}
              onChange={(e) => setNewStory({ ...newStory, story: e.target.value })}
              className="w-full p-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 resize-y focus:outline-none focus:border-amber-600 leading-relaxed shadow-2xs transition-colors"
            />
          </div>

          <div className="flex justify-end pt-2 border-t border-stone-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-7 py-3 bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu câu chuyện...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Đăng Chuyện Vườn Ngay</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* DANH SÁCH MẨU CHUYỆN ĐÃ ĐĂNG */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-7 space-y-5 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-stone-100 pb-3.5">
          <div>
            <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
              Danh Sách Chuyện Đã Đăng ({storiesList.length})
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 font-medium mt-0.5">
              Quản lý mẩu chuyện vườn và hình ảnh lưu trữ đồng bộ
            </p>
          </div>
          {onResetStories && (
            <button
              type="button"
              onClick={onResetStories}
              className="px-4 py-2 rounded-2xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Khôi phục mặc định</span>
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-stone-400 text-xs sm:text-sm flex items-center justify-center gap-2 font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-amber-700" />
            <span>Đang tải danh sách chuyện vườn...</span>
          </div>
        ) : storiesList.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-xs sm:text-sm italic font-medium">
            Chưa có mẩu chuyện vườn nào được lưu.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {storiesList.map((storyItem, idx) => {
              const displayDate = formatDate(storyItem.created_at, 'Gần đây');
              const displayExcerpt = storyItem.quote || storyItem.story || storyItem.content || 'Chuyện làm vườn mùa nắng gió...';
              const displayImage = storyItem.image || storyItem.image_url || 'https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?auto=format&fit=crop&w=600&q=80';
              const isItemDeleting = deletingId === storyItem.id;

              return (
                <div key={storyItem.id || idx} className="py-4 flex items-start justify-between gap-4 text-xs sm:text-sm">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <img
                      src={displayImage}
                      alt={storyItem.title}
                      className="w-20 h-16 sm:w-24 sm:h-18 rounded-2xl object-cover shrink-0 border border-stone-200 shadow-2xs bg-stone-100"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {storyItem.id && (
                          <span className="font-mono font-bold text-amber-950 bg-amber-100 px-2 py-0.5 rounded-lg text-xs border border-amber-300/70">
                            #{storyItem.id}
                          </span>
                        )}
                        <span className="font-bold text-stone-900 text-sm sm:text-base line-clamp-1 block leading-snug">
                          {storyItem.title}
                        </span>
                        {storyItem.season && storyItem.season !== 'std' && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-950 border border-amber-200/80 shadow-2xs">
                            {storyItem.season}
                          </span>
                        )}
                      </div>

                      <p className="text-stone-600 text-xs sm:text-sm line-clamp-2 leading-relaxed font-normal">
                        {displayExcerpt}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 font-medium">
                        <span className="inline-flex items-center gap-1.5 font-mono text-stone-600">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>{displayDate}</span>
                        </span>
                        {storyItem.location && (
                          <span className="inline-flex items-center gap-1.5 text-stone-600">
                            <MapPin className="w-3.5 h-3.5 text-stone-400" />
                            <span>{storyItem.location}</span>
                          </span>
                        )}
                        {storyItem.author && (
                          <span className="inline-flex items-center gap-1.5 text-stone-600">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            <span>{storyItem.author}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => onEditStory && onEditStory(storyItem)}
                      className="p-2 text-stone-400 hover:text-amber-700 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Chỉnh sửa câu chuyện"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      disabled={isItemDeleting}
                      onClick={() => handleDelete(storyItem.id, storyItem.title)}
                      className="p-2 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer disabled:opacity-50"
                      title="Xóa câu chuyện"
                    >
                      {isItemDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}