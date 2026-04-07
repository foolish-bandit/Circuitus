import { useEffect, useState } from 'react';

interface StatusBarProps {
  isPanicMode?: boolean;
}

export default function StatusBar({ isPanicMode = false }: StatusBarProps) {
  const [minutesAgo, setMinutesAgo] = useState(2);

  useEffect(() => {
    const interval = setInterval(() => {
      setMinutesAgo((prev) => Math.min(prev + 1, 59));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white border-t border-border flex items-center justify-between px-4 h-6 flex-shrink-0">
      {/* Left: Connection status */}
      <div className="flex items-center gap-1.5">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isPanicMode ? 'bg-blue-500' : 'bg-green-500'
          }`}
        />
        <span className="text-[10px] font-sans text-text-muted">
          {isPanicMode ? 'Quick Reference Mode' : 'Connected to Circuitus Library'}
        </span>
      </div>

      {/* Center: Sync time */}
      <span className="text-[10px] font-sans text-text-muted">
        Last synced {minutesAgo} min ago
      </span>

      {/* Right: Shortcut hint + version */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono text-text-muted/60">
          Ctrl+Shift+K: Quick Reference
        </span>
        <span className="text-[10px] font-mono text-text-muted/40">v2.4.1</span>
      </div>
    </div>
  );
}
