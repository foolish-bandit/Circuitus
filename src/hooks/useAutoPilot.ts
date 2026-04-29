import { useEffect } from 'react';

interface AutoPilotOptions {
  enabled: boolean;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  /** Optional callback fired every few minutes for opt-in doc rotation. */
  onIdleRotate?: () => void;
}

/**
 * Idle reading simulation. When enabled, the scroll container drifts
 * downward at human-plausible cadence and occasionally flashes a brief
 * text selection on a sentence. Designed to make the page look alive
 * during a screen-share or shoulder-glance.
 */
export function useAutoPilot({ enabled, scrollContainerRef, onIdleRotate }: AutoPilotOptions) {
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    function scheduleScroll() {
      if (cancelled) return;
      const wait = 12_000 + Math.random() * 13_000;
      setTimeout(() => {
        if (cancelled) return;
        const el = scrollContainerRef.current;
        if (el && el.scrollHeight - el.clientHeight - el.scrollTop > 80) {
          const delta = 30 + Math.random() * 50;
          el.scrollBy({ top: delta, behavior: 'smooth' });
        } else if (el) {
          // At the bottom — drift a small amount upward to keep it looking alive
          el.scrollBy({ top: -120 - Math.random() * 60, behavior: 'smooth' });
        }
        scheduleScroll();
      }, wait);
    }

    function scheduleSelection() {
      if (cancelled) return;
      const wait = 25_000 + Math.random() * 35_000;
      setTimeout(() => {
        if (cancelled) return;
        const el = scrollContainerRef.current;
        if (!el) {
          scheduleSelection();
          return;
        }
        // Pick a visible paragraph and select a random clause inside it.
        const paragraphs = Array.from(
          el.querySelectorAll<HTMLElement>('p, li'),
        ).filter((p) => {
          const rect = p.getBoundingClientRect();
          const containerRect = el.getBoundingClientRect();
          return (
            rect.top >= containerRect.top &&
            rect.bottom <= containerRect.bottom &&
            (p.textContent ?? '').trim().length > 30
          );
        });
        if (paragraphs.length === 0) {
          scheduleSelection();
          return;
        }
        const p = paragraphs[Math.floor(Math.random() * paragraphs.length)];
        const text = p.textContent ?? '';
        const sentences = text.split(/(?<=[.;])\s+/).filter((s) => s.length > 20);
        if (sentences.length === 0) {
          scheduleSelection();
          return;
        }
        const target = sentences[Math.floor(Math.random() * sentences.length)];
        const start = text.indexOf(target);
        if (start < 0) {
          scheduleSelection();
          return;
        }
        try {
          const range = document.createRange();
          // Walk text nodes to find the start offset.
          const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
          let consumed = 0;
          let startNode: Text | null = null;
          let startOffset = 0;
          let endNode: Text | null = null;
          let endOffset = 0;
          while (walker.nextNode()) {
            const node = walker.currentNode as Text;
            const len = node.data.length;
            if (!startNode && consumed + len > start) {
              startNode = node;
              startOffset = start - consumed;
            }
            if (startNode && consumed + len >= start + target.length) {
              endNode = node;
              endOffset = start + target.length - consumed;
              break;
            }
            consumed += len;
          }
          if (startNode && endNode) {
            range.setStart(startNode, startOffset);
            range.setEnd(endNode, endOffset);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
            // Brief pulse — clear after ~1s.
            setTimeout(() => {
              if (cancelled) return;
              const cur = window.getSelection();
              if (cur && cur.toString() === target) cur.removeAllRanges();
            }, 1100);
          }
        } catch {
          // ignore
        }
        scheduleSelection();
      }, wait);
    }

    function scheduleRotate() {
      if (cancelled || !onIdleRotate) return;
      const wait = 4 * 60_000 + Math.random() * 3 * 60_000;
      setTimeout(() => {
        if (cancelled) return;
        onIdleRotate();
        scheduleRotate();
      }, wait);
    }

    scheduleScroll();
    scheduleSelection();
    scheduleRotate();

    return () => {
      cancelled = true;
    };
  }, [enabled, scrollContainerRef, onIdleRotate]);
}
