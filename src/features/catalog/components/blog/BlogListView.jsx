// src/components/blog/BlogListView.jsx
import React from 'react';
import { 
  ChefHat, 
  BookOpen, 
  Sparkles, 
  Calendar, 
  Clock, 
  ArrowRight 
} from 'lucide-react';

export default function BlogListView({
  posts = [],
  categoryLabels = {},
  selectedCategory,
  onSelectCategory,
  normalizeCategory,
  formatDate,
  onSelectPost
}) {
  const featuredPost = posts[0];
  const regularPosts = posts.slice(1);

  return (
    <div className="space-y-12">
      {/* 1. HEADER CHÍNH */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-amber-500/10 via-amber-100/20 to-transparent border border-amber-200/50 p-8 sm:p-14 text-center">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-orange-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-xs text-amber-900 border border-amber-300/60 text-xs sm:text-sm font-bold shadow-2xs">
            <ChefHat className="w-4 h-4 text-amber-600" />
            <span>Góc Bếp & Mẹo Hay Xứ Nắng</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-stone-900 tracking-tight leading-tight">
            Kinh Nghiệm Thưởng Thức <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800 bg-clip-text text-transparent">
              Đặc Sản Tươi Nguyên Bản
            </span>
          </h1>

          <p className="text-sm sm:text-base text-stone-700 leading-relaxed font-normal max-w-2xl mx-auto">
            Bí quyết phân biệt nho mộc không tẩm ướp, mẹo ủ giòn táo gió và các công thức thức uống giải nhiệt mộc mạc từ vườn nhà Phan Rang.
          </p>
        </div>
      </section>

      {/* 2. THANH LỌC CHUYÊN MỤC */}
      <div className="flex items-center justify-center gap-2.5 flex-wrap">
        {Object.entries(categoryLabels).map(([key, label]) => {
          const count = key === 'all' 
            ? posts.length 
            : posts.filter(p => normalizeCategory(p.category || p.tag) === key).length;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectCategory(key)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer ${
                selectedCategory === key 
                  ? 'bg-amber-900 text-white shadow-sm' 
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 hover:border-stone-300'
              }`}
            >
              <span>{label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                selectedCategory === key ? 'bg-amber-950 text-amber-200' : 'bg-stone-100 text-stone-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. LƯỚI BÀI VIẾT HOẶC EMPTY STATE */}
      {posts.length === 0 ? (
        <div className="p-16 text-center text-stone-500 text-sm bg-white rounded-3xl border border-dashed border-stone-300 space-y-2">
          <BookOpen className="w-8 h-8 mx-auto text-stone-400 stroke-[1.5]" />
          <p>Chưa có bài viết nào thuộc chuyên mục này...</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* BÀI TIÊU ĐIỂM */}
          {featuredPost && (
            <div
              onClick={() => onSelectPost(featuredPost)}
              className="group bg-white rounded-[2rem] border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 p-6 sm:p-8 items-center"
            >
              <div className="lg:col-span-7 h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden bg-stone-100 relative shadow-inner">
                <img
                  src={featuredPost.image || featuredPost.image_url || "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1400&q=80"}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1400&q=80";
                  }}
                />
                <div className="absolute top-3.5 left-3.5 bg-amber-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Bài viết nổi bật</span>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-3 text-xs sm:text-sm text-stone-500">
                  <span className="font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md uppercase text-xs">
                    {categoryLabels[normalizeCategory(featuredPost.category || featuredPost.tag)] || 'Cẩm nang'}
                  </span>
                  {(featuredPost.created_at || featuredPost.date) && (
                    <span className="flex items-center gap-1.5 font-medium text-stone-600">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <span>{formatDate(featuredPost.created_at || featuredPost.date)}</span>
                    </span>
                  )}
                  {(featuredPost.read_time || featuredPost.readTime) && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-stone-400" />
                      <span>{featuredPost.read_time || featuredPost.readTime}</span>
                    </span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-stone-900 leading-snug group-hover:text-amber-800 transition-colors">
                  {featuredPost.title}
                </h2>

                <p className="text-sm sm:text-base text-stone-600 line-clamp-3 leading-relaxed font-normal">
                  {featuredPost.excerpt || featuredPost.summary || featuredPost.desc || featuredPost.content}
                </p>

                <div className="pt-2 flex items-center gap-2 text-sm font-bold text-amber-800 group-hover:translate-x-1 transition-transform">
                  <span>Đọc bài viết tiêu điểm</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          )}

          {/* CÁC BÀI VIẾT THƯỜNG */}
          {regularPosts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => onSelectPost(post)}
                  className="bg-white rounded-[2rem] border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-amber-300 transition-all duration-300 cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative aspect-16/10 overflow-hidden bg-stone-100">
                      <img 
                        src={post.image || post.image_url || "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1400&q=80"} 
                        alt={post.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1400&q=80";
                        }}
                      />
                      <span className="absolute bottom-3 left-3 bg-stone-900/85 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                        {categoryLabels[normalizeCategory(post.category || post.tag)] || 'Cẩm nang'}
                      </span>
                    </div>

                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-3 text-xs sm:text-sm text-stone-500">
                        {(post.created_at || post.date) && (
                          <span className="flex items-center gap-1.5 font-medium text-stone-600">
                            <Calendar className="w-4 h-4 text-amber-600" />
                            <span>{formatDate(post.created_at || post.date)}</span>
                          </span>
                        )}
                        {(post.read_time || post.readTime) && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-stone-400" />
                            <span>{post.read_time || post.readTime}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-stone-900 text-base sm:text-lg line-clamp-2 leading-snug group-hover:text-amber-800 transition-colors">
                        {post.title}
                      </h3>

                      <p className="text-sm text-stone-600 line-clamp-2 leading-relaxed font-normal">
                        {post.excerpt || post.summary || post.desc || post.content}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 flex items-center justify-between text-sm border-t border-stone-50">
                    <span className="font-bold text-amber-800 flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                      Đọc tiếp <ArrowRight className="w-4 h-4" />
                    </span>
                    <span className="text-xs text-stone-500 font-mono">
                      {post.author || 'Tâm Xứ Nắng'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}