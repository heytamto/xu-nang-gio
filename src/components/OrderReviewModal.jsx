// src/components/OrderReviewModal.jsx
import React, { useState } from 'react';
import { 
  X, Star, CheckCircle2, AlertCircle, Loader2, 
  Sparkles, Gift, MailCheck 
} from 'lucide-react';
import ImageUploadField from './ImageUploadField';
import { submitOrderReview } from '../services/orderService';
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
  const [orderCode] = useState(initialOrderCode);
  const [phone] = useState(initialPhone);
  const [name, setName] = useState(initialCustomerName);
  const [email] = useState(initialEmail);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState([]); // Mảng URL ảnh đã nén lưu trên Supabase Storage
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [reviewResult, setReviewResult] = useState(null);

  if (!isOpen) return null;

  // Gợi ý nhanh: Nhấn để tự thêm hoặc gỡ khỏi ô cảm nhận
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
      imageUrls // Lưu link ảnh đính kèm
    });

    if (!res.success) {
      setIsSubmitting(false);
      setErrorMessage(res.error);
      return;
    }

    // Gửi email tri ân nếu đánh giá >= 4 sao và đơn có email
    let sentEmail = false;
    if (rating >= 4 && email && email.includes('@')) {
      try {
        const { data: tplData } = await supabase
          .from('email_templates')
          .select('subject, body')
          .eq('name', 'Tri ân đánh giá & Tặng Voucher')
          .maybeSingle();

        let emailSubject = `[Xứ Nắng Gió] Cảm ơn bạn ${name} đã đánh giá đơn hàng ${orderCode}`;
        let emailHtml = '';

        if (tplData?.body) {
          emailSubject = (tplData.subject || emailSubject)
            .replace(/{{CUSTOMER_NAME}}/g, name)
            .replace(/{{ORDER_CODE}}/g, orderCode);

          emailHtml = tplData.body
            .replace(/{{CUSTOMER_NAME}}/g, name)
            .replace(/{{ORDER_CODE}}/g, orderCode);
        } else {
          emailHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e5e5; border-radius: 16px; padding: 24px; background-color: #ffffff;">
              <h2 style="color: #92400e; margin-top: 0;">Cảm ơn ${name} đã đánh giá ${rating} sao!</h2>
              <p>Nhà vườn Xứ Nắng Gió rất vui khi bạn hài lòng với nông sản.</p>
              <div style="background-color: #fffbeb; border: 1px dashed #d97706; padding: 16px; border-radius: 12px; margin: 20px 0; text-align: center;">
                <span style="font-size: 13px; color: #78350f;">Mã voucher tri ân của bạn chính là mã đơn cũ:</span>
                <div style="font-size: 24px; font-weight: bold; color: #92400e; font-family: monospace; letter-spacing: 2px; margin-top: 6px;">${orderCode}</div>
                <p style="margin: 6px 0 0 0; font-size: 12px; color: #b45309;">(Nhập mã này ở lần mua tiếp theo để được giảm giá trực tiếp)</p>
              </div>
              <p style="font-size: 12px; color: #888;">Hotline / Zalo: 0848.957.345 • Xứ Nắng Gió Ninh Thuận</p>
            </div>
          `;
        }

        await supabase.functions.invoke('send-order-email', {
          body: {
            to: email.trim(),
            subject: emailSubject,
            html: emailHtml
          }
        });
        sentEmail = true;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-xs p-4 font-sans select-none animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-200 relative overflow-hidden max-h-[95vh] overflow-y-auto">
        
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {reviewResult ? (
          <div className="py-6 text-center space-y-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-stone-900">Cảm Ơn Bạn Đã Góp Ý!</h3>
              <p className="text-xs text-stone-500">
                Đánh giá của bạn đã được ghi nhận vào hệ thống vườn.
              </p>
            </div>

            {/* Thông báo mở khóa voucher khi >= 4 sao */}
            {reviewResult.isVoucherUnlocked ? (
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-left space-y-2 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <Gift className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Kích hoạt mã ưu đãi tri ân thành công!</span>
                </div>
                <p className="text-[11.5px] text-amber-950 leading-relaxed font-medium">
                  Bạn có thể dùng chính mã đơn <strong className="font-mono text-amber-900 font-black text-xs px-1 bg-amber-100 rounded">{reviewResult.orderCode}</strong> làm voucher giảm giá cho lần đặt hàng kế tiếp.
                </p>
                {reviewResult.sentEmail && (
                  <p className="text-[10.5px] text-emerald-700 flex items-center gap-1 pt-1 border-t border-amber-200/60 font-semibold">
                    <MailCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Hệ thống đã gửi mã xác nhận qua email của bạn!</span>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-stone-600 italic bg-stone-50 p-3 rounded-2xl border border-stone-200">
                Nhà vườn xin ghi nhận ý kiến đóng góp của bạn để cải tiến khâu đóng gói và vận chuyển cho các đợt thu hoạch sau.
              </p>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Hoàn tất
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-800 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Đánh giá trải nghiệm nhận hàng</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-stone-900 mt-0.5">
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

            {/* Mã đơn & SĐT */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10.5px] font-bold text-stone-600 block mb-1">Mã đơn hàng</label>
                <input
                  type="text"
                  value={orderCode}
                  readOnly
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-stone-200 bg-stone-100 text-stone-600 uppercase font-bold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-bold text-stone-600 block mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  value={phone}
                  readOnly
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-stone-200 bg-stone-100 text-stone-600 font-bold cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="text-[10.5px] font-bold text-stone-700 block mb-1">Tên của bạn (*)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Anh Tâm (Thủ Đức)..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600 font-medium"
                required
              />
            </div>

            {/* GỢI Ý ĐÁNH GIÁ NHANH */}
            <div className="space-y-1.5">
              <label className="text-[10.5px] font-bold text-stone-600 flex items-center justify-between">
                <span>Gợi ý nhanh (nhấn để chọn):</span>
                <span className="text-[9.5px] text-amber-800 font-normal">Không cần gõ tay</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((tag) => {
                  const isSelected = content.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={`text-[10.5px] px-2.5 py-1 rounded-xl border transition-all cursor-pointer font-medium active:scale-95 ${
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
                rows={2}
                placeholder="Chia sẻ thêm cảm nhận của bạn về độ giòn ngọt, đóng gói..."
                className="w-full p-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600 resize-none font-light leading-relaxed bg-stone-50/50 focus:bg-white"
                required
              />
            </div>

            {/* TÍCH HỢP UPLOAD ẢNH NÔNG SẢN THỰC TẾ */}
            <ImageUploadField
              label="Ảnh chụp kiện hàng thực tế"
              bucket="reviews"
              multiple={true}
              maxFiles={2}
              hideManualUrl={true}
              value={imageUrls}
              onChange={setImageUrls}
            />

            {errorMessage && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 disabled:bg-stone-300 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-md"
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