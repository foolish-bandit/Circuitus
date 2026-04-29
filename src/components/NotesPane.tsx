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
    <aside
      className="w-[400px] bg-paper-cool flex flex-col flex-shrink-0"
      style={{ borderLeft: '1px solid #D9D2C0' }}
    >
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid #D9D2C0' }}
      >
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-brass" />
          <p className="kicker">Privileged Memo</p>
        </div>
        <button
          onClick={onClose}
          className="p-0.5 text-ink-muted hover:text-claret transition-colors"
          title="Close memo pane"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div
        className="px-4 py-2"
        style={{ borderBottom: '1px solid #D9D2C0' }}
      >
        <button
          onClick={() => setShowTemplates((s) => !s)}
          className="flex items-center gap-1.5 kicker text-ink-muted hover:text-brass transition-colors"
        >
          {showTemplates ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          Insert Template
        </button>
        {showTemplates && (
          <div className="flex flex-wrap gap-1.5 pt-2.5 pb-1">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t)}
                className="font-sans text-[10px] uppercase tracking-marque text-ink hover:text-brass bg-paper px-2.5 py-1 transition-colors"
                style={{ border: '1px solid #D9D2C0', borderRadius: 0 }}
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
        className="flex-1 w-full px-5 py-4 text-[13px] font-serif leading-relaxed text-ink bg-paper resize-none focus:outline-none"
        style={{ fontFeatureSettings: '"onum","kern"' }}
      />

      <div
        className="px-4 py-2 flex items-center justify-between bg-paper-cool"
        style={{ borderTop: '1px solid #D9D2C0' }}
      >
        <span className="font-mono text-[9.5px] text-ink-muted/70">
          {savedAt ? `Saved ${new Date(savedAt).toLocaleTimeString()}` : 'Unsaved'}
        </span>
        <span className="font-mono text-[9.5px] text-ink-muted/70">
          {body.length.toLocaleString()} chars
        </span>
      </div>
    </aside>
  );
}
