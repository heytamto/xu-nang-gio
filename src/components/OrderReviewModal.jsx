// src/components/OrderReviewModal.jsx
import React, { useState } from 'react';
import { X, Star, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { submitOrderReview } from '../services/orderService';

export default function OrderReviewModal({ 
  isOpen, 
  onClose, 
  initialOrderCode = '', 
  initialPhone = '', 
  initialCustomerName = '',
  onReviewSuccess 
}) {
  const [orderCode, setOrderCode] = useState(initialOrderCode);
  const [phone, setPhone] = useState(initialPhone);
  const [name, setName] = useState(initialCustomerName);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      setErrorMessage('Vui lòng chia sẻ cảm nhận từ 8 ký tự trở lên.');
      return;
    }

    setIsSubmitting(true);
    const res = await submitOrderReview({
      orderCode,
      phone,
      customerName: name,
      rating,
      content
    });
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error);
    } else {
      setIsSuccess(true);
      if (onReviewSuccess) onReviewSuccess(res.data);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-xs p-4 font-sans select-none animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 relative overflow-hidden">
        
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-stone-900">Cảm Ơn Bạn Đã Góp Ý!</h3>
            <p className="text-xs text-stone-600 font-light">
              Đánh giá của bạn giúp nhà vườn tiếp tục hoàn thiện chất lượng đóng gói và bảo quản nông sản.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-800 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Đánh giá trải nghiệm nhận hàng</span>
              </div>
              <h3 className="text-lg font-black text-stone-900 mt-0.5">
                Cảm Nhận Nông Sản Xứ Nắng
              </h3>
            </div>

            {/* Chọn số sao */}
            <div className="flex flex-col items-center justify-center py-2 bg-amber-50/50 rounded-2xl border border-amber-200/60 gap-1.5">
              <div className="flex items-center gap-1">
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
                      className={`w-7 h-7 ${
                        (hoverRating || rating) >= star 
                          ? 'fill-amber-400 text-amber-400' 
                          : 'text-stone-300'
                      }`} 
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-amber-900">
                {rating === 5 && 'Tuyệt vời, nông sản rất tươi ngon!'}
                {rating === 4 && 'Hài lòng, quả giòn ngọt đúng mô tả.'}
                {rating === 3 && 'Chất lượng ở mức tạm ổn.'}
                {rating <= 2 && 'Cần cải thiện chất lượng đóng gói/vận chuyển.'}
              </span>
            </div>

            {/* Thông tin xác minh mã đơn */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">Mã đơn hàng (*)</label>
                <input
                  type="text"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                  placeholder="XNG..."
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600 uppercase"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">Số điện thoại (*)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Số đặt hàng..."
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-700 block mb-1">Tên của bạn (*)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Chị Lan (Quận 7)..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600"
                required
              />
            </div>

            {/* Nội dung đánh giá */}
            <div>
              <label className="text-[11px] font-bold text-stone-700 block mb-1">
                Cảm nhận thực tế (độ ngọt, độ giòn, thùng xốp...)
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                placeholder="Nho có bị rụng cuống không? Táo có giòn ngọt không?..."
                className="w-full p-3 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600 resize-none font-light leading-relaxed"
                required
              />
            </div>

            {errorMessage && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-amber-800 hover:bg-amber-900 disabled:bg-stone-300 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-md"
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
  );
}