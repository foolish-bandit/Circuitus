import type { StandinDocument } from '@/types';

interface AuthoritiesSidebarProps {
  documents: StandinDocument[];
  onDocumentClick: (doc: StandinDocument) => void;
  onRefresh: () => void;
}

const TYPE_LABEL: Record<string, string> = {
  guide: 'Practice Guide',
  article: 'Commentary',
  case: 'Case Authority',
};

const FLAG_GLYPH: Record<string, { glyph: string; color: string; label: string }> = {
  positive: { glyph: '✓', color: 'text-emerald-700', label: 'Positive treatment' },
  caution: { glyph: '!', color: 'text-brass', label: 'Caution — distinguished' },
  negative: { glyph: '✕', color: 'text-claret', label: 'Negative treatment' },
};

export default function AuthoritiesSidebar({
  documents,
  onDocumentClick,
  onRefresh,
}: AuthoritiesSidebarProps) {
  return (
    <aside
      className="w-sidebar-right bg-paper-cool flex flex-col flex-shrink-0"
      style={{ borderLeft: '1px solid #D9D2C0' }}
    >
      <div className="px-4 py-4" style={{ borderBottom: '1px solid #D9D2C0' }}>
        <p className="kicker">Saved Authorities</p>
        <p className="font-display italic text-[11.5px] text-ink-muted mt-1">
          Cross-references for the open matter.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-3">
        {documents.map((doc, idx) => {
          const flag = doc.flagStatus ? FLAG_GLYPH[doc.flagStatus] : null;
          return (
            <button
              key={doc.id}
              onClick={() => onDocumentClick(doc)}
              className="w-full text-left bg-paper p-3 transition-all group relative"
              style={{
                border: '1px solid #D9D2C0',
                boxShadow: '0 1px 0 rgba(14,17,22,0.02)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#9C7A1F';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#D9D2C0';
              }}
            >
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] text-ink-muted/60">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="kicker text-brass-dim">
                    {TYPE_LABEL[doc.type] ?? 'Source'}
                  </span>
                </div>
                {flag && (
                  <span
                    className={`font-display text-[14px] leading-none ${flag.color}`}
                    role="img"
                    aria-label={flag.label}
                    title={flag.label}
                  >
                    {flag.glyph}
                  </span>
                )}
              </div>

              <p className="font-display text-[13.5px] font-semibold text-ink leading-snug mb-2 group-hover:text-navy transition-colors">
                {doc.shortTitle}
              </p>

              <p className="font-serif text-[12px] text-ink-soft leading-snug italic line-clamp-2 mb-3">
                {doc.description}
              </p>

              <div className="flex items-baseline justify-between pt-2" style={{ borderTop: '1px solid #E9E3D2' }}>
                <p className="font-mono text-[9px] text-ink-muted/80 tracking-wider">
                  {doc.refNumber}
                </p>
                <p className="font-mono text-[9px] text-ink-muted/60">{doc.lastUpdated}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="px-4 py-3" style={{ borderTop: '1px solid #D9D2C0' }}>
        <button
          onClick={onRefresh}
          className="kicker text-ink-muted hover:text-brass transition-colors flex items-center gap-2"
        >
          <span className="text-brass">↻</span> Refresh Authorities
        </button>
      </div>
    </aside>
  );
}
