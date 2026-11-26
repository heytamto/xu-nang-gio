/** Observed client contracts, not generated PostgreSQL schema types. */
export type ProductId = string;
export type EntityId = string | number;
export type NumericValue = number | string | null;
export type StorefrontGroup = 'catalog' | 'content' | 'config';

export interface CartPriceItem {
  id?: EntityId | null;
  product_id?: EntityId | null;
  productId?: EntityId | null;
  weightId?: EntityId | null;
  weightLabel?: string | null;
  flavor?: string | null;
  price?: NumericValue;
  quantity?: NumericValue;
  name?: string | null;
  title?: string | null;
}
export interface CheckoutWeight {
  id?: EntityId | null;
  weight_key?: EntityId | null;
  weight_label?: string | null;
  label?: string | null;
  price_override?: NumericValue;
  multiplier?: NumericValue;
}
export interface CheckoutProduct {
  id: EntityId;
  name?: string | null;
  base_price?: NumericValue;
  basePrice?: NumericValue;
  in_stock?: boolean | null;
  product_weights?: CheckoutWeight[] | null;
  weights?: CheckoutWeight[] | null;
  flavors?: { label: string; priceBonus?: NumericValue }[] | null;
}
export interface RawOrderItem {
  id?: EntityId | null;
  product_id?: EntityId | null;
  name?: string | null;
  product_name?: string | null;
  weight_label?: string | null;
  flavor?: string | null;
  price?: NumericValue;
  quantity?: NumericValue;
  line_total?: NumericValue;
  campaign_gift_title?: string | null;
}
export interface OrderSummaryItem {
  name?: string | null;
  weightLabel?: string | null;
  quantity?: NumericValue;
}
export interface MappedOrderItem extends OrderSummaryItem {
  id?: EntityId | null;
  productId?: EntityId | null;
  flavor?: string | null;
  price: number;
  quantity: number;
  lineTotal: number;
  campaignGiftTitle?: string | null;
}
export interface RawOrder {
  code: string;
  final_total?: NumericValue;
  total?: NumericValue;
  customer_name?: string | null;
  name?: string | null;
  payment_gift?: unknown;
  campaign_gifts?: unknown;
  cart?: OrderSummaryItem[] | null;
  items_summary?: string | null;
}
