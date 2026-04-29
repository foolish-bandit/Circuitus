import { useState } from 'react';
import { Trash2, Bookmark as BookmarkIcon } from 'lucide-react';
import type { DocumentChapter, Highlight, Bookmark } from '@/types';

interface SidebarProps {
  chapters: DocumentChapter[];
  activeChapterIndex: number;
  onChapterClick: (index: number) => void;
  documentTitle?: string;
  documentType?: string;
  highlights?: ReadonlyArray<Highlight>;
  bookmarks?: ReadonlyArray<Bookmark>;
  onJumpToChapter?: (index: number) => void;
  onDeleteHighlight?: (id: string) => void;
  onDeleteBookmark?: (id: string) => void;
}

type Mode = 'outline' | 'marks';

function toRoman(n: number): string {
  if (n <= 0) return '';
  const values: [number, string][] = [
    [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i'],
  ];
  let s = '';
  let r = n;
  for (const [v, sym] of values) {
    while (r >= v) {
      s += sym;
      r -= v;
    }
  }
  return s;
}

const HIGHLIGHT_DOT: Record<string, string> = {
  yellow: 'bg-yellow-400',
  blue: 'bg-blue-400',
  green: 'bg-emerald-500',
};

export default function Sidebar({
  chapters,
  activeChapterIndex,
  onChapterClick,
  documentTitle,
  documentType,
  highlights = [],
  bookmarks = [],
  onJumpToChapter,
  onDeleteHighlight,
  onDeleteBookmark,
}: SidebarProps) {
  const [mode, setMode] = useState<Mode>('outline');

  const markCount = highlights.length + bookmarks.length;
  const hasMarksFeature = onJumpToChapter !== undefined;

  return (
    <aside
      className="w-sidebar-left bg-paper-cool flex flex-col flex-shrink-0"
      style={{ borderRight: '1px solid #D9D2C0' }}
    >
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #D9D2C0' }}>
        <div className="flex items-center justify-between">
          <p className="kicker">{mode === 'outline' ? 'Document Outline' : 'Annotations'}</p>
          {hasMarksFeature && (
            <div
              className="flex items-stretch text-[9.5px] font-sans uppercase tracking-marque"
              style={{ border: '1px solid #D9D2C0' }}
            >
              <button
                onClick={() => setMode('outline')}
                className={`px-2 py-0.5 transition-colors ${
                  mode === 'outline' ? 'bg-navy text-paper' : 'text-ink-muted hover:text-ink'
                }`}
              >
                Outline
              </button>
              <button
                onClick={() => setMode('marks')}
                className={`px-2 py-0.5 transition-colors ${
                  mode === 'marks' ? 'bg-navy text-paper' : 'text-ink-muted hover:text-ink'
                }`}
              >
                Marks{markCount > 0 ? ` (${markCount})` : ''}
              </button>
            </div>
          )}
        </div>
        {documentTitle && (
          <p className="font-display italic text-[12px] text-ink-soft mt-2 leading-snug truncate">
            {documentTitle}
          </p>
        )}
      </div>

      {mode === 'outline' ? (
        <>
          <div className="flex-1 overflow-y-auto py-3">
            {chapters.length === 0 ? (
              <p className="px-5 py-6 font-serif italic text-[12.5px] text-ink-muted text-center leading-relaxed">
                Import a document to view its outline.
              </p>
            ) : (
              <ul className="space-y-0">
                {chapters.map((ch, i) => {
                  const active = activeChapterIndex === i;
                  return (
                    <li key={ch.id}>
                      <button
                        onClick={() => onChapterClick(i)}
                        aria-current={active ? 'true' : undefined}
                        className={`w-full text-left px-5 py-2 transition-colors flex items-baseline gap-3 group ${
                          active
                            ? 'bg-paper text-ink'
                            : 'text-ink-muted hover:text-ink hover:bg-paper/60'
                        }`}
                        style={{
                          borderLeft: active ? '2px solid #9C7A1F' : '2px solid transparent',
                        }}
                      >
                        <span
                          className={`font-mono text-[9px] w-6 flex-shrink-0 tracking-wider ${
                            active ? 'text-brass' : 'text-ink-muted/55 group-hover:text-ink-muted'
                          }`}
                        >
                          {toRoman(i + 1)}.
                        </span>
                        <span
                          className={`font-serif text-[13px] leading-snug truncate ${
                            active ? 'text-ink' : ''
                          }`}
                        >
                          {ch.title}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="px-5 py-3" style={{ borderTop: '1px solid #D9D2C0' }}>
            {documentTitle ? (
              <div className="space-y-1">
                <p className="font-mono text-[9.5px] text-ink-muted/80 tracking-marque uppercase">
                  {documentType || 'Document'} · {chapters.length} sections
                </p>
                <p className="font-mono text-[9px] text-ink-muted/50">
                  ⁂ {chapters.length > 0 ? `Folio ${toRoman(activeChapterIndex + 1)}` : '—'}
                </p>
              </div>
            ) : (
              <p className="font-serif italic text-[11px] text-ink-muted">No document loaded.</p>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto py-2">
          {markCount === 0 ? (
            <p className="px-5 py-6 font-serif italic text-[12.5px] text-ink-muted text-center leading-relaxed">
              No annotations yet. Select text to highlight or bookmark.
            </p>
          ) : (
            <ul>
              {highlights.map((h) => (
                <li
                  key={h.id}
                  className="px-4 py-2.5 group"
                  style={{ borderBottom: '1px dashed #E9E3D2' }}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`w-2 h-2 mt-1.5 ${HIGHLIGHT_DOT[h.color]}`}
                      aria-hidden
                    />
                    <button
                      onClick={() => onJumpToChapter?.(h.chapterIndex)}
                      className="flex-1 text-left"
                    >
                      <p className="font-mono text-[9px] text-brass-dim uppercase tracking-marque mb-1">
                        § {toRoman(h.chapterIndex + 1)}
                      </p>
                      <p className="font-serif text-[12.5px] italic text-ink-soft leading-snug line-clamp-3">
                        “{h.selectedText}”
                      </p>
                    </button>
                    {onDeleteHighlight && (
                      <button
                        onClick={() => onDeleteHighlight(h.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-ink-muted hover:text-claret transition-colors flex-shrink-0"
                        aria-label="Delete highlight"
                        title="Delete highlight"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
              {bookmarks.map((b) => (
                <li
                  key={b.id}
                  className="px-4 py-2.5 group"
                  style={{ borderBottom: '1px dashed #E9E3D2' }}
                >
                  <div className="flex items-start gap-2">
                    <BookmarkIcon className="w-3 h-3 mt-1 text-brass flex-shrink-0" />
                    <button
                      onClick={() => onJumpToChapter?.(b.chapterIndex)}
                      className="flex-1 text-left"
                    >
                      <p className="font-mono text-[9px] text-brass-dim uppercase tracking-marque mb-1">
                        § {toRoman(b.chapterIndex + 1)}
                      </p>
                      <p className="font-serif text-[12.5px] text-ink leading-snug line-clamp-3">
                        {b.label || b.selectedText || 'Bookmark'}
                      </p>
                      {b.note && (
                        <p className="font-serif italic text-[11px] text-ink-muted mt-1 line-clamp-2">
                          {b.note}
                        </p>
                      )}
                    </button>
                    {onDeleteBookmark && (
                      <button
                        onClick={() => onDeleteBookmark(b.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-ink-muted hover:text-claret transition-colors flex-shrink-0"
                        aria-label="Delete bookmark"
                        title="Delete bookmark"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </aside>
  );
}
