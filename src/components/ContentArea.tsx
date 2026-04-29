import { useEffect, useRef, useState, useCallback } from 'react';
import { FileText, Bookmark, Highlighter } from 'lucide-react';
import type { DocumentChapter } from '@/types';

interface ContentAreaProps {
  /** Render chapters sequentially (uploaded docs) */
  chapters?: DocumentChapter[];
  /** Render raw HTML blob (standin docs) */
  rawContent?: string;
  refNumber?: string;
  documentTitle?: string;
  isEmpty?: boolean;
  fontSize?: number;
  showParagraphNumbers?: boolean;
  activeChapterIndex?: number;
  onActiveChapterChange?: (index: number) => void;
  onHighlight?: (payload: {
    text: string;
    color: 'yellow' | 'blue' | 'green';
    startOffset: number;
    endOffset: number;
  }) => void;
  onBookmark?: (text: string) => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  initialScrollPercent?: number;
  children?: React.ReactNode;
}

const CHAPTER_OBSERVER_ROOT_MARGIN = '-10% 0px -80% 0px';

const HIGHLIGHT_COLORS: { color: 'yellow' | 'blue' | 'green'; bg: string; label: string }[] = [
  { color: 'yellow', bg: 'bg-yellow-300', label: 'Yellow' },
  { color: 'blue', bg: 'bg-blue-300', label: 'Blue' },
  { color: 'green', bg: 'bg-green-300', label: 'Green' },
];

