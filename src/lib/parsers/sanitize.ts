/** Shared sanitization utilities for document parsers. */

const DANGEROUS_TAGS = /(<\/?)(script|iframe|object|embed|form|base|meta|link)(\s[^>]*)?\/?>/gi;
const EVENT_HANDLERS = /\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_URLS = /(href|src|action)\s*=\s*"javascript:[^"]*"/gi;
const JS_URLS_SINGLE = /(href|src|action)\s*=\s*'javascript:[^']*'/gi;

/**
 * Strip dangerous tags, event handler attributes, and javascript: URLs
 * from HTML content. Designed for sanitizing parsed EPUB body content
 * before rendering with dangerouslySetInnerHTML.
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(DANGEROUS_TAGS, '')
    .replace(EVENT_HANDLERS, '')
    .replace(JS_URLS, '$1=""')
    .replace(JS_URLS_SINGLE, "$1=''");
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
