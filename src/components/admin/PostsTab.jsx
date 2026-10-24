// src/components/admin/PostsTab.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Plus, RotateCcw, Pencil, Trash2, Calendar, Clock, ChevronDown, Check } from 'lucide-react';
import ImageUploadField from '../ImageUploadField';
import { formatDate } from '../../utils/dateUtils';

// DANH MỤC VALUE TIẾNG ANH CHUẨN ĐẸP
const CATEGORY_OPTIONS = [
  { value: 'handbook', label: 'Cẩm nang' },
  { value: 'health', label: 'Sức khỏe' },
  { value: 'cuisine', label: 'Món ngon' },
  { value: 'tips', label: 'Mẹo vặt' }
];

// DROPDOWN CUSTOM BO TRÒN THEO MẪU DATABASE THƯ
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

      {/* Nút kích hoạt */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full py-3 px-4 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all duration-200 cursor-pointer text-xs sm:text-sm ${
          isOpen
            ? 'bg-amber-50/60 border-amber-500 ring-2 ring-amber-400/20 shadow-xs text-stone-900 font-bold'
            : 'bg-white hover:bg-stone-50/80 border-amber-400/90 hover:border-amber-500 shadow-2xs text-stone-800 font-medium'
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
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 p-2 rounded-2xl bg-white border border-amber-200/90 shadow-2xl space-y-1 animate-fadeIn text-xs sm:text-sm">
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

export default function PostsTab({
  posts = [],
  onAddPost,
  onEditPost,
  onDeletePost,
  onResetPosts
}) {
  const [newPost, setNewPost] = useState({
    title: '',
    category: 'handbook',
    image: '',
    excerpt: '',
    content: '',
    readTime: '3 phút đọc',
    author: 'Tâm (Vườn Xứ Nắng Gió)'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.excerpt.trim()) return;

    onAddPost({
      ...newPost,
      desc: newPost.excerpt,
      summary: newPost.excerpt,
      image_url: newPost.image,
      read_time: newPost.readTime,
      created_at: new Date().toISOString()
    });

    setNewPost({
      title: '',
      category: 'handbook',
      image: '',
      excerpt: '',
      content: '',
      readTime: '3 phút đọc',
      author: 'Tâm (Vườn Xứ Nắng Gió)'
    });
  };

  const getCategoryLabel = (val) => {
    const found = CATEGORY_OPTIONS.find((c) => c.value === val);
    return found ? found.label : (val || 'Cẩm nang');
  };

  return (
    <div className="space-y-6 sm:space-y-7 animate-fadeIn font-sans text-stone-800">
      {/* Form viết bài mới */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-7 space-y-5 shadow-xs">
        <div className="flex items-center gap-2.5 text-stone-900 font-black text-sm sm:text-base border-b border-stone-100 pb-3.5">
          <Plus className="w-5 h-5 text-amber-700" />
          <span>Viết Bài Mới (Cẩm Nang & Mẹo Vặt)</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="font-bold text-stone-700 block mb-1.5">Tiêu đề bài viết *</label>
            <input
              type="text"
              required
              placeholder="VD: Cách bảo quản táo gió giòn ngọt cả tuần trong tủ lạnh"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              className="w-full p-3 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white font-medium text-stone-900 focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
            />
          </div>

          {/* Chuyên mục, Thời gian đọc & Tác giả */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <CustomCategorySelect
                label="Chuyên mục"
                options={CATEGORY_OPTIONS}
                value={newPost.category}
                onChange={(val) => setNewPost({ ...newPost, category: val })}
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1.5">Thời gian đọc</label>
              <input
                type="text"
                placeholder="VD: 3 phút đọc"
                value={newPost.readTime}
                onChange={(e) => setNewPost({ ...newPost, readTime: e.target.value })}
                className="w-full p-3 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-medium focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1.5">Tác giả</label>
              <input
                type="text"
                placeholder="Tâm (Vườn Xứ Nắng Gió)"
                value={newPost.author}
                onChange={(e) => setNewPost({ ...newPost, author: e.target.value })}
                className="w-full p-3 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-medium focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
              />
            </div>
          </div>

          {/* Upload ảnh trực tiếp lên Supabase Storage bucket posts */}
          <ImageUploadField
            label="Ảnh bìa bài viết (Supabase Storage)"
            value={newPost.image}
            bucket="posts"
            onChange={(url) => setNewPost({ ...newPost, image: url })}
          />

          <div>
            <label className="font-bold text-stone-700 block mb-1.5">Tóm tắt ngắn (Excerpt) *</label>
            <textarea
              rows="3"
              required
              placeholder="Vài câu tóm tắt nội dung bài viết..."
              value={newPost.excerpt}
              onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
              className="w-full p-3.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 resize-none focus:outline-none focus:border-amber-600 leading-relaxed shadow-2xs transition-colors"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1.5">Nội dung chi tiết</label>
            <textarea
              rows="5"
              placeholder="Nội dung chi tiết bài viết (hỗ trợ xuống dòng)..."
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              className="w-full p-3.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 resize-y focus:outline-none focus:border-amber-600 leading-relaxed shadow-2xs transition-colors"
            />
          </div>

          <div className="flex justify-end pt-2 border-t border-stone-100">
            <button
              type="submit"
              className="px-6 py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Đăng Bài Viết Ngay</span>
            </button>
          </div>
        </form>
      </div>

      {/* Danh sách bài viết */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-7 space-y-5 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-stone-100 pb-3.5">
          <div>
            <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
              Danh Sách Bài Đã Đăng ({posts.length})
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 font-medium mt-0.5">
              Chỉnh sửa nội dung, đổi ảnh hoặc gỡ bài viết khỏi hệ thống
            </p>
          </div>
          {onResetPosts && (
            <button
              type="button"
              onClick={onResetPosts}
              className="px-4 py-2 rounded-2xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Khôi phục mặc định</span>
            </button>
          )}
        </div>

        {posts.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-xs sm:text-sm italic font-medium">
            Chưa có bài viết nào được lưu.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {posts.map((post, idx) => {
              const displayDate = formatDate(post.created_at || post.date, 'Gần đây');
              const summaryText = post.excerpt || post.desc || post.summary || '';
              const postImageUrl = post.image_url || post.image || 'https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?auto=format&fit=crop&w=600&q=80';
              const readTimeText = post.read_time || post.readTime;

              return (
                <div key={post.id || idx} className="py-4 flex items-start justify-between gap-4 text-xs sm:text-sm">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <img
                      src={postImageUrl}
                      alt={post.title}
                      className="w-20 h-16 sm:w-24 sm:h-18 rounded-2xl object-cover shrink-0 border border-stone-200 shadow-2xs bg-stone-100"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="space-y-1.5 min-w-0">
                      <span className="font-bold text-stone-900 text-sm sm:text-base line-clamp-1 block leading-snug">
                        {post.title}
                      </span>
                      {summaryText && (
                        <p className="text-stone-600 text-xs sm:text-sm line-clamp-2 leading-relaxed font-normal">
                          {summaryText}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-stone-500 font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span className="font-mono">{displayDate}</span>
                        </span>
                        {readTimeText && (
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-stone-400" />
                            <span>{readTimeText}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-950 border border-amber-200/80 uppercase shadow-2xs">
                      {getCategoryLabel(post.category || post.tag)}
                    </span>

                    <button
                      type="button"
                      onClick={() => onEditPost(post)}
                      className="p-2 text-stone-400 hover:text-amber-700 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Chỉnh sửa bài viết"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeletePost(post.id, post.title)}
                      className="p-2 text-stone-400 hover:text-red-600 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Xóa bài viết"
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