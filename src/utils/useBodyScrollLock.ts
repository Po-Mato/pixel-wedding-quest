import { useEffect } from 'react';

let activeLockCount = 0;
let savedBodyOverflow = '';

/**
 * Ref-counted body scroll lock so stacked modals/lightboxes don't unlock background scrolling prematurely.
 */
export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') return;

    if (activeLockCount === 0) {
      savedBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    activeLockCount += 1;

    return () => {
      activeLockCount = Math.max(0, activeLockCount - 1);
      if (activeLockCount === 0) {
        document.body.style.overflow = savedBodyOverflow;
      }
    };
  }, [locked]);
}
