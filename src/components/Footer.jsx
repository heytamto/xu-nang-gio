// src/components/Footer.jsx
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

// URL Google Maps Embed chính thức và sạch sẽ (tọa độ Phước Hậu, Ninh Phước, Ninh Thuận)
const DEFAULT_MAP_EMBED_URL = "https://www.google.com/maps?q=11.563539,108.930892&hl=vi&z=16&output=embed";

function FacebookIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TikTokIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.9-4.47V8.58a8.27 8.27 0 0 0 4.87 1.58V6.69z" />
    </svg>
  );
}

function TelegramIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.211-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.535-.195 1.006.132.832.935z" />
    </svg>
  );
}

function XIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function Footer({ 
  onNavigateAdmin, 
  onNavigatePacking, 
  onOpenLookup, 
  onNavigatePolicy, 
  config = DEFAULT_SHOP_CONFIG 
}) {
  const mapEmbedSrc = config?.mapEmbedUrl || DEFAULT_MAP_EMBED_URL;
  const brandName = config?.brandName || 'Xứ Nắng Gió';
  const hotline = config?.hotline || '0848.957.345';
  const cleanPhone = String(config?.phoneNumber || hotline).replace(/\D/g, '');
  const storeAddress = config?.address || 'Thôn Trường Sanh, Xã Phước Hậu, Huyện Ninh Phước, Tỉnh Ninh Thuận';

  return (
    <footer id="shop-footer" className="bg-stone-900 text-stone-300 pt-14 pb-10 border-t border-stone-800 transition-all font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* LƯỚI 3 CỘT CÂN ĐỐI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          
          {/* CỘT 1: THƯƠNG HIỆU & LỐI TẮT HỆ THỐNG */}
          <div className="space-y-4">
            <div className="space-y-2.5">
              <h3 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
                <span className="text-amber-500 font-serif text-2xl">☀</span> {brandName}
              </h3>
              <p className="text-sm text-stone-300 leading-relaxed font-normal">
                {config?.tagline || 'Nông sản & Đặc sản nắng gió Ninh Thuận - Thu hoạch tận vườn, phơi ráo tự nhiên.'}
              </p>
              <div className="flex items-center gap-2 text-sm text-emerald-400 font-semibold pt-1">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span>100% chính gốc Ninh Thuận - Không phẩm màu</span>
              </div>
            </div>

            {/* Các nút lối tắt hệ thống */}
            <div className="pt-2">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2.5">
                Tiện ích & Hệ thống:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {onOpenLookup && (
                  <button
                    type="button"
                    onClick={onOpenLookup}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer border border-stone-700/80 shadow-2xs active:scale-95"
                  >
                    <Search className="w-4 h-4 text-amber-500" />
                    <span>Tra cứu đơn hàng</span>
                  </button>
                )}

                {onNavigatePolicy && (
                  <button
                    type="button"
                    onClick={onNavigatePolicy}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer border border-stone-700/80 shadow-2xs active:scale-95"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Chính sách bán hàng</span>
                  </button>
                )}

                {onNavigateAdmin && (
                  <button
                    type="button"
                    onClick={onNavigateAdmin}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-amber-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer border border-stone-700/80 shadow-2xs active:scale-95"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Quản lý</span>
                  </button>
                )}

                {onNavigatePacking && (
                  <button
                    type="button"
                    onClick={onNavigatePacking}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-emerald-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer border border-stone-700/80 shadow-2xs active:scale-95"
                  >
                    <PackageCheck className="w-4 h-4 text-emerald-400" />
                    <span>Kho đóng hàng</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* CỘT 2: LIÊN HỆ & MẠNG XÃ HỘI */}
          <div className="space-y-4">
            <h4 className="font-bold text-white text-base uppercase tracking-wider border-b border-stone-800 pb-2.5">
              Liên Hệ & Đặt Hàng
            </h4>
            
            <div className="space-y-3.5">
              <div className="flex items-center gap-2.5 text-stone-200">
                <Phone className="w-5 h-5 text-amber-500 shrink-0" />
                <span className="text-sm">Hotline / Zalo: <strong className="font-mono text-white text-base sm:text-lg">{hotline}</strong></span>
              </div>

              {/* Các nút hành động nhanh & Mạng xã hội */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {cleanPhone && (
                  <a
                    href={`tel:${cleanPhone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/40 font-bold text-xs sm:text-sm transition-colors active:scale-95"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Gọi ngay</span>
                  </a>
                )}

                {config.zaloUrl && (
                  <a
                    href={config.zaloUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/25 hover:bg-blue-600/35 text-blue-300 border border-blue-500/40 font-bold text-xs sm:text-sm transition-colors active:scale-95"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Zalo</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                )}

                {config.facebookUrl && (
                  <a
                    href={config.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/35 text-indigo-300 border border-indigo-500/40 font-bold text-xs sm:text-sm transition-colors active:scale-95"
                  >
                    <FacebookIcon className="w-3.5 h-3.5" />
                    <span>Facebook</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                )}

                {config.tiktokUrl && (
                  <a
                    href={config.tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600/25 hover:bg-rose-600/35 text-rose-300 border border-rose-500/40 font-bold text-xs sm:text-sm transition-colors active:scale-95"
                  >
                    <TikTokIcon className="w-3.5 h-3.5" />
                    <span>TikTok</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                )}

                {config.telegramUrl && (
                  <a
                    href={config.telegramUrl} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-600/25 hover:bg-sky-600/35 text-sky-300 border border-sky-500/40 font-bold text-xs sm:text-sm transition-colors active:scale-95"
                    title="Nhắn tin qua Telegram"
                  >
                    <TelegramIcon className="w-3.5 h-3.5" />
                    <span>Telegram</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                )}
  
                {config.twitterUrl && (
                  <a
                    href={config.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-700/40 hover:bg-stone-700/60 text-stone-200 border border-stone-600/50 font-bold text-xs sm:text-sm transition-colors active:scale-95"
                    title="Theo dõi trên X"
                  >
                    <XIcon className="w-3.5 h-3.5 text-stone-300" />
                    <span>X</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                )}
              </div>

              {config.email && (
                <div className="flex items-center gap-2 pt-1">
                  <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                  <a
                    href={`mailto:${config.email}?subject=${encodeURIComponent("Tư vấn mua đặc sản Ninh Thuận")}`}
                    className="text-sm text-stone-300 hover:text-amber-300 underline underline-offset-4 transition-colors flex items-center gap-1.5"
                  >
                    <span>{config.email}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </a>
                </div>
              )}

              <div className="pt-2 border-t border-stone-800 space-y-2 text-xs sm:text-sm">
                <p className="flex items-center gap-2 text-stone-300">
                  <Truck className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Giao hàng tận nơi toàn quốc - Đóng thùng xốp</span>
                </p>
                <p className="flex items-center gap-2 text-stone-300">
                  <PackageCheck className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Hút chân không & bọc chống sốc kỹ càng</span>
                </p>
              </div>
            </div>
          </div>

          {/* CỘT 3: BẢN ĐỒ VỊ TRÍ NHÀ VƯỜN */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
              <h4 className="font-bold text-white text-base uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>Vị Trí Nhà Vườn</span>
              </h4>
              {config.mapDirectionsUrl && (
                <a 
                  href={config.mapDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1.5 font-bold transition-colors"
                >
                  <span>Chỉ đường</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <div className="w-full aspect-16/9 rounded-2xl overflow-hidden border border-stone-800 bg-stone-800 relative shadow-inner group">
              <iframe
                title={`Bản đồ Google Maps ${brandName}`}
                src={mapEmbedSrc}
                className="w-full h-full border-0 transition-opacity duration-300 opacity-90 group-hover:opacity-100"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allow="fullscreen"
              />
            </div>
            
            <p className="text-xs sm:text-sm text-stone-300 font-normal flex items-start gap-2 leading-relaxed">
              <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{storeAddress}</span>
            </p>
          </div>

        </div>

        {/* DÒNG BẢN QUYỀN */}
        <div className="pt-8 border-t border-stone-800 text-center text-xs sm:text-sm text-stone-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} {brandName}. Bảo lưu mọi quyền.</p>
          <p className="flex items-center gap-1.5 font-medium">
            <span>Gói trọn tình quê</span>
            <Heart className="w-4 h-4 text-red-500 fill-red-500 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
}