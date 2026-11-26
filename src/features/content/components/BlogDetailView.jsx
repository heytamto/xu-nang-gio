// src/components/blog/BlogDetailView.jsx
import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Share2, 
  Check, 
  Calendar, 
  Clock, 
  HeartHandshake 
} from 'lucide-react';

export default function BlogDetailView({ 
  post, 
  categoryLabel, 
  formatDate, 
  onBack 
}) {
  const [isCopied, setIsCopied] = useState(false);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <article className="w-full space-y-8 sm:space-y-10 animate-fadeIn">
      {/* THANH ĐIỀU HƯỚNG QUAY LẠI & CHIA SẺ */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-200/90 w-full">
        <button
          type="button"
          onClick={onBack}
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
            {categoryLabel}
          </span>

          {(post.created_at || post.date) && (
            <span className="flex items-center gap-1.5 text-stone-600 font-medium">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>{formatDate(post.created_at || post.date)}</span>
            </span>
          )}

          {(post.read_time || post.readTime) && (
            <span className="flex items-center gap-1.5 text-stone-600 font-medium">
              <Clock className="w-4 h-4 text-stone-400" />
              <span>{post.read_time || post.readTime}</span>
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 leading-tight tracking-tight">
          {post.title}
        </h1>

        <div className="flex items-center gap-3.5 pt-2">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-lg border border-amber-200 shadow-2xs">
            {post.author ? post.author.charAt(0) : 'T'}
          </div>
          <div className="text-sm">
            <span className="font-bold text-stone-900 block text-base">{post.author || 'Tâm (Vườn Xứ Nắng Gió)'}</span>
            <span className="text-stone-500 font-normal">Người kể chuyện vườn Phan Rang</span>
          </div>
        </div>
      </div>

      {/* ẢNH BÌA BÀI VIẾT */}
      <div className="relative aspect-16/9 sm:aspect-21/9 w-full rounded-3xl overflow-hidden bg-stone-100 border border-stone-200 shadow-sm">
        <img
          src={post.image || post.image_url || "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1400&q=80"}
          alt={post.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1400&q=80";
          }}
        />
      </div>

      {/* TRÍCH DẪN NGẮN (EXCERPT) */}
      {(post.excerpt || post.summary || post.desc) && (
        <div className="p-6 sm:p-8 rounded-3xl bg-amber-50/80 border-l-4 border-amber-600 text-stone-900 font-medium text-lg sm:text-xl leading-relaxed italic shadow-2xs">
          "{post.excerpt || post.summary || post.desc}"
        </div>
      )}

      {/* NỘI DUNG CHI TIẾT */}
      <div className="text-base sm:text-lg text-stone-800 leading-relaxed font-normal whitespace-pre-line space-y-6 pt-2">
        {post.content || post.excerpt || post.summary}
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
  );
}