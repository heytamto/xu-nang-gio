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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-stone-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200 shadow-2xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-stone-900">Kiểm Tra Chéo Sao Kê Ngân Hàng</h3>
              <p className="text-xs text-stone-500">Chỉ đọc & đối chiếu số tiền thực nhận với đơn hàng trong kỳ sao kê</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thân Modal */}
        <div className="py-4 space-y-4 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
          
          {/* Khu vực Upload file */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-stone-300 hover:border-amber-600 rounded-2xl p-5 text-center cursor-pointer bg-stone-50/60 hover:bg-amber-50/30 transition-colors"
          >
            <input 
              ref={fileInputRef} 
              type="file" 
              accept=".xlsx,.xls,.csv" 
              className="hidden" 
              onChange={handleFileUpload} 
            />
            {isProcessing ? (
              <div className="flex flex-col items-center gap-2 text-amber-700">
                <Loader2 className="w-7 h-7 animate-spin" />
                <span className="text-xs font-bold">Đang phân tích giao dịch theo mốc thời gian...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-stone-600">
                <Upload className="w-7 h-7 text-amber-700" />
                <span className="text-xs font-bold">Tải lên file sao kê MB Bank (.xlsx, .csv)</span>
                <span className="text-[11px] text-stone-400">Hệ thống sẽ tự lọc và so sánh với các đơn trong khoảng thời gian này</span>
              </div>
            )}
          </div>

          {/* Kết quả sau khi phân tích */}
          {reconData && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Thẻ tóm tắt thông số kỳ sao kê */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-stone-700">
                  <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Kỳ sao kê: <strong className="font-semibold text-stone-900">{reconData.timeRangeText}</strong></span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-stone-600">
                  <span>Tổng tiền vào: <strong className="font-mono font-bold text-stone-900">{reconData.totalBankAmount.toLocaleString('vi-VN')}đ</strong></span>
                  <span>Khớp đơn: <strong className="font-mono font-bold text-emerald-700">{reconData.totalMatchedAmount.toLocaleString('vi-VN')}đ</strong></span>
                </div>
              </div>

              {/* Bộ lọc tab */}
              <div className="flex items-center gap-2 border-b border-stone-100 pb-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                    filterTab === 'all' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Tất cả khớp mã ({reconData.matched.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('discrepancy')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                    filterTab === 'discrepancy' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Lệch số tiền ({reconData.discrepancies.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('unmatched')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                    filterTab === 'unmatched' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  Không có mã XNG ({reconData.unmatched.length})
                </button>
              </div>

              {/* Bảng chi tiết */}
              <div className="border border-stone-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto text-xs">
                {filterTab === 'unmatched' ? (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-stone-100 text-stone-600 font-bold text-[11px] sticky top-0">
                      <tr>
                        <th className="p-2.5">Thời gian</th>
                        <th className="p-2.5">Số tiền</th>
                        <th className="p-2.5">Nội dung chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {reconData.unmatched.map((tx, idx) => (
                        <tr key={idx} className="hover:bg-stone-50">
                          <td className="p-2.5 text-stone-500 font-mono text-[11px] whitespace-nowrap">
                            {tx.date ? tx.date.toLocaleString('vi-VN') : '—'}
                          </td>
                          <td className="p-2.5 font-bold font-mono text-stone-900">
                            +{tx.amount.toLocaleString('vi-VN')}đ
                          </td>
                          <td className="p-2.5 text-stone-600 font-mono text-[11px]">
                            {tx.content}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-stone-100 text-stone-600 font-bold text-[11px] sticky top-0">
                      <tr>
                        <th className="p-2.5">Mã đơn</th>
                        <th className="p-2.5">Khách hàng</th>
                        <th className="p-2.5">Tiền vào</th>
                        <th className="p-2.5">Cần thu</th>
                        <th className="p-2.5">Đối chiếu chênh lệch</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {displayedList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-stone-50">
                          <td className="p-2.5 font-mono font-bold text-stone-900">{item.orderCode}</td>
                          <td className="p-2.5 text-stone-700">
                            <div>{item.customerName}</div>
                            <span className="text-[10px] text-stone-400 font-mono">{item.phone}</span>
                          </td>
                          <td className="p-2.5 font-bold font-mono text-emerald-700">
                            +{item.txAmount.toLocaleString('vi-VN')}đ
                          </td>
                          <td className="p-2.5 font-mono text-stone-600">
                            {item.expectedAmount.toLocaleString('vi-VN')}đ
                          </td>
                          <td className="p-2.5">
                            {item.status === 'exact' ? (
                              <span className="inline-flex items-center gap-1 text-[10.5px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Chuẩn 100%
                              </span>
                            ) : item.status === 'over' ? (
                              <span className="inline-flex items-center gap-1 text-[10.5px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-bold border border-blue-200">
                                Thừa +{item.diff.toLocaleString('vi-VN')}đ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10.5px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md font-bold border border-rose-200">
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
        <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
          <span className="text-[11px] text-stone-400 italic">
            * Dữ liệu chỉ dùng để kiểm tra sổ sách kế toán, không làm thay đổi trạng thái đơn hàng.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-xs font-bold text-white cursor-pointer transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}