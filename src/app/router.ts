// Preserve existing public query-string links, including legacy order aliases.
export const VALID_PAGES = ['home', 'shop', 'story', 'checkout', 'admin', 'packing', 'policy', 'lookup'] as const;
export type Page = typeof VALID_PAGES[number];
export type RoutePage = Page | '400' | '404' | '500';
export interface AppRoute { page: RoutePage; category: string; code: string }
function isPage(value: string): value is Page {
  return (VALID_PAGES as readonly string[]).includes(value);
}
const CATEGORY_PATTERN = /^[a-zA-Z0-9_-]{1,30}$/;
export function parseRoute(pathname: string, search: string): AppRoute {
  const route: AppRoute = { page: 'home', category: 'all', code: '' };
  if (pathname !== '/' && pathname !== '/index.html') return { ...route, page: '404' };
  const params = new URLSearchParams(search);
  const rawCode = params.get('lookup') || params.get('order') || params.get('code');
  const category = params.get('cat');
  if ((rawCode && rawCode.length > 40) || (category && !CATEGORY_PATTERN.test(category))) return { ...route, page: '400' };
  const code = rawCode?.trim().toUpperCase();
  if (code) return { ...route, page: 'lookup', code };
  const rawPage = params.get('page') || 'home';
  const page = rawPage === 'blog' ? 'story' : rawPage;
  return { ...route, page: isPage(page) ? page : '404', category: page === 'shop' ? category || 'all' : 'all' };
}
export function buildRoute(page: string, category = 'all', code = '') {
  const target = page === 'blog' ? 'story' : page;
  if (!isPage(target)) return '/?page=404';
  if (target === 'home') return '/';
  const params = new URLSearchParams({ page: target });
  if (target === 'shop' && CATEGORY_PATTERN.test(category)) params.set('cat', category);
  if (target === 'lookup' && code) params.set('code', code);
  return `/?${params.toString()}`;
}
