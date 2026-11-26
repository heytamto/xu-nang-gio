// src/components/admin/dashboard/DashboardMetricsCard.jsx
import React from 'react';
import { Database, Loader2 } from 'lucide-react';

const formatMoney = (val) => (Number(val) || 0).toLocaleString('vi-VN');
const formatNumber = (val) => Number(val) || 0;

export default function DashboardMetricsCard({ metrics = {}, totalOrdersCount = 0, isLoading = false }) {
  const lossRate = Number(metrics.lossRate) || 0;
  const totalRevenue = formatMoney(metrics.totalRevenue ?? metrics.revenue);
  const realReceivedMoney = formatMoney(metrics.realReceivedMoney ?? metrics.collectedRevenue);
  const totalOrders = formatNumber(metrics.totalOrders ?? totalOrdersCount);
  const avgOrderValue = formatMoney(metrics.avgOrderValue);
  const cancelledCount = formatNumber(metrics.cancelledCount);
  const bombedCount = formatNumber(metrics.bombedCount);
  const retainedDeposit = formatMoney(metrics.retainedDeposit);

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs overflow-hidden font-sans">
      {/* HEADER */}
      <div className="px-5 py-4 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-stone-50/60 to-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-inner">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                Thống Kê Doanh Thu & Vận Hành
              </h2>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin text-amber-600" />}
              <span className="font-mono text-xs font-black bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-full border border-stone-200">
                {totalOrdersCount} đơn hệ thống
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              Đồng bộ thời gian thực Supabase PostgreSQL
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-stone-50 border border-stone-200 shadow-2xs">
            <span className="text-xs sm:text-sm text-stone-600 font-bold">Tỷ lệ hủy/bom:</span>
            <span className={`font-mono font-black text-sm sm:text-base ${lossRate > 15 ? 'text-rose-600' : 'text-stone-900'}`}>
              {lossRate}%
            </span>
          </div>
        </div>
      </div>

      {/* LƯỚI 4 CHỈ SỐ KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-stone-100 p-1 bg-white">
        <div className="p-5 flex flex-col justify-between space-y-2.5 hover:bg-stone-50/50 transition-colors">
          <span className="text-sm font-bold text-stone-600">Doanh Thu Dự Kiến</span>
          <div>
            <p className="text-xl sm:text-2xl font-black text-stone-900 font-mono tracking-tight">
              {totalRevenue}đ
            </p>
            <span className="text-xs text-stone-400 block font-normal mt-1">
              (Không tính đơn hủy & bom)
            </span>
          </div>
        </div>

        <div className="p-5 flex flex-col justify-between space-y-2.5 hover:bg-emerald-50/30 transition-colors">
          <span className="text-sm font-bold text-emerald-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Tiền Thực Nhận (Đã CK)</span>
          </span>
          <div>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 font-mono tracking-tight">
              {realReceivedMoney}đ
            </p>
            <span className="text-xs text-emerald-800/80 block font-medium mt-1">
              Đơn đã xác nhận & duyệt tiền
            </span>
          </div>
        </div>

        <div className="p-5 flex flex-col justify-between space-y-2.5 hover:bg-stone-50/50 transition-colors">
          <span className="text-sm font-bold text-stone-600">Số Đơn Hiệu Lực</span>
          <div>
            <p className="text-xl sm:text-2xl font-black text-stone-900 font-mono tracking-tight">
              {totalOrders} <span className="text-sm font-bold text-stone-400">đơn</span>
            </p>
            <span className="text-xs text-stone-400 block font-normal mt-1">
              Đang vận hành & hoàn tất
            </span>
          </div>
        </div>

        <div className="p-5 flex flex-col justify-between space-y-2.5 hover:bg-amber-50/30 transition-colors">
          <span className="text-sm font-bold text-amber-950">Giá Trị TB / Đơn (AOV)</span>
          <div>
            <p className="text-xl sm:text-2xl font-black text-amber-950 font-mono tracking-tight">
              {avgOrderValue}đ
            </p>
            <span className="text-xs text-stone-500 block font-normal mt-1">
              Bình quân giá trị mỗi giỏ hàng
            </span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="px-5 py-3 bg-[#faf8f5] border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex flex-wrap items-center gap-4 text-stone-700">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="font-semibold">Đơn Hủy:</span>
            <strong className="text-stone-900 font-mono font-black text-sm">{cancelledCount}</strong>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-700"></span>
            <span className="font-semibold">Bom Hàng:</span>
            <strong className="text-red-700 font-mono font-black text-sm">{bombedCount}</strong>
          </div>

          <span className="text-stone-300">|</span>

          <div className="flex items-center gap-2">
            <span className="font-semibold">Cọc giữ lại bù tiền xe:</span>
            <strong className="text-emerald-900 font-mono font-black text-xs sm:text-sm bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-300 shadow-2xs">
              +{retainedDeposit}đ
            </strong>
          </div>
        </div>

        <span className="text-xs text-stone-400 italic">
          Chỉ số cập nhật tự động theo trạng thái đơn
        </span>
      </div>
    </div>
  );
}