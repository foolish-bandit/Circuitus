import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import TopBar from '@/components/TopBar';
import Toolbar from '@/components/Toolbar';
import Sidebar from '@/components/Sidebar';
import ContentArea from '@/components/ContentArea';
import AuthoritiesSidebar from '@/components/AuthoritiesSidebar';
import StatusBar from '@/components/StatusBar';
import MatterTabs from '@/components/MatterTabs';
import type { MatterTab } from '@/components/MatterTabs';
import LibraryPage from '@/pages/LibraryPage';
import TemplatesPage from '@/pages/TemplatesPage';
import AuthoritiesFeedPage from '@/pages/AuthoritiesFeedPage';
import CompliancePage from '@/pages/CompliancePage';
import AudioLibraryPage from '@/pages/AudioLibraryPage';
import NotesPane from '@/components/NotesPane';
import IncomingCallOverlay from '@/components/IncomingCallOverlay';
import { parseFile } from '@/lib/parsers';
import { saveDocument, getDocument, saveHighlight, saveBookmark } from '@/lib/storage';
import { useReadingPosition } from '@/hooks/useReadingPosition';
import { useQuickRef, formatChord } from '@/hooks/useQuickRef';
import { useAutoPilot } from '@/hooks/useAutoPilot';
import { copyAnnotationsToClipboard } from '@/lib/export';
import { pickSuggestions } from '@/data/suggestion-pool';
import { standinDocuments as _standinDocs, pickWeeklyAuthorities } from '@/data/standin-documents';
import type { DocumentChapter, StoredDocument, StandinDocument } from '@/types';

const FONT_SIZES = [13, 14.5, 16.5];
const ERROR_BANNER_TIMEOUT_MS = 8000;
const SEARCH_DELAY_MS = 1200;
const LEFT_SIDEBAR_BREAKPOINT = 1200;
const RIGHT_SIDEBAR_BREAKPOINT = 1400;
const RESIZE_DEBOUNCE_MS = 150;

function shuffleAndPick<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

interface MainLayoutProps {
  onLogout: () => void;
}

