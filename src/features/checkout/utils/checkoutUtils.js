import { ORDER_STATUS, normalizeOrderStatus } from "../../orders/constants/orderStatus";

export { resolveDepositAmount, resolveBankConfig } from "../../shop-config/config/shopConfig";

export function isBadOrderStatus(statusStr) {
  const normalized = normalizeOrderStatus(statusStr);
  if (
    normalized === ORDER_STATUS.CANCELLED ||
    normalized === ORDER_STATUS.BOMBED
  )
    return true;
  const raw = String(statusStr || "")
    .trim()
    .toLowerCase();
  return (
    raw === "đã hủy" ||
    raw === "da huy" ||
    raw === "cancelled" ||
    raw === "bom hàng" ||
    raw === "bom hang" ||
    raw === "bombed"
  );
}

export function parseDateForSort(dateStr) {
  if (!dateStr) return 0;
  if (dateStr instanceof Date) return dateStr.getTime();
  let str = String(dateStr)
    .trim()
    .replace(/\s*\(.*?\)\s*/g, "");
  if (str.includes("/")) {
    const match = str.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}):(\d{1,2}))?/,
    );
    if (match) {
      const [, d, m, y, hr = "0", min = "0", sec = "0"] = match;
      return new Date(
        Number(y),
        Number(m) - 1,
        Number(d),
        Number(hr),
        Number(min),
        Number(sec),
      ).getTime();
    }
  }
  const t = new Date(str).getTime();
  return isNaN(t) ? 0 : t;
}

