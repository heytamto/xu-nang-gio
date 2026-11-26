// src/pages/PolicyPage.jsx
import React from 'react';
import { 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Clock, 
  ArrowLeft, 
  PhoneCall, 
  Sparkles, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Video,
  SunMedium,
  HeartHandshake
} from 'lucide-react';

export default function PolicyPage({ onNavigateHome, onNavigateShop, onNavigate }) {
  const goHome = () => {
    if (onNavigateHome) onNavigateHome();
    else if (onNavigate) onNavigate('home');
  };

  const goShop = () => {
    if (onNavigateShop) onNavigateShop();
    else if (onNavigate) onNavigate('shop');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 animate-fadeIn font-sans text-stone-800">
      
      {/* 1. THANH ĐIỀU HƯỚNG TINH GỌN */}
      <div className="flex items-center justify-between w-full">
        <button
          type="button"
          onClick={goHome}
          className="group inline-flex items-center gap-2 text-sm font-bold text-stone-700 hover:text-amber-950 bg-white border border-stone-200/90 hover:border-amber-400 px-4 py-2.5 rounded-2xl transition-all shadow-2xs cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-amber-700" />
          <span>Về trang chủ</span>
        </button>

        <button
          type="button"
          onClick={goShop}
          className="inline-flex items-center gap-2 text-sm font-bold text-white bg-amber-900 hover:bg-amber-950 px-5 py-2.5 rounded-2xl transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Ghé chợ nông sản</span>
        </button>
      </div>

      {/* 2. BANNER HERO HIỆN ĐẠI */}
      <div className="relative rounded-[2rem] bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950 text-white p-7 sm:p-12 lg:p-14 overflow-hidden border border-stone-800/80 shadow-xl w-full">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs sm:text-sm font-mono font-bold tracking-wide">
            <SunMedium className="w-4 h-4" />
            <span>MINH BẠCH • TẬN TÂM • UY TÍN NHÀ VƯỜN</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
            Chính Sách Bán Hàng & Quyền Lợi Khách Thương
          </h1>

          <p className="text-base sm:text-lg text-stone-200 font-normal leading-relaxed max-w-4xl">
            Nông sản tươi cắt giàn vận chuyển đường dài cần sự thấu hiểu từ hai phía. Dưới đây là những cam kết chất lượng cùng các điều khoản bảo vệ trọn vẹn quyền lợi và sự an tâm của bạn.
          </p>
        </div>

        {/* 4 Chỉ số tóm tắt */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 pt-8 mt-8 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <span className="text-stone-400 block text-xs uppercase font-bold tracking-wider mb-1">Cam kết</span>
            <strong className="text-amber-300 text-base sm:text-lg font-black">Bao ăn từng quả</strong>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <span className="text-stone-400 block text-xs uppercase font-bold tracking-wider mb-1">Xác nhận đơn</span>
            <strong className="text-white text-base sm:text-lg font-black">Cọc trước 50.000đ</strong>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <span className="text-stone-400 block text-xs uppercase font-bold tracking-wider mb-1">Hỗ trợ sự cố</span>
            <strong className="text-emerald-400 text-base sm:text-lg font-black">Bù hàng trong 24h</strong>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <span className="text-stone-400 block text-xs uppercase font-bold tracking-wider mb-1">Đổi ý hủy đơn</span>
            <strong className="text-white text-base sm:text-lg font-black">Miễn phí 30 phút</strong>
          </div>
        </div>
      </div>

      {/* 3. NỘI DUNG CHÍNH DẠNG CARD CHUYÊN NGHIỆP */}
      <div className="space-y-8">

        {/* PHẦN 1: ĐẶT CỌC & THANH TOÁN */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-2xs space-y-6">
          <div className="flex items-center gap-3.5 border-b border-stone-100 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-stone-900">1. Quy Trình Đặt Cọc & Thanh Toán</h2>
              <p className="text-sm text-stone-500 font-normal mt-0.5">Giữ trái chín đúng hẹn, tránh lãng phí công sức nông dân cắt giàn</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-100 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-amber-200/70 text-amber-900 flex items-center justify-center font-bold font-mono text-sm">1</div>
              <strong className="text-stone-900 block text-base font-bold">Đặt cọc 50.000đ</strong>
              <p className="text-stone-600 leading-relaxed font-normal text-sm">Áp dụng cho mọi đơn giao xe khách hoặc ship xa để hệ thống xuất lệnh cắt cành.</p>
            </div>

            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-100 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold font-mono text-sm">2</div>
              <strong className="text-stone-900 block text-base font-bold">Chuyển khoản 100%</strong>
              <p className="text-stone-600 leading-relaxed font-normal text-sm">Được hưởng trọn vẹn quà tặng biếu kèm độc quyền từ nông trại Xứ Nắng Gió.</p>
            </div>

            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-100 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-stone-200 text-stone-800 flex items-center justify-center font-bold font-mono text-sm">3</div>
              <strong className="text-stone-900 block text-base font-bold">Thu hộ COD còn lại</strong>
              <p className="text-stone-600 leading-relaxed font-normal text-sm">Khoản chênh lệch còn lại thanh toán trực tiếp khi nhận hàng từ nhà xe.</p>
            </div>
          </div>
        </section>

        {/* PHẦN 2: VẬN CHUYỂN XE KHÁCH */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-2xs space-y-6">
          <div className="flex items-center gap-3.5 border-b border-stone-100 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 shadow-inner">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-stone-900">2. Tuyến Vận Chuyển & Đóng Thùng Chuyên Dụng</h2>
              <p className="text-sm text-stone-500 font-normal mt-0.5">Hành trình hái sớm tinh mơ, chuyển xe đêm đến bến sáng hôm sau</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#faf8f5] border border-stone-200/70 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">Thời gian giao nhận</span>
              <p className="text-stone-700 leading-relaxed font-normal text-sm sm:text-base">
                Trái cây được cắt lúc <strong>05:30 sáng</strong>, đóng thùng xốp chèn lưới xốp & túi đá gel làm mát, chuyển lên xe khách chạy xuyên đêm để đến TP.HCM và các tỉnh lân cận vào đầu giờ sáng.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#faf8f5] border border-stone-200/70 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">Kiểm tra kiện hàng</span>
              <p className="text-stone-700 leading-relaxed font-normal text-sm sm:text-base">
                Khi nhận từ phụ xe, khách kiểm tra <strong>băng keo niêm phong và mã vận đơn</strong>. Nếu phát hiện thùng xốp móp méo nặng hoặc bể góc, vui lòng chụp ảnh phản hồi ngay cho nhà vườn.
              </p>
            </div>
          </div>
        </section>

        {/* PHẦN 3: "BAO ĂN" VÀ ĐỔI TRẢ */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-2xs space-y-6">
          <div className="flex items-center gap-3.5 border-b border-stone-100 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 shadow-inner">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-stone-900">3. Chính Sách "Bao Ăn" & Điều Kiện Đổi Trả</h2>
              <p className="text-sm text-stone-500 font-normal mt-0.5">Bao ăn từng quả — Lỗi do nhà vườn hoặc vận chuyển được bù hàng 100%</p>
            </div>
          </div>

          {/* Hộp lưu ý Video khui hộp */}
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-300 flex items-start gap-3.5">
            <Video className="w-6 h-6 text-amber-800 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-amber-950 font-bold block text-sm sm:text-base">Điều kiện tiên quyết: Video mở thùng xốp liền mạch</strong>
              <p className="text-amber-900 font-normal leading-relaxed text-sm sm:text-base">
                Vì nông sản tươi rất nhạy cảm với nhiệt độ sau khi rời thùng xốp, quý khách vui lòng <strong>quay video liền mạch lúc khui hàng</strong> (thấy rõ tem mã đơn dán ngoài thùng) và gửi khiếu nại trong vòng <strong>24 giờ</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cột được hỗ trợ */}
            <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 space-y-3.5">
              <div className="flex items-center gap-2 text-emerald-900 font-black text-sm uppercase tracking-wider">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Trường hợp được bù hàng / hoàn tiền</span>
              </div>
              <ul className="space-y-2.5 text-stone-700 font-normal text-sm sm:text-base pl-2">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold text-lg leading-none">•</span>
                  <span>Trái cây dập nát, rụng cuống quá 20% do nhà xe chèn ép hàng nặng.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold text-lg leading-none">•</span>
                  <span>Giao nhầm set cân nặng, thiếu quà tặng đính kèm trong đơn.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold text-lg leading-none">•</span>
                  <span>Chất lượng quả bị chua gắt, sượng đắng do lỗi thu hái của vườn.</span>
                </li>
              </ul>
            </div>

            {/* Cột từ chối hỗ trợ */}
            <div className="p-6 rounded-2xl bg-rose-50/70 border border-rose-200/90 space-y-3.5">
              <div className="flex items-center gap-2 text-rose-900 font-black text-sm uppercase tracking-wider">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Trường hợp không áp dụng đổi trả</span>
              </div>
              <ul className="space-y-2.5 text-stone-700 font-normal text-sm sm:text-base pl-2">
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 font-bold text-lg leading-none">•</span>
                  <span>Khiếu nại sau 24 giờ kể từ khi nhà xe gọi nhận hàng.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 font-bold text-lg leading-none">•</span>
                  <span>Không cung cấp video khui thùng làm bằng chứng đối soát với nhà xe.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 font-bold text-lg leading-none">•</span>
                  <span>Bảo quản sai cách (để nguyên bọc nilon kín ở nơi nắng gắt, hầm hơi).</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* PHẦN 4: MIỄN TRỪ TRÁCH NHIỆM */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-2xs space-y-6">
          <div className="flex items-center gap-3.5 border-b border-stone-100 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-800 flex items-center justify-center shrink-0 shadow-inner">
              <AlertTriangle className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-stone-900">4. Điều Khoản Miễn Trừ Trách Nhiệm</h2>
              <p className="text-sm text-stone-500 font-normal mt-0.5">Các tình huống khách quan phát sinh từ bên thứ ba hoặc phía người nhận</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-stone-100 bg-stone-50/70 space-y-2">
              <strong className="text-stone-900 block font-bold text-base">Khách không nghe máy / Sai địa chỉ</strong>
              <p className="text-stone-600 font-normal text-sm sm:text-base leading-relaxed">
                Tài xế gọi quá 3 cuộc không bắt máy hoặc khách hẹn lùi ngày nhận khiến hàng lưu kho quá lâu, nhà vườn không chịu trách nhiệm chất lượng độ tươi.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-stone-100 bg-stone-50/70 space-y-2">
              <strong className="text-stone-900 block font-bold text-base">Sự cố bất khả kháng trên quốc lộ</strong>
              <p className="text-stone-600 font-normal text-sm sm:text-base leading-relaxed">
                Thiên tai, sạt lở đèo hoặc sự cố cơ học từ phương tiện nhà xe làm chậm giờ tới bến. Vườn sẽ hỗ trợ tối đa xử lý nhưng miễn trừ bồi hoàn tiền mặt.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-stone-100 bg-stone-50/70 space-y-2">
              <strong className="text-stone-900 block font-bold text-base">Từ chối nhận không lý do chính đáng</strong>
              <p className="text-stone-600 font-normal text-sm sm:text-base leading-relaxed">
                Kiện hàng chuyển đến đúng hẹn nhưng khách đổi ý không nhận, tiền cọc 50.000đ sẽ được giữ lại để thanh toán cước gửi hoàn hàng về Ninh Thuận.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-stone-100 bg-stone-50/70 space-y-2">
              <strong className="text-stone-900 block font-bold text-base">Hủy đơn quá thời gian cho phép</strong>
              <p className="text-stone-600 font-normal text-sm sm:text-base leading-relaxed">
                Miễn phí hủy trong 30 phút đầu. Khi đội vườn đã cắt tỉa đóng thùng sáng sớm, đơn hàng vào luồng vận hành sẽ không thể hoàn tác hủy.
              </p>
            </div>
          </div>
        </section>

      </div>

      {/* 4. FOOTER LIÊN HỆ GẤP */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-900 to-stone-900 text-white flex flex-col sm:flex-row items-center justify-between gap-5 shadow-lg">
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-amber-300 text-sm font-bold uppercase tracking-wider">
            <HeartHandshake className="w-5 h-5" />
            <span>Đồng hành cùng khách thương</span>
          </div>
          <h3 className="font-black text-xl sm:text-2xl text-white">Bạn gặp sự cố cần hỗ trợ ngay lập tức?</h3>
          <p className="text-sm text-stone-300 font-normal">
            Nhà vườn luôn túc trực qua Zalo, điện thoại hoặc email <span className="text-amber-200 font-mono font-medium">hotro@xunanggio.com</span>.
          </p>
        </div>

        <a
          href="tel:0848957345"
          className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm shadow-md transition-all shrink-0 active:scale-95"
        >
          <PhoneCall className="w-5 h-5" />
          <span>Hotline: 0848.957.345</span>
        </a>
      </div>

    </div>
  );
}