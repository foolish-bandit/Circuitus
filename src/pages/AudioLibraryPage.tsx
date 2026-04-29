import { useEffect, useMemo, useRef, useState } from 'react';
import { Headphones, Play, Pause, Plus, Trash2, Link as LinkIcon, Upload } from 'lucide-react';
import { deleteTrack, getAllTracks, saveTrack } from '@/lib/storage';
import type { AudioTrack } from '@/types';

const PRESENTERS: ReadonlyArray<string> = [
  'Hon. Margaret Chen, J.D.',
  'Daniel R. Holloway, Esq.',
  'Prof. Aiden Vasquez',
  'James Whitfield, J.D., LL.M.',
  'Sara Bensoussan, Of Counsel',
  'Robert F. Castellan, Esq.',
  'Hon. Patricia Linwood (ret.)',
  'Olivia Marchetti, J.D.',
];

function pickPresenter(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PRESENTERS[h % PRESENTERS.length];
}

function formatDuration(s: number): string {
  if (!Number.isFinite(s) || s <= 0) return '—';
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}:${String(m % 60).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }
  return `${m}:${String(ss).padStart(2, '0')}`;
}

/** Restrict media URLs to safe protocols. Returns null for anything else. */
function safeMediaUrl(input: string): string | null {
  try {
    const u = new URL(input);
    if (u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'blob:') {
      return u.toString();
    }
    return null;
  } catch {
    return null;
  }
}

async function probeDuration(src: string): Promise<number> {
  const safe = safeMediaUrl(src);
  if (!safe) return 0;
  return new Promise((resolve) => {
    const a = document.createElement('audio');
    a.preload = 'metadata';
    a.src = safe;
    a.onloadedmetadata = () => resolve(a.duration || 0);
    a.onerror = () => resolve(0);
  });
}

