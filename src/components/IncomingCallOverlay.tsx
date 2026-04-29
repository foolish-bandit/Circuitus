import { useEffect, useState } from 'react';
import { Phone, PhoneOff, MicOff, Mic, Video, VideoOff } from 'lucide-react';

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

  useEffect(() => {
    if (!accepted) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [accepted]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="w-[420px] bg-[#1c2733] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-3 text-center">
          <p className="text-[10px] font-sans uppercase tracking-[0.25em] text-white/50 mb-3">
            {accepted ? 'Connected · Privileged Channel' : 'Incoming Privileged Call'}
          </p>
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-navy to-navy-dark border border-gold/30 mx-auto flex items-center justify-center text-gold font-serif text-2xl mb-3">
            {caller.name.split(' ').map((p) => p.charAt(0)).join('').slice(0, 2)}
          </div>
          <p className="text-white font-serif text-lg">{caller.name}</p>
          <p className="text-white/50 text-xs font-sans mt-1">{caller.org}</p>
          {accepted && (
            <p className="text-gold font-mono text-xs mt-3">{mm}:{ss}</p>
          )}
        </div>

        {accepted ? (
          <div className="flex items-center justify-center gap-3 px-5 pb-5 pt-2">
            <button
              onClick={() => setMuted((m) => !m)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                muted ? 'bg-white/10 text-white/70' : 'bg-white text-navy'
              }`}
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setVideo((v) => !v)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                video ? 'bg-white text-navy' : 'bg-white/10 text-white/70'
              }`}
              title={video ? 'Stop video' : 'Start video'}
            >
              {video ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
            <button
              onClick={onDismiss}
              className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center"
              title="End call"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-6 px-5 pb-5 pt-2">
            <button
              onClick={onDismiss}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center"
              title="Decline"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <button
              onClick={() => {
                setAccepted(true);
                setMuted(true);
              }}
              className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center"
              title="Accept (muted)"
            >
              <Phone className="w-6 h-6" />
            </button>
          </div>
        )}

        <div className="bg-black/40 px-5 py-2 text-center">
          <p className="text-[9px] font-mono text-white/30 tracking-wider">
            CIRCUITUS SECURE VOICE · END-TO-END ENCRYPTED
          </p>
        </div>
      </div>
    </div>
  );
}
