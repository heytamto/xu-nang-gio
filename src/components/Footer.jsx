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
  MapPin 
} from 'lucide-react';
import { useTranslation } from '../locales';
import { DEFAULT_SHOP_CONFIG } from '../config/shopConfig';

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

export default function Footer({ onNavigateAdmin, config = DEFAULT_SHOP_CONFIG }) {
  const { t } = useTranslation();

  return (
    <footer id="shop-footer" className="bg-stone-900 text-stone-300 pt-12 pb-8 border-t border-stone-800 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
          
          {/* CỘT 1: THƯƠNG HIỆU */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
              <span className="text-amber-500 font-serif text-xl">☀</span> {t.brand.name}
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              {t.brand.slogan}
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{t.brand.commitment}</span>
            </div>
            {onNavigateAdmin && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onNavigateAdmin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-amber-300 text-[11px] font-medium transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>{t.admin.manageButton}</span>
                </button>
              </div>
            )}
          </div>

          {/* CỘT 2: LIÊN HỆ & MẠNG XÃ HỘI */}
          <div className="lg:col-span-4 space-y-3 text-xs">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">{t.contact.title}</h4>
            <div className="space-y-3 text-stone-400">
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-stone-200">
                  <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{t.contact.hotlineLabel} <strong className="font-mono text-white text-sm">{config.hotline}</strong></span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 pl-6">
                  {config.phoneNumber && (
                    <a
                      href={`tel:${config.phoneNumber}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] transition-colors"
                      title="Gọi điện trực tiếp"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{t.contact.callNow}</span>
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
                      <span>{t.contact.chatZalo}</span>
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
                      <span>{t.contact.facebook}</span>
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
                      <span>{t.contact.tiktok}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  )}
                </div>
              </div>

              {config.email && (
                <div className="flex items-center gap-2 pt-1">
                  <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                  <a
                    href={`mailto:${config.email}?subject=${encodeURIComponent(t.contact.emailSubject)}`}
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
                  <span>{t.policy.shipping}</span>
                </p>
                <p className="flex items-center gap-1.5 text-stone-400">
                  <PackageCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{t.policy.packaging}</span>
                </p>
              </div>

            </div>
          </div>

          {/* CỘT 3: BẢN ĐỒ VỊ TRÍ */}
          <div className="lg:col-span-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>{t.map.title}</span>
              </h4>
              {config.mapDirectionsUrl && (
                <a 
                  href={config.mapDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold transition-colors"
                >
                  <span>{t.map.directions}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="w-full h-36 rounded-2xl overflow-hidden border border-stone-800 bg-stone-800 relative shadow-inner group">
              <iframe
                title="Bản đồ Google Maps"
                src={config.mapEmbedUrl}
                className="w-full h-full border-0 transition-all duration-300 opacity-90 group-hover:opacity-100"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <p className="text-[10.5px] text-stone-500">
              {t.map.guide}
            </p>
          </div>

        </div>

        {/* DÒNG BẢN QUYỀN */}
        <div className="pt-6 border-t border-stone-800 text-center text-xs text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} {t.brand.name}. {t.brand.copyright}</p>
          <p className="flex items-center gap-1">
            <span>{t.brand.madeWithLove}</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
}