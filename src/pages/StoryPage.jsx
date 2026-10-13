import React from 'react';
import { Sun, Flame, Clock, Heart, ArrowRight, Sprout } from 'lucide-react';

export default function StoryPage({ onNavigate }) {
  const handleGoToShop = () => {
    if (onNavigate) {
      onNavigate('shop');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:py-16 space-y-14 overflow-hidden">
      {/* Tiêu đề trang & Badge tinh tế */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-800 border border-amber-600/20 text-xs font-semibold tracking-wide">
          <Sprout className="w-3.5 h-3.5 text-amber-600" />
          <span>Chuyện Người Làm Vườn</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 tracking-tight leading-tight">
          Hương Vị Thủ Công <br className="hidden sm:inline" />
          Từ Nắng Gió Phan Rang
        </h1>

        <p className="text-xs sm:text-sm text-stone-500 leading-relaxed font-normal">
          Ninh Thuận khô cằn với nắng gắt và gió lộng, nhưng chính điều kiện khắc nghiệt đó đã kết tinh nên những quả táo giòn ngọt đậm đà và những giàn nho mọng nước không nơi nào có được.
        </p>
      </div>

      {/* 3 Trụ cột quy trình chế biến */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-stone-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
            <Sun className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="font-bold text-stone-900 text-base">Táo Tươi Hái Mỗi Sáng</h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            Từng quả táo được bọc túi sinh học tại vườn để ngừa sâu hại tự nhiên. Khi đạt độ giòn ngọt mọng nước nhất, táo được thu hái thủ công từ sớm tinh mơ.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-stone-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3.5">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-700 flex items-center justify-center border border-orange-100">
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="font-bold text-stone-900 text-base">Sấy Lạnh Giữ Vị 28 Tiếng</h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            Táo sau khi thái lát được tẩm ướp cùng lát tắc tươi hoặc muối ớt, sấy nhiệt độ thấp 45°C để giữ trọn vitamin C, vị dẻo mềm óng ả tự nhiên.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-stone-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100">
            <Flame className="w-5 h-5 text-rose-600" />
          </div>
          <h3 className="font-bold text-stone-900 text-base">Ủ Rượu Chum Sành 365 Ngày</h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            Rượu nho Phan Rang được lên men tự nhiên với đường phèn trong chum sành đất nung hơn 1 năm ròng, cho ra nước rượu màu hổ phách sánh mịn, êm dịu, không gắt.
          </p>
        </div>
      </div>

      {/* Khối tâm tình vườn nhà */}
      <div className="bg-stone-900 text-white rounded-3xl p-8 sm:p-10 space-y-6 shadow-xl relative overflow-hidden">
        <div className="space-y-3 relative z-10 max-w-3xl">
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-400 fill-red-400" />
            <span>Tâm Tình Vườn Nhà</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-light">
            "Chúng mình không làm hàng công nghiệp số lượng lớn. Mỗi hũ táo sấy dẻo, mỗi chùm nho tươi hay chai rượu nho gửi tới tay bạn đều là thành quả lao động mộc mạc của gia đình. Hy vọng bạn và người thân sẽ cảm nhận trọn vẹn sự chân thành và nắng gió Ninh Thuận trong từng thức quà."
          </p>
        </div>

        {onNavigate && (
          <div className="pt-2 relative z-10">
            <button
              type="button"
              onClick={handleGoToShop}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-2xl flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <span>Ghé Xem Đặc Sản Vườn Hôm Nay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
