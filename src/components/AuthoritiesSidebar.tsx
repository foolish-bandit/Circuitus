import type { StandinDocument } from '@/types';

interface AuthoritiesSidebarProps {
  documents: StandinDocument[];
  onDocumentClick: (doc: StandinDocument) => void;
  onRefresh: () => void;
}

const TYPE_STYLES: Record<string, string> = {
  guide: 'bg-navy text-white',
  article: 'bg-navy-light/60 text-white',
  case: 'bg-navy-dark text-white',
};

const FLAG_COLORS: Record<string, string> = {
  positive: 'bg-green-500',
  caution: 'bg-yellow-500',
  negative: 'bg-red-500',
};

export default function AuthoritiesSidebar({
  documents,
  onDocumentClick,
  onRefresh,
}: AuthoritiesSidebarProps) {
  return (
    <div className="w-sidebar-right bg-sidebar-bg border-l border-border flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border">
        <h3 className="text-[10px] font-sans font-semibold uppercase tracking-[0.15em] text-text-muted">
          Saved Authorities
        </h3>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-2">
        {documents.map((doc) => (
          <button
            key={doc.id}
            onClick={() => onDocumentClick(doc)}
            className="w-full text-left bg-white border border-border rounded p-2.5 hover:border-gold/30 hover:shadow-sm transition-all group"
          >
            {/* Type badge + flag */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <span
                className={`text-[9px] font-sans font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  TYPE_STYLES[doc.type] || TYPE_STYLES.guide
                }`}
              >
                {doc.type}
              </span>
              {doc.type === 'case' && doc.flagStatus && (
                <span
                  className={`w-2 h-2 rounded-full ${FLAG_COLORS[doc.flagStatus]}`}
                />
              )}
            </div>

            {/* Title */}
            <p className="text-[11px] font-sans font-medium text-text-main leading-tight mb-1 group-hover:text-navy transition-colors">
              {doc.shortTitle}
            </p>

            {/* Description */}
            <p className="text-[10px] font-sans text-text-muted leading-snug line-clamp-2 mb-2">
              {doc.description}
            </p>

            {/* Metadata */}
            <p className="text-[9px] font-mono text-text-muted">
              {doc.refNumber} | {doc.lastUpdated}
            </p>
          </button>
        ))}
      </div>

      {/* Refresh */}
      <div className="px-3 py-2 border-t border-border">
        <button
          onClick={onRefresh}
          className="text-[10px] font-sans text-text-muted hover:text-navy transition-colors"
        >
          Refresh Authorities
        </button>
      </div>
    </div>
  );
}
