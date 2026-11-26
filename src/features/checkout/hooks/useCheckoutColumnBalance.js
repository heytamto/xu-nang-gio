import { useLayoutEffect, useState } from 'react';

// Observe only independent content, never the stretched policy or grid height.
export function useCheckoutColumnBalance(leftContent, rightColumn, active) {
  const [budget, setBudget] = useState(null);
  useLayoutEffect(() => {
    if (!active || !leftContent.current || !rightColumn.current) { setBudget(null); return; }
    const left = leftContent.current;
    const right = rightColumn.current;
    const desktop = window.matchMedia('(min-width: 1024px)');
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const gap = parseFloat(getComputedStyle(left.parentElement).rowGap) || 12;
        const next = desktop.matches ? Math.max(0, Math.min(650, Math.floor(right.getBoundingClientRect().height - left.getBoundingClientRect().height - gap))) : null;
        setBudget(prev => prev === next ? prev : next);
      });
    };
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(left); observer?.observe(right);
    desktop.addEventListener('change', measure);
    window.addEventListener('resize', measure);
    measure();
    return () => { observer?.disconnect(); desktop.removeEventListener('change', measure); window.removeEventListener('resize', measure); cancelAnimationFrame(frame); };
  }, [leftContent, rightColumn, active]);
  return budget;
}
