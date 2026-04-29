import type { DocumentChapter } from '@/types';

interface SidebarProps {
  chapters: DocumentChapter[];
  activeChapterIndex: number;
  onChapterClick: (index: number) => void;
  documentTitle?: string;
  documentType?: string;
}

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

export default function Sidebar({
  chapters,
  activeChapterIndex,
  onChapterClick,
  documentTitle,
  documentType,
}: SidebarProps) {
  return (
    <aside
      className="w-sidebar-left bg-paper-cool flex flex-col flex-shrink-0"
      style={{ borderRight: '1px solid #D9D2C0' }}
    >
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #D9D2C0' }}>
        <p className="kicker">Document Outline</p>
        {documentTitle && (
          <p className="font-display italic text-[12px] text-ink-soft mt-2 leading-snug truncate">
            {documentTitle}
          </p>
        )}
      </div>

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
    </aside>
  );
}
