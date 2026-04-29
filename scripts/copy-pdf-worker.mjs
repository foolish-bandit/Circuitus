import { existsSync, mkdirSync, copyFileSync } from 'node:fs';

const src = 'node_modules/pdfjs-dist/build/pdf.worker.min.js';
const dst = 'public/pdf.worker.min.js';

if (existsSync(src)) {
  mkdirSync('public', { recursive: true });
  copyFileSync(src, dst);
  console.log('Copied PDF.js worker');
} else {
  console.log('pdfjs-dist worker not found, skipping copy');
}
