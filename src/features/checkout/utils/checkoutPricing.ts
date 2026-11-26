import type { CartPriceItem, NumericValue } from '../../../shared/types/contracts.ts';

export interface PricingItem extends CartPriceItem {
  base_price?: NumericValue;
  basePrice?: NumericValue;
}
export interface PricingConfig {
  shipping?: { standardFee?: NumericValue; freeShippingMin?: NumericValue } | null;
  standardFee?: NumericValue;
  shippingFee?: NumericValue;
  freeShippingMin?: NumericValue;
  freeShippingThreshold?: NumericValue;
  loyaltyDiscountPercent?: NumericValue;
  loyaltyMaxDiscount?: NumericValue;
}
export interface PricingVoucher {
  isPreviousOrder?: boolean;
  isLoyalty?: boolean;
  type?: string | null;
  percent?: NumericValue;
  value?: NumericValue;
  maxDiscount?: NumericValue;
  discount?: NumericValue;
}

/** Client estimate only; authoritative pricing must be validated on the server. */
export function calculateCheckoutPricing<T extends PricingItem>(
  syncedCart: T[], liveConfig: PricingConfig | null | undefined,
  appliedVouchers: readonly PricingVoucher[], configuredDeposit: number,
) {
  const clientSubtotal = syncedCart.reduce((sum, item) => sum +
    Number(item.price || item.base_price || item.basePrice || 0) * Number(item.quantity || 1), 0);
  const standardShippingFee = Number(liveConfig?.shipping?.standardFee ?? liveConfig?.standardFee ?? liveConfig?.shippingFee ?? 30000);
  const freeShippingThreshold = Number(liveConfig?.shipping?.freeShippingMin ?? liveConfig?.freeShippingMin ?? liveConfig?.freeShippingThreshold ?? 500000);
  const shippingFee = clientSubtotal === 0 || clientSubtotal >= freeShippingThreshold ? 0 : standardShippingFee;
  const rate = Number(liveConfig?.loyaltyDiscountPercent) || 10;
  const maxDisc = Number(liveConfig?.loyaltyMaxDiscount) || 50000;
  let totalDisc = 0;
  for (const v of appliedVouchers) {
    if (v.isPreviousOrder || v.isLoyalty || v.type === 'percent' || v.percent) {
      const currentRate = Number(v.percent ?? v.value ?? rate);
      const currentMax = Number(v.maxDiscount ?? maxDisc);
      const disc = Math.round(clientSubtotal * currentRate / 100);
      totalDisc += currentMax > 0 ? Math.min(disc, currentMax) : disc;
    } else {
      totalDisc += Number(v.discount || v.value || 0);
    }
  }
  const activeDiscount = appliedVouchers.length ? Math.min(totalDisc, clientSubtotal) : 0;
  const activeFinalTotal = Math.max(0, clientSubtotal + shippingFee - activeDiscount);
  return { clientSubtotal, standardShippingFee, freeShippingThreshold, shippingFee, activeDiscount, activeFinalTotal,
    activeSubtotal: clientSubtotal, activeCart: syncedCart, configuredDeposit, depositAmount: Math.min(configuredDeposit, activeFinalTotal) };
}
