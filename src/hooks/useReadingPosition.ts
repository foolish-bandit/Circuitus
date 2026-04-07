import { useEffect, useRef, useCallback } from 'react';
import { updateReadingPosition } from '@/lib/storage';
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

  return { savePosition };
}
