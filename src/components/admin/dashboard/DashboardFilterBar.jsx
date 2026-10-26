// src/components/admin/dashboard/DashboardFilterBar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, X, Calendar, ChevronDown, Check, 
  LayoutList, LayoutGrid, RefreshCw, Square, CheckSquare 
} from 'lucide-react';
import { ORDER_STATUS, ORDER_STATUS_MAP } from '../../../constants/orderStatus';
import { DATE_OPTIONS } from './dashboardUtils';

export default function DashboardFilterBar({
  searchQuery,
  setSearchQuery,
  dateFilterType,
  setDateFilterType,
  startDate,
  endDate,
  statusFilter,
  setStatusFilter,
  handleStartDateChange,
  handleEndDateChange,
  viewMode,
  handleToggleViewMode,
  statusCounts,
  filteredOrdersLength,
  isAllFilteredSelected,
  onToggleSelectAll,
  onShowAlert
}) {
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target)) {
        setIsDateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentDateLabel = DATE_OPTIONS.find((d) => d.value === dateFilterType)?.label || 'Tất cả thời gian';

  return (
    <div className="space-y-4 font-sans text-stone-800">
      {/* HÀNG 1: TÌM KIẾM + BỘ LỌC NGÀY + NÚT CHUYỂN CHẾ ĐỘ XEM */}
      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm số điện thoại, tên, mã XNG..."
            className="w-full pl-11 pr-9 py-2.5 rounded-2xl bg-stone-50/90 hover:bg-white focus:bg-white border border-stone-200 text-xs sm:text-sm font-medium focus:border-amber-600 focus:outline-none transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown ngày */}
        <div ref={dateDropdownRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsDateDropdownOpen((prev) => !prev)}
            className={`h-10 px-3.5 sm:px-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-2xs cursor-pointer active:scale-95 ${
              dateFilterType !== 'all'
                ? 'bg-amber-100 border-amber-400 text-amber-950'
                : 'bg-stone-50/90 border-stone-200 text-stone-800 hover:bg-white'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-700" />
            <span className="hidden sm:inline">{currentDateLabel}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-stone-500 transition-transform ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDateDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-2xl border border-stone-200 shadow-xl p-1.5 z-30 animate-fadeIn space-y-1 text-xs sm:text-sm font-medium">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block px-3 py-1.5">
                Khoảng thời gian:
              </span>
              {DATE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setDateFilterType(opt.value);
                    setIsDateDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between cursor-pointer transition-colors ${
                    dateFilterType === opt.value
                      ? 'bg-amber-100 text-amber-950 font-bold'
                      : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  {dateFilterType === opt.value && <Check className="w-4 h-4 text-amber-700" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Nút chuyển chế độ xem */}
        <div className="flex items-center p-1 bg-stone-100 rounded-2xl border border-stone-200 shrink-0">
          <button
            type="button"
            onClick={() => handleToggleViewMode('list')}
            className={`p-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-400 hover:text-stone-700'
            }`}
            title="Xem danh sách hàng ngang"
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleToggleViewMode('grid')}
            className={`p-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-400 hover:text-stone-700'
            }`}
            title="Xem dạng khối bảng (Grid)"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>

        {/* Nút Reset Bộ Lọc */}
        {(statusFilter !== ORDER_STATUS.PENDING || dateFilterType !== 'all' || searchQuery) && (
          <button
            type="button"
            onClick={() => {
              setStatusFilter(ORDER_STATUS.PENDING);
              setDateFilterType('all');
              setSearchQuery('');
            }}
            className="h-10 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl border border-stone-200 text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
            title="Đặt lại về mặc định"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* HÀNG 2: THANH TAB TRẠNG THÁI */}
      <div className="pt-2 border-t border-stone-100 flex items-center gap-2 overflow-x-auto pb-1.5 [-ms-overflow-style:none] [scrollbar-width:none]">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`shrink-0 py-2 px-3.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 border ${
            statusFilter === 'all'
              ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
              : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
          }`}
        >
          <span>Tất cả</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
            statusFilter === 'all' ? 'bg-stone-800 text-stone-200' : 'bg-stone-200 text-stone-700'
          }`}>
            {statusCounts.all || 0}
          </span>
        </button>

        {Object.entries(ORDER_STATUS_MAP).map(([statusCode, info]) => {
          const isActive = statusFilter === statusCode;
          const count = statusCounts[statusCode] || 0;
          return (
            <button
              key={statusCode}
              type="button"
              onClick={() => setStatusFilter(statusCode)}
              className={`shrink-0 py-2 px-3.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 border whitespace-nowrap ${
                isActive
                  ? 'bg-amber-800 text-white border-amber-800 shadow-2xs ring-1 ring-amber-800'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              <span>{statusCode === ORDER_STATUS.PENDING ? '⏳ ' + info.label : info.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                isActive ? 'bg-amber-950 text-amber-200' : 'bg-stone-200 text-stone-700'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* KHUNG CHỌN TẤT CẢ & SỐ LƯỢNG */}
      <div className="flex items-center justify-between text-xs sm:text-sm px-1 text-stone-600 pt-1">
        <label className="flex items-center gap-2.5 cursor-pointer font-bold hover:text-stone-900 select-none">
          <button
            type="button"
            onClick={onToggleSelectAll}
            className="text-stone-400 hover:text-amber-800 cursor-pointer"
          >
            {isAllFilteredSelected ? (
              <CheckSquare className="w-5 h-5 text-amber-800 fill-amber-100" />
            ) : (
              <Square className="w-5 h-5 text-stone-300" />
            )}
          </button>
          <span>Chọn tất cả {filteredOrdersLength} đơn</span>
        </label>

        <span className="text-xs sm:text-sm font-medium">
          Chế độ: <strong>{viewMode === 'list' ? 'Hàng ngang' : 'Khối bảng'}</strong>
        </span>
      </div>

      {/* Khung ngày tùy chọn */}
      {dateFilterType === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-stone-200/60 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="text-stone-600 font-bold">Từ ngày:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value, onShowAlert)}
              className="py-1.5 px-3 rounded-xl bg-white border border-stone-200 text-xs sm:text-sm font-mono font-bold"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-stone-600 font-bold">Đến ngày:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value, onShowAlert)}
              className="py-1.5 px-3 rounded-xl bg-white border border-stone-200 text-xs sm:text-sm font-mono font-bold"
            />
          </div>
        </div>
      )}
    </div>
  );
}