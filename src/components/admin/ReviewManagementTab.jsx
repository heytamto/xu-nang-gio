// src/components/admin/ReviewManagementTab.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, Star, EyeOff, CheckCircle2, Trash2, Loader2, MessageSquare,
  Globe, Power, PackageCheck, Camera, X, Square, CheckSquare, Layers
} from 'lucide-react';
import { reviewRepo, shopConfigRepo } from '../../repositories';

export default function ReviewManagementTab({ 
  shopConfig = {}, 
  onSaveConfig, 
  onShowToast,
  setConfirmModalConfig 
}) {
  const [reviewsList, setReviewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'approved' | 'pending'
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [previewZoomImage, setPreviewZoomImage] = useState(null);

  // State chọn nhiều đánh giá
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Trạng thái Bật/Tắt hiển thị đánh giá ngoài Trang chủ
  const [showReviewsOnHome, setShowReviewsOnHome] = useState(() => {
    return shopConfig?.showCustomerReviews !== false && 
           String(shopConfig?.showCustomerReviews).toUpperCase() !== 'FALSE';
  });
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);

  useEffect(() => {
    if (shopConfig && shopConfig.showCustomerReviews !== undefined) {
      setShowReviewsOnHome(
        shopConfig.showCustomerReviews !== false &&
        String(shopConfig.showCustomerReviews).toUpperCase() !== 'FALSE'
      );
    }
  }, [shopConfig]);

  // 1. Tải danh sách đánh giá qua reviewRepo
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reviewRepo.getAll();
      if (Array.isArray(data)) {
        const sorted = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setReviewsList(sorted);
      }
    } catch (err) {
      console.error('Lỗi tải đánh giá qua reviewRepo:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 2. Bật/tắt hiển thị đánh giá ngoài trang chủ
  const handleToggleShowOnHome = async () => {
    setIsUpdatingConfig(true);
    const nextState = !showReviewsOnHome;
    setShowReviewsOnHome(nextState);

    try {
      const configs = await shopConfigRepo.getAll();
      const currentGeneralRow = configs.find((c) => c.key === 'general');
      
      let generalVal = currentGeneralRow?.value || {};
      if (typeof generalVal === 'string') {
        try {
          generalVal = JSON.parse(generalVal);
        } catch {
          generalVal = {};
        }
      }

      const updatedGeneral = {
        ...generalVal,
        showCustomerReviews: nextState
      };

      await shopConfigRepo.update('general', {
        value: updatedGeneral,
        updated_at: new Date().toISOString()
      }, 'key');

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
      setShowReviewsOnHome(!nextState);
      if (onShowToast) onShowToast('Không thể lưu cấu hình: ' + err.message);
    } finally {
      setIsUpdatingConfig(false);
    }
  };

  // 3. Duyệt / Ẩn 1 bài đánh giá
  const handleToggleApprove = async (rev) => {
    setActionLoadingId(rev.id);
    const nextApproved = !rev.is_approved;

    try {
      await reviewRepo.update(rev.id, { is_approved: nextApproved });
      setReviewsList((prev) =>
        prev.map((item) => (item.id === rev.id ? { ...item, is_approved: nextApproved } : item))
      );
      if (onShowToast) {
        onShowToast(nextApproved ? 'Đã duyệt hiển thị review!' : 'Đã ẩn review khỏi web!');
      }
    } catch (err) {
      console.error('Lỗi duyệt review:', err);
      if (onShowToast) onShowToast('Lỗi cập nhật: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 4. Xóa 1 bài đánh giá
  const handleDelete = (revId, orderCode) => {
    const executeDelete = async () => {
      setActionLoadingId(revId);
      try {
        await reviewRepo.remove(revId);
        setReviewsList((prev) => prev.filter((item) => item.id !== revId));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(revId);
          return next;
        });
        if (onShowToast) onShowToast('Đã xóa đánh giá thành công!');
      } catch (err) {
        console.error('Lỗi xóa review:', err);
        if (onShowToast) onShowToast('Lỗi xóa: ' + err.message);
      } finally {
        setActionLoadingId(null);
      }
    };

    if (setConfirmModalConfig) {
      setConfirmModalConfig({
        isAlert: false,
        title: 'Xóa Đánh Giá',
        message: `Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá của đơn hàng #${orderCode || revId}?`,
        confirmLabel: 'Xác nhận xóa',
        onConfirm: executeDelete
      });
      return;
    }

    if (window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá này không?')) {
      executeDelete();
    }
  };

  // 5. Lọc danh sách đánh giá
  const filteredReviews = useMemo(() => {
    return reviewsList.filter((rev) => {
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
  }, [reviewsList, filterStatus, searchTerm]);

  // 6. Xử lý chọn/bỏ chọn
  const handleToggleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isAllSelected = filteredReviews.length > 0 && filteredReviews.every((r) => selectedIds.has(r.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredReviews.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredReviews.forEach((r) => next.add(r.id));
        return next;
      });
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // 7. Thao tác hàng loạt: Duyệt hoặc Ẩn tất cả đánh giá đã chọn
  const handleBulkApprove = async (shouldApprove) => {
    if (selectedIds.size === 0) return;
    setIsBulkProcessing(true);

    try {
      const targetIds = Array.from(selectedIds);
      await Promise.all(
        targetIds.map((id) => reviewRepo.update(id, { is_approved: shouldApprove }))
      );

      setReviewsList((prev) =>
        prev.map((item) => (selectedIds.has(item.id) ? { ...item, is_approved: shouldApprove } : item))
      );

      if (onShowToast) {
        onShowToast(
          shouldApprove
            ? `Đã duyệt hiển thị ${targetIds.length} đánh giá!`
            : `Đã ẩn ${targetIds.length} đánh giá khỏi website!`
        );
      }
      handleClearSelection();
    } catch (err) {
      console.error('Lỗi duyệt hàng loạt:', err);
      if (onShowToast) onShowToast('Lỗi cập nhật hàng loạt: ' + err.message);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // 8. Thao tác hàng loạt: Xóa tất cả đánh giá đã chọn
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const targetIds = Array.from(selectedIds);

    const executeBulkDelete = async () => {
      setIsBulkProcessing(true);
      try {
        await Promise.all(targetIds.map((id) => reviewRepo.remove(id)));
        setReviewsList((prev) => prev.filter((item) => !selectedIds.has(item.id)));
        if (onShowToast) onShowToast(`Đã xóa vĩnh viễn ${targetIds.length} đánh giá!`);
        handleClearSelection();
      } catch (err) {
        console.error('Lỗi xóa hàng loạt:', err);
        if (onShowToast) onShowToast('Lỗi xóa hàng loạt: ' + err.message);
      } finally {
        setIsBulkProcessing(false);
      }
    };

    if (setConfirmModalConfig) {
      setConfirmModalConfig({
        isAlert: false,
        title: 'Xóa Nhiều Đánh Giá',
        message: `Bạn có chắc chắn muốn xóa vĩnh viễn ${targetIds.length} bài đánh giá đã chọn? Hành động này không thể hoàn tác.`,
        confirmLabel: `Xóa ${targetIds.length} đánh giá`,
        onConfirm: executeBulkDelete
      });
      return;
    }

    if (window.confirm(`Bạn có chắc muốn xóa vĩnh viễn ${targetIds.length} bài đánh giá đã chọn không?`)) {
      executeBulkDelete();
    }
  };

  return (
    <div className="space-y-6 sm:space-y-7 font-sans text-stone-800 animate-fadeIn relative pb-20">
      {/* 1. CÔNG TẮC BẬT/TẮT HIỂN THỊ MỤC ĐÁNH GIÁ NGOÀI TRANG CHỦ */}
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

      {/* 2. THANH TÌM KIẾM, BỘ LỌC & NÚT CHỌN TẤT CẢ */}
      <div className="space-y-3">
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

        {/* HÀNG CHỌN TẤT CẢ (KHI CÓ KẾT QUẢ) */}
        {filteredReviews.length > 0 && (
          <div className="px-3 flex items-center justify-between text-xs sm:text-sm text-stone-600">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="inline-flex items-center gap-2 font-bold hover:text-amber-900 cursor-pointer transition-colors"
            >
              {isAllSelected ? (
                <CheckSquare className="w-5 h-5 text-amber-700 fill-amber-100" />
              ) : (
                <Square className="w-5 h-5 text-stone-300 hover:text-stone-500" />
              )}
              <span>
                {isAllSelected 
                  ? `Bỏ chọn toàn bộ ${filteredReviews.length} đánh giá` 
                  : `Chọn tất cả ${filteredReviews.length} đánh giá`}
              </span>
            </button>

            {selectedIds.size > 0 && (
              <span className="font-mono text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                Đã chọn: {selectedIds.size}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 3. DANH SÁCH REVIEW DẠNG GRID */}
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
          {filteredReviews.map((rev) => {
            const isSelected = selectedIds.has(rev.id);

            const customerImages = Array.isArray(rev.image_urls)
              ? rev.image_urls
              : rev.image_url
                ? [rev.image_url]
                : [];

            const shopImage =
              rev.shop_packing_image ||
              rev.packing_image ||
              rev.packing_image_url ||
              null;

            const hasPhotos = Boolean(shopImage || customerImages.length > 0);

            return (
              <div 
                key={rev.id} 
                onClick={() => handleToggleSelectOne(rev.id)}
                className={`p-5 sm:p-6 rounded-3xl bg-white border transition-all flex flex-col justify-between space-y-4 shadow-2xs cursor-pointer select-none ${
                  isSelected 
                    ? 'ring-2 ring-amber-600 bg-amber-50/40 border-amber-300' 
                    : rev.is_approved 
                      ? 'border-stone-200/90 hover:border-amber-300/80' 
                      : 'border-amber-300 bg-amber-50/20 ring-1 ring-amber-300/40'
                }`}
              >
                <div className="space-y-3">
                  {/* HÀNG HEADER THẺ: NÚT CHECKBOX & MÃ ĐƠN & BADGE */}
                  <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div 
                        className="text-stone-400 hover:text-amber-800 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelectOne(rev.id);
                        }}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-amber-700 fill-amber-100" />
                        ) : (
                          <Square className="w-5 h-5 text-stone-300 hover:text-stone-500" />
                        )}
                      </div>
                      <span className="font-mono font-black text-amber-950 bg-amber-100 px-2.5 py-1 rounded-xl text-xs sm:text-sm border border-amber-300/60 shadow-2xs">
                        #{rev.order_code}
                      </span>
                    </div>

                    <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-2xs ${
                      rev.is_approved 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                        : 'bg-stone-100 text-stone-700 border-stone-300'
                    }`}>
                      {rev.is_approved ? '✓ Hiển thị web' : 'Đang ẩn'}
                    </span>
                  </div>

                  {/* SAO ĐÁNH GIÁ & NGÀY ĐĂNG */}
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

                  {/* NỘI DUNG NHẬN XÉT */}
                  <p className="text-xs sm:text-sm text-stone-800 font-normal leading-relaxed italic bg-[#faf8f5] p-3.5 sm:p-4 rounded-2xl border border-stone-200/60 min-h-[72px]">
                    "{rev.content}"
                  </p>

                  {/* KHỐI ĐỐI CHIẾU ẢNH */}
                  {hasPhotos && (
                    <div 
                      className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center justify-between">
                        <span>Ảnh thực tế đối chiếu:</span>
                        <span className="text-amber-800 font-normal lowercase">(nhấn để phóng to)</span>
                      </div>

                      <div className="flex items-center gap-3 overflow-x-auto [scrollbar-width:none]">
                        {shopImage && (
                          <div className="relative shrink-0">
                            <button
                              type="button"
                              onClick={() => setPreviewZoomImage(shopImage)}
                              className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-emerald-500/80 shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-zoom-in block"
                              title="Xem ảnh thùng hàng lúc vườn đóng gói"
                            >
                              <img
                                src={shopImage}
                                alt="Ảnh vườn đóng"
                                className="w-full h-full object-cover pointer-events-none"
                              />
                            </button>
                            <span className="absolute -bottom-1 -right-1 text-[9px] font-black text-emerald-950 bg-emerald-200 border border-emerald-300 px-1 rounded shadow-2xs pointer-events-none flex items-center gap-0.5">
                              <PackageCheck className="w-2.5 h-2.5" /> Vườn
                            </span>
                          </div>
                        )}

                        {customerImages.map((imgUrl, imgIdx) => (
                          <div key={imgIdx} className="relative shrink-0">
                            <button
                              type="button"
                              onClick={() => setPreviewZoomImage(imgUrl)}
                              className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-amber-400 shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-zoom-in block"
                              title="Xem ảnh khách nhận hàng thực tế"
                            >
                              <img
                                src={imgUrl}
                                alt={`Khách chụp-${imgIdx}`}
                                className="w-full h-full object-cover pointer-events-none"
                              />
                            </button>
                            <span className="absolute -bottom-1 -right-1 text-[9px] font-black text-amber-950 bg-amber-200 border border-amber-300 px-1 rounded shadow-2xs pointer-events-none flex items-center gap-0.5">
                              <Camera className="w-2.5 h-2.5" /> Khách
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* THÔNG TIN KHÁCH */}
                  <div className="text-xs sm:text-sm text-stone-600 pt-1.5 flex justify-between items-center border-t border-stone-100 font-medium">
                    <strong className="text-stone-900 font-black text-sm">{rev.customer_name}</strong>
                    {rev.customer_phone && (
                      <span className="font-mono text-stone-500 text-xs">
                        SĐT: ...{rev.customer_phone.slice(-4)}
                      </span>
                    )}
                  </div>
                </div>

                {/* THAO TÁC ĐƠN LẺ */}
                <div 
                  className="flex items-center gap-2.5 pt-2.5 border-t border-stone-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    disabled={actionLoadingId === rev.id || isBulkProcessing}
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
                    disabled={actionLoadingId === rev.id || isBulkProcessing}
                    onClick={() => handleDelete(rev.id, rev.order_code)}
                    className="p-3 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                    title="Xóa đánh giá này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. THANH BULK ACTION BAR NỔI DƯỚI ĐÁY KHI CÓ ĐÁNH GIÁ ĐƯỢC CHỌN */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-stone-900/95 text-white px-4 sm:px-5 py-3 rounded-3xl shadow-2xl border border-stone-700/80 backdrop-blur-md flex items-center gap-2.5 sm:gap-4 animate-fadeIn max-w-[95vw] sm:max-w-2xl text-xs sm:text-sm font-sans select-none">
          {/* SỐ LƯỢNG ĐÃ CHỌN */}
          <div className="flex items-center gap-2 font-bold shrink-0">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center text-xs font-black font-mono">
              {selectedIds.size}
            </span>
            <span className="hidden sm:inline">đánh giá</span>
          </div>

          <div className="h-5 w-[1px] bg-stone-700 hidden sm:block shrink-0" />

          {/* DUYỆT TẤT CẢ ĐÃ CHỌN */}
          <button
            type="button"
            disabled={isBulkProcessing}
            onClick={() => handleBulkApprove(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-40 text-xs sm:text-sm active:scale-95 shadow-sm"
          >
            {isBulkProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Duyệt hiện web</span>
          </button>

          {/* ẨN TẤT CẢ ĐÃ CHỌN */}
          <button
            type="button"
            disabled={isBulkProcessing}
            onClick={() => handleBulkApprove(false)}
            className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 rounded-2xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-40 text-xs sm:text-sm active:scale-95"
          >
            <EyeOff className="w-4 h-4 text-stone-400" />
            <span>Ẩn web</span>
          </button>

          {/* XÓA TẤT CẢ ĐÃ CHỌN */}
          <button
            type="button"
            disabled={isBulkProcessing}
            onClick={handleBulkDelete}
            className="p-2.5 bg-stone-800 hover:bg-rose-900/60 text-stone-400 hover:text-rose-400 rounded-2xl transition-colors cursor-pointer shrink-0 disabled:opacity-40 active:scale-95"
            title="Xóa vĩnh viễn các đánh giá đã chọn"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* HỦY CHỌN */}
          <button
            type="button"
            disabled={isBulkProcessing}
            onClick={handleClearSelection}
            className="p-2 text-stone-400 hover:text-white rounded-xl transition-colors cursor-pointer shrink-0"
            title="Bỏ chọn tất cả"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 5. LIGHTBOX PHÓNG TO ẢNH ĐỐI CHIẾU */}
      {previewZoomImage && (
        <div 
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md p-4 flex flex-col items-center justify-center animate-fadeIn"
          onClick={() => setPreviewZoomImage(null)}
        >
          <div 
            className="relative max-w-2xl max-h-[85vh] rounded-3xl overflow-hidden border border-white/20 bg-stone-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewZoomImage}
              alt="Ảnh phóng to"
              className="w-full h-full max-h-[80vh] object-contain"
            />
            <button
              type="button"
              onClick={() => setPreviewZoomImage(null)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-stone-950/80 text-white flex items-center justify-center hover:bg-rose-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <span className="text-white text-xs mt-3 opacity-70">
            Nhấn ra ngoài hoặc bấm nút ✕ để đóng
          </span>
        </div>
      )}
    </div>
  );
}