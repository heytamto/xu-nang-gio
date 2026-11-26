import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback, useRef } from 'react';
import { queryKeys } from '../../infrastructure/cache/queryKeys';
import { readSnapshot, saveSnapshot, invalidateSnapshot, validSnapshotData } from '../../infrastructure/cache/storefrontSnapshot';
import { GROUP_TTL_MS } from '../../infrastructure/cache/refreshQueue';
import { requiredGroups } from '../../infrastructure/cache/storefrontFreshness';
import { readJson, writeJson } from '../../shared/utils/storage';
import { getShopConfig } from '../../features/shop-config/config/shopConfig';
import { fetchAllMasterDataFromSupabase } from '../services/masterDataService';
import { supabase } from '../../infrastructure/supabase/supabaseClient';

const EMPTY = [];
const TABLE_GROUPS = { products: 'catalog', product_weights: 'catalog', categories: 'catalog', posts: 'content', stories: 'content', shop_configs: 'config', vouchers: 'config', gifts: 'config' };
function seedPublicGroup(group) {
  try {
    const snapshot = readSnapshot(localStorage, group);
    if (snapshot) return snapshot;
  } catch { /* storage unavailable */ }
  const data = group === 'catalog'
    ? { categories: readJson('shop_categories', null), products: readJson('shop_products', null) }
    : { posts: readJson('shop_posts', null), stories: readJson('shop_stories', null) };
  // Legacy separate keys are never trusted as fresh during migration.
  return validSnapshotData(group, data) ? { data, updatedAt: 0 } : undefined;
}
function persistPublic(group, data, updatedAt) {
  try { saveSnapshot(localStorage, group, data, updatedAt); } catch { /* optional cache */ }
  // Compatibility with older independent readers (e.g. BlogPage).
  Object.entries(data).forEach(([key, value]) => writeJson(`shop_${key}`, value));
}
function useStorefrontGroup(group, enabled) {
  const client = useQueryClient();
  const seed = useRef(undefined);
  if (seed.current === undefined) seed.current = (group === 'config' ? { data: getShopConfig(), updatedAt: 0 } : seedPublicGroup(group)) || null;
  return useQuery({
    queryKey: queryKeys.storefront(group),
    enabled,
    staleTime: GROUP_TTL_MS[group],
    initialData: seed.current?.data,
    initialDataUpdatedAt: seed.current?.updatedAt ?? 0,
    queryFn: async ({ signal }) => {
      const data = await fetchAllMasterDataFromSupabase([group]);
      if (signal.aborted) throw new Error('Refresh cancelled');
      if (!data) throw new Error(`Không thể tải nhóm ${group}`);
      if (group === 'config') {
        const previous = client.getQueryData(queryKeys.storefront(group)) ?? getShopConfig();
        const next = { ...previous, vouchers: data.vouchers, giftsCatalog: data.giftsCatalog, ...data.config };
        writeJson('shop_config', next);
        return next;
      }
      if (!validSnapshotData(group, data)) throw new Error(`Dữ liệu ${group} không hợp lệ`);
      persistPublic(group, data, Date.now());
      return data;
    },
  });
}
export function useStorefrontData({ syncCartWithMasterData, setCurrentPage, currentPage }) {
  const client = useQueryClient();
  const catalog = useStorefrontGroup('catalog', true);
  const content = useStorefrontGroup('content', requiredGroups(currentPage).includes('content'));
  const config = useStorefrontGroup('config', true);
  const products = catalog.data?.products ?? EMPTY;
  const pageRef = useRef(currentPage);
  pageRef.current = currentPage;
  const loadSupabaseData = useCallback(async () => {
    const groups = requiredGroups(pageRef.current);
    await Promise.all(groups.map(async group => {
      const queryKey = queryKeys.storefront(group);
      await client.cancelQueries({ queryKey, exact: true });
      await client.invalidateQueries({ queryKey, exact: true, refetchType: 'active' });
    }));
  }, [client]);
  const patchGroup = useCallback((group, update) => {
    const queryKey = queryKeys.storefront(group);
    // Cancel an older fetch before applying the result of a completed admin save.
    void client.cancelQueries({ queryKey, exact: true });
    const next = client.setQueryData(queryKey, update, { updatedAt: 0 });
    if (group === 'config') writeJson('shop_config', next);
    else if (validSnapshotData(group, next)) persistPublic(group, next, 0);
    // The caller may be saving only a local draft; do not force a server overwrite.
    void client.invalidateQueries({ queryKey, exact: true, refetchType: 'none' });
  }, [client]);
  const setProducts = useCallback(value => patchGroup('catalog', old => ({ ...old, products: value })), [patchGroup]);
  const setPosts = useCallback(value => patchGroup('content', old => ({ ...old, posts: value })), [patchGroup]);
  const setStories = useCallback(value => patchGroup('content', old => ({ ...old, stories: value })), [patchGroup]);
  const setShopConfig = useCallback(value => patchGroup('config', () => value), [patchGroup]);

  useEffect(() => {
    if (catalog.isError && !catalog.data && currentPage !== '500') setCurrentPage('500');
  }, [catalog.isError, catalog.data, currentPage, setCurrentPage]);
  useEffect(() => {
    if (products.length > 0) syncCartWithMasterData(products);
  }, [products, syncCartWithMasterData]);
  useEffect(() => {
    const pending = new Set();
    let timer;
    const invalidate = group => () => {
      const queryKey = queryKeys.storefront(group);
      // Cancel even an initial in-flight request so stale data cannot win the race.
      void client.cancelQueries({ queryKey, exact: true });
      void client.invalidateQueries({ queryKey, exact: true, refetchType: 'none' });
      try { invalidateSnapshot(localStorage, group); } catch { /* optional cache */ }
      pending.add(group);
      if (timer) return;
      timer = setTimeout(() => {
        timer = undefined;
        for (const key of pending) void client.invalidateQueries({ queryKey: queryKeys.storefront(key), exact: true, refetchType: 'active' });
        pending.clear();
      }, 250);
    };
    let channel = supabase.channel('app:master-data-realtime');
    for (const [table, group] of Object.entries(TABLE_GROUPS)) {
      channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, invalidate(group));
    }
    channel.subscribe();
    return () => { clearTimeout(timer); supabase.removeChannel(channel); };
  }, [client]);

  return {
    serverErrorDetail: catalog.error?.message ?? null,
    shopConfig: config.data, setShopConfig,
    categories: catalog.data?.categories ?? EMPTY, products, setProducts,
    posts: content.data?.posts ?? EMPTY, setPosts,
    stories: content.data?.stories ?? EMPTY, setStories,
    isLoadingMasterData: currentPage !== '500' && !catalog.data && catalog.isPending,
    loadSupabaseData,
  };
}
