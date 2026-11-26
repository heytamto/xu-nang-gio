import React from 'react';
import CustomDropdown from '../../../shared/components/CustomDropdown';
import { LOOKUP_PAGE_SIZES, LOOKUP_STATUS_FILTERS } from '../utils/lookupOrderPagination';

export function LookupOrderFilters({ status, onStatusChange, pageSize, onPageSizeChange, counts }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-3 sm:p-4 space-y-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Lọc trạng thái đơn hàng">
        {LOOKUP_STATUS_FILTERS.map(({ value, label }) => {
          const active = status === value;
          return (
            <button key={value} type="button" aria-pressed={active}
              onClick={() => onStatusChange(value)}
              className={`shrink-0 py-2 px-3.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 border whitespace-nowrap ${active ? (value === 'all' ? 'bg-stone-900 text-white border-stone-900 shadow-2xs' : 'bg-amber-800 text-white border-amber-800 shadow-2xs ring-1 ring-amber-800') : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'}`}>
              <span>{value === 'pending' ? '⏳ ' : ''}{label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${active ? (value === 'all' ? 'bg-stone-800 text-stone-200' : 'bg-amber-950 text-amber-200') : 'bg-stone-200 text-stone-700'}`}>{counts[value] ?? 0}</span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-end gap-2 text-xs sm:text-sm text-stone-600">
        <span>Số đơn mỗi trang</span>
        <div className="w-32 shrink-0">
          <CustomDropdown
            options={LOOKUP_PAGE_SIZES.map(size => ({ value: size, label: String(size) }))}
            value={pageSize}
            onChange={value => onPageSizeChange(Number(value))}
            searchable={false}
            headerLabel=""
            placeholder="Số đơn"
            ariaLabel="Số đơn mỗi trang"
          />
        </div>
      </div>
    </div>
  );
}

export function LookupOrderPagination({ result, onPageChange }) {
  const { currentPage, totalPages, total, start, end } = result;
  if (!total) return null;
  const pages = [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])].filter(p => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const buttonClass = 'px-3 py-2 rounded-xl border border-stone-200 font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-stone-50';
  return (
    <nav aria-label="Phân trang đơn hàng" className="flex flex-wrap items-center justify-between gap-3 bg-white border border-stone-200 rounded-2xl p-3 sm:p-4">
      <span className="text-xs sm:text-sm text-stone-600" aria-live="polite">Hiển thị {start}–{end} / {total} đơn</span>
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" className={buttonClass} disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>Trước</button>
        {pages.map((page, index) => (
          <React.Fragment key={page}>
            {index > 0 && page - pages[index - 1] > 1 && <span aria-hidden="true" className="px-1 text-stone-400">…</span>}
            <button type="button" aria-label={`Trang ${page}`} aria-current={currentPage === page ? 'page' : undefined} onClick={() => onPageChange(page)} className={`${buttonClass} ${currentPage === page ? 'bg-amber-100 border-amber-400 text-amber-950' : 'bg-white'}`}>{page}</button>
          </React.Fragment>
        ))}
        <button type="button" className={buttonClass} disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>Sau</button>
      </div>
    </nav>
  );
}
