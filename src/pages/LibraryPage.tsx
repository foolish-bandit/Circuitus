import { useEffect, useRef, useState } from 'react';
import { BookOpen, FileText, FileType, Upload, MoreVertical, Trash2, Edit3 } from 'lucide-react';
import { getAllDocuments, deleteDocument, updateDocumentTitle } from '@/lib/storage';
import type { StoredDocument } from '@/types';

interface LibraryPageProps {
  onOpenDocument: (id: string) => void;
  onImport: () => void;
  refreshKey?: number;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const FILE_ICONS: Record<string, typeof BookOpen> = {
  epub: BookOpen,
  pdf: FileText,
  txt: FileType,
};

const TYPE_LABEL: Record<string, string> = {
  epub: 'EPUB',
  pdf: 'PDF',
  txt: 'Plain Text',
};

export default function LibraryPage({ onOpenDocument, onImport, refreshKey = 0 }: LibraryPageProps) {
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    getAllDocuments().then(setDocuments);
  }, [refreshKey]);

  // Close the action menu when the user clicks anywhere else.
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  async function handleDelete(id: string) {
    await deleteDocument(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    setMenuOpen(null);
  }

  function startRename(doc: StoredDocument) {
    setMenuOpen(null);
    setRenamingId(doc.id);
    setRenameDraft(doc.title);
  }

  async function commitRename(id: string) {
    const next = renameDraft.trim();
    setRenamingId(null);
    if (!next) return;
    const current = documents.find((d) => d.id === id);
    if (!current || next === current.title) return;
    await updateDocumentTitle(id, next);
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, title: next } : d)));
  }

  function cancelRename() {
    setRenamingId(null);
    setRenameDraft('');
  }

  if (documents.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-8">
        <div className="text-center max-w-md">
          <p className="kicker-brass mb-4">
            <span className="inline-block w-6 h-px bg-brass align-middle mr-3" />
            The Working Brief
            <span className="inline-block w-6 h-px bg-brass align-middle ml-3" />
          </p>
          <h2 className="font-display text-3xl font-semibold text-ink leading-tight mb-3">
            No active matters.
          </h2>
          <p className="font-serif italic text-[14px] text-ink-muted leading-relaxed mb-8">
            Begin your session by importing a source document, or open a Saved Authority from
            the right rail to load a practice guide.
          </p>
          <button
            onClick={onImport}
            className="inline-flex items-center gap-2 bg-navy text-paper font-sans uppercase tracking-marque text-[11px] font-medium px-5 py-3 hover:bg-navy-dark transition-colors"
            style={{
              borderRadius: 0,
              border: '1px solid #0A1F3D',
              boxShadow: 'inset 0 0 0 1px rgba(184, 147, 43, 0.25)',
            }}
          >
            <Upload className="w-3.5 h-3.5" />
            Import a Source
          </button>
          <div className="asterism mt-12" aria-hidden />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-10 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Editorial masthead */}
        <header className="mb-10 pb-5" style={{ borderBottom: '1px solid #D9D2C0' }}>
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="kicker-brass mb-2">The Working Brief</p>
              <h1 className="font-display text-[34px] font-semibold text-ink leading-none tracking-tight">
                Your Matters
              </h1>
              <p className="font-serif italic text-[13px] text-ink-muted mt-2">
                Active research documents and imported sources, in chambers.
              </p>
            </div>
            <button
              onClick={onImport}
              className="flex-shrink-0 inline-flex items-center gap-2 bg-navy text-paper font-sans uppercase tracking-marque text-[10.5px] font-medium px-4 py-2.5 hover:bg-navy-dark transition-colors"
              style={{
                borderRadius: 0,
                border: '1px solid #0A1F3D',
                boxShadow: 'inset 0 0 0 1px rgba(184, 147, 43, 0.22)',
              }}
            >
              <Upload className="w-3 h-3" />
              Import Source
            </button>
          </div>
        </header>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-rule">
          {documents.map((doc) => {
            const Icon = FILE_ICONS[doc.fileType] || FileText;
            const matterNum = doc.id.slice(0, 4).toUpperCase();
            const progress = doc.readingPosition
              ? Math.min(
                  100,
                  Math.round(
                    ((doc.readingPosition.chapterIndex + doc.readingPosition.scrollPercent / 100) /
                      Math.max(doc.chapters.length, 1)) *
                      100
                  ),
                )
              : 0;

            return (
              <div
                key={doc.id}
                className="bg-paper-cool hover:bg-paper transition-colors cursor-pointer group relative"
                onClick={() => onOpenDocument(doc.id)}
              >
                <div className="p-5 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-brass-dim flex-shrink-0" />
                      <span className="kicker text-brass-dim">
                        {TYPE_LABEL[doc.fileType] ?? 'Source'}
                      </span>
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(menuOpen === doc.id ? null : doc.id);
                        }}
                        aria-label="Document options"
                        className="p-1 text-ink-muted hover:text-ink opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                      {menuOpen === doc.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 top-full mt-1 bg-paper z-10 py-1 min-w-[160px]"
                          style={{
                            border: '1px solid #D9D2C0',
                            boxShadow: '0 8px 24px -8px rgba(14,17,22,0.18)',
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenDocument(doc.id);
                            }}
                            className="w-full text-left px-3 py-1.5 text-[11px] font-sans hover:bg-paper-warm transition-colors"
                          >
                            Open Matter
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startRename(doc);
                            }}
                            className="w-full text-left px-3 py-1.5 text-[11px] font-sans hover:bg-paper-warm transition-colors flex items-center gap-1.5"
                          >
                            <Edit3 className="w-3 h-3" />
                            Rename
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(doc.id);
                            }}
                            className="w-full text-left px-3 py-1.5 text-[11px] font-sans text-claret hover:bg-claret/5 transition-colors flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3 h-3" />
                            Withdraw
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {renamingId === doc.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={renameDraft}
                      onChange={(e) => setRenameDraft(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') commitRename(doc.id);
                        else if (e.key === 'Escape') cancelRename();
                      }}
                      onBlur={() => commitRename(doc.id)}
                      className="font-display text-[16px] text-ink font-semibold leading-snug mb-2 flex-1 w-full bg-paper px-1 -mx-1 focus:outline-none"
                      style={{ border: '1px solid #9C7A1F', borderRadius: 0 }}
                    />
                  ) : (
                    <h3
                      className="font-display text-[16px] text-ink font-semibold leading-snug mb-2 line-clamp-2 flex-1"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startRename(doc);
                      }}
                      title="Double-click to rename"
                    >
                      {doc.title}
                    </h3>
                  )}

                  <p className="font-serif italic text-[11px] text-ink-muted mb-3 line-clamp-1">
                    Imported {timeAgo(doc.dateAdded)}
                    {doc.lastOpened !== doc.dateAdded && (
                      <> · last reviewed {timeAgo(doc.lastOpened)}</>
                    )}
                  </p>

                  <div className="mt-auto">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-px bg-rule">
                        <div
                          className="h-px bg-brass transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="font-mono text-[9px] text-ink-muted/70 w-8 text-right">
                        {progress}%
                      </span>
                    </div>
                    <p className="font-mono text-[9px] text-ink-muted/60 tracking-wider">
                      Matter № CIR-{matterNum}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
