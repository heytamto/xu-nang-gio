// src/components/home/HarvestCalendarSection.jsx
import React from "react";
import { useHarvestCalendar } from "../hooks/useHarvestCalendar";
import {
  ShoppingBag,
  ArrowRight,
  MapPin,
  Compass,
  RotateCw,
  Camera,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { MONTHLY_HARVEST_CALENDAR } from '../data/harvestCalendar';
export { MONTHLY_HARVEST_CALENDAR } from '../data/harvestCalendar';

export default function HarvestCalendarSection({ onNavigateShop }) {
  const { currentRealMonth, selectedMonth, isFlipped, isPressing, activeMonthData, handleCardClick, handlePrevMonth, handleNextMonth } = useHarvestCalendar();

  return (
    <section className="bg-white rounded-3xl p-5 sm:p-8 border border-stone-200/90 shadow-xs space-y-6 font-sans">
      {/* 1. HEADER SECTION (GỌN GÀNG, SANG TRỌNG) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-amber-800 text-xs sm:text-sm font-black tracking-wider uppercase">
            <Compass className="w-4 h-4 text-amber-700 animate-spin-slow" />
            <span>Xứ Nắng Gió • Nông Sản & Điểm Đến Phan Rang</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-stone-900 mt-1">
            Lịch Mùa Vụ Thu Hoạch & Trải Nghiệm 12 Tháng
          </h3>
        </div>

        {/* CỤM ĐIỀU HƯỚNG */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => {
              if (selectedMonth !== currentRealMonth) {
                handleCardClick(currentRealMonth);
              }
            }}
            title={
              selectedMonth !== currentRealMonth
                ? `Bấm để quay về Tháng ${currentRealMonth} (Hiện tại)`
                : `Đang là Tháng ${currentRealMonth} (Chính vụ)`
            }
            className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl transition-all select-none border ${
              selectedMonth === currentRealMonth
                ? "bg-stone-50 border-stone-200 text-stone-900 cursor-default shadow-2xs"
                : "bg-white hover:bg-amber-50/80 border-stone-200 hover:border-amber-300 text-stone-700 hover:text-amber-900 cursor-pointer shadow-2xs active:scale-95"
            }`}
          >
            <div className="font-mono font-bold text-base sm:text-lg tracking-wider flex items-center">
              <span className="text-stone-900 font-black">{selectedMonth}</span>
              <span className="text-stone-400 mx-1">/</span>
              <span className="text-stone-500">12</span>
            </div>

            {selectedMonth === currentRealMonth ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Hiện tại</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/70 group-hover:bg-amber-200/80 px-2 py-0.5 rounded-full border border-amber-300/60 transition-colors">
                <span>Về T{currentRealMonth}</span>
              </span>
            )}
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-10 h-10 rounded-full border border-stone-200 hover:border-stone-400 bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-900 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-90"
              title="Tháng trước (Phím ←)"
            >
              <ChevronLeft className="w-5 h-5 -ml-0.5" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-10 h-10 rounded-full border border-stone-200 hover:border-stone-400 bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-900 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-90"
              title="Tháng tiếp theo (Phím →)"
            >
              <ChevronRight className="w-5 h-5 -mr-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. GIAO DIỆN MOBILE (3D FLIP CARD)
          ========================================================================= */}
      <div className="block md:hidden space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {MONTHLY_HARVEST_CALENDAR.map((item) => {
            const isSelected = item.month === selectedMonth;
            const isCurrent = item.month === currentRealMonth;

            return (
              <button
                key={item.month}
                type="button"
                onClick={() => handleCardClick(item.month)}
                className={`shrink-0 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? "bg-amber-800 text-white border-amber-800 shadow-sm scale-105"
                    : "bg-stone-50 text-stone-700 border-stone-200/90 hover:bg-stone-100"
                }`}
              >
                {isCurrent && (
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? "bg-amber-300" : "bg-emerald-500"} animate-pulse`}
                  />
                )}
                <span>Tháng {item.month}</span>
              </button>
            );
          })}
        </div>

        {activeMonthData && (
          <div className="perspective-card min-h-[530px] w-full">
            <div
              onClick={() => handleCardClick(activeMonthData.month)}
              className={`relative w-full min-h-[530px] rounded-3xl transition-transform duration-700 mac-spring transform-style-preserve-3d cursor-pointer ${
                isFlipped ? "rotate-y-180" : ""
              } ${isPressing ? "scale-[0.97]" : "scale-100"}`}
            >
              {/* MẶT TRƯỚC (NÔNG SẢN) */}
              <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl overflow-hidden bg-stone-900 text-white p-6 border border-stone-700/80 shadow-xl flex flex-col justify-between">
                <div className="absolute inset-0 pointer-events-none">
                  <img
                    src={activeMonthData.image}
                    alt={activeMonthData.title}
                    className="w-full h-full object-cover filter brightness-[0.62] contrast-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/65 to-black/45" />
                </div>

                <div className="relative z-10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs px-3 py-1 rounded-xl bg-amber-400 text-stone-950 shadow-md">
                      THÁNG {activeMonthData.month}
                    </span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-black/50 border border-white/20 text-amber-200 backdrop-blur-md">
                      {activeMonthData.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-md">
                    <RotateCw className="w-3 h-3 text-amber-300" />
                    <span>Chạm để lật</span>
                  </div>
                </div>

                <div className="relative z-10 space-y-3.5 my-auto py-3">
                  <h4 className="text-xl sm:text-2xl font-black text-white leading-snug drop-shadow-md">
                    {activeMonthData.title}
                  </h4>
                  <div className="p-4 rounded-2xl bg-black/55 border border-white/15 backdrop-blur-md text-xs sm:text-sm text-stone-100 leading-relaxed space-y-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                        🌾 Đặc trưng mùa màng:
                      </span>
                      <p className="text-stone-100 font-normal leading-relaxed">
                        {activeMonthData.desc}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 pt-2.5 border-t border-white/10">
                      <span className="text-amber-300 font-bold text-xs uppercase tracking-wider">
                        💡 Thưởng thức:
                      </span>
                      <p className="text-amber-100 font-normal leading-relaxed">
                        {activeMonthData.tips}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className="relative z-10 space-y-3 pt-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between text-xs px-1 text-stone-300">
                    <span className="text-amber-400 font-mono uppercase font-bold">
                      Đặc sản chọn lọc:
                    </span>
                    <span className="font-bold text-white">
                      {activeMonthData.highlight}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onNavigateShop?.(activeMonthData.categoryTarget || "all")
                    }
                    className="w-full h-11 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-stone-950 font-black text-sm flex items-center justify-center gap-2 active:scale-95 shadow-md cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Xem Nông Sản Tháng {activeMonthData.month}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* MẶT SAU (ĐIỂM ĐẾN) */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl overflow-hidden bg-stone-900 text-white p-6 border border-emerald-500/50 shadow-xl flex flex-col justify-between">
                <div className="absolute inset-0 pointer-events-none">
                  <img
                    src={activeMonthData.destination.image}
                    alt={activeMonthData.destination.spot}
                    className="w-full h-full object-cover filter brightness-[0.62] contrast-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/65 to-black/45" />
                </div>

                <div className="relative z-10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs px-3 py-1 rounded-xl bg-emerald-400 text-stone-950 shadow-md">
                      THÁNG {activeMonthData.month}
                    </span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-400/30 text-emerald-300 backdrop-blur-md">
                      Khám Phá Điểm Đến
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-md">
                    <RotateCw className="w-3 h-3 text-emerald-300" />
                    <span>Lật lại</span>
                  </div>
                </div>

                <div className="relative z-10 space-y-3.5 my-auto py-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{activeMonthData.destination.badge}</span>
                  </div>
                  <h4 className="text-xl sm:text-2xl font-black text-white leading-snug drop-shadow-md">
                    {activeMonthData.destination.spot}
                  </h4>
                  <div className="p-4 rounded-2xl bg-black/60 border border-emerald-400/25 backdrop-blur-md text-xs sm:text-sm text-stone-100 leading-relaxed space-y-3">
                    <p className="text-emerald-200 font-semibold italic text-xs">
                      "{activeMonthData.destination.tagline}"
                    </p>
                    <div className="flex flex-col gap-1 pt-1.5 border-t border-white/10">
                      <span className="text-amber-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5" />
                        <span>Trải nghiệm không thể bỏ qua:</span>
                      </span>
                      <p className="text-stone-100 font-normal leading-relaxed">
                        {activeMonthData.destination.experience}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 text-stone-300 font-mono">
                      <span>Khung giờ đẹp nhất:</span>
                      <strong className="text-white">
                        {activeMonthData.destination.bestTime}
                      </strong>
                    </div>
                  </div>
                </div>

                <div
                  className="relative z-10 space-y-3 pt-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between text-xs px-1 text-stone-300">
                    <span className="text-emerald-400 font-mono uppercase font-bold">
                      Địa danh gợi ý:
                    </span>
                    <span className="font-bold text-white truncate ml-2">
                      {activeMonthData.destination.spot}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onNavigateShop?.(activeMonthData.categoryTarget || "all")
                    }
                    className="w-full h-11 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-500 to-emerald-600 text-stone-950 font-black text-sm flex items-center justify-center gap-2 active:scale-95 shadow-md cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      Xem Nông Sản Vùng{" "}
                      {activeMonthData.destination.spot.split("&")[0]}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          3. GIAO DIỆN DESKTOP (BẢN GỐC CHUẨN POSTER DỌC TỶ LỆ VÀNG)
          ========================================================================= */}
      <div className="hidden md:block relative w-full h-[620px] lg:h-[660px] select-none rounded-3xl p-3.5 bg-[#FAF6F0] border border-stone-200/90 shadow-inner overflow-visible">
        {/* LỚP 1: 12 THẺ CỘT ĐỨNG PHÂN BỐ CÂN XỨNG */}
        <div className="w-full h-full flex flex-row items-stretch gap-2">
          {MONTHLY_HARVEST_CALENDAR.map((item) => {
            const isCurrent = item.month === currentRealMonth;
            const isSelected = item.month === selectedMonth;
            const highlightShort =
              item.highlight.split(" ")[0] +
              " " +
              (item.highlight.split(" ")[1] || "");

            return (
              <div
                key={item.month}
                onClick={() => handleCardClick(item.month)}
                className={`relative flex-1 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 group/card ${
                  isSelected
                    ? "opacity-20 scale-95 pointer-events-none"
                    : "opacity-100 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-lg hover:z-10"
                }`}
              >
                <div className="absolute inset-0 bg-stone-900 border border-white/20">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover filter brightness-95 contrast-105 group-hover/card:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/45" />
                </div>

                <div className="absolute inset-0 py-4 px-1 flex flex-col items-center justify-between pointer-events-none z-10">
                  <div className="flex flex-col items-center gap-1.5">
                    <span
                      className={`font-mono font-black text-xs px-2 py-0.5 rounded-lg shadow-2xs backdrop-blur-md transition-colors ${
                        isCurrent
                          ? "bg-amber-400 text-stone-950 ring-1 ring-amber-300"
                          : "bg-black/60 text-white border border-white/30 group-hover/card:border-amber-400 group-hover/card:text-amber-300"
                      }`}
                    >
                      T{item.month}
                    </span>
                    {isCurrent && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </div>

                  <div className="my-auto py-2 flex items-center justify-center overflow-visible">
                    <span
                      className="font-black text-lg lg:text-[26px] tracking-[0.1em] uppercase text-transparent select-none whitespace-nowrap transition-transform duration-300 group-hover/card:scale-105"
                      style={{
                        writingMode: "vertical-rl",
                        transform: "rotate(180deg)",
                        WebkitTextStroke: "1.2px rgba(255, 255, 255, 0.45)",
                        filter: `
                          drop-shadow(-1px -1px 1px rgba(255, 255, 255, 0.95))
                          drop-shadow(1px 1px 2px rgba(255, 255, 255, 0.4))
                          drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.65))
                        `,
                        fontFamily:
                          '"Nunito", "Montserrat", system-ui, sans-serif',
                      }}
                    >
                      {highlightShort}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-black text-white/90 drop-shadow-md pb-0.5">
                    #{item.month < 10 ? `0${item.month}` : item.month}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* LỚP 2: THẺ NỔI "MẶT NỊT" CÓ HIỆU ỨNG ZOOM ẢNH NỀN KHI HOVER */}
        <div className="absolute -top-3.5 -bottom-3.5 left-1/2 -translate-x-1/2 w-[520px] lg:w-[580px] z-40 pointer-events-none perspective-card">
          <div
            onClick={() => handleCardClick(activeMonthData.month)}
            style={{ transitionProperty: "transform, box-shadow" }}
            className={`group/active w-full h-full rounded-3xl pointer-events-auto cursor-pointer mac-spring duration-500 transform-style-preserve-3d ${
              isFlipped ? "rotate-y-180" : ""
            } ${
              isPressing
                ? "scale-[0.97] shadow-xl"
                : "scale-100 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.65)] hover:shadow-[0_35px_80px_-15px_rgba(0,0,0,0.75)]"
            }`}
          >
            {/* ----------------- MẶT TRƯỚC: NÔNG SẢN ----------------- */}
            <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl overflow-hidden bg-stone-900 border-2 border-amber-400/90 ring-4 ring-amber-500/30 flex flex-col justify-between p-7 lg:p-9 shadow-2xl">
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <img
                  src={activeMonthData.image}
                  alt={activeMonthData.title}
                  className="w-full h-full object-cover filter brightness-[0.70] contrast-105 transition-transform duration-700 ease-out group-hover/active:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/60 to-black/45" />
              </div>

              <div className="relative z-10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs lg:text-sm px-3.5 py-1 rounded-xl bg-amber-400 text-stone-950 shadow-md">
                    THÁNG {activeMonthData.month}
                  </span>
                  <span className="text-xs font-bold px-3.5 py-1 rounded-full bg-black/50 border border-white/20 text-amber-200 backdrop-blur-md">
                    {activeMonthData.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-200 bg-black/40 border border-white/20 px-3 py-1 rounded-full backdrop-blur-md hover:bg-black/60 transition-colors">
                    <RotateCw className="w-3 h-3 text-amber-300" />
                    <span>Click để lật sang điểm đến</span>
                  </span>

                  {activeMonthData.month === currentRealMonth && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-400/40 px-3 py-1 rounded-full backdrop-blur-md shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Chính vụ</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="relative z-10 space-y-4 my-auto py-2">
                <h4 className="text-2xl lg:text-3xl font-black text-white tracking-tight leading-snug drop-shadow-md">
                  {activeMonthData.title}
                </h4>

                <div className="p-5 rounded-2xl bg-black/60 border border-white/15 backdrop-blur-md text-xs lg:text-sm text-stone-100 leading-relaxed font-normal space-y-3.5 shadow-lg">
                  <div className="flex items-start gap-2.5">
                    <span className="shrink-0 text-amber-400 font-bold">
                      🌾 Đặc trưng:
                    </span>
                    <span className="text-stone-100 leading-relaxed">
                      {activeMonthData.desc}
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 pt-2.5 border-t border-white/10">
                    <span className="shrink-0 text-amber-300 font-bold">
                      💡 Thưởng thức:
                    </span>
                    <span className="text-amber-100 leading-relaxed">
                      {activeMonthData.tips}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="space-y-3 relative z-30 pt-1"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between text-xs lg:text-sm px-1 text-stone-300">
                  <span className="text-amber-400 font-mono tracking-wider uppercase text-xs font-bold">
                    Đặc sản chính vụ:
                  </span>
                  <span className="font-bold text-white text-sm">
                    {activeMonthData.highlight}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onNavigateShop?.(activeMonthData.categoryTarget || "all");
                  }}
                  className="w-full h-12 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs lg:text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer shadow-md"
                >
                  <ShoppingBag className="w-4 h-4 text-stone-950" />
                  <span>Ghé Xem Nông Sản Tháng {activeMonthData.month}</span>
                  <ArrowRight className="w-4 h-4 text-stone-950" />
                </button>
              </div>
            </div>

            {/* ----------------- MẶT SAU: ĐIỂM ĐẾN DU LỊCH ----------------- */}
            <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl overflow-hidden bg-stone-900 border-2 border-emerald-400/90 ring-4 ring-emerald-500/30 flex flex-col justify-between p-7 lg:p-9 shadow-2xl">
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <img
                  src={activeMonthData.destination.image}
                  alt={activeMonthData.destination.spot}
                  className="w-full h-full object-cover filter brightness-[0.65] contrast-105 transition-transform duration-700 ease-out group-hover/active:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/60 to-black/45" />
              </div>

              <div className="relative z-10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs lg:text-sm px-3.5 py-1 rounded-xl bg-emerald-400 text-stone-950 shadow-md">
                    THÁNG {activeMonthData.month}
                  </span>
                  <span className="text-xs font-bold px-3.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-400/30 text-emerald-300 backdrop-blur-md">
                    Trải Nghiệm Du Lịch Bản Địa
                  </span>
                </div>

                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-200 bg-black/40 border border-white/20 px-3 py-1 rounded-full backdrop-blur-md hover:bg-black/60 transition-colors">
                  <RotateCw className="w-3 h-3 text-emerald-300" />
                  <span>Click để lật lại nông sản</span>
                </span>
              </div>

              <div className="space-y-4 my-auto py-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{activeMonthData.destination.badge}</span>
                </div>

                <h4 className="text-2xl lg:text-3xl font-black text-white tracking-tight leading-snug drop-shadow-md">
                  {activeMonthData.destination.spot}
                </h4>

                <div className="p-5 rounded-2xl bg-black/60 border border-emerald-400/25 backdrop-blur-md text-xs lg:text-sm text-stone-100 leading-relaxed font-normal space-y-3 shadow-lg">
                  <p className="text-emerald-200 font-semibold italic text-xs lg:text-sm">
                    "{activeMonthData.destination.tagline}"
                  </p>
                  <div className="flex items-start gap-2.5 pt-2 border-t border-white/10">
                    <span className="shrink-0 text-amber-300 font-bold flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Trải nghiệm:</span>
                    </span>
                    <span className="text-stone-100 leading-relaxed">
                      {activeMonthData.destination.experience}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs text-stone-300 font-mono">
                    <span>Khung giờ chụp ảnh đẹp:</span>
                    <strong className="text-white font-bold">
                      {activeMonthData.destination.bestTime}
                    </strong>
                  </div>
                </div>
              </div>

              <div
                className="space-y-3 relative z-30 pt-1"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between text-xs lg:text-sm px-1 text-stone-300">
                  <span className="text-emerald-400 font-mono uppercase font-bold">
                    Địa danh gợi ý:
                  </span>
                  <span className="font-bold text-white text-sm">
                    {activeMonthData.destination.spot}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onNavigateShop?.(activeMonthData.categoryTarget || "all");
                  }}
                  className="w-full h-12 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-stone-950 font-black text-xs lg:text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer shadow-md"
                >
                  <ShoppingBag className="w-4 h-4 text-stone-950" />
                  <span>
                    Xem Nông Sản Vùng{" "}
                    {activeMonthData.destination.spot.split("&")[0]}
                  </span>
                  <ArrowRight className="w-4 h-4 text-stone-950" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. CHỈ MỤC 12 CHẤM TRÒN (TÁCH CÁCH RA KHỎI ĐÁY THẺ ĐỂ KHÔNG BỊ ĐÈ) */}
      <div className="hidden md:flex items-center justify-center gap-2 pt-4">
        {MONTHLY_HARVEST_CALENDAR.map((item) => {
          const isSelected = item.month === selectedMonth;
          const isCurrent = item.month === currentRealMonth;

          return (
            <button
              key={item.month}
              type="button"
              onClick={() => handleCardClick(item.month)}
              title={`Chuyển đến Tháng ${item.month} (${item.highlight})`}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                isSelected
                  ? "w-8 bg-amber-700"
                  : isCurrent
                    ? "w-3 bg-emerald-500 hover:w-5"
                    : "w-2 bg-stone-300 hover:bg-stone-400 hover:w-4"
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}
