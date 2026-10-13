import React from 'react';
import { MapPin, Phone, Mail, ShieldCheck, Heart, ExternalLink, Lock } from 'lucide-react';

export default function Footer({ onNavigateAdmin }) {
  const mapShareUrl = "https://maps.app.goo.gl/xae4U9sr9kFguDdZ7";
  const hotline = import.meta.env.VITE_HOTLINE || "0987.654.321";
  const email = import.meta.env.VITE_EMAIL || "xunanggio@gmail.com";

  return (
    <footer className="bg-stone-950 text-stone-300 border-t border-stone-800 pt-12 pb-8 mt-20">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <div>
          <h3 className="text-white font-bold text-lg mb-3">Xứ Nắng Gió</h3>
          <p className="text-xs text-stone-400 leading-relaxed mb-4">
            Đặc sản táo gió giòn ngọt, táo sấy dẻo thủ công và rượu nho truyền thống từ vườn nhà Trường Sanh. Bao bù 1 đổi 1 nếu hoa quả hư hỏng khi vận chuyển.
          </p>
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Nông sản tươi hái trực tiếp - Không hóa chất bảo quản</span>
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold text-sm mb-3">Địa Chỉ & Liên Hệ</h4>
          <ul className="space-y-2.5 text-xs text-stone-400">
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>Địa chỉ vườn:</strong> Thôn Trường Sanh, Xã Phước Hậu, Tỉnh Ninh Thuận <br />
                <span className="text-[11px] text-amber-400/90 font-medium">(Ngay gần Trường Mẫu Giáo Phước Hậu)</span>
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Hotline / Zalo: {hotline}</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{email}</span>
            </li>
          </ul>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-semibold text-sm">Vị Trí Xứ Nắng Gió</h4>
            <a 
              href={mapShareUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 font-medium transition-colors"
            >
              <span>Xem trên Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="w-full h-36 rounded-xl overflow-hidden border border-stone-800 bg-stone-900 shadow-inner">
            <iframe
              title="Vị trí vườn nhà gần mẫu giáo Phước Hậu"
              src="https://www.google.com/maps/embed?pb=!1m12!1m8!1m3!1d690.9915043795089!2d108.93036279905107!3d11.563452334826168!3m2!1i1024!2i768!4f13.1!2m1!1zVHLGsOG7nW5nIE3huqt1IEdpw6FvIFBoxrDhu5tjIEjhuq11!5e0!3m2!1svi!2sus!4v1791791515851!5m2!1svi!2sus"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            ></iframe>
          </div>
          <p className="text-[10px] text-stone-500 mt-1.5 text-center">
            Thôn Trường Sanh, Xã Phước Hậu, Tỉnh Ninh Thuận
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6 border-t border-stone-800/80 text-center text-xs text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="flex items-center gap-2">
          <span>© 2026 Xứ Nắng Gió</span>
          <button
            type="button"
            onClick={onNavigateAdmin}
            className="text-stone-600 hover:text-amber-400 transition-colors p-1"
            title="Dành cho Quản trị viên"
          >
            <Lock className="w-3 h-3" />
          </button>
        </p>
        <p className="flex items-center gap-1">
          Làm bằng <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> từ vùng đất Nắng Gió Trường Sanh
        </p>
      </div>
    </footer>
  );
}
