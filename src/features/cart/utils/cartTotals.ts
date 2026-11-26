import type { CartPriceItem } from '../../../shared/types/contracts.ts';

/** Preserve the existing cart display semantics; checkout has its own price fallback. */
export function calculateCartTotals(cart: readonly CartPriceItem[]) {
  return {
    totalCartCount: cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0),
    totalCartAmount: cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0),
  };
}
