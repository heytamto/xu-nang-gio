// src/components/home/ExperienceGuideSection.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { HelpCircle, ChevronLeft, ChevronRight, MapPin, CheckCircle2, AlertCircle } from "lucide-react";

export default function ExperienceGuideSection({ config }) {
  if (!config?.enabled || !Array.isArray(config.items) || !config.items.length) return null;
  return <ExperienceGuideContent key={JSON.stringify(config.items)} config={config} />;
}

function ExperienceGuideContent({ config }) {
  const items = config.items;
  const timerRef = useRef(null);
  useEffect(() => () => clearTimeout(timerRef.current), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const tabsContainerRef = useRef(null);

  const changeTab = useCallback(
    (newIndex) => {
      if (newIndex === currentIndex || isFading) return;
      setIsFading(true);
      timerRef.current = setTimeout(() => {
        setCurrentIndex(newIndex);
        setIsFading(false);
      }, 150);
    },
    [currentIndex, isFading]
  );

  const handlePrev = useCallback(() => {
    const nextIdx =
      (currentIndex - 1 + items.length) %
      items.length;
    changeTab(nextIdx);
  }, [currentIndex, changeTab, items.length]);

  const handleNext = useCallback(() => {
    const nextIdx = (currentIndex + 1) % items.length;
    changeTab(nextIdx);
  }, [currentIndex, changeTab, items.length]);

  useEffect(() => {
    if (isPaused || items.length < 2) return;

    const timer = setInterval(() => {
      handleNext();
    }, 6000);

    return () => clearInterval(timer);
  }, [isPaused, handleNext, items.length]);

  useEffect(() => {
    const container = tabsContainerRef.current;
    if (!container) return;

    const activeBtn = container.children[currentIndex];
    if (activeBtn) {
      const containerWidth = container.offsetWidth;
      const btnOffsetLeft = activeBtn.offsetLeft;
      const btnWidth = activeBtn.offsetWidth;

      container.scrollTo({
        left: btnOffsetLeft - containerWidth / 2 + btnWidth / 2,
        behavior: "smooth",
      });
    }
  }, [currentIndex]);

  const currentItem = items[currentIndex];

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="bg-white rounded-[2rem] p-6 sm:p-9 border border-stone-200/90 shadow-xs space-y-6 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-stone-100 overflow-hidden">
        <div
          key={currentIndex + (isPaused ? "-paused" : "-running")}
          className={`h-full bg-gradient-to-r from-amber-500 to-amber-700 transition-all duration-300 ${
            isPaused ? "opacity-40" : "animate-progress-6s"
          }`}
          style={{
            animationPlayState: isPaused ? "paused" : "running",
          }}
        />
      </div>

      <style>{`
        @keyframes progress6s {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-progress-6s {
          animation: progress6s 6s linear forwards;
        }
      `}</style>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4 pt-1">
        <div>
          <div className="flex items-center gap-2 text-amber-800 text-xs sm:text-sm font-black tracking-wider uppercase">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>{config.subtitle}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-stone-900 mt-1">
            {config.title}
          </h3>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="text-sm font-mono font-bold text-stone-500">
            {currentIndex + 1} / {items.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="w-9 h-9 rounded-full border border-stone-200 hover:border-amber-600 hover:bg-amber-50 text-stone-600 hover:text-amber-800 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              title="Xem đặc sản trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="w-9 h-9 rounded-full border border-stone-200 hover:border-amber-600 hover:bg-amber-50 text-stone-600 hover:text-amber-800 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              title="Xem đặc sản kế tiếp"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={tabsContainerRef}
        className="flex items-center gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] scroll-smooth"
      >
        {items.map((exp, idx) => (
          <button
            key={exp.id}
            type="button"
            onClick={() => changeTab(idx)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 shrink-0 cursor-pointer ${
              idx === currentIndex
                ? "bg-amber-800 text-white shadow-xs scale-[1.02]"
                : "bg-stone-100 hover:bg-stone-200 text-stone-700"
            }`}
          >
            {exp.tabLabel}
          </button>
        ))}
      </div>

      <div
        className={`grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[460px] sm:min-h-[400px] lg:min-h-[380px] transition-opacity duration-200 ease-in-out ${
          isFading ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="lg:col-span-8 p-6 sm:p-7 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-4 flex flex-col justify-between shadow-2xs">
          <div className="space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs font-black text-amber-900 bg-amber-100/90 border border-amber-300 px-3 py-1 rounded-lg">
                {currentItem.badge}
              </span>
              <span className="text-xs sm:text-sm text-stone-600 font-semibold flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-700" />
                {currentItem.origin}
              </span>
            </div>

            <h4 className="text-lg sm:text-xl font-black text-stone-900">
              {currentItem.title}
            </h4>

            <div className="space-y-2.5 pt-1">
              {currentItem.realSigns.map((sign, sIdx) => (
                <div
                  key={sIdx}
                  className="flex items-start gap-2.5 text-sm sm:text-base text-stone-700 leading-relaxed font-normal"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                  <span>{sign}</span>
                </div>
              ))}
            </div>

            {currentItem.storageTip ? (
              <div className="mt-3 sm:mt-4 p-3.5 sm:p-4 rounded-2xl bg-white/90 border border-amber-200/70 text-xs sm:text-sm text-stone-700 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2.5 shadow-2xs">
                <span className="font-bold text-amber-900 shrink-0 flex items-center gap-1.5">
                  <span>🧊</span>
                  <span>Mẹo bảo quản:</span>
                </span>
                <p className="text-stone-700 leading-relaxed font-normal">
                  {currentItem.storageTip}
                </p>
              </div>
            ) : (
              <div className="mt-3 sm:mt-4 p-3.5 sm:p-4 rounded-2xl bg-white/40 border border-amber-200/40 text-xs sm:text-sm text-stone-500 italic flex items-center gap-2">
                <span>🍃</span>
                <span>Sản phẩm tươi tự nhiên, nên dùng sớm để trọn vị ngon.</span>
              </div>
            )}
          </div>

          <div className="pt-2 text-xs text-stone-500 italic flex items-center gap-2 border-t border-amber-200/40">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>
              Di chuột vào khung để tạm dừng đọc kỹ, rời chuột để tiếp tục tự động chuyển.
            </span>
          </div>
        </div>

        <div className="lg:col-span-4 p-6 sm:p-7 rounded-2xl bg-rose-50/60 border border-rose-200/80 flex flex-col justify-between space-y-4 shadow-2xs">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Cách tránh hàng kém chất lượng</span>
            </div>

            <p className="text-sm sm:text-base text-rose-950 leading-relaxed font-normal">
              {currentItem.fakeWarning}
            </p>
          </div>

          <div className="pt-3.5 border-t border-rose-200/60 flex items-center justify-between text-xs sm:text-sm text-rose-700 font-bold">
            <span>{config.footerLeft}</span>
            <span>{config.footerRight}</span>
          </div>
        </div>
      </div>
    </section>
  );
}