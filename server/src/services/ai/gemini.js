import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env.js';

let _client = null;

function client() {
  if (!env.GEMINI_API_KEY) return null;
  if (!_client) _client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  return _client;
}

const MODEL = 'gemini-1.5-flash';

/**
 * Ask Gemini. Returns null when no API key is configured or the call fails.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {{json?: boolean, temperature?: number}} opts
 */
export async function askGemini(systemPrompt, userPrompt, { json = false, temperature = 0.7 } = {}) {
  const c = client();
  if (!c) return null;
  try {
    const model = c.getGenerativeModel({
      model: MODEL,
      generationConfig: {
        temperature,
        ...(json ? { responseMimeType: 'application/json' } : {}),
      },
    });
    const result = await model.generateContent([
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Understood. I will follow those instructions exactly.' }] },
      { role: 'user', parts: [{ text: userPrompt }] },
    ]);
    const text = result.response?.text?.() || '';
    return text.trim();
  } catch (err) {
    console.error('[gemini] error:', err.message);
    return null;
  }
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
