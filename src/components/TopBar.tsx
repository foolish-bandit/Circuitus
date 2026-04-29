import { Search } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';

const NAV_ITEMS = ['Practice Guides', 'Templates', 'Authorities', 'Compliance', 'Audio'];

interface TopBarProps {
  onLogout: () => void;
  activeNav: string;
  onNavChange: (nav: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
}

export default function TopBar({
  onLogout,
  activeNav,
  onNavChange,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
}: TopBarProps) {
  const user = getCurrentUser();

  return (
    <div className="bg-gradient-to-r from-navy-dark to-navy text-white border-b-[3px] border-gold flex-shrink-0">
      <div className="flex items-center h-12 px-4 gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <svg className="w-5 h-5 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 3L2 8l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12.5l10 5 10-5" />
          </svg>
          <span className="font-serif text-lg font-bold tracking-tight">Circuitus</span>
          <span className="text-gold text-[10px] tracking-widest uppercase font-sans hidden sm:inline">
            for Counsel
          </span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
              placeholder="Search guides, templates, authorities..."
              aria-label="Search guides, templates, authorities"
              className="w-full bg-white/[0.06] border border-white/10 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/30 font-sans focus:outline-none focus:border-gold/40 transition-colors"
            />
          </div>
        </div>

        {/* Nav tabs */}
        <nav className="flex items-center gap-1 flex-shrink-0">
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              onClick={() => onNavChange(item)}
              aria-current={activeNav === item ? 'page' : undefined}
              className={`px-3 py-1 text-[11px] uppercase tracking-[0.1em] font-sans font-medium transition-colors rounded ${
                activeNav === item
                  ? 'text-gold'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="flex items-center gap-3 flex-shrink-0 border-l border-white/10 pl-3 ml-1">
          <div className="w-7 h-7 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold text-[10px] font-sans font-semibold uppercase">
            {user?.email?.charAt(0) || 'U'}
          </div>
          <button
            onClick={onLogout}
            className="text-white/40 hover:text-white text-[10px] font-sans uppercase tracking-wider transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
