/* ═══════════════════════════════════════════════════════════════
   GROQ AI — Fast LLM Provider (OpenAI-compatible)
   ═══════════════════════════════════════════════════════════════
   • Uses Groq's ultra-fast inference API
   • Compatible with the same interface as geminiCall
   • Models: llama-3.3-70b-versatile (primary), llama-3.1-8b-instant (fallback)
   ═══════════════════════════════════════════════════════════════ */

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
];

const MAX_RETRIES = 3;

/**
 * Call Groq API with automatic retry.
 *
 * @param {string} sys - System instruction
 * @param {string} msg - User message
 * @param {Array} imgs - Image parts [{inline_data:{mime_type, data}}] — Groq vision support
 * @param {Object|null} schema - Response schema (used for JSON mode hint)
 * @param {Function|null} onStatus - Callback for live status text
 * @param {Object} opts - Extra options: { temperature, maxOutputTokens }
 * @returns {Object} Parsed JSON response
 */
export async function groqCall(sys, msg, imgs = [], schema = null, onStatus = null, opts = {}) {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  if (!key) throw new Error("Missing VITE_GROQ_API_KEY");

  // Build messages array
  const messages = [
    { role: "system", content: sys },
  ];

  // If there are images, use vision-capable content format
  if (imgs.length > 0) {
    const content = [];
    // Add images first
    imgs.forEach(img => {
      if (img.inline_data) {
        content.push({
          type: "image_url",
          image_url: {
            url: `data:${img.inline_data.mime_type};base64,${img.inline_data.data}`
          }
        });
      }
    });
    // Then add text
    content.push({ type: "text", text: msg });
    messages.push({ role: "user", content });
  } else {
    messages.push({ role: "user", content: msg });
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // Use vision model if images are present, otherwise use text model
    const model = imgs.length > 0
      ? "llama-3.3-70b-versatile"   // Vision-capable
      : GROQ_MODELS[Math.min(attempt, GROQ_MODELS.length - 1)];

    if (onStatus && attempt > 0) onStatus("Connecting to AI…");

    let res;
    try {
      res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: opts.temperature ?? 0.5,
          max_tokens: opts.maxOutputTokens ?? 2048,
          response_format: { type: "json_object" },
        }),
      });
    } catch {
      // Network error — wait briefly and retry
      if (onStatus) onStatus(`Retrying… (${attempt + 1}/${MAX_RETRIES})`);
      await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      continue;
    }

    // ── Rate-limited ──
    if (res.status === 429 || res.status === 503) {
      console.warn(`[groq] ${model} rate-limited (attempt ${attempt + 1})`);
      const retryAfter = res.headers.get("retry-after");
      const waitMs = retryAfter ? parseFloat(retryAfter) * 1000 : 5000 * (attempt + 1);

      if (onStatus) {
        const secs = Math.ceil(waitMs / 1000);
        onStatus(`AI is busy… retrying in ${secs}s`);
      }
      await new Promise(r => setTimeout(r, waitMs));
      continue;
    }

    // ── Parse response ──
    let d;
    try {
      d = await res.json();
    } catch {
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }

    // ── API error in body ──
    if (d.error) {
      console.error("[groq] API Error:", d.error);
      if (d.error.code === "rate_limit_exceeded" && attempt < MAX_RETRIES - 1) {
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }
      throw new Error(`AI error: ${d.error.message || "Please try again."}`);
    }

    // ── Extract JSON ──
    let raw = d.choices?.[0]?.message?.content || "";
    // Try to extract JSON object from the response
    const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
    if (s !== -1 && e !== -1) raw = raw.slice(s, e + 1);
    try {
      onStatus?.(null);
      return JSON.parse(raw);
    } catch {
      if (attempt < MAX_RETRIES - 1) {
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }
      throw new Error("AI returned an unexpected response. Please try again.");
    }
  }
  throw new Error("AI is temporarily unavailable. Please try again in a minute.");
}

/**
 * Fetch wrapper for Groq (compatibility with geminiFetch pattern).
 * Returns a raw Response object.
 */
export async function groqFetch(sys, msg, maxRetries = 3) {
  const key = import.meta.env.VITE_GROQ_API_KEY;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const model = GROQ_MODELS[Math.min(attempt, GROQ_MODELS.length - 1)];

    let res;
    try {
      res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: sys },
            { role: "user", content: msg },
          ],
          temperature: 0.5,
          max_tokens: 2048,
          response_format: { type: "json_object" },
        }),
      });
    } catch {
      await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      continue;
    }

    if (res.status === 429 || res.status === 503) {
      console.warn(`[groq] rate-limited in groqFetch (attempt ${attempt + 1})`);
      await new Promise(r => setTimeout(r, 5000));
      continue;
    }

    return res;
  }
  throw new Error("AI is temporarily unavailable. Please try again in a minute.");
}
