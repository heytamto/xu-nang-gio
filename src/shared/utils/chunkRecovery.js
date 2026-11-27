const KEY = 'xng_chunk_recovery_at';
const COOLDOWN = 60_000;

export function isChunkLoadError(error) {
  const message = typeof error === 'string' ? error : error?.message || '';
  return /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|loading chunk [\w-]+ failed|unable to preload css|failed to load module script/i.test(message) || error?.name === 'ChunkLoadError';
}

// Public read-only routes only. Never automatically reload checkout or staff forms.
export function isAutoReloadRoute(location) {
  if (!['/', '/index.html'].includes(location.pathname)) return false;
  const params = new URLSearchParams(location.search);
  if (['lookup', 'order', 'code'].some(key => params.has(key))) return false;
  return ['home', 'shop', 'story', 'blog', 'policy'].includes(params.get('page') || 'home');
}

export function tryChunkRecovery(error, browser = window, now = Date.now()) {
  if (!isChunkLoadError(error) || browser.navigator.onLine === false || !isAutoReloadRoute(browser.location)) return false;
  // A public page can still have an editable modal open.
  if (browser.document.querySelector('input:focus, textarea:focus, select:focus, [contenteditable]:focus, [aria-modal="true"]')) return false;
  try {
    const last = browser.sessionStorage.getItem(KEY);
    if (last !== null && now - Number(last) < COOLDOWN) return false;
    browser.sessionStorage.setItem(KEY, String(now));
    browser.location.reload();
    return true;
  } catch {
    // No storage => no auto reload, to avoid an infinite reload loop.
    return false;
  }
}

export function registerChunkRecovery(browser = window) {
  const handle = event => {
    if (tryChunkRecovery(event.payload, browser)) event.preventDefault();
  };
  browser.addEventListener('vite:preloadError', handle);
  return () => browser.removeEventListener('vite:preloadError', handle);
}
