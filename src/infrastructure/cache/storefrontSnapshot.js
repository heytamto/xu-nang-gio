// A single storage write commits both data and timestamp for each public group.
export const SNAPSHOT_VERSION = 2;
const fields = { catalog: ['categories', 'products'], content: ['posts', 'stories'] };
export const snapshotKey = group => `shop_storefront_v2_${group}`;
export function validSnapshotData(group, data) {
  return !!fields[group] && fields[group].every(key => Array.isArray(data?.[key]));
}
export function readSnapshot(storage, group, now = Date.now()) {
  try {
    const snapshot = JSON.parse(storage.getItem(snapshotKey(group)) || 'null');
    if (snapshot?.version !== SNAPSHOT_VERSION || !validSnapshotData(group, snapshot.data)) return undefined;
    const timestamp = snapshot.updatedAt;
    return { data: snapshot.data, updatedAt: Number.isFinite(timestamp) && timestamp > 0 && timestamp <= now ? timestamp : 0 };
  } catch { return undefined; }
}
export function saveSnapshot(storage, group, data, updatedAt = Date.now()) {
  if (!validSnapshotData(group, data)) return false;
  try {
    storage.setItem(snapshotKey(group), JSON.stringify({ version: SNAPSHOT_VERSION, data, updatedAt }));
    return true;
  } catch { return false; }
}
export function invalidateSnapshot(storage, group) {
  const old = readSnapshot(storage, group);
  if (old && !saveSnapshot(storage, group, old.data, 0)) {
    try { storage.removeItem(snapshotKey(group)); } catch { /* storage unavailable */ }
  }
}
