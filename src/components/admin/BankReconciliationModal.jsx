// src/components/admin/BankReconciliationModal.jsx
import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Upload, CheckCircle2, AlertCircle, X, Loader2, 
  FileSpreadsheet, Calendar, AlertTriangle, HelpCircle, ArrowUpDown
} from 'lucide-react';
import { resolveDepositAmount } from '../../config/shopConfig';

function parseTxDate(rawDateStr) {
  if (!rawDateStr) return null;
  if (rawDateStr instanceof Date) return rawDateStr;
  const str = String(rawDateStr).trim();
  
  // Hỗ trợ dạng DD/MM/YYYY hoặc DD/MM/YYYY HH:mm:ss
  const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (match) {
    const [, d, m, y, hr = '0', min = '0', sec = '0'] = match;
    const dt = new Date(Number(y), Number(m) - 1, Number(d), Number(hr), Number(min), Number(sec));
    return isNaN(dt.getTime()) ? null : dt;
  }
  
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export default function BankReconciliationModal({ 
  isOpen, 
  onClose, 
  orders = [], 
  shopConfig = {} 
}) {
  const fileInputRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reconData, setReconData] = useState(null);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'matched' | 'unmatched' | 'discrepancy'

  if (!isOpen) return null;

  const defaultDeposit = resolveDepositAmount(shopConfig);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setReconData(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(rows.length, 25); i++) {
        const rowText = (rows[i] || []).join(' ').toLowerCase();
        if (
          (rowText.includes('nội dung') || rowText.includes('diễn giải') || rowText.includes('description') || rowText.includes('chi tiết')) &&
          (rowText.includes('số tiền') || rowText.includes('ghi có') || rowText.includes('credit') || rowText.includes('phát sinh tăng'))
        ) {
          headerRowIndex = i;
          break;
        }
      }

      const headers = headerRowIndex !== -1 
        ? rows[headerRowIndex].map((h) => String(h || '').trim().toLowerCase()) 
        : [];
      
      const dateColIdx = headers.findIndex((h) => 
        h.includes('ngày') || h.includes('date') || h.includes('thời gian')
      );
      const contentColIdx = headers.findIndex((h) => 
        h.includes('nội dung') || h.includes('diễn giải') || h.includes('description') || h.includes('chi tiết')
      );
      const creditColIdx = headers.findIndex((h) => 
        h.includes('ghi có') || h.includes('phát sinh tăng') || h.includes('số tiền vào') || h.includes('credit') || h.includes('tiền vào')
      );
      
      const parsedTransactions = [];
      const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;
      let minTxTime = Infinity;
      let maxTxTime = -Infinity;

      for (let r = startRow; r < rows.length; r++) {
        const row = rows[r];
        if (!row || !row.length) continue;

        let contentStr = '';
        let amountNum = 0;
        let txDate = null;

        if (contentColIdx !== -1 && creditColIdx !== -1) {
          contentStr = String(row[contentColIdx] || '');
          const rawAmount = String(row[creditColIdx] || '').replace(/[^0-9]/g, '');
          amountNum = Number(rawAmount) || 0;
          if (dateColIdx !== -1) {
            txDate = parseTxDate(row[dateColIdx]);
          }
        } else {
          row.forEach((cell) => {
            const cellStr = String(cell || '');
            if (cellStr.toUpperCase().includes('XNG')) contentStr = cellStr;
            const parsedNum = Number(cellStr.replace(/[^0-9]/g, ''));
            if (parsedNum >= 10000 && parsedNum <= 50000000) amountNum = parsedNum;
          });
        }

        if (contentStr && amountNum > 0) {
          if (txDate) {
            const timeVal = txDate.getTime();
            if (timeVal < minTxTime) minTxTime = timeVal;
            if (timeVal > maxTxTime) maxTxTime = timeVal;
          }
          parsedTransactions.push({ 
            content: contentStr, 
            amount: amountNum, 
            date: txDate,
            rawRow: row 
          });
        }
      }

      // Lọc danh sách đơn hàng thuộc phạm vi thời gian của sao kê (nếu xác định được ngày bắt đầu & kết thúc)
      const hasDateRange = minTxTime !== Infinity && maxTxTime !== -Infinity;
      
      // Cho biên độ giãn ±1 ngày để phòng trường hợp khách đặt tối hôm trước, sáng hôm sau mới chuyển khoản
      const bufferMs = 24 * 60 * 60 * 1000;
      const rangeStart = hasDateRange ? minTxTime - bufferMs : null;
      const rangeEnd = hasDateRange ? maxTxTime + bufferMs : null;

      const filteredOrders = orders.filter((o) => {
        if (!hasDateRange) return true;
        const oTime = new Date(o.created_at || o.createdAt).getTime();
        if (isNaN(oTime)) return true;
        return oTime >= rangeStart && oTime <= rangeEnd;
      });

      const ordersMap = new Map();
      filteredOrders.forEach((o) => {
        const c = String(o.code || o.orderCode || '').toUpperCase().trim();
        if (c) ordersMap.set(c, o);
      });

      const matchedRows = [];
      const unmatchedRows = [];
      const discrepancyRows = [];

      let totalBankAmount = 0;
      let totalMatchedAmount = 0;

      parsedTransactions.forEach((tx) => {
        totalBankAmount += tx.amount;
        const match = tx.content.toUpperCase().match(/XNG[A-Z0-9\-_]+/);
        const extractedCode = match ? match[0] : null;

        if (extractedCode && ordersMap.has(extractedCode)) {
          const ord = ordersMap.get(extractedCode);
          const finalTotal = Number(ord.final_total ?? ord.total ?? 0);
          const expectedDeposit = Number(ord.deposit_amount_expected ?? ord.deposit_paid ?? defaultDeposit);
          const requiredAmount = ord.payment_method === 'deposit' 
            ? Math.min(expectedDeposit, finalTotal) 
            : finalTotal;

          const diff = tx.amount - requiredAmount;
          const status = diff === 0 ? 'exact' : (diff > 0 ? 'over' : 'under');

          const rowData = {
            orderCode: ord.code || ord.orderCode,
            customerName: ord.customer_name || ord.name,
            phone: ord.phone,
            currentStatus: ord.status,
            txAmount: tx.amount,
            expectedAmount: requiredAmount,
            diff,
            status, // 'exact' | 'over' | 'under'
            content: tx.content,
            txDate: tx.date ? tx.date.toLocaleString('vi-VN') : 'Không rõ ngày'
          };

          matchedRows.push(rowData);
          totalMatchedAmount += tx.amount;

          if (status !== 'exact') {
            discrepancyRows.push(rowData);
          }
        } else {
          unmatchedRows.push(tx);
        }
      });

      setReconData({
        totalTransactions: parsedTransactions.length,
        totalBankAmount,
        totalMatchedAmount,
        timeRangeText: hasDateRange 
          ? `${new Date(minTxTime).toLocaleDateString('vi-VN')} - ${new Date(maxTxTime).toLocaleDateString('vi-VN')}` 
          : 'Toàn bộ danh sách sao kê',
        ordersInRangeCount: filteredOrders.length,
        matched: matchedRows,
        unmatched: unmatchedRows,
        discrepancies: discrepancyRows
      });

    } catch (err) {
      console.error('Lỗi đối soát sao kê:', err);
      alert('Không thể đọc file sao kê. Vui lòng kiểm tra định dạng file Excel/CSV từ app ngân hàng.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const displayedList = useMemo(() => {
    if (!reconData) return [];
    if (filterTab === 'matched') return reconData.matched;
    if (filterTab === 'discrepancy') return reconData.discrepancies;
    if (filterTab === 'unmatched') return reconData.unmatched;
    return reconData.matched;
  }, [reconData, filterTab]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 sm:p-6 backdrop-blur-xs animate-fadeIn font-sans text-stone-800">
      {/* Khung modal chuẩn rộng max-w-5xl (1024px) */}
      <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 flex flex-col max-h-[92vh] space-y-5">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200/80 shadow-2xs shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black text-stone-900 tracking-tight">
                Kiểm Tra Chéo Sao Kê Ngân Hàng
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 font-medium mt-0.5">
                Chỉ đọc & đối chiếu số tiền thực nhận với đơn hàng trong kỳ sao kê
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="w-10 h-10 rounded-2xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thân Modal */}
        <div className="space-y-5 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
          
          {/* Khu vực Upload file */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-stone-300 hover:border-amber-600 rounded-3xl p-6 sm:p-8 text-center cursor-pointer bg-stone-50/60 hover:bg-amber-50/30 transition-all shadow-2xs group"
          >
            <input 
              ref={fileInputRef} 
              type="file" 
              accept=".xlsx,.xls,.csv" 
              className="hidden" 
              onChange={handleFileUpload} 
            />
            {isProcessing ? (
              <div className="flex flex-col items-center gap-2.5 text-amber-700">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-xs sm:text-sm font-bold">Đang phân tích giao dịch theo mốc thời gian...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-stone-600">
                <div className="w-12 h-12 rounded-2xl bg-amber-100/70 text-amber-800 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                  <Upload className="w-6 h-6 text-amber-800" />
                </div>
                <span className="text-sm sm:text-base font-bold text-stone-800">Tải lên file sao kê MB Bank (.xlsx, .csv)</span>
                <span className="text-xs text-stone-400 font-normal">Hệ thống sẽ tự lọc và so sánh với các đơn trong khoảng thời gian này</span>
              </div>
            )}
          </div>

          {/* Kết quả sau khi phân tích */}
          {reconData && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Thẻ tóm tắt thông số kỳ sao kê */}
              <div className="p-4 sm:p-5 bg-stone-50 rounded-2xl border border-stone-200/80 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2.5 text-stone-700">
                  <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Kỳ sao kê: <strong className="font-bold text-stone-900">{reconData.timeRangeText}</strong></span>
                </div>
                <div className="flex items-center gap-5 text-xs sm:text-sm text-stone-600 font-medium">
                  <span>Tổng tiền vào: <strong className="font-mono font-black text-stone-900">{reconData.totalBankAmount.toLocaleString('vi-VN')}đ</strong></span>
                  <span>Khớp đơn: <strong className="font-mono font-black text-emerald-700">{reconData.totalMatchedAmount.toLocaleString('vi-VN')}đ</strong></span>
                </div>
              </div>

              {/* Bộ lọc tab chuẩn h-11 */}
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3 text-xs sm:text-sm overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className={`h-11 px-4 rounded-2xl font-bold transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95 ${
                    filterTab === 'all' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  Tất cả khớp mã ({reconData.matched.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('discrepancy')}
                  className={`h-11 px-4 rounded-2xl font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-2xs active:scale-95 ${
                    filterTab === 'discrepancy' ? 'bg-amber-700 text-white shadow-xs' : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Lệch số tiền ({reconData.discrepancies.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('unmatched')}
                  className={`h-11 px-4 rounded-2xl font-bold transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95 ${
                    filterTab === 'unmatched' ? 'bg-rose-700 text-white shadow-xs' : 'bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  Không có mã XNG ({reconData.unmatched.length})
                </button>
              </div>

              {/* Bảng chi tiết mở rộng */}
              <div className="border border-stone-200 rounded-3xl overflow-hidden max-h-80 overflow-y-auto text-xs sm:text-sm shadow-2xs">
                {filterTab === 'unmatched' ? (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-stone-100 text-stone-700 font-bold text-xs sticky top-0 border-b border-stone-200">
                      <tr>
                        <th className="p-3.5">Thời gian</th>
                        <th className="p-3.5">Số tiền</th>
                        <th className="p-3.5">Nội dung chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 bg-white">
                      {reconData.unmatched.map((tx, idx) => (
                        <tr key={idx} className="hover:bg-stone-50/80 transition-colors">
                          <td className="p-3.5 text-stone-500 font-mono text-xs whitespace-nowrap">
                            {tx.date ? tx.date.toLocaleString('vi-VN') : '—'}
                          </td>
                          <td className="p-3.5 font-bold font-mono text-emerald-800 text-xs sm:text-sm whitespace-nowrap">
                            +{tx.amount.toLocaleString('vi-VN')}đ
                          </td>
                          <td className="p-3.5 text-stone-700 font-mono text-xs leading-relaxed">
                            {tx.content}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-stone-100 text-stone-700 font-bold text-xs sticky top-0 border-b border-stone-200">
                      <tr>
                        <th className="p-3.5">Mã đơn</th>
                        <th className="p-3.5">Khách hàng</th>
                        <th className="p-3.5">Tiền vào</th>
                        <th className="p-3.5">Cần thu</th>
                        <th className="p-3.5">Đối chiếu chênh lệch</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 bg-white">
                      {displayedList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-stone-50/80 transition-colors">
                          <td className="p-3.5 font-mono font-black text-amber-950 text-xs sm:text-sm whitespace-nowrap">
                            {item.orderCode}
                          </td>
                          <td className="p-3.5 text-stone-800">
                            <div className="font-bold text-stone-900">{item.customerName}</div>
                            <span className="text-xs text-stone-500 font-mono font-medium">{item.phone}</span>
                          </td>
                          <td className="p-3.5 font-black font-mono text-emerald-700 text-xs sm:text-sm whitespace-nowrap">
                            +{item.txAmount.toLocaleString('vi-VN')}đ
                          </td>
                          <td className="p-3.5 font-mono font-bold text-stone-700 text-xs sm:text-sm whitespace-nowrap">
                            {item.expectedAmount.toLocaleString('vi-VN')}đ
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            {item.status === 'exact' ? (
                              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl font-bold border border-emerald-200 shadow-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Chuẩn 100%
                              </span>
                            ) : item.status === 'over' ? (
                              <span className="inline-flex items-center gap-1.5 text-xs text-blue-800 bg-blue-50 px-3 py-1 rounded-xl font-bold border border-blue-200 shadow-2xs">
                                Thừa +{item.diff.toLocaleString('vi-VN')}đ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs text-rose-800 bg-rose-50 px-3 py-1 rounded-xl font-bold border border-rose-200 shadow-2xs">
                                Thiếu {Math.abs(item.diff).toLocaleString('vi-VN')}đ
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-stone-400 italic font-medium">
            * Dữ liệu chỉ dùng để kiểm tra sổ sách kế toán, không làm thay đổi trạng thái đơn hàng.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-6 rounded-2xl bg-stone-900 hover:bg-stone-800 text-xs sm:text-sm font-bold text-white cursor-pointer transition-all shadow-xs active:scale-95"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}