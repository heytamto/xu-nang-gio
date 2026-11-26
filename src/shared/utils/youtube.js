// src/utils/youtube.js
export function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  
  // Trích xuất 11 ký tự videoId từ Shorts, URL thường hoặc link rút gọn
  const regExp = /(?:shorts\/|youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = match && match[1].length === 11 ? match[1] : null;

  if (!videoId) return null;

  // Cấu hình: autoplay (tự chạy), mute (bắt buộc để trình duyệt cho autoplay),
  // loop (lặp lại), controls=1 (hoặc 0 nếu muốn ẩn thanh tua)
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&playsinline=1&rel=0`;
}