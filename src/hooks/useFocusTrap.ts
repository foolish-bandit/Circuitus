import { useEffect, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Trap keyboard focus within `containerRef` while `active` is true.
 * Restores focus to the previously-focused element on deactivation.
 */
export function useFocusTrap(active: boolean, containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE);
    const first = focusables[0];
    if (first) {
      // Defer so any open animation finishes before stealing focus.
      requestAnimationFrame(() => first.focus());
    } else {
      container.setAttribute('tabindex', '-1');
      container.focus();
    }

    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const cur = container?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!cur || cur.length === 0) {
        e.preventDefault();
        return;
      }
      const firstEl = cur[0];
      const lastEl = cur[cur.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [active, containerRef]);
}
