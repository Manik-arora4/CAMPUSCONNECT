import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: Number(process.env.PORT || 5000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'super-secret-campusconnect-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  DATABASE_URL: process.env.DATABASE_URL || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  NVIDIA_API_KEY: process.env.NVIDIA_API_KEY || '',
  OLLAMA_URL: process.env.OLLAMA_URL || 'http://localhost:11434',
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'llama3.2:1b',
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || '',
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || '',
  VAPID_EMAIL: process.env.VAPID_EMAIL || 'mailto:campusconnect.ia@gmail.com',
  PUBLIC_URL: process.env.PUBLIC_URL || 'http://localhost:5173',
  DEMO_ADMINS: (process.env.DEMO_ADMINS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
};

export const isGeminiEnabled = () => Boolean(env.GEMINI_API_KEY);
export const isGroqEnabled = () => Boolean(env.GROQ_API_KEY);
export const isNvidiaEnabled = () => Boolean(env.NVIDIA_API_KEY);
export const aiProvider = () =>
  env.NVIDIA_API_KEY ? 'nvidia (Llama 3.1 8B)' :
  env.GEMINI_API_KEY ? 'gemini' :
  env.GROQ_API_KEY ? 'groq' : 'ollama';
