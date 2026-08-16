import mongoose from 'mongoose';
import { env } from './env.js';

let memoryServer = null;

export async function connectDB() {
  // 1) Explicit connection string from env
  if (env.MONGODB_URI) {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    console.log(`[db] Connected to MongoDB at ${maskUri(env.MONGODB_URI)}`);
    return { ephemeral: false };
  }

  // 2) Local MongoDB if running
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/campusconnect', { serverSelectionTimeoutMS: 2500 });
    console.log('[db] Connected to local MongoDB at mongodb://127.0.0.1:27017/campusconnect');
    return { ephemeral: false };
  } catch {
    /* fall through to ephemeral */
  }

  // 3) Ephemeral demo database (downloads a mongod binary on first run)
  console.log('[db] No MongoDB found — starting ephemeral demo database (first run downloads mongod, please wait)...');
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create({ instance: { storageEngine: 'wiredTiger' } });
  const uri = memoryServer.getUri();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 30000 });
  console.log(`[db] Ephemeral MongoDB running at ${uri} (demo mode — data resets on restart)`);
  return { ephemeral: true };
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}

export function maskUri(uri) {
  try {
    const u = new URL(uri);
    if (u.password) u.password = '***';
    return u.toString();
  } catch {
    return uri;
  }
}
