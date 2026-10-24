// src/pages/StoryPage.jsx
import React from 'react';
import { 
  Sun, 
  Flame, 
  Clock, 
  Heart, 
  ArrowRight, 
  Sprout, 
  Calendar, 
  MapPin, 
  Sparkles,
  Compass,
  CheckCircle2
} from 'lucide-react';

// Format ngày từ ISO timestamp của Supabase (hoặc định dạng dd/MM/yyyy)
function formatStoryDate(dateVal) {
  if (!dateVal) return 'Mùa vụ gần đây';
  const str = String(dateVal).trim();
  
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) return str;

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return str;
}

export default function StoryPage({ stories = [], onNavigate }) {
  const handleGoToShop = () => {
    if (onNavigate) {
      onNavigate('shop');
    }
  };

  // Đảm bảo stories sắp xếp chuẩn theo "order" hoặc ngày tạo
  const sortedStories = Array.isArray(stories) 
    ? [...stories].sort((a, b) => (Number(a.order ?? 0) - Number(b.order ?? 0)))
    : [];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16 animate-fadeIn font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* ================= 1. HERO BANNER: TINH THẦN ĐẤT NẮNG ================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-amber-500/10 via-amber-100/20 to-transparent border border-amber-200/50 p-8 sm:p-14 text-center">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-orange-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-xs text-amber-900 border border-amber-300/60 text-xs sm:text-sm font-bold shadow-2xs tracking-wide">
            <Sprout className="w-4 h-4 text-amber-600" />
            <span>Ký Sự Người Làm Vườn Xứ Nắng</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-stone-900 tracking-tight leading-[1.15]">
            Mồ Hôi Đổ Xuống Đất Nung, <br />
            <span className="bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800 bg-clip-text text-transparent">
              Vị Ngọt Kết Tinh Từ Nắng Gió
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-stone-700 leading-relaxed font-normal max-w-2xl mx-auto pt-2">
            Ninh Thuận — nơi quanh năm chỉ có hai mùa: <strong className="font-bold text-stone-900">mùa nắng</strong> và <strong className="font-bold text-stone-900">mùa rất nắng</strong>. Nhưng cũng chính cái nắng rát da cùng gió biển hào sảng ấy đã chắt lọc mật ngọt cho từng chùm nho đỏ mọng, từng trái táo giòn ngọt đậm sâu.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs sm:text-sm font-semibold text-stone-600">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Thu hái mộc tại giàn
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Phơi nắng & sấy lạnh tự nhiên
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Không hóa chất bảo quản
            </span>
          </div>
        </div>
      </section>

      {/* ================= 2. BA NGUYÊN BẢN CỦA NÔNG SẢN XỨ NẮNG ================= */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Ba Thước Đo Cho Từng Mẻ Quà Quê
          </h2>
          <p className="text-sm sm:text-base text-stone-500 font-normal">
            Tỉ mỉ từ lúc cắt cành, chọn trái đến khi đóng gói gửi đi khắp mọi miền
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group bg-white p-7 rounded-3xl border border-stone-200/90 shadow-xs hover:border-amber-400 hover:shadow-xl transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/80 group-hover:scale-110 transition-transform">
              <Sun className="w-6 h-6 text-amber-600" />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-mono font-bold text-amber-700 uppercase tracking-widest">Gốc Vườn 01</span>
              <h3 className="font-black text-stone-900 text-lg sm:text-xl">Hái Sớm Khi Sương Chưa Tan</h3>
            </div>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
              Táo gió và nho tươi chỉ được cắt cành từ 5h30 đến 7h sáng khi vỏ trái còn mát lạnh và giữ trọn lớp phấn tự nhiên. Tuyệt đối không hái giữa nắng trưa làm héo cuống hay nẫu ruột.
            </p>
          </div>

          <div className="group bg-white p-7 rounded-3xl border border-stone-200/90 shadow-xs hover:border-orange-400 hover:shadow-xl transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-700 flex items-center justify-center border border-orange-200/80 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-mono font-bold text-orange-700 uppercase tracking-widest">Gốc Vườn 02</span>
              <h3 className="font-black text-stone-900 text-lg sm:text-xl">Sấy Lạnh Thong Thả 28 Tiếng</h3>
            </div>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
              Táo sấy dẻo không dùng lò nhiệt cao gấp gáp. Chúng mình thái lát mộc, sấy tuần hoàn 45°C ròng rã hơn một ngày một đêm để đường tự nhiên cô đọng lại, dẻo dai và thơm thoang thoảng mùi tắc tươi.
            </p>
          </div>

          <div className="group bg-white p-7 rounded-3xl border border-stone-200/90 shadow-xs hover:border-rose-400 hover:shadow-xl transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200/80 group-hover:scale-110 transition-transform">
              <Flame className="w-6 h-6 text-rose-600" />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-mono font-bold text-rose-700 uppercase tracking-widest">Gốc Vườn 03</span>
              <h3 className="font-black text-stone-900 text-lg sm:text-xl">Ủ Chum Sành Đất Nung 365 Ngày</h3>
            </div>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
              Nho đỏ chín tới được ủ men tự nhiên trong chum sành mộc mạc suốt một năm. Men đất nung thở nhịp nhàng giúp mật nho lên sắc hổ phách sóng sánh, vị đậm êm, không gây đau đầu hay khé cổ.
            </p>
          </div>
        </div>
      </section>

      {/* ================= 3. DÒNG THỜI GIAN NHẬT KÝ VƯỜN ================= */}
      <section className="space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-stone-200 pb-4 gap-2">
          <div>
            <div className="flex items-center gap-2 text-amber-700 text-xs sm:text-sm font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Chuyện Người - Chuyện Nghề</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-stone-900 tracking-tight mt-1">
              Nhật Ký Mùa Vụ & Đời Sống Giàn Vườn
            </h2>
          </div>
          <span className="text-xs sm:text-sm text-stone-500 font-mono font-medium">
            {sortedStories.length} câu chuyện được lưu lại
          </span>
        </div>

        {sortedStories.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-stone-300 p-12 text-center text-stone-500 text-sm space-y-2">
            <Compass className="w-8 h-8 mx-auto text-stone-400 stroke-[1.5]" />
            <p>Các mẩu chuyện về giàn nho đang được người làm vườn chép lại...</p>
          </div>
        ) : (
          <div className="space-y-10">
            {sortedStories.map((storyItem, index) => {
              const displayDate = formatStoryDate(storyItem.created_at || storyItem.date);
              const displayContent = storyItem.content || storyItem.story || '';
              const isEven = index % 2 === 0;

              return (
                <article
                  key={storyItem.id || index}
                  className="bg-white rounded-3xl border border-stone-200/90 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 p-6 sm:p-8 items-center group"
                >
                  {/* CỘT ẢNH: KHÓA CHIỀU CAO ĐỒNG NHẤT */}
                  <div className={`lg:col-span-5 h-72 sm:h-80 lg:h-96 w-full rounded-2xl overflow-hidden relative shadow-inner bg-stone-100 shrink-0 ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                    <img
                      src={storyItem.image || storyItem.image_url || "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1400&q=80"}
                      alt={storyItem.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1400&q=80";
                      }}
                    />
                    
                    {storyItem.season && (
                      <span className="absolute top-3.5 left-3.5 bg-stone-900/85 backdrop-blur-md text-amber-300 font-bold text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider border border-white/10 shadow-sm">
                        {storyItem.season}
                      </span>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* CỘT NỘI DUNG: CHỮ TO RÕ, ĐỘ DÀI VỪA VẶN */}
                  <div className={`lg:col-span-7 space-y-4 flex flex-col justify-center ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-stone-500">
                      <span className="flex items-center gap-1.5 font-bold text-stone-700 bg-stone-100 px-3 py-1.5 rounded-xl">
                        <Calendar className="w-4 h-4 text-amber-600" />
                        <span>{displayDate}</span>
                      </span>
                      
                      <span className="flex items-center gap-1.5 font-medium text-stone-600">
                        <MapPin className="w-4 h-4 text-stone-400" />
                        <span>{storyItem.location || 'Phan Rang - Ninh Thuận'}</span>
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-stone-900 leading-snug group-hover:text-amber-800 transition-colors">
                      {storyItem.title}
                    </h3>

                    {displayContent && (
                      <p className="text-sm sm:text-base text-stone-700 leading-relaxed font-normal whitespace-pre-line line-clamp-5 sm:line-clamp-6">
                        {displayContent}
                      </p>
                    )}

                    <div className="pt-3 flex items-center justify-between border-t border-stone-100">
                      <span className="text-xs sm:text-sm font-bold text-amber-900 font-mono">
                        — {storyItem.author || 'Tâm Xứ Nắng Gió'}
                      </span>

                      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-500">
                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                        <span>Chân thật từ vườn</span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ================= 4. KHỐI TÂM TÌNH VƯỜN NHÀ ================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950 text-white rounded-3xl p-8 sm:p-14 shadow-2xl border border-stone-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-800 text-amber-400 text-xs sm:text-sm font-bold border border-amber-500/30">
            <Heart className="w-4 h-4 text-red-400 fill-red-400" />
            <span>Gửi Gắm Chân Tình</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-snug">
            "Không Làm Hàng Công Nghiệp, <br />
            Chỉ Gửi Đi Thức Quà Thật Của Mảnh Đất Quê."
          </h2>

          <p className="text-sm sm:text-base lg:text-lg text-stone-200 leading-relaxed font-normal">
            Mỗi hũ táo sấy dẻo, mỗi chùm nho tươi hay chai mật nho gửi tới tay bạn và gia đình đều mang theo vị mặn mòi của gió biển, cái gắt nồng của nắng khô và sự chân chất của những người cả đời gắn bó với đất đai Ninh Thuận. Cảm ơn bạn đã đồng hành và san sẻ cùng nông sản quê hương.
          </p>

          {onNavigate && (
            <div className="pt-3">
              <button
                type="button"
                onClick={handleGoToShop}
                className="group px-7 py-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-sm sm:text-base font-bold rounded-2xl flex items-center gap-2.5 transition-all shadow-lg shadow-amber-950/40 active:scale-95 cursor-pointer"
              >
                <span>Ghé Xem Đặc Sản Tươi Vừa Thu Hái</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}