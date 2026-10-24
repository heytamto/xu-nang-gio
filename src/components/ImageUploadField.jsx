// src/components/admin/ImageUploadField.jsx
import React, { useState } from 'react';
import { Loader2, UploadCloud, X, Check, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

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
  return String(fileName || 'image')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9.]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function ImageUploadField({ 
  value = '', // string hoặc string[] nếu multiple
  onChange, 
  label = "Ảnh", 
  bucket = "images",
  multiple = false,
  maxFiles = 3,
  placeholder = "Hoặc dán URL ảnh trực tiếp vào đây...",
  hideManualUrl = false // Hỗ trợ ẩn ô nhập link thủ công khi dùng cho form khách hàng
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [manualInput, setManualInput] = useState('');

  // Chuẩn hóa danh sách ảnh hiển thị
  const imageList = multiple 
    ? (Array.isArray(value) ? value : (value ? [value] : []))
    : (typeof value === 'string' && value ? [value] : []);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (multiple && imageList.length + files.length > maxFiles) {
      setUploadError(`Chỉ được phép tải lên tối đa ${maxFiles} ảnh.`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const newUploadedUrls = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 1. Nén ảnh phía trình duyệt
        const compressedBlob = await compressImageToBlob(file);

        // 2. Tạo đường dẫn lưu trữ file trên Supabase Storage
        const cleanName = sanitizeFileName(file.name.replace(/\.[^/.]+$/, ""));
        const filePath = `${cleanName}_${Date.now()}_${i + 1}.jpg`;

        // 3. Tải trực tiếp lên bucket chỉ định (images hoặc reviews)
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
          newUploadedUrls.push(publicUrlData.publicUrl);
        } else {
          throw new Error('Không lấy được đường dẫn URL công khai từ Storage');
        }
      }

      if (multiple) {
        onChange([...imageList, ...newUploadedUrls]);
      } else {
        onChange(newUploadedUrls[0] || '');
      }
    } catch (err) {
      console.error('Lỗi tải ảnh lên Supabase Storage:', err);
      setUploadError(err.message || 'Lỗi khi tải ảnh lên máy chủ lưu trữ');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveSingleImage = (urlToRemove) => {
    if (multiple) {
      onChange(imageList.filter((url) => url !== urlToRemove));
    } else {
      onChange('');
    }
  };

  const handleAddManualUrl = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = manualInput.trim();
      if (!trimmed) return;

      if (multiple) {
        if (imageList.length >= maxFiles) {
          setUploadError(`Đã đạt giới hạn tối đa ${maxFiles} ảnh.`);
          return;
        }
        onChange([...imageList, trimmed]);
      } else {
        onChange(trimmed);
      }
      setManualInput('');
      setUploadError(null);
    }
  };

  return (
    <div className="space-y-2.5 font-sans text-stone-800">
      <div className="flex items-center justify-between">
        <label className="font-bold text-stone-700 block text-xs sm:text-sm">
          {label} {multiple && <span className="text-stone-400 font-normal">({imageList.length}/{maxFiles} ảnh)</span>}
        </label>
        <span className="text-xs text-amber-900 font-semibold bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200/80">
          Bucket: {bucket}
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Nút bấm tải ảnh */}
        <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold transition-all shrink-0 shadow-2xs ${
          isUploading || (multiple && imageList.length >= maxFiles)
            ? 'bg-stone-100 text-stone-400 border-stone-200 pointer-events-none' 
            : 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-300 active:scale-95'
        }`}>
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
              <span>Đang nén & tải lên...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4 text-amber-700" />
              <span>Tải ảnh từ máy</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            multiple={multiple}
            disabled={isUploading || (multiple && imageList.length >= maxFiles)}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {/* Ô nhập URL thủ công */}
        {!hideManualUrl && (
          <div className="relative flex-1">
            <input
              type="url"
              value={multiple ? manualInput : (value || '')}
              onChange={(e) => {
                if (multiple) {
                  setManualInput(e.target.value);
                } else {
                  onChange(e.target.value);
                }
              }}
              onKeyDown={multiple ? handleAddManualUrl : undefined}
              placeholder={multiple ? "Dán link ảnh rồi nhấn Enter..." : placeholder}
              className="w-full pl-3.5 pr-9 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/90 focus:bg-white text-xs sm:text-sm font-mono text-stone-800 focus:outline-none focus:border-amber-600 transition-all shadow-2xs"
            />
            {!multiple && value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer p-1"
                title="Xóa link ảnh"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {uploadError && (
        <p className="text-xs text-rose-600 font-semibold pl-1">{uploadError}</p>
      )}

      {/* Danh sách ảnh Preview */}
      {imageList.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 pt-1.5">
          {imageList.map((url, idx) => (
            <div 
              key={idx} 
              className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 shadow-2xs group shrink-0"
            >
              <img
                src={url}
                alt={`Preview ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100?text=Error'; }}
              />
              <button
                type="button"
                onClick={() => handleRemoveSingleImage(url)}
                className="absolute inset-0 bg-stone-950/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Gỡ ảnh này"
              >
                <Trash2 className="w-5 h-5 text-rose-400" />
              </button>
            </div>
          ))}
          <span className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl font-bold border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
            <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
            <span>Đã kết nối {imageList.length} ảnh</span>
          </span>
        </div>
      )}
    </div>
  );
}