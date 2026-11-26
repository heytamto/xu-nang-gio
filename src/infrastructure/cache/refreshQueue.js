// Serialize refreshes, merging pending groups without dropping invalidations.
export function createRefreshQueue(run) {
  let pending = new Set();
  let active = null;
  return function enqueue(groups) {
    groups.forEach(group => pending.add(group));
    if (!active) {
      active = Promise.resolve().then(async () => {
        while (pending.size) {
          const batch = [...pending];
          pending = new Set();
          await run(batch);
        }
      }).finally(() => { active = null; });
    }
    return active;
  };
}
export const STOREFRONT_GROUPS = ['catalog', 'content', 'config'];
export const GROUP_TTL_MS = { catalog: 5 * 60_000, content: 60 * 60_000, config: 5 * 60_000 };
export function staleGroups(updatedAt, now = Date.now()) {
  return STOREFRONT_GROUPS.filter(group => !updatedAt[group] || now - updatedAt[group] >= GROUP_TTL_MS[group]);
}
