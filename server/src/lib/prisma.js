// PrismaClient singleton — works in both local Node.js and Vercel serverless
// Uses runtime require so the engine binary resolution happens via
// the @prisma/client package installed in api/node_modules at deploy time.

let _prisma;

function createClient() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient } = require('@prisma/client');
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
