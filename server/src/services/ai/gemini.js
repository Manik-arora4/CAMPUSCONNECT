import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env.js';

let _client = null;

function client() {
  if (!env.GEMINI_API_KEY) return null;
  if (!_client) _client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  return _client;
}

const MODEL = 'gemini-flash-latest';

/**
 * Ask Gemini. Returns null when no API key is configured or the call ultimately
 * fails. Retries transient overload/rate-limit errors (503/429) with backoff —
 * the fallback service kicks in only if every attempt fails.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {{json?: boolean, temperature?: number}} opts
 */
export async function askGemini(systemPrompt, userPrompt, { json = false, temperature = 0.7 } = {}) {
  const c = client();
  if (!c) return null;
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const model = c.getGenerativeModel({
        model: MODEL,
        generationConfig: {
          temperature,
          ...(json ? { responseMimeType: 'application/json' } : {}),
        },
      });
      const result = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: 'Understood. I will follow those instructions exactly.' }] },
          { role: 'user', parts: [{ text: userPrompt }] },
        ],
      });
      const text = result.response?.text?.() || '';
      return text.trim();
    } catch (err) {
      const message = err?.message || '';
      const retriable = /503|429|500|high demand|quota|RESOURCE_EXHAUSTED|UNAVAILABLE/i.test(message);
      if (!retriable || attempt === maxAttempts) {
        console.error('[gemini] error:', message);
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }
  }
  return null;
}

export function parseJsonLoose(text) {
  if (!text) return null;
  const t = text.trim();
  try {
    return JSON.parse(t);
  } catch {
    const start = t.indexOf('{');
    const end = t.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(t.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}
