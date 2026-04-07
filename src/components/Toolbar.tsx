import { Upload, Minus, Plus, Pilcrow, PanelRightOpen, PanelRightClose } from 'lucide-react';

interface ToolbarProps {
  breadcrumb: string;
  onImport: () => void;
  fontSize: number;
  onFontSizeChange: (delta: number) => void;
  showParagraphNumbers: boolean;
  onToggleParagraphNumbers: () => void;
  showRightSidebar: boolean;
  onToggleRightSidebar: () => void;
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
}: ToolbarProps) {
  return (
    <div className="bg-white border-b border-border flex items-center justify-between px-4 h-9 flex-shrink-0">
      {/* Breadcrumb */}
      <div className="text-xs font-sans text-text-muted">
        <span className="text-blue-600 hover:underline cursor-pointer">Research</span>
        <span className="mx-1.5 text-border">/</span>
        <span>{breadcrumb}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onImport}
          className="flex items-center gap-1.5 bg-navy text-white text-[11px] font-sans font-medium px-3 py-1 rounded hover:bg-navy-light transition-colors"
        >
          <Upload className="w-3 h-3" />
          Import Source
        </button>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Font size */}
        <button
          onClick={() => onFontSizeChange(-1)}
          className="p-1 text-text-muted hover:text-text-main transition-colors rounded"
          title="Decrease font size"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-mono text-text-muted w-8 text-center">
          {fontSize}px
        </span>
        <button
          onClick={() => onFontSizeChange(1)}
          className="p-1 text-text-muted hover:text-text-main transition-colors rounded"
          title="Increase font size"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Paragraph numbering */}
        <button
          onClick={onToggleParagraphNumbers}
          className={`p-1 transition-colors rounded ${
            showParagraphNumbers ? 'text-navy' : 'text-text-muted hover:text-text-main'
          }`}
          title="Toggle paragraph numbering"
        >
          <Pilcrow className="w-3.5 h-3.5" />
        </button>

        {/* Right sidebar toggle */}
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
