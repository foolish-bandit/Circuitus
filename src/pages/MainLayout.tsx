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
import { parseFile } from '@/lib/parsers';
import { saveDocument, getDocument, saveHighlight, saveBookmark } from '@/lib/storage';
import { useReadingPosition } from '@/hooks/useReadingPosition';
import { usePanicKey } from '@/hooks/usePanicKey';
import type { DocumentChapter, StoredDocument, StandinDocument } from '@/types';

const FONT_SIZES = [13, 14.5, 16.5];

import { standinDocuments as _standinDocs } from '@/data/standin-documents';

function shuffleAndPick<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
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
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);

  // Document state
  const [currentDoc, setCurrentDoc] = useState<StoredDocument | null>(null);
  const [chapters, setChapters] = useState<DocumentChapter[]>([]);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');

  // Standin docs
  const [sidebarDocs] = useState<StandinDocument[]>(() => shuffleAndPick(_standinDocs, Math.min(7, _standinDocs.length)));
  const [viewingStandin, setViewingStandin] = useState<StandinDocument | null>(null);
  const [standinChapters, setStandinChapters] = useState<DocumentChapter[]>([]);

  // Nav content state
  const [navContent, setNavContent] = useState<string | null>(null);

  // Matter tabs
  const [matterTabs, setMatterTabs] = useState<MatterTab[]>(() => {
    const initial = shuffleAndPick(_standinDocs, Math.min(3, _standinDocs.length));
    return initial.map((d) => ({ id: d.id, label: d.shortTitle, type: 'standin' as const }));
  });
  const [activeTabId, setActiveTabId] = useState<string | null>(matterTabs[0]?.id ?? null);

  // Panic key
  const { isPanicked, savePanicState } = usePanicKey();
  const panicDoc = useMemo(() => _standinDocs.find((d) => d.id === 'guide-sow-ca') ?? null, []);
  const panicChapters = useMemo(() => (panicDoc ? parseStandinChapters(panicDoc.content) : []), [panicDoc]);

  // Search state
  const [searchResults, setSearchResults] = useState<{ label: string; docId?: string }[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { restorePosition } = useReadingPosition(currentDoc?.id ?? null, scrollContainerRef, activeChapterIndex);

  // Reading position restore state
  const [initialScrollPercent, setInitialScrollPercent] = useState(0);

  // Save state before panic
  useEffect(() => {
    if (isPanicked) {
      savePanicState(
        scrollContainerRef.current?.scrollTop ?? 0,
        currentDoc?.id ?? null,
        activeTabId,
      );
    }
  }, [isPanicked, currentDoc, activeTabId, savePanicState]);

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

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      openDocument(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to import document.');
    } finally {
      setImporting(false);
      setImportStatus('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  async function openDocument(id: string) {
    const doc = await getDocument(id);
    if (!doc) return;
    setCurrentDoc(doc);
    setChapters(doc.chapters);
    setActiveChapterIndex(doc.readingPosition?.chapterIndex || 0);
    setInitialScrollPercent(doc.readingPosition?.scrollPercent || 0);
    setViewingStandin(null);
    setStandinChapters([]);
    setNavContent(null);

    // Add tab if not present
    if (!matterTabs.find((t) => t.id === id)) {
      setMatterTabs((prev) => [...prev, { id, label: doc.title, type: 'uploaded' }]);
    }
    setActiveTabId(id);

    // Restore reading position after render
    requestAnimationFrame(() => restorePosition());
  }

  function handleBack() {
    setCurrentDoc(null);
    setChapters([]);
    setActiveChapterIndex(0);
    setViewingStandin(null);
    setStandinChapters([]);
  }

  function handleStandinClick(doc: StandinDocument) {
    setViewingStandin(doc);
    const tempChapters = parseStandinChapters(doc.content);
    setStandinChapters(tempChapters);
    setActiveChapterIndex(0);
    setCurrentDoc(null);
    setNavContent(null);

    if (!matterTabs.find((t) => t.id === doc.id)) {
      setMatterTabs((prev) => [...prev, { id: doc.id, label: doc.shortTitle, type: 'standin' }]);
    }
    setActiveTabId(doc.id);
  }

  function handleTabClick(tabId: string) {
    setActiveTabId(tabId);
    // Check if standin
    const standin = _standinDocs.find((d) => d.id === tabId);
    if (standin) {
      handleStandinClick(standin);
    } else {
      // Must be an uploaded doc
      openDocument(tabId);
    }
  }

  function handleTabClose(tabId: string) {
    setMatterTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== tabId);
      if (activeTabId === tabId && filtered.length > 0) {
        setActiveTabId(filtered[0].id);
        const standin = _standinDocs.find((d) => d.id === filtered[0].id);
        if (standin) handleStandinClick(standin);
        else openDocument(filtered[0].id);
      }
      return filtered;
    });
  }

  function handleChapterClick(index: number) {
    setActiveChapterIndex(index);
    const el = document.getElementById(`chapter-${index}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleHighlight(text: string, color: 'yellow' | 'blue' | 'green') {
    const docId = currentDoc?.id || viewingStandin?.id;
    if (!docId) return;
    saveHighlight({
      documentId: docId,
      chapterIndex: activeChapterIndex,
      startOffset: 0,
      endOffset: text.length,
      selectedText: text,
      color,
      dateCreated: new Date().toISOString(),
    });
  }

  function handleBookmark(text: string) {
    const docId = currentDoc?.id || viewingStandin?.id;
    if (!docId) return;
    const el = scrollContainerRef.current;
    const scrollPercent = el && el.scrollHeight > el.clientHeight
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
    if (nav === 'Practice Guides') {
      setNavContent(null);
    } else if (nav === 'Templates') {
      setNavContent('Template library syncing... 14 templates available. Contact your Circuitus administrator to configure template access.');
    } else if (nav === 'Authorities') {
      setNavContent('Authority database contains 2,847 indexed sources. Full-text search available for subscribed jurisdictions.');
    } else if (nav === 'Compliance') {
      setNavContent('Compliance dashboard requires integration with your organization\'s GRC platform. See Circuitus Admin Settings.');
    }
  }

  async function handleSearchSubmit() {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchResults(null);

    await new Promise((r) => setTimeout(r, 1200));

    const results: { label: string; docId?: string }[] = [];
    for (const doc of _standinDocs) {
      if (doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.shortTitle.toLowerCase().includes(searchQuery.toLowerCase())) {
        results.push({ label: doc.shortTitle, docId: doc.id });
      }
    }
    results.push({ label: 'Recent: vendor indemnification clause review' });
    results.push({ label: 'Suggested: force majeure in SaaS agreements' });

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

  // Determine active view
  const isReading = currentDoc !== null || viewingStandin !== null;
  const activeChaptersForSidebar = isPanicked
    ? panicChapters
    : viewingStandin
      ? standinChapters
      : chapters;

  const breadcrumb = isPanicked
    ? 'Research / Practice Guides / SOW Structuring'
    : currentDoc
      ? `Practice Guides / ${currentDoc.title}`
      : viewingStandin
        ? `Research / ${viewingStandin.shortTitle}`
        : 'Document View';

  const refNumber = isPanicked
    ? 'CIR-PG-2026-001'
    : currentDoc
      ? `CIR-2026-${currentDoc.id.slice(0, 5).toUpperCase()}`
      : viewingStandin
        ? viewingStandin.refNumber
        : undefined;

  const contentTitle = isPanicked
    ? panicDoc?.title
    : currentDoc?.title || viewingStandin?.title;

  return (
    <div className="h-screen flex flex-col bg-cream overflow-hidden relative">
      {/* Normal content */}
      <div className={`flex flex-col h-full ${isPanicked ? 'hidden' : ''}`}>
        <TopBar
          onLogout={onLogout}
          activeNav={activeNav}
          onNavChange={handleNavChange}
          searchQuery={searchQuery}
          onSearchChange={(q) => { setSearchQuery(q); if (!q) setSearchResults(null); }}
          onSearchSubmit={handleSearchSubmit}
        />

        {/* Search results dropdown */}
        {(searchResults || searchLoading) && (
          <div className="relative z-50">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border border-border rounded-b-lg shadow-lg">
              {searchLoading ? (
                <div className="px-4 py-3 flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-sans text-text-muted">Searching Circuitus library...</span>
                </div>
              ) : (
                <div className="py-1">
                  {searchResults?.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => handleSearchResultClick(r)}
                      className="w-full text-left px-4 py-2 text-xs font-sans hover:bg-cream transition-colors"
                    >
                      <span className={r.docId ? 'text-text-main' : 'text-text-muted italic'}>
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

        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            chapters={activeChaptersForSidebar}
            activeChapterIndex={activeChapterIndex}
            onChapterClick={handleChapterClick}
            documentTitle={contentTitle}
            documentType={currentDoc?.fileType || (viewingStandin ? 'guide' : undefined)}
          />

          {navContent ? (
            <div className="flex-1 flex items-center justify-center bg-cream">
              <div className="text-center max-w-md">
                <div className="w-12 h-12 rounded-full bg-border/30 flex items-center justify-center mx-auto mb-4">
                  <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-sm font-sans text-text-muted leading-relaxed">{navContent}</p>
              </div>
            </div>
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
            <LibraryPage onOpenDocument={openDocument} onImport={handleImport} />
          )}

          {showRightSidebar && (
            <AuthoritiesSidebar
              documents={sidebarDocs}
              onDocumentClick={handleStandinClick}
              onRefresh={() => {}}
            />
          )}
        </div>

        <StatusBar />
      </div>

      {/* Panic mode content — always mounted, toggled via CSS */}
      <div className={`flex flex-col h-full ${isPanicked ? '' : 'hidden'}`}>
        <TopBar
          onLogout={onLogout}
          activeNav="Practice Guides"
          onNavChange={() => {}}
          searchQuery=""
          onSearchChange={() => {}}
          onSearchSubmit={() => {}}
        />
        <Toolbar
          breadcrumb="Research / Practice Guides / SOW Structuring"
          onImport={() => {}}
          fontSize={fontSize}
          onFontSizeChange={handleFontSizeChange}
          showParagraphNumbers={showParagraphNumbers}
          onToggleParagraphNumbers={() => setShowParagraphNumbers((p) => !p)}
          showRightSidebar={showRightSidebar}
          onToggleRightSidebar={() => setShowRightSidebar((p) => !p)}
        />
        <MatterTabs
          tabs={[
            { id: 'panic-sow', label: 'SOW Structuring Guide', type: 'standin' },
            ...matterTabs.filter((t) => t.id !== 'panic-sow').slice(0, 2),
          ]}
          activeTabId="panic-sow"
          onTabClick={() => {}}
          onTabClose={() => {}}
          onAddTab={() => {}}
        />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            chapters={panicChapters}
            activeChapterIndex={1}
            onChapterClick={() => {}}
            documentTitle={panicDoc?.title || 'SOW Structuring Guide'}
            documentType="guide"
          />

          <ContentArea
            isEmpty={false}
            refNumber="CIR-PG-2026-001"
            documentTitle="Structuring Statements of Work Under California Law"
            rawContent={panicDoc?.content || ''}
            fontSize={fontSize}
            showParagraphNumbers={showParagraphNumbers}
          />

          {showRightSidebar && (
            <AuthoritiesSidebar
              documents={sidebarDocs}
              onDocumentClick={() => {}}
              onRefresh={() => {}}
            />
          )}
        </div>

        <StatusBar isPanicMode />
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".epub,.pdf,.txt"
        className="hidden"
        onChange={handleFileChange}
      />
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
