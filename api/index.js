import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure server dependencies resolve from root node_modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, '../server');

let app;

export default async function handler(req, res) {
  if (!app) {
    // Set CWD to server so env loads from server/.env
    process.chdir(serverDir);
    const mod = await import('../server/src/app.js');
    app = mod.default;
  }
  return app(req, res);
}
