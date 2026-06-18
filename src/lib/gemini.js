/* ═══════════════════════════════════════════════════════════════
   GEMINI AI — Bulletproof Multi-Model Provider
   ═══════════════════════════════════════════════════════════════
   • Rotates between 3 Gemini models (each has its OWN free-tier quota)
   • gemini-2.5-flash  → 15-20 RPM
   • gemini-2.0-flash  → 15 RPM
   • gemini-1.5-flash  → 15 RPM
   • Total capacity: ~45-50 RPM (practically unlimited for demos)
   • If one model is rate-limited, instantly tries the next — ZERO wait
   • Parses exact "retry in Xs" from errors for precise cooldowns
   • 10 retries per call with live countdown via onStatus callback
   ═══════════════════════════════════════════════════════════════ */

const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-flash-latest"
];

// Per-model tracking: last call time + cooldown-until timestamp
const modelState = {};
MODELS.forEach(m => { modelState[m] = { lastCall: 0, coolUntil: 0 }; });

const MIN_GAP = 4000; // ms between calls to the SAME model
const MAX_RETRIES = 10;

// Parse "retry in 51.14s" from Gemini error text
function parseRetrySeconds(text) {
  const m = text?.match(/retry\s+in\s+([\d.]+)\s*s/i);
  return m ? Math.ceil(parseFloat(m[1])) + 2 : 0;
}

// Pick the best model: one that's not on cooldown, with longest time since last call
function pickModel() {
  const now = Date.now();
  // Filter out models currently on cooldown
  const available = MODELS.filter(m => now >= modelState[m].coolUntil);
  if (available.length === 0) {
    // All on cooldown — pick the one that comes off cooldown soonest
    return MODELS.reduce((best, m) =>
      modelState[m].coolUntil < modelState[best].coolUntil ? m : best
    );
  }
  // Among available, pick the one with the longest gap since last call
  return available.reduce((best, m) =>
    (now - modelState[m].lastCall) > (now - modelState[best].lastCall) ? m : best
  );
}

// Put a model on cooldown for `seconds`
function cooldownModel(model, seconds) {
  modelState[model].coolUntil = Date.now() + seconds * 1000;
}

// Countdown helper: calls onStatus every second
async function waitWithCountdown(ms, onStatus) {
  if (!onStatus) return new Promise(r => setTimeout(r, ms));
  const totalSec = Math.ceil(ms / 1000);
  for (let s = totalSec; s > 0; s--) {
    onStatus(`AI is thinking… ready in ~${s}s`);
    await new Promise(r => setTimeout(r, 1000));
  }
  onStatus(null);
}

/**
 * Call Gemini API with automatic model rotation and retry.
 *
 * @param {string} sys - System instruction
 * @param {string} msg - User message
 * @param {Array} imgs - Image parts [{inline_data:{mime_type, data}}]
 * @param {Object|null} schema - Response schema
 * @param {Function|null} onStatus - Callback for live status text (for countdown UI)
 * @param {Object} opts - Extra options: { temperature, maxOutputTokens }
 * @returns {Object} Parsed JSON response
 */
