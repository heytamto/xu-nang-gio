export type PaymentMethod = 'cod' | 'deposit' | 'full_qr';
export interface PaymentRisk {
  hasBombedHistory?: boolean;
  isPardoned?: boolean;
  isFrequentCanceller?: boolean;
}
export function requiredPaymentMethod<T extends string>(method: T, risk?: PaymentRisk | null): T | PaymentMethod {
  if (risk?.hasBombedHistory && !risk.isPardoned) return 'full_qr';
  if (risk?.isFrequentCanceller && !risk.isPardoned && method === 'cod') return 'deposit';
  return method;
}
export function calculatePaymentAmounts(method: string, deposit: number, total: number) {
  const currentDepositExpected = method === 'deposit' ? deposit : method === 'full_qr' ? total : 0;
  const currentRemainingCod = method === 'deposit' ? Math.max(0, total - currentDepositExpected) : method === 'cod' ? total : 0;
  return { currentDepositExpected, currentRemainingCod };
}
