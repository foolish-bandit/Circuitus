import { useEffect, useRef, useCallback } from 'react';
import { updateReadingPosition, getDocument } from '@/lib/storage';
import type { ReadingPosition } from '@/types';

export function useReadingPosition(
  documentId: string | null,
  scrollContainerRef: React.RefObject<HTMLElement | null>,
  chapterIndex: number,
) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const savePosition = useCallback(() => {
    if (!documentId || !scrollContainerRef.current) return;

    const el = scrollContainerRef.current;
    const scrollPercent = el.scrollHeight > el.clientHeight
      ? (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100
      : 0;

    const position: ReadingPosition = {
      chapterIndex,
      scrollPercent: Math.round(scrollPercent * 100) / 100,
    };

    updateReadingPosition(documentId, position);
  }, [documentId, chapterIndex, scrollContainerRef]);

  // Debounced save on scroll (every 2s)
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || !documentId) return;

    const handleScroll = () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(savePosition, 2000);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [documentId, savePosition, scrollContainerRef]);

  // Restore scroll position on document open
  const restorePosition = useCallback(async () => {
    if (!documentId || !scrollContainerRef.current) return null;

    const doc = await getDocument(documentId);
    if (!doc?.readingPosition) return null;

    const el = scrollContainerRef.current;
    const { scrollPercent, chapterIndex: savedChapter } = doc.readingPosition;

    if (scrollPercent > 0) {
      // Wait for content to render
      requestAnimationFrame(() => {
        const scrollTarget = (el.scrollHeight - el.clientHeight) * (scrollPercent / 100);
        el.scrollTop = scrollTarget;
      });
    }

    return { chapterIndex: savedChapter, scrollPercent };
  }, [documentId, scrollContainerRef]);

  return { savePosition, restorePosition };
}
