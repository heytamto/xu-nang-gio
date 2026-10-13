import React, { useRef, useState } from 'react';
import { Upload, Link, X, Loader2 } from 'lucide-react';

export default function ImageInput({ value = '', onChange }) {
  const fileInputRef = useRef(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Vui lòng chọn ảnh có dung lượng dưới 5MB!');
      e.target.value = '';
      return;
    }

    setIsCompressing(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Nén và giới hạn cả chiều rộng & chiều cao tối đa 800px
        const MAX_SIZE = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Xuất jpeg chất lượng 0.82 (dung lượng chỉ ~40-80KB)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
        onChange(compressedBase64);
        setIsCompressing(false);
      };

      img.onerror = () => {
        alert('Không thể xử lý định dạng ảnh này!');
        setIsCompressing(false);
      };

      img.src = event.target.result;
    };

    reader.onerror = () => {
      setIsCompressing(false);
    };

    reader.readAsDataURL(file);

    // Reset input để người dùng có thể chọn lại cùng 1 file nếu vừa xóa
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-stone-700 block">
        Ảnh sản phẩm (Nhập URL hoặc tải từ máy) *
      </label>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Dán link https://... hoặc /products/ten-anh.jpg"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-amber-600 font-mono text-stone-800"
          />
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        <button
          type="button"
          disabled={isCompressing}
          onClick={() => fileInputRef.current?.click()}
          className="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-stone-200 transition-colors shrink-0"
        >
          {isCompressing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
              <span>Đang nén...</span>
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5" />
              <span>Tải tệp</span>
            </>
          )}
        </button>
      </div>

      {value && (
        <div className="relative inline-block mt-1">
          <img
            src={value}
            alt="Xem trước"
            className="w-16 h-16 rounded-xl object-cover border border-stone-200 shadow-2xs bg-stone-50"
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/100x100?text=L%E1%BB%97i+%E1%BA%A2nh';
            }}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-stone-900 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-600 transition-colors shadow-sm"
            title="Xóa ảnh"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
