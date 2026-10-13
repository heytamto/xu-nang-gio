import React, { useState } from 'react';
import { Clock, ArrowRight, BookOpen } from 'lucide-react';
import { POSTS as DEFAULT_POSTS } from '../data/posts';

export default function BlogPage({ posts = [] }) {
  const [activePost, setActivePost] = useState(null);

  const postList = Array.isArray(posts) && posts.length > 0 ? posts : (DEFAULT_POSTS || []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:py-16 space-y-12 overflow-hidden">
      {/* Tiêu đề trang & Badge chuẩn phong cách */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-800 border border-amber-600/20 text-xs font-semibold tracking-wide">
          <BookOpen className="w-3.5 h-3.5 text-amber-600" />
          <span>Góc Chia Sẻ & Cẩm Nang</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 tracking-tight leading-tight">
          Cẩm Nang Vườn & Góc Bếp
        </h1>

        <p className="text-xs sm:text-sm text-stone-500 leading-relaxed font-normal">
          Kinh nghiệm bảo quản hoa quả tươi và các công thức thưởng thức đặc sản đúng điệu từ vườn nhà.
        </p>
      </div>

      {activePost ? (
        /* Chi tiết bài viết khi bấm xem */
        <article className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-sm space-y-6">
          <button
            type="button"
            onClick={() => {
              setActivePost(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 transition-colors"
          >
            ← Quay lại danh sách bài viết
          </button>

          <div className="relative aspect-video rounded-2xl overflow-hidden bg-stone-100">
            <img
              src={activePost.image}
              alt={activePost.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1400&q=80";
              }}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-lg">
                {activePost.tag}
              </span>
              {activePost.readTime && (
                <span className="text-[11px] text-stone-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {activePost.readTime}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 leading-snug">
              {activePost.title}
            </h2>
          </div>

          <div className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line space-y-4 pt-2 border-t border-stone-100">
            {activePost.content || activePost.summary}
          </div>
        </article>
      ) : (
        /* Danh sách lưới các bài viết */
        postList.length === 0 ? (
          <div className="p-12 text-center text-stone-400 text-xs bg-white rounded-3xl border border-stone-200">
            Đang cập nhật các bài viết cẩm nang mới...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {postList.map((post) => (
              <div
                key={post.id}
                onClick={() => {
                  setActivePost(post);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
                    <img 
                      src={post.image} 
                      alt={post.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1400&q=80";
                      }}
                    />
                  </div>
                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-stone-400">
                      <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                        {post.tag}
                      </span>
                      {post.readTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {post.readTime}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-stone-800 text-sm line-clamp-2 leading-snug group-hover:text-amber-700 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                      {post.summary}
                    </p>
                  </div>
                </div>
                <div className="p-5 pt-0">
                  <span className="text-xs font-bold text-amber-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Đọc tiếp <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
