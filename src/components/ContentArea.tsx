import { FileText } from 'lucide-react';

interface ContentAreaProps {
  children?: React.ReactNode;
  refNumber?: string;
  documentTitle?: string;
  isEmpty?: boolean;
}

export default function ContentArea({
  children,
  refNumber,
  documentTitle,
  isEmpty = true,
}: ContentAreaProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-cream">
      <div className="max-w-reading-pane mx-auto bg-white min-h-full border-x border-border/50 shadow-sm px-12 py-10">
        {/* Legal header */}
        <div className="text-center mb-8 pb-6 border-b border-border">
          <p className="text-[10px] font-serif uppercase tracking-[0.2em] text-navy/60 mb-1">
            Circuitus Practice Resource
          </p>
          <p className="text-xs font-sans text-text-muted mb-2">
            {documentTitle
              ? `Reference Library — ${documentTitle}`
              : 'In-House Counsel Reference Library — Transactional Division'}
          </p>
          <p className="font-mono text-[10px] text-text-muted tracking-wider">
            Ref. {refNumber || `CIR-2026-${String(Math.floor(Math.random() * 90000) + 10000)}`}
          </p>
        </div>

        {/* Content */}
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-12 h-12 text-border mb-4" />
            <p className="text-sm font-sans text-text-muted max-w-sm leading-relaxed">
              No source documents loaded. Import a document or select a Saved Authority to begin.
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