export default function AudioLibraryPage() {
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [blobUrls, setBlobUrls] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [showImport, setShowImport] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    void getAllTracks().then(setTracks);
  }, []);

  // Maintain blob URLs for any track whose source is a blob.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- URL.createObjectURL is a real side-effect; the matching revoke is in cleanup
    setBlobUrls((prev) => {
      const next = { ...prev };
      let mutated = false;
      for (const t of tracks) {
        if (t.source.kind === 'blob' && !next[t.id]) {
          next[t.id] = URL.createObjectURL(t.source.blob);
          mutated = true;
        }
      }
      // Revoke URLs for tracks that disappeared.
      const ids = new Set(tracks.map((t) => t.id));
      for (const id of Object.keys(next)) {
        if (!ids.has(id)) {
          URL.revokeObjectURL(next[id]);
          delete next[id];
          mutated = true;
        }
      }
      return mutated ? next : prev;
    });
  }, [tracks]);

  useEffect(() => {
    const snapshot = blobUrls;
    return () => {
      for (const url of Object.values(snapshot)) URL.revokeObjectURL(url);
    };
    // We intentionally only want this to capture the latest map at unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = useMemo(() => tracks.find((t) => t.id === activeId) ?? null, [tracks, activeId]);
  const activeSrc =
    active === null
      ? null
      : active.source.kind === 'url'
        ? active.source.url
        : (blobUrls[active.id] ?? null);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !activeSrc) return;
    a.src = activeSrc;
    if (playing) void a.play().catch(() => setPlaying(false));
  }, [activeSrc, playing]);

  function togglePlay() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      void a.play();
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const additions: AudioTrack[] = [];
    for (const file of Array.from(files)) {
      const probeUrl = URL.createObjectURL(file);
      const dur = await probeDuration(probeUrl);
      URL.revokeObjectURL(probeUrl);
      const id = crypto.randomUUID();
      const cleanTitle = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
      const track: AudioTrack = {
        id,
        title: cleanTitle || 'Untitled Recording',
        presenter: pickPresenter(id),
        source: { kind: 'blob', blob: file },
        durationSec: dur,
        addedAt: new Date().toISOString(),
      };
      additions.push(track);
      await saveTrack(track);
    }
    setTracks((prev) => [...additions, ...prev]);
    setShowImport(false);
  }

  async function handleAddUrl() {
    if (!urlInput.trim() || !titleInput.trim()) return;
    const safe = safeMediaUrl(urlInput.trim());
    if (!safe) return;
    const dur = await probeDuration(safe);
    const id = crypto.randomUUID();
    const track: AudioTrack = {
      id,
      title: titleInput,
      presenter: pickPresenter(id),
      source: { kind: 'url', url: safe },
      durationSec: dur,
      addedAt: new Date().toISOString(),
    };
    await saveTrack(track);
    setTracks((prev) => [track, ...prev]);
    setUrlInput('');
    setTitleInput('');
    setShowImport(false);
  }

  function handleDelete(id: string) {
    void deleteTrack(id).then(() => {
      setTracks((prev) => prev.filter((t) => t.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setPlaying(false);
      }
    });
  }

  return (
    <div className="flex-1 flex flex-col bg-cream overflow-hidden">
      <div className="border-b border-border bg-white px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-[10px] font-serif uppercase tracking-[0.2em] text-navy/60">
            CIRCUITUS CONFERENCE AUDIO LIBRARY
          </p>
          <h1 className="font-serif text-base font-bold text-navy">CLE Recordings &amp; Plenary Audio</h1>
        </div>
        <button
          onClick={() => setShowImport(true)}
          className="flex items-center gap-1.5 bg-navy text-white text-[11px] font-sans font-medium px-3 py-1.5 rounded hover:bg-navy-light transition-colors"
        >
          <Plus className="w-3 h-3" />
          Import Recording
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-4xl mx-auto">
          {tracks.length === 0 ? (
            <div className="text-center py-16">
              <Headphones className="w-12 h-12 text-border mx-auto mb-4" />
              <p className="text-sm font-sans text-text-muted max-w-sm mx-auto leading-relaxed">
                No recordings on file. Import an audio file or add a URL to a streaming source.
              </p>
              <button
                onClick={() => setShowImport(true)}
                className="mt-4 text-xs font-sans text-blue-600 hover:underline"
              >
                Import your first recording
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {tracks.map((t) => (
                <div
                  key={t.id}
                  className={`group bg-white border rounded p-4 hover:shadow-sm transition-all ${
                    activeId === t.id ? 'border-gold' : 'border-border hover:border-gold/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => {
                        setActiveId(t.id);
                        setPlaying(true);
                      }}
                      className="w-10 h-10 rounded-full bg-navy text-gold flex items-center justify-center flex-shrink-0 hover:bg-navy-light"
                    >
                      {activeId === t.id && playing ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-sm font-bold text-navy leading-tight truncate">
                        {t.title}
                      </p>
                      <p className="text-[11px] font-sans text-text-muted truncate">
                        {t.presenter}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-text-muted/70">
                        <span>{formatDuration(t.durationSec)}</span>
                        <span>{t.source.kind === 'url' ? 'Streaming' : 'On Device'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-red-600"
                      title="Remove from library"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Player bar */}
      {active && (
        <div className="border-t border-border bg-white px-6 py-2 flex items-center gap-4 flex-shrink-0">
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-navy text-gold flex items-center justify-center hover:bg-navy-light"
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-serif text-sm text-navy truncate">{active.title}</p>
            <p className="text-[10px] font-sans text-text-muted truncate">{active.presenter}</p>
          </div>
          <span className="text-[10px] font-mono text-text-muted">
            {formatDuration(time)} / {formatDuration(active.durationSec)}
          </span>
          <audio
            ref={audioRef}
            onTimeUpdate={(e) => setTime((e.target as HTMLAudioElement).currentTime)}
            onEnded={() => setPlaying(false)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
        </div>
      )}

      {showImport && (
        <div className="absolute inset-0 z-30 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="font-serif text-navy text-lg font-bold mb-4">Import CLE Recording</h3>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 bg-navy text-white font-sans text-xs uppercase tracking-wider py-3 rounded hover:bg-navy-light"
            >
              <Upload className="w-3.5 h-3.5" />
              Select Audio File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            <div className="my-4 flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] font-sans uppercase tracking-wider text-text-muted">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="Recording title"
                className="w-full px-3 py-2 text-sm font-sans border border-border rounded focus:outline-none focus:border-gold/50"
              />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Audio URL (https://…/episode.mp3)"
                className="w-full px-3 py-2 text-xs font-mono border border-border rounded focus:outline-none focus:border-gold/50"
              />
              <button
                onClick={handleAddUrl}
                disabled={!urlInput.trim() || !titleInput.trim()}
                className="w-full flex items-center justify-center gap-2 border border-navy text-navy text-xs uppercase tracking-wider py-2 rounded hover:bg-navy hover:text-white disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-navy"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                Add Streaming Source
              </button>
            </div>

            <button
              onClick={() => setShowImport(false)}
              className="mt-4 w-full text-[10px] font-sans uppercase tracking-wider text-text-muted hover:text-navy"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