export default function MainLayout({ onLogout }: MainLayoutProps) {
  const [activeNav, setActiveNav] = useState('Practice Guides');
  const [searchQuery, setSearchQuery] = useState('');
  const [fontSize, setFontSize] = useState(14.5);
  const [showParagraphNumbers, setShowParagraphNumbers] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [autoPilotEnabled, setAutoPilotEnabled] = useState(false);
  const [callVisible, setCallVisible] = useState(false);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);

  // Document state
  const [currentDoc, setCurrentDoc] = useState<StoredDocument | null>(null);
  const [chapters, setChapters] = useState<DocumentChapter[]>([]);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');

  // Standin docs — weekly-biased rotation
  const [sidebarDocs, setSidebarDocs] = useState<StandinDocument[]>(() =>
    pickWeeklyAuthorities(Math.min(7, _standinDocs.length)),
  );
  const [viewingStandin, setViewingStandin] = useState<StandinDocument | null>(null);
  const [standinChapters, setStandinChapters] = useState<DocumentChapter[]>([]);


  // Matter tabs
  const [matterTabs, setMatterTabs] = useState<MatterTab[]>(() => {
    const initial = shuffleAndPick(_standinDocs, Math.min(3, _standinDocs.length));
    return initial.map((d) => ({ id: d.id, label: d.shortTitle, type: 'standin' as const }));
  });
  const [activeTabId, setActiveTabId] = useState<string | null>(matterTabs[0]?.id ?? null);

  // Quick-reference cover
  const { isQuickRef, destination, chord, saveQuickRefState } = useQuickRef();
  const quickRefDoc = useMemo(
    () => _standinDocs.find((d) => d.id === destination.docId) ?? _standinDocs[0],
    [destination.docId],
  );
  const quickRefChapters = useMemo(
    () => parseStandinChapters(quickRefDoc?.content ?? ''),
    [quickRefDoc],
  );

  // Search state
  const [searchResults, setSearchResults] = useState<{ label: string; docId?: string }[] | null>(
    null,
  );
  const [searchLoading, setSearchLoading] = useState(false);

  // Import error / export feedback banner
  const [importError, setImportError] = useState<string | null>(null);
  const [exportToast, setExportToast] = useState<string | null>(null);

  // Library refresh counter
  const [libraryRefreshKey, setLibraryRefreshKey] = useState(0);

  // Responsive sidebar state — initial values computed lazily from
  // window.innerWidth so we don't have to setState inside an effect on mount.
  const [hideLeftSidebar, setHideLeftSidebar] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < LEFT_SIDEBAR_BREAKPOINT,
  );
  const [hideRightSidebar, setHideRightSidebar] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < RIGHT_SIDEBAR_BREAKPOINT,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tabScrollPositions = useRef<Record<string, number>>({});

  const { restorePosition } = useReadingPosition(
    currentDoc?.id ?? null,
    scrollContainerRef,
    activeChapterIndex,
  );

  const [initialScrollPercent, setInitialScrollPercent] = useState(0);

  // Save state on entering quick-ref so the user can recover their place
  useEffect(() => {
    if (isQuickRef) {
      saveQuickRefState(
        scrollContainerRef.current?.scrollTop ?? 0,
        currentDoc?.id ?? null,
        activeTabId,
      );
    }
  }, [isQuickRef, currentDoc, activeTabId, saveQuickRefState]);

  // Restore scroll position when tab changes
  useEffect(() => {
    if (!activeTabId) return;
    const saved = tabScrollPositions.current[activeTabId];
    if (saved != null) {
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = saved;
        }
      });
    }
  }, [activeTabId]);

  // Auto-dismiss banners
  useEffect(() => {
    if (!importError) return;
    const timer = setTimeout(() => setImportError(null), ERROR_BANNER_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [importError]);

  useEffect(() => {
    if (!exportToast) return;
    const timer = setTimeout(() => setExportToast(null), 4000);
    return () => clearTimeout(timer);
  }, [exportToast]);

  // Dismiss search results on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSearchResults(null);
        setSearchQuery('');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRefreshAuthorities = useCallback(() => {
    setSidebarDocs(pickWeeklyAuthorities(Math.min(7, _standinDocs.length)));
  }, []);

  // Responsive sidebar collapse on resize (initial value seeded above).
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function handleResize() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setHideLeftSidebar(window.innerWidth < LEFT_SIDEBAR_BREAKPOINT);
        setHideRightSidebar(window.innerWidth < RIGHT_SIDEBAR_BREAKPOINT);
      }, RESIZE_DEBOUNCE_MS);
    }
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  // Auto-pilot — only active when not in quickref (which is its own static cover)
  useAutoPilot({
    enabled: autoPilotEnabled && !isQuickRef,
    scrollContainerRef,
  });

  const handleFontSizeChange = useCallback((delta: number) => {
    setFontSize((prev) => {
      const idx = FONT_SIZES.indexOf(prev);
      const newIdx = Math.max(0, Math.min(FONT_SIZES.length - 1, idx + delta));
      return FONT_SIZES[newIdx];
    });
  }, []);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const openDocument = useCallback(
    async (id: string) => {
      const doc = await getDocument(id);
      if (!doc) return;
      setCurrentDoc(doc);
      setChapters(doc.chapters);
      setActiveChapterIndex(doc.readingPosition?.chapterIndex || 0);
      setInitialScrollPercent(doc.readingPosition?.scrollPercent || 0);
      setViewingStandin(null);
      setStandinChapters([]);
      setActiveNav('Practice Guides');

      setMatterTabs((prev) =>
        prev.find((t) => t.id === id)
          ? prev
          : [...prev, { id, label: doc.title, type: 'uploaded' }],
      );
      setActiveTabId(id);

      requestAnimationFrame(() => restorePosition());
    },
    [restorePosition],
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImporting(true);
      try {
        setImportStatus('Indexing source document...');
        await new Promise((r) => setTimeout(r, 500));

        setImportStatus('Extracting content sections...');
        const parsed = await parseFile(file);

        setImportStatus('Building document outline...');
        await new Promise((r) => setTimeout(r, 500));

        setImportStatus('Adding to research library...');
        const ext = file.name.split('.').pop()?.toLowerCase() as 'epub' | 'pdf' | 'txt';
        const id = await saveDocument({
          title: parsed.title,
          author: parsed.author,
          fileName: file.name,
          fileType: ext,
          chapters: parsed.chapters,
          dateAdded: new Date().toISOString(),
          lastOpened: new Date().toISOString(),
          readingPosition: { chapterIndex: 0, scrollPercent: 0 },
        });
        await new Promise((r) => setTimeout(r, 400));

        setLibraryRefreshKey((k) => k + 1);
        openDocument(id);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Failed to import document.');
      } finally {
        setImporting(false);
        setImportStatus('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [openDocument],
  );

  function handleBack() {
    setCurrentDoc(null);
    setChapters([]);
    setActiveChapterIndex(0);
    setViewingStandin(null);
    setStandinChapters([]);
  }

  const handleStandinClick = useCallback((doc: StandinDocument) => {
    setViewingStandin(doc);
    const tempChapters = parseStandinChapters(doc.content);
    setStandinChapters(tempChapters);
    setActiveChapterIndex(0);
    setCurrentDoc(null);
    setActiveNav('Practice Guides');

    setMatterTabs((prev) =>
      prev.find((t) => t.id === doc.id)
        ? prev
        : [...prev, { id: doc.id, label: doc.shortTitle, type: 'standin' }],
    );
    setActiveTabId(doc.id);
  }, []);

  const handleTabClick = useCallback(
    (tabId: string) => {
      if (activeTabId && scrollContainerRef.current) {
        tabScrollPositions.current[activeTabId] = scrollContainerRef.current.scrollTop;
      }
      const standin = _standinDocs.find((d) => d.id === tabId);
      if (standin) {
        handleStandinClick(standin);
      } else {
        openDocument(tabId);
      }
    },
    [activeTabId, handleStandinClick, openDocument],
  );

  const handleTabClose = useCallback(
    (tabId: string) => {
      setMatterTabs((prev) => {
        const next = prev.filter((t) => t.id !== tabId);
        if (activeTabId === tabId && next.length > 0) {
          const fallback = next[0];
          const standin = _standinDocs.find((d) => d.id === fallback.id);
          if (standin) handleStandinClick(standin);
          else openDocument(fallback.id);
        } else if (activeTabId === tabId) {
          setActiveTabId(null);
        }
        return next;
      });
    },
    [activeTabId, handleStandinClick, openDocument],
  );

  function handleChapterClick(index: number) {
    setActiveChapterIndex(index);
    const el = document.getElementById(`chapter-${index}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleHighlight(payload: {
    text: string;
    color: 'yellow' | 'blue' | 'green';
    startOffset: number;
    endOffset: number;
  }) {
    const docId = currentDoc?.id || viewingStandin?.id;
    if (!docId) return;
    saveHighlight({
      documentId: docId,
      chapterIndex: activeChapterIndex,
      startOffset: payload.startOffset,
      endOffset: payload.endOffset,
      selectedText: payload.text,
      color: payload.color,
      dateCreated: new Date().toISOString(),
    });
  }

  function handleBookmark(text: string) {
    const docId = currentDoc?.id || viewingStandin?.id;
    if (!docId) return;
    const el = scrollContainerRef.current;
    const scrollPercent =
      el && el.scrollHeight > el.clientHeight
        ? (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100
        : 0;
    saveBookmark({
      documentId: docId,
      chapterIndex: activeChapterIndex,
      scrollPercent: Math.round(scrollPercent * 100) / 100,
      selectedText: text,
      dateCreated: new Date().toISOString(),
      label: text.slice(0, 60) + (text.length > 60 ? '...' : ''),
    });
  }

  function handleNavChange(nav: string) {
    setActiveNav(nav);
  }

  async function handleSearchSubmit() {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchResults(null);

    await new Promise((r) => setTimeout(r, SEARCH_DELAY_MS));

    const results: { label: string; docId?: string }[] = [];
    for (const doc of _standinDocs) {
      if (
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.shortTitle.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        results.push({ label: doc.shortTitle, docId: doc.id });
      }
    }
    for (const s of pickSuggestions(searchQuery)) {
      results.push(s);
    }

    setSearchResults(results.slice(0, 6));
    setSearchLoading(false);
  }

  function handleSearchResultClick(result: { label: string; docId?: string }) {
    setSearchResults(null);
    setSearchQuery('');
    if (result.docId) {
      const doc = _standinDocs.find((d) => d.id === result.docId);
      if (doc) handleStandinClick(doc);
    }
  }

  async function handleExportAnnotations() {
    const docId = currentDoc?.id || viewingStandin?.id;
    const title = currentDoc?.title || viewingStandin?.title;
    if (!docId || !title) return;
    const result = await copyAnnotationsToClipboard(docId, title);
    setExportToast(result.ok ? 'Annotations copied as Markdown.' : `Export failed: ${result.error}`);
  }

  function handlePrint() {
    window.print();
  }

  function handleTriggerCall() {
    setCallVisible(true);
  }

  // Determine active view
  const isReading = currentDoc !== null || viewingStandin !== null;
  const activeChaptersForSidebar = viewingStandin ? standinChapters : chapters;

  const breadcrumb = currentDoc
    ? `Practice Guides / ${currentDoc.title}`
    : viewingStandin
      ? `Research / ${viewingStandin.shortTitle}`
      : 'Document View';

  const refNumber = currentDoc
    ? `CIR-2026-${currentDoc.id.slice(0, 5).toUpperCase()}`
    : viewingStandin
      ? viewingStandin.refNumber
      : undefined;

  const contentTitle = currentDoc?.title || viewingStandin?.title;
  const exportableDocId = currentDoc?.id ?? viewingStandin?.id ?? null;
  const shortcutHint = formatChord(chord);

  // ── Quick-reference cover screen ─────────────────────────────────────
  if (isQuickRef) {
    return (
      <div className="h-screen flex flex-col bg-cream overflow-hidden relative">
        <TopBar
          onLogout={onLogout}
          activeNav="Practice Guides"
          onNavChange={() => {}}
          searchQuery=""
          onSearchChange={() => {}}
          onSearchSubmit={() => {}}
        />
        <Toolbar
          breadcrumb={`Research / Practice Guides / ${destination.label}`}
          onImport={() => {}}
          fontSize={fontSize}
          onFontSizeChange={handleFontSizeChange}
          showParagraphNumbers={showParagraphNumbers}
          onToggleParagraphNumbers={() => setShowParagraphNumbers((p) => !p)}
          showRightSidebar={showRightSidebar}
          onToggleRightSidebar={() => setShowRightSidebar((p) => !p)}
          showNotes={false}
          onToggleNotes={() => {}}
          autoPilotEnabled={false}
          onToggleAutoPilot={() => {}}
          onPrint={handlePrint}
          onExportAnnotations={() => {}}
          canExport={false}
          onTriggerCall={handleTriggerCall}
        />
        <MatterTabs
          tabs={[
            { id: destination.docId, label: destination.label, type: 'standin' },
            ...matterTabs.filter((t) => t.id !== destination.docId).slice(0, 2),
          ]}
          activeTabId={destination.docId}
          onTabClick={() => {}}
          onTabClose={() => {}}
          onAddTab={() => {}}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            chapters={quickRefChapters}
            activeChapterIndex={destination.chapterIndex}
            onChapterClick={() => {}}
            documentTitle={quickRefDoc?.title || destination.label}
            documentType="guide"
          />
          <ContentArea
            isEmpty={false}
            refNumber={destination.refNumber}
            documentTitle={quickRefDoc?.title}
            rawContent={quickRefDoc?.content || ''}
            fontSize={fontSize}
            showParagraphNumbers={showParagraphNumbers}
            initialScrollPercent={destination.scrollPercent}
          />
          {showRightSidebar && (
            <AuthoritiesSidebar
              documents={sidebarDocs}
              onDocumentClick={() => {}}
              onRefresh={() => {}}
            />
          )}
        </div>
        <StatusBar isQuickRef shortcutHint={shortcutHint} />
        <IncomingCallOverlay visible={callVisible} onDismiss={() => setCallVisible(false)} />
      </div>
    );
  }

  // ── Normal workspace ─────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-cream overflow-hidden relative">
      <TopBar
        onLogout={onLogout}
        activeNav={activeNav}
        onNavChange={handleNavChange}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (!q) setSearchResults(null);
        }}
        onSearchSubmit={handleSearchSubmit}
      />

      {(searchResults || searchLoading) && (
        <div className="relative z-50">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border border-border rounded-b-lg shadow-lg">
            {searchLoading ? (
              <div className="px-4 py-3 flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-sans text-text-muted">
                  Searching Circuitus library...
                </span>
              </div>
            ) : (
              <div className="py-1">
                {searchResults?.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearchResultClick(r)}
                    className="w-full text-left px-4 py-2 text-xs font-sans hover:bg-cream transition-colors"
                  >
                    <span
                      className={r.docId ? 'text-text-main' : 'text-text-muted italic'}
                    >
                      {r.label}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => setSearchResults(null)}
                  className="w-full text-left px-4 py-2 text-[10px] font-sans text-text-muted border-t border-border"
                >
                  Press Esc to dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Toolbar
        breadcrumb={breadcrumb}
        onImport={handleImport}
        fontSize={fontSize}
        onFontSizeChange={handleFontSizeChange}
        showParagraphNumbers={showParagraphNumbers}
        onToggleParagraphNumbers={() => setShowParagraphNumbers((p) => !p)}
        showRightSidebar={showRightSidebar}
        onToggleRightSidebar={() => setShowRightSidebar((p) => !p)}
        showNotes={showNotes}
        onToggleNotes={() => setShowNotes((p) => !p)}
        autoPilotEnabled={autoPilotEnabled}
        onToggleAutoPilot={() => setAutoPilotEnabled((p) => !p)}
        onPrint={handlePrint}
        onExportAnnotations={handleExportAnnotations}
        canExport={!!exportableDocId}
        onTriggerCall={handleTriggerCall}
      />

      <MatterTabs
        tabs={matterTabs}
        activeTabId={activeTabId}
        onTabClick={handleTabClick}
        onTabClose={handleTabClose}
        onAddTab={handleImport}
      />

      {importing && (
        <div className="bg-white border-b border-border px-4 py-2 flex items-center gap-3 flex-shrink-0">
          <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-sans text-text-muted">{importStatus}</span>
        </div>
      )}

      {importError && (
        <div
          className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between flex-shrink-0 cursor-pointer"
          onClick={() => setImportError(null)}
        >
          <span className="text-xs font-sans text-red-700">{importError}</span>
          <span className="text-xs font-sans text-red-400 ml-4">✕</span>
        </div>
      )}

      {exportToast && (
        <div
          className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center justify-between flex-shrink-0 cursor-pointer"
          onClick={() => setExportToast(null)}
        >
          <span className="text-xs font-sans text-green-700">{exportToast}</span>
          <span className="text-xs font-sans text-green-400 ml-4">✕</span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {!hideLeftSidebar && (
          <Sidebar
            chapters={activeChaptersForSidebar}
            activeChapterIndex={activeChapterIndex}
            onChapterClick={handleChapterClick}
            documentTitle={contentTitle}
            documentType={currentDoc?.fileType || (viewingStandin ? 'guide' : undefined)}
          />
        )}

        {activeNav === 'Templates' ? (
          <TemplatesPage />
        ) : activeNav === 'Authorities' ? (
          <AuthoritiesFeedPage />
        ) : activeNav === 'Compliance' ? (
          <CompliancePage />
        ) : activeNav === 'Audio' ? (
          <AudioLibraryPage />
        ) : isReading ? (
          <ContentArea
            isEmpty={false}
            refNumber={refNumber}
            documentTitle={contentTitle}
            chapters={viewingStandin ? undefined : chapters}
            rawContent={viewingStandin ? viewingStandin.content : undefined}
            fontSize={fontSize}
            showParagraphNumbers={showParagraphNumbers}
            activeChapterIndex={activeChapterIndex}
            onActiveChapterChange={setActiveChapterIndex}
            onHighlight={handleHighlight}
            onBookmark={handleBookmark}
            scrollContainerRef={scrollContainerRef}
            initialScrollPercent={initialScrollPercent}
          >
            <button
              onClick={handleBack}
              className="text-xs font-sans text-blue-600 hover:underline mb-6 inline-block"
            >
              &larr; Back to Matters
            </button>
          </ContentArea>
        ) : (
          <LibraryPage
            onOpenDocument={openDocument}
            onImport={handleImport}
            refreshKey={libraryRefreshKey}
          />
        )}

        {showNotes && (
          <NotesPane
            matterId={exportableDocId}
            matterTitle={contentTitle ?? 'Untitled Matter'}
            onClose={() => setShowNotes(false)}
          />
        )}

        {showRightSidebar && !hideRightSidebar && (
          <AuthoritiesSidebar
            documents={sidebarDocs}
            onDocumentClick={handleStandinClick}
            onRefresh={handleRefreshAuthorities}
          />
        )}
      </div>

      <StatusBar shortcutHint={shortcutHint} />

      <input
        ref={fileInputRef}
        type="file"
        accept=".epub,.pdf,.txt"
        className="hidden"
        onChange={handleFileChange}
      />

      <IncomingCallOverlay visible={callVisible} onDismiss={() => setCallVisible(false)} />
    </div>
  );
}

function parseStandinChapters(html: string): DocumentChapter[] {
  const headingRegex = /<h[23][^>]*>(.*?)<\/h[23]>/gi;
  const chapters: DocumentChapter[] = [];
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    chapters.push({
      id: crypto.randomUUID(),
      title: match[1].replace(/<[^>]+>/g, ''),
      content: '',
    });
  }
  return chapters.length > 0 ? chapters : [{ id: 'main', title: 'Full Document', content: '' }];
}
