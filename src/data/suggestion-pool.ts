/**
 * Pool of plausible search suggestions and "Recent / Suggested" pretexts
 * shown beneath search results. Drawn from a varied set so a screenshare
 * observer doesn't see the same two strings forever.
 */

const RECENT_SEEDS: ReadonlyArray<string> = [
  'vendor indemnification clause review',
  'force majeure in SaaS agreements',
  'mutual NDA negotiation checklist',
  'limitation of liability carve-outs',
  'data processing addendum redline',
  'change order procedure under MSA',
  'open-source software audit',
  'technology IP carve-out drafting',
  'CCPA service-provider terms',
  'export control flow-down clauses',
  'cross-border data transfer SCCs',
  'shrink-wrap enforceability California',
  'AI vendor liability allocation',
  'confidentiality term length analysis',
  'transition assistance clause',
];

const SUGGESTED_SEEDS: ReadonlyArray<string> = [
  'force majeure in SaaS agreements',
  'audit rights in vendor contracts',
  'IP assignment language under § 2870',
  'consequential damages waivers',
  'CPRA enforcement trends 2026',
  'incident response contract terms',
  'work-for-hire vs. assignment',
  'unconscionability analysis Armendariz',
  'employee non-solicit enforceability',
  'cure-period boilerplate review',
  'most-favored-customer pricing',
  'source-code escrow triggers',
  'integration clause practical effect',
  'survival clause drafting',
  'governing-law selection considerations',
];

function pickN<T>(arr: ReadonlyArray<T>, n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

export interface SuggestionLine {
  label: string;
}

/**
 * Returns a freshly-shuffled pair of "Recent" / "Suggested" lines,
 * optionally biased by the user's current query so adjacent lines feel
 * topically related.
 */
export function pickSuggestions(query: string): SuggestionLine[] {
  const q = query.toLowerCase();
  const matches = (seed: string) => {
    const tokens = q.split(/\s+/).filter((t) => t.length >= 4);
    return tokens.some((t) => seed.toLowerCase().includes(t));
  };

  const recentBiased = RECENT_SEEDS.filter(matches);
  const suggestedBiased = SUGGESTED_SEEDS.filter(matches);

  const recent = recentBiased.length > 0 ? pickN(recentBiased, 1)[0] : pickN(RECENT_SEEDS, 1)[0];
  const suggested =
    suggestedBiased.length > 0 ? pickN(suggestedBiased, 1)[0] : pickN(SUGGESTED_SEEDS, 1)[0];

  return [
    { label: `Recent: ${recent}` },
    { label: `Suggested: ${suggested}` },
  ];
}
