import { useMemo } from 'react';
import { resolveDepositAmount } from '../utils/checkoutUtils';
import { calculateCheckoutPricing } from '../utils/checkoutPricing';

/** @template {import('../utils/checkoutPricing').PricingItem} T
 * @param {T[]} syncedCart
 * @param {import('../utils/checkoutPricing').PricingConfig & Record<string, unknown>} liveConfig
 * @param {import('../utils/checkoutPricing').PricingVoucher[]} appliedVouchers
 */
export function useCheckoutPricing(syncedCart, liveConfig, appliedVouchers) {
  return useMemo(() => calculateCheckoutPricing(syncedCart, liveConfig, appliedVouchers,
    resolveDepositAmount(liveConfig)), [syncedCart, liveConfig, appliedVouchers]);
}
