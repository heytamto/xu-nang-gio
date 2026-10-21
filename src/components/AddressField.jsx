// src/components/AddressField.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MapPin, Navigation, Loader2, ChevronDown, 
  AlertTriangle, Search, Check, X, Edit3, CheckCircle2 
} from 'lucide-react';
import rawData from '../data/administrative_units.json';

import { 
  normalizeVietnameseText, 
  cleanAdministrativeName 
} from '../utils/checkoutValidation';

const administrativeData = rawData || {};

// Component Searchable Select Dropdown
function SearchableSelect({ label, value, options = [], placeholder, onSelect, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 200);
    return () => clearTimeout(timer);
  }, [keyword]);

  const filteredOptions = useMemo(() => {
    if (!debouncedKeyword.trim()) return options;
    const normKey = normalizeVietnameseText(debouncedKeyword);
    return options.filter((opt) => normalizeVietnameseText(opt).includes(normKey));
  }, [options, debouncedKeyword]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setKeyword('');
        setDebouncedKeyword('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 50);
  };

  const handleClear = () => {
    setKeyword('');
    setDebouncedKeyword('');
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="text-[11px] font-semibold text-stone-600 block mb-1">{label}</label>

      <button
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={`w-full text-xs p-2.5 rounded-xl border text-left flex items-center justify-between transition-all shadow-2xs cursor-pointer ${
          disabled
            ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
            : isOpen
            ? 'border-amber-600 bg-white ring-2 ring-amber-500/20 text-stone-800'
            : 'border-stone-200 bg-white hover:border-stone-300 text-stone-800'
        }`}
      >
        <span className="truncate font-medium">
          {value || <span className="text-stone-400 font-normal">{placeholder}</span>}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-stone-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-amber-600' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
          <div className="p-2 border-b border-stone-100 bg-stone-50/60 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-stone-400 shrink-0 ml-1" />
            <input
              ref={inputRef}
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Gõ để tìm nhanh..."
              className="w-full text-xs bg-transparent border-none focus:outline-none text-stone-800 placeholder-stone-400 font-medium"
            />
            {keyword && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-md cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <ul className="max-h-52 overflow-y-auto text-xs divide-y divide-stone-50 p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt === value;
                return (
                  <li key={opt}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(opt);
                        setIsOpen(false);
                        setKeyword('');
                        setDebouncedKeyword('');
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-amber-50 text-amber-900 font-bold'
                          : 'hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <span className="truncate">{opt}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 ml-2" />}
                    </button>
                  </li>
                );
              })
            ) : (
              <li className="p-3 text-center text-[11px] text-stone-400 italic">
                Không tìm thấy "{debouncedKeyword || keyword}"
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function AddressField({ value = '', onChange }) {
  // Mode: 'gps' (1. Lấy vị trí) hoặc 'manual' (2. Tự nhập)
  const [inputMode, setInputMode] = useState('gps');

  const provinces = useMemo(() => Object.keys(administrativeData), []);
  const defaultProv = useMemo(() => {
    return provinces.find((p) => p.includes('Hồ Chí Minh')) || 
           provinces.find((p) => p.includes('Khánh Hòa')) || 
           provinces.find((p) => p.includes('Đồng Nai')) || 
           provinces[0] || '';
  }, [provinces]);

  const [selectedProvince, setSelectedProvince] = useState(defaultProv);

  const wards = useMemo(() => {
    if (!selectedProvince || !administrativeData[selectedProvince]) return [];
    const provData = administrativeData[selectedProvince];

    if (Array.isArray(provData)) return provData;

    if (typeof provData === 'object') {
      const allWards = [];
      Object.values(provData).forEach((item) => {
        if (Array.isArray(item)) allWards.push(...item);
        else if (typeof item === 'string') allWards.push(item);
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
  const [autoDetectedText, setAutoDetectedText] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const lastEmittedValue = useRef('');

  // Đồng bộ giá trị trả về cho Form
  useEffect(() => {
    let full = '';
    if (inputMode === 'gps' && autoDetectedText) {
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
      if (onChange) onChange(full);
    }
  }, [inputMode, autoDetectedText, detailAddress, selectedWard, selectedProvince, onChange]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Trình duyệt không hỗ trợ định vị GPS.');
      return;
    }

    setIsLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;

          const isInsideVietnam = (latitude >= 8.0 && latitude <= 23.5) && (longitude >= 102.0 && longitude <= 110.0);
          if (!isInsideVietnam) {
            setLocationError('Tọa độ nằm ngoài Việt Nam (có thể do bật VPN). Bạn vui lòng dùng tab "Tự nhập".');
            setIsLocating(false);
            return;
          }

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&countrycodes=vn&accept-language=vi&addressdetails=1`
          );
          const data = await res.json();

          if (data?.address) {
            const addr = data.address;
            const rawProvince = addr.province || addr.city || addr.state || '';
            const cleanProv = cleanAdministrativeName(rawProvince);

            const matchedProvince = provinces.find((p) => {
              const cP = cleanAdministrativeName(p);
              return cP.includes(cleanProv) || cleanProv.includes(cP);
            });

            if (matchedProvince) {
              setSelectedProvince(matchedProvince);

              const provWardsData = administrativeData[matchedProvince];
              let targetWards = [];
              if (Array.isArray(provWardsData)) {
                targetWards = provWardsData;
              } else if (typeof provWardsData === 'object') {
                Object.values(provWardsData).forEach((item) => {
                  if (Array.isArray(item)) targetWards.push(...item);
                  else if (typeof item === 'string') targetWards.push(item);
                });
              }

              const rawWard = addr.quarter || addr.suburb || addr.ward || addr.village || addr.town || addr.city_district || '';
              const cleanW = cleanAdministrativeName(rawWard);

              const matchedWard = targetWards.find((w) => {
                const cW = cleanAdministrativeName(w);
                return cW.includes(cleanW) || cleanW.includes(cW);
              });

              if (matchedWard) {
                setSelectedWard(matchedWard);
              }

              const streetParts = [addr.house_number, addr.road].filter(Boolean).join(' ');
              if (streetParts) {
                setDetailAddress(streetParts);
              }
            }

            setAutoDetectedText(data.display_name || '');
            setLocationError('');
          } else {
            setLocationError('Không phân tích được địa chỉ chi tiết từ tọa độ.');
          }
        } catch {
          setLocationError('Lỗi kết nối bản đồ định vị, vui lòng chuyển qua tab "Tự nhập".');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Bạn chưa cấp quyền định vị. Hãy bấm "Cho phép" trên trình duyệt hoặc dùng tab "Tự nhập".');
        } else {
          setLocationError('Không thể lấy tọa độ hiện tại.');
        }
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="space-y-3 font-sans">
      {/* THANH ĐIỀU HƯỚNG DẠNG TAB: 1. LẤY VỊ TRÍ | 2. TỰ NHẬP */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100/90 rounded-2xl border border-stone-200">
        <button
          type="button"
          onClick={() => setInputMode('gps')}
          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            inputMode === 'gps'
              ? 'bg-white text-amber-900 shadow-xs border border-stone-200/60'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Navigation className={`w-3.5 h-3.5 ${inputMode === 'gps' ? 'text-amber-600 fill-amber-600/20' : 'text-stone-400'}`} />
          <span>1. Lấy vị trí GPS</span>
        </button>

        <button
          type="button"
          onClick={() => setInputMode('manual')}
          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            inputMode === 'manual'
              ? 'bg-white text-amber-900 shadow-xs border border-stone-200/60'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Edit3 className={`w-3.5 h-3.5 ${inputMode === 'manual' ? 'text-amber-600' : 'text-stone-400'}`} />
          <span>2. Tự chọn / Nhập tay</span>
        </button>
      </div>

      {/* KHỐI 1: LẤY VỊ TRÍ TỰ ĐỘNG BẰNG GPS */}
      {inputMode === 'gps' && (
        <div className="space-y-2.5 animate-fadeIn">
          {!autoDetectedText ? (
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-dashed border-amber-300 text-center space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                <Navigation className="w-5 h-5 fill-amber-700/20" />
              </div>
              <div>
                <strong className="block text-xs font-bold text-stone-800">Tự động nhận diện địa chỉ giao hàng</strong>
                <p className="text-[11px] text-stone-500 leading-relaxed mt-0.5">
                  Nhấn nút bên dưới để trình duyệt tự điền số nhà, đường, phường xã nơi bạn đang ở.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Đang định vị...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4 fill-white/20" />
                    <span>Cho phép lấy vị trí</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-300/80 rounded-2xl space-y-2.5 shadow-2xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block tracking-wide">
                      Địa chỉ nhận dạng từ GPS thành công:
                    </span>
                    <p className="text-xs text-stone-900 font-medium leading-relaxed mt-1">
                      {autoDetectedText}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-emerald-200/60 text-[11px]">
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                >
                  {isLocating ? 'Đang dò lại...' : 'Định vị lại'}
                </button>
                <span className="text-stone-300">•</span>
                <button
                  type="button"
                  onClick={() => setInputMode('manual')}
                  className="font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                >
                  Chuyển sang sửa tay
                </button>
              </div>
            </div>
          )}

          {locationError && (
            <div className="text-[11px] text-rose-800 bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-start gap-2 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{locationError}</span>
            </div>
          )}
        </div>
      )}

      {/* KHỐI 2: TỰ NHẬP THỦ CÔNG */}
      {inputMode === 'manual' && (
        <div className="space-y-2.5 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <SearchableSelect
              label="Tỉnh / Thành phố *"
              value={selectedProvince}
              options={provinces}
              placeholder="Chọn tỉnh / thành phố"
              onSelect={(prov) => setSelectedProvince(prov)}
            />

            <SearchableSelect
              label="Phường / Xã / Thị trấn *"
              value={selectedWard}
              options={wards}
              placeholder={wards.length > 0 ? "Chọn phường / xã" : "(Chọn tỉnh trước)"}
              disabled={wards.length === 0}
              onSelect={(ward) => setSelectedWard(ward)}
            />
          </div>

          <div className="relative">
            <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              required
              placeholder="Số nhà, tên đường hoặc tên Nhà xe / Chành xe nhận hàng..."
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