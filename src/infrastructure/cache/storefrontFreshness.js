import { GROUP_TTL_MS } from './refreshQueue.js';
export const CACHE_VERSION = 1;
export const FRESHNESS_KEY = 'shop_master_freshness';
const KEYS = { catalog: ['shop_products', 'shop_categories'], content: ['shop_posts', 'shop_stories'] };
export function restoreFreshness(storage, now = Date.now()) {
  try {
    const meta = JSON.parse(storage.getItem(FRESHNESS_KEY) || 'null');
    if (meta?.version !== CACHE_VERSION) return {};
    return Object.fromEntries(Object.entries(KEYS).filter(([group, keys]) => {
      const ts = meta.updatedAt?.[group];
      return Number.isFinite(ts) && ts > 0 && ts <= now && now - ts < GROUP_TTL_MS[group] && keys.every(key => Array.isArray(JSON.parse(storage.getItem(key) || 'null')));
    }).map(([group]) => [group, meta.updatedAt[group]]));
  } catch { return {}; }
}
export function requiredGroups(page) {
  return ['story', 'admin'].includes(page) ? ['catalog', 'content', 'config'] : ['catalog', 'config'];
}
