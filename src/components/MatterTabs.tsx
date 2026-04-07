import { X, Plus } from 'lucide-react';

export interface MatterTab {
  id: string;
  label: string;
  type: 'standin' | 'uploaded';
}

interface MatterTabsProps {
  tabs: MatterTab[];
  activeTabId: string | null;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  onAddTab: () => void;
}

export default function MatterTabs({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onAddTab,
}: MatterTabsProps) {
  if (tabs.length === 0) return null;

  return (
    <div className="bg-white border-b border-border flex items-center px-2 h-8 flex-shrink-0 overflow-x-auto gap-0.5">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => onTabClick(tab.id)}
          className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-sans cursor-pointer rounded-t transition-colors flex-shrink-0 group ${
            activeTabId === tab.id
              ? 'text-navy font-medium border-b-2 border-gold bg-cream/50'
              : 'text-text-muted hover:text-text-main hover:bg-cream/30'
          }`}
        >
          <span className="truncate max-w-[160px]">&sect; {tab.label}</span>
          {tabs.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-border/50 transition-all"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      ))}

      <button
        onClick={onAddTab}
        className="flex items-center justify-center w-6 h-6 text-text-muted hover:text-text-main hover:bg-cream/50 rounded transition-colors flex-shrink-0"
        title="Add matter"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
