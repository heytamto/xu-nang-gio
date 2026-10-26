// src/components/AddressField.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  MapPin, Navigation, Loader2, ChevronDown, 
  AlertTriangle, Search, Check, X, Edit3, CheckCircle2,
  AlertCircle
} from 'lucide-react';
import rawData from '../data/administrative_units.json';
import { 
  normalizeVietnameseText, 
  cleanAdministrativeName 
} from '../utils/validationUtils';

const administrativeData = rawData || {};

// Component Searchable Select Dropdown tối ưu
function SearchableSelect({ label, value, options = [], placeholder, onSelect, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const filteredOptions = useMemo(() => {
    if (!keyword.trim()) return options;
    const normKey = normalizeVietnameseText(keyword);
    return options.filter((opt) => normalizeVietnameseText(opt).includes(normKey));
  }, [options, keyword]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setKeyword('');
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
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className="relative font-sans text-stone-800" ref={wrapperRef}>
      <label className="text-xs sm:text-sm font-bold text-stone-700 block mb-1.5">{label}</label>

      <button
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={`w-full text-xs sm:text-sm p-3 rounded-2xl border text-left flex items-center justify-between transition-all shadow-2xs cursor-pointer ${
          disabled
            ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
            : isOpen
            ? 'border-amber-600 bg-white ring-2 ring-amber-500/20 text-stone-900 font-bold'
            : 'border-stone-200 bg-white hover:border-stone-300 text-stone-900 font-medium'
        }`}
      >
        <span className="truncate">
          {value || <span className="text-stone-400 font-normal">{placeholder}</span>}
        </span>
        <ChevronDown className={`w-4 h-4 text-stone-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-amber-600' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden animate-fadeIn font-sans">
          <div className="p-2.5 border-b border-stone-100 bg-stone-50/70 flex items-center gap-2">
            <Search className="w-4 h-4 text-stone-400 shrink-0 ml-1" />
            <input
              ref={inputRef}
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Gõ để tìm nhanh..."
              className="w-full text-xs sm:text-sm bg-transparent border-none focus:outline-none text-stone-800 placeholder-stone-400 font-medium"
            />
            {keyword && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-md cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <ul className="max-h-56 overflow-y-auto text-xs sm:text-sm divide-y divide-stone-50 p-1.5 [-ms-overflow-style:none] [scrollbar-width:thin]">
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
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-amber-100 text-amber-950 font-bold'
                          : 'hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <span className="truncate">{opt}</span>
                      {isSelected && <Check className="w-4 h-4 text-amber-700 stroke-[2.5] shrink-0 ml-2" />}
                    </button>
                  </li>
                );
              })
            ) : (
              <li className="p-3.5 text-center text-xs text-stone-400 italic">
                Không tìm thấy "{keyword}"
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function AddressField({ value = '', onChange, error = '' }) {
  const [inputMode, setInputMode] = useState('manual');

  const provinces = useMemo(() => Object.keys(administrativeData), []);
  const defaultProv = useMemo(() => {
    return provinces.find((p) => p.includes('Hồ Chí Minh')) || 
           provinces.find((p) => p.includes('Ninh Thuận')) || 
           provinces.find((p) => p.includes('Khánh Hòa')) || 
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

  const [selectedWard, setSelectedWard] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [detailTouched, setDetailTouched] = useState(false);
  const [autoDetectedText, setAutoDetectedText] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const lastEmittedValue = useRef('');
  const isInitialParsed = useRef(false);

  // Phân tách địa chỉ thông minh khi có `value` truyền vào từ đầu
  useEffect(() => {
    if (value && !isInitialParsed.current && provinces.length > 0) {
      isInitialParsed.current = true;
      lastEmittedValue.current = value;

      const parts = value.split(',').map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 3) {
        const rawProv = parts[parts.length - 1];
        const matchedProv = provinces.find((p) => 
          cleanAdministrativeName(p).includes(cleanAdministrativeName(rawProv)) ||
          cleanAdministrativeName(rawProv).includes(cleanAdministrativeName(p))
        );

        if (matchedProv) {
          setSelectedProvince(matchedProv);
          const provWardsData = administrativeData[matchedProv];
          let targetWards = [];
          if (Array.isArray(provWardsData)) targetWards = provWardsData;
          else if (typeof provWardsData === 'object') {
            Object.values(provWardsData).forEach((item) => {
              if (Array.isArray(item)) targetWards.push(...item);
              else if (typeof item === 'string') targetWards.push(item);
            });
          }

          const rawWard = parts[parts.length - 2];
          const matchedWard = targetWards.find((w) =>
            cleanAdministrativeName(w).includes(cleanAdministrativeName(rawWard)) ||
            cleanAdministrativeName(rawWard).includes(cleanAdministrativeName(w))
          );

          if (matchedWard) {
            setSelectedWard(matchedWard);
            setDetailAddress(parts.slice(0, parts.length - 2).join(', '));
            return;
          }
        }
      }

      setDetailAddress(value);
    }
  }, [value, provinces]);

  useEffect(() => {
    if (wards.length > 0) {
      if (!wards.includes(selectedWard)) {
        setSelectedWard(wards[0]);
      }
    } else {
      setSelectedWard('');
    }
  }, [wards]);

  const isDetailEmpty = !detailAddress.trim();
  const isDetailTooShort = detailAddress.trim().length > 0 && detailAddress.trim().length < 4;
  const showDetailError = detailTouched && (isDetailEmpty || isDetailTooShort);

  // Emit địa chỉ hoàn chỉnh lên form cha
  useEffect(() => {
    let full = '';
    if (inputMode === 'gps' && autoDetectedText) {
      full = autoDetectedText;
    } else if (inputMode === 'manual') {
      const cleanDetail = detailAddress.trim();
      if (cleanDetail.length >= 4 && selectedWard && selectedProvince) {
        full = [
          cleanDetail,
          selectedWard,
          selectedProvince
        ].filter(Boolean).join(', ');
      } else {
        full = '';
      }
    }

    if (full !== lastEmittedValue.current) {
      lastEmittedValue.current = full;
      if (onChange) onChange(full);
    }
  }, [inputMode, autoDetectedText, detailAddress, selectedWard, selectedProvince, onChange]);

  const handleGetLocation = useCallback(() => {
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
            setLocationError('Tọa độ nằm ngoài Việt Nam (có thể do bật VPN). Bạn vui lòng dùng tab "Tự chọn / Nhập tay".');
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
          setLocationError('Lỗi kết nối bản đồ định vị, vui lòng chuyển qua tab "Tự chọn / Nhập tay".');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Bạn chưa cấp quyền định vị. Hãy bấm "Cho phép" trên trình duyệt hoặc dùng tab "Tự chọn / Nhập tay".');
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
  }, [provinces]);

  return (
    <div className="space-y-3.5 font-sans text-stone-800">
      {/* THANH ĐIỀU HƯỚNG DẠNG TAB: 1. LẤY VỊ TRÍ | 2. TỰ NHẬP */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-stone-100/90 rounded-2xl border border-stone-200">
        <button
          type="button"
          onClick={() => setInputMode('manual')}
          className={`py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            inputMode === 'manual'
              ? 'bg-white text-amber-900 shadow-xs border border-stone-200/80'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Edit3 className={`w-4 h-4 ${inputMode === 'manual' ? 'text-amber-600' : 'text-stone-400'}`} />
          <span>1. Tự chọn / Nhập tay</span>
        </button>

        <button
          type="button"
          onClick={() => setInputMode('gps')}
          className={`py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            inputMode === 'gps'
              ? 'bg-white text-amber-900 shadow-xs border border-stone-200/80'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Navigation className={`w-4 h-4 ${inputMode === 'gps' ? 'text-amber-600 fill-amber-600/20' : 'text-stone-400'}`} />
          <span>2. Lấy vị trí GPS</span>
        </button>
      </div>

      {/* KHỐI 1: TỰ NHẬP THỦ CÔNG */}
      {inputMode === 'manual' && (
        <div className="space-y-3 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div>
            <label className="text-xs sm:text-sm font-bold text-stone-700 block mb-1.5">
              Địa chỉ chi tiết / Điểm gửi xe <span className="text-rose-500 font-bold">*</span>
            </label>
            <div className="relative">
              <MapPin className={`w-4 h-4 absolute left-3.5 top-3.5 transition-colors ${
                showDetailError ? 'text-rose-500' : 'text-stone-400'
              }`} />
              <input
                type="text"
                required
                placeholder="Số nhà, ngõ/hẻm, tên đường hoặc Bến xe / Nhà xe nhận hàng..."
                value={detailAddress}
                onBlur={() => setDetailTouched(true)}
                onChange={(e) => {
                  setDetailAddress(e.target.value);
                  if (!detailTouched) setDetailTouched(true);
                }}
                className={`w-full text-xs sm:text-sm pl-10 pr-4 py-3 rounded-2xl border font-medium transition-all shadow-2xs focus:outline-none ${
                  showDetailError
                    ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 ring-2 ring-rose-500/10'
                    : 'border-stone-200 bg-white text-stone-800 focus:border-amber-600 ring-2 ring-amber-500/10'
                }`}
              />
            </div>

            {showDetailError && (
              <p className="text-xs sm:text-sm text-rose-600 font-semibold mt-1.5 flex items-center gap-1.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  {isDetailEmpty
                    ? 'Bắt buộc điền số nhà, tên đường hoặc bến xe để gửi hàng.'
                    : 'Địa chỉ quá ngắn, vui lòng nhập rõ ràng hơn (tối thiểu 4 ký tự).'}
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* KHỐI 2: LẤY VỊ TRÍ TỰ ĐỘNG BẰNG GPS */}
      {inputMode === 'gps' && (
        <div className="space-y-3 animate-fadeIn">
          {!autoDetectedText ? (
            <div className="p-5 bg-amber-50/60 rounded-3xl border border-dashed border-amber-300 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-inner">
                <Navigation className="w-6 h-6 fill-amber-700/20" />
              </div>
              <div className="space-y-1">
                <strong className="block text-sm sm:text-base font-bold text-stone-900">Tự động nhận diện địa chỉ giao hàng</strong>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
                  Nhấn nút bên dưới để trình duyệt tự điền số nhà, đường, phường xã nơi bạn đang ở.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer active:scale-95"
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
            <div className="p-4 sm:p-5 bg-emerald-50/80 border border-emerald-300/80 rounded-3xl space-y-3 shadow-2xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs uppercase font-bold text-emerald-800 block tracking-wider">
                      Địa chỉ nhận dạng từ GPS thành công:
                    </span>
                    <p className="text-sm sm:text-base text-stone-900 font-semibold leading-relaxed mt-1">
                      {autoDetectedText}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-emerald-200/60 text-xs sm:text-sm">
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
            <div className="text-xs sm:text-sm text-rose-800 bg-rose-50 p-3 rounded-2xl border border-rose-200 flex items-start gap-2.5 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{locationError}</span>
            </div>
          )}
        </div>
      )}

      {/* Cảnh báo lỗi chung từ form Checkout nếu khách chưa hoàn thành */}
      {error && !showDetailError && (
        <p className="text-xs sm:text-sm text-rose-600 font-semibold flex items-center gap-1.5 animate-fadeIn pl-1">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}