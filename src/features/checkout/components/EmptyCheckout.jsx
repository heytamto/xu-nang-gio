import React from "react";
import { ShoppingBag, ArrowRight } from "lucide-react";

export default function EmptyCheckout({ onNavigate }) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 font-sans text-stone-800 animate-fadeIn">
        {/* 1. HERO BANNER LỚN FULL-WIDTH (ĐỒNG BỘ VỚI TRANG CỬA HÀNG & TRANG LỖI) */}
        <div className="relative w-full rounded-3xl overflow-hidden bg-stone-900 text-white p-7 sm:p-12 lg:p-14 border border-stone-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Ảnh nền giàn nho / vườn táo Phan Rang */}
          <div className="absolute inset-0 pointer-events-none">
            <img
              src="https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=1400&q=80"
              alt="Vườn nho xanh Ninh Thuận"
              className="w-full h-full object-cover filter brightness-[0.42] contrast-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/85 to-stone-900/45" />
          </div>

          {/* CỘT TRÁI: NỘI DUNG & NÚT ĐIỀU HƯỚNG */}
          <div className="relative z-10 max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-stone-800/80 text-amber-300 border border-amber-400/30 backdrop-blur-md">
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Giỏ Hàng Của Bạn • Chưa Có Sản Phẩm</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15]">
              <span className="block text-white">Giỏ Quà Vườn</span>
              <span className="block text-amber-400 mt-1">
                Đang Chờ Bạn Lấp Đầy!
              </span>
            </h1>

            <p className="text-sm sm:text-base text-stone-300 leading-relaxed max-w-xl">
              Hiện chưa có thức quà nào trong giỏ. Ghé thăm gian hàng để chọn
              nho xanh cắt giàn, táo gió giòn mật hay đặc sản biển phơi ráo nắng
              gửi xe trong đêm nhé!
            </p>

            {/* Cụm nút hành động */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate?.("shop")}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-sm flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Ghé Gian Hàng Đặc Sản</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate?.("home")}
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md font-bold text-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <span>Về Trang Chủ</span>
              </button>
            </div>
          </div>

          {/* CỘT PHẢI: ICON GIỎ HÀNG NGHỆ THUẬT & CAM KẾT */}
          <div className="relative z-10 hidden lg:flex flex-col items-end justify-center shrink-0">
            <div className="w-44 h-44 rounded-3xl bg-white/5 border border-white/15 backdrop-blur-md flex flex-col items-center justify-center gap-2 shadow-2xl">
              <ShoppingBag className="w-16 h-16 text-amber-400 stroke-[1.5]" />
              <span className="font-mono text-xs font-bold text-stone-300 uppercase tracking-widest">
                0 Món • 0đ
              </span>
            </div>
          </div>
        </div>

        {/* 2. THANH CAM KẾT CHẤT LƯỢNG BÊN DƯỚI (ĐỒNG BỘ VỚI TRANG LỖI & CỬA HÀNG) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
            <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-stone-200/80 flex items-center gap-3.5">
              <span className="text-2xl shrink-0">🌿</span>
              <div>
                <div className="font-bold text-sm text-stone-900">
                  Hái tươi tại vườn
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Cắt giàn buổi sớm, không hàng tồn kho
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-stone-200/80 flex items-center gap-3.5">
              <span className="text-2xl shrink-0">🚚</span>
              <div>
                <div className="font-bold text-sm text-stone-900">
                  Gửi xe trong đêm
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Đóng thùng xốp giữ nhiệt tới tận tay
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-stone-200/80 flex items-center gap-3.5">
              <span className="text-2xl shrink-0">🛡️</span>
              <div>
                <div className="font-bold text-sm text-stone-900">
                  Bao ăn từng quả
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Đổi trả hoặc hoàn tiền nếu dập hỏng
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}
