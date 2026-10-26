// src/components/OrderReviewModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, Star, CheckCircle2, AlertCircle, Loader2, 
  Sparkles, Gift, MailCheck, Mail, Camera, PackageCheck, Eye
} from 'lucide-react';
import ImageUploadField from './ImageUploadField';
import { submitOrderReview } from '../services/orderService';
import { orderRepo } from '../repositories';
import { supabase } from '../supabaseClient';

const QUICK_REVIEW_SUGGESTIONS = {
  high: [
    '🍇 Nho tươi cuống xanh, mọng nước',
    '🍏 Táo giòn ngọt, vỏ mỏng',
    '📦 Đóng thùng xốp rất cẩn thận, không bị dập',
    '🚚 Nhà xe giao nhanh, đúng hẹn',
    '🍯 Mật nho sánh đậm, rất ngon',
    '🌿 Quả tươi chuẩn vườn Ninh Thuận'
  ],
  low: [
    '📦 Thùng hàng bị móp khi vận chuyển',
    '🍇 Nho bị rụng cuống một vài quả',
    '🍏 Táo hơi chua so với mong đợi',
    '⏳ Giao trễ so với giờ hẹn'
  ]
};

export default function OrderReviewModal({ 
  isOpen, 
  onClose, 
  initialOrderCode = '', 
  initialPhone = '', 
  initialCustomerName = '',
  initialEmail = '',
  onReviewSuccess 
}) {
  const [orderCode, setOrderCode] = useState(initialOrderCode);
  const [phone, setPhone] = useState(initialPhone);
  const [name, setName] = useState(initialCustomerName);
  const [email, setEmail] = useState(initialEmail);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState([]);
  
  // Ảnh đóng gói từ phía nhà vườn (Shop)
  const [shopPackingImage, setShopPackingImage] = useState(null);
  const [previewZoomImage, setPreviewZoomImage] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [reviewResult, setReviewResult] = useState(null);

  // Tải thông tin đơn hàng và ảnh đóng gói thông qua orderRepo
  useEffect(() => {
    if (isOpen) {
      const cleanCode = String(initialOrderCode || '').trim().toUpperCase();
      setOrderCode(cleanCode);
      setPhone(initialPhone || '');
      setName(initialCustomerName || '');
      setEmail(initialEmail || '');
      setRating(5);
      setContent('');
      setImageUrls([]);
      setErrorMessage('');
      setReviewResult(null);
      setShopPackingImage(null);

      if (cleanCode) {
        const fetchShopPackingPhoto = async () => {
          try {
            const data = await orderRepo.getByCode(cleanCode);

            if (data) {
              const img = 
                data.packing_image_url || 
                data.packed_image_url || 
                data.packing_image || 
                (Array.isArray(data.packing_photos) && data.packing_photos[0]) ||
                null;
              if (img) setShopPackingImage(img);
              if (!initialEmail && data.email) setEmail(data.email);
              if (!initialCustomerName && (data.customer_name || data.name)) {
                setName(data.customer_name || data.name);
              }
            }
          } catch (e) {
            console.warn('Không thể tải ảnh đóng gói qua orderRepo:', e);
          }
        };
        fetchShopPackingPhoto();
      }
    }
  }, [isOpen, initialOrderCode, initialPhone, initialCustomerName, initialEmail]);

  if (!isOpen) return null;

  const handleToggleTag = (tagText) => {
    setContent((prev) => {
      const current = prev.trim();
      if (!current) return tagText;
      if (current.includes(tagText)) {
        return current
          .replace(tagText, '')
          .replace(/,\s*,/g, ',')
          .replace(/^,\s*|,\s*$/g, '')
          .trim();
      }
      return `${current}, ${tagText}`;
    });
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!orderCode.trim()) {
      setErrorMessage('Vui lòng nhập mã đơn hàng.');
      return;
    }
    if (!name.trim()) {
      setErrorMessage('Vui lòng nhập tên của bạn.');
      return;
    }
    if (!content.trim() || content.trim().length < 8) {
      setErrorMessage('Vui lòng chia sẻ cảm nhận từ 8 ký tự trở lên (hoặc bấm chọn gợi ý bên dưới).');
      return;
    }

    setIsSubmitting(true);
    const res = await submitOrderReview({
      orderCode,
      phone,
      customerName: name,
      rating,
      content,
      imageUrls,
      shopPackingImage
    });

    if (!res.success) {
      setIsSubmitting(false);
      setErrorMessage(res.error);
      return;
    }

    let sentEmail = false;
    if (rating >= 4) {
      try {
        let recipientEmail = email?.trim();

        if (!recipientEmail || !recipientEmail.includes('@')) {
          const orderData = await orderRepo.getByCode(orderCode);
          if (orderData?.email && orderData.email.includes('@')) {
            recipientEmail = orderData.email.trim();
          }
        }

        if (recipientEmail && recipientEmail.includes('@')) {
          const { error: mailError } = await supabase.functions.invoke('send-order-email', {
            body: {
              to: recipientEmail,
              template_id: 'tpl0003',
              customer_name: name.trim(),
              order_code: orderCode.trim(),
              data: {
                CUSTOMER_NAME: name.trim(),
                ORDER_CODE: orderCode.trim(),
                VOUCHER_CODE: orderCode.trim()
              }
            }
          });

          if (!mailError) {
            sentEmail = true;
          } else {
            console.warn('Lỗi khi gửi mail tri ân qua Edge Function:', mailError);
          }
        }
      } catch (mailErr) {
        console.warn('Không thể gửi mail tri ân:', mailErr);
      }
    }

    setIsSubmitting(false);
    setReviewResult({
      rating,
      orderCode,
      isVoucherUnlocked: rating >= 4,
      sentEmail
    });

    if (onReviewSuccess) {
      onReviewSuccess({ orderCode, rating });
    }
  };

  const suggestions = rating >= 4 ? QUICK_REVIEW_SUGGESTIONS.high : QUICK_REVIEW_SUGGESTIONS.low;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-xs p-4 font-sans select-none animate-fadeIn text-stone-800">
        <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 relative overflow-hidden max-h-[92vh] overflow-y-auto">
          
          {/* Nút đóng */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {reviewResult ? (
            <div className="py-6 text-center space-y-5 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-2xl font-black text-stone-900">Cảm Ơn Bạn Đã Góp Ý!</h3>
                <p className="text-sm text-stone-500 font-normal">
                  Đánh giá của bạn đã được ghi nhận vào hệ thống vườn.
                </p>
              </div>

              {/* Thông báo mở khóa voucher khi >= 4 sao */}
              {reviewResult.isVoucherUnlocked ? (
                <div className="p-4 sm:p-5 bg-amber-50 border border-amber-300 rounded-2xl text-left space-y-2.5 shadow-2xs">
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
                    <Gift className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>Kích hoạt mã ưu đãi tri ân thành công!</span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-950 leading-relaxed font-normal">
                    Bạn có thể dùng chính mã đơn <strong className="font-mono text-amber-900 font-black text-sm px-1.5 py-0.5 bg-amber-100 rounded-lg">{reviewResult.orderCode}</strong> làm voucher giảm giá cho lần đặt hàng kế tiếp.
                  </p>
                  {reviewResult.sentEmail && (
                    <p className="text-xs text-emerald-700 flex items-center gap-1.5 pt-2 border-t border-amber-200/60 font-bold">
                      <MailCheck className="w-4 h-4 shrink-0" />
                      <span>Hệ thống đã gửi email tri ân kèm mã xác nhận đến bạn!</span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-stone-600 italic bg-stone-50 p-4 rounded-2xl border border-stone-200 leading-relaxed font-normal">
                  Nhà vườn xin ghi nhận ý kiến đóng góp của bạn để cải tiến khâu đóng gói và vận chuyển cho các đợt thu hoạch sau.
                </p>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer shadow-md"
              >
                Hoàn tất
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-amber-800 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Đánh giá trải nghiệm nhận hàng</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-stone-900 mt-1">
                  Cảm Nhận Nông Sản Xứ Nắng
                </h3>
              </div>

              {/* Chọn số sao */}
              <div className="flex flex-col items-center justify-center py-3 bg-amber-50/50 rounded-2xl border border-amber-200/60 gap-2">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star 
                        className={`w-8 h-8 sm:w-9 sm:h-9 ${
                          (hoverRating || rating) >= star 
                            ? 'fill-amber-400 text-amber-400' 
                            : 'text-stone-300'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs sm:text-sm font-bold text-amber-950">
                  {rating === 5 && 'Tuyệt vời, nông sản rất tươi ngon!'}
                  {rating === 4 && 'Hài lòng, quả giòn ngọt đúng mô tả.'}
                  {rating === 3 && 'Chất lượng ở mức tạm ổn.'}
                  {rating <= 2 && 'Cần cải thiện chất lượng đóng gói/vận chuyển.'}
                </span>
              </div>

              {/* Mã đơn & SĐT */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Mã đơn hàng</label>
                  <input
                    type="text"
                    value={orderCode}
                    readOnly
                    className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-xl border border-stone-200 bg-stone-100 text-stone-600 uppercase font-bold cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={phone}
                    readOnly
                    className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-xl border border-stone-200 bg-stone-100 text-stone-600 font-bold cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Họ tên và Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Tên của bạn (*)</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Anh Tâm (Thủ Đức)..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600 font-bold text-stone-900"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Email nhận mã voucher</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Để nhận voucher qua thư..."
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600 font-bold text-stone-900"
                    />
                  </div>
                </div>
              </div>

              {/* GỢI Ý ĐÁNH GIÁ NHANH */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                  <span>Gợi ý nhanh (nhấn để chọn):</span>
                  <span className="text-[11px] text-amber-800 font-bold">Không cần gõ tay</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((tag) => {
                    const isSelected = content.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={`text-xs sm:text-sm px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-medium active:scale-95 ${
                          isSelected 
                            ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold shadow-2xs' 
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100 hover:border-stone-300'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Khung nhập cảm nhận */}
              <div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                  placeholder="Chia sẻ thêm cảm nhận của bạn về độ giòn ngọt, đóng gói..."
                  className="w-full p-3 text-xs sm:text-sm rounded-2xl border border-stone-200 focus:outline-none focus:border-amber-600 resize-none font-bold text-stone-900 leading-relaxed bg-stone-50/50 focus:bg-white"
                  required
                />
              </div>

              {/* KHU VỰC ĐỐI CHIẾU 2 NGUỒN ẢNH: ẢNH SHOP & ẢNH KHÁCH */}
              <div className="space-y-3 pt-1">
                {/* 1. Ảnh đóng gói từ phía nhà vườn (Shop) */}
                {shopPackingImage && (
                  <div className="p-3 bg-stone-50 border border-stone-200/90 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                        <PackageCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>Ảnh Shop đóng gói kiện hàng:</span>
                      </span>
                      <span className="text-[11px] text-stone-500 font-mono font-bold">Tại giàn xuất bến</span>
                    </div>

                    <div 
                      onClick={() => setPreviewZoomImage(shopPackingImage)}
                      className="relative w-full h-28 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 group cursor-pointer shadow-2xs"
                      title="Bấm để xem ảnh shop phóng to"
                    >
                      <img 
                        src={shopPackingImage} 
                        alt="Ảnh đóng thùng của shop" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-stone-950/20 group-hover:bg-stone-950/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="px-2.5 py-1 rounded-lg bg-white/90 text-stone-900 font-bold text-xs flex items-center gap-1 shadow-xs">
                          <Eye className="w-3.5 h-3.5 text-amber-700" />
                          <span>Xem ảnh lớn</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Ảnh do khách chụp thực tế khi nhận */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Ảnh của bạn khi nhận hàng (tối đa 2 ảnh):</span>
                    </span>
                    <span className="text-[11px] text-amber-900 font-bold">Tự nguyện</span>
                  </div>

                  <ImageUploadField
                    bucket="reviews"
                    multiple={true}
                    maxFiles={2}
                    hideManualUrl={true}
                    value={imageUrls}
                    onChange={setImageUrls}
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-rose-600 bg-rose-50 p-3 rounded-2xl border border-rose-200 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-amber-800 hover:bg-amber-900 disabled:bg-stone-300 text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang gửi đánh giá...</span>
                  </>
                ) : (
                  <span>Gửi Đánh Giá Ngay</span>
                )}
              </button>
            </form>
          )}

        </div>
      </div>

      {/* Lightbox phóng to ảnh */}
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
    </>
  );
}