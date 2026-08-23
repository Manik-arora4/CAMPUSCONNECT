/**
 * NVIDIA AI Service — DeepSeek V4 Flash (OpenAI-compatible endpoint)
 * Base URL: https://integrate.api.nvidia.com/v1
 * Model: deepseek-ai/deepseek-v4-flash-0731
 *
 * Falls back to Gemini → Groq → Ollama → deterministic fallbacks
 */

import { env } from '../../config/env.js';

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
// Meta Llama 3.1 8B — fast, reliable, free tier on NVIDIA NIM
// DeepSeek V4 Flash excluded: cold-start >60s, unreliable on free tier
const MODEL = 'meta/llama-3.1-8b-instruct';

let _quotaUntil = 0;
let _quotaLogged = false;
const NVIDIA_TIMEOUT_MS = 30000; // 30s per attempt

/**
 * Ask NVIDIA (Meta Llama 3.1 8B) via OpenAI-compatible chat completions API.
 * Uses native fetch — no extra SDK needed.
 * Falls back to Gemini → Groq → Ollama → deterministic fallbacks.
 */
export async function askNvidia(systemPrompt, userPrompt, { json = false, temperature = 0.7 } = {}) {
  // Import askGemini here to avoid circular deps
  const { askGemini } = await import('./gemini.js');

  if (!env.NVIDIA_API_KEY) {
    return askGemini(systemPrompt, userPrompt, { temperature, json });
  }

  // Cooldown after rate limit
  if (_quotaUntil && Date.now() < _quotaUntil) {
    return askGemini(systemPrompt, userPrompt, { temperature, json });
  }

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const body = {
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: json ? 2048 : 1024,
      };

      // DeepSeek supports response_format for JSON mode
      if (json) {
        body.response_format = { type: 'json_object' };
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), NVIDIA_TIMEOUT_MS);
      let res;
      try {
        res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.NVIDIA_API_KEY}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => '');

        // Rate limit / quota
        if (res.status === 429 || /rate.?limit|quota|RESOURCE_EXHAUSTED/i.test(errText)) {
          if (!_quotaLogged) {
            console.warn('[nvidia] rate limited / quota hit — cooldown 60s, falling back to Gemini');
            _quotaLogged = true;
          }
          _quotaUntil = Date.now() + 60_000;
          return askGemini(systemPrompt, userPrompt, { temperature, json });
        }

        // Server errors — retry
        if (res.status >= 500 && attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
          continue;
        }

        console.warn(`[nvidia] HTTP ${res.status}: ${errText.slice(0, 200)}`);
        if (attempt === maxAttempts) {
          return askGemini(systemPrompt, userPrompt, { temperature, json });
        }
      }

      const data = await res.json();
      const text = (data.choices?.[0]?.message?.content || '').trim();

      if (text) {
        _quotaLogged = false;
        _quotaUntil = 0;
        console.log(`[nvidia] responded via ${MODEL} (${text.length} chars)`);
        return text;
      }

      // Empty response — retry
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }
      return askGemini(systemPrompt, userPrompt, { temperature, json });
    } catch (err) {
      const msg = err?.message || '';
      const isAbort = err?.name === 'AbortError';
      const retriable = /503|500|ECONNREFUSED|ETIMEDOUT|fetch failed/i.test(msg) || isAbort;

      if (isAbort) {
        if (attempt === maxAttempts) {
          console.warn(`[nvidia] ${MODEL} timed out after ${maxAttempts} attempts — falling back to Gemini`);
          return askGemini(systemPrompt, userPrompt, { temperature, json });
        }
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }

      if (retriable && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }

      if (attempt === maxAttempts) {
        console.warn(`[nvidia] all ${maxAttempts} attempts failed (${msg}) — falling back to Gemini`);
        return askGemini(systemPrompt, userPrompt, { temperature, json });
      }
    }
  }

  // All attempts failed
  return askGemini(systemPrompt, userPrompt, { temperature, json });
}
