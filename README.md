# Circuitus

**The Tech-Forward Suite for Counsel** — a web-based legal research and reference platform built for in-house legal teams. Circuitus provides practical guidance, transactional intelligence, and document management in a reading-optimized interface designed around how lawyers actually work.

## What It Does

Circuitus is a single-page application that combines a document reader, annotation system, and curated legal reference library. Users can import their own documents (PDF, EPUB, plain text), browse pre-loaded practice guides covering topics like California contract law and data privacy compliance, and annotate everything with highlights and bookmarks — all persisted locally via IndexedDB.

The interface is modeled after professional legal research platforms: a left sidebar for document outline navigation, a center reading pane with legal typographic formatting, and a right sidebar surfacing related authorities and practice resources.

## Core Features

### Multi-Document Workspace
A tabbed interface lets users work across multiple documents simultaneously. Tabs can hold both uploaded files and built-in practice guides. Scroll positions are preserved per-tab, so switching between documents picks up exactly where you left off.

### Document Reader
The reading pane renders content with legal-specific typography — justified serif text, section numbering (§ 1, § 2...), and automatic exhibit captioning for images. Font size cycles through three presets. Paragraph numbering can be toggled on for reference during review. An IntersectionObserver tracks the active chapter as the user scrolls, keeping the sidebar TOC in sync.

### Text Annotation
Selecting text surfaces a floating toolbar with three highlight colors (yellow, blue, green) and a bookmark button. Highlights are applied inline via `<mark>` elements. Both highlights and bookmarks are saved to IndexedDB with document and chapter context.

### Built-In Legal Library
Twelve pre-loaded practice guides and articles cover topics including:
- Structuring Statements of Work under California law
- AI governance frameworks
- CCPA/CPRA compliance (2026 update)
- Vendor agreement negotiation
- NDA drafting with technology carve-outs
- Data processing agreement review
- Incident response planning
- IP provisions in technology agreements

Each document contains real statutory citations (Cal. Civ. Code, CCPA, CPRA, Cal. Lab. Code), case references, and practice tips. Content is structured with H2/H3 headings that the app parses into a navigable table of contents.

### Authorities Sidebar
The right sidebar displays a randomized selection of related practice resources with type badges (guide, article, case) and flag indicators. A refresh button re-shuffles the selection. Clicking an authority opens it in the reader and adds a tab.

### Panic Key
`Ctrl+Shift+K` instantly switches the entire UI to display a specific practice guide (SOW Structuring), saving and later restoring the user's previous application state. The status bar indicates when quick-reference mode is active.

### Search
The top bar includes a search field that queries the built-in document library by title, with results appearing in a dropdown. Selecting a result opens the document.

### Keyboard Navigation
Arrow keys navigate between chapters when not focused on an input field. The sidebar TOC highlights the current section in real time.

### Responsive Layout
Sidebars collapse automatically at viewport breakpoints — the left TOC hides below 1200px, the right authorities panel below 1400px — keeping the reading pane usable on smaller screens.

## Architecture

### Storage
All data lives client-side in IndexedDB (`circuitus-db`) with three object stores: `documents` (uploaded files with reading positions), `highlights`, and `bookmarks`. No server-side persistence — the app runs entirely in the browser.

### Document Processing
- **PDF**: Parsed via pdf.js with spatial text extraction (Y/X positioning) and heading detection for chapter splitting
- **EPUB**: Extracted via JSZip, with HTML content parsed from the OPF spine
- **Plain text**: Split into chapters by blank-line heuristics
- **Built-in guides**: Stored as HTML strings, parsed at runtime for H2/H3 headings to generate the sidebar TOC

### Reading State
Scroll position is tracked with a 2-second debounce and saved per-document to IndexedDB. An IntersectionObserver with a `rootMargin` of `-10% 0px -80% 0px` detects which chapter heading is in the top portion of the viewport, driving the active chapter indicator in the sidebar.

### Tech Stack
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Vite** for build tooling
- **IndexedDB** (via `idb`) for local persistence
- **pdf.js** and **JSZip** for document parsing
- **Lucide React** for icons

### Design Language
Navy and gold color scheme with a cream content background. Serif fonts (Libre Baskerville) for document headers and body text; sans-serif for interface chrome. Monospace for reference numbers. The visual language is intentionally formal — styled to feel like a professional legal research tool rather than a generic document viewer.

## License

GPL-3.0

---

Built by [Zack Brenner](https://github.com/foolish-bandit)
