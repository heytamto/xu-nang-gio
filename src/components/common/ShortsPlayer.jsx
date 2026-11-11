// src/components/common/ShortsPlayer.jsx
import React from "react";
import { getYouTubeEmbedUrl } from "../../utils/youtube";

export default function ShortsPlayer({ videoUrl, title }) {
  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  if (!embedUrl) return null;

  return (
    <div className="relative w-full max-w-[320px] mx-auto aspect-[9/16] rounded-3xl overflow-hidden bg-black shadow-xl border border-stone-800">
      <iframe
        src={embedUrl}
        title={title || "Video thực tế sản phẩm"}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}