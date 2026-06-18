import { useState, useEffect, useRef, useCallback } from "react";
import { geminiCall } from "../lib/gemini";

// ── Brand Tokens ─────────────────────────────────────────────
const GOLD = "#c9a84c";
const GOLD_LIGHT = "#f0d080";
const BG_CARD = "rgba(255,255,255,0.03)";
const BORDER = "rgba(201,168,76,0.25)";
const BORDER_DIM = "rgba(201,168,76,0.12)";
const TEXT_PRI = "#f5f0e8";
const TEXT_SEC = "rgba(245,237,212,0.5)";
const SURFACE = "#160c03";

// ── SYSTEM PROMPT ────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a Fashion AI assistant embedded directly inside a Virtual Try-On interface.

The user has just completed a try-on — they have a BEFORE image (original outfit) 
and an AFTER image (tried-on outfit). Both images may be passed to you.

You will receive a "mode" field. Analyze the relevant image(s) and respond in 
valid JSON only. Zero extra text. Zero markdown. Just the JSON.

=====================================================================
MODE: "color_palette"
TRIGGER: User clicks "Color Palette" tab after try-on
IMAGE TO ANALYZE: AFTER image (the tried-on outfit)
=====================================================================

Extract the 6 dominant colors from the tried-on outfit.

{
  "mode": "color_palette",
  "analyzed": "after",
  "palette": [
    { "hex": "#1A1A1A", "name": "Jet Black", "match_category": "Shirts" },
    { "hex": "#8C8C8C", "name": "Storm Grey", "match_category": "Trousers" },
    { "hex": "#C8A96E", "name": "Warm Gold", "match_category": "Accessories" },
    { "hex": "#2C2C2C", "name": "Charcoal", "match_category": "Outerwear" },
    { "hex": "#F5F0E8", "name": "Soft Ivory", "match_category": "Basics" },
    { "hex": "#4A3728", "name": "Dark Espresso", "match_category": "Footwear" }
  ],
  "overall_vibe": "Monochrome Edge",
  "before_vs_after": "The after outfit shifts from casual navy to a sharper monochrome palette.",
  "shop_filter_hint": "Use RGB Euclidean distance to match these hex values to catalog products"
}

RULES:
- Always analyze the AFTER (tried-on) image, not the before
- Return exactly 6 colors
- Name colors like a fashion label — never generic ("Jet Black" not "black")
- before_vs_after: 1 sentence comparing the two looks' color story
- match_category: the product type that color most naturally applies to

=====================================================================
MODE: "fabric_scanner"
TRIGGER: User clicks "Fabric Scanner" tab after try-on
IMAGE TO ANALYZE: AFTER image (zoomed or full)
=====================================================================

Identify the fabric of the tried-on garment from the image.

{
  "mode": "fabric_scanner",
  "analyzed": "after",
  "garment_detected": "Formal Shirt",
  "fabric": "100% Cotton Poplin",
  "confidence": "High",
  "characteristics": [
    "Smooth, crisp texture",
    "Breathable for all-day wear",
    "Holds shape well when ironed"
  ],
  "care": [
    "Machine wash cold, gentle cycle",
    "Tumble dry low or line dry",
    "Iron on medium heat for crisp finish",
    "Store hung to avoid deep creases"
  ],
  "styling_tip": "Tuck into slim trousers and add a leather belt to sharpen the silhouette.",
  "try_on_note": "This fabric photographs well — the tried-on look will translate accurately to real life."
}

RULES:
- garment_detected: what clothing item is visible in the AFTER image
- confidence: "High", "Medium", or "Low" only
- try_on_note: 1 sentence about how this fabric behaves in real life vs. the try-on
- If image is unclear: { "error": "Image too low-res to detect fabric accurately. Try a closer crop." }
- Each care line under 10 words

=====================================================================
MODE: "style_match"
TRIGGER: User clicks "Style Match" tab after try-on
IMAGES TO ANALYZE: Both BEFORE and AFTER
=====================================================================

