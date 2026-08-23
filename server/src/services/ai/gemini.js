import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env.js';

let _client = null;

function client() {
  if (!env.GEMINI_API_KEY) return null;
  if (!_client) _client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  return _client;
}

const MODEL = 'gemini-3.6-flash';

const OLLAMA_URL = env.OLLAMA_URL;
const OLLAMA_MODEL = env.OLLAMA_MODEL;

// ── Ollama availability cache ──
// Probe once, then cache the result so subsequent calls skip the 25s timeout.
let _ollamaAvailable = null; // null = not checked, true/false = cached
const OLLAMA_CHECK_TIMEOUT_MS = 3000; // quick probe

async function checkOllamaAvailable() {
  if (_ollamaAvailable !== null) return _ollamaAvailable;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OLLAMA_CHECK_TIMEOUT_MS);
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: controller.signal });
    clearTimeout(timer);
    _ollamaAvailable = res.ok;
    if (_ollamaAvailable) console.log('[ollama] detected — AI will use local model as fallback');
    else console.log('[ollama] not available — AI will use offline deterministic fallbacks');
  } catch {
    _ollamaAvailable = false;
    console.log('[ollama] not running — AI will use offline deterministic fallbacks');
  }
  return _ollamaAvailable;
}

/**
 * Ask local Ollama (free, no quota). Returns null on any failure so the
 * deterministic fallbacks can kick in as a last resort.
 */
const OLLAMA_TIMEOUT_MS = 25000; // long generations fall back to deterministic planners
const OLLAMA_NUM_CTX = 1024; // small model + small context = fast local inference
const OLLAMA_MAX_PROMPT_CHARS = 2200; // keep only the most relevant context for the local model

async function askOllama(systemPrompt, userPrompt, { temperature = 0.7, json = false } = {}) {
  // Fast path: if we already know Ollama isn't running, don't waste 25s waiting
  if (_ollamaAvailable === false) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);
  // The app context JSON can be several thousand chars; the 1B local model can't
  // use all of it anyway, so trim to the leading (most relevant) fields only.
  const trimmedPrompt =
    userPrompt.length > OLLAMA_MAX_PROMPT_CHARS
      ? userPrompt.slice(0, OLLAMA_MAX_PROMPT_CHARS) + '\n[context truncated for brevity]'
      : userPrompt;
  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `${systemPrompt}\n\nUser: ${trimmedPrompt}\n\nAssistant:`,
        stream: false,
        options: { temperature, num_predict: json ? 600 : 350, num_ctx: OLLAMA_NUM_CTX },
      }),
    });
    if (!res.ok) {
      _ollamaAvailable = false;
      return null;
    }
    const data = await res.json();
    return (data.response || '').trim();
  } catch (err) {
    if (err?.name === 'AbortError') {
      // Timeout likely means Ollama isn't running — cache and skip future calls
      _ollamaAvailable = false;
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Ask Gemini. Returns null when no API key is configured or the call ultimately
 * fails. Retries transient overload/rate-limit errors (503/429) with backoff —
 * the fallback service kicks in only if every attempt fails. When Gemini is
 * unavailable or quota-exhausted, falls back to local Ollama so the AI stays
 * live with real (free) responses.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {{json?: boolean, temperature?: number}} opts
 */
let _quotaLogged = false; // log quota warning only once to avoid spam

export async function askGemini(systemPrompt, userPrompt, { json = false, temperature = 0.7 } = {}) {
  const c = client();
  if (!c) {
    // No API key configured — go straight to Ollama or deterministic fallbacks
    return askOllama(systemPrompt, userPrompt, { temperature, json });
  }

  // Make sure we know whether Ollama is reachable before the first Gemini call
  await checkOllamaAvailable();

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
      _quotaLogged = false; // reset on success
      return text.trim();
    } catch (err) {
      const message = err?.message || '';
      // Daily quota is a hard cap — retrying won't help.
      if (/quota|RESOURCE_EXHAUSTED/i.test(message)) {
        if (!_quotaLogged) {
          console.warn('[gemini] quota exceeded — using offline fallbacks. Regenerate your key at https://aistudio.google.com/apikey');
          _quotaLogged = true;
        }
        // Skip Ollama if not available (already cached), go straight to null → deterministic fallbacks
        return askOllama(systemPrompt, userPrompt, { temperature, json });
      }
      const retriable = /503|429|500|high demand|UNAVAILABLE/i.test(message);
      if (!retriable || attempt === maxAttempts) {
        if (attempt === maxAttempts) console.warn('[gemini] all', maxAttempts, 'attempts failed — using offline fallback');
        return askOllama(systemPrompt, userPrompt, { temperature, json });
      }
      await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }
  }
  return askOllama(systemPrompt, userPrompt, { temperature, json });
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
