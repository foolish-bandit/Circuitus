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
    <div className="bg-white border-b border-border flex items-center justify-between px-4 h-9 flex-shrink-0">
      <div className="text-xs font-sans text-text-muted">
        <span className="text-blue-600 hover:underline cursor-pointer">Research</span>
        <span className="mx-1.5 text-border">/</span>
        <span>{breadcrumb}</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onImport}
          className="flex items-center gap-1.5 bg-navy text-white text-[11px] font-sans font-medium px-3 py-1 rounded hover:bg-navy-light transition-colors"
        >
          <Upload className="w-3 h-3" />
          Import Source
        </button>

        <div className="w-px h-4 bg-border mx-1" />

        <button
          onClick={() => onFontSizeChange(-1)}
          className="p-1 text-text-muted hover:text-text-main transition-colors rounded"
          title="Decrease font size"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-mono text-text-muted w-8 text-center">{fontSize}px</span>
        <button
          onClick={() => onFontSizeChange(1)}
          className="p-1 text-text-muted hover:text-text-main transition-colors rounded"
          title="Increase font size"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-border mx-1" />

        <button
          onClick={onToggleParagraphNumbers}
          className={`p-1 transition-colors rounded ${
            showParagraphNumbers ? 'text-navy' : 'text-text-muted hover:text-text-main'
          }`}
          title="Toggle paragraph numbering"
        >
          <Pilcrow className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onToggleAutoPilot}
          className={`p-1 transition-colors rounded ${
            autoPilotEnabled ? 'text-navy' : 'text-text-muted hover:text-text-main'
          }`}
          title={autoPilotEnabled ? 'Disable reading auto-pilot' : 'Enable reading auto-pilot'}
        >
          <Compass className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onToggleNotes}
          className={`p-1 transition-colors rounded ${
            showNotes ? 'text-navy' : 'text-text-muted hover:text-text-main'
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
              ? 'text-text-muted hover:text-text-main'
              : 'text-text-muted/30 cursor-not-allowed'
          }`}
          title="Copy annotations as Markdown"
        >
          <ClipboardCopy className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onPrint}
          className="p-1 text-text-muted hover:text-text-main transition-colors rounded"
          title="Print preview (Ctrl+P)"
        >
          <Printer className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onTriggerCall}
          className="p-1 text-text-muted hover:text-text-main transition-colors rounded"
          title="Simulate incoming privileged call"
        >
          <PhoneIncoming className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onToggleRightSidebar}
          className={`p-1 transition-colors rounded ${
            showRightSidebar ? 'text-navy' : 'text-text-muted hover:text-text-main'
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
