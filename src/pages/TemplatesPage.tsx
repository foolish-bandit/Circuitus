import { useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { FileText, Plus, Trash2, Type, Focus, Pencil, GitCompare, Pen } from 'lucide-react';
import { DRAFT_TEMPLATES, type DraftTemplate } from '@/data/draft-templates';
import { deleteDraft, getAllDrafts, getDraft, saveDraft } from '@/lib/storage';
import type { Draft } from '@/types';
import DraftDiagram from '@/components/DraftDiagram';
import DraftCompare from '@/components/DraftCompare';

type Mode = 'edit' | 'compare' | 'diagram';

const SAVE_DEBOUNCE_MS = 700;

function newDraftFromTemplate(t: DraftTemplate): Draft {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: t.defaultTitle,
    body: t.body,
    templateId: t.id,
    createdAt: now,
    updatedAt: now,
  };
}

export default function TemplatesPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<Mode>('edit');
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [typewriterMode, setTypewriterMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSaveRef = useRef(true);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Begin drafting…' }),
      CharacterCount,
    ],
    content: '<p></p>',
  });

  const activeDraft = useMemo(
    () => drafts.find((d) => d.id === activeId) ?? null,
    [drafts, activeId],
  );

  // Initial load
  useEffect(() => {
    void getAllDrafts().then((all) => {
      setDrafts(all);
      if (all.length > 0) setActiveId(all[0].id);
      else setShowTemplatePicker(true);
    });
  }, []);

  // Load active draft into editor when it changes
  useEffect(() => {
    if (!editor || !activeId) return;
    let cancelled = false;
    void getDraft(activeId).then((d) => {
      if (cancelled || !d) return;
      skipNextSaveRef.current = true;
      editor.commands.setContent(d.body, { emitUpdate: false });
      setTitle(d.title);
      setSavedAt(d.updatedAt);
    });
    return () => {
      cancelled = true;
    };
  }, [activeId, editor]);

  // Debounced autosave on editor changes or title changes
  useEffect(() => {
    if (!editor || !activeId) return;
    const handler = () => {
      if (skipNextSaveRef.current) {
        skipNextSaveRef.current = false;
        return;
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const updatedAt = new Date().toISOString();
        const body = editor.getHTML();
        const existing = await getDraft(activeId);
        if (!existing) return;
        const next: Draft = { ...existing, title, body, updatedAt };
        await saveDraft(next);
        setSavedAt(updatedAt);
        setDrafts((prev) =>
          prev.map((d) => (d.id === activeId ? next : d)).sort((a, b) =>
            b.updatedAt.localeCompare(a.updatedAt),
          ),
        );
      }, SAVE_DEBOUNCE_MS);
    };
    editor.on('update', handler);
    return () => {
      editor.off('update', handler);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [editor, activeId, title]);

  // Title-only save trigger (separate from editor on('update'))
  useEffect(() => {
    if (!activeId || skipNextSaveRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const existing = await getDraft(activeId);
      if (!existing) return;
      const updatedAt = new Date().toISOString();
      const body = editor?.getHTML() ?? existing.body;
      const next: Draft = { ...existing, title, body, updatedAt };
      await saveDraft(next);
      setSavedAt(updatedAt);
      setDrafts((prev) =>
        prev.map((d) => (d.id === activeId ? next : d)).sort((a, b) =>
          b.updatedAt.localeCompare(a.updatedAt),
        ),
      );
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [title, activeId, editor]);

  // Typewriter mode — keep the caret in the middle of the viewport
  useEffect(() => {
    if (!typewriterMode || !editor) return;
    const handler = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const container = editorContainerRef.current;
      if (!container || rect.height === 0) return;
      const containerRect = container.getBoundingClientRect();
      const targetCenter = containerRect.top + containerRect.height / 2;
      const delta = rect.top - targetCenter;
      if (Math.abs(delta) > 40) {
        container.scrollBy({ top: delta, behavior: 'smooth' });
      }
    };
    editor.on('update', handler);
    editor.on('selectionUpdate', handler);
    return () => {
      editor.off('update', handler);
      editor.off('selectionUpdate', handler);
    };
  }, [typewriterMode, editor]);

  function handleNewDraft(t: DraftTemplate) {
    const draft = newDraftFromTemplate(t);
    void saveDraft(draft).then(() => {
      setDrafts((prev) => [draft, ...prev]);
      setActiveId(draft.id);
      setShowTemplatePicker(false);
    });
  }

  function handleDelete(id: string) {
    void deleteDraft(id).then(() => {
      setDrafts((prev) => {
        const next = prev.filter((d) => d.id !== id);
        if (activeId === id) {
          setActiveId(next[0]?.id ?? null);
          if (next.length === 0) setShowTemplatePicker(true);
        }
        return next;
      });
    });
  }

  const wordCount = editor?.storage.characterCount?.words?.() ?? 0;

  return (
    <div className="flex-1 flex bg-cream overflow-hidden">
      {/* Drafts list */}
      <div className="w-64 bg-sidebar-bg border-r border-border flex flex-col flex-shrink-0">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-[10px] font-sans font-semibold uppercase tracking-[0.15em] text-text-muted">
            Drafts &amp; Templates
          </h3>
        </div>
        <div className="px-2 py-2 border-b border-border">
          <button
            onClick={() => setShowTemplatePicker(true)}
            className="w-full flex items-center justify-center gap-1.5 bg-navy text-white text-[11px] font-sans font-medium px-3 py-1.5 rounded hover:bg-navy-light transition-colors"
          >
            <Plus className="w-3 h-3" />
            New Draft
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {drafts.length === 0 ? (
            <p className="px-4 py-6 text-xs text-text-muted font-sans text-center leading-relaxed">
              No drafts yet. Click <em>New Draft</em> to begin.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {drafts.map((d) => (
                <li key={d.id} className="group flex items-center">
                  <button
                    onClick={() => setActiveId(d.id)}
                    className={`flex-1 text-left px-4 py-2 text-xs font-sans transition-colors border-l-2 ${
                      activeId === d.id
                        ? 'border-gold bg-gold/5 text-navy font-medium'
                        : 'border-transparent text-text-muted hover:text-text-main hover:bg-black/[0.02]'
                    }`}
                  >
                    <p className="truncate">{d.title || 'Untitled'}</p>
                    <p className="text-[9px] font-mono text-text-muted/60 mt-0.5">
                      {new Date(d.updatedAt).toLocaleString()}
                    </p>
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 mr-1 text-text-muted hover:text-red-600"
                    title="Delete draft"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex flex-col bg-white relative overflow-hidden">
        {showTemplatePicker && (
          <div className="absolute inset-0 z-30 bg-white/95 backdrop-blur-sm flex items-center justify-center p-8">
            <div className="max-w-2xl w-full">
              <h2 className="font-serif text-navy text-xl font-bold mb-1 text-center">
                Begin a New Draft
              </h2>
              <p className="text-xs font-sans text-text-muted text-center mb-6">
                Choose a starting template or open a blank document.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {DRAFT_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleNewDraft(t)}
                    className="text-left bg-cream border border-border rounded p-4 hover:border-gold/50 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <FileText className="w-4 h-4 text-navy" />
                      <p className="font-serif text-sm font-bold text-navy">{t.label}</p>
                    </div>
                    <p className="text-[11px] font-sans text-text-muted leading-snug">
                      {t.description}
                    </p>
                  </button>
                ))}
              </div>
              {drafts.length > 0 && (
                <button
                  onClick={() => setShowTemplatePicker(false)}
                  className="mt-6 w-full text-center text-[10px] font-sans uppercase tracking-wider text-text-muted hover:text-navy"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}

        {activeDraft ? (
          <>
            <div className="border-b border-border px-6 py-2 flex items-center justify-between flex-shrink-0 gap-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 font-serif text-base text-navy bg-transparent focus:outline-none placeholder-text-muted"
                placeholder="Document title…"
                disabled={mode !== 'edit'}
              />
              <div className="flex items-center gap-0.5 border border-border rounded">
                <button
                  onClick={() => setMode('edit')}
                  className={`flex items-center gap-1 px-2 py-1 text-[10px] font-sans uppercase tracking-wider rounded-l ${
                    mode === 'edit' ? 'bg-navy text-white' : 'text-text-muted hover:text-navy'
                  }`}
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => setMode('compare')}
                  className={`flex items-center gap-1 px-2 py-1 text-[10px] font-sans uppercase tracking-wider ${
                    mode === 'compare' ? 'bg-navy text-white' : 'text-text-muted hover:text-navy'
                  }`}
                >
                  <GitCompare className="w-3 h-3" /> Compare
                </button>
                <button
                  onClick={() => setMode('diagram')}
                  className={`flex items-center gap-1 px-2 py-1 text-[10px] font-sans uppercase tracking-wider rounded-r ${
                    mode === 'diagram' ? 'bg-navy text-white' : 'text-text-muted hover:text-navy'
                  }`}
                >
                  <Pen className="w-3 h-3" /> Diagram
                </button>
              </div>
              {mode === 'edit' && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTypewriterMode((p) => !p)}
                    className={`p-1.5 rounded text-[10px] font-mono ${
                      typewriterMode ? 'text-navy bg-cream' : 'text-text-muted hover:text-text-main'
                    }`}
                    title="Typewriter mode"
                  >
                    <Type className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setFocusMode((p) => !p)}
                    className={`p-1.5 rounded ${
                      focusMode ? 'text-navy bg-cream' : 'text-text-muted hover:text-text-main'
                    }`}
                    title="Focus mode (dims surrounding paragraphs)"
                  >
                    <Focus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {mode === 'edit' && (
              <>
                <div
                  ref={editorContainerRef}
                  className={`flex-1 overflow-y-auto px-12 py-10 ${focusMode ? 'tiptap-focus-mode' : ''}`}
                >
                  <div className="max-w-reading-pane mx-auto">
                    <EditorContent editor={editor} className="prose-legal tiptap-editor" />
                  </div>
                </div>
                <div className="border-t border-border px-4 py-1.5 flex items-center justify-between flex-shrink-0">
                  <span className="text-[10px] font-mono text-text-muted/70">
                    {savedAt ? `Saved ${new Date(savedAt).toLocaleTimeString()}` : 'Unsaved'}
                  </span>
                  <span className="text-[10px] font-mono text-text-muted/70">
                    {wordCount.toLocaleString()} words
                  </span>
                </div>
              </>
            )}

            {mode === 'compare' && <DraftCompare drafts={drafts} defaultLeftId={activeId} />}

            {mode === 'diagram' && (
              <div className="flex-1 min-h-0">
                <DraftDiagram
                  key={activeDraft.id}
                  initialJson={activeDraft.diagram ?? ''}
                  onChange={(json) => {
                    void getDraft(activeDraft.id).then((existing) => {
                      if (!existing) return;
                      const updatedAt = new Date().toISOString();
                      const next: Draft = { ...existing, diagram: json, updatedAt };
                      void saveDraft(next);
                      setDrafts((prev) =>
                        prev.map((d) => (d.id === activeDraft.id ? next : d)).sort((a, b) =>
                          b.updatedAt.localeCompare(a.updatedAt),
                        ),
                      );
                      setSavedAt(updatedAt);
                    });
                  }}
                />
              </div>
            )}
          </>
        ) : (
          !showTemplatePicker && (
            <div className="flex-1 flex items-center justify-center">
              <button
                onClick={() => setShowTemplatePicker(true)}
                className="text-xs font-sans text-blue-600 hover:underline"
              >
                Begin a new draft
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
