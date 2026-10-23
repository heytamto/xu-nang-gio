// src/components/admin/BankReconciliationModal.jsx
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  Upload, CheckCircle2, AlertCircle, X, Loader2, 
  FileSpreadsheet, ArrowRight, AlertTriangle 
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { ORDER_STATUS } from '../../constants/orderStatus';

export default function BankReconciliationModal({ isOpen, onClose, orders = [], onRefreshOrders }) {
  const fileInputRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchResults, setMatchResults] = useState(null);
  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setMatchResults(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(rows.length, 25); i++) {
        const rowText = (rows[i] || []).join(' ').toLowerCase();
        if (
          (rowText.includes('nội dung') || rowText.includes('diễn giải') || rowText.includes('description')) &&
          (rowText.includes('số tiền') || rowText.includes('ghi có') || rowText.includes('credit') || rowText.includes('phát sinh tăng'))
        ) {
          headerRowIndex = i;
          break;
        }
      }

      const headers = headerRowIndex !== -1 
        ? rows[headerRowIndex].map((h) => String(h || '').trim().toLowerCase()) 
        : [];
      
      const contentColIdx = headers.findIndex((h) => 
        h.includes('nội dung') || h.includes('diễn giải') || h.includes('description')
      );
      const creditColIdx = headers.findIndex((h) => 
        h.includes('ghi có') || h.includes('phát sinh tăng') || h.includes('số tiền vào') || h.includes('credit')
      );
      
      const rawTransactions = [];
      const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;

      for (let r = startRow; r < rows.length; r++) {
        const row = rows[r];
        if (!row || !row.length) continue;

        let contentStr = '';
        let amountNum = 0;

        if (contentColIdx !== -1 && creditColIdx !== -1) {
          contentStr = String(row[contentColIdx] || '');
          const rawAmount = String(row[creditColIdx] || '').replace(/[^0-9]/g, '');
          amountNum = Number(rawAmount) || 0;
        } else {
          row.forEach((cell) => {
            const cellStr = String(cell || '');
            if (cellStr.toUpperCase().includes('XNG')) contentStr = cellStr;
            const parsedNum = Number(cellStr.replace(/[^0-9]/g, ''));
            if (parsedNum >= 10000 && parsedNum <= 50000000) amountNum = parsedNum;
          });
        }

        if (contentStr && amountNum > 0) {
          rawTransactions.push({ content: contentStr, amount: amountNum, rawRow: row });
        }
      }

      const matched = [];
      const unmatched = [];
      const ordersMap = new Map(orders.map((o) => [String(o.code).toUpperCase().trim(), o]));

      rawTransactions.forEach((tx) => {
        const match = tx.content.toUpperCase().match(/XNG[A-Z0-9\-_]+/);
        const extractedCode = match ? match[0] : null;

        if (extractedCode && ordersMap.has(extractedCode)) {
          const ord = ordersMap.get(extractedCode);
          const reqDeposit = ord.payment_method === 'deposit' 
            ? (ord.deposit_paid || 50000) 
            : (ord.final_total || ord.total || 0);
          const isEnough = tx.amount >= reqDeposit;

          matched.push({
            orderCode: ord.code,
            customerName: ord.customer_name || ord.name,
            currentStatus: ord.status,
            alreadyPaid: ord.payment_verified,
            receivedAmount: tx.amount,
            expectedAmount: reqDeposit,
            isEnough,
            content: tx.content,
            orderId: ord.id
          });
        } else {
          unmatched.push(tx);
        }
      });

      setMatchResults({
        totalFound: rawTransactions.length,
        matched,
        unmatched
      });
    } catch (err) {
      console.error('Lỗi phân tích file Excel:', err);
      alert('Không thể đọc file sao kê. Vui lòng đảm bảo đúng định dạng Excel/CSV từ MB Bank.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyUpdates = async () => {
    if (!matchResults?.matched?.length) return;
    
    const pendingUpdates = matchResults.matched.filter((m) => !m.alreadyPaid && m.isEnough);
    if (!pendingUpdates.length) {
      alert('Tất cả các đơn đối soát đều đã được duyệt trước đó!');
      return;
    }

    if (!window.confirm(`Xác nhận cập nhật thanh toán cho ${pendingUpdates.length} đơn hàng chưa duyệt?`)) return;

    setIsApplying(true);
    let successCount = 0;

    for (const item of pendingUpdates) {
      try {
        const { error } = await supabase
          .from('orders')
          .update({
            status: ORDER_STATUS.CONFIRMED,
            payment_verified: true,
            deposit_paid: item.receivedAmount,
            payment_verified_at: new Date().toISOString()
          })
          .eq('code', item.orderCode);

        if (!error) {
          successCount++;
          supabase.functions.invoke('send-order-email', {
            body: {
              template: 'payment_success',
              order_code: item.orderCode,
              deposit_paid: item.receivedAmount
            }
          }).catch(() => {});
        }
      } catch (e) {
        console.warn(`Lỗi cập nhật đơn ${item.orderCode}:`, e);
      }
    }

    setIsApplying(false);
    alert(`Đã hoàn tất đối soát! Cập nhật thành công ${successCount}/${pendingUpdates.length} đơn.`);
    if (onRefreshOrders) onRefreshOrders();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-stone-900">Đối Soát & Kiểm Tra Sao Kê</h3>
              <p className="text-xs text-stone-500">So khớp chéo số dư thực nhận từ App MB Bank với đơn hàng</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 overflow-y-auto">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-stone-300 hover:border-amber-600 rounded-2xl p-6 text-center cursor-pointer bg-stone-50/60 hover:bg-amber-50/30 transition-colors"
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
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-xs font-bold">Đang quét dòng giao dịch và mã XNG...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-stone-600">
                <Upload className="w-8 h-8 text-amber-700" />
                <span className="text-xs font-bold">Tải lên file sao kê MB Bank (.xlsx, .csv)</span>
                <span className="text-[11px] text-stone-400">Kiểm tra đơn đã chuyển khoản, đơn thiếu tiền cọc và tiền không rõ cú pháp</span>
              </div>
            )}
          </div>

          {matchResults && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs">
                  <span className="text-emerald-800 font-bold block">Đơn khớp mã: {matchResults.matched.length}</span>
                  <span className="text-[11px] text-emerald-600">Đã nhận diện chính xác theo mã đơn</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs">
                  <span className="text-amber-800 font-bold block">Giao dịch ngoài luồng: {matchResults.unmatched.length}</span>
                  <span className="text-[11px] text-amber-700">Không có mã XNG (cần kiểm tra tay)</span>
                </div>
              </div>

              <div className="border border-stone-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-stone-100 text-stone-600 font-bold text-[11px] sticky top-0">
                    <tr>
                      <th className="p-2.5">Mã đơn</th>
                      <th className="p-2.5">Khách hàng</th>
                      <th className="p-2.5">Số tiền vào</th>
                      <th className="p-2.5">Kết quả đối chiếu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {matchResults.matched.map((item, idx) => (
                      <tr key={idx} className="hover:bg-stone-50">
                        <td className="p-2.5 font-mono font-bold text-stone-900">{item.orderCode}</td>
                        <td className="p-2.5 text-stone-700">{item.customerName}</td>
                        <td className="p-2.5 font-bold text-emerald-700">+{item.receivedAmount.toLocaleString('vi-VN')}đ</td>
                        <td className="p-2.5">
                          {item.alreadyPaid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded font-semibold">
                              <CheckCircle2 className="w-3 h-3 text-stone-400" />
                              Đã xác nhận trước
                            </span>
                          ) : item.isEnough ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Khớp cọc hoàn hảo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 bg-rose-100 px-2 py-0.5 rounded font-bold">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              Thiếu tiền cọc
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-bold text-stone-700 cursor-pointer"
          >
            Đóng
          </button>

          {matchResults?.matched?.some((m) => !m.alreadyPaid && m.isEnough) && (
            <button
              type="button"
              disabled={isApplying}
              onClick={handleApplyUpdates}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Đồng Bộ {matchResults.matched.filter((m) => !m.alreadyPaid && m.isEnough).length} Đơn Vào Kho Đóng Gói</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}