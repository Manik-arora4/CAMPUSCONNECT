#!/usr/bin/env node
// Build script: Bundle the server into a single file for Vercel deployment
// Uses esbuild to create a self-contained serverless function

import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

console.log('🔨 Bundling server for Vercel deployment...');

await build({
  entryPoints: [path.join(rootDir, 'api', 'index.mjs')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: path.join(rootDir, 'api', '_index.mjs'),
  external: ['@prisma/client', 'prisma', '@prisma/engines'],
  banner: {
    js: `
// Polyfill import.meta.url for bundled modules
if (typeof globalThis.__bundledImportMeta === 'undefined') {
  globalThis.__bundledImportMeta = { url: import.meta.url };
}
`
  },
  define: {
    'import.meta.url': 'import.meta.url',
  },
  sourcemap: false,
  minify: false,
  metafile: true,
  logLevel: 'info',
});

console.log('✅ Bundle created at api/_index.mjs');
