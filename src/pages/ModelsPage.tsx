import { useEffect, useMemo, useRef, useState } from 'react';
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import { Plus, Trash2, Sheet } from 'lucide-react';
import {
  deleteWorkbook,
  getAllWorkbooks,
  getWorkbook,
  saveWorkbook,
} from '@/lib/storage';
import type { SpreadsheetWorkbook } from '@/types';
import { WORKBOOK_TEMPLATES, type WorkbookTemplate } from '@/data/workbook-templates';

const SAVE_DEBOUNCE_MS = 800;

function newWorkbookFromTemplate(t: WorkbookTemplate): SpreadsheetWorkbook {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: t.defaultTitle,
    sheets: JSON.stringify(t.sheets),
    templateId: t.id,
    createdAt: now,
    updatedAt: now,
  };
}

export default function ModelsPage() {
  const [workbooks, setWorkbooks] = useState<SpreadsheetWorkbook[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeData, setActiveData] = useState<unknown[] | null>(null);
  const [title, setTitle] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSaveRef = useRef(true);

  const active = useMemo(
    () => workbooks.find((w) => w.id === activeId) ?? null,
    [workbooks, activeId],
  );

  useEffect(() => {
    void getAllWorkbooks().then((all) => {
      setWorkbooks(all);
      if (all.length > 0) setActiveId(all[0].id);
      else setShowPicker(true);
    });
  }, []);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    void getWorkbook(activeId).then((wb) => {
      if (cancelled || !wb) return;
      skipNextSaveRef.current = true;
      setActiveData(JSON.parse(wb.sheets));
      setTitle(wb.title);
      setSavedAt(wb.updatedAt);
    });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  function handleNew(t: WorkbookTemplate) {
    const wb = newWorkbookFromTemplate(t);
    void saveWorkbook(wb).then(() => {
      setWorkbooks((prev) => [wb, ...prev]);
      setActiveId(wb.id);
      setShowPicker(false);
    });
  }

  function handleDelete(id: string) {
    void deleteWorkbook(id).then(() => {
      setWorkbooks((prev) => {
        const next = prev.filter((w) => w.id !== id);
        if (activeId === id) {
          setActiveId(next[0]?.id ?? null);
          setActiveData(null);
          if (next.length === 0) setShowPicker(true);
        }
        return next;
      });
    });
  }

  function scheduleSave(nextSheets: unknown[], nextTitle?: string) {
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    if (!activeId) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const existing = await getWorkbook(activeId);
      if (!existing) return;
      const updatedAt = new Date().toISOString();
      const next: SpreadsheetWorkbook = {
        ...existing,
        title: nextTitle ?? existing.title,
        sheets: JSON.stringify(nextSheets),
        updatedAt,
      };
      await saveWorkbook(next);
      setSavedAt(updatedAt);
      setWorkbooks((prev) =>
        prev.map((w) => (w.id === activeId ? next : w)).sort((a, b) =>
          b.updatedAt.localeCompare(a.updatedAt),
        ),
      );
    }, SAVE_DEBOUNCE_MS);
  }

  return (
    <div className="flex-1 flex bg-cream overflow-hidden">
      {/* Workbook list */}
      <div className="w-64 bg-sidebar-bg border-r border-border flex flex-col flex-shrink-0">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-[10px] font-sans font-semibold uppercase tracking-[0.15em] text-text-muted">
            Models &amp; Workbooks
          </h3>
        </div>
        <div className="px-2 py-2 border-b border-border">
          <button
            onClick={() => setShowPicker(true)}
            className="w-full flex items-center justify-center gap-1.5 bg-navy text-white text-[11px] font-sans font-medium px-3 py-1.5 rounded hover:bg-navy-light transition-colors"
          >
            <Plus className="w-3 h-3" />
            New Workbook
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {workbooks.length === 0 ? (
            <p className="px-4 py-6 text-xs text-text-muted font-sans text-center leading-relaxed">
              No models yet. Click <em>New Workbook</em> to begin.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {workbooks.map((w) => (
                <li key={w.id} className="group flex items-center">
                  <button
                    onClick={() => setActiveId(w.id)}
                    className={`flex-1 text-left px-4 py-2 text-xs font-sans transition-colors border-l-2 ${
                      activeId === w.id
                        ? 'border-gold bg-gold/5 text-navy font-medium'
                        : 'border-transparent text-text-muted hover:text-text-main hover:bg-black/[0.02]'
                    }`}
                  >
                    <p className="truncate">{w.title || 'Untitled'}</p>
                    <p className="text-[9px] font-mono text-text-muted/60 mt-0.5">
                      {new Date(w.updatedAt).toLocaleString()}
                    </p>
                  </button>
                  <button
                    onClick={() => handleDelete(w.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 mr-1 text-text-muted hover:text-red-600"
                    title="Delete workbook"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Workbook area */}
      <div className="flex-1 flex flex-col bg-white relative overflow-hidden">
        {showPicker && (
          <div className="absolute inset-0 z-30 bg-white/95 backdrop-blur-sm flex items-center justify-center p-8">
            <div className="max-w-2xl w-full">
              <h2 className="font-serif text-navy text-xl font-bold mb-1 text-center">
                New Quantitative Model
              </h2>
              <p className="text-xs font-sans text-text-muted text-center mb-6">
                Choose a starting template or open a blank workbook.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {WORKBOOK_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleNew(t)}
                    className="text-left bg-cream border border-border rounded p-4 hover:border-gold/50 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sheet className="w-4 h-4 text-navy" />
                      <p className="font-serif text-sm font-bold text-navy">{t.label}</p>
                    </div>
                    <p className="text-[11px] font-sans text-text-muted leading-snug">
                      {t.description}
                    </p>
                  </button>
                ))}
              </div>
              {workbooks.length > 0 && (
                <button
                  onClick={() => setShowPicker(false)}
                  className="mt-6 w-full text-center text-[10px] font-sans uppercase tracking-wider text-text-muted hover:text-navy"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}

        {active && activeData ? (
          <>
            <div className="border-b border-border px-6 py-2 flex items-center justify-between flex-shrink-0">
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  scheduleSave(activeData, e.target.value);
                }}
                className="flex-1 font-serif text-base text-navy bg-transparent focus:outline-none placeholder-text-muted"
                placeholder="Workbook title…"
              />
              <span className="text-[10px] font-mono text-text-muted/70 ml-3">
                {savedAt ? `Saved ${new Date(savedAt).toLocaleTimeString()}` : 'Unsaved'}
              </span>
            </div>
            <div className="flex-1 min-h-0">
              <Workbook
                key={active.id}
                data={activeData as never}
                onChange={(sheets) => {
                  scheduleSave(sheets);
                }}
              />
            </div>
          </>
        ) : (
          !showPicker && (
            <div className="flex-1 flex items-center justify-center">
              <button
                onClick={() => setShowPicker(true)}
                className="text-xs font-sans text-blue-600 hover:underline"
              >
                Begin a new workbook
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
