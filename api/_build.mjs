import { build } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

console.log('🔨 Building Vercel serverless bundle...');

await build({
  entryPoints: [path.join(root, 'server', 'src', 'app.js')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: path.join(root, 'api', '_app.cjs'),
  external: ['@prisma/client', 'prisma', '@prisma/engines'],
  banner: {
    js: `const __bundled_meta_url = require('url').pathToFileURL(__filename).href;`
  },
  define: {
    'import.meta.url': '__bundled_meta_url'
  },
  sourcemap: false,
  minify: false,
  logLevel: 'info',
  allowOverwrite: true,
});

const entryContent = `// Vercel Serverless Function — auto-generated bundle
const app = require('./_app.cjs');
module.exports = async function handler(req, res) {
  return app(req, res);
};
`;
fs.writeFileSync(path.join(root, 'api', 'index.js'), entryContent);
console.log('✅ Bundle created successfully');
