import type { RawOrderItem } from '../../../shared/types/contracts.ts';

export interface OrderItemRow extends RawOrderItem {
  order_code: string;
}
export interface OrderItemsPage {
  data: OrderItemRow[] | null;
  error: unknown;
  count?: number | null;
}
export interface OrderItemsClient {
  from(table: 'order_items'): {
    select(columns: '*', options: { count: 'exact' }): {
      in(column: 'order_code', codes: string[]): {
        order(column: 'id', options: { ascending: boolean }): {
          range(start: number, end: number): PromiseLike<OrderItemsPage>;
        };
      };
    };
  };
}
export interface OrderItemsOptions { batchSize?: number; pageSize?: number }
// Keep URLs bounded and handle PostgREST row limits without silently truncating items.
export async function fetchOrderItemsByCodes(client: OrderItemsClient, codes: readonly string[], { batchSize = 50, pageSize = 200 }: OrderItemsOptions = {}): Promise<OrderItemRow[]> {
  if (!Number.isSafeInteger(batchSize) || batchSize <= 0 || !Number.isSafeInteger(pageSize) || pageSize <= 0) {
    throw new RangeError('Batch and page sizes must be positive safe integers');
  }
  const unique = [...new Set(codes.filter(Boolean))];
  const rows: OrderItemRow[] = [];
  for (let start = 0; start < unique.length; start += batchSize) {
    const batch = unique.slice(start, start + batchSize);
    let offset = 0;
    for (;;) {
      const { data, error, count } = await client.from('order_items').select('*', { count: 'exact' })
        .in('order_code', batch).order('id', { ascending: true }).range(offset, offset + pageSize - 1);
      if (error) throw error;
      if (!Array.isArray(data)) throw new Error('Invalid order items response');
      if (!data.length) break;
      rows.push(...data);
      offset += data.length;
      if (typeof count === 'number' && Number.isInteger(count) && offset >= count) break;
    }
  }
  return rows;
}
