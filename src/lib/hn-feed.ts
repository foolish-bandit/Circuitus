/**
 * Hacker News Algolia front-page feed. Public, CORS-friendly, no auth.
 * Surfaced under the "Authorities" tab as advance-sheet entries.
 */

export interface FeedStory {
  id: string;
  title: string;
  url: string | null;
  hnUrl: string;
  author: string;
  domain: string | null;
  points: number;
  numComments: number;
  createdAt: string; // ISO
}

const ALGOLIA = 'https://hn.algolia.com/api/v1';

interface AlgoliaHit {
  objectID: string;
  title: string | null;
  story_title?: string | null;
  url: string | null;
  story_url?: string | null;
  author: string;
  points: number | null;
  num_comments: number | null;
  created_at: string;
}

function hostnameOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export async function fetchFrontPage(tag: 'front_page' | 'story' | 'show_hn' | 'ask_hn'): Promise<FeedStory[]> {
  const url = `${ALGOLIA}/search?tags=${tag}&hitsPerPage=30`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HN fetch failed: ${res.status}`);
  const data = (await res.json()) as { hits: AlgoliaHit[] };
  return data.hits
    .filter((h) => (h.title || h.story_title))
    .map((h) => {
      const linkUrl = h.url || h.story_url || null;
      return {
        id: h.objectID,
        title: h.title || h.story_title || '(untitled)',
        url: linkUrl,
        hnUrl: `https://news.ycombinator.com/item?id=${h.objectID}`,
        author: h.author,
        domain: hostnameOf(linkUrl),
        points: h.points ?? 0,
        numComments: h.num_comments ?? 0,
        createdAt: h.created_at,
      };
    });
}
