import type { RawOrderItem, RawOrder, MappedOrderItem, OrderSummaryItem } from '../../../shared/types/contracts.ts';

export function mapOrderItem(it: RawOrderItem): MappedOrderItem {
  return {
  id: it.id,
  productId: it.product_id,
  name: it.name || it.product_name,
  weightLabel: it.weight_label,
  flavor: it.flavor,
  price: Number(it.price) || 0,
  quantity: Number(it.quantity) || 1,
  lineTotal: Number(it.line_total) || 0,
  campaignGiftTitle: it.campaign_gift_title
  };
}

export function mapOrderWithItems<T extends RawOrder>(ord: T, itemsByOrder: Partial<Record<string, OrderSummaryItem[]>>) {
      const activeItems = itemsByOrder[ord.code] || ord.cart || [];
      return {
        ...ord,
        total: ord.final_total ?? ord.total,
        totalAmount: ord.final_total ?? ord.total,
        customerName: ord.customer_name || ord.name,
        paymentGift: ord.payment_gift,
        campaignGifts: ord.campaign_gifts,
        order_items: activeItems,
        itemsSummary: activeItems.length > 0
          ? activeItems
              .map((it) => `${it.name} (${it.weightLabel || 'Tiêu chuẩn'}) x${it.quantity}`)
              .join(', ')
          : (ord.items_summary || '')
      };
}
