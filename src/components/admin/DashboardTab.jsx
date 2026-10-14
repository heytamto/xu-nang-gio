import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, Loader2, RefreshCw, Search, X, 
  PhoneCall, Trash2, Clock, CheckCircle2, Truck, XCircle, Check
} from 'lucide-react';

const STATUS_CONFIG = {
  'Chờ xác nhận': { bg: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock },
  'Đã nhận cọc': { bg: 'bg-blue-50 text-blue-800 border-blue-200', icon: CheckCircle2 },
  'Đã thanh toán 100%': { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  'Đang giao': { bg: 'bg-indigo-50 text-indigo-800 border-indigo-200', icon: Truck },
  'Hoàn thành': { bg: 'bg-stone-100 text-stone-800 border-stone-200', icon: Check },
  'Đã hủy': { bg: 'bg-red-50 text-red-700 border-red-200', icon: XCircle }
};

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

  const parseOrderDate = (dateStr) => {
    if (!dateStr) return null;
    if (typeof dateStr !== 'string') return new Date(dateStr);
    if (dateStr.includes('/')) {
      const parts = dateStr.split(' ')[0].split('/');
      if (parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T00:00:00`);
      }
    }
    const d = new Date(dateStr);
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

      const search = searchQuery.trim().toLowerCase();
      const searchPhone = search.replace(/\D/g, '');

      const matchSearch =
        !search ||
        rawCode.includes(search) ||
        rawName.includes(search) ||
        (searchPhone && rawPhone.includes(searchPhone));

      if (!matchSearch) return false;
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
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
    const totalRevenue = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const totalOrders = validOrders.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const realReceivedMoney = validOrders.reduce((sum, o) => {
      if (o.status === 'Đã thanh toán 100%' || o.status === 'Hoàn thành') return sum + (Number(o.total) || 0);
      if (o.status === 'Đã nhận cọc') return sum + (Number(depositAmount) || 50000);
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
    <div className="space-y-6">
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
          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
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
          <span className="text-[10px] text-emerald-600 block pt-0.5">Khớp tiền cọc & CK 100%</span>
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
              Đối chiếu với thông báo biến động số dư ngân hàng rồi cập nhật trạng thái
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
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="sm:col-span-4">
              <select
                value={dateFilterType}
                onChange={(e) => setDateFilterType(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-700 focus:border-amber-600 focus:outline-none"
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
                className="w-full py-2 px-3 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-700 focus:border-amber-600 focus:outline-none"
              >
                <option value="all">⚡ Tất cả trạng thái</option>
                <option value="Chờ xác nhận">⏳ Chờ xác nhận</option>
                <option value="Đã nhận cọc">✅ Đã nhận cọc</option>
                <option value="Đã thanh toán 100%">💰 Đã thanh toán 100%</option>
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
              <p className="text-xs font-bold text-stone-600">Không tìm thấy đơn hàng nào</p>
            </div>
          ) : (
            filteredOrders.map((ord) => {
              const isProcessing = actionLoadingCode === ord.code;
              const statusMeta = STATUS_CONFIG[ord.status] || STATUS_CONFIG['Chờ xác nhận'];

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

                      <span className="text-[10.5px] text-stone-400">({ord.createdAt})</span>
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
                        {(Number(ord.total) || 0).toLocaleString('vi-VN')}đ
                      </span>
                      <span className="text-[10px] text-stone-400 font-medium">
                        {ord.paymentMethod}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        disabled={isProcessing}
                        value={ord.status}
                        onChange={(e) => onUpdateStatus(ord.code, e.target.value)}
                        className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border cursor-pointer focus:outline-none transition-colors ${statusMeta.bg}`}
                      >
                        <option value="Chờ xác nhận">⏳ Chờ xác nhận</option>
                        <option value="Đã nhận cọc">✅ Đã nhận cọc</option>
                        <option value="Đã thanh toán 100%">💰 Đã thanh toán 100%</option>
                        <option value="Đang giao">🚚 Đang giao</option>
                        <option value="Hoàn thành">🎉 Hoàn thành</option>
                        <option value="Đã hủy">❌ Đã hủy</option>
                      </select>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => onDeleteOrder(ord.code)}
                        className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-100 transition-colors"
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