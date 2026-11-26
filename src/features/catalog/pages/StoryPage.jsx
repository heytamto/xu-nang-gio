// src/pages/StoryPage.jsx
import React, { useState, useMemo } from 'react';
import { Feather, BookOpen, Clock, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { formatDateTime } from '../utils/dateUtils';

export default function StoryPage({ stories = [], posts = [], onNavigate }) {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'story' | 'guide'
  const [selectedArticle, setSelectedArticle] = useState(null);

  // 1. Chuẩn hóa và gộp 2 nguồn bài viết
  const combinedArticles = useMemo(() => {
    const formattedStories = (stories || []).map((s) => ({
      ...s,
      type: 'story',
      typeLabel: 'Chuyện Vườn',
      createdTime: new Date(s.created_at || s.createdAt || 0).getTime()
    }));

    const formattedPosts = (posts || []).map((p) => ({
      ...p,
      type: 'guide',
      typeLabel: 'Cẩm Nang',
      createdTime: new Date(p.created_at || p.createdAt || 0).getTime()
    }));

    // Sắp xếp bài mới nhất lên đầu
    return [...formattedStories, ...formattedPosts].sort((a, b) => b.createdTime - a.createdTime);
  }, [stories, posts]);

  // 2. Lọc theo tab được chọn
  const filteredArticles = useMemo(() => {
    if (activeFilter === 'all') return combinedArticles;
    return combinedArticles.filter((item) => item.type === activeFilter);
  }, [combinedArticles, activeFilter]);

  const storiesCount = stories?.length || 0;
  const postsCount = posts?.length || 0;
  const totalCount = storiesCount + postsCount;

  // Nếu đang xem chi tiết bài viết
  if (selectedArticle) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 font-sans text-stone-800 animate-fadeIn">
        <button
          type="button"
          onClick={() => setSelectedArticle(null)}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-800 hover:text-amber-950 mb-6 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-xl transition-colors cursor-pointer border border-amber-200"
        >
          <span>← Quay lại góc Tâm Sự</span>
        </button>

        <article className="space-y-6 bg-white p-6 sm:p-10 rounded-3xl border border-stone-200/90 shadow-2xs">
          <div className="space-y-3 border-b border-stone-100 pb-5">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              selectedArticle.type === 'story'
                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
            }`}>
              {selectedArticle.type === 'story' ? <Feather className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
              <span>{selectedArticle.typeLabel}</span>
            </span>

            <h1 className="text-xl sm:text-3xl font-black text-stone-900 leading-snug">
              {selectedArticle.title}
            </h1>

            <div className="flex items-center gap-4 text-xs text-stone-500 font-mono">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>{formatDateTime(selectedArticle.created_at || selectedArticle.createdAt)}</span>
              </span>
              {selectedArticle.author && (
                <span>Tác giả: <strong>{selectedArticle.author}</strong></span>
              )}
            </div>
          </div>

          {selectedArticle.image && (
            <div className="rounded-2xl overflow-hidden max-h-[450px] border border-stone-200/90 shadow-xs">
              <img
                src={selectedArticle.image}
                alt={selectedArticle.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="text-stone-700 text-sm sm:text-base leading-relaxed space-y-4 font-normal whitespace-pre-line pt-2">
            {selectedArticle.content || selectedArticle.description}
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 font-sans text-stone-800 space-y-8 animate-fadeIn">
      {/* HEADER TRANG */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>Góc Tâm Sự Nhà Vườn</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
          Chuyện Giàn Quả & Cẩm Nang
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Nơi chia sẻ nhật ký thu hái nắng gió Ninh Thuận cùng những mẹo nhỏ bảo quản, thưởng thức trọn vẹn hương vị quê nhà.
        </p>
      </div>

      {/* BỘ LỌC 3 NÚT GỌN GÀNG */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-2 ${
            activeFilter === 'all'
              ? 'bg-amber-800 text-white shadow-sm'
              : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/90'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Tất cả ({totalCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('story')}
          className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-2 ${
            activeFilter === 'story'
              ? 'bg-amber-800 text-white shadow-sm'
              : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/90'
          }`}
        >
          <Feather className="w-4 h-4 text-amber-700" />
          <span>Chuyện Vườn ({storiesCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('guide')}
          className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-2 ${
            activeFilter === 'guide'
              ? 'bg-amber-800 text-white shadow-sm'
              : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/90'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-700" />
          <span>Cẩm Nang ({postsCount})</span>
        </button>
      </div>

      {/* DANH SÁCH BÀI VIẾT (DẠNG LƯỚI CARD) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {filteredArticles.map((article, idx) => {
          const isStory = article.type === 'story';
          return (
            <div
              key={article.id || idx}
              onClick={() => setSelectedArticle(article)}
              className="group bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
            >
              <div>
                {/* ẢNH BÀI VIẾT */}
                <div className="relative aspect-16/10 bg-stone-100 overflow-hidden">
                  <img
                    src={article.image || "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80"}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-xs flex items-center gap-1.5 ${
                    isStory 
                      ? 'bg-amber-900/80 text-amber-100' 
                      : 'bg-emerald-950/80 text-emerald-100'
                  }`}>
                    {isStory ? <Feather className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
                    <span>{article.typeLabel}</span>
                  </span>
                </div>

                {/* NỘI DUNG TÓM TẮT */}
                <div className="p-5 sm:p-6 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-stone-400 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDateTime(article.created_at || article.createdAt, 'Mới đăng')}</span>
                  </div>

                  <h3 className="font-bold text-base sm:text-lg text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-stone-600 line-clamp-3 leading-relaxed font-normal">
                    {article.excerpt || article.description || article.content}
                  </p>
                </div>
              </div>

              {/* NÚT ĐỌC TIẾP */}
              <div className="px-5 sm:px-6 pb-5 pt-2 border-t border-stone-100 flex items-center justify-between text-xs sm:text-sm font-bold text-amber-800 group-hover:text-amber-950">
                <span>Đọc bài viết</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}