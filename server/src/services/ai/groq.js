import Groq from 'groq-sdk';
import { env } from '../../config/env.js';

let _client = null;

function client() {
  if (!env.GROQ_API_KEY) return null;
  if (!_client) _client = new Groq({ apiKey: env.GROQ_API_KEY });
  return _client;
}

// GPT-OSS 20B — fast (1000 tps), 131K context, free tier on Groq
const MODEL = 'openai/gpt-oss-20b';

// ── Reuse the Gemini Ollama checker so we only probe once per process ──
// We import the shared checkOllamaAvailable + askOllama from gemini.js
// but to avoid circular deps we duplicate the lightweight Ollama probe here.
import { askGemini, parseJsonLoose } from './gemini.js';

/**
 * Ask Groq (Llama). Falls back to Gemini → Ollama → deterministic fallbacks.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {{json?: boolean, temperature?: number}} opts
 */
let _quotaLogged = false;

export async function askGroq(systemPrompt, userPrompt, { json = false, temperature = 0.7 } = {}) {
  const c = client();
  if (!c) {
    // No Groq key → fall through to Gemini → Ollama → deterministic fallbacks
    return askGemini(systemPrompt, userPrompt, { temperature, json });
  }

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      const params = {
        model: MODEL,
        messages,
        temperature,
        max_tokens: json ? 1024 : 512,
      };

      if (json) {
        // GPT-OSS models support JSON mode
        params.response_format = { type: 'json_object' };
      }

      const completion = await c.chat.completions.create(params);
      const text = completion.choices?.[0]?.message?.content || '';
      _quotaLogged = false;
      return text.trim();
    } catch (err) {
      const message = err?.message || '';
      // Rate limit / quota — fall through to Gemini
      if (/rate_limit|429|quota|RESOURCE_EXHAUSTED/i.test(message)) {
        if (!_quotaLogged) {
          console.warn('[groq] rate limited / quota hit — falling back to Gemini');
          _quotaLogged = true;
        }
        return askGemini(systemPrompt, userPrompt, { temperature, json });
      }
      const retriable = /503|500|UNAVAILABLE|ECONNREFUSED/i.test(message);
      if (!retriable || attempt === maxAttempts) {
        if (attempt === maxAttempts) console.warn('[groq] all', maxAttempts, 'attempts failed — falling back to Gemini');
        return askGemini(systemPrompt, userPrompt, { temperature, json });
      }
      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  // All attempts failed — fall through to Gemini
  return askGemini(systemPrompt, userPrompt, { temperature, json });
}
