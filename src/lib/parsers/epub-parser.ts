import JSZip from 'jszip';
import type { ParsedDocument, DocumentChapter } from '@/types';

export async function parseEpub(file: File): Promise<ParsedDocument> {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  // 1. Find the OPF file path from container.xml
  const containerXml = await zip.file('META-INF/container.xml')?.async('text');
  if (!containerXml) throw new Error('Invalid EPUB: missing container.xml');

  const opfPathMatch = containerXml.match(/full-path="([^"]+)"/);
  if (!opfPathMatch) throw new Error('Invalid EPUB: cannot find OPF path');
  const opfPath = opfPathMatch[1];
  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

  // 2. Parse the OPF
  const opfContent = await zip.file(opfPath)?.async('text');
  if (!opfContent) throw new Error('Invalid EPUB: cannot read OPF file');

  // Extract metadata
  const titleMatch = opfContent.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
  const authorMatch = opfContent.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i);
  const title = titleMatch?.[1] || file.name.replace(/\.epub$/i, '');
  const author = authorMatch?.[1] || 'Unknown Author';

  // Extract manifest (id -> href mapping)
  const manifest = new Map<string, string>();
  const manifestRegex = /<item\s+[^>]*id="([^"]+)"[^>]*href="([^"]+)"[^>]*>/gi;
  let match;
  while ((match = manifestRegex.exec(opfContent)) !== null) {
    manifest.set(match[1], match[2]);
  }
  // Also catch reversed attribute order
  const manifestRegex2 = /<item\s+[^>]*href="([^"]+)"[^>]*id="([^"]+)"[^>]*>/gi;
  while ((match = manifestRegex2.exec(opfContent)) !== null) {
    manifest.set(match[2], match[1]);
  }

  // Extract spine (reading order)
  const spineRegex = /<itemref\s+idref="([^"]+)"[^/]*\/?>/gi;
  const spineIds: string[] = [];
  while ((match = spineRegex.exec(opfContent)) !== null) {
    spineIds.push(match[1]);
  }

  // 3. Read each spine item
  const chapters: DocumentChapter[] = [];
  for (let i = 0; i < spineIds.length; i++) {
    const href = manifest.get(spineIds[i]);
    if (!href) continue;

    const filePath = opfDir + decodeURIComponent(href);
    const content = await zip.file(filePath)?.async('text');
    if (!content) continue;

    // Extract body content
    let bodyContent = content;
    const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      bodyContent = bodyMatch[1];
    }

    // Strip script and style tags
    bodyContent = bodyContent
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/\s*style="[^"]*"/gi, '')
      .replace(/\s*class="[^"]*"/gi, '');

    // Try to extract a title from the content
    const titleFromContent =
      bodyContent.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/i)?.[1] ||
      `Section ${i + 1}`;

    // Resolve images to base64
    bodyContent = await resolveImages(bodyContent, zip, opfDir);

    if (bodyContent.trim()) {
      chapters.push({
        id: crypto.randomUUID(),
        title: titleFromContent.trim(),
        content: bodyContent.trim(),
      });
    }
  }

  if (chapters.length === 0) {
    throw new Error('Unable to extract content from EPUB. The file may be corrupted or DRM-protected.');
  }

  return { title, author, chapters };
}

async function resolveImages(html: string, zip: JSZip, baseDir: string): Promise<string> {
  const imgRegex = /<img\s+[^>]*src="([^"]+)"[^>]*>/gi;
  const replacements: [string, string][] = [];

  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    if (src.startsWith('data:')) continue;

    const imgPath = baseDir + decodeURIComponent(src);
    try {
      const imgData = await zip.file(imgPath)?.async('base64');
      if (imgData) {
        const ext = src.split('.').pop()?.toLowerCase() || 'png';
        const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
          : ext === 'png' ? 'image/png'
          : ext === 'gif' ? 'image/gif'
          : ext === 'svg' ? 'image/svg+xml'
          : 'image/png';
        replacements.push([src, `data:${mime};base64,${imgData}`]);
      }
    } catch {
      // Skip unresolvable images
    }
  }

  let result = html;
  for (const [original, replacement] of replacements) {
    result = result.replaceAll(original, replacement);
  }
  return result;
}
