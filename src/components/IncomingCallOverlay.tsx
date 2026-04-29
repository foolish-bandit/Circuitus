import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, MicOff, Mic, Video, VideoOff, X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface IncomingCallOverlayProps {
  /** When true, the overlay is visible. The overlay only mounts while visible
   * is true, so internal state resets naturally on each open. */
  visible: boolean;
  onDismiss: () => void;
}

interface OverlayBodyProps {
  onDismiss: () => void;
}

const CALLERS: ReadonlyArray<{ name: string; org: string }> = [
  { name: 'Daniel R. Holloway', org: 'Outside Counsel — Patton & Bryce LLP' },
  { name: 'Margaret Chen', org: 'General Counsel — Anvil Robotics, Inc.' },
  { name: 'Privileged Caller', org: 'Confidential Matter Channel' },
  { name: 'Aiden Vasquez', org: 'Senior Director, Compliance — Vendor' },
  { name: 'James Whitfield', org: 'Partner — Carlisle Whitfield LLP' },
];

function pickCaller(): { name: string; org: string } {
  return CALLERS[Math.floor(Math.random() * CALLERS.length)];
}

export default function IncomingCallOverlay({ visible, onDismiss }: IncomingCallOverlayProps) {
  if (!visible) return null;
  return <OverlayBody onDismiss={onDismiss} />;
}

function OverlayBody({ onDismiss }: OverlayBodyProps) {
  const [caller] = useState(() => pickCaller());
  const [muted, setMuted] = useState(true);
  const [video, setVideo] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(true, dialogRef);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onDismiss]);

  useEffect(() => {
    if (!accepted) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [accepted]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const initials = caller.name
    .split(' ')
    .map((p) => p.charAt(0))
    .join('')
    .slice(0, 2);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Incoming call"
        className="w-[440px] bg-paper relative"
        style={{
          border: '1px solid #9C7A1F',
          boxShadow:
            'inset 0 0 0 1px rgba(184, 147, 43, 0.15), 0 24px 64px -16px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header bar */}
        <div
          className="flex items-center justify-between px-5 py-2.5 bg-paper-cool"
          style={{ borderBottom: '1px solid #D9D2C0' }}
        >
          <p className="kicker-brass">
            {accepted ? '● Connected · Privileged Channel' : 'Incoming · Privileged Call'}
          </p>
          <button
            onClick={onDismiss}
            className="text-ink-muted hover:text-claret transition-colors"
            aria-label="Dismiss"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Brass double-rule signature */}
        <div className="rule-double" aria-hidden />

        {/* Caller body */}
        <div className="px-7 pt-7 pb-4 text-center">
          <div
            className="w-20 h-20 mx-auto flex items-center justify-center text-brass-bright font-display italic text-2xl mb-4"
            style={{
              border: '1px solid #9C7A1F',
              background: 'rgba(156, 122, 31, 0.06)',
              boxShadow: 'inset 0 0 0 1px rgba(156, 122, 31, 0.15)',
            }}
            aria-hidden
          >
            {initials}
          </div>
          <p className="font-display text-[20px] text-ink leading-tight">{caller.name}</p>
          <p className="font-serif italic text-[12.5px] text-ink-muted mt-1">{caller.org}</p>
          {accepted && (
            <p className="font-mono text-[12px] text-brass mt-4 tracking-wider">
              {mm}:{ss}
            </p>
          )}
        </div>

        {/* Action buttons */}
        {accepted ? (
          <div className="flex items-stretch" style={{ borderTop: '1px solid #D9D2C0' }}>
            <button
              onClick={() => setMuted((m) => !m)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                muted ? 'text-ink-muted hover:text-ink' : 'text-brass'
              }`}
              style={{ borderRight: '1px solid #D9D2C0' }}
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span className="kicker">{muted ? 'Muted' : 'Live'}</span>
            </button>
            <button
              onClick={() => setVideo((v) => !v)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                video ? 'text-brass' : 'text-ink-muted hover:text-ink'
              }`}
              style={{ borderRight: '1px solid #D9D2C0' }}
              title={video ? 'Stop video' : 'Start video'}
            >
              {video ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              <span className="kicker">Video</span>
            </button>
            <button
              onClick={onDismiss}
              className="flex-1 flex flex-col items-center gap-1 py-3 text-claret hover:bg-claret/5 transition-colors"
              title="End call"
            >
              <PhoneOff className="w-4 h-4" />
              <span className="kicker text-claret">End Call</span>
            </button>
          </div>
        ) : (
          <div className="flex items-stretch" style={{ borderTop: '1px solid #D9D2C0' }}>
            <button
              onClick={onDismiss}
              className="flex-1 flex flex-col items-center gap-1.5 py-4 text-claret hover:bg-claret/5 transition-colors"
              style={{ borderRight: '1px solid #D9D2C0' }}
              title="Decline"
            >
              <PhoneOff className="w-5 h-5" />
              <span className="kicker text-claret">Decline</span>
            </button>
            <button
              onClick={() => {
                setAccepted(true);
                setMuted(true);
              }}
              className="flex-1 flex flex-col items-center gap-1.5 py-4 text-emerald-700 hover:bg-emerald-700/5 transition-colors"
              title="Accept (muted)"
            >
              <Phone className="w-5 h-5" />
              <span className="kicker text-emerald-700">Accept · Muted</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div
          className="bg-paper-cool px-5 py-2 text-center"
          style={{ borderTop: '1px solid #D9D2C0' }}
        >
          <p className="font-mono text-[9px] text-ink-muted/70 tracking-marque">
            <span className="text-brass">§</span> CIRCUITUS SECURE VOICE · END-TO-END
          </p>
        </div>
      </div>
    </div>
  );
}