export async function geminiCall(sys, msg, imgs = [], schema = null, onStatus = null, opts = {}) {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) throw new Error("Missing VITE_GEMINI_API_KEY");

  const parts = [...imgs, { text: msg }];
  const genConfig = {
    temperature: opts.temperature ?? 0.5,
    maxOutputTokens: opts.maxOutputTokens ?? 2048,
    responseMimeType: "application/json",
    ...(schema ? { responseSchema: schema } : {}),
  };
  const bodyObj = {
    systemInstruction: { parts: [{ text: sys }] },
    contents: [{ role: "user", parts }],
    generationConfig: genConfig,
  };

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const model = pickModel();
    const now = Date.now();

    // Enforce per-model minimum gap
    const gap = MIN_GAP - (now - modelState[model].lastCall);
    if (gap > 0 && now < modelState[model].coolUntil) {
      // Model is on cooldown — try to find another
      const alt = MODELS.find(m => m !== model && Date.now() >= modelState[m].coolUntil);
      if (alt) {
        // Use the alternative model instead (no wait needed)
      } else {
        // All models on cooldown — wait for the shortest one
        const waitMs = Math.min(...MODELS.map(m => Math.max(0, modelState[m].coolUntil - Date.now())));
        if (waitMs > 0) await waitWithCountdown(waitMs, onStatus);
      }
    }

    const chosenModel = pickModel(); // re-pick after potential wait
    modelState[chosenModel].lastCall = Date.now();

    if (onStatus && attempt > 0) onStatus("Connecting to AI…");

    let res;
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:generateContent?key=${key}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bodyObj) }
      );
    } catch {
      // Network error — wait briefly and retry
      await waitWithCountdown(2000 * (attempt + 1), onStatus);
      continue;
    }

    // ── Rate-limited ──
    if (res.status === 429 || res.status === 503) {
      let delaySec = 10;
      try {
        const errText = await res.text();
        const parsed = parseRetrySeconds(errText);
        if (parsed > 0) delaySec = parsed;
      } catch { /* use default */ }

      // Also check Retry-After header
      const hdr = res.headers.get("Retry-After");
      if (hdr) delaySec = Math.max(delaySec, Math.ceil(parseFloat(hdr)) + 2);

      console.warn(`[gemini] ${chosenModel} rate-limited. Cooldown ${delaySec}s. Trying next model…`);
      cooldownModel(chosenModel, delaySec);

      // INSTANTLY try the next model — no waiting!
      const nextModel = MODELS.find(m => m !== chosenModel && Date.now() >= modelState[m].coolUntil);
      if (nextModel) {
        // Don't wait — loop will pick the available model
        continue;
      }

      // All models on cooldown — wait for the shortest cooldown
      const waitMs = Math.min(...MODELS.map(m => Math.max(0, modelState[m].coolUntil - Date.now())));
      if (waitMs > 0) await waitWithCountdown(waitMs, onStatus);
      continue;
    }

    // ── Parse response ──
    let d;
    try { d = await res.json(); } catch {
      await waitWithCountdown(2000, onStatus);
      continue;
    }

    // ── API error in body ──
    if (d.error) {
      const errMsg = d.error.message || "";
      const retrySec = parseRetrySeconds(errMsg);

      if (d.error.code === 429 || d.error.status === "RESOURCE_EXHAUSTED") {
        const coolSec = retrySec > 0 ? retrySec : 30;
        console.warn(`[gemini] ${chosenModel} quota error. Cooldown ${coolSec}s`);
        cooldownModel(chosenModel, coolSec);

        // Try another model immediately
        const nextModel = MODELS.find(m => m !== chosenModel && Date.now() >= modelState[m].coolUntil);
        if (nextModel) continue;

        // All models exhausted — wait for shortest cooldown
        const waitMs = Math.min(...MODELS.map(m => Math.max(0, modelState[m].coolUntil - Date.now())));
        if (waitMs > 0) await waitWithCountdown(waitMs, onStatus);
        continue;
      }

      // Non-quota error
      console.error("[gemini] API Error:", d.error);
      throw new Error(`AI error: ${d.error.message || "Please try again."}`);
    }

    // ── Extract JSON ──
    let raw = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
    if (s !== -1 && e !== -1) raw = raw.slice(s, e + 1);
    try {
      onStatus?.(null);
      return JSON.parse(raw);
    } catch {
      if (attempt < MAX_RETRIES - 1) { await waitWithCountdown(1500, onStatus); continue; }
      throw new Error("AI returned an unexpected response. Please try again.");
    }
  }
  throw new Error("AI is temporarily unavailable. Please try again in a minute.");
}

/**
 * Fetch wrapper with multi-model rotation (for StyleBuilderPage).
 * Returns a raw Response object.
 */
export async function geminiFetch(url, options, maxRetries = 5) {
  const key = import.meta.env.VITE_GEMINI_API_KEY;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const model = pickModel();
    modelState[model].lastCall = Date.now();

    // Replace the model name in the URL
    const modelUrl = url.replace(/models\/[^:]+:/, `models/${model}:`);

    let res;
    try {
      res = await fetch(modelUrl, options);
    } catch {
      await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      continue;
    }

    if (res.status === 429 || res.status === 503) {
      let delaySec = 10;
      try {
        const clone = res.clone();
        const errText = await clone.text();
        const parsed = parseRetrySeconds(errText);
        if (parsed > 0) delaySec = parsed;
      } catch {}

      console.warn(`[gemini] ${model} rate-limited in geminiFetch. Cooldown ${delaySec}s`);
      cooldownModel(model, delaySec);

      // Try another model immediately
      const next = MODELS.find(m => m !== model && Date.now() >= modelState[m].coolUntil);
      if (next) continue;

      // Wait for shortest cooldown
      const waitMs = Math.min(...MODELS.map(m => Math.max(0, modelState[m].coolUntil - Date.now())));
      if (waitMs > 0) await new Promise(r => setTimeout(r, waitMs));
      continue;
    }

    return res;
  }
  throw new Error("AI is temporarily unavailable. Please try again in a minute.");
}
