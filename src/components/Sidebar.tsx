import type { DocumentChapter } from '@/types';

interface SidebarProps {
  chapters: DocumentChapter[];
  activeChapterIndex: number;
  onChapterClick: (index: number) => void;
  documentTitle?: string;
  documentType?: string;
}

export default function Sidebar({
  chapters,
  activeChapterIndex,
  onChapterClick,
  documentTitle,
  documentType,
}: SidebarProps) {
  return (
    <div className="w-sidebar-left bg-sidebar-bg border-r border-border flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-[10px] font-sans font-semibold uppercase tracking-[0.15em] text-text-muted">
          Document Outline
        </h3>
      </div>

      {/* TOC list */}
      <div className="flex-1 overflow-y-auto py-2">
        {chapters.length === 0 ? (
          <p className="px-4 py-6 text-xs text-text-muted font-sans text-center leading-relaxed">
            Import a document to view its outline
          </p>
        ) : (
          <ul className="space-y-0.5">
            {chapters.map((ch, i) => (
              <li key={ch.id}>
                <button
                  onClick={() => onChapterClick(i)}
                  aria-current={activeChapterIndex === i ? 'true' : undefined}
                  className={`w-full text-left px-4 py-1.5 text-xs font-sans transition-colors border-l-2 ${
                    activeChapterIndex === i
                      ? 'border-gold bg-gold/5 text-navy font-medium'
                      : 'border-transparent text-text-muted hover:text-text-main hover:bg-black/[0.02]'
                  }`}
                >
                  <span className="font-mono text-[10px] text-text-muted mr-1.5">
                    &sect; {i + 1}
                  </span>
                  <span className="truncate">{ch.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer metadata */}
      <div className="px-4 py-3 border-t border-border">
        {documentTitle ? (
          <div className="space-y-1">
            <p className="text-[10px] font-sans text-text-muted truncate">{documentTitle}</p>
            <p className="text-[10px] font-mono text-text-muted">
              {documentType?.toUpperCase()} &middot; {chapters.length} sections
            </p>
          </div>
        ) : (
          <p className="text-[10px] font-sans text-text-muted">No document loaded</p>
        )}
      </div>
    </div>
  );
}
