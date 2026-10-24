// src/components/admin/ReviewManagementTab.jsx
import React, { useState, useEffect } from 'react';
import { 
  Search, Star, EyeOff, CheckCircle2, Trash2, Loader2, MessageSquare,
  Globe, Power
} from 'lucide-react';
import { 
  fetchAllReviewsForAdmin, 
  toggleReviewApproval, 
  deleteReviewById 
} from '../../services/orderService';
import { supabase } from '../../supabaseClient';

export default function ReviewManagementTab({ shopConfig = {}, onSaveConfig, onShowToast }) {
  const [reviewsList, setReviewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'approved' | 'pending'
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Trạng thái Bật/Tắt hiển thị đánh giá ngoài Trang chủ
  const [showReviewsOnHome, setShowReviewsOnHome] = useState(() => {
    return shopConfig?.showCustomerReviews !== false && 
           String(shopConfig?.showCustomerReviews).toUpperCase() !== 'FALSE';
  });
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);

  // Đồng bộ lại khi shopConfig từ cha thay đổi
  useEffect(() => {
    if (shopConfig && shopConfig.showCustomerReviews !== undefined) {
      setShowReviewsOnHome(
        shopConfig.showCustomerReviews !== false &&
        String(shopConfig.showCustomerReviews).toUpperCase() !== 'FALSE'
      );
    }
  }, [shopConfig]);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchAllReviewsForAdmin();
    setReviewsList(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Xử lý bật/tắt hiển thị đánh giá ngoài trang chủ
  const handleToggleShowOnHome = async () => {
    setIsUpdatingConfig(true);
    const nextState = !showReviewsOnHome;
    setShowReviewsOnHome(nextState);

    try {
      // 1. Đọc cấu hình 'general' hiện tại trong DB
      const { data: currentRows, error: fetchErr } = await supabase
        .from('shop_configs')
        .select('*')
        .eq('key', 'general')
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      let generalVal = {};
      if (currentRows?.value) {
        generalVal = typeof currentRows.value === 'string' 
          ? JSON.parse(currentRows.value) 
          : currentRows.value;
      }

      // 2. Cập nhật cờ showCustomerReviews
      const updatedGeneral = {
        ...generalVal,
        showCustomerReviews: nextState
      };

      const { error: upsertErr } = await supabase
        .from('shop_configs')
        .upsert(
          { key: 'general', value: updatedGeneral },
          { onConflict: 'key' }
        );

      if (upsertErr) throw upsertErr;

      // 3. Cập nhật state shopConfig ở component cha
      if (onSaveConfig) {
        onSaveConfig({
          ...shopConfig,
          showCustomerReviews: nextState
        });
      }

      if (onShowToast) {
        onShowToast(
          nextState 
            ? 'Đã BẬT hiển thị mục đánh giá ngoài Trang chủ!' 
            : 'Đã ẨN mục đánh giá khỏi Trang chủ!'
        );
      }
    } catch (err) {
      console.error('Lỗi cập nhật cấu hình hiển thị đánh giá:', err);
      // Rollback lại UI nếu lỗi
      setShowReviewsOnHome(!nextState);
      alert('Không thể lưu cấu hình: ' + (err.message || String(err)));
    } finally {
      setIsUpdatingConfig(false);
    }
  };

  const handleToggleApprove = async (rev) => {
    setActionLoadingId(rev.id);
    const res = await toggleReviewApproval(rev.id, rev.is_approved);
    if (res.success) {
      setReviewsList((prev) =>
        prev.map((item) => (item.id === rev.id ? { ...item, is_approved: res.is_approved } : item))
      );
      if (onShowToast) {
        onShowToast(res.is_approved ? 'Đã duyệt hiển thị review!' : 'Đã ẩn review khỏi web!');
      }
    } else {
      alert('Lỗi cập nhật: ' + res.error);
    }
    setActionLoadingId(null);
  };

  const handleDelete = async (revId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá này không?')) return;
    setActionLoadingId(revId);
    const res = await deleteReviewById(revId);
    if (res.success) {
      setReviewsList((prev) => prev.filter((item) => item.id !== revId));
      if (onShowToast) onShowToast('Đã xóa đánh giá thành công!');
    } else {
      alert('Lỗi xóa: ' + res.error);
    }
    setActionLoadingId(null);
  };

  const filteredReviews = reviewsList.filter((rev) => {
    const matchStatus = 
      filterStatus === 'all' ? true :
      filterStatus === 'approved' ? rev.is_approved :
      !rev.is_approved;

    const query = searchTerm.toLowerCase();
    const matchSearch = 
      (rev.order_code && rev.order_code.toLowerCase().includes(query)) ||
      (rev.customer_name && rev.customer_name.toLowerCase().includes(query)) ||
      (rev.content && rev.content.toLowerCase().includes(query));

    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6 sm:space-y-7 font-sans text-stone-800">
      {/* ================= 1. CÔNG TẮC BẬT/TẮT HIỂN THỊ MỤC ĐÁNH GIÁ NGOÀI TRANG CHỦ ================= */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
            <Globe className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                Hiển Thị Đánh Giá Ngoài Trang Chủ
              </h3>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-2xs ${
                showReviewsOnHome 
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-stone-100 text-stone-700 border-stone-300'
              }`}>
                {showReviewsOnHome ? '🟢 Đang hiển thị' : '🔴 Đang ẩn'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 font-normal leading-relaxed">
              Kiểm soát việc có hiển thị mục "Khách Ăn Quả Xứ Nắng Nói Gì" và dải thẻ trượt tự động ngoài Trang chủ hay không.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isUpdatingConfig}
          onClick={handleToggleShowOnHome}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 shrink-0 ${
            showReviewsOnHome
              ? 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-700/20'
          }`}
        >
          {isUpdatingConfig ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Power className="w-4 h-4" />
          )}
          <span>{showReviewsOnHome ? 'Tắt hiển thị ngoài Home' : 'Bật hiển thị ngoài Home'}</span>
        </button>
      </div>

      {/* ================= 2. THANH TÌM KIẾM & BỘ LỌC DUYỆT TỪNG REVIEW ================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã đơn, tên khách, nội dung..."
            className="w-full pl-11 pr-4 py-3 text-xs sm:text-sm rounded-2xl border border-stone-200 bg-stone-50/90 focus:bg-white focus:outline-none focus:border-amber-600 text-stone-900 font-medium shadow-2xs transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 [-ms-overflow-style:none] [scrollbar-width:none]">
          {[
            { id: 'all', label: `Tất cả (${reviewsList.length})` },
            { id: 'approved', label: `Đang hiện (${reviewsList.filter(r => r.is_approved).length})` },
            { id: 'pending', label: `Đang ẩn (${reviewsList.filter(r => !r.is_approved).length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 active:scale-95 shadow-2xs ${
                filterStatus === tab.id
                  ? 'bg-amber-100 text-amber-950 border border-amber-300/80 ring-1 ring-amber-400/30'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ================= 3. DANH SÁCH REVIEW ================= */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-500 text-xs sm:text-sm gap-3 bg-white rounded-3xl border border-stone-200/90 font-medium">
          <Loader2 className="w-7 h-7 animate-spin text-amber-700" />
          <span>Đang đồng bộ đánh giá từ máy chủ...</span>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="py-20 text-center text-stone-400 text-xs sm:text-sm bg-white rounded-3xl border border-dashed border-stone-300 space-y-3 font-medium">
          <MessageSquare className="w-12 h-12 mx-auto text-stone-300 stroke-[1.5]" />
          <p>Chưa có đánh giá nào phù hợp với điều kiện tìm kiếm.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReviews.map((rev) => (
            <div 
              key={rev.id} 
              className={`p-5 sm:p-6 rounded-3xl bg-white border transition-all flex flex-col justify-between space-y-4 shadow-2xs ${
                rev.is_approved ? 'border-stone-200/90' : 'border-amber-300 bg-amber-50/20 ring-1 ring-amber-300/40'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-black text-amber-950 bg-amber-100 px-2.5 py-1 rounded-xl text-xs sm:text-sm border border-amber-300/60 shadow-2xs">
                    {rev.order_code}
                  </span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-2xs ${
                    rev.is_approved 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                      : 'bg-stone-100 text-stone-700 border-stone-300'
                  }`}>
                    {rev.is_approved ? '✓ Hiển thị web' : 'Đang ẩn'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${
                          i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'
                        }`} 
                      />
                    ))}
                  </div>
                  <span className="text-xs text-stone-500 font-mono font-medium">
                    {new Date(rev.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-stone-800 font-normal leading-relaxed italic bg-[#faf8f5] p-3.5 sm:p-4 rounded-2xl border border-stone-200/60 min-h-[72px]">
                  "{rev.content}"
                </p>

                <div className="text-xs sm:text-sm text-stone-600 pt-1.5 flex justify-between items-center border-t border-stone-100 font-medium">
                  <strong className="text-stone-900 font-black text-sm">{rev.customer_name}</strong>
                  {rev.customer_phone && (
                    <span className="font-mono text-stone-500 text-xs">
                      SĐT: ...{rev.customer_phone.slice(-4)}
                    </span>
                  )}
                </div>
              </div>

              {/* Thao tác Duyệt / Ẩn / Xóa từng review */}
              <div className="flex items-center gap-2.5 pt-2.5 border-t border-stone-100">
                <button
                  type="button"
                  disabled={actionLoadingId === rev.id}
                  onClick={() => handleToggleApprove(rev)}
                  className={`flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 ${
                    rev.is_approved
                      ? 'bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20'
                  }`}
                >
                  {actionLoadingId === rev.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : rev.is_approved ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span>Ẩn khỏi web</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Duyệt hiển thị</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={actionLoadingId === rev.id}
                  onClick={() => handleDelete(rev.id)}
                  className="p-3 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                  title="Xóa đánh giá này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}