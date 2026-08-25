import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Resolve uploads directory — works in both local and serverless (Vercel) environments
let uploadsDir;
try {
  // ESM path: use import.meta.url
  const { fileURLToPath } = require('url');
  const __filename = fileURLToPath(import.meta.url);
  uploadsDir = path.resolve(path.dirname(__filename), '../../uploads');
} catch {
  // CJS bundle or serverless fallback
  uploadsDir = '/tmp/cc-uploads';
}
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safe}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/') || file.mimetype.includes('text') || file.mimetype.includes('document')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, image and document uploads are allowed'));
    }
  },
});

export const uploadsDirPath = uploadsDir;

export function fileUrl(req, filename) {
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
}
