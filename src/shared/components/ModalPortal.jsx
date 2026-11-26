import { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const stack = [];
let scrollLocks = 0;
let savedOverflow = '';
const useBrowserLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

function updateLayers() {
  stack.forEach((entry, index) => {
    entry.node.style.zIndex = String(10000 + index);
  });
}

export default function ModalPortal({
  children, open = true, onClose, closeOnEscape = true, lockScroll = true
}) {
  const layerRef = useRef(null);
  const optionsRef = useRef({ onClose, closeOnEscape });
  useBrowserLayoutEffect(() => {
    optionsRef.current = { onClose, closeOnEscape };
  }, [onClose, closeOnEscape]);

  useBrowserLayoutEffect(() => {
    if (!open || !layerRef.current) return;
    const entry = { node: layerRef.current };
    stack.push(entry);
    updateLayers();
    const onKey = (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing || stack.at(-1) !== entry) return;
      event.preventDefault();
      event.stopPropagation();
      const options = optionsRef.current;
      if (options.closeOnEscape && !event.repeat) options.onClose?.();
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      const index = stack.indexOf(entry);
      if (index >= 0) stack.splice(index, 1);
      updateLayers();
    };
  }, [open]);

  useBrowserLayoutEffect(() => {
    if (!open || !lockScroll || typeof document === 'undefined') return;
    if (scrollLocks++ === 0) {
      savedOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    return () => {
      if (--scrollLocks === 0) document.body.style.overflow = savedOverflow;
    };
  }, [open, lockScroll]);

  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div ref={layerRef} data-modal-layer="" style={{ position: 'fixed', inset: 0, zIndex: 10000 }}
      onClick={(event) => event.stopPropagation()}>
      {children}
    </div>,
    document.body
  );
}
