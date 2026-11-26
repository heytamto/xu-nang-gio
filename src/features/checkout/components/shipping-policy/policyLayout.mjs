export const MODES = ['compact', 'standard', 'standardSupport', 'standardTimeline', 'standardPlus', 'large', 'expanded'];
export function choosePolicyLayout(budget, heights) {
  if (budget == null) return 'standard';
  // Highest information density that actually fits; compact remains readable when none fit.
  const limit = Math.min(650, budget);
  const fitting = MODES.filter(mode => Number.isFinite(heights[mode]) && heights[mode] > 0 && heights[mode] <= limit);
  // Fill the available space with real content; prefer simpler layout on ties.
  return fitting.sort((a,b) => heights[b] - heights[a])[0] || 'compact';
}
