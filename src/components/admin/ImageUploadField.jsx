import React, { useState } from 'react';
import { Loader2, UploadCloud, X } from 'lucide-react';

const GSHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbx4uOPteTl5vmfBU5vH5cFjfNdBMAptKMal58Vh9lHofoTYIZeQqfxrICrNxLTGWlKy/exec';

export default function ImageUploadField({ value, onChange, label = "Ảnh" }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async (event) => {
        try {
          const img = new Image();
          img.src = event.target.result;
          img.onload = async () => {
            let width = img.width;
            let height = img.height;
            const maxWidth = 1200;

            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            const base64 = dataUrl.split(',')[1];

            const payload = {
              action: 'upload_image',
              fileName: file.name.replace(/\.[^/.]+$/, "") + '_' + Date.now() + '.jpg',
              mimeType: 'image/jpeg',
              base64: base64
            };

            const response = await fetch(GSHEET_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify(payload)
            });

            const resJson = await response.json();
            if (resJson.success && resJson.url) {
              onChange(resJson.url);
            } else {
              throw new Error(resJson.error || resJson.message || 'Lỗi lưu Google Drive');
            }
            setIsUploading(false);
          };
        } catch (innerErr) {
          setUploadError(innerErr.message);
          setIsUploading(false);
        }
      };
    } catch (err) {
      setUploadError('Lỗi xử lý tệp: ' + err.message);
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="font-semibold text-stone-600 block text-xs">{label}</label>
      <div className="flex items-center gap-2">
        <label className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all shrink-0 ${
          isUploading 
            ? 'bg-amber-50 text-amber-700 border-amber-300 pointer-events-none' 
            : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
        }`}>
          {isUploading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
              <span>Đang lưu Drive...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
              <span>Tải từ máy lên Drive</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            disabled={isUploading}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        <div className="relative flex-1">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Hoặc dán URL ảnh vào đây..."
            className="w-full pl-3 pr-8 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-xs font-mono text-stone-700 focus:outline-none focus:border-amber-600 transition-all"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {uploadError && (
        <p className="text-[10px] text-rose-600 font-medium">{uploadError}</p>
      )}

      {value && (
        <div className="flex items-center gap-2 pt-1">
          <img
            src={value}
            alt="Thumbnail preview"
            className="w-12 h-12 rounded-xl object-cover border border-stone-200 bg-stone-100"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
            ✓ Đã liên kết ảnh thành công
          </span>
        </div>
      )}
    </div>
  );
}