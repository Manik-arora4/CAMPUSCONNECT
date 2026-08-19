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
let _quotaUntil = 0; // timestamp until which we skip Groq (cooldown after rate limit)

export async function askGroq(systemPrompt, userPrompt, { json = false, temperature = 0.7 } = {}) {
  const c = client();
  if (!c) {
    // No Groq key → fall through to Gemini → Ollama → deterministic fallbacks
    return askGemini(systemPrompt, userPrompt, { temperature, json });
  }

  // If we recently hit a quota/rate limit, skip Groq for 60s to avoid wasting time
  if (_quotaUntil && Date.now() < _quotaUntil) {
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
        max_tokens: json ? 2048 : 1024,
      };

      if (json) {
        // GPT-OSS models support JSON mode
        params.response_format = { type: 'json_object' };
      }

      const completion = await c.chat.completions.create(params);
      const text = completion.choices?.[0]?.message?.content || '';
      _quotaLogged = false;
      _quotaUntil = 0;
      return text.trim();
    } catch (err) {
      const message = err?.message || '';
      // Rate limit / quota — set cooldown then fall through to Gemini
      if (/rate_limit|429|quota|RESOURCE_EXHAUSTED/i.test(message)) {
        if (!_quotaLogged) {
          console.warn('[groq] rate limited / quota hit — cooldown 60s, then retry. Falling back to Gemini for now.');
          _quotaLogged = true;
        }
        _quotaUntil = Date.now() + 60_000;
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
