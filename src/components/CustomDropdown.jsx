// src/components/CustomDropdown.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Check } from "lucide-react";

export default function CustomDropdown({
  label,
  headerLabel = "DANH SÁCH TÙY CHỌN:",
  options = [],
  value,
  onChange,
  renderSelected,
  renderOption,
  icon: Icon,
  searchable = true,
  searchPlaceholder = "Gõ để tìm kiếm nhanh...",
  placeholder = "-- Chọn một mục --",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter((opt) => {
      const labelText = (opt.label || opt.name || opt.shortName || "").toLowerCase();
      const binText = String(opt.bin || "").toLowerCase();
      const valText = String(opt.value ?? opt.id ?? "").toLowerCase();
      return labelText.includes(q) || binText.includes(q) || valText.includes(q);
    });
  }, [options, searchQuery]);

  // So sánh nới lỏng chuỗi để tránh lệch type string/number
  const selectedOpt = useMemo(() => {
    if (value === undefined || value === null || value === "") return null;
    return options.find(
      (opt) =>
        String(opt.value ?? opt.id ?? opt.bin ?? "") === String(value)
    );
  }, [options, value]);

  return (
    <div className="relative w-full font-sans text-stone-800" ref={containerRef}>
      {label && (
        <label className="font-bold text-stone-700 block mb-1.5 text-xs sm:text-sm">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (isOpen) setSearchQuery("");
        }}
        className={`w-full h-11 px-4 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all duration-200 cursor-pointer text-xs sm:text-sm ${
          isOpen
            ? "bg-amber-50/60 border-amber-500 ring-2 ring-amber-400/20 shadow-xs text-stone-900 font-bold"
            : "bg-white hover:bg-stone-50/80 border-stone-200 hover:border-amber-500 shadow-2xs text-stone-800 font-medium"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon className="w-4 h-4 text-amber-700 shrink-0" />}
          <div className="truncate font-bold text-stone-900">
            {selectedOpt ? (
              renderSelected ? renderSelected(selectedOpt) : (selectedOpt.label || selectedOpt.name)
            ) : (
              <span className="text-stone-400 font-normal">{placeholder}</span>
            )}
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-180 text-amber-700" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 p-2.5 rounded-2xl bg-white border border-amber-200/95 shadow-2xl space-y-2 animate-fadeIn text-xs sm:text-sm">
          {searchable && (
            <div className="px-1 pt-1">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full h-10 px-3.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-xs sm:text-sm font-medium focus:outline-none focus:border-amber-600 shadow-2xs text-stone-900"
                autoFocus
              />
            </div>
          )}

          {headerLabel && !searchable && (
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">
              {headerLabel}
            </div>
          )}

          <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const optVal =
                  opt.value !== undefined
                    ? opt.value
                    : opt.bin !== undefined
                    ? opt.bin
                    : opt.id;
                const isSelected = String(optVal) === String(value);

                return (
                  <div
                    key={String(optVal)}
                    onClick={() => {
                      onChange(optVal, opt);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className={`p-3 rounded-xl cursor-pointer flex items-center justify-between gap-2 transition-all ${
                      isSelected
                        ? "bg-amber-100/80 text-amber-950 font-bold border border-amber-300 shadow-2xs"
                        : "hover:bg-amber-50/70 text-stone-700 font-medium"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      {renderOption ? (
                        renderOption(opt, isSelected)
                      ) : (
                        <span className="truncate">{opt.label || opt.name}</span>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-amber-800 shrink-0 stroke-[2.5]" />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-stone-400 text-xs italic">
                Không tìm thấy lựa chọn phù hợp
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}