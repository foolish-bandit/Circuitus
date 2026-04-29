import { useEffect, useState } from 'react';

interface StatusBarProps {
  isQuickRef?: boolean;
  shortcutHint?: string;
}

/**
 * Cycling sync indicator: drift up minute-by-minute, then occasionally
 * snap back to 0–2 to mimic a successful background poll.
 */
function useSyncMinutes(): number {
  const [minutes, setMinutes] = useState(() => Math.floor(Math.random() * 4) + 1);

  useEffect(() => {
    const interval = setInterval(() => {
      setMinutes((prev) => {
        const snapChance = Math.min(0.04 + prev * 0.012, 0.4);
        if (Math.random() < snapChance) return Math.floor(Math.random() * 3);
        return prev + 1;
      });
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  return minutes;
}

export default function StatusBar({ isQuickRef = false, shortcutHint }: StatusBarProps) {
  const minutes = useSyncMinutes();

  return (
    <div className="bg-white border-t border-border flex items-center justify-between px-4 h-6 flex-shrink-0">
      <div className="flex items-center gap-1.5">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isQuickRef ? 'bg-blue-500' : 'bg-green-500'
          }`}
        />
        <span className="text-[10px] font-sans text-text-muted">
          {isQuickRef ? 'Quick Reference Mode' : 'Connected to Circuitus Library'}
        </span>
      </div>

      <span className="text-[10px] font-sans text-text-muted">
        {minutes === 0 ? 'Synced just now' : `Last synced ${minutes} min ago`}
      </span>

      <div className="flex items-center gap-3">
        {shortcutHint && (
          <span className="text-[10px] font-mono text-text-muted/60">
            {shortcutHint}: Quick Reference
          </span>
        )}
        <span className="text-[10px] font-mono text-text-muted/40">v2.5.0</span>
      </div>
    </div>
  );
}