Compare the before and after outfits and rate the style upgrade.

{
  "mode": "style_match",
  "analyzed": "both",
  "before_look": {
    "description": "Navy formal shirt with grey trousers — classic but expected",
    "vibe": "Corporate Safe"
  },
  "after_look": {
    "description": "Black formal shirt with same grey trousers — sharper contrast, more intentional",
    "vibe": "Refined Monochrome"
  },
  "upgrade_score": 8,
  "upgrade_reason": "Switching to black creates a stronger contrast with the grey trousers and reads more deliberate than navy.",
  "third_piece": {
    "category": "Footwear",
    "ideal_color": "Black oxford or dark brown derby",
    "reason": "Anchors the monochrome palette and elevates the formality without effort."
  },
  "verdict": "Strong upgrade. Keep it."
}

RULES:
- upgrade_score is out of 10 — be honest, not every swap is an 8
- upgrade_reason: exactly 2 sentences, specific (mention colors, silhouette, occasion)
- verdict must be one of: "Strong upgrade. Keep it." / "Slight upgrade." / "Sideways move — try another." / "The original was better."
- third_piece: the ONE item that would complete the after look
- Never mention brand names`;

// ── SCHEMAS ──────────────────────────────────────────────────
const colorSchema = {
  type: "OBJECT",
  properties: {
    mode: { type: "STRING" },
    analyzed: { type: "STRING" },
    palette: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          hex: { type: "STRING" },
          name: { type: "STRING" },
          match_category: { type: "STRING" }
        },
        required: ["hex", "name", "match_category"]
      }
    },
    overall_vibe: { type: "STRING" },
    before_vs_after: { type: "STRING" },
    shop_filter_hint: { type: "STRING" }
  },
  required: ["mode", "analyzed", "palette", "overall_vibe", "before_vs_after"]
};

const fabricSchema = {
  type: "OBJECT",
  properties: {
    mode: { type: "STRING" },
    analyzed: { type: "STRING" },
    error: { type: "STRING" },
    garment_detected: { type: "STRING" },
    fabric: { type: "STRING" },
    confidence: { type: "STRING" },
    characteristics: { type: "ARRAY", items: { type: "STRING" } },
    care: { type: "ARRAY", items: { type: "STRING" } },
    styling_tip: { type: "STRING" },
    try_on_note: { type: "STRING" }
  },
  required: ["mode"]
};

const styleMatchSchema = {
  type: "OBJECT",
  properties: {
    mode: { type: "STRING" },
    analyzed: { type: "STRING" },
    before_look: {
      type: "OBJECT",
      properties: { description: { type: "STRING" }, vibe: { type: "STRING" } },
      required: ["description", "vibe"]
    },
    after_look: {
      type: "OBJECT",
      properties: { description: { type: "STRING" }, vibe: { type: "STRING" } },
      required: ["description", "vibe"]
    },
    upgrade_score: { type: "NUMBER" },
    upgrade_reason: { type: "STRING" },
    third_piece: {
      type: "OBJECT",
      properties: { category: { type: "STRING" }, ideal_color: { type: "STRING" }, reason: { type: "STRING" } },
      required: ["category", "ideal_color", "reason"]
    },
    verdict: { type: "STRING" }
  },
  required: ["mode", "analyzed", "before_look", "after_look", "upgrade_score", "upgrade_reason", "third_piece", "verdict"]
};

// ── Gemini Fetch (uses shared multi-model provider) ──────────
// geminiCall is imported from ../lib/gemini

// ── UI SKELETON ──────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ height: "24px", width: "120px", background: BORDER_DIM, borderRadius: "6px", animation: "pulse 1.5s infinite ease-in-out" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ height: "60px", background: BORDER_DIM, borderRadius: "8px", animation: "pulse 1.5s infinite ease-in-out", animationDelay: `${i*0.1}s` }} />
        ))}
      </div>
      <div style={{ height: "16px", width: "100%", background: BORDER_DIM, borderRadius: "4px", animation: "pulse 1.5s infinite ease-in-out" }} />
      <div style={{ height: "16px", width: "80%", background: BORDER_DIM, borderRadius: "4px", animation: "pulse 1.5s infinite ease-in-out", animationDelay: "0.2s" }} />
      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }`}</style>
    </div>
  );
}

