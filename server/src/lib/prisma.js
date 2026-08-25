// Lazy-init PrismaClient — dynamic import so esbuild doesn't hoist it.
// This lets the module load even when @prisma/client isn't generated yet.

let _prisma;

function createClientSync() {
  try {
    // CJS require — works in bundled CJS output and Node.js CJS modules
    const { PrismaClient } = require('@prisma/client');
    return new PrismaClient();
  } catch (err) {
    console.warn('[prisma] Could not init PrismaClient:', err.message);
    return null;
  }
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
    const client = getPrisma();
    return client ? client[prop] : undefined;
  }
});
