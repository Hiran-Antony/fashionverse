import { useState, useRef, useEffect } from "react";
import ColorThief from "colorthief";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useTryOnStore } from "../store/tryOnStore";
import {
  UploadCloud, RefreshCcw, Search, Sparkles, Layers, ScanLine,
  ChevronRight, X, Palette
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { geminiCall } from "../lib/gemini";

/* ─── BRAND TOKENS ──────────────────────────────────────────── */
const G       = "#c9a84c";
const GL      = "#e8c96a";
const GD      = "rgba(201,168,76,0.14)";
const GB      = "rgba(201,168,76,0.28)";
const T1      = "#f5edd6";
const T2      = "rgba(245,237,214,0.42)";
const SURF    = "#0d0700";
const CARD    = "rgba(255,255,255,0.028)";
const BD      = "rgba(201,168,76,0.13)";


function fileToB64(file) {
  return new Promise(res => {
    const r = new FileReader();
    r.onload = e => { const u = e.target.result; res({ data: u.split(",")[1], mime: file.type || "image/jpeg", thumb: u }); };
    r.readAsDataURL(file);
  });
}

function rgbToHex(r, g, b) { return "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join(""); }
function colorDist(r1, g1, b1, r2, g2, b2) { return Math.sqrt((r1-r2)**2+(g1-g2)**2+(b1-b2)**2); }
const CMAP = {
  black:[0,0,0],white:[255,255,255],red:[220,50,50],blue:[30,80,200],
  green:[0,120,60],yellow:[240,200,30],navy:[10,25,100],grey:[128,128,128],
  gray:[128,128,128],brown:[140,70,40],beige:[225,200,160],pink:[230,150,170],
  purple:[100,50,140],orange:[220,130,40],maroon:[110,20,30],olive:[90,100,30],
  cream:[240,230,200],khaki:[180,160,110],white:[250,250,245],
};

/* ─── SCHEMAS ────────────────────────────────────────────────── */
const fabricSchema = {
  type:"OBJECT", properties:{
    fabric:{type:"STRING"}, confidence:{type:"STRING"},
    characteristics:{type:"ARRAY",items:{type:"STRING"}},
    care:{type:"ARRAY",items:{type:"STRING"}},
    styling_tip:{type:"STRING"},
  }, required:["fabric","confidence","characteristics","care"],
};
const styleMatchSchema = {
  type:"OBJECT", properties:{
    score:{type:"NUMBER"}, reason:{type:"STRING"}, third_piece:{type:"STRING"},
  }, required:["score","reason","third_piece"],
};

/* ─── TINY UI ATOMS ─────────────────────────────────────────── */
function Pill({ label, color = G }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center",
      padding:"3px 10px", borderRadius:"20px",
      fontSize:"11px", fontWeight:600, letterSpacing:"0.04em",
      color, background:`${color}18`, border:`1px solid ${color}35`,
    }}>{label}</span>
  );
}

function SectionHead({ children, accent = G }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"14px" }}>
      <div style={{ height:"1px", flex:1, background:`linear-gradient(90deg,${accent}30,transparent)` }} />
      <span style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:accent }}>
        {children}
      </span>
      <div style={{ height:"1px", flex:1, background:`linear-gradient(270deg,${accent}30,transparent)` }} />
    </div>
  );
}