export default function ContentArea({
  chapters,
  rawContent,
  refNumber,
  documentTitle,
  isEmpty = true,
  fontSize = 14.5,
  showParagraphNumbers = false,
  activeChapterIndex = 0,
  onActiveChapterChange,
  onHighlight,
  onBookmark,
  scrollContainerRef,
  initialScrollPercent,
  children,
}: ContentAreaProps) {
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const effectiveScrollRef = scrollContainerRef ?? internalScrollRef;
  const contentRef = useRef<HTMLDivElement>(null);
  const hasRestoredRef = useRef(false);

  // Stable fallback ref number (generated once per mount).
  // Math.random is impure, so we compute it inside a useState initializer
  // rather than useMemo to satisfy the react-hooks/purity rule.
  const [fallbackRefNumber] = useState(
    () => `CIR-2026-${String(Math.floor(Math.random() * 90000) + 10000)}`,
  );

  // Selection toolbar state
  const [selectionToolbar, setSelectionToolbar] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);

  // --- IntersectionObserver for active chapter tracking ---
  useEffect(() => {
    if (!chapters?.length || !onActiveChapterChange) return;

    const container = effectiveScrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-chapter-index'));
            if (!isNaN(idx)) {
              onActiveChapterChange(idx);
            }
          }
        }
      },
      {
        root: container,
        rootMargin: CHAPTER_OBSERVER_ROOT_MARGIN,
        threshold: 0,
      },
    );

    const headings = container.querySelectorAll('[data-chapter-index]');
    headings.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [chapters, onActiveChapterChange, effectiveScrollRef]);

  // --- Restore scroll position on mount ---
  useEffect(() => {
    if (hasRestoredRef.current || !initialScrollPercent || initialScrollPercent <= 0) return;
    const el = effectiveScrollRef.current;
    if (!el) return;

    // Wait a tick for content to render
    requestAnimationFrame(() => {
      const scrollTarget = (el.scrollHeight - el.clientHeight) * (initialScrollPercent / 100);
      el.scrollTop = scrollTarget;
      hasRestoredRef.current = true;
    });
  }, [initialScrollPercent, effectiveScrollRef]);

  // Reset restore flag when document changes
  useEffect(() => {
    hasRestoredRef.current = false;
  }, [documentTitle]);

  // --- Exhibit captions for images ---
  useEffect(() => {
    if (!contentRef.current) return;
    const images = contentRef.current.querySelectorAll('img:not([data-exhibit-processed])');
    let exhibitCount = contentRef.current.querySelectorAll('.exhibit-caption').length;

    images.forEach((img) => {
      img.setAttribute('data-exhibit-processed', 'true');
      exhibitCount++;
      const caption = document.createElement('figcaption');
      caption.className = 'exhibit-caption';
      caption.textContent = `Exhibit ${exhibitCount}`;

      const figure = document.createElement('figure');
      figure.className = 'exhibit-figure';
      img.parentNode?.insertBefore(figure, img);
      figure.appendChild(img);
      figure.appendChild(caption);
    });
  }, [chapters, rawContent]);

  // --- Text selection toolbar ---
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      // Delay hiding to allow toolbar clicks
      setTimeout(() => setSelectionToolbar(null), 200);
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 2) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = effectiveScrollRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    setSelectionToolbar({
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top - containerRect.top - 8,
      text,
    });
  }, [effectiveScrollRef]);

  // --- Left/Right arrow key chapter navigation ---
  useEffect(() => {
    if (!chapters?.length || !onActiveChapterChange) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing or has an active selection context
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) return;

      if (e.key === 'ArrowLeft') {
        const prev = Math.max(0, activeChapterIndex - 1);
        onActiveChapterChange(prev);
        const el = document.getElementById(`chapter-${prev}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (e.key === 'ArrowRight') {
        const next = Math.min(chapters.length - 1, activeChapterIndex + 1);
        onActiveChapterChange(next);
        const el = document.getElementById(`chapter-${next}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chapters, activeChapterIndex, onActiveChapterChange]);

  const handleHighlight = (color: 'yellow' | 'blue' | 'green') => {
    if (!selectionToolbar) return;

    const selection = window.getSelection();
    let startOffset = 0;
    let endOffset = selectionToolbar.text.length;

    if (selection && !selection.isCollapsed) {
      try {
        const range = selection.getRangeAt(0);
        // Anchor offsets to the enclosing chapter container so they remain
        // meaningful across re-renders.
        const container =
          (range.startContainer.parentElement?.closest('[data-chapter-index]') as HTMLElement | null) ??
          contentRef.current;
        if (container) {
          const pre = range.cloneRange();
          pre.selectNodeContents(container);
          pre.setEnd(range.startContainer, range.startOffset);
          startOffset = pre.toString().length;
          endOffset = startOffset + selectionToolbar.text.length;
        }

        const mark = document.createElement('mark');
        mark.className = `highlight-${color}`;
        range.surroundContents(mark);
      } catch {
        // If range spans multiple elements, just save without visual
      }
      selection.removeAllRanges();
    }

    onHighlight?.({ text: selectionToolbar.text, color, startOffset, endOffset });
    setSelectionToolbar(null);
  };

  const handleBookmark = () => {
    if (!selectionToolbar) return;
    onBookmark?.(selectionToolbar.text);
    window.getSelection()?.removeAllRanges();
    setSelectionToolbar(null);
  };

  const hasContent = !isEmpty && (chapters?.length || rawContent || children);

  return (
    <div
      ref={effectiveScrollRef}
      className="flex-1 overflow-y-auto bg-cream relative min-w-[600px]"
      onMouseUp={handleMouseUp}
    >
      <div className="max-w-reading-pane mx-auto bg-white min-h-full border-x border-border/50 shadow-sm px-12 py-10">
        {/* Legal header */}
        <div className="text-center mb-8 pb-6 border-b border-border">
          <p className="text-[10px] font-serif uppercase tracking-[0.2em] text-navy/60 mb-1">
            CIRCUITUS PRACTICE RESOURCE
          </p>
          {documentTitle && (
            <h1 className="font-serif text-lg font-bold text-navy mt-2 mb-2 leading-snug">
              {documentTitle}
            </h1>
          )}
          {!documentTitle && (
            <p className="text-xs font-sans text-text-muted mb-2">
              In-House Counsel Reference Library — Transactional Division
            </p>
          )}
          <p className="font-mono text-[10px] text-text-muted tracking-wider">
            Ref. {refNumber || fallbackRefNumber}
          </p>
        </div>

        {/* Content */}
        {!hasContent ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-12 h-12 text-border mb-4" />
            <p className="text-sm font-sans text-text-muted max-w-sm leading-relaxed">
              No source documents loaded. Import a document or select a Saved Authority to begin.
            </p>
          </div>
        ) : (
          <div ref={contentRef}>
            {/* Pass-through children (e.g. back button) */}
            {children}

            {/* Chapters rendered sequentially */}
            {chapters?.map((ch, i) => (
              <div key={ch.id} id={`chapter-${i}`} data-chapter-index={i} className="mb-10">
                <h2 className="font-serif text-navy font-bold text-lg border-b border-border pb-2 mb-4">
                  &sect; {i + 1}. {ch.title}
                </h2>
                <div
                  className={`prose-legal ${showParagraphNumbers ? 'numbered' : ''}`}
                  style={{ fontSize: `${fontSize}px`, lineHeight: '1.85' }}
                  dangerouslySetInnerHTML={{ __html: ch.content }}
                />
              </div>
            ))}

            {/* Raw HTML content (standin documents) */}
            {rawContent && !chapters?.length && (
              <div
                className={`prose-legal ${showParagraphNumbers ? 'numbered' : ''}`}
                style={{ fontSize: `${fontSize}px`, lineHeight: '1.85' }}
                dangerouslySetInnerHTML={{ __html: rawContent }}
              />
            )}
          </div>
        )}
      </div>

      {/* Selection floating toolbar */}
      {selectionToolbar && (
        <div
          role="toolbar"
          aria-label="Text annotation"
          className="absolute z-50 flex items-center gap-1 bg-navy rounded-lg shadow-lg px-2 py-1.5 -translate-x-1/2"
          style={{
            left: selectionToolbar.x,
            top: selectionToolbar.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {/* Highlight buttons */}
          <div className="flex items-center gap-0.5 mr-1">
            <Highlighter className="w-3 h-3 text-white/60 mr-1" />
            {HIGHLIGHT_COLORS.map((h) => (
              <button
                key={h.color}
                onClick={() => handleHighlight(h.color)}
                className={`w-5 h-5 rounded-full ${h.bg} hover:ring-2 hover:ring-white/50 transition-all`}
                title={`Highlight ${h.label}`}
              />
            ))}
          </div>

          <div className="w-px h-4 bg-white/20 mx-1" />

          {/* Bookmark button */}
          <button
            onClick={handleBookmark}
            className="flex items-center gap-1 text-white/80 hover:text-white text-[10px] font-sans px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
          >
            <Bookmark className="w-3 h-3" />
            Add Marker
          </button>
        </div>
      )}
    </div>
  );
}