// ── TABS ─────────────────────────────────────────────────────
const TOOLS = [
  { id: "color_palette", label: "🎨 Color Palette", accent: "#c084fc" },
  { id: "fabric_scanner", label: "🔬 Fabric Scanner", accent: "#38bdf8" },
  { id: "style_match", label: "✨ Style Match", accent: "#facc15" },
];

export default function FashionAITools({ modelFile, resultUrl }) {
  const [activeTab, setActiveTab] = useState("color_palette");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [b64Before, setB64Before] = useState(null);
  const [b64After, setB64After] = useState(null);

  // Cached results to avoid re-fetching when switching tabs
  const [results, setResults] = useState({
    color_palette: null,
    fabric_scanner: null,
    style_match: null
  });

  // Convert File/Blob to Base64
  useEffect(() => {
    if (modelFile) {
      const reader = new FileReader();
      reader.onload = (e) => setB64Before(e.target.result.split(',')[1]);
      reader.readAsDataURL(modelFile);
    }
  }, [modelFile]);

  useEffect(() => {
    if (resultUrl) {
      fetch(resultUrl)
        .then(res => res.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onload = (e) => setB64After(e.target.result.split(',')[1]);
          reader.readAsDataURL(blob);
        })
        .catch(err => console.error("Failed to fetch result URL for Base64 conversion", err));
    }
  }, [resultUrl]);

  // Auto-trigger API call when tab changes or images load
  useEffect(() => {
    const runAnalysis = async () => {
      // Need images first
      if (!b64After) return;
      if (activeTab === "style_match" && !b64Before) return;
      
      // If we already have the result, skip
      if (results[activeTab]) return;

      setLoading(true);
      setError(null);

      try {
        let userMessage = "";
        let imageParts = [];
        let schema = null;

        if (activeTab === "color_palette") {
          userMessage = JSON.stringify({ mode: "color_palette", image_after: "[attached inline]" });
          imageParts = [{ inline_data: { mime_type: "image/jpeg", data: b64After } }];
          schema = colorSchema;
        } else if (activeTab === "fabric_scanner") {
          userMessage = JSON.stringify({ mode: "fabric_scanner", image_after: "[attached inline]" });
          imageParts = [{ inline_data: { mime_type: "image/jpeg", data: b64After } }];
          schema = fabricSchema;
        } else if (activeTab === "style_match") {
          userMessage = JSON.stringify({ mode: "style_match", image_before: "[attached inline 1]", image_after: "[attached inline 2]" });
          // Note: Gemini understands parts in order. We pass Before then After.
          imageParts = [
            { inline_data: { mime_type: "image/jpeg", data: b64Before } },
            { inline_data: { mime_type: "image/jpeg", data: b64After } }
          ];
          schema = styleMatchSchema;
        }

        const data = await geminiCall(SYSTEM_PROMPT, userMessage, imageParts, schema);
        
        setResults(prev => ({ ...prev, [activeTab]: data }));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    runAnalysis();
  }, [activeTab, b64Before, b64After, results]);


  if (!resultUrl) return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
        <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: `linear-gradient(135deg, ${GOLD}, #f59e0b)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", boxShadow: "0 4px 20px rgba(201,168,76,0.4)" }}>
          🧠
        </div>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: TEXT_PRI, margin: "0 0 2px" }}>
            Fashion AI Tools
          </h2>
          <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.15em", color: GOLD, textTransform: "uppercase" }}>
            POWERED BY GEMINI
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", overflowX: "auto", paddingBottom: "4px" }}>
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
              border: `1px solid ${activeTab === t.id ? t.accent : BORDER_DIM}`,
              background: activeTab === t.id ? `${t.accent}15` : "transparent",
              color: activeTab === t.id ? t.accent : TEXT_SEC,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "16px", overflow: "hidden", minHeight: "200px" }}>
        {error ? (
          <div style={{ padding: "30px", textAlign: "center", color: "#f87171" }}>
            <div style={{ fontSize: "24px", marginBottom: "10px" }}>⚠️</div>
            <div style={{ fontSize: "14px" }}>{error}</div>
            <button onClick={() => setResults(prev => ({ ...prev, [activeTab]: null }))} style={{ marginTop: "16px", padding: "8px 16px", background: "transparent", border: "1px solid #f8717155", color: "#f87171", borderRadius: "8px", cursor: "pointer" }}>Retry</button>
          </div>
        ) : loading || !results[activeTab] ? (
          <Skeleton />
        ) : (
          <div>
            {/* ── COLOR PALETTE ── */}
            {activeTab === "color_palette" && results.color_palette && (
              <div style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: TEXT_PRI }}>Dominant Colors</div>
                  <span style={{ fontSize: "10px", fontWeight: "600", letterSpacing: "0.12em", color: "#c084fc", background: "rgba(192,132,252,0.1)", padding: "4px 10px", borderRadius: "20px" }}>
                    {results.color_palette.overall_vibe}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                  {results.color_palette.palette.map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", background: BG_CARD, padding: "10px", borderRadius: "10px", border: `1px solid ${BORDER_DIM}` }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: c.hex, boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }} />
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: TEXT_PRI, marginBottom: "2px" }}>{c.name}</div>
                        <div style={{ fontSize: "10px", color: TEXT_SEC, textTransform: "uppercase" }}>{c.match_category}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "rgba(192,132,252,0.05)", borderLeft: "2px solid #c084fc", padding: "12px 16px", borderRadius: "0 8px 8px 0" }}>
                  <div style={{ fontSize: "10px", fontWeight: "700", color: "#c084fc", letterSpacing: "0.1em", marginBottom: "4px", textTransform: "uppercase" }}>Color Shift</div>
                  <div style={{ fontSize: "13px", color: TEXT_PRI, lineHeight: 1.5 }}>{results.color_palette.before_vs_after}</div>
                </div>
              </div>
            )}

            {/* ── FABRIC SCANNER ── */}
            {activeTab === "fabric_scanner" && results.fabric_scanner && (
              <div style={{ padding: "20px" }}>
                {results.fabric_scanner.error ? (
                  <div style={{ color: "#f87171", textAlign: "center" }}>{results.fabric_scanner.error}</div>
                ) : (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${BORDER_DIM}`, paddingBottom: "16px", marginBottom: "16px" }}>
                      <div>
                        <div style={{ fontSize: "20px", fontWeight: "700", color: TEXT_PRI, fontFamily: "'Outfit', sans-serif" }}>{results.fabric_scanner.fabric}</div>
                        <div style={{ fontSize: "12px", color: TEXT_SEC }}>{results.fabric_scanner.garment_detected}</div>
                      </div>
                      <span style={{ fontSize: "10px", fontWeight: "600", color: results.fabric_scanner.confidence === "High" ? "#4ade80" : "#facc15", background: results.fabric_scanner.confidence === "High" ? "rgba(74,222,128,0.1)" : "rgba(250,204,21,0.1)", padding: "4px 10px", borderRadius: "20px" }}>
                        {results.fabric_scanner.confidence} Confidence
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                      <div style={{ background: BG_CARD, padding: "16px", borderRadius: "12px", border: `1px solid ${BORDER_DIM}` }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#38bdf8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>Characteristics</div>
                        <ul style={{ margin: 0, paddingLeft: "16px", color: TEXT_PRI, fontSize: "13px", lineHeight: 1.6 }}>
                          {results.fabric_scanner.characteristics?.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                      <div style={{ background: BG_CARD, padding: "16px", borderRadius: "12px", border: `1px solid ${BORDER_DIM}` }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#38bdf8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>Care Guide</div>
                        <ul style={{ margin: 0, paddingLeft: "16px", color: TEXT_PRI, fontSize: "13px", lineHeight: 1.6 }}>
                          {results.fabric_scanner.care?.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ background: "rgba(56,189,248,0.05)", borderLeft: "2px solid #38bdf8", padding: "12px 16px", borderRadius: "0 8px 8px 0", fontSize: "13px", color: TEXT_PRI }}>
                        <span style={{ color: "#38bdf8", fontWeight: "bold", marginRight: "6px" }}>💡 Styling:</span>
                        {results.fabric_scanner.styling_tip}
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.02)", borderLeft: "2px solid #9ca3af", padding: "12px 16px", borderRadius: "0 8px 8px 0", fontSize: "12px", color: TEXT_SEC, fontStyle: "italic" }}>
                        {results.fabric_scanner.try_on_note}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STYLE MATCH ── */}
            {activeTab === "style_match" && results.style_match && (
              <div style={{ padding: "0" }}>
                <div style={{ display: "flex", padding: "20px", borderBottom: `1px solid ${BORDER_DIM}`, alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: `conic-gradient(${results.style_match.upgrade_score >= 7 ? "#4ade80" : results.style_match.upgrade_score >= 5 ? "#facc15" : "#f87171"} ${results.style_match.upgrade_score * 36}deg, ${BORDER_DIM} 0)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: SURFACE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "800", color: TEXT_PRI }}>
                        {results.style_match.upgrade_score}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: "700", color: GOLD, letterSpacing: "0.15em", textTransform: "uppercase" }}>Upgrade Score</div>
                      <div style={{ fontSize: "14px", color: TEXT_SEC }}>{results.style_match.verdict}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "20px" }}>
                  <div style={{ background: BG_CARD, padding: "16px", borderRadius: "12px", border: `1px solid ${BORDER_DIM}` }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: TEXT_SEC, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>Before Look</div>
                    <div style={{ fontSize: "13px", color: TEXT_PRI, marginBottom: "8px", lineHeight: 1.5 }}>{results.style_match.before_look.description}</div>
                    <span style={{ fontSize: "10px", color: "#9ca3af", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "10px" }}>{results.style_match.before_look.vibe}</span>
                  </div>
                  <div style={{ background: BG_CARD, padding: "16px", borderRadius: "12px", border: `1px solid ${BORDER_DIM}` }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>After Look</div>
                    <div style={{ fontSize: "13px", color: TEXT_PRI, marginBottom: "8px", lineHeight: 1.5 }}>{results.style_match.after_look.description}</div>
                    <span style={{ fontSize: "10px", color: GOLD, background: "rgba(201,168,76,0.1)", padding: "2px 8px", borderRadius: "10px" }}>{results.style_match.after_look.vibe}</span>
                  </div>
                </div>

                <div style={{ padding: "0 20px 20px" }}>
                  <p style={{ fontSize: "14px", color: TEXT_PRI, lineHeight: 1.6, margin: "0 0 20px" }}>{results.style_match.upgrade_reason}</p>
                  
                  <div style={{ background: "rgba(250,204,21,0.05)", borderLeft: "2px solid #facc15", padding: "16px", borderRadius: "0 12px 12px 0" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#facc15", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px" }}>🧩 Third Piece Suggestion</div>
                    <div style={{ fontSize: "14px", color: TEXT_PRI, marginBottom: "4px" }}><strong>{results.style_match.third_piece.category}</strong> in <em>{results.style_match.third_piece.ideal_color}</em></div>
                    <div style={{ fontSize: "13px", color: TEXT_SEC }}>{results.style_match.third_piece.reason}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
