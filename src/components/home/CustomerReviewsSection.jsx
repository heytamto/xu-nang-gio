// src/components/home/CustomerReviewsSection.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Heart, MoveHorizontal, Star, Quote, Clock, Loader2, X } from "lucide-react";
import { fetchPaginatedApprovedReviews } from "../../services/orderService";
import { formatDate } from "../../utils/dateUtils";

const FALLBACK_CUSTOMER_REVIEWS = [
  {
    id: "fb-1",
    customer_name: "Chị Ánh Tuyết",
    role: "Quận 7, TP.HCM",
    content: "Chùm nho xanh với táo gió mở thùng xốp ra cuống còn tươi rói chảy mủ luôn. Vị ngọt thanh mát tự nhiên chứ không gắt đường. Cả nhà ai cũng khen!",
    rating: 5,
    order_code: "XNG2609-8812",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "fb-2",
    customer_name: "Anh Hoàng Nam",
    role: "Ba Đình, Hà Nội",
    content: "Đóng gói chèn rơm với đá gel cực kỳ chu đáo. Gửi xe ra tới Hà Nội 2 ngày mà quả táo không hề bị cấn dập. Mật nho sền sệt pha đá uống giải nhiệt bao đã.",
    rating: 5,
    order_code: "XNG2610-4109",
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "fb-3",
    customer_name: "Cô Mỹ Hạnh",
    role: "Hải Châu, Đà Nẵng",
    content: "Chả cá quết dẻo dai thơm tiêu sọ, nướng sơ qua chấm muối ớt chanh ăn nghiện luôn. Thích nhất cách nhà vườn thật thà, bao ăn từng quả.",
    rating: 5,
    order_code: "XNG2608-1123",
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
];

export default function CustomerReviewsSection() {
  const reviewsScrollRef = useRef(null);
  const [reviewsList, setReviewsList] = useState([]);
  const [totalReviewsCount, setTotalReviewsCount] = useState(0);
  const [reviewPage, setReviewPage] = useState(0);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const [isLoadingMoreReviews, setIsLoadingMoreReviews] = useState(false);
  const isFetchingRef = useRef(false);

  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const isDragMoved = useRef(false);
  const autoScrollRafRef = useRef(null);
  const isLoopResetting = useRef(false);

  const [activeLightboxImg, setActiveLightboxImg] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setActiveLightboxImg(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const loadReviewsBatch = useCallback(
    async (pageToLoad = 0, isInitial = false) => {
      if (isFetchingRef.current) return;
      if (!isInitial && !hasMoreReviews) return;

      isFetchingRef.current = true;
      setIsLoadingMoreReviews(true);

      try {
        const res = await fetchPaginatedApprovedReviews(pageToLoad, 6);
        setTotalReviewsCount(res.totalCount || 0);
        setHasMoreReviews(res.hasMore);

        if (res.reviews && res.reviews.length > 0) {
          setReviewsList((prev) => {
            if (isInitial) return res.reviews;
            const existingIds = new Set(prev.map((r) => r.id || r.code || r.order_code));
            const newUnique = res.reviews.filter(
              (r) => !existingIds.has(r.id || r.code || r.order_code)
            );
            return [...prev, ...newUnique];
          });
          setReviewPage(pageToLoad);
        } else if (isInitial) {
          setReviewsList(FALLBACK_CUSTOMER_REVIEWS);
        }
      } catch (err) {
        console.warn("Lỗi tải đánh giá:", err);
        if (isInitial) setReviewsList(FALLBACK_CUSTOMER_REVIEWS);
      } finally {
        setIsLoadingMoreReviews(false);
        isFetchingRef.current = false;
      }
    },
    [hasMoreReviews]
  );

  useEffect(() => {
    loadReviewsBatch(0, true);
  }, [loadReviewsBatch]);

  useEffect(() => {
    const scrollContainer = reviewsScrollRef.current;
    if (!scrollContainer) return;

    let lastTimestamp = performance.now();

    const step = (timestamp) => {
      if (!isHovered && !isDragging && scrollContainer && !isLoopResetting.current) {
        const delta = timestamp - lastTimestamp;
        const move = (30 * delta) / 1000;
        const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;

        if (scrollContainer.scrollLeft >= maxScroll - 4) {
          if (hasMoreReviews && !isLoadingMoreReviews && !isFetchingRef.current) {
            loadReviewsBatch(reviewPage + 1);
          } else if (!hasMoreReviews) {
            isLoopResetting.current = true;
            scrollContainer.scrollTo({ left: 0, behavior: "smooth" });
            setTimeout(() => {
              isLoopResetting.current = false;
            }, 1200);
          }
        } else {
          scrollContainer.scrollLeft += move;
        }
      }
      lastTimestamp = timestamp;
      autoScrollRafRef.current = requestAnimationFrame(step);
    };

    autoScrollRafRef.current = requestAnimationFrame(step);

    return () => {
      if (autoScrollRafRef.current) {
        cancelAnimationFrame(autoScrollRafRef.current);
      }
    };
  }, [isHovered, isDragging, hasMoreReviews, isLoadingMoreReviews, reviewPage, loadReviewsBatch]);

  const handleMouseDown = (e) => {
    if (!reviewsScrollRef.current) return;
    setIsDragging(true);
    isDragMoved.current = false;
    setStartX(e.pageX - reviewsScrollRef.current.offsetLeft);
    setScrollLeftState(reviewsScrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !reviewsScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - reviewsScrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 4) {
      isDragMoved.current = true;
    }
    reviewsScrollRef.current.scrollLeft = scrollLeftState - walk;

    const { scrollLeft, scrollWidth, clientWidth } = reviewsScrollRef.current;
    if (
      scrollLeft + clientWidth + 150 >= scrollWidth &&
      hasMoreReviews &&
      !isLoadingMoreReviews &&
      !isFetchingRef.current
    ) {
      loadReviewsBatch(reviewPage + 1);
    }
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleReviewsScroll = (e) => {
    const { scrollLeft, scrollWidth, clientWidth } = e.currentTarget;
    if (
      scrollLeft + clientWidth + 150 >= scrollWidth &&
      hasMoreReviews &&
      !isLoadingMoreReviews &&
      !isFetchingRef.current
    ) {
      loadReviewsBatch(reviewPage + 1);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-800 uppercase tracking-wider">
            <Heart className="w-4 h-4 fill-amber-700 text-amber-700" />
            <span>
              Tình cảm của khách thương (
              {totalReviewsCount > 0 ? `${totalReviewsCount}+` : `${reviewsList.length}+`} đánh giá)
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight mt-1">
            Khách Ăn Quả Xứ Nắng Nói Gì?
          </h3>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 bg-stone-100 px-3.5 py-2 rounded-full border border-stone-200/80">
          <MoveHorizontal className="w-4 h-4 text-amber-600 animate-pulse" />
          <span>Tự động trượt • Kéo để xem thêm</span>
        </div>
      </div>

      <div
        ref={reviewsScrollRef}
        onScroll={handleReviewsScroll}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          handleMouseUpOrLeave();
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        className={`flex items-stretch gap-4 overflow-x-auto pb-4 pt-1 px-1 select-none overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {reviewsList.map((rev, idx) => {
          const customerName = rev.customer_name || rev.name || "Khách quý";
          const orderCode = rev.order_code || rev.orderCode || "";
          const ratingNum = Number(rev.rating) || 5;

          const customerImages = Array.isArray(rev.image_urls)
            ? rev.image_urls
            : rev.image_url
              ? [rev.image_url]
              : [];

          const shopImage =
            rev.shop_packing_image ||
            rev.packing_image ||
            rev.packing_image_url ||
            rev.orders?.packing_image ||
            rev.orders?.packing_image_url ||
            rev.orders?.packed_image_url ||
            null;

          const hasAnyPhoto = Boolean(shopImage || customerImages.length > 0);

          return (
            <div
              key={rev.id || `${orderCode}-${idx}`}
              className="w-[300px] sm:w-[350px] min-h-[240px] shrink-0 p-5 rounded-3xl bg-white border border-stone-200/90 shadow-2xs hover:shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between relative group select-none"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(ratingNum)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {orderCode ? (
                    <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100/80 px-2.5 py-0.5 rounded-md border border-amber-200">
                      #{orderCode}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      {rev.tag || "Khách đã mua"}
                    </span>
                  )}
                </div>

                <div className="relative min-h-[50px] flex items-start">
                  <Quote className="w-4 h-4 text-stone-300 absolute -top-1 -left-1 opacity-60 shrink-0" />
                  <p className="text-sm text-stone-700 font-normal leading-relaxed italic line-clamp-3 pl-3">
                    "{rev.content}"
                  </p>
                </div>

                {hasAnyPhoto && (
                  <div className="flex items-center gap-2.5 pt-1 pl-3 overflow-x-auto [scrollbar-width:none]">
                    {shopImage && (
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            if (isDragMoved.current) {
                              e.stopPropagation();
                              return;
                            }
                            setActiveLightboxImg(shopImage);
                          }}
                          className="relative w-11 h-11 rounded-xl overflow-hidden border-2 border-emerald-500/80 shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-zoom-in block"
                          title="Bấm xem ảnh lúc vườn đóng thùng"
                        >
                          <img
                            src={shopImage}
                            alt="Ảnh vườn đóng"
                            className="w-full h-full object-cover pointer-events-none"
                            onError={(e) => {
                              e.currentTarget.parentElement.parentElement.style.display = "none";
                            }}
                          />
                        </button>
                        <span className="absolute -bottom-1 -right-1 text-[9px] font-black text-emerald-950 bg-emerald-200 border border-emerald-300 px-1 rounded shadow-2xs pointer-events-none">
                          Vườn
                        </span>
                      </div>
                    )}

                    {customerImages.slice(0, shopImage ? 2 : 3).map((imgUrl, imgIdx) => (
                      <div key={imgIdx} className="relative shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            if (isDragMoved.current) {
                              e.stopPropagation();
                              return;
                            }
                            setActiveLightboxImg(imgUrl);
                          }}
                          className="relative w-11 h-11 rounded-xl overflow-hidden border-2 border-amber-400 shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-zoom-in block"
                          title="Bấm xem ảnh khách nhận hàng"
                        >
                          <img
                            src={imgUrl}
                            alt={`Khách chụp-${imgIdx}`}
                            className="w-full h-full object-cover pointer-events-none"
                            onError={(e) => {
                              e.currentTarget.parentElement.parentElement.style.display = "none";
                            }}
                          />
                        </button>
                        <span className="absolute -bottom-1 -right-1 text-[9px] font-black text-amber-950 bg-amber-200 border border-amber-300 px-1 rounded shadow-2xs pointer-events-none">
                          Khách
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <strong className="text-sm font-bold text-stone-900 block truncate">
                    {customerName}
                  </strong>
                  <span className="text-xs text-stone-500 font-normal block truncate">
                    {rev.role || (orderCode ? "Đã nhận hàng thành công" : "Khách thân thiết")}
                  </span>
                </div>

                <span className="text-xs font-medium text-stone-400 font-mono flex items-center gap-1 shrink-0 bg-stone-50 px-2 py-0.5 rounded-md border border-stone-100">
                  <Clock className="w-3 h-3 text-stone-400" />
                  <span>{formatDate(rev.created_at || rev.createdAt || new Date())}</span>
                </span>
              </div>
            </div>
          );
        })}

        {isLoadingMoreReviews && (
          <div className="w-[140px] min-h-[240px] shrink-0 p-5 rounded-3xl bg-stone-50 border border-dashed border-stone-200 flex flex-col items-center justify-center gap-2 text-stone-400 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-amber-700" />
            <span className="text-xs font-medium">Đang tải tiếp...</span>
          </div>
        )}
      </div>

      {activeLightboxImg && (
        <div
          onClick={() => setActiveLightboxImg(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fadeIn cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl max-h-[90vh] bg-stone-950 rounded-3xl overflow-hidden border border-white/20 shadow-2xl p-2 cursor-default"
          >
            <button
              type="button"
              onClick={() => setActiveLightboxImg(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
              title="Đóng (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activeLightboxImg}
              alt="Review Fullsize"
              className="w-full max-h-[82vh] object-contain rounded-2xl"
            />
            <div className="text-center py-2.5 text-xs text-stone-400 font-sans">
              Ảnh thực tế đối chiếu kiểm tra • Nhấn vùng tối để đóng
            </div>
          </div>
        </div>
      )}
    </section>
  );
}