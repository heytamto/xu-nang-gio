// src/components/admin/ImageUploadField.jsx
import React, { useState } from 'react';
import { Loader2, UploadCloud, X, Check } from 'lucide-react';
import { supabase } from '../../supabaseClient';

// Hàm nén ảnh về JPEG max 1200px dưới dạng Blob nhị phân
function compressImageToBlob(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Không thể nén tệp ảnh'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// Chuẩn hóa tên file không dấu tiếng Việt
function sanitizeFileName(fileName) {
  return fileName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.]/g, '-')
    .replace(/-+/g, '-');
}

export default function ImageUploadField({ 
  value = '', 
  onChange, 
  label = "Ảnh", 
  bucket = "images" 
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // 1. Nén ảnh phía trình duyệt
      const compressedBlob = await compressImageToBlob(file);

      // 2. Tạo đường dẫn lưu trữ file trên Supabase Storage
      const cleanName = sanitizeFileName(file.name.replace(/\.[^/.]+$/, ""));
      const filePath = `${cleanName}_${Date.now()}.jpg`;

      // 3. Tải trực tiếp lên bucket
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, compressedBlob, {
          contentType: 'image/jpeg',
          cacheControl: '31536000', // Cache CDN 1 năm
          upsert: true
        });

      if (error) throw error;

      // 4. Lấy Public URL của ảnh
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      if (publicUrlData?.publicUrl) {
        onChange(publicUrlData.publicUrl);
      } else {
        throw new Error('Không lấy được đường dẫn URL công khai từ Storage');
      }
    } catch (err) {
      console.error('Lỗi tải ảnh lên Supabase Storage:', err);
      setUploadError(err.message || 'Lỗi khi tải ảnh lên máy chủ lưu trữ');
    } finally {
      setIsUploading(false);
      // Reset input file để có thể chọn lại cùng 1 file nếu muốn
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-1.5 font-sans">
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
              <span>Đang tải lên...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
              <span>Tải ảnh lên Storage</span>
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
            placeholder="Hoặc dán URL ảnh trực tiếp vào đây..."
            className="w-full pl-3 pr-8 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-xs font-mono text-stone-700 focus:outline-none focus:border-amber-600 transition-all"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
              title="Xóa link ảnh"
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
            className="w-12 h-12 rounded-xl object-cover border border-stone-200 bg-stone-100 shadow-2xs"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-200 flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-600" />
            <span>Đã liên kết ảnh</span>
          </span>
        </div>
      )}
    </div>
  );
}