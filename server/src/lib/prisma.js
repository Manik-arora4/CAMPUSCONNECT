// Lazy-init PrismaClient — dynamic require so esbuild doesn't hoist it.
// This lets the module load even when @prisma/client isn't generated yet.

let _prisma;

function createClient() {
  // Dynamic require — esbuild will NOT hoist this
  // eslint-disable-next-line
  const { PrismaClient } = require('@prisma/client');
  return new PrismaClient();
}

export function getPrisma() {
  if (!_prisma) {
    _prisma = createClient();
  }
  return _prisma;
}

// Backwards compat: existing code imports `prisma` as a named export.
export const prisma = new Proxy({}, {
  get(_, prop) {
    return getPrisma()[prop];
  }
});
