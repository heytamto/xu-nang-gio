// src/components/common/ScrollToTop.jsx
import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Chỉ hiện khi cuộn sâu quá 450px
      setIsVisible(window.scrollY > 450);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-5 z-30 w-10 h-10 rounded-2xl bg-white/90 hover:bg-stone-100 text-stone-600 hover:text-amber-900 border border-stone-200/90 shadow-md backdrop-blur-xs flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer animate-fadeIn"
      title="Lên đầu trang"
      aria-label="Lên đầu trang"
    >
      <ArrowUp className="w-4 h-4 stroke-[2.5]" />
    </button>
  );
}