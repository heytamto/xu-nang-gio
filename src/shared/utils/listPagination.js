export const PAGE_SIZES = Object.freeze([6, 12, 24]);
export function paginateList(rows, page = 1, pageSize = 6) {
  const size = PAGE_SIZES.includes(pageSize) ? pageSize : 6;
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const currentPage = Math.max(1, Math.min(totalPages, Number.isSafeInteger(page) ? page : 1));
  const offset = (currentPage - 1) * size;
  return { currentPage, totalPages, total, start: total ? offset + 1 : 0, end: Math.min(offset + size, total), items: rows.slice(offset, offset + size) };
}
