// src/components/CustomDropdown.jsx
import React, { useState, useEffect, useRef, useMemo, useLayoutEffect, useId } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import ModalPortal from "./ModalPortal";

export default function CustomDropdown({
  label,
  ariaLabel,
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
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const menuId = useId();
  const [position, setPosition] = useState(null);
  const [mobile, setMobile] = useState(false);
  const [sheetViewport, setSheetViewport] = useState({});
  const positioned = position !== null;
  const close = () => { setIsOpen(false); setSearchQuery(""); triggerRef.current?.focus({ preventScroll: true }); };

  useLayoutEffect(() => {
    if (!isOpen) return;
    const media = window.matchMedia('(max-width: 639px)');
    const measure = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMobile(media.matches);
      const viewport = window.visualViewport;
      if (media.matches && viewport) setSheetViewport({ bottom: Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop), maxHeight: Math.max(120, Math.min(window.innerHeight * .75, viewport.height - 16)) });
      const above = rect.top - 12;
      const below = window.innerHeight - rect.bottom - 12;
      const up = below < 280 && above > below;
      const width = Math.min(Math.max(rect.width, 220), window.innerWidth - 16);
      setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)), width,
        ...(up ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }),
        maxHeight: Math.max(64, up ? above : below) });
    };
    measure();
    window.addEventListener('resize', measure);
    const scroll = e => { if (!panelRef.current?.contains(e.target)) measure(); };
    window.addEventListener('scroll', scroll, true);
    window.visualViewport?.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('scroll', measure);
    return () => { window.removeEventListener('resize', measure); window.removeEventListener('scroll', scroll, true); window.visualViewport?.removeEventListener('resize', measure); window.visualViewport?.removeEventListener('scroll', measure); };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && positioned) panelRef.current?.focus({ preventScroll: true });
  }, [isOpen, positioned]);

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
    <div 
      className="relative w-full min-w-0 font-sans text-stone-800"
    >
      {label && (
        <label className="font-bold text-stone-700 block mb-1.5 text-xs sm:text-sm">
          {label}
        </label>
      )}

      <button
        type="button"
        ref={triggerRef}
        aria-label={ariaLabel || label || placeholder}
        aria-haspopup="dialog"
        aria-controls={isOpen ? menuId : undefined}
        aria-expanded={isOpen}
        onClick={() => {
          if (isOpen) close();
          else { setPosition(null); setIsOpen(true); }
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

      {isOpen && position && (
        <ModalPortal onClose={close} lockScroll={mobile}>
          <div className={`fixed inset-0 ${mobile ? 'bg-stone-950/45' : ''}`} onClick={close}>
            <div ref={panelRef} id={menuId} role="dialog" aria-modal="true" aria-label={label || ariaLabel || 'Chọn tùy chọn'} tabIndex={-1}
              onClick={e => e.stopPropagation()}
              onKeyDown={e => {
                if (e.key !== 'Tab') return;
                const nodes = [...panelRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled)')];
                if (!nodes.length) { e.preventDefault(); return; }
                if (e.shiftKey && (document.activeElement === nodes[0] || document.activeElement === panelRef.current)) { e.preventDefault(); nodes.at(-1).focus(); }
                else if (!e.shiftKey && document.activeElement === nodes.at(-1)) { e.preventDefault(); nodes[0].focus(); }
              }}
              style={mobile ? sheetViewport : position}
              className={`fixed flex flex-col min-h-0 outline-none bg-white border border-amber-200/95 shadow-2xl p-3 gap-2 text-sm ${mobile ? 'inset-x-0 bottom-0 max-h-[75dvh] rounded-t-3xl pb-[max(12px,env(safe-area-inset-bottom))]' : 'rounded-2xl'}`}>
              <div className="flex shrink-0 items-center justify-between gap-2">
                <span className="text-xs font-bold text-stone-600">{label || headerLabel || 'Chọn tùy chọn'}</span>
                <button type="button" aria-label="Đóng danh sách" onClick={close} className="size-11 sm:size-8 rounded-lg flex items-center justify-center hover:bg-stone-100"><X className="size-4"/></button>
              </div>
          {searchable && (
            <div className="px-1 pt-1">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full h-10 px-3.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-base sm:text-sm font-medium focus:outline-none focus:border-amber-600 shadow-2xs text-stone-900"
              />
            </div>
          )}

          {headerLabel && !searchable && !label && (
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">
              {headerLabel}
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain space-y-1 pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    key={String(optVal)}
                    onClick={() => {
                      if (triggerRef.current?.matches(":disabled")) { close(); return; }
                      onChange(optVal, opt);
                      close();
                    }}
                    className={`w-full min-h-11 text-left p-3 rounded-xl cursor-pointer flex items-center justify-between gap-2 transition-all ${
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
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-stone-400 text-xs italic">
                Không tìm thấy lựa chọn phù hợp
              </div>
            )}
          </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}