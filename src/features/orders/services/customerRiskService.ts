import type { EntityId } from '../../../shared/types/contracts.ts';
export interface RiskOrder {
  phone?: string | number | null;
  customer?: { phone?: string | number | null } | null;
  code?: EntityId | null;
  orderId?: EntityId | null;
  created_at?: string | number | Date | null;
  createdAt?: string | number | Date | null;
  status?: unknown;
  payment_method?: string | null;
  paymentMethod?: string | null;
}
export interface CustomerTag {
  type: 'danger' | 'pardoned' | 'vip';
  label: string;
  badgeClass: string;
  tooltip: string;
}
export interface CustomerProfile<T extends RiskOrder = RiskOrder> {
  isPardoned: boolean;
  isClearedPreSuccess: boolean;
  isWatchlist: boolean;
  hasActiveBombedRisk: boolean;
  completedCount: number;
  primaryBadOrder: T | null;
  customerTag: CustomerTag | null;
}
// src/services/customerRiskService.js
import { ORDER_STATUS, normalizeOrderStatus } from '../constants/orderStatus.ts';
import { parseOrderTimestampToMs } from '../../../shared/utils/dateUtils.js';

export function parseCleanMoney(val: unknown): number {
  if (val == null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleanDigits = String(val).trim().replace(/[^0-9]/g, '');
  return cleanDigits ? Number(cleanDigits) || 0 : 0;
}

/**
 * Thuật toán Two-Pass Scanning quét lịch sử rủi ro và gỡ án bom đơn
 */
export function buildCustomerProfileMap<T extends RiskOrder>(orders: readonly T[] = []): Map<string, CustomerProfile<T>> {
  const map = new Map<string, T[]>();
  
  orders.forEach((ord) => {
    const cleanP = String(ord.phone || ord.customer?.phone || '').replace(/\D/g, '');
    if (cleanP.length >= 8) {
      const key = cleanP.slice(-9);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ord);
    }
  });

  const profileMap = new Map<string, CustomerProfile<T>>();
  
  map.forEach((orderList, key) => {
    const chronological = [...orderList].sort((a, b) => {
      return parseOrderTimestampToMs(a.created_at || a.createdAt) - parseOrderTimestampToMs(b.created_at || b.createdAt);
    });

    let lastBombedIndex = -1;
    let firstSuccessAfterBombIndex = -1;

    for (let i = chronological.length - 1; i >= 0; i--) {
      const st = normalizeOrderStatus(chronological[i].status);
      const pm = String(chronological[i].payment_method || chronological[i].paymentMethod || '').toLowerCase();
      if (st === ORDER_STATUS.BOMBED && !pm.includes('100%') && pm !== 'full_qr') {
        lastBombedIndex = i;
        break;
      }
    }

    if (lastBombedIndex !== -1) {
      for (let i = lastBombedIndex + 1; i < chronological.length; i++) {
        if (normalizeOrderStatus(chronological[i].status) === ORDER_STATUS.COMPLETED) {
          firstSuccessAfterBombIndex = i;
          break;
        }
      }
    }

    const lastBombedOrder = lastBombedIndex !== -1 ? chronological[lastBombedIndex] : null;
    const hasPardonedSuccess = firstSuccessAfterBombIndex !== -1;
    let completedCount = 0;

    chronological.forEach((ord, index) => {
      const currentStatus = normalizeOrderStatus(ord.status);
      if (currentStatus === ORDER_STATUS.COMPLETED) completedCount += 1;

      let hasActiveBombedRisk = false;
      let isPardoned = false;
      let isClearedPreSuccess = false;
      let isWatchlist = false;
      let primaryBadOrder = null;

      if (lastBombedOrder) {
        if (index <= lastBombedIndex) {
          primaryBadOrder = null;
        } else if (!hasPardonedSuccess) {
          hasActiveBombedRisk = true;
          primaryBadOrder = lastBombedOrder;
        } else {
          if (index < firstSuccessAfterBombIndex) {
            isClearedPreSuccess = true;
            primaryBadOrder = lastBombedOrder;
          } else if (index === firstSuccessAfterBombIndex) {
            isPardoned = true;
            primaryBadOrder = lastBombedOrder;
          } else {
            isWatchlist = true;
            primaryBadOrder = lastBombedOrder;
          }
        }
      }

      let customerTag: CustomerTag | null = null;
      if (hasActiveBombedRisk) {
        customerTag = {
          type: 'danger',
          label: 'Đang treo bom',
          badgeClass: 'bg-rose-600 text-white border-rose-700 animate-pulse font-bold',
          tooltip: `Khách từng bom đơn #${primaryBadOrder?.code}. Bắt buộc chuyển khoản 100%!`
        };
      } else if (isPardoned) {
        customerTag = {
          type: 'pardoned',
          label: 'Đã hoàn lương',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
          tooltip: `Đơn này nhận thành công, giải án cho đơn bom #${primaryBadOrder?.code}.`
        };
      } else if (completedCount >= 2) {
        customerTag = {
          type: 'vip',
          label: `Khách quen (${completedCount} đơn)`,
          badgeClass: 'bg-stone-100 text-stone-800 border-stone-300 font-bold',
          tooltip: `Đã hoàn thành ${completedCount} đơn hàng thuận lợi.`
        };
      }

      const orderKey = ord.code || ord.orderId;
      profileMap.set(`${key}_${orderKey}`, {
        isPardoned,
        isClearedPreSuccess,
        isWatchlist,
        hasActiveBombedRisk,
        completedCount,
        primaryBadOrder,
        customerTag
      });
    });
  });

  return profileMap;
}

export function getOrderCustomerTag(ord: RiskOrder | null | undefined, profileMap: ReadonlyMap<string, CustomerProfile> | null | undefined): CustomerTag | null {
  if (!ord || !profileMap) return null;
  const cleanP = String(ord.phone || ord.customer?.phone || '').replace(/\D/g, '');
  if (cleanP.length < 8) return null;
  return profileMap.get(`${cleanP.slice(-9)}_${ord.code || ord.orderId}`)?.customerTag || null;
}