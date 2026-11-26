import React from 'react';
import CustomDropdown from './CustomDropdown';
import { PAGE_SIZES } from '../utils/listPagination.js';

export function PageSizeControl({ value, onChange, unit = 'đơn' }) {
  return <div className="flex items-center justify-end gap-2 text-xs sm:text-sm text-stone-600">
    <span>Số {unit} mỗi trang</span>
    <div className="w-24 shrink-0"><CustomDropdown options={PAGE_SIZES.map(n => ({ value: n, label: String(n) }))} value={value} onChange={v => onChange(Number(v))} searchable={false} headerLabel="" ariaLabel={`Số ${unit} mỗi trang`} /></div>
  </div>;
}

export function ListPagination({ result, onPageChange, unit = 'đơn' }) {
  const { currentPage, totalPages, total, start, end } = result;
  if (!total) return null;
  const pages = [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])].filter(p => p >= 1 && p <= totalPages).sort((a,b) => a-b);
  const cls = 'px-3 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';
  return <nav aria-label={`Phân trang ${unit}`} className="flex flex-wrap items-center justify-between gap-3 bg-white border border-stone-200 rounded-2xl p-3">
    <span className="text-xs sm:text-sm text-stone-600" aria-live="polite">Hiển thị {start}–{end} / {total} {unit}</span>
    <div className="flex flex-wrap items-center gap-1.5">
      <button type="button" className={cls} disabled={currentPage === 1} onClick={() => onPageChange(currentPage-1)}>Trước</button>
      {pages.map((p,i) => <React.Fragment key={p}>{i > 0 && p-pages[i-1]>1 && <span aria-hidden="true">…</span>}<button type="button" aria-label={`Trang ${p}`} aria-current={p===currentPage?'page':undefined} className={`${cls} ${p===currentPage?'bg-amber-100 border-amber-400 text-amber-950':'bg-white hover:bg-stone-50'}`} onClick={() => onPageChange(p)}>{p}</button></React.Fragment>)}
      <button type="button" className={cls} disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage+1)}>Sau</button>
    </div>
  </nav>;
}
