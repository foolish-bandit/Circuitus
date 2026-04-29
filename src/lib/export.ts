import { getBookmarks, getHighlights } from '@/lib/storage';

/**
 * Render a document's highlights and bookmarks as a Markdown blob suitable
 * for pasting into an email, memo, or notes app.
 */
export async function exportAnnotationsAsMarkdown(
  documentId: string,
  documentTitle: string,
): Promise<string> {
  const [highlights, bookmarks] = await Promise.all([
    getHighlights(documentId),
    getBookmarks(documentId),
  ]);

  const lines: string[] = [];
  lines.push(`# ${documentTitle}`);
  lines.push('');
  lines.push(`*Exported from Circuitus on ${new Date().toLocaleString()}*`);
  lines.push('');

  if (highlights.length === 0 && bookmarks.length === 0) {
    lines.push('_No annotations on this document._');
    return lines.join('\n');
  }

  if (highlights.length > 0) {
    lines.push('## Highlights');
    lines.push('');
    const byChapter = new Map<number, typeof highlights>();
    for (const h of highlights) {
      const arr = byChapter.get(h.chapterIndex) ?? [];
      arr.push(h);
      byChapter.set(h.chapterIndex, arr);
    }
    const sortedChapters = [...byChapter.keys()].sort((a, b) => a - b);
    for (const ch of sortedChapters) {
      lines.push(`### § ${ch + 1}`);
      lines.push('');
      for (const h of byChapter.get(ch) ?? []) {
        lines.push(`- *${h.color}* — "${h.selectedText.replace(/\s+/g, ' ').trim()}"`);
      }
      lines.push('');
    }
  }

  if (bookmarks.length > 0) {
    lines.push('## Bookmarks');
    lines.push('');
    for (const b of bookmarks) {
      const label = b.label || (b.selectedText ? b.selectedText.slice(0, 80) : 'Untitled marker');
      lines.push(`- § ${b.chapterIndex + 1} — ${label}`);
      if (b.note) lines.push(`  > ${b.note}`);
    }
  }

  return lines.join('\n');
}

export async function copyAnnotationsToClipboard(
  documentId: string,
  documentTitle: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const md = await exportAnnotationsAsMarkdown(documentId, documentTitle);
    await navigator.clipboard.writeText(md);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Clipboard write failed' };
  }
}
