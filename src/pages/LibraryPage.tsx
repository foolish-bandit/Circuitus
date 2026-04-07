import { useEffect, useState } from 'react';
import { BookOpen, FileText, FileType, Upload, MoreVertical, Trash2 } from 'lucide-react';
import { getAllDocuments, deleteDocument } from '@/lib/storage';
import type { StoredDocument } from '@/types';

interface LibraryPageProps {
  onOpenDocument: (id: string) => void;
  onImport: () => void;
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

export default function LibraryPage({ onOpenDocument, onImport }: LibraryPageProps) {
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    getAllDocuments().then(setDocuments);
  }, []);

  async function handleDelete(id: string) {
    await deleteDocument(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    setMenuOpen(null);
  }

  if (documents.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <FileText className="w-16 h-16 text-border mb-4" />
        <h3 className="font-serif text-navy text-lg mb-2">No active matters</h3>
        <p className="text-sm font-sans text-text-muted mb-6">
          Import a document to begin your research.
        </p>
        <button
          onClick={onImport}
          className="flex items-center gap-2 bg-navy text-white text-sm font-sans font-medium px-5 py-2.5 rounded hover:bg-navy-light transition-colors"
        >
          <Upload className="w-4 h-4" />
          Import New Source
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-serif text-navy text-xl">Your Matters</h2>
            <p className="text-xs font-sans text-text-muted mt-1">
              Active research documents and imported sources
            </p>
          </div>
          <button
            onClick={onImport}
            className="flex items-center gap-1.5 bg-navy text-white text-xs font-sans font-medium px-4 py-2 rounded hover:bg-navy-light transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Import New Source
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => {
            const Icon = FILE_ICONS[doc.fileType] || FileText;
            const matterNum = doc.id.slice(0, 4).toUpperCase();
            const progress = doc.readingPosition
              ? Math.round(
                  ((doc.readingPosition.chapterIndex + doc.readingPosition.scrollPercent / 100) /
                    Math.max(doc.chapters.length, 1)) *
                    100
                )
              : 0;

            return (
              <div
                key={doc.id}
                className="bg-white border border-border rounded-lg hover:border-gold/30 hover:shadow-md transition-all cursor-pointer group relative"
                onClick={() => onOpenDocument(doc.id)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Icon className="w-5 h-5 text-navy/40 flex-shrink-0 mt-0.5" />
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(menuOpen === doc.id ? null : doc.id);
                        }}
                        className="p-1 text-text-muted hover:text-text-main rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                      {menuOpen === doc.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded shadow-lg z-10 py-1 min-w-[120px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenDocument(doc.id);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-sans hover:bg-cream transition-colors"
                          >
                            Open
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(doc.id);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-sans text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="font-serif text-sm text-navy font-bold leading-snug mb-1 line-clamp-2">
                    {doc.title}
                  </h3>
                  <p className="text-[10px] font-sans text-text-muted mb-2">
                    Imported {timeAgo(doc.dateAdded)}
                    {doc.lastOpened !== doc.dateAdded && (
                      <> &middot; Last reviewed {timeAgo(doc.lastOpened)}</>
                    )}
                  </p>

                  {/* Progress bar */}
                  <div className="w-full h-1 bg-border/50 rounded-full mb-2">
                    <div
                      className="h-full bg-gold/60 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <p className="font-mono text-[9px] text-text-muted/60">
                    Matter CIR-{matterNum}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