function Spinner({ color = G, label = "Analyzing…", status = null }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"14px", padding:"44px 20px" }}>
      <div style={{
        width:44, height:44, borderRadius:"50%",
        border:`2px solid ${color}22`, borderTop:`2px solid ${color}`,
        animation:"fv-spin 0.75s linear infinite",
      }} />
      <span style={{ fontSize:"13px", color:T2, letterSpacing:"0.04em", textAlign:"center", lineHeight:1.5 }}>
        {status || label}
      </span>
      <style>{`@keyframes fv-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function ScoreRing({ score, max = 10 }) {
  const color = score >= 8 ? "#4ade80" : score >= 6 ? G : "#f87171";
  return (
    <div style={{
      width:76, height:76, borderRadius:"50%", flexShrink:0,
      background:`conic-gradient(${color} ${score/max*360}deg, rgba(255,255,255,0.06) 0)`,
      display:"flex", alignItems:"center", justifyContent:"center",
      boxShadow:`0 0 24px ${color}30`,
    }}>
      <div style={{
        width:60, height:60, borderRadius:"50%", background:SURF,
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      }}>
        <span style={{ fontSize:22, fontWeight:800, color:T1, lineHeight:1 }}>{score}</span>
        <span style={{ fontSize:9, color:T2, letterSpacing:"0.1em" }}>/ {max}</span>
      </div>
    </div>
  );
}

/* ─── UPLOAD DROP ZONE ──────────────────────────────────────── */
function DropZone({ onClick, accent = G, icon: Icon = UploadCloud, title, subtitle }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        border:`1.5px dashed ${hov ? accent : `${accent}50`}`,
        borderRadius:18, padding:"50px 24px", textAlign:"center",
        cursor:"pointer", transition:"all 0.25s ease",
        background: hov ? `${accent}09` : "transparent",
        boxShadow: hov ? `0 0 40px ${accent}18` : "none",
      }}
    >
      <div style={{
        width:60, height:60, borderRadius:16, margin:"0 auto 18px",
        background:`linear-gradient(145deg,${accent}25,${accent}0a)`,
        border:`1px solid ${accent}45`,
        display:"flex", alignItems:"center", justifyContent:"center",
        transition:"transform 0.25s ease",
        transform: hov ? "scale(1.1) translateY(-3px)" : "scale(1)",
        boxShadow: hov ? `0 8px 24px ${accent}30` : "none",
      }}>
        <Icon size={26} color={accent} />
      </div>
      <div style={{ fontSize:15, fontWeight:700, color:accent, marginBottom:6 }}>{title}</div>
      {subtitle && <div style={{ fontSize:12, color:T2, lineHeight:1.6 }}>{subtitle}</div>}
    </div>
  );
}

/* ─── CATALOG PICKER MODAL ──────────────────────────────────── */
function CatalogModal({ catalog, slot, onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const filtered = catalog.filter(p =>
    !query || p.name.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9999,
      background:"rgba(5,3,0,0.88)", backdropFilter:"blur(14px)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:20,
    }}>
      <div style={{
        width:"100%", maxWidth:640, maxHeight:"80vh",
        background:"linear-gradient(145deg,#12090200,#0d070099)",
        backgroundColor:"#120902", border:`1px solid ${GB}`,
        borderRadius:22, overflow:"hidden", display:"flex", flexDirection:"column",
        boxShadow:`0 24px 80px rgba(0,0,0,0.8), 0 0 60px ${G}15`,
      }}>
        {/* Modal header */}
        <div style={{
          padding:"20px 24px 16px",
          borderBottom:`1px solid ${BD}`,
          background:`linear-gradient(90deg,${G}09,transparent)`,
          flexShrink:0,
        }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:T1, marginBottom:2 }}>Select Product {slot}</div>
              <div style={{ fontSize:12, color:T2 }}>{filtered.length} items available</div>
            </div>
            <button onClick={onClose} style={{
              width:36, height:36, borderRadius:"50%", border:`1px solid ${BD}`,
              background:"transparent", color:T2, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = G; e.currentTarget.style.color = G; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BD; e.currentTarget.style.color = T2; }}>
              <X size={15} />
            </button>
          </div>
          {/* Search bar */}
          <div style={{
            display:"flex", alignItems:"center", gap:10,
            background:"rgba(255,255,255,0.04)", border:`1px solid ${BD}`,
            borderRadius:10, padding:"10px 14px",
          }}>
            <Search size={14} color={T2} />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search products…"
              style={{
                flex:1, background:"transparent", border:"none", outline:"none",
                color:T1, fontSize:13, fontFamily:"inherit",
              }}
            />
            {query && <button onClick={() => setQuery("")} style={{ background:"transparent", border:"none", color:T2, cursor:"pointer", display:"flex" }}><X size={12} /></button>}
          </div>
        </div>

        {/* Grid */}
        <div style={{
          overflowY:"auto", padding:"16px 24px 24px",
          display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:14,
        }}>
          {filtered.map(p => (
            <div
              key={p.id}
              onClick={() => { onSelect(p); onClose(); }}
              style={{ cursor:"pointer", borderRadius:14, overflow:"hidden", border:`1px solid ${BD}`, transition:"all 0.2s", background:CARD }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = GB; e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 8px 24px rgba(0,0,0,0.5)`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BD; e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}
            >
              <div style={{ height:160, overflow:"hidden", background:"rgba(0,0,0,0.3)" }}>
                <img src={p.image} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
              </div>
              <div style={{ padding:"10px 10px 12px" }}>
                <div style={{
                  fontSize:11, fontWeight:600, color:T1, lineHeight:1.4,
                  display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden",
                  marginBottom:5,
                }}>{p.name}</div>
                <div style={{ fontSize:12, color:G, fontWeight:700 }}>₹{p.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── INFO CARD ─────────────────────────────────────────────── */
function InfoCard({ title, items, accent = G }) {
  return (
    <div style={{ background:CARD, borderRadius:14, border:`1px solid ${BD}`, overflow:"hidden" }}>
      <div style={{
        padding:"12px 16px", fontSize:10, fontWeight:700, letterSpacing:"0.18em",
        textTransform:"uppercase", color:accent,
        borderBottom:`1px solid ${BD}`,
        background:`linear-gradient(90deg,${accent}0a,transparent)`,
      }}>{title}</div>
      <ul style={{ margin:0, padding:"14px 16px", listStyle:"none", display:"flex", flexDirection:"column", gap:8 }}>
        {items?.map((item, i) => (
          <li key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", fontSize:13, color:T1, lineHeight:1.55 }}>
            <span style={{ color:accent, fontSize:8, marginTop:5, flexShrink:0 }}>◆</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── PRODUCT ROW CARD ──────────────────────────────────────── */
function ProductRow({ product, onTryOn }) {
  return (
    <div style={{
      display:"flex", gap:12, alignItems:"center",
      background:CARD, padding:"12px 14px", borderRadius:12,
      border:`1px solid ${BD}`, transition:"border-color 0.2s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = GB}
      onMouseLeave={e => e.currentTarget.style.borderColor = BD}>
      {product.image && (
        <img src={product.image} alt={product.name} style={{ width:54, height:66, objectFit:"cover", borderRadius:8, flexShrink:0 }} />
      )}
      <div style={{ minWidth:0, flex:1 }}>
        <div style={{
          fontSize:13, fontWeight:600, color:T1, marginBottom:4,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
        }}>{product.name}</div>
        <div style={{ fontSize:12, color:G, fontWeight:700 }}>₹{product.price}</div>
      </div>
      {onTryOn && (
        <button
          onClick={(e) => { e.stopPropagation(); onTryOn(product); }}
          style={{
            background:G, color:"#000", border:"none", padding:"6px 12px",
            borderRadius:8, fontSize:11, fontWeight:700, cursor:"pointer",
            flexShrink:0, display:"flex", alignItems:"center", gap:4
          }}
        >
          <Sparkles size={12} /> Try On
        </button>
      )}
    </div>
  );
}

/* ─── TABS ───────────────────────────────────────────────────── */
const TABS = [
  { id:"color",  label:"Color Extractor",  Icon:Layers,   accent:G },
  { id:"style",  label:"Style Match",      Icon:Sparkles, accent:"#a78bfa" },
  { id:"fabric", label:"Fabric Scanner",   Icon:ScanLine, accent:"#38bdf8" },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function StandaloneFashionTools() {
  const [tab, setTab]       = useState("color");
  const [loadingColor, setLoadingColor] = useState(false);
  const [loadingStyle, setLoadingStyle] = useState(false);
  const [loadingFabric, setLoadingFabric] = useState(false);
  const [error, setError]   = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(null); // live countdown text
  const [catalog, setCatalog] = useState([]);

  useEffect(() => {
    supabase.from("products")
      .select("id, name, brand, price, product_colors(image_url, color_name)")
      .eq("is_active", true).limit(80)
      .then(({ data }) => {
        if (data) setCatalog(data.map(p => ({
          ...p,
          image: p.product_colors?.[0]?.image_url || "",
          color: (p.product_colors?.[0]?.color_name || "").toLowerCase(),
        })));
      });
  }, []);

  /* ── COLOR EXTRACTOR state ────────────────────────── */
  const [colorThumb, setColorThumb] = useState(null);
  const [palette, setPalette]       = useState(null);
  const [matching, setMatching]     = useState([]);
  const colorRef = useRef(null);
  
  const navigate = useNavigate();
  const { setUpperwearFile, setBottomwearFile } = useTryOnStore();

  const handleTryOn = async (product) => {
    if (!product.image) { toast.error("No image available."); return; }
    const tid = toast.loading("Loading into Try-On Studio…");
    try {
      const res = await fetch(product.image);
      const blob = await res.blob();
      const file = new File([blob], 'garment.jpg', { type: blob.type });
      const isBottom = /bottom|pant|jean|trouser|skirt|shorts/i.test((product.category || "") + " " + product.name);
      if (isBottom) setBottomwearFile(file, product.image);
      else setUpperwearFile(file, product.image);
      toast.success("Ready! Launching Try-On Studio.", { id: tid });
      navigate("/try-on");
    } catch { toast.error("Could not load image.", { id: tid }); }
  };

  const handleColorUpload = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objUrl = URL.createObjectURL(file);
    setColorThumb(objUrl); setPalette(null); setMatching([]); setLoadingColor(true);
    const img = new Image();
    img.src = objUrl;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const ct = new ColorThief();
        const colors = ct.getPalette(img, 6);
        setPalette(colors.map(c => ({ hex: rgbToHex(c[0],c[1],c[2]), rgb: c })));
        const matches = catalog.map(p => {
          let cr = [128,128,128]; // fallback
          for (const key in CMAP) {
            if (p.color && p.color.includes(key)) { cr = CMAP[key]; break; }
          }
          let minD = Infinity;
          colors.forEach((c, idx) => { 
            // Apply a penalty multiplier to less dominant colors so shadows don't falsely match
            const penalty = 1 + (idx * 0.6);
            const d = colorDist(c[0],c[1],c[2],cr[0],cr[1],cr[2]) * penalty; 
            if (d<minD) minD=d; 
          });
          return { ...p, dist: minD };
        }).sort((a,b) => a.dist - b.dist).slice(0, 6);
        setMatching(matches);
      } catch { setError("Could not extract colors from image."); }
      setLoadingColor(false);
    };
    img.onerror = () => { setError("Failed to load image."); setLoadingColor(false); };
  };

  /* ── STYLE MATCH state ────────────────────────────── */
  const [p1, setP1]             = useState(null);
  const [p2, setP2]             = useState(null);
  const [styleResult, setStyleResult] = useState(null);
  const [showPicker, setShowPicker]   = useState(null);

  const handleStyleMatch = async () => {
    if (!p1 || !p2) return;
    setLoadingStyle(true); setStyleResult(null); setError(null); setLoadingStatus(null);
    try {
      const sys = "You are a seasoned fashion stylist. Rate the compatibility of two clothing items out of 10. Give a detailed reason (2-3 sentences). Suggest one specific third piece (with color) to complete the look.";
      const res = await geminiCall(sys, `Item 1: ${p1.name} (${p1.color || "unknown color"}). Item 2: ${p2.name} (${p2.color || "unknown color"}). Rate how well they pair together.`, [], styleMatchSchema, setLoadingStatus);
      setStyleResult(res);
    } catch (err) { setError(err.message); }
    setLoadingStyle(false); setLoadingStatus(null);
  };

  /* ── FABRIC SCANNER state ─────────────────────────── */
  const [fabricThumb, setFabricThumb]   = useState(null);
  const [fabricResult, setFabricResult] = useState(null);
  const fabricRef = useRef(null);

  const handleFabricUpload = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingFabric(true); setFabricResult(null); setError(null); setLoadingStatus(null);
    try {
      const { data, mime, thumb } = await fileToB64(file);
      setFabricThumb(thumb);
      const sys = "You are a master textile expert. Analyze this fabric photo with precision. Identify the material composition, weave characteristics, quality indicators, care requirements, and styling potential.";
      const res = await geminiCall(sys, "Identify and analyze this fabric.", [{ inline_data:{ mime_type:mime, data } }], fabricSchema, setLoadingStatus);
      setFabricResult(res);
    } catch (err) { setError(err.message); }
    setLoadingFabric(false); setLoadingStatus(null);
  };

  const accentOf = TABS.find(t => t.id === tab)?.accent || G;

  return (
    <div style={{ fontFamily:"'Outfit','Inter',sans-serif" }}>

      {/* ── TAB BAR ─────────────────────────────────── */}
      <div style={{ display:"flex", gap:6, marginBottom:24, flexWrap:"wrap" }}>
        {TABS.map(({ id, label, Icon, accent }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => { setTab(id); setError(null); }} style={{
              display:"flex", alignItems:"center", gap:8,
              padding:"9px 18px", borderRadius:10, cursor:"pointer",
              fontSize:13, fontWeight:600, letterSpacing:"0.02em",
              transition:"all 0.22s cubic-bezier(.4,0,.2,1)",
              border:`1px solid ${active ? accent : BD}`,
              background: active ? `linear-gradient(135deg,${accent}20,${accent}08)` : "transparent",
              color: active ? accent : T2,
              boxShadow: active ? `0 0 20px ${accent}20` : "none",
              transform: active ? "translateY(-1px)" : "none",
            }}>
              <Icon size={13} style={{ opacity: active ? 1 : 0.5 }} />
              {label}
            </button>
          );
        })}
      </div>

      {/* ── PANEL ───────────────────────────────────── */}
      <div style={{
        borderRadius:20, overflow:"hidden",
        border:`1px solid ${accentOf}30`,
        background:"linear-gradient(155deg,rgba(18,10,2,0.97),rgba(10,6,1,0.99))",
        boxShadow:`0 12px 50px rgba(0,0,0,0.65), inset 0 1px 0 ${accentOf}12`,
      }}>

        {/* Panel header */}
        <div style={{
          padding:"20px 26px 18px",
          borderBottom:`1px solid ${BD}`,
          background:`linear-gradient(90deg,${accentOf}09,transparent 60%)`,
        }}>
          <div style={{ fontSize:18, fontWeight:700, color:T1, marginBottom:4 }}>
            {tab === "color"  && "Outfit Color Extractor"}
            {tab === "style"  && "Style Compatibility"}
            {tab === "fabric" && "Fabric Scanner"}
          </div>
          <div style={{ fontSize:13, color:T2, lineHeight:1.5 }}>
            {tab === "color"  && "Upload any outfit photo to extract its dominant colors and find matching catalog pieces instantly."}
            {tab === "style"  && "Pick two products and let AI rate how well they pair together — get a compatibility score and styling tips."}
            {tab === "fabric" && "Upload a close-up photo of any fabric to identify the material, care guide, and styling potential."}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"12px 26px", background:"rgba(248,113,113,0.06)",
            borderBottom:"1px solid rgba(248,113,113,0.14)",
          }}>
            <span style={{ fontSize:13, color:"#f87171" }}>⚠ {error}</span>
            <button onClick={() => setError(null)} style={{ background:"transparent", border:"none", color:"#f87171", cursor:"pointer", display:"flex" }}><X size={14} /></button>
          </div>
        )}

        {/* Panel body */}
        <div style={{ padding:"26px" }}>

          {/* ══════════════════════════════════════════
              TAB: COLOR EXTRACTOR
          ══════════════════════════════════════════ */}
          {tab === "color" && (
            <div>
              <input type="file" accept="image/*" ref={colorRef} onChange={handleColorUpload} style={{ display:"none" }} />

              {!colorThumb ? (
                <DropZone
                  onClick={() => colorRef.current?.click()}
                  accent={G}
                  icon={Palette}
                  title="Click to upload an outfit photo"
                  subtitle="Supports JPG, PNG, WEBP — extracts up to 6 dominant colors"
                />
              ) : (
                <div style={{ display:"flex", gap:26, flexWrap:"wrap" }}>
                  {/* Uploaded preview */}
                  <div style={{ width:180, flexShrink:0 }}>
                    <div style={{
                      borderRadius:16, overflow:"hidden",
                      border:`1px solid ${GB}`,
                      boxShadow:`0 8px 30px rgba(0,0,0,0.6)`,
                    }}>
                      <img src={colorThumb} alt="Outfit" style={{ width:"100%", display:"block" }} />
                    </div>
                    <button
                      onClick={() => { setColorThumb(null); setPalette(null); setMatching([]); }}
                      style={{
                        width:"100%", padding:"9px", marginTop:10,
                        background:"transparent", color:T2,
                        border:`1px solid ${BD}`, borderRadius:10, cursor:"pointer",
                        fontSize:12, fontFamily:"inherit",
                        display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                      }}>
                      <RefreshCcw size={12} /> Upload Different
                    </button>
                  </div>

                  <div style={{ flex:1, minWidth:200 }}>
                    {loadingColor ? <Spinner label="Extracting colors…" status={loadingStatus} /> : palette && (
                      <div>
                        <SectionHead accent={G}>Dominant Colors</SectionHead>
                        {/* Color palette strip */}
                        <div style={{ display:"flex", borderRadius:12, overflow:"hidden", marginBottom:16, boxShadow:"0 4px 20px rgba(0,0,0,0.4)" }}>
                          {palette.map((c, i) => (
                            <div key={i} title={c.hex} style={{ flex:1, height:48, background:c.hex }} />
                          ))}
                        </div>
                        {/* Hex codes grid */}
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:24 }}>
                          {palette.map((c, i) => (
                            <div key={i} style={{
                              display:"flex", alignItems:"center", gap:10,
                              background:CARD, padding:"10px 12px", borderRadius:10,
                              border:`1px solid ${BD}`,
                            }}>
                              <div style={{ width:32, height:32, borderRadius:8, background:c.hex, flexShrink:0, boxShadow:`0 3px 10px ${c.hex}66` }} />
                              <span style={{ fontSize:12, color:T2, fontFamily:"monospace", letterSpacing:"0.05em" }}>{c.hex.toUpperCase()}</span>
                            </div>
                          ))}
                        </div>

                        {matching.length > 0 && (
                          <>
                            <SectionHead accent={G}>Matching Catalog Pieces</SectionHead>
                            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                              {matching.map(p => <ProductRow key={p.id} product={p} onTryOn={handleTryOn} />)}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════
              TAB: STYLE MATCH
          ══════════════════════════════════════════ */}
          {tab === "style" && (
            <div>
              {/* Catalog modal */}
              {showPicker && (
                <CatalogModal
                  catalog={catalog}
                  slot={showPicker}
                  onSelect={p => { showPicker === 1 ? setP1(p) : setP2(p); setStyleResult(null); }}
                  onClose={() => setShowPicker(null)}
                />
              )}

              {/* Product selector slots */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 40px 1fr", gap:14, alignItems:"center", marginBottom:24 }}>
                {[
                  { label:"Product 1", p:p1, slot:1 },
                  { isVs: true },
                  { label:"Product 2", p:p2, slot:2 }
                ].map((item, i) => {
                  if (item.isVs) {
                    return (
                      <div key="vs" style={{
                        width:40, height:40, borderRadius:"50%",
                        background:CARD, border:`1px solid ${BD}`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:10, fontWeight:800, color:T2, letterSpacing:"0.05em",
                        alignSelf:"center", marginTop: 22
                      }}>VS</div>
                    );
                  }
                  const { label, p, slot } = item;
                  return (
                    <div key={slot}>
                      <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:T2, marginBottom:10 }}>{label}</div>
                      {p ? (
                        <div
                          onClick={() => setShowPicker(slot)}
                          style={{
                            display:"flex", gap:12, alignItems:"center",
                            background:CARD, padding:"14px", borderRadius:14,
                            border:`1px solid ${GB}`, cursor:"pointer", transition:"all 0.2s",
                            boxShadow:`0 0 24px ${G}12`,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = G; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = GB; }}>
                          {p.image && <img src={p.image} alt={p.name} style={{ width:54, height:68, objectFit:"cover", borderRadius:9, flexShrink:0 }} />}
                          <div style={{ minWidth:0, flex:1 }}>
                            <div style={{ fontSize:13, fontWeight:600, color:T1, marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{p.name}</div>
                            <div style={{ fontSize:12, color:G, fontWeight:700 }}>₹{p.price}</div>
                          </div>
                          <RefreshCcw size={13} color={T2} style={{ flexShrink:0 }} />
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowPicker(slot)}
                          style={{
                            width:"100%", padding:"36px 16px",
                            background:GD, border:`1.5px dashed ${GB}`,
                            borderRadius:14, color:G, cursor:"pointer",
                            fontSize:13, fontWeight:600, fontFamily:"inherit",
                            display:"flex", flexDirection:"column", alignItems:"center", gap:10,
                            transition:"all 0.2s",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = `${G}20`; e.currentTarget.style.boxShadow = `0 0 30px ${G}18`; }}
                          onMouseLeave={e => { e.currentTarget.style.background = GD; e.currentTarget.style.boxShadow = "none"; }}>
                          <Search size={22} />
                          Select from Catalog
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Analyze button */}
              {p1 && p2 && !styleResult && !loadingStyle && (
                <button onClick={handleStyleMatch} style={{
                  width:"100%", padding:15, fontFamily:"inherit",
                  background:`linear-gradient(135deg,${G},${GL})`,
                  color:"#0d0700", border:"none", borderRadius:12,
                  fontSize:14, fontWeight:700, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  boxShadow:`0 4px 24px ${G}40`, letterSpacing:"0.02em",
                  transition:"all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 8px 32px ${G}55`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 4px 24px ${G}40`; }}>
                  <Sparkles size={16} /> Check Style Compatibility
                </button>
              )}

              {loadingStyle && <Spinner color="#a78bfa" label="Rating your pair…" status={loadingStatus} />}

              {/* Style result */}
              {styleResult && (
                <div style={{ borderRadius:18, border:`1px solid ${BD}`, overflow:"hidden", background:CARD, marginTop: p1 && p2 ? 20 : 0 }}>
                  {/* Score row */}
                  <div style={{
                    padding:"22px 26px",
                    background:`linear-gradient(90deg,rgba(167,139,250,0.1),transparent)`,
                    borderBottom:`1px solid ${BD}`,
                    display:"flex", alignItems:"center", gap:22,
                  }}>
                    <ScoreRing score={styleResult.score} />
                    <div>
                      <div style={{ fontSize:10, fontWeight:700, color:"#a78bfa", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:6 }}>Compatibility Score</div>
                      <div style={{ fontSize:15, fontWeight:600, color:T1 }}>
                        {styleResult.score >= 8 ? "🔥 Excellent Pairing" : styleResult.score >= 6 ? "✨ Good Combination" : styleResult.score >= 4 ? "⚡ Needs Tweaking" : "❌ Poor Match"}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding:"22px 26px" }}>
                    <p style={{ margin:"0 0 20px", fontSize:14, color:T1, lineHeight:1.8 }}>{styleResult.reason}</p>
                    <div style={{
                      background:"rgba(167,139,250,0.06)", padding:"16px 18px",
                      borderLeft:"2px solid #a78bfa", borderRadius:"0 12px 12px 0",
                    }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"#a78bfa", letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:8 }}>🧩 Complete the Look</div>
                      <div style={{ fontSize:13, color:T1, lineHeight:1.65 }}>{styleResult.third_piece}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════
              TAB: FABRIC SCANNER
          ══════════════════════════════════════════ */}
          {tab === "fabric" && (
            <div>
              <input type="file" accept="image/*" ref={fabricRef} onChange={handleFabricUpload} style={{ display:"none" }} />

              {!fabricThumb ? (
                <DropZone
                  onClick={() => fabricRef.current?.click()}
                  accent="#38bdf8"
                  icon={ScanLine}
                  title="Upload a fabric close-up"
                  subtitle="High-resolution close-ups give the most accurate identification"
                />
              ) : (
                <div style={{ display:"flex", gap:26, flexWrap:"wrap" }}>
                  {/* Preview */}
                  <div style={{ width:180, flexShrink:0 }}>
                    <div style={{
                      borderRadius:16, overflow:"hidden",
                      border:"1px solid rgba(56,189,248,0.35)",
                      boxShadow:"0 8px 30px rgba(0,0,0,0.6)",
                    }}>
                      <img src={fabricThumb} alt="Fabric" style={{ width:"100%", display:"block" }} />
                    </div>
                    <button
                      onClick={() => { setFabricThumb(null); setFabricResult(null); }}
                      style={{
                        width:"100%", padding:"9px", marginTop:10,
                        background:"transparent", color:T2,
                        border:`1px solid ${BD}`, borderRadius:10, cursor:"pointer",
                        fontSize:12, fontFamily:"inherit",
                        display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                      }}>
                      <RefreshCcw size={12} /> Upload Different
                    </button>
                  </div>

                  {/* Results */}
                  <div style={{ flex:1, minWidth:200 }}>
                    {loadingFabric ? <Spinner color="#38bdf8" label="Scanning fabric structure…" status={loadingStatus} /> : fabricResult && (
                      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                        {/* Fabric name + confidence */}
                        <div style={{
                          display:"flex", alignItems:"flex-start", justifyContent:"space-between",
                          gap:12, paddingBottom:18, borderBottom:`1px solid ${BD}`,
                        }}>
                          <div>
                            <div style={{ fontSize:22, fontWeight:800, color:T1, marginBottom:4 }}>{fabricResult.fabric}</div>
                          </div>
                          <span style={{
                            fontSize:10, fontWeight:700, letterSpacing:"0.1em",
                            padding:"6px 14px", borderRadius:20, whiteSpace:"nowrap", flexShrink:0,
                            color: fabricResult.confidence === "High" ? "#4ade80" : fabricResult.confidence === "Medium" ? G : "#f87171",
                            background: fabricResult.confidence === "High" ? "rgba(74,222,128,0.1)" : fabricResult.confidence === "Medium" ? GD : "rgba(248,113,113,0.1)",
                            border: `1px solid ${fabricResult.confidence === "High" ? "rgba(74,222,128,0.3)" : fabricResult.confidence === "Medium" ? GB : "rgba(248,113,113,0.3)"}`,
                          }}>{fabricResult.confidence} Confidence</span>
                        </div>

                        {/* Info cards */}
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                          <InfoCard title="Characteristics" items={fabricResult.characteristics} accent="#38bdf8" />
                          <InfoCard title="Care Guide" items={fabricResult.care} accent="#38bdf8" />
                        </div>

                        {/* Styling tip */}
                        {fabricResult.styling_tip && (
                          <div style={{
                            background:"rgba(56,189,248,0.06)", padding:"16px 18px",
                            borderLeft:"2px solid #38bdf8", borderRadius:"0 12px 12px 0",
                          }}>
                            <div style={{ fontSize:10, fontWeight:700, color:"#38bdf8", letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:8 }}>
                              💡 Styling Tip
                            </div>
                            <div style={{ fontSize:13, color:T1, lineHeight:1.7 }}>{fabricResult.styling_tip}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
