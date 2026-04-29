import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, FileText, X } from 'lucide-react';
import { getNote, saveNote } from '@/lib/storage';

interface NotesPaneProps {
  /** Matter id this note belongs to. Falls back to 'global' if absent. */
  matterId: string | null;
  matterTitle: string;
  onClose: () => void;
}

interface MemoTemplate {
  id: string;
  label: string;
  body: (matter: string) => string;
}

const TEMPLATES: ReadonlyArray<MemoTemplate> = [
  {
    id: 'irac',
    label: 'IRAC Outline',
    body: (m) =>
      `PRIVILEGED & CONFIDENTIAL — ATTORNEY WORK PRODUCT\nRe: ${m}\n\n` +
      `ISSUE\n\n\nRULE\n\n\nANALYSIS\n\n\nCONCLUSION\n\n`,
  },
  {
    id: 'risk',
    label: 'Risk Memo',
    body: (m) =>
      `PRIVILEGED & CONFIDENTIAL — ATTORNEY WORK PRODUCT\nRe: ${m} — Risk Assessment\n\n` +
      `BACKGROUND\n\n\nIDENTIFIED RISKS\n  1.\n  2.\n  3.\n\n` +
      `RECOMMENDED MITIGATIONS\n\n\nOPEN QUESTIONS\n\n`,
  },
  {
    id: 'redline',
    label: 'Redline Notes',
    body: (m) =>
      `PRIVILEGED & CONFIDENTIAL — ATTORNEY WORK PRODUCT\nRe: ${m} — Redline Comments\n\n` +
      `§   |  Comment\n----+-----------------------------------------------------------\n` +
      `    |\n    |\n    |\n`,
  },
  {
    id: 'call',
    label: 'Call Notes',
    body: (m) =>
      `PRIVILEGED & CONFIDENTIAL — ATTORNEY WORK PRODUCT\nRe: ${m} — Call Notes\n\n` +
      `Date: ${new Date().toLocaleDateString()}\nAttendees:\n\nDISCUSSION\n\n\n` +
      `ACTION ITEMS\n  [ ]\n  [ ]\n`,
  },
];

const SAVE_DEBOUNCE_MS = 600;

export default function NotesPane({ matterId, matterTitle, onClose }: NotesPaneProps) {
  const docId = matterId ?? 'global';
  const [body, setBody] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getNote(docId).then((note) => {
      if (cancelled) return;
      setBody(note?.body ?? '');
      setSavedAt(note?.updatedAt ?? null);
      loadedKeyRef.current = docId;
    });
    return () => {
      cancelled = true;
    };
  }, [docId]);

  useEffect(() => {
    if (loadedKeyRef.current !== docId) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const updatedAt = new Date().toISOString();
      void saveNote({ documentId: docId, body, updatedAt });
      setSavedAt(updatedAt);
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [body, docId]);

  function applyTemplate(t: MemoTemplate) {
    setBody((prev) => {
      const tpl = t.body(matterTitle || 'Untitled Matter');
      return prev.trim().length === 0 ? tpl : `${prev.replace(/\s+$/, '')}\n\n${tpl}`;
    });
    setShowTemplates(false);
  }

  return (
    <div className="w-[380px] bg-white border-l border-border flex flex-col flex-shrink-0">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-navy" />
          <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.15em] text-text-muted">
            Privileged Memo
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-0.5 text-text-muted hover:text-text-main rounded"
          title="Close memo pane"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-3 py-1 border-b border-border">
        <button
          onClick={() => setShowTemplates((s) => !s)}
          className="flex items-center gap-1 text-[10px] font-sans text-text-muted hover:text-navy"
        >
          {showTemplates ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          Insert template
        </button>
        {showTemplates && (
          <div className="flex flex-wrap gap-1 pt-1.5 pb-1">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t)}
                className="text-[10px] font-sans text-navy bg-cream/60 hover:bg-cream border border-border px-2 py-0.5 rounded"
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        spellCheck
        placeholder={`Re: ${matterTitle || 'Untitled Matter'}\n\nNotes…`}
        className="flex-1 w-full px-3 py-2 text-[12px] font-mono leading-relaxed text-text-main bg-white resize-none focus:outline-none"
      />

      <div className="px-3 py-1.5 border-t border-border flex items-center justify-between">
        <span className="text-[9px] font-mono text-text-muted/70">
          {savedAt ? `Saved ${new Date(savedAt).toLocaleTimeString()}` : 'Unsaved'}
        </span>
        <span className="text-[9px] font-mono text-text-muted/70">
          {body.length.toLocaleString()} chars
        </span>
      </div>
    </div>
  );
}
