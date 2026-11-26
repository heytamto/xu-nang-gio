import type { StorefrontGroup, ProductId } from '../../shared/types/contracts.ts';

export const queryKeys = {
  checkoutPricesRoot: () => ['checkout', 'prices'] as const,
  checkoutPrices: (ids: readonly ProductId[]) => ['checkout', 'prices', ids] as const,
  checkoutGifts: () => ['checkout', 'gifts'] as const,
  storefront: (group: StorefrontGroup) => ['storefront', group] as const,
};
