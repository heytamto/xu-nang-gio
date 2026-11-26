import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productRepo } from '../../../infrastructure/supabase/repositories/productRepository';
import { invalidateSnapshot } from '../../../infrastructure/cache/storefrontSnapshot';
import { queryKeys } from '../../../infrastructure/cache/queryKeys';

export function useProductStockMutation() {
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: ({ productId, inStock }) => productRepo.update(productId, { in_stock: inStock }),
    onSuccess: async (_, { productId, inStock }) => {
      const queryKey = queryKeys.storefront('catalog');
      await client.cancelQueries({ queryKey, exact: true });
      try { invalidateSnapshot(localStorage, 'catalog'); } catch { /* optional storage */ }
      client.setQueryData(queryKey, previous => previous ? {
        ...previous,
        products: previous.products.map(p => p.id === productId ? { ...p, inStock, in_stock: inStock } : p),
      } : previous);
      await Promise.all([
        client.invalidateQueries({ queryKey, exact: true }),
        client.invalidateQueries({ queryKey: queryKeys.checkoutPricesRoot() }),
      ]);
    },
  });
}
