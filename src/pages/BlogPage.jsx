// src/pages/BlogPage.jsx
import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  ArrowRight, 
  BookOpen, 
  Calendar, 
  Sparkles, 
  ArrowLeft, 
  Share2, 
  Check, 
  ChefHat, 
  HeartHandshake 
} from 'lucide-react';

// ĐỒNG BỘ CHUẨN SLUG TIẾNG ANH TỪ DATABASE SUPABASE & PostsTab
const CATEGORY_LABELS = {
  'all': 'Tất cả bài viết',
  'handbook': 'Cẩm nang chọn quả',
  'health': 'Dinh dưỡng & Sức khỏe',
  'cuisine': 'Góc bếp & Món ngon',
  'tips': 'Mẹo vặt bảo quản'
};

function formatDate(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) {
    return String(dateVal).split('T')[0];
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function BlogPage({ posts = [] }) {
  const [activePost, setActivePost] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCopied, setIsCopied] = useState(false);

  const rawPostList = Array.isArray(posts) ? posts : [];

  // Chuẩn hóa slug cũ (nếu có bài cũ) về slug tiếng Anh
  const normalizeCategory = (cat) => {
    const map = {
      'cam-nang': 'handbook',
      'suc-khoe': 'health',
      'mon-ngon': 'cuisine',
      'meo-vat': 'tips'
    };
    return map[cat] || cat;
  };

  const filteredPosts = useMemo(() => {
    if (selectedCategory === 'all') return rawPostList;
    return rawPostList.filter(p => normalizeCategory(p.category || p.tag) === selectedCategory);
  }, [rawPostList, selectedCategory]);

  const featuredPost = filteredPosts[0];
  const regularPosts = filteredPosts.slice(1);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 animate-fadeIn font-sans selection:bg-amber-100 selection:text-amber-900 text-stone-800">
      
      {/* ================= 1. HEADER CHÍNH ================= */}
      {!activePost && (
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
      )}

      {/* ================= 2. GIAO DIỆN XEM CHI TIẾT BÀI VIẾT ================= */}
      {activePost ? (
        <article className="w-full space-y-8 sm:space-y-10 animate-fadeIn">
          
          {/* THANH ĐIỀU HƯỚNG QUAY LẠI & CHIA SẺ */}
          <div className="flex items-center justify-between pb-4 border-b border-stone-200/90 w-full">
            <button
              type="button"
              onClick={() => {
                setActivePost(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group inline-flex items-center gap-2.5 text-sm sm:text-base font-bold text-stone-700 hover:text-amber-800 transition-colors cursor-pointer"
            >
              <div className="p-2 sm:p-2.5 rounded-2xl bg-white border border-stone-200/80 group-hover:bg-amber-100 group-hover:border-amber-300 transition-all shadow-2xs">
                <ArrowLeft className="w-5 h-5 text-stone-700 group-hover:text-amber-800" />
              </div>
              <span>Quay lại tất cả bài viết</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
              title="Sao chép liên kết bài viết"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-stone-600" />}
              <span>{isCopied ? 'Đã chép link' : 'Chia sẻ bài viết'}</span>
            </button>
          </div>

          {/* TIÊU ĐỀ & METADATA */}
          <div className="space-y-4 w-full">
            <div className="flex flex-wrap items-center gap-3.5 text-xs sm:text-sm">
              <span className="font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-3.5 py-1 rounded-full uppercase text-xs tracking-wider">
                {CATEGORY_LABELS[normalizeCategory(activePost.category || activePost.tag)] || activePost.category || 'Cẩm nang'}
              </span>

              {(activePost.created_at || activePost.date) && (
                <span className="flex items-center gap-1.5 text-stone-600 font-medium">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>{formatDate(activePost.created_at || activePost.date)}</span>
                </span>
              )}

              {(activePost.read_time || activePost.readTime) && (
                <span className="flex items-center gap-1.5 text-stone-600 font-medium">
                  <Clock className="w-4 h-4 text-stone-400" />
                  <span>{activePost.read_time || activePost.readTime}</span>
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 leading-tight tracking-tight">
              {activePost.title}
            </h1>

            <div className="flex items-center gap-3.5 pt-2">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-lg border border-amber-200 shadow-2xs">
                {activePost.author ? activePost.author.charAt(0) : 'T'}
              </div>
              <div className="text-sm">
                <span className="font-bold text-stone-900 block text-base">{activePost.author || 'Tâm (Vườn Xứ Nắng Gió)'}</span>
                <span className="text-stone-500 font-normal">Người kể chuyện vườn Phan Rang</span>
              </div>
            </div>
          </div>

          {/* ẢNH BÌA BÀI VIẾT */}
          <div className="relative aspect-16/9 sm:aspect-21/9 w-full rounded-3xl overflow-hidden bg-stone-100 border border-stone-200 shadow-sm">
            <img
              src={activePost.image || activePost.image_url || "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1400&q=80"}
              alt={activePost.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1400&q=80";
              }}
            />
          </div>

          {/* TRÍCH DẪN NGẮN (EXCERPT) */}
          {(activePost.excerpt || activePost.summary || activePost.desc) && (
            <div className="p-6 sm:p-8 rounded-3xl bg-amber-50/80 border-l-4 border-amber-600 text-stone-900 font-medium text-lg sm:text-xl leading-relaxed italic shadow-2xs">
              "{activePost.excerpt || activePost.summary || activePost.desc}"
            </div>
          )}

          {/* NỘI DUNG CHI TIẾT */}
          <div className="text-base sm:text-lg text-stone-800 leading-relaxed font-normal whitespace-pre-line space-y-6 pt-2">
            {activePost.content || activePost.excerpt || activePost.summary}
          </div>

          {/* BANNER HỖ TRỢ CHÂN TRANG */}
          <div className="mt-14 p-7 sm:p-9 rounded-[2rem] bg-stone-900 text-white flex flex-col sm:flex-row items-center gap-5 shadow-xl border border-stone-800 w-full">
            <div className="w-14 h-14 rounded-2xl bg-amber-600/30 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 text-center sm:text-left flex-1">
              <h4 className="font-bold text-lg sm:text-xl text-white">Bạn cần tư vấn thêm về cách chọn và bảo quản?</h4>
              <p className="text-sm sm:text-base text-stone-300 font-normal leading-relaxed">
                Đừng ngại nhắn cho vườn qua Hotline hoặc Zalo nếu hoa quả nhận về gặp bất kỳ sự cố dập nát nào trong quá trình chuyển xe nhé.
              </p>
            </div>
          </div>

        </article>
      ) : (
        /* ================= 3. DANH SÁCH BÀI VIẾT ================= */
        <div className="space-y-10">
          
          {/* Thanh Filter chuyên mục */}
          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
              const count = key === 'all' 
                ? rawPostList.length 
                : rawPostList.filter(p => normalizeCategory(p.category || p.tag) === key).length;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedCategory(key)}
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

          {filteredPosts.length === 0 ? (
            <div className="p-16 text-center text-stone-500 text-sm bg-white rounded-3xl border border-dashed border-stone-300 space-y-2">
              <BookOpen className="w-8 h-8 mx-auto text-stone-400 stroke-[1.5]" />
              <p>Chưa có bài viết nào thuộc chuyên mục này...</p>
            </div>
          ) : (
            <div className="space-y-10">
              
              {/* BÀI VIẾT TIÊU ĐIỂM */}
              {featuredPost && (
                <div
                  onClick={() => {
                    setActivePost(featuredPost);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
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
                        {CATEGORY_LABELS[normalizeCategory(featuredPost.category || featuredPost.tag)] || 'Cẩm nang'}
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

              {/* LƯỚI BÀI VIẾT THƯỜNG */}
              {regularPosts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularPosts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => {
                        setActivePost(post);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
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
                            {CATEGORY_LABELS[normalizeCategory(post.category || post.tag)] || 'Cẩm nang'}
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
      )}

    </div>
  );
}