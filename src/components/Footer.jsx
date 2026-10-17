import React from 'react';
import { 
  Phone, 
  Mail, 
  ShieldCheck, 
  Heart, 
  Settings, 
  PackageCheck, 
  Truck, 
  ExternalLink, 
  MessageCircle, 
  MapPin,
  Search
} from 'lucide-react';
import { DEFAULT_SHOP_CONFIG } from '../config/shopConfig';

// Link nhúng Google Maps chính xác từ tọa độ vườn nhà bạn
const DEFAULT_MAP_EMBED_URL = "https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d251.61865863961202!2d108.93089242170359!3d11.563539363791506!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1svi!2s!4v1792144018447!5m2!1svi!2s";

function FacebookIcon({ className = "w-3 h-3" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TikTokIcon({ className = "w-3 h-3" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.9-4.47V8.58a8.27 8.27 0 0 0 4.87 1.58V6.69z" />
    </svg>
  );
}

export default function Footer({ 
  onNavigateAdmin, 
  onNavigatePacking, 
  onOpenLookup,
  config = DEFAULT_SHOP_CONFIG 
}) {
  const mapEmbedSrc = config?.mapEmbedUrl || DEFAULT_MAP_EMBED_URL;

  return (
    <footer id="shop-footer" className="bg-stone-900 text-stone-300 pt-12 pb-8 border-t border-stone-800 transition-all font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
          
          {/* CỘT 1: THƯƠNG HIỆU & LỐI TẮT HỆ THỐNG */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
              <span className="text-amber-500 font-serif text-xl">☀</span> Xứ Nắng Gió
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed font-light">
              Nông sản & Đặc sản nắng gió Ninh Thuận - Thu hoạch tận vườn, phơi ráo tự nhiên.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1 font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>100% chính gốc Ninh Thuận - Không phẩm màu</span>
            </div>

            {/* Các lối tắt tra cứu & quản trị nội bộ */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {onOpenLookup && (
                <button
                  type="button"
                  onClick={onOpenLookup}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-stone-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tra cứu đơn hàng</span>
                </button>
              )}

              {onNavigateAdmin && (
                <button
                  type="button"
                  onClick={onNavigateAdmin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-stone-400 hover:text-amber-300 text-[11px] font-medium transition-colors cursor-pointer"
                  title="Trang quản trị"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Quản lý</span>
                </button>
              )}

              {onNavigatePacking && (
                <button
                  type="button"
                  onClick={onNavigatePacking}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-stone-400 hover:text-amber-300 text-[11px] font-medium transition-colors cursor-pointer"
                  title="Khu vực soạn và đóng thùng xốp"
                >
                  <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Kho đóng hàng</span>
                </button>
              )}
            </div>
          </div>

          {/* CỘT 2: LIÊN HỆ & MẠNG XÃ HỘI */}
          <div className="lg:col-span-4 space-y-3 text-xs">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">Liên hệ & Đặt hàng</h4>
            <div className="space-y-3 text-stone-400">
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-stone-200">
                  <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Hotline / Zalo: <strong className="font-mono text-white text-sm">{config.hotline || '0848.957.345'}</strong></span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 pl-6">
                  {config.phoneNumber && (
                    <a
                      href={`tel:${config.phoneNumber}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] transition-colors"
                      title="Gọi điện trực tiếp"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Gọi ngay</span>
                    </a>
                  )}

                  {config.zaloUrl && (
                    <a
                      href={config.zaloUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold text-[11px] transition-colors"
                      title="Liên hệ Zalo"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>Zalo</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  )}

                  {config.facebookUrl && (
                    <a
                      href={config.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-[11px] transition-colors"
                      title="Ghé thăm Facebook"
                    >
                      <FacebookIcon className="w-3 h-3" />
                      <span>Facebook</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  )}

                  {config.tiktokUrl && (
                    <a
                      href={config.tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-[11px] transition-colors"
                      title="Ghé thăm TikTok"
                    >
                      <TikTokIcon className="w-3 h-3" />
                      <span>TikTok</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  )}
                </div>
              </div>

              {config.email && (
                <div className="flex items-center gap-2 pt-1">
                  <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                  <a
                    href={`mailto:${config.email}?subject=${encodeURIComponent("Tư vấn mua đặc sản Ninh Thuận")}`}
                    className="hover:text-amber-300 underline underline-offset-2 transition-colors flex items-center gap-1"
                    title="Gửi thư đến shop"
                  >
                    <span>{config.email}</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                </div>
              )}

              <div className="pt-2 border-t border-stone-800 space-y-1.5 text-[11px]">
                <p className="flex items-center gap-1.5 text-stone-400">
                  <Truck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Giao hàng tận nơi toàn quốc - Đóng thùng xốp</span>
                </p>
                <p className="flex items-center gap-1.5 text-stone-400">
                  <PackageCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Hút chân không & bọc chống sốc kỹ càng</span>
                </p>
              </div>

            </div>
          </div>

          {/* CỘT 3: BẢN ĐỒ VỊ TRÍ NHÀ VƯỜN */}
          <div className="lg:col-span-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>Vị trí nhà vườn</span>
              </h4>
              {config.mapDirectionsUrl && (
                <a 
                  href={config.mapDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold transition-colors"
                >
                  <span>Chỉ đường</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* KHUNG BẢN ĐỒ TỶ LỆ ASPECT-16/9 ÔM SÁT LƯỚI */}
            <div className="w-full aspect-16/9 rounded-2xl overflow-hidden border border-stone-800 bg-stone-800 relative shadow-inner group">
              <iframe
                title="Bản đồ Google Maps Xứ Nắng Gió"
                src={mapEmbedSrc}
                className="w-full h-full border-0 transition-opacity duration-300 opacity-90 group-hover:opacity-100"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            <p className="text-[10.5px] text-stone-500 font-light">
              Đón khách ghé thăm giàn nho và chọn quà tại vườn.
            </p>
          </div>

        </div>

        {/* DÒNG BẢN QUYỀN */}
        <div className="pt-6 border-t border-stone-800 text-center text-xs text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Xứ Nắng Gió. Bảo lưu mọi quyền.</p>
          <p className="flex items-center gap-1">
            <span>Gói trọn tình quê</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
}