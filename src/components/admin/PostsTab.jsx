import React, { useState } from 'react';
import { Plus, RotateCcw, Pencil, Trash2, Calendar, Clock } from 'lucide-react';
import ImageUploadField from './ImageUploadField';
import { formatDate } from '../../utils/dateUtils';

const CATEGORY_OPTIONS = [
  { value: 'cam-nang', label: 'Cẩm nang' },
  { value: 'suc-khoe', label: 'Sức khỏe' },
  { value: 'mon-ngon', label: 'Món ngon' },
  { value: 'meo-vat', label: 'Mẹo vặt' }
];

export default function PostsTab({
  posts = [],
  onAddPost,
  onEditPost,
  onDeletePost,
  onResetPosts,
  uploadUrl
}) {
  const [newPost, setNewPost] = useState({
    title: '',
    category: 'cam-nang',
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
      // Đảm bảo tương thích ngược cho cả desc và excerpt
      desc: newPost.excerpt,
      summary: newPost.excerpt
    });

    setNewPost({
      title: '',
      category: 'cam-nang',
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
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Form viết bài mới */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
          <Plus className="w-4 h-4 text-amber-600" />
          <span>Viết Bài Mới (Cẩm Nang & Mẹo Vặt)</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-stone-600 block mb-1">Tiêu đề bài viết *</label>
            <input
              type="text"
              required
              placeholder="VD: Cách bảo quản táo gió giòn ngọt cả tuần trong tủ lạnh"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-medium text-stone-800 focus:outline-none focus:border-amber-600"
            />
          </div>

          {/* Gộp Chuyên mục, Thời gian đọc & Tác giả */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-stone-600 block mb-1">Chuyên mục (Chuẩn Sheet)</label>
              <select
                value={newPost.category}
                onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-medium text-stone-800 cursor-pointer focus:outline-none focus:border-amber-600"
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
                value={newPost.readTime}
                onChange={(e) => setNewPost({ ...newPost, readTime: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-600 block mb-1">Tác giả</label>
              <input
                type="text"
                placeholder="Tâm (Vườn Xứ Nắng Gió)"
                value={newPost.author}
                onChange={(e) => setNewPost({ ...newPost, author: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          <ImageUploadField
            label="Ảnh bìa bài viết (Tải trực tiếp lên Google Drive hoặc dán URL)"
            value={newPost.image}
            onChange={(url) => setNewPost({ ...newPost, image: url })}
            uploadUrl={uploadUrl}
          />

          <div>
            <label className="font-semibold text-stone-600 block mb-1">Tóm tắt ngắn (Excerpt) *</label>
            <textarea
              rows="2"
              required
              placeholder="Vài câu tóm tắt nội dung bài viết..."
              value={newPost.excerpt}
              onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-700 resize-none focus:outline-none focus:border-amber-600 leading-relaxed"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-600 block mb-1">Nội dung chi tiết</label>
            <textarea
              rows="4"
              placeholder="Nội dung chi tiết bài viết (hỗ trợ xuống dòng)..."
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-700 resize-y focus:outline-none focus:border-amber-600 leading-relaxed"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Đăng Bài Viết Ngay</span>
            </button>
          </div>
        </form>
      </div>

      {/* Danh sách bài viết */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-stone-900">Danh Sách Bài Đã Đăng ({posts.length})</h2>
            <p className="text-xs text-stone-500">Chỉnh sửa nội dung, đổi ảnh hoặc gỡ bài viết khỏi Web & Google Sheet</p>
          </div>
          {onResetPosts && (
            <button
              type="button"
              onClick={onResetPosts}
              className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục mặc định</span>
            </button>
          )}
        </div>

        {posts.length === 0 ? (
          <div className="py-10 text-center text-stone-400 text-xs italic">
            Chưa có bài viết nào được lưu.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {posts.map((post, idx) => {
              const displayDate = formatDate(post.date, 'Gần đây');
              const summaryText = post.excerpt || post.desc || post.summary || '';

              return (
                <div key={post.id || idx} className="py-3.5 flex items-start justify-between gap-4 text-xs">
                  <div className="flex items-start gap-3 min-w-0">
                    <img
                      src={post.image || 'https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?auto=format&fit=crop&w=600&q=80'}
                      alt={post.title}
                      className="w-16 h-14 rounded-xl object-cover shrink-0 border border-stone-100 shadow-2xs"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="space-y-1 min-w-0">
                      <span className="font-bold text-stone-900 text-xs line-clamp-1 block">
                        {post.title}
                      </span>
                      {summaryText && (
                        <p className="text-stone-500 text-[11px] line-clamp-2 leading-relaxed">
                          {summaryText}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-[10.5px] text-stone-400">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          <span className="font-mono">{displayDate}</span>
                        </span>
                        {post.readTime && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-stone-400" />
                            <span>{post.readTime}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60 uppercase">
                      {getCategoryLabel(post.category || post.tag)}
                    </span>

                    <button
                      type="button"
                      onClick={() => onEditPost(post)}
                      className="p-1.5 text-stone-400 hover:text-amber-600 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Chỉnh sửa bài viết"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeletePost(post.id, post.title)}
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
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