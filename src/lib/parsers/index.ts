import type { ParsedDocument } from '@/types';
import { parseEpub } from './epub-parser';
import { parsePdf } from './pdf-parser';
import { parseTxt } from './txt-parser';

export async function parseFile(file: File): Promise<ParsedDocument> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'epub':
      return parseEpub(file);
    case 'pdf':
      return parsePdf(file);
    case 'txt': {
      const text = await file.text();
      return parseTxt(text, file.name);
    }
    default:
      throw new Error(
        `Unsupported file type: .${ext}. Supported formats: EPUB 2.0/3.0, PDF, TXT.`
      );
  }
}

export type { ParsedDocument };
