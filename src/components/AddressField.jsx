import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapPin, Navigation, Loader2, ChevronDown, RotateCcw } from 'lucide-react';
import rawData from '../data/administrative_units.json';

const administrativeData = rawData || {};

export default function AddressField({ value = '', onChange }) {
  const provinces = useMemo(() => Object.keys(administrativeData), []);

  // Ưu tiên chọn Khánh Hòa / Ninh Thuận nếu có, hoặc tỉnh đầu tiên trong dữ liệu
  const defaultProv = useMemo(() => {
    return provinces.find((p) => p.includes('Khánh Hòa') || p.includes('Ninh Thuận')) || provinces[0] || '';
  }, [provinces]);

  const [selectedProvince, setSelectedProvince] = useState(defaultProv);

  // Danh sách Phường / Xã trực thuộc Tỉnh (bỏ cấp Huyện, gom phẳng tự động)
  const wards = useMemo(() => {
    if (!selectedProvince || !administrativeData[selectedProvince]) return [];
    const provData = administrativeData[selectedProvince];

    if (Array.isArray(provData)) {
      return provData;
    }

    if (typeof provData === 'object') {
      const allWards = [];
      Object.values(provData).forEach((item) => {
        if (Array.isArray(item)) {
          allWards.push(...item);
        } else if (typeof item === 'string') {
          allWards.push(item);
        }
      });
      return Array.from(new Set(allWards)).sort((a, b) => a.localeCompare(b, 'vi'));
    }

    return [];
  }, [selectedProvince]);

  const [selectedWard, setSelectedWard] = useState(() => wards[0] || '');

  useEffect(() => {
    if (wards.length > 0) {
      if (!wards.includes(selectedWard)) {
        setSelectedWard(wards[0]);
      }
    } else {
      setSelectedWard('');
    }
  }, [wards, selectedWard]);

  const [detailAddress, setDetailAddress] = useState('');

  // GPS State
  const [autoDetectedText, setAutoDetectedText] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const lastEmittedValue = useRef('');

  useEffect(() => {
    let full = '';
    if (autoDetectedText) {
      full = autoDetectedText;
    } else {
      full = [
        detailAddress.trim(),
        selectedWard,
        selectedProvince
      ].filter(Boolean).join(', ');
    }

    if (full !== lastEmittedValue.current) {
      lastEmittedValue.current = full;
      if (onChange) {
        onChange(full);
      }
    }
  }, [selectedProvince, selectedWard, detailAddress, autoDetectedText, onChange]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Trình duyệt không hỗ trợ định vị.');
      return;
    }

    setIsLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=vi`
          );
          const data = await res.json();
          if (data?.display_name) {
            setAutoDetectedText(data.display_name);
          } else {
            setLocationError('Không phân giải được địa chỉ tự động, vui lòng chọn menu bên dưới.');
          }
        } catch {
          setLocationError('Lỗi kết nối máy chủ định vị, vui lòng chọn từ danh sách.');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Bạn đã từ chối quyền định vị. Vui lòng chọn bên dưới.');
        } else {
          setLocationError('Không tìm thấy tọa độ hiện tại.');
        }
      },
      { timeout: 8000 }
    );
  };

  // Danh mục gợi ý chuẩn hóa theo các tỉnh/thành trọng điểm hiện có trong file hành chính mới
  const quickProvinces = [
    { label: 'Khánh Hòa', keyword: 'Khánh Hòa' },
    { label: 'TP. Hồ Chí Minh', keyword: 'Hồ Chí Minh' },
    { label: 'Hà Nội', keyword: 'Hà Nội' },
    { label: 'Lâm Đồng', keyword: 'Lâm Đồng' },
    { label: 'Đà Nẵng', keyword: 'Đà Nẵng' }
  ];

  return (
    <div className="space-y-3">
      {/* Thanh Header chọn nhanh & Nút GPS tinh tế */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[11px] font-semibold text-stone-500">Gợi ý tỉnh/thành đặt nhiều:</span>
          
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={isLocating}
            className="text-[11px] font-semibold text-amber-800 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-50 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all border border-amber-600/20 shadow-2xs"
          >
            {isLocating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                <span>Đang dò vị trí...</span>
              </>
            ) : (
              <>
                <Navigation className="w-3 h-3 text-amber-700 fill-amber-700/20" />
                <span>Định vị GPS</span>
              </>
            )}
          </button>
        </div>

        {/* Dãy nút Pill chọn nhanh Tỉnh - Đã ẩn scrollbar xấu */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {quickProvinces.map(({ label, keyword }) => {
            const matched = provinces.find((p) => p.includes(keyword));
            if (!matched) return null;
            const isSelected = selectedProvince === matched && !autoDetectedText;

            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setAutoDetectedText('');
                  setSelectedProvince(matched);
                }}
                className={`text-[11px] px-3 py-1 rounded-full border transition-all whitespace-nowrap font-medium ${
                  isSelected
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white hover:bg-stone-50 text-stone-600 border-stone-200 shadow-2xs'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {locationError && (
        <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
          {locationError}
        </p>
      )}

      {/* Hiển thị khi nhận diện GPS thành công */}
      {autoDetectedText ? (
        <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wide">
                Đã nhận diện từ GPS:
              </span>
              <p className="text-xs text-stone-800 font-medium leading-relaxed mt-0.5">
                {autoDetectedText}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAutoDetectedText('')}
            className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-700 transition-colors"
            title="Đổi sang chọn thủ công"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Bộ chọn 2 cấp Tỉnh/TP -> Phường/Xã + Địa chỉ cụ thể */
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Cấp 1: Tỉnh / Thành phố */}
            <div>
              <label className="text-[11px] font-semibold text-stone-600 block mb-1">Tỉnh / Thành phố *</label>
              <div className="relative">
                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-white font-medium text-stone-800 appearance-none focus:outline-none focus:border-amber-600 pr-7 shadow-2xs"
                >
                  {provinces.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Cấp 2: Phường / Xã */}
            <div>
              <label className="text-[11px] font-semibold text-stone-600 block mb-1">Phường / Xã / Thị trấn *</label>
              <div className="relative">
                <select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-white font-medium text-stone-800 appearance-none focus:outline-none focus:border-amber-600 pr-7 shadow-2xs"
                >
                  {wards.length > 0 ? (
                    wards.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))
                  ) : (
                    <option value="">(Chọn tỉnh trước)</option>
                  )}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Cấp 3: Địa chỉ chi tiết */}
          <div className="relative">
            <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              required
              placeholder="Địa chỉ cụ thể: Thôn/Xóm/Ấp, Số nhà, Tên đường (VD: Thôn Trường Sanh, gần Trường Mầm non)..."
              value={detailAddress}
              onChange={(e) => setDetailAddress(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-amber-600 font-medium text-stone-800 shadow-2xs"
            />
          </div>
        </div>
      )}
    </div>
  );
}
