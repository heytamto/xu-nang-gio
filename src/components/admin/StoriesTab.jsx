// src/components/admin/StoriesTab.jsx
import React, { useState } from 'react';
import { Plus, RotateCcw, Pencil, Trash2, Feather, Calendar, MapPin, Sparkles } from 'lucide-react';
import ImageUploadField from './ImageUploadField';
import { formatDate } from '../../utils/dateUtils';

export default function StoriesTab({
  stories = [],
  onAddStory,
  onEditStory,
  onDeleteStory,
  onResetStories
}) {
  const [newStory, setNewStory] = useState({
    title: '',
    season: 'Vụ Thu Đông',
    quote: '',
    story: '',
    image: '',
    location: 'Giàn nho Thái An',
    author: 'Tâm Xứ Nắng'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newStory.title.trim() || (!newStory.quote.trim() && !newStory.story.trim())) return;

    onAddStory({
      ...newStory,
      // Tương thích song song cả bảng stories trên Supabase và state hiện tại
      content: newStory.story || newStory.quote,
      desc: newStory.quote,
      image_url: newStory.image,
      created_at: new Date().toISOString()
    });

    setNewStory({
      title: '',
      season: 'Vụ Thu Đông',
      quote: '',
      story: '',
      image: '',
      location: 'Giàn nho Thái An',
      author: 'Tâm Xứ Nắng'
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Form viết chuyện mới */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
          <Feather className="w-4 h-4 text-amber-600" />
          <span>Viết Chuyện Mới (Chuyện Vườn & Đời Sống Nắng Gió)</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-stone-600 block mb-1">Tiêu đề câu chuyện *</label>
            <input
              type="text"
              required
              placeholder="VD: Mùa gió chướng và vị ngọt giàn nho Thái An..."
              value={newStory.title}
              onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-medium text-stone-800 focus:outline-none focus:border-amber-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-stone-600 block mb-1">Mùa vụ (season)</label>
              <input
                type="text"
                placeholder="VD: Vụ Thu Đông, Vụ Xuân Hè..."
                value={newStory.season}
                onChange={(e) => setNewStory({ ...newStory, season: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-600 block mb-1">Địa điểm (location)</label>
              <input
                type="text"
                placeholder="VD: Giàn nho Thái An, Ninh Thuận"
                value={newStory.location}
                onChange={(e) => setNewStory({ ...newStory, location: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-600 block mb-1">Người kể (author)</label>
              <input
                type="text"
                placeholder="VD: Tâm Xứ Nắng"
                value={newStory.author}
                onChange={(e) => setNewStory({ ...newStory, author: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          {/* Tải ảnh mẩu chuyện lên Supabase Storage bucket stories */}
          <ImageUploadField
            label="Ảnh mẩu chuyện (Supabase Storage)"
            value={newStory.image}
            bucket="stories"
            onChange={(url) => setNewStory({ ...newStory, image: url })}
          />

          <div>
            <label className="font-semibold text-stone-600 block mb-1">Lời đề từ / Trích dẫn ngắn (quote)</label>
            <input
              type="text"
              placeholder="VD: Nắng rát mặt nhưng trái nho lại mọng mật nhất vào những ngày gió khan..."
              value={newStory.quote}
              onChange={(e) => setNewStory({ ...newStory, quote: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-700 italic focus:outline-none focus:border-amber-600"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-600 block mb-1">Nội dung câu chuyện chi tiết (story) *</label>
            <textarea
              rows="4"
              required
              placeholder="Kể chi tiết về đời sống làm vườn, gió cát, sự tỉ mẩn chăm sóc từng chùm quả..."
              value={newStory.story}
              onChange={(e) => setNewStory({ ...newStory, story: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-700 resize-y focus:outline-none focus:border-amber-600 leading-relaxed"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Đăng Chuyện Vườn Ngay</span>
            </button>
          </div>
        </form>
      </div>

      {/* Danh sách các câu chuyện đã đăng */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-stone-900">Danh Sách Chuyện Đã Đăng ({stories.length})</h2>
            <p className="text-xs text-stone-500">Quản lý mẩu chuyện vườn và hình ảnh lưu trữ trên Supabase</p>
          </div>
          {onResetStories && (
            <button
              type="button"
              onClick={onResetStories}
              className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục mặc định</span>
            </button>
          )}
        </div>

        {stories.length === 0 ? (
          <div className="py-10 text-center text-stone-400 text-xs italic">
            Chưa có mẩu chuyện vườn nào được lưu.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {stories.map((storyItem, idx) => {
              const displayDate = formatDate(storyItem.created_at || storyItem.date, 'Gần đây');
              const displayExcerpt = storyItem.quote || storyItem.desc || storyItem.story || storyItem.content || 'Chuyện làm vườn mùa nắng gió...';
              const displayImage = storyItem.image_url || storyItem.image || 'https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?auto=format&fit=crop&w=600&q=80';

              return (
                <div key={storyItem.id || idx} className="py-3.5 flex items-start justify-between gap-4 text-xs">
                  <div className="flex items-start gap-3 min-w-0">
                    <img
                      src={displayImage}
                      alt={storyItem.title}
                      className="w-16 h-14 rounded-xl object-cover shrink-0 border border-stone-100 shadow-2xs"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-stone-900 text-xs line-clamp-1">
                          {storyItem.title}
                        </span>
                        {storyItem.season && storyItem.season !== 'std' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            {storyItem.season}
                          </span>
                        )}
                      </div>

                      <p className="text-stone-500 text-[11px] line-clamp-2 leading-relaxed">
                        {displayExcerpt}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[10.5px] text-stone-400">
                        <span className="inline-flex items-center gap-1 font-mono text-stone-500">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          <span>{displayDate}</span>
                        </span>
                        {storyItem.location && (
                          <span className="inline-flex items-center gap-1 text-stone-500">
                            <MapPin className="w-3 h-3 text-stone-400" />
                            <span>{storyItem.location}</span>
                          </span>
                        )}
                        {storyItem.author && (
                          <span className="inline-flex items-center gap-1 text-stone-500">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span>{storyItem.author}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEditStory(storyItem)}
                      className="p-1.5 text-stone-400 hover:text-amber-600 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Chỉnh sửa câu chuyện"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteStory(storyItem.id, storyItem.title)}
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Xóa câu chuyện"
                    >
                      <Trash2 className="w-4 h-4" />
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