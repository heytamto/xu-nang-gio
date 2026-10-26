import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RotateCcw, Pencil, Trash2, Calendar, Clock, Loader2, BookOpen } from 'lucide-react';
import ImageUploadField from '../../ImageUploadField';
import CustomDropdown from '../../CustomDropdown';
import { formatDate } from '../../../utils/dateUtils';
import { postRepo } from '../../../repositories';

const CATEGORY_OPTIONS = [
  { value: 'handbook', label: 'Cẩm nang' },
  { value: 'health', label: 'Sức khỏe' },
  { value: 'cuisine', label: 'Món ngon' },
  { value: 'tips', label: 'Mẹo vặt' }
];

export default function PostsTab({
  posts: parentPosts = [],
  onAddPost,
  onEditPost,
  onDeletePost,
  onResetPosts,
  onShowAlert,
  setConfirmModalConfig
}) {
  const [localPosts, setLocalPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Tải danh sách bài viết thông qua postRepo
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await postRepo.getAll();
      if (Array.isArray(data)) {
        const sorted = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setLocalPosts(sorted);
      }
    } catch (err) {
      console.error('Lỗi tải posts qua postRepo:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (Array.isArray(parentPosts) && parentPosts.length > 0) {
      setLocalPosts(parentPosts);
    } else {
      fetchPosts();
    }
  }, [parentPosts, fetchPosts]);

  const [newPost, setNewPost] = useState({
    title: '',
    category: 'handbook',
    image: '',
    excerpt: '',
    content: '',
    readTime: '3 phút đọc',
    author: 'Vườn Xứ Nắng'
  });

  // 2. Thêm bài viết mới qua postRepo
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.excerpt.trim()) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        title: newPost.title.trim(),
        category: newPost.category || 'handbook',
        excerpt: newPost.excerpt.trim(),
        content: newPost.content.trim() || newPost.excerpt.trim(),
        image: newPost.image.trim() || null,
        author: newPost.author.trim() || 'Vườn Xứ Nắng',
        read_time: newPost.readTime.trim() || '3 phút đọc',
        created_at: new Date().toISOString()
      };

      const createdPost = await postRepo.create(payload);

      setLocalPosts((prev) => [createdPost, ...prev]);

      if (onAddPost) {
        onAddPost(createdPost);
      }

      onShowAlert?.(`Đã đăng bài viết "${createdPost.title}" lên cẩm nang!`);

      setNewPost({
        title: '',
        category: 'handbook',
        image: '',
        excerpt: '',
        content: '',
        readTime: '3 phút đọc',
        author: 'Vườn Xứ Nắng'
      });
    } catch (err) {
      console.error('Lỗi khi lưu bài viết qua postRepo:', err);
      setErrorMessage(err.message || 'Không thể lưu bài viết vào cơ sở dữ liệu.');
      onShowAlert?.('Lỗi thêm bài viết: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Xóa bài viết: Ủy quyền trực tiếp cho onDeletePost của AdminPage để chỉ xác nhận 1 lần
  const handleDelete = async (id, title) => {
    if (onDeletePost) {
      try {
        setDeletingId(id);
        await onDeletePost(id, title);
      } finally {
        setDeletingId(null);
      }
      return;
    }

    // Fallback nếu chạy độc lập không qua AdminPage
    if (setConfirmModalConfig) {
      setConfirmModalConfig({
        isAlert: false,
        title: 'Xóa Bài Viết',
        message: `Bạn có chắc chắn muốn xóa bài "${title}" (#${id}) khỏi cẩm nang?`,
        confirmLabel: 'Xác nhận xóa',
        onConfirm: async () => {
          try {
            setDeletingId(id);
            await postRepo.remove(id);
            setLocalPosts((prev) => prev.filter((p) => p.id !== id));
            onShowAlert?.(`Đã xóa bài viết "${title}"!`);
          } catch (err) {
            console.error('Lỗi xóa bài viết:', err);
            onShowAlert?.('Không thể xóa bài viết: ' + (err.message || 'Lỗi hệ thống'));
          } finally {
            setDeletingId(null);
          }
        }
      });
      return;
    }

    if (!window.confirm(`Xóa bài viết "${title}"?`)) return;
    try {
      setDeletingId(id);
      await postRepo.remove(id);
      setLocalPosts((prev) => prev.filter((p) => p.id !== id));
      onShowAlert?.(`Đã xóa bài viết "${title}"!`);
    } catch (err) {
      alert('Không thể xóa bài viết: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const getCategoryLabel = (val) => {
    const found = CATEGORY_OPTIONS.find((c) => c.value === val);
    return found ? found.label : (val || 'Cẩm nang');
  };

  const postsList = localPosts;

  return (
    <div className="space-y-6 sm:space-y-7 animate-fadeIn font-sans text-stone-800">
      {/* KHUNG VIẾT BÀI MỚI */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-7 space-y-5 shadow-xs">
        <div className="flex items-center gap-2.5 text-stone-900 font-black text-sm sm:text-base border-b border-stone-100 pb-3.5">
          <Plus className="w-5 h-5 text-amber-700" />
          <span>Viết Bài Mới (Cẩm Nang & Mẹo Vặt)</span>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold rounded-2xl">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="font-bold text-stone-700 block mb-1.5">Tiêu đề bài viết *</label>
            <input
              type="text"
              required
              placeholder="VD: Cách bảo quản táo gió giòn ngọt cả tuần trong tủ lạnh"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white font-medium text-stone-900 focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <CustomDropdown
                label="Chuyên mục"
                headerLabel="DANH SÁCH CHUYÊN MỤC:"
                icon={BookOpen}
                options={CATEGORY_OPTIONS}
                value={newPost.category}
                onChange={(val) => setNewPost({ ...newPost, category: val })}
                searchable={false}
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1.5">Thời gian đọc</label>
              <input
                type="text"
                placeholder="VD: 3 phút đọc"
                value={newPost.readTime}
                onChange={(e) => setNewPost({ ...newPost, readTime: e.target.value })}
                className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-medium focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1.5">Tác giả</label>
              <input
                type="text"
                placeholder="Vườn Xứ Nắng"
                value={newPost.author}
                onChange={(e) => setNewPost({ ...newPost, author: e.target.value })}
                className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-medium focus:outline-none focus:border-amber-600 shadow-2xs transition-colors"
              />
            </div>
          </div>

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
              disabled={isSubmitting}
              className="px-7 py-3 bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu bài viết...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Đăng Bài Viết Ngay</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* DANH SÁCH BÀI ĐÃ ĐĂNG */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-7 space-y-5 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-stone-100 pb-3.5">
          <div>
            <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
              Danh Sách Bài Đã Đăng ({postsList.length})
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

        {isLoading ? (
          <div className="py-12 text-center text-stone-400 text-xs sm:text-sm flex items-center justify-center gap-2 font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-amber-700" />
            <span>Đang tải danh sách bài viết...</span>
          </div>
        ) : postsList.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-xs sm:text-sm italic font-medium">
            Chưa có bài viết nào được lưu.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {postsList.map((post, idx) => {
              const displayDate = formatDate(post.created_at || post.date, 'Gần đây');
              const summaryText = post.excerpt || '';
              const postImageUrl = post.image || 'https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?auto=format&fit=crop&w=600&q=80';
              const readTimeText = post.read_time;
              const isItemDeleting = deletingId === post.id;

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
                      <div className="flex items-center gap-2 flex-wrap">
                        {post.id && (
                          <span className="font-mono font-bold text-amber-950 bg-amber-100 px-2 py-0.5 rounded-lg text-xs border border-amber-300/70">
                            #{post.id}
                          </span>
                        )}
                        <span className="font-bold text-stone-900 text-sm sm:text-base line-clamp-1 block leading-snug">
                          {post.title}
                        </span>
                      </div>

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
                      {getCategoryLabel(post.category)}
                    </span>

                    <button
                      type="button"
                      onClick={() => onEditPost && onEditPost(post)}
                      className="p-2 text-stone-400 hover:text-amber-700 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Chỉnh sửa bài viết"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      disabled={isItemDeleting}
                      onClick={() => handleDelete(post.id, post.title)}
                      className="p-2 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer disabled:opacity-50"
                      title="Xóa bài viết"
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