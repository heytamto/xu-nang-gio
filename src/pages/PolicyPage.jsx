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
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-10 animate-fadeIn font-sans text-stone-800">
      
      {/* 1. THANH ĐIỀU HƯỚNG TINH GỌN */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goHome}
          className="group inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-amber-950 bg-white border border-stone-200/90 hover:border-amber-400 px-4 py-2.5 rounded-2xl transition-all shadow-2xs cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-amber-700" />
          <span>Về trang chủ</span>
        </button>

        <button
          type="button"
          onClick={goShop}
          className="inline-flex items-center gap-2 text-xs font-bold text-white bg-amber-900 hover:bg-amber-950 px-4 py-2.5 rounded-2xl transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Ghé chợ nông sản</span>
        </button>
      </div>

      {/* 2. BANNER HERO HIỆN ĐẠI */}
      <div className="relative rounded-[2rem] bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950 text-white p-8 sm:p-14 overflow-hidden border border-stone-800/80 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[11px] font-mono font-bold tracking-wide">
            <SunMedium className="w-3.5 h-3.5" />
            <span>MINH BẠCH • TẬN TÂM • UY TÍN NHÀ VƯỜN</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
            Chính Sách Bán Hàng & Quyền Lợi Khách Thương
          </h1>

          <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed">
            Nông sản tươi cắt giàn vận chuyển đường dài cần sự thấu hiểu từ hai phía. Dưới đây là những cam kết chất lượng cùng các điều khoản bảo vệ trọn vẹn quyền lợi và sự an tâm của bạn.
          </p>
        </div>

        {/* 4 Chỉ số tóm tắt nhanh */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-8 mt-6 border-t border-white/10 text-xs">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-stone-400 block text-[10px] uppercase font-bold">Cam kết</span>
            <strong className="text-amber-300 text-sm">Bao ăn từng quả</strong>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-stone-400 block text-[10px] uppercase font-bold">Xác nhận đơn</span>
            <strong className="text-white text-sm">Cọc trước 50.000đ</strong>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-stone-400 block text-[10px] uppercase font-bold">Hỗ trợ sự cố</span>
            <strong className="text-emerald-400 text-sm">Bù hàng trong 24h</strong>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-stone-400 block text-[10px] uppercase font-bold">Đổi ý hủy đơn</span>
            <strong className="text-white text-sm">Miễn phí 30 phút</strong>
          </div>
        </div>
      </div>

      {/* 3. NỘI DUNG CHÍNH DẠNG CARD CHUYÊN NGHIỆP */}
      <div className="space-y-8">

        {/* PHẦN 1: ĐẶT CỌC & THANH TOÁN */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-2xs space-y-6">
          <div className="flex items-center gap-3.5 border-b border-stone-100 pb-4">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-stone-900">1. Quy Trình Đặt Cọc & Thanh Toán</h2>
              <p className="text-xs text-stone-400 font-light">Giữ trái chín đúng hẹn, tránh lãng phí công sức nông dân cắt giàn</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-2">
              <div className="w-7 h-7 rounded-xl bg-amber-200/70 text-amber-900 flex items-center justify-center font-bold font-mono">1</div>
              <strong className="text-stone-900 block text-xs">Đặt cọc 50.000đ</strong>
              <p className="text-stone-500 leading-relaxed font-light">Áp dụng cho mọi đơn giao xe khách hoặc ship xa để hệ thống xuất lệnh cắt cành.</p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold font-mono">2</div>
              <strong className="text-stone-900 block text-xs">Chuyển khoản 100%</strong>
              <p className="text-stone-500 leading-relaxed font-light">Được hưởng trọn vẹn quà tặng biếu kèm độc quyền từ nông trại Xứ Nắng Gió.</p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-2">
              <div className="w-7 h-7 rounded-xl bg-stone-200 text-stone-800 flex items-center justify-center font-bold font-mono">3</div>
              <strong className="text-stone-900 block text-xs">Thu hộ COD còn lại</strong>
              <p className="text-stone-500 leading-relaxed font-light">Khoản chênh lệch còn lại thanh toán trực tiếp khi nhận hàng từ nhà xe.</p>
            </div>
          </div>
        </section>

        {/* PHẦN 2: VẬN CHUYỂN XE KHÁCH */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-2xs space-y-6">
          <div className="flex items-center gap-3.5 border-b border-stone-100 pb-4">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 shadow-inner">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-stone-900">2. Tuyến Vận Chuyển & Đóng Thùng Chuyên Dụng</h2>
              <p className="text-xs text-stone-400 font-light">Hành trình hái sớm tinh mơ, chuyển xe đêm đến bến sáng hôm sau</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#faf8f5] border border-stone-200/70 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Thời gian giao nhận</span>
              <p className="text-stone-700 leading-relaxed font-light">
                Trái cây được cắt lúc <strong>05:30 sáng</strong>, đóng thùng xốp chèn lưới xốp & túi đá gel làm mát, chuyển lên xe khách chạy xuyên đêm để đến TP.HCM và các tỉnh lân cận vào đầu giờ sáng.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#faf8f5] border border-stone-200/70 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Kiểm tra kiện hàng</span>
              <p className="text-stone-700 leading-relaxed font-light">
                Khi nhận từ phụ xe, khách kiểm tra <strong>băng keo niêm phong và mã vận đơn</strong>. Nếu phát hiện thùng xốp móp méo nặng hoặc bể góc, vui lòng chụp ảnh phản hồi ngay cho nhà vườn.
              </p>
            </div>
          </div>
        </section>

        {/* PHẦN 3: "BAO ĂN" VÀ ĐỔI TRẢ (CARD TƯƠNG PHẢN ĐỎ - XANH) */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-2xs space-y-6">
          <div className="flex items-center gap-3.5 border-b border-stone-100 pb-4">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 shadow-inner">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-stone-900">3. Chính Sách "Bao Ăn" & Điều Kiện Đổi Trả</h2>
              <p className="text-xs text-stone-400 font-light">Bao ăn từng quả — Lỗi do nhà vườn hoặc vận chuyển được bù hàng 100%</p>
            </div>
          </div>

          {/* Hộp lưu ý bắt buộc Video khui hộp */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 flex items-start gap-3 text-xs">
            <Video className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-amber-950 font-bold block">Điều kiện tiên quyết: Video mở thùng xốp liền mạch</strong>
              <p className="text-amber-900 font-light leading-relaxed">
                Vì nông sản tươi rất nhạy cảm với nhiệt độ sau khi rời thùng xốp, quý khách vui lòng <strong>quay video liền mạch lúc khui hàng</strong> (thấy rõ tem mã đơn dán ngoài thùng) và gửi khiếu nại trong vòng <strong>24 giờ</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Cột được hỗ trợ */}
            <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/90 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Trường hợp được bù hàng / hoàn tiền</span>
              </div>
              <ul className="space-y-2 text-stone-700 font-light pl-2">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Trái cây dập nát, rụng cuống quá 20% do nhà xe chèn ép hàng nặng.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Giao nhầm set cân nặng, thiếu quà tặng đính kèm trong đơn.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Chất lượng quả bị chua gắt, sượng đắng do lỗi thu hái của vườn.</span>
                </li>
              </ul>
            </div>

            {/* Cột từ chối hỗ trợ */}
            <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200/90 space-y-3">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wider">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Trường hợp không áp dụng đổi trả</span>
              </div>
              <ul className="space-y-2 text-stone-700 font-light pl-2">
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 font-bold">•</span>
                  <span>Khiếu nại sau 24 giờ kể từ khi nhà xe gọi nhận hàng.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 font-bold">•</span>
                  <span>Không cung cấp video khui thùng làm bằng chứng đối soát với nhà xe.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 font-bold">•</span>
                  <span>Bảo quản sai cách (để nguyên bọc nilon kín ở nơi nắng gắt, hầm hơi).</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* PHẦN 4: MIỄN TRỪ TRÁCH NHIỆM */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-2xs space-y-6">
          <div className="flex items-center gap-3.5 border-b border-stone-100 pb-4">
            <div className="w-11 h-11 rounded-2xl bg-stone-100 text-stone-800 flex items-center justify-center shrink-0 shadow-inner">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-stone-900">4. Điều Khoản Miễn Trừ Trách Nhiệm</h2>
              <p className="text-xs text-stone-400 font-light">Các tình huống khách quan phát sinh từ bên thứ ba hoặc phía người nhận</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="p-4 rounded-2xl border border-stone-100 bg-stone-50/70 space-y-1.5">
              <strong className="text-stone-900 block font-bold">Khách không nghe máy / Sai địa chỉ</strong>
              <p className="text-stone-500 font-light leading-relaxed">
                Tài xế gọi quá 3 cuộc không bắt máy hoặc khách hẹn lùi ngày nhận khiến hàng lưu kho quá lâu, nhà vườn không chịu trách nhiệm chất lượng độ tươi.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-stone-100 bg-stone-50/70 space-y-1.5">
              <strong className="text-stone-900 block font-bold">Sự cố bất khả kháng trên quốc lộ</strong>
              <p className="text-stone-500 font-light leading-relaxed">
                Thiên tai, sạt lở đèo hoặc sự cố cơ học từ phương tiện nhà xe làm chậm giờ tới bến. Vườn sẽ hỗ trợ tối đa xử lý nhưng miễn trừ bồi hoàn tiền mặt.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-stone-100 bg-stone-50/70 space-y-1.5">
              <strong className="text-stone-900 block font-bold">Từ chối nhận không lý do chính đáng</strong>
              <p className="text-stone-500 font-light leading-relaxed">
                Kiện hàng chuyển đến đúng hẹn nhưng khách đổi ý không nhận, tiền cọc 50.000đ sẽ được giữ lại để thanh toán cước gửi hoàn hàng về Ninh Thuận.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-stone-100 bg-stone-50/70 space-y-1.5">
              <strong className="text-stone-900 block font-bold">Hủy đơn quá thời gian cho phép</strong>
              <p className="text-stone-500 font-light leading-relaxed">
                Miễn phí hủy trong 30 phút đầu. Khi đội vườn đã cắt tỉa đóng thùng sáng sớm, đơn hàng vào luồng vận hành sẽ không thể hoàn tác hủy.
              </p>
            </div>
          </div>
        </section>

      </div>

      {/* 4. FOOTER LIÊN HỆ GẤP */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-900 to-stone-900 text-white flex flex-col sm:flex-row items-center justify-between gap-5 shadow-lg">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <HeartHandshake className="w-4 h-4" />
            <span>Đồng hành cùng khách thương</span>
          </div>
          <h3 className="font-black text-lg text-white">Bạn gặp sự cố cần hỗ trợ ngay lập tức?</h3>
          <p className="text-xs text-stone-300 font-light">
            Nhà vườn luôn túc trực qua Zalo, điện thoại hoặc email <span className="text-amber-200 font-mono">hotro@xunanggio.com</span>.
          </p>
        </div>

        <a
          href="tel:0848957345"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-md transition-all shrink-0 active:scale-95"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Hotline: 0848.957.345</span>
        </a>
      </div>

    </div>
  );
}