import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MapPin, Navigation, Loader2, ChevronDown, RotateCcw, 
  AlertTriangle, Search, Check, X 
} from 'lucide-react';
import rawData from '../data/administrative_units.json';

const administrativeData = rawData || {};

// Chuẩn hóa tiếng Việt bỏ dấu để tìm kiếm gõ nhanh
const normalizeText = (str = '') => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
};

const cleanAdministrativeName = (str = '') => {
  return str
    .toLowerCase()
    .replace(/(tỉnh|thành phố|tp\.|tp|quận|huyện|thị xã|phường|xã|thị trấn)/g, '')
    .trim();
};

// Component Searchable Select Dropdown có DEBOUNCE
function SearchableSelect({ label, value, options = [], placeholder, onSelect, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // DEBOUNCE 200ms cho việc filter danh sách
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 200);

    return () => clearTimeout(timer);
  }, [keyword]);

  // Lọc danh sách theo debouncedKeyword
  const filteredOptions = useMemo(() => {
    if (!debouncedKeyword.trim()) return options;
    const normKey = normalizeText(debouncedKeyword);
    return options.filter((opt) => normalizeText(opt).includes(normKey));
  }, [options, debouncedKeyword]);

  // Đóng dropdown khi click ra ngoài
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

      {/* Button kích hoạt dropdown */}
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

      {/* Menu tìm kiếm & kết quả */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
          {/* Ô nhập từ khóa có debounce */}
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

          {/* Danh sách lọc */}
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
            setLocationError('Vị trí ngoài VN (có thể do bật VPN). Vui lòng chọn bên dưới.');
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
            setLocationError('Không tìm thấy địa chỉ chi tiết.');
          }
        } catch {
          setLocationError('Lỗi kết nối bản đồ, vui lòng chọn từ danh sách.');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Bạn đã từ chối quyền định vị trên trình duyệt.');
        } else {
          setLocationError('Không tìm thấy tọa độ hiện tại.');
        }
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const quickProvinces = [
    { label: 'TP. Hồ Chí Minh', keyword: 'Hồ Chí Minh' },
    { label: 'Khánh Hòa', keyword: 'Khánh Hòa' },
    { label: 'Đồng Nai', keyword: 'Đồng Nai' }
  ];

  return (
    <div className="space-y-3 font-sans">
      {/* Gợi ý nhanh + Nút GPS */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="text-[11px] font-semibold text-stone-500 whitespace-nowrap">Gợi ý:</span>
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
                className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all whitespace-nowrap font-medium cursor-pointer ${
                  isSelected
                    ? 'bg-amber-600 text-white border-amber-600 shadow-2xs font-bold'
                    : 'bg-white hover:bg-stone-50 text-stone-600 border-stone-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleGetLocation}
          disabled={isLocating}
          className="text-[11px] font-semibold text-amber-800 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-50 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all border border-amber-600/20 shadow-2xs cursor-pointer shrink-0"
        >
          {isLocating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
              <span>Đang dò...</span>
            </>
          ) : (
            <>
              <Navigation className="w-3 h-3 text-amber-700 fill-amber-700/20" />
              <span>Định vị GPS</span>
            </>
          )}
        </button>
      </div>

      {locationError && (
        <div className="text-[11px] text-rose-800 bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-start gap-2 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{locationError}</span>
        </div>
      )}

      {/* Kết quả nhận diện GPS */}
      {autoDetectedText ? (
        <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start justify-between gap-3 shadow-2xs animate-fadeIn">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wide">
                Đã tự động điền từ GPS:
              </span>
              <p className="text-xs text-stone-800 font-medium leading-relaxed mt-0.5">
                {autoDetectedText}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAutoDetectedText('')}
            className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
            title="Đổi sang chỉnh sửa thủ công"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Bộ đôi Searchable Dropdown có Debounce */
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <SearchableSelect
              label="Tỉnh / Thành phố *"
              value={selectedProvince}
              options={provinces}
              placeholder="Chọn tỉnh / thành phố"
              onSelect={(prov) => {
                setAutoDetectedText('');
                setSelectedProvince(prov);
              }}
            />

            <SearchableSelect
              label="Phường / Xã / Thị trấn *"
              value={selectedWard}
              options={wards}
              placeholder={wards.length > 0 ? "Chọn phường / xã" : "(Chọn tỉnh trước)"}
              disabled={wards.length === 0}
              onSelect={(ward) => {
                setAutoDetectedText('');
                setSelectedWard(ward);
              }}
            />
          </div>

          <div className="relative">
            <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              required
              placeholder="Địa chỉ cụ thể: Số nhà, tên đường hoặc tên Nhà xe / Chành xe nhận hàng..."
              value={detailAddress}
              onChange={(e) => {
                setAutoDetectedText('');
                setDetailAddress(e.target.value);
              }}
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-amber-600 font-medium text-stone-800 shadow-2xs"
            />
          </div>
        </div>
      )}
    </div>
  );
}