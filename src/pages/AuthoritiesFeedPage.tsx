import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, MessageSquare, Star, RefreshCw } from 'lucide-react';
import { fetchFrontPage, type FeedStory } from '@/lib/hn-feed';

const FILTERS: ReadonlyArray<{ id: 'front_page' | 'story' | 'show_hn' | 'ask_hn'; label: string }> = [
  { id: 'front_page', label: 'Advance Sheets' },
  { id: 'story', label: 'New Filings' },
  { id: 'show_hn', label: 'Practice Notes' },
  { id: 'ask_hn', label: 'Open Inquiries' },
];

const PUBLISHERS = [
  'Reuters Tech',
  'Bloomberg Law',
  'ABA Journal',
  'Dispatch Daily',
  'Counsel Weekly',
  'Chambers Brief',
  'Industry Bulletin',
];

function publisherFor(id: string): string {
  // Stable per-story publisher assignment so it doesn't shuffle on every render.
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PUBLISHERS[h % PUBLISHERS.length];
}

function citationFor(story: FeedStory): string {
  const date = new Date(story.createdAt);
  const yyyy = date.getFullYear();
  const seq = String(parseInt(story.id, 10) % 99999).padStart(5, '0');
  return `${yyyy} CIR ${seq}`;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

export default function AuthoritiesFeedPage() {
  const [tag, setTag] = useState<typeof FILTERS[number]['id']>('front_page');
  const [stories, setStories] = useState<FeedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('circuitus_authority_read');
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set();
    }
  });

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tracking fetch loading state is a documented data-loading pattern
    setLoading(true);
    setError(null);
    fetchFrontPage(tag)
      .then((s) => {
        if (!cancelled) setStories(s);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load feed');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tag, reloadKey]);

  function refresh() {
    setReloadKey((k) => k + 1);
  }

  function markRead(id: string) {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem('circuitus_authority_read', JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  }

  const cards = useMemo(
    () =>
      stories.map((s) => ({
        ...s,
        publisher: publisherFor(s.id),
        citation: citationFor(s),
        isRead: readIds.has(s.id),
      })),
    [stories, readIds],
  );

  return (
    <div className="flex-1 flex flex-col bg-cream overflow-hidden">
      {/* Filter row */}
      <div className="border-b border-border bg-white px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setTag(f.id)}
              className={`px-3 py-1 text-[11px] font-sans uppercase tracking-[0.1em] rounded transition-colors ${
                tag === f.id ? 'text-navy bg-cream font-semibold' : 'text-text-muted hover:text-text-main'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-1.5 text-[10px] font-sans uppercase tracking-wider text-text-muted hover:text-navy"
          title="Refresh advance sheets"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-5 pb-4 border-b border-border text-center">
            <p className="text-[10px] font-serif uppercase tracking-[0.2em] text-navy/60 mb-1">
              CIRCUITUS DAILY AUTHORITY FEED
            </p>
            <h1 className="font-serif text-lg font-bold text-navy">
              Advance Sheets — {new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}
            </h1>
            <p className="text-[10px] font-mono text-text-muted mt-1">
              Curated industry intelligence, refreshed throughout the day.
            </p>
          </div>

          {loading && stories.length === 0 && (
            <div className="text-center py-16">
              <span className="editorial-loader mx-auto mb-3" aria-hidden />
              <p className="text-xs font-sans text-text-muted">Loading advance sheets…</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 text-xs font-sans text-red-700">
              {error}
            </div>
          )}

          {!loading && cards.length === 0 && !error && (
            <p className="text-center text-xs font-sans text-text-muted py-16">
              No entries to display.
            </p>
          )}

          <ol className="space-y-3">
            {cards.map((c, idx) => (
              <li
                key={c.id}
                className={`bg-white border border-border rounded p-4 hover:border-gold/40 hover:shadow-sm transition-all ${
                  c.isRead ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="font-mono text-[10px] text-text-muted/60 w-6 text-right pt-0.5">
                    {idx + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-sans font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-navy text-white">
                        {c.publisher}
                      </span>
                      {c.domain && (
                        <span className="text-[10px] font-mono text-text-muted/60 truncate">
                          {c.domain}
                        </span>
                      )}
                    </div>
                    <a
                      href={c.url ?? c.hnUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => markRead(c.id)}
                      className="block font-serif text-base text-navy hover:underline leading-snug"
                    >
                      {c.title}
                    </a>
                    <div className="flex items-center gap-4 mt-2 text-[10px] font-mono text-text-muted">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" /> {c.points} citations
                      </span>
                      <a
                        href={c.hnUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-navy"
                        onClick={() => markRead(c.id)}
                      >
                        <MessageSquare className="w-3 h-3" /> {c.numComments} discussions
                      </a>
                      <span>{timeAgo(c.createdAt)}</span>
                      <span className="ml-auto text-text-muted/60">{c.citation}</span>
                      {c.url && (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => markRead(c.id)}
                          className="hover:text-navy"
                          title="Open source"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
