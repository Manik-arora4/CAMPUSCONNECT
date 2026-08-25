// Lazy-init PrismaClient — dynamic import so esbuild doesn't hoist it.
// This lets the module load even when @prisma/client isn't generated yet.

let _prisma;

async function createClient() {
  // Dynamic import — works in ESM modules
  const mod = await import('@prisma/client');
  const PrismaClient = mod.PrismaClient;
  return new PrismaClient();
}

// Sync fallback using createRequire for top-level calls
import { createRequire } from 'module';
const require_ = createRequire(import.meta.url);

function createClientSync() {
  const { PrismaClient } = require_('@prisma/client');
  return new PrismaClient();
}

export function getPrisma() {
  if (!_prisma) {
    _prisma = createClientSync();
  }
  return _prisma;
}

// Backwards compat: existing code imports `prisma` as a named export.
export const prisma = new Proxy({}, {
  get(_, prop) {
    return getPrisma()[prop];
  }
});
