import type { ParsedDocument, DocumentChapter } from '@/types';

const CHAPTER_PATTERN = /^(chapter\s+\d+|part\s+\d+|section\s+\d+)/i;
const SEPARATOR_PATTERN = /^(---+|\*\*\*+|===+)$/;
const ALL_CAPS_HEADING = /^[A-Z][A-Z\s:,'-]{5,}$/;

export function parseTxt(text: string, fileName: string): ParsedDocument {
  const title = fileName.replace(/\.txt$/i, '');
  const lines = text.split('\n');

  // Try to detect chapter breaks
  const breakpoints: { index: number; title: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (CHAPTER_PATTERN.test(line)) {
      breakpoints.push({ index: i, title: line });
    } else if (SEPARATOR_PATTERN.test(line)) {
      const nextLine = lines[i + 1]?.trim() || `Section ${breakpoints.length + 1}`;
      breakpoints.push({ index: i, title: nextLine });
    } else if (
      ALL_CAPS_HEADING.test(line) &&
      line.length > 5 &&
      (!lines[i - 1]?.trim() || i === 0) &&
      lines[i + 1]?.trim() === ''
    ) {
      breakpoints.push({ index: i, title: line });
    }
  }

  const chapters: DocumentChapter[] = [];

  if (breakpoints.length >= 2) {
    // Use detected breaks
    for (let i = 0; i < breakpoints.length; i++) {
      const start = breakpoints[i].index;
      const end = i + 1 < breakpoints.length ? breakpoints[i + 1].index : lines.length;
      const content = linesToHtml(lines.slice(start, end));
      if (content.trim()) {
        chapters.push({
          id: crypto.randomUUID(),
          title: breakpoints[i].title,
          content,
        });
      }
    }
  } else {
    // Split into ~3000-character chunks
    const fullText = lines.join('\n');
    const chunkSize = 3000;
    for (let i = 0; i < fullText.length; i += chunkSize) {
      // Try to break at a paragraph boundary
      let end = Math.min(i + chunkSize, fullText.length);
      if (end < fullText.length) {
        const lastBreak = fullText.lastIndexOf('\n\n', end);
        if (lastBreak > i + chunkSize / 2) end = lastBreak;
      }

      const chunk = fullText.slice(i, end);
      const chapterNum = chapters.length + 1;
      chapters.push({
        id: crypto.randomUUID(),
        title: `Section ${chapterNum}`,
        content: linesToHtml(chunk.split('\n')),
      });
    }
  }

  if (chapters.length === 0) {
    chapters.push({
      id: crypto.randomUUID(),
      title: 'Full Text',
      content: linesToHtml(lines),
    });
  }

  return { title, author: 'Unknown Author', chapters };
}

function linesToHtml(lines: string[]): string {
  const paragraphs: string[] = [];
  let current = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (current) {
        paragraphs.push(current);
        current = '';
      }
    } else {
      current = current ? current + ' ' + trimmed : trimmed;
    }
  }
  if (current) paragraphs.push(current);

  return paragraphs
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join('\n');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
