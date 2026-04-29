import {
  Upload,
  Minus,
  Plus,
  Pilcrow,
  PanelRightOpen,
  PanelRightClose,
  StickyNote,
  Compass,
  Printer,
  ClipboardCopy,
  PhoneIncoming,
} from 'lucide-react';

interface ToolbarProps {
  breadcrumb: string;
  onImport: () => void;
  fontSize: number;
  onFontSizeChange: (delta: number) => void;
  showParagraphNumbers: boolean;
  onToggleParagraphNumbers: () => void;
  showRightSidebar: boolean;
  onToggleRightSidebar: () => void;
  showNotes: boolean;
  onToggleNotes: () => void;
  autoPilotEnabled: boolean;
  onToggleAutoPilot: () => void;
  onPrint: () => void;
  onExportAnnotations: () => void;
  canExport: boolean;
  onTriggerCall: () => void;
}

export default function Toolbar({
  breadcrumb,
  onImport,
  fontSize,
  onFontSizeChange,
  showParagraphNumbers,
  onToggleParagraphNumbers,
  showRightSidebar,
  onToggleRightSidebar,
  showNotes,
  onToggleNotes,
  autoPilotEnabled,
  onToggleAutoPilot,
  onPrint,
  onExportAnnotations,
  canExport,
  onTriggerCall,
}: ToolbarProps) {
  return (
    <div
      className="bg-paper-cool flex items-center justify-between px-5 h-[36px] flex-shrink-0"
      style={{ borderBottom: '1px solid #D9D2C0' }}
    >
      <div className="font-mono text-[10.5px] text-ink-muted flex items-center gap-2">
        <span className="kicker text-brass-dim">Research</span>
        <span className="text-rule-strong">›</span>
        <span className="font-serif text-[12.5px] italic text-ink not-italic">{breadcrumb}</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onImport}
          className="flex items-center gap-1.5 bg-navy text-paper text-[10.5px] font-sans font-medium px-3.5 py-1 hover:bg-navy-light transition-colors"
          style={{
            borderRadius: 0,
            border: '1px solid #0A1F3D',
            boxShadow: 'inset 0 0 0 1px rgba(184, 147, 43, 0.22)',
          }}
        >
          <Upload className="w-3 h-3" />
          <span className="uppercase tracking-marque">Import Source</span>
        </button>

        <div className="w-px h-4 bg-rule mx-2" />

        <button
          onClick={() => onFontSizeChange(-1)}
          className="p-1 text-ink-muted hover:text-ink transition-colors"
          title="Decrease font size"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="font-mono text-[10px] text-ink-muted w-8 text-center">{fontSize}px</span>
        <button
          onClick={() => onFontSizeChange(1)}
          className="p-1 text-ink-muted hover:text-ink transition-colors"
          title="Increase font size"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-rule mx-2" />

        <button
          onClick={onToggleParagraphNumbers}
          className={`p-1 transition-colors rounded ${
            showParagraphNumbers ? 'text-brass' : 'text-ink-muted hover:text-ink'
          }`}
          title="Toggle paragraph numbering"
        >
          <Pilcrow className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onToggleAutoPilot}
          className={`p-1 transition-colors rounded ${
            autoPilotEnabled ? 'text-brass' : 'text-ink-muted hover:text-ink'
          }`}
          title={autoPilotEnabled ? 'Disable reading auto-pilot' : 'Enable reading auto-pilot'}
        >
          <Compass className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onToggleNotes}
          className={`p-1 transition-colors rounded ${
            showNotes ? 'text-brass' : 'text-ink-muted hover:text-ink'
          }`}
          title="Toggle privileged memo pane"
        >
          <StickyNote className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onExportAnnotations}
          disabled={!canExport}
          className={`p-1 transition-colors rounded ${
            canExport
              ? 'text-ink-muted hover:text-ink'
              : 'text-ink-muted/30 cursor-not-allowed'
          }`}
          title="Copy annotations as Markdown"
        >
          <ClipboardCopy className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onPrint}
          className="p-1 text-ink-muted hover:text-ink transition-colors rounded"
          title="Print preview (Ctrl+P)"
        >
          <Printer className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onTriggerCall}
          className="p-1 text-ink-muted hover:text-ink transition-colors rounded"
          title="Simulate incoming privileged call"
        >
          <PhoneIncoming className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onToggleRightSidebar}
          className={`p-1 transition-colors rounded ${
            showRightSidebar ? 'text-brass' : 'text-ink-muted hover:text-ink'
          }`}
          title="Toggle Authorities panel"
        >
          {showRightSidebar ? (
            <PanelRightClose className="w-3.5 h-3.5" />
          ) : (
            <PanelRightOpen className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
