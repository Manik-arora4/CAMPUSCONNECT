// PrismaClient singleton — works in both local Node.js and Vercel serverless
//
// In native ESM: use createRequire(import.meta.url) for correct engine resolution.
// In CJS bundle (esbuild): import.meta.url is undefined, so we fall back to
// the global require() which is available in CJS context.

import { createRequire } from 'node:module';

let _prisma;

function createClient() {
  try {
    let req;
    try {
      // Native ESM: createRequire with import.meta.url works
      req = createRequire(import.meta.url);
    } catch {
      // CJS bundle: import.meta.url is undefined, fall back to global require
      // eslint-disable-next-line no-undef
      if (typeof require !== 'undefined') req = require;
    }
    if (!req) throw new Error('Cannot resolve require function');
    const { PrismaClient } = req('@prisma/client');
    return new PrismaClient({
      log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
    });
  } catch (err) {
    console.warn('[prisma] Failed to create client:', err.message);
    return null;
  }
}

export function getPrisma() {
  if (!_prisma) _prisma = createClient();
  return _prisma;
}

// Backwards compat: existing code imports `prisma` as a named export.
export const prisma = new Proxy({}, {
  get(_, prop) {
    const client = getPrisma();
    if (!client) throw new Error('Prisma client not available');
    return client[prop];
  },
});
