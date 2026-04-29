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
    <div
      className="bg-paper-cool flex items-center px-3 h-[34px] flex-shrink-0 overflow-x-auto gap-0 relative"
      style={{ borderBottom: '1px solid #D9D2C0' }}
    >
      {tabs.map((tab, idx) => {
        const active = activeTabId === tab.id;
        return (
          <div
            key={tab.id}
            onClick={() => onTabClick(tab.id)}
            className={`flex items-center gap-2 px-3.5 h-[34px] cursor-pointer flex-shrink-0 group relative font-sans text-[11px] transition-colors ${
              active ? 'text-ink bg-paper' : 'text-ink-muted hover:text-ink hover:bg-paper/60'
            }`}
            style={{
              borderRight: idx === tabs.length - 1 ? 'none' : '1px solid #E9E3D2',
              borderTop: active ? '2px solid #9C7A1F' : '2px solid transparent',
              marginTop: -1,
            }}
          >
            <span
              className={`font-mono text-[9px] ${active ? 'text-brass' : 'text-ink-muted/60'}`}
              aria-hidden
            >
              §{String(idx + 1).padStart(2, '0')}
            </span>
            <span className={`truncate max-w-[170px] ${active ? 'font-medium' : ''}`}>
              {tab.label}
            </span>
            {tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                className="p-0.5 opacity-0 group-hover:opacity-100 hover:text-claret transition-all"
                aria-label="Close matter"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}

      <button
        onClick={onAddTab}
        className="flex items-center justify-center w-7 h-[34px] text-ink-muted hover:text-brass transition-colors flex-shrink-0 ml-1"
        title="Add matter"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
