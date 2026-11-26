import type { CartPriceItem, CheckoutProduct } from '../../../shared/types/contracts.ts';

// Explicit product IDs are authoritative. Legacy composite IDs retain the old fallback.
export function checkoutProductId(item: CartPriceItem): string {
  const explicit = item.product_id || item.productId;
  return explicit ? String(explicit).trim() : String(item.id || '').split('-opt-')[0].split('_')[0].trim();
}
export function checkoutProductIds(cart: readonly CartPriceItem[]): string[] {
  return [...new Set(cart.map(checkoutProductId).filter(Boolean))].sort();
}
type UpdatedCartItem<T extends CartPriceItem> = Omit<T, 'name' | 'title' | 'price' | 'basePrice' | 'base_price' | 'inStock'> & {
  name: string | null | undefined;
  title: string | null | undefined;
  price: number;
  basePrice: number;
  base_price: number;
  inStock: boolean;
};
export function applyCheckoutPrices<T extends CartPriceItem>(cart: T[], products: CheckoutProduct[] | null | undefined): (T | UpdatedCartItem<T>)[] {
  if (!Array.isArray(products) || !products.length) return cart;
  const byId = new Map(products.map(p => [String(p.id), p]));
  return cart.map(item => {
    const fresh = byId.get(checkoutProductId(item));
    if (!fresh) return item;
    const base = Number(fresh.base_price ?? fresh.basePrice ?? 0);
    const flavorBonus = Number(fresh.flavors?.find(f => f.label === item.flavor)?.priceBonus ?? 0);
    let finalPrice = Number(item.price || base);
    const weights = fresh.product_weights || fresh.weights;
    if (Array.isArray(weights) && weights.length) {
      const weight = weights.find(w => item.weightId != null && (String(w.id) === String(item.weightId) || (w.weight_key != null && String(w.weight_key) === String(item.weightId))))
        ?? weights.find(w => item.weightLabel && (w.weight_label || w.label) === item.weightLabel);
      if (weight) {
        const override = weight.price_override != null && weight.price_override !== '' ? Number(weight.price_override) : null;
        const multiplier = parseFloat(String(weight.multiplier)) || 1;
        finalPrice = override != null && override > 0 ? (override < 10000 && base >= 20000 ? base + override : override) + flavorBonus : Math.round((base + flavorBonus) * multiplier);
      }
    } else finalPrice = base + flavorBonus;
    return { ...item, name: fresh.name || item.name, title: fresh.name || item.title, price: finalPrice, basePrice: base, base_price: base, inStock: fresh.in_stock ?? true };
  });
}
