// Trích xuất videoId YouTube Shorts hoặc URL thông thường
export function getYouTubeEmbedId(url) {
  if (!url) return null;
  const regExp = /(?:shorts\/|youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[1].length === 11 ? match[1] : null;
}

// Giữ API cũ cho ShortsPlayer, tái sử dụng cùng bộ phân tích video ID.
export function getYouTubeEmbedUrl(url) {
  const videoId = getYouTubeEmbedId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&playsinline=1&rel=0`;
}
