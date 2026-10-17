import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, Loader2, RefreshCw, Search, X, 
  PhoneCall, Trash2, Clock, CheckCircle2, Truck, XCircle, Check, Calendar
} from 'lucide-react';
import { formatDateTime } from '../../utils/dateUtils';

// Chuẩn hóa bộ trạng thái tinh gọn theo đúng luồng vận hành
const STATUS_CONFIG = {
  'Chờ xác nhận': { bg: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock },
  'Đã xác nhận': { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  'Đang giao': { bg: 'bg-indigo-50 text-indigo-800 border-indigo-200', icon: Truck },
  'Hoàn thành': { bg: 'bg-stone-100 text-stone-800 border-stone-200', icon: Check },
  'Đã hủy': { bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle }
};

const PAYMENT_LABELS = {
  deposit: 'Cọc 50.000đ',
  full_qr: 'Chuyển khoản 100%',
  cod: 'COD (Trả sau)'
};

// Hàm bóc tách số tiền an toàn, chống lỗi lặp chuỗi (e.g. 82.800.008.200.000đ)
function parseCleanMoney(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  const str = String(val).trim();
  // Nếu chuỗi chứa dấu phân cách hàng ngàn dạng VN (8.200.000)
  // Loại bỏ chữ 'đ', khoảng trắng và dấu chấm/phẩy ngăn cách
  const cleanDigits = str.replace(/[^0-9]/g, '');
  if (!cleanDigits) return 0;

  // Nếu chuỗi bị lặp đôi đối xứng do lỗi ghép chuỗi (ví dụ: "82000008200000")
  const len = cleanDigits.length;
  if (len >= 12 && len % 2 === 0) {
    const half1 = cleanDigits.slice(0, len / 2);
    const half2 = cleanDigits.slice(len / 2);
    if (half1 === half2) {
      return Number(half1) || 0;
    }
  }

  const num = Number(cleanDigits);
  return isNaN(num) ? 0 : num;
}

export default function DashboardTab({
  orders = [],
  isLoading = false,
  onRefresh,
  onUpdateStatus,
  onDeleteOrder,
  depositAmount = 50000,
  actionLoadingCode = null,
  onShowAlert
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilterType, setDateFilterType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Chuẩn hóa parse ngày đa định dạng
  const parseOrderDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;
    
    let str = String(dateStr).trim().replace(/\s*\(.*?\)\s*/g, '');

    if (str.includes('/')) {
      const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (match) {
        const [, d, m, y] = match;
        const parsed = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00`);
        return isNaN(parsed.getTime()) ? null : parsed;
      }
    }

    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  };

  const handleStartDateChange = (val) => {
    setStartDate(val);
    if (val && endDate) {
      const diffDays = Math.ceil((new Date(endDate) - new Date(val)) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        setEndDate(val);
      } else if (diffDays > 30) {
        const maxEnd = new Date(val);
        maxEnd.setDate(maxEnd.getDate() + 30);
        setEndDate(maxEnd.toISOString().split('T')[0]);
        if (onShowAlert) onShowAlert('Khoảng thời gian chọn tối đa là 30 ngày.');
      }
    }
  };

  const handleEndDateChange = (val) => {
    if (!startDate && val) {
      setEndDate(val);
      return;
    }
    if (startDate && val) {
      const diffDays = Math.ceil((new Date(val) - new Date(startDate)) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        if (onShowAlert) onShowAlert('Ngày kết thúc không được nhỏ hơn ngày bắt đầu.');
        return;
      }
      if (diffDays > 30) {
        const maxEnd = new Date(startDate);
        maxEnd.setDate(maxEnd.getDate() + 30);
        setEndDate(maxEnd.toISOString().split('T')[0]);
        if (onShowAlert) onShowAlert('Khoảng thời gian chọn tối đa là 30 ngày.');
        return;
      }
    }
    setEndDate(val);
  };

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;

    return orders.filter((order) => {
      const rawPhone = String(order.phone || '').replace(/\D/g, '');
      const rawName = String(order.name || '').toLowerCase();
      const rawCode = String(order.code || '').toLowerCase();
      const currentStatus = order.status || 'Chờ xác nhận';

      const search = searchQuery.trim().toLowerCase();
      const searchPhone = search.replace(/\D/g, '');

      const matchSearch =
        !search ||
        rawCode.includes(search) ||
        rawName.includes(search) ||
        (searchPhone && rawPhone.includes(searchPhone));

      if (!matchSearch) return false;
      if (statusFilter !== 'all' && currentStatus !== statusFilter) return false;
      if (dateFilterType === 'all') return true;

      const orderDate = parseOrderDate(order.createdAt);
      if (!orderDate) return true;

      const orderTime = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate()).getTime();

      if (dateFilterType === 'today') return orderTime === todayStart;
      if (dateFilterType === 'yesterday') return orderTime === yesterdayStart;
      if (dateFilterType === '7days') return orderTime >= todayStart - 7 * 86400000 && orderTime <= todayStart;
      if (dateFilterType === '30days') return orderTime >= todayStart - 30 * 86400000 && orderTime <= todayStart;
      if (dateFilterType === 'custom') {
        const startTimestamp = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
        const endTimestamp = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;
        if (startTimestamp && endTimestamp) return orderTime >= startTimestamp && orderTime <= endTimestamp;
        if (startTimestamp) return orderTime >= startTimestamp;
        if (endTimestamp) return orderTime <= endTimestamp;
      }
      return true;
    });
  }, [orders, searchQuery, statusFilter, dateFilterType, startDate, endDate]);

  const metrics = useMemo(() => {
    const validOrders = filteredOrders.filter(o => o.status !== 'Đã hủy');
    const totalRevenue = validOrders.reduce((sum, o) => sum + parseCleanMoney(o.total), 0);
    const totalOrders = validOrders.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Tiền thực nhận chuẩn hóa
    const realReceivedMoney = validOrders.reduce((sum, o) => {
      const st = String(o.status || '').toLowerCase();
      const isConfirmed = st.includes('xác nhận') || st.includes('giao') || st.includes('hoàn thành');
      if (!isConfirmed) return sum;

      const method = String(o.paymentMethod || '').toLowerCase();
      const numTotal = parseCleanMoney(o.total);

      if (method.includes('100%') || method.includes('full') || st.includes('hoàn thành')) {
        return sum + numTotal;
      }
      if (method.includes('cọc') || method.includes('deposit')) {
        return sum + (Number(depositAmount) || 50000);
      }
      return sum;
    }, 0);

    return { totalRevenue, totalOrders, avgOrderValue, realReceivedMoney };
  }, [filteredOrders, depositAmount]);

  const topProducts = useMemo(() => {
    const productStats = {};
    const validOrders = filteredOrders.filter(o => o.status !== 'Đã hủy');

    validOrders.forEach((order) => {
      if (Array.isArray(order.cart) && order.cart.length > 0) {
        order.cart.forEach((item) => {
          const key = item.name || 'Đặc sản';
          if (!productStats[key]) productStats[key] = { name: key, quantity: 0 };
          productStats[key].quantity += (Number(item.quantity) || 1);
        });
      } else if (order.itemsSummary && typeof order.itemsSummary === 'string') {
        order.itemsSummary.split(',').forEach((p) => {
          const trimmed = p.trim();
          if (!trimmed) return;
          const matchQty = trimmed.match(/x(\d+)\s*$/i);
          let qty = matchQty ? (Number(matchQty[1]) || 1) : 1;
          let prodName = matchQty ? trimmed.replace(/x\d+\s*$/i, '').trim() : trimmed;
          if (!productStats[prodName]) productStats[prodName] = { name: prodName, quantity: 0 };
          productStats[prodName].quantity += qty;
        });
      }
    });

    return Object.values(productStats).sort((a, b) => b.quantity - a.quantity);
  }, [filteredOrders]);

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Top Banner Thống Kê */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-black text-stone-900">Thống Kê Doanh Thu Từ Google Sheet</h2>
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />}
          </div>
          <p className="text-[11px] text-stone-500">
            Đồng bộ trực tiếp qua Apps Script • Tổng nhận: <strong>{orders.length}</strong> dòng
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* 4 Chỉ số KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-3xl border border-stone-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-stone-500 block">Doanh Thu Dự Kiến</span>
          <p className="text-lg sm:text-xl font-black text-stone-900 font-mono">
            {metrics.totalRevenue.toLocaleString('vi-VN')}đ
          </p>
          <span className="text-[10px] text-stone-400 block pt-0.5">Tổng giá trị đơn gửi</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-stone-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-emerald-700 block">Tiền Thực Nhận (Đã CK)</span>
          <p className="text-lg sm:text-xl font-black text-emerald-700 font-mono">
            {metrics.realReceivedMoney.toLocaleString('vi-VN')}đ
          </p>
          <span className="text-[10px] text-emerald-600 block pt-0.5">Tiền cọc & full của đơn đã duyệt</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-stone-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-stone-500 block">Số Đơn Hàng</span>
          <p className="text-lg sm:text-xl font-black text-stone-900 font-mono">
            {metrics.totalOrders} <span className="text-xs font-normal text-stone-400">đơn</span>
          </p>
          <span className="text-[10px] text-stone-400 block pt-0.5">Chưa tính đơn hủy</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-stone-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-stone-500 block">Giá Trị TB / Đơn (AOV)</span>
          <p className="text-lg sm:text-xl font-black text-amber-800 font-mono">
            {metrics.avgOrderValue.toLocaleString('vi-VN')}đ
          </p>
          <span className="text-[10px] text-stone-400 block pt-0.5">Bình quân mỗi đơn</span>
        </div>
      </div>

      {/* Đặc sản bán chạy */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
          Đặc Sản Hút Khách Nhất (Bán Chạy)
        </h3>

        {topProducts.length === 0 ? (
          <p className="text-xs text-stone-400 italic py-4 text-center">
            Chưa có dữ liệu sản phẩm trong giai đoạn lọc này.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topProducts.slice(0, 6).map((item, idx) => (
              <div key={item.name} className="p-3 rounded-2xl bg-stone-50 border border-stone-200/70 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="truncate">
                    <span className="font-bold text-stone-800 truncate block">{item.name}</span>
                    <span className="text-[10px] text-stone-500">Đã bán: <strong>{item.quantity}</strong> phần</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chi tiết đơn hàng & Bộ lọc */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h3 className="text-sm font-black text-stone-900 uppercase tracking-wide flex items-center gap-2">
              <span>Chi Tiết Đơn Hàng</span>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                {filteredOrders.length} / {orders.length} đơn
              </span>
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Kiểm tra tài khoản ngân hàng hoặc xác nhận với khách rồi bấm <strong>Đã xác nhận</strong> để chuyển sang Kho
            </p>
          </div>
        </div>

        <div className="space-y-3 bg-stone-50/80 p-3.5 rounded-2xl border border-stone-200/80">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-5 relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo số điện thoại, tên khách, mã XNG..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-stone-200 text-xs font-medium focus:border-amber-600 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="sm:col-span-4">
              <select
                value={dateFilterType}
                onChange={(e) => setDateFilterType(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-700 focus:border-amber-600 focus:outline-none cursor-pointer"
              >
                <option value="all">📅 Tất cả thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="yesterday">Hôm qua</option>
                <option value="7days">7 ngày gần nhất</option>
                <option value="30days">30 ngày gần nhất</option>
                <option value="custom">Tùy chọn khoảng ngày (tối đa 30 ngày)...</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-700 focus:border-amber-600 focus:outline-none cursor-pointer"
              >
                <option value="all">⚡ Tất cả trạng thái</option>
                <option value="Chờ xác nhận">⏳ Chờ xác nhận</option>
                <option value="Đã xác nhận">✅ Đã xác nhận (Chờ đóng)</option>
                <option value="Đang giao">🚚 Đang giao</option>
                <option value="Hoàn thành">🎉 Hoàn thành</option>
                <option value="Đã hủy">❌ Đã hủy</option>
              </select>
            </div>
          </div>

          {dateFilterType === 'custom' && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200/60 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-stone-500 font-semibold">Từ ngày:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="py-1.5 px-2.5 rounded-xl bg-white border border-stone-200 text-xs font-mono font-bold"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-stone-500 font-semibold">Đến ngày:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="py-1.5 px-2.5 rounded-xl bg-white border border-stone-200 text-xs font-mono font-bold"
                />
              </div>
            </div>
          )}
        </div>

        {/* Danh sách đơn */}
        <div className="divide-y divide-stone-100 space-y-3 pt-1">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-10 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
              <p className="text-xs font-bold text-stone-600">Không tìm thấy đơn hàng nào khớp bộ lọc</p>
            </div>
          ) : (
            filteredOrders.map((ord) => {
              const isProcessing = actionLoadingCode === ord.code;
              const currentStatus = ord.status || 'Chờ xác nhận';
              const statusMeta = STATUS_CONFIG[currentStatus] || STATUS_CONFIG['Chờ xác nhận'];
              const displayPayment = PAYMENT_LABELS[ord.paymentMethod] || ord.paymentMethod || 'Chưa chọn';

              const cleanTotalNum = parseCleanMoney(ord.total);
              const formattedCreatedAt = formatDateTime(ord.createdAt, 'Vừa xong');

              return (
                <div key={ord.code} className="pt-3 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md text-[11px]">
                        {ord.code}
                      </span>
                      <strong className="text-stone-900 text-sm">{ord.name}</strong>
                      
                      {ord.phone && (
                        <a
                          href={`tel:${ord.phone}`}
                          className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-lg transition-colors"
                        >
                          <PhoneCall className="w-3 h-3 text-amber-600" />
                          <span>{ord.phone}</span>
                        </a>
                      )}

                      <span className="text-[10.5px] text-stone-400 font-mono inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        <span>({formattedCreatedAt})</span>
                      </span>
                    </div>

                    {ord.address && (
                      <p className="text-stone-600 text-[11px] line-clamp-1">
                        📍 <strong>Giao đến:</strong> {ord.address}
                      </p>
                    )}

                    {ord.itemsSummary && (
                      <p className="text-stone-700 text-[11px] font-medium bg-stone-50 p-2 rounded-xl border border-stone-100 line-clamp-2">
                        🛍️ {ord.itemsSummary}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2.5 shrink-0">
                    <div className="text-left md:text-right">
                      <span className="font-mono font-black text-stone-900 text-sm block">
                        {cleanTotalNum.toLocaleString('vi-VN')}đ
                      </span>
                      <span className="text-[10px] text-stone-500 font-medium bg-stone-100 px-2 py-0.5 rounded-md inline-block mt-0.5">
                        {displayPayment}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        disabled={isProcessing}
                        value={currentStatus}
                        onChange={(e) => onUpdateStatus(ord.code, e.target.value)}
                        className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border cursor-pointer focus:outline-none transition-colors ${statusMeta.bg}`}
                      >
                        <option value="Chờ xác nhận">⏳ Chờ xác nhận</option>
                        <option value="Đã xác nhận">✅ Đã xác nhận</option>
                        <option value="Đang giao">🚚 Đang giao</option>
                        <option value="Hoàn thành">🎉 Hoàn thành</option>
                        <option value="Đã hủy">❌ Đã hủy</option>
                      </select>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => onDeleteOrder(ord.code)}
                        className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                        title="Xóa đơn hàng"
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin text-amber-600" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}