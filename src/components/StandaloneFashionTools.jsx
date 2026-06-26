import { useState, useRef, useEffect, useCallback } from "react";
import ColorThief from "colorthief";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useTryOnStore } from "../store/tryOnStore";
import {
  UploadCloud, RefreshCcw, Search, Sparkles, Layers, ScanLine,
  ChevronRight, X, Palette, CloudSun, MapPin, Zap, CheckCircle2
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
const CACHE_KEY     = 'fv_weather_cache';
const CACHE_EXPIRY  = 5 * 60 * 1000;

function getCachedWeather() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (!cached) return null;
    if (Date.now() - cached.timestamp > CACHE_EXPIRY) return null;
    return cached.data;
  } catch { return null; }
}

function setCachedWeather(data) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    timestamp: Date.now(),
    data
  }));
}

const weatherEmoji = {
  Clear:         '☀️',
  Clouds:        '⛅',
  Rain:          '🌧️',
  Drizzle:       '🌦️',
  Thunderstorm:  '⛈️',
  Mist:          '🌫️',
  Haze:          '🌫️',
  Fog:           '🌁',
  Snow:          '❄️',
  Smoke:         '💨'
};

function getOutfitProfile(weather) {
  const { temp, condition } = weather;

  let tempTier;
  if (temp >= 35)      tempTier = 'scorching';
  else if (temp >= 28) tempTier = 'hot';
  else if (temp >= 22) tempTier = 'warm';
  else if (temp >= 15) tempTier = 'mild';
  else if (temp >= 8)  tempTier = 'cool';
  else                 tempTier = 'cold';

  let conditionType;
  const c = condition.toLowerCase();
  if (['rain','drizzle','thunderstorm'].includes(c)) conditionType = 'rainy';
  else if (['mist','haze','fog','smoke'].includes(c)) conditionType = 'hazy';
  else if (c === 'clouds')  conditionType = 'cloudy';
  else if (c === 'clear')   conditionType = 'sunny';
  else                      conditionType = 'sunny';

  const rules = {
    scorching: {
      fabrics:    ['cotton', 'linen', 'chambray'],
      avoid:      ['polyester', 'wool', 'denim'],
      colors:     ['white', 'light', 'pastel', 'beige'],
      types:      ['t-shirt', 'shorts', 'kurta', 'linen shirt', 't shirt'],
      tip:        'Go ultra-light — breathable fabrics only',
      emoji:      '🌡️'
    },
    hot: {
      fabrics:    ['cotton', 'linen', 'rayon'],
      avoid:      ['synthetic', 'wool'],
      colors:     ['light', 'neutral', 'pastel'],
      types:      ['t-shirt', 'shirt', 'kurta', 'chinos', 'cotton trouser', 't shirt'],
      tip:        'Light colors reflect heat — stay cool and sharp',
      emoji:      '☀️'
    },
    warm: {
      fabrics:    ['cotton', 'blend', 'rayon'],
      avoid:      ['heavy wool'],
      colors:     ['any', 'earth tones', 'navy', 'olive'],
      types:      ['shirt', 'trousers', 'jeans', 'kurta', 'polo'],
      tip:        'Perfect weather — almost anything works',
      emoji:      '🌤️'
    },
    mild: {
      fabrics:    ['cotton blend', 'light denim', 'flannel'],
      avoid:      [],
      colors:     ['earth tones', 'dark', 'rich colors'],
      types:      ['full sleeve shirt', 'jeans', 'chinos', 'light jacket', 'shirt', 'jacket'],
      tip:        'Layer up slightly — mornings can be cool',
      emoji:      '⛅'
    },
    cool: {
      fabrics:    ['denim', 'flannel', 'knit', 'wool blend'],
      avoid:      ['thin cotton only'],
      colors:     ['dark', 'jewel tones', 'rich'],
      types:      ['jacket', 'sweater', 'full sleeve', 'jeans', 'trousers', 'hoodie', 'sweatshirt'],
      tip:        'Time for layers — jackets and full sleeves',
      emoji:      '🌥️'
    },
    cold: {
      fabrics:    ['wool', 'fleece', 'heavy knit', 'velvet'],
      avoid:      ['thin fabrics', 'shorts'],
      colors:     ['dark', 'deep', 'warm tones'],
      types:      ['sweater', 'jacket', 'coat', 'thermal', 'heavy trouser', 'hoodie'],
      tip:        'Bundle up — warmth over style today',
      emoji:      '🧥'
    }
  };

  if (conditionType === 'rainy') {
    return {
      ...rules[tempTier],
      fabrics: ['quick-dry', 'synthetic', 'nylon'],
      colors:  ['dark', 'navy', 'black', 'olive'],
      tip:     'Rain alert — pick dark, quick-dry fabrics',
      emoji:   '🌧️',
      alert:   'Rain detected — avoid light colors and delicate fabrics'
    };
  }
  return { ...rules[tempTier], conditionType, alert: null };
}

function matchProductsToWeather(allProducts, outfitProfile) {
  const { types, fabrics, colors, avoid = [] } = outfitProfile;
  
  // Shuffle products to ensure diversity if scores are tied
  const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
  
  const scored = shuffled.map(product => {
    let score = Math.random() * 1.5; // Base random diversity
    const nameLower     = (product.name || '').toLowerCase();
    const categoryLower = (product.category || '').toLowerCase();
    const fabricLower   = (product.fabric || '').toLowerCase();
    const colorLower    = (product.color || '').toLowerCase();

    // Check avoids
    let shouldAvoid = false;
    avoid.forEach(a => {
      if (fabricLower.includes(a) || nameLower.includes(a) || categoryLower.includes(a)) shouldAvoid = true;
    });
    if (shouldAvoid) score -= 20;

    types.forEach(type => {
      if (nameLower.includes(type) || categoryLower.includes(type)) score += 5;
    });
    fabrics.forEach(fabric => {
      if (fabricLower.includes(fabric) || nameLower.includes(fabric)) score += 3;
    });
    colors.forEach(c => {
      if (colorLower.includes(c) || nameLower.includes(c) || c === 'any') score += 2;
    });

    return { ...product, weatherScore: score };
  });

  scored.sort((a, b) => b.weatherScore - a.weatherScore);
  
  const getPseudoCat = (name, cat) => {
    const str = (name + " " + cat).toLowerCase();
    if (/pant|trouser|jean|short|skirt|chinos/i.test(str)) return 'bottom';
    if (/jacket|coat|hoodie|sweater|cardigan|blazer/i.test(str)) return 'outerwear';
    if (/shoe|sneaker|boot|sandal|heel|loafer/i.test(str)) return 'shoes';
    if (/bag|belt|hat|cap|sunglass/i.test(str)) return 'accessories';
    return 'top'; // Default everything else to top
  };

  const finalSelection = [];
  const categoryCounts = { top: 0, bottom: 0, outerwear: 0, shoes: 0, accessories: 0 };
  
  // Pass 1: Try to get at least 1 top and 1 bottom, and diverse items
  for (const item of scored) {
    if (item.weatherScore < 0) continue; 
    const pCat = getPseudoCat(item.name, item.category);
    
    let limit = pCat === 'top' ? 2 : 1; 
    
    if (categoryCounts[pCat] < limit) {
      finalSelection.push({ ...item, matchPercent: Math.min(99, Math.max(75, Math.floor(item.weatherScore * 6 + 60))) });
      categoryCounts[pCat]++;
    }
    if (finalSelection.length >= 5) break;
  }
  
  // Pass 2: Fallback if we didn't find 5 items (fill with highest scoring remaining)
  if (finalSelection.length < 5) {
    for (const item of scored) {
      if (!finalSelection.find(i => i.id === item.id) && item.weatherScore >= 0) {
        finalSelection.push({ ...item, matchPercent: Math.min(99, Math.max(75, Math.floor(item.weatherScore * 6 + 50))) });
        if (finalSelection.length >= 5) break;
      }
    }
  }

  return finalSelection.slice(0, 5);
}



// ── Shared UI Components ─────────────────────────────────────────── */
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

function ScoreRing({ score, max = 10, size = 76 }) {
  const color = score >= 8 ? "#4ade80" : score >= 6 ? G : "#f87171";
  const innerSize = size * (60/76);
  const fontSizeNum = size * (22/76);
  const fontSizeMax = size * (9/76);
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%", flexShrink:0,
      background:`conic-gradient(${color} ${score/max*360}deg, rgba(255,255,255,0.06) 0)`,
      display:"flex", alignItems:"center", justifyContent:"center",
      boxShadow:`0 0 ${size*0.3}px ${color}30`,
    }}>
      <div style={{
        width:innerSize, height:innerSize, borderRadius:"50%", background:SURF,
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      }}>
        <span style={{ fontSize:fontSizeNum, fontWeight:800, color:T1, lineHeight:1 }}>{score}</span>
        <span style={{ fontSize:fontSizeMax, color:T2, letterSpacing:"0.1em" }}>/ {max}</span>
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
  { id:"weather", label:"Outfit Weather",  Icon:CloudSun, accent:"#D4A032" },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function StandaloneFashionTools() {
  const [tab, setTab]       = useState("color");
  const [loadingColor, setLoadingColor] = useState(false);
  const [loadingStyle, setLoadingStyle] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingWeatherAI, setLoadingWeatherAI] = useState(false);
  const [weatherAIProfile, setWeatherAIProfile] = useState(null);
  const [error, setError]   = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(null); // live countdown text
  const [catalog, setCatalog] = useState([]);

  useEffect(() => {
    supabase.from("products")
      .select("id, name, brand, price, category, product_colors(image_url, color_name)")
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
      const isTop1 = /top|upper|shirt|t-shirt|jacket|blazer|polo|sweatshirt|hoodie/i.test((p1.category||'') + ' ' + (p1.name||''));
      const isBot1 = /bottom|pant|jean|trouser|skirt|shorts|cargo/i.test((p1.category||'') + ' ' + (p1.name||''));
      const isTop2 = /top|upper|shirt|t-shirt|jacket|blazer|polo|sweatshirt|hoodie/i.test((p2.category||'') + ' ' + (p2.name||''));
      const isBot2 = /bottom|pant|jean|trouser|skirt|shorts|cargo/i.test((p2.category||'') + ' ' + (p2.name||''));
      
      const cat1 = isTop1 ? 'upper' : (isBot1 ? 'bottom' : 'other');
      const cat2 = isTop2 ? 'upper' : (isBot2 ? 'bottom' : 'other');

      const sys = `You are a fashion compatibility engine for an e-commerce site. You will receive two clothing items as compact JSON. Respond with ONLY raw JSON, no markdown fences, no preamble, matching this exact schema:

{
  "ratingA": <integer 1-10, rating item A's style and versatility>,
  "ratingB": <integer 1-10, rating item B's style and versatility>,
  "verdict": "<2-4 word label about compatibility>",
  "reasoning": "<1-2 sentences, max 30 words explaining ratings>",
  "anchorItem": "<'A' or 'B' - pick the higher rated item as the anchor>",
  "completionCategory": "<the category to complete the look, e.g. 'bottom', 'footwear', 'jacket', 'upper'>",
  "completionColorFamily": "<single color family word to filter by, e.g. 'neutral', 'earth-tone'>",
  "completionOccasion": "<occasion tag to filter by, e.g. 'formal', 'casual'>"
}

RULES:
- Always rate BOTH items individually.
- Pick the stronger piece as the anchorItem (A or B).
- completionCategory must logically complete an outfit based on the anchor item. You MUST choose from ONLY these available catalog categories: 'upper', 'bottom', or 'jacket'. DO NOT suggest footwear, watches, bags, or accessories because they are completely out of stock.

Be decisive. No hedging language. No markdown.`;

      const compactPayload = {
        itemA: { name: p1.name, category: p1.category, color: p1.color || "unknown", price: p1.price },
        itemB: { name: p2.name, category: p2.category, color: p2.color || "unknown", price: p2.price }
      };

      let res;
      try {
        res = await geminiCall(sys, JSON.stringify(compactPayload), [], null, setLoadingStatus, { maxOutputTokens: 250, temperature: 0.4 });
      } catch (err) {
        console.warn("AI Style Matcher failed, falling back to local...", err);
        res = {
          ratingA: 8,
          ratingB: 6,
          verdict: "Good Combination",
          reasoning: "These two pieces complement each other well, offering a balanced and contemporary silhouette.",
          anchorItem: "A",
          completionCategory: cat1 === 'upper' ? 'bottom' : 'upper',
          completionColorFamily: 'neutral',
          completionOccasion: 'smart-casual'
        };
      }
      
      const colorFam = res.completionColorFamily ? res.completionColorFamily.toLowerCase() : 'neutral';
      let targetCat = res.completionCategory ? res.completionCategory.toLowerCase() : 'jacket';
      const occ = res.completionOccasion ? res.completionOccasion.toLowerCase() : 'smart-casual';

      // FORCE correct opposite category if they input the same type
      if (cat1 === cat2 && cat1 !== 'other') {
         targetCat = cat1 === 'upper' ? 'bottom' : 'upper';
      }

      let recommendedProducts = [];
      let professionalFallbackText = `To elevate this look, we recommend anchoring the outfit with a sophisticated ${colorFam} ${targetCat}. This addition flawlessly ties together the ${occ} aesthetic.`;

      // Find matching products from Supabase
      try {
          let query = supabase.from('products').select('id, name, brand, price, product_type, product_colors(image_url, color_name)');
          
          if (/bottom|pant|jean|trouser|skirt|shorts/i.test(targetCat)) {
            query = query.in('product_type', ['Jeans', 'Trousers', 'Cargo', 'Shorts', 'Track Pants']);
          } else if (/top|upper|shirt|t-shirt|jacket|blazer|sweatshirt/i.test(targetCat)) {
            query = query.in('product_type', ['T-Shirts', 'Casual Shirts', 'Formal Shirts', 'Sweatshirts', 'Jackets', 'Blazers']);
          } else if (/footwear|shoe|sneaker|heel|sandal/i.test(targetCat)) {
            query = query.or('name.ilike.%shoe%,name.ilike.%sneaker%,name.ilike.%loafer%,name.ilike.%boot%');
          } else if (/accessory|watch|bag|belt/i.test(targetCat)) {
            query = query.or('name.ilike.%watch%,name.ilike.%belt%,name.ilike.%bag%');
          } else {
             query = query.ilike('name', `%${targetCat}%`);
          }

          // Exclude the currently selected items to avoid redundant recommendations
          let { data: matches } = await query.eq('is_active', true).neq('id', p1.id).neq('id', p2.id).limit(30);
          
          // Fallback if the catalog doesn't have the AI's requested category (e.g. no shoes in DB)
          if (!matches || matches.length === 0) {
            const { data: fallbackMatches } = await supabase.from('products').select('id, name, brand, price, product_type, product_colors(image_url, color_name)').in('product_type', ['T-Shirts', 'Casual Shirts', 'Jackets', 'Jeans', 'Trousers']).eq('is_active', true).neq('id', p1.id).neq('id', p2.id).limit(20);
            matches = fallbackMatches;
          }

          if (matches && matches.length > 0) {
            // Sort by color match
            const sortedMatches = matches.sort((a, b) => {
               const aColorMatch = a.product_colors?.some(c => c.color_name?.toLowerCase().includes(colorFam));
               const bColorMatch = b.product_colors?.some(c => c.color_name?.toLowerCase().includes(colorFam));
               return (bColorMatch ? 1 : 0) - (aColorMatch ? 1 : 0);
            });
            recommendedProducts = sortedMatches.slice(0, 3).map(p => ({
              id: p.id,
              name: p.name,
              brand: p.brand,
              price: p.price,
              category: p.product_type,
              image: p.product_colors?.[0]?.image_url || ""
            }));
          }
      } catch (err) {
         console.error("Failed to fetch recommended products", err);
      }

      setStyleResult({
        ratingA: res.ratingA,
        ratingB: res.ratingB,
        anchorItem: res.anchorItem,
        verdict: res.verdict,
        reason: res.reasoning,
        third_piece: professionalFallbackText,
        recommendedProducts: recommendedProducts
      });
    } catch (err) {
      console.warn("Critical failure in Style Matcher:", err);
      setError("An unexpected error occurred. Please try again.");
    }
    setLoadingStyle(false); setLoadingStatus(null);
  };

  /* ── WEATHER MATCHER state ─────────────────────────── */
  const [weatherData, setWeatherData] = useState(null);
  const [weatherError, setWeatherError] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [weatherProducts, setWeatherProducts] = useState([]);

  const loadWeatherProducts = useCallback(async (weather, currentCatalog) => {
    if (!currentCatalog || currentCatalog.length === 0) return;
    setLoadingWeatherAI(true);
    setWeatherAIProfile(null);
    try {
      const lightweightCatalog = currentCatalog.map(p => ({ id: p.id, name: p.name, category: p.category, fabric: p.fabric, color: p.color }));
      const sysPrompt = `You are a professional fashion stylist. Given the current weather and a catalog of clothing items, select exactly 5 items to build a diverse, stylish outfit perfect for the weather. Ensure you include a top and a bottom.
Return ONLY valid JSON matching this exact format:
{
  "curated_product_ids": ["id1", "id2", "id3", "id4", "id5"],
  "hero_piece_id": "id1",
  "matches": [ { "id": "id1", "matchPercent": 95 } ],
  "stylist_verdict": "Short stylish quote",
  "weather_alert": "" 
}`;
      const prompt = `Weather: ${weather.temp}°C, feels like ${weather.feelsLike}°C. Condition: ${weather.condition} (${weather.description}). Catalog: ${JSON.stringify(lightweightCatalog)}`;
      
      const res = await geminiCall(sysPrompt, prompt, [], null, setLoadingStatus);
      
      if (res && res.curated_product_ids && res.curated_product_ids.length > 0) {
        const selected = res.curated_product_ids.map(id => {
          const prod = currentCatalog.find(p => p.id === id);
          if (!prod) return null;
          const matchInfo = res.matches?.find(m => m.id === id);
          return { ...prod, matchPercent: matchInfo ? matchInfo.matchPercent : 95 };
        }).filter(Boolean);
        
        const heroIndex = selected.findIndex(p => p.id === res.hero_piece_id);
        if (heroIndex > 0) {
          const hero = selected.splice(heroIndex, 1)[0];
          selected.unshift(hero);
        }
        
        setWeatherProducts(selected);
        const alertMsg = (res.weather_alert === "null" || !res.weather_alert) ? null : res.weather_alert;
        setWeatherAIProfile({ tip: res.stylist_verdict, alert: alertMsg });
      } else {
        throw new Error("Invalid AI response");
      }
    } catch (err) {
      console.warn("AI Matcher failed, falling back to basic rules:", err);
      const profile = getOutfitProfile(weather);
      setWeatherProducts(matchProductsToWeather(currentCatalog, profile));
      setWeatherAIProfile(profile);
    }
    setLoadingWeatherAI(false);
  }, []);

  const fetchWeatherApi = async (url) => {
    setLoadingWeather(true); setWeatherError(null); setLocationDenied(false); setWeatherData(null);
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.cod !== 200) throw new Error('City not found');
      const w = {
        city:        data.name,
        temp:        Math.round(data.main.temp),
        feelsLike:   Math.round(data.main.feels_like),
        humidity:    data.main.humidity,
        condition:   data.weather[0].main,
        description: data.weather[0].description,
        windSpeed:   Math.round(data.wind.speed)
      };
      setWeatherData(w);
      setCachedWeather(w);
      loadWeatherProducts(w, catalog);
    } catch (err) {
      setWeatherError(err.message);
    }
    setLoadingWeather(false);
  };

  const fetchWeather = (lat, lon) => {
    const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    fetchWeatherApi(url);
  };

  const fetchWeatherByCity = (cityName) => {
    if (!cityName.trim()) return;
    const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`;
    fetchWeatherApi(url);
  };

  const startGeolocation = () => {
    setLoadingWeather(true); setWeatherError(null); setLocationDenied(false);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeather(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        setLoadingWeather(false);
        setLocationDenied(true);
      },
      { timeout: 8000, maximumAge: 300000 }
    );
  };

  useEffect(() => {
    if (tab === "weather" && !weatherData && !loadingWeather && !weatherError) {
      if (catalog.length === 0) return; // wait for catalog
      if (!locationDenied) {
        setLocationDenied(true);
      }
    }
  }, [tab, catalog, weatherData, loadingWeather, locationDenied, weatherError]);

  const accentOf = TABS.find(t => t.id === tab)?.accent || G;

  return (
    <div style={{ fontFamily:"'Outfit', sans-serif" }}>

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
            {tab === "weather" && "🌤️ Outfit Weather Matcher"}
          </div>
          <div style={{ fontSize:13, color:T2, lineHeight:1.5 }}>
            {tab === "color"  && "Upload any outfit photo to extract its dominant colors and find matching catalog pieces instantly."}
            {tab === "style"  && "Pick two products and let AI rate how well they pair together — get a compatibility score and styling tips."}
            {tab === "weather" && "Dressed for your weather — automatically."}
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
                     <div style={{ padding:"22px 26px", background:`linear-gradient(90deg,rgba(167,139,250,0.03),transparent)`, borderBottom:`1px solid ${BD}`, display:"flex", flexDirection:"column", gap:16 }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width: "100%", maxWidth: "400px", margin: "0 auto" }}>
                           <div style={{ display:"flex", flexDirection: "column", alignItems:"center", gap: 12, opacity: styleResult.anchorItem === 'A' ? 1 : 0.5, transition: "opacity 0.3s" }}>
                              <ScoreRing score={styleResult.ratingA || 0} size={56} />
                              <div style={{ textAlign: "center" }}>
                                 <div style={{ fontSize:10, fontWeight:700, color:T2, textTransform:"uppercase" }}>Item A</div>
                                 <div style={{ fontSize:12, color:T1, marginTop:4 }}>{styleResult.anchorItem === 'A' ? "🏆 Best Choice" : "Alternative"}</div>
                              </div>
                           </div>
                           <div style={{ fontSize:16, fontWeight:800, color:T2, opacity: 0.5 }}>VS</div>
                           <div style={{ display:"flex", flexDirection: "column", alignItems:"center", gap: 12, opacity: styleResult.anchorItem === 'B' ? 1 : 0.5, transition: "opacity 0.3s" }}>
                              <ScoreRing score={styleResult.ratingB || 0} size={56} />
                              <div style={{ textAlign: "center" }}>
                                 <div style={{ fontSize:10, fontWeight:700, color:T2, textTransform:"uppercase" }}>Item B</div>
                                 <div style={{ fontSize:12, color:T1, marginTop:4 }}>{styleResult.anchorItem === 'B' ? "🏆 Best Choice" : "Alternative"}</div>
                              </div>
                           </div>
                        </div>
                     </div>
                  <div style={{ padding:"22px 26px" }}>
                    <p style={{ margin:"0 0 20px", fontSize:14, color:T1, lineHeight:1.8 }}>{styleResult.reason}</p>
                    <div style={{
                      background:"rgba(167,139,250,0.06)", padding:"16px 18px",
                      borderLeft:"2px solid #a78bfa", borderRadius:"0 12px 12px 0",
                    }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"#a78bfa", letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:12 }}>🧩 Complete the Look</div>
                      {styleResult.recommendedProducts && styleResult.recommendedProducts.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {styleResult.recommendedProducts.map(prod => (
                            <div key={prod.id} style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 8 }}>
                              <ProductRow product={prod} onTryOn={handleTryOn} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize:13, color:T1, lineHeight:1.65, fontStyle: "italic" }}>{styleResult.third_piece}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════
              TAB: WEATHER MATCHER
          ══════════════════════════════════════════ */}
          {tab === "weather" && (
            <div>
              {loadingWeather && (
                <Spinner color="#D4A032" label="Detecting your location..." status="Fetching live weather data" />
              )}

              {locationDenied && !loadingWeather && (
                <div style={{ maxWidth: 380, margin: "20px auto", animation: "fadeIn 0.5s ease-out" }}>
                  <div style={{
                    background: "rgba(10, 6, 0, 0.7)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
                    border: "1px solid rgba(212,160,50,0.15)", borderRadius: 24, padding: "32px 24px",
                    boxShadow: "0 16px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
                    textAlign: "center", position: "relative", overflow: "hidden"
                  }}>
                    <div style={{ position: "absolute", top: -50, left: "50%", transform: "translateX(-50%)", width: 150, height: 150, background: "radial-gradient(circle, rgba(212,160,50,0.15) 0%, transparent 70%)", filter: "blur(20px)", zIndex: 0, pointerEvents: "none" }} />
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <div style={{ width: 52, height: 52, margin: "0 auto 16px", background: "rgba(212,160,50,0.08)", border: "1px solid rgba(212,160,50,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 24px rgba(212,160,50,0.1)" }}>
                        <MapPin size={22} color="#D4A032" />
                      </div>
                      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: T1, margin: "0 0 8px", letterSpacing: "0.02em" }}>Set Your Location</h3>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: T2, lineHeight: 1.5, margin: "0 0 24px", padding: "0 10px" }}>We need your city to perfectly curate an outfit for today's climate.</p>
                      
                      <div style={{ position: "relative", marginBottom: 12 }}>
                        <div style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                          <Search size={18} color="rgba(212,160,50,0.5)" />
                        </div>
                        <input 
                          value={cityInput}
                          onChange={e => setCityInput(e.target.value)}
                          placeholder="e.g. Mumbai, Delhi, Paris..."
                          style={{
                            width: "100%", padding: "14px 16px 14px 44px", borderRadius: 16,
                            background: "rgba(0,0,0,0.4)", border: "1px solid rgba(212,160,50,0.2)",
                            color: T1, fontSize: 14, outline: "none", fontFamily: "'Inter', sans-serif",
                            transition: "all 0.3s ease", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)"
                          }}
                          onFocus={e => { e.currentTarget.style.border = "1px solid rgba(212,160,50,0.6)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(212,160,50,0.1), inset 0 2px 4px rgba(0,0,0,0.2)"; }}
                          onBlur={e => { e.currentTarget.style.border = "1px solid rgba(212,160,50,0.2)"; e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.2)"; }}
                          onKeyDown={e => e.key === "Enter" && fetchWeatherByCity(cityInput)}
                        />
                      </div>
                      <button 
                        onClick={() => fetchWeatherByCity(cityInput)}
                        disabled={!cityInput.trim()}
                        style={{
                          width: "100%", padding: "14px", borderRadius: 16, background: cityInput.trim() ? "linear-gradient(135deg, #e8b840 0%, #D4A032 100%)" : "rgba(212,160,50,0.1)",
                          color: cityInput.trim() ? "#0d0700" : "rgba(212,160,50,0.4)", border: "none", fontSize: 14, fontWeight: 700, fontFamily: "'Inter', sans-serif",
                          cursor: cityInput.trim() ? "pointer" : "not-allowed", transition: "all 0.3s ease", boxShadow: cityInput.trim() ? "0 8px 24px rgba(212,160,50,0.25)" : "none",
                          letterSpacing: "0.02em"
                        }}
                        onMouseEnter={e => { if(cityInput.trim()) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(212,160,50,0.35)"; } }}
                        onMouseLeave={e => { if(cityInput.trim()) { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(212,160,50,0.25)"; } }}
                      >Discover Curated Picks</button>
                      
                      <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
                        <button 
                          onClick={startGeolocation}
                          style={{ background: "transparent", border: "none", color: "#D4A032", fontSize: 13, cursor: "pointer", fontFamily: "'Inter', sans-serif", fontWeight: 500, letterSpacing: "0.02em" }}
                        >
                          <span style={{ borderBottom: "1px solid rgba(212,160,50,0.4)", paddingBottom: 2 }}>Use my current location</span>
                        </button>
                      </div>
                      
                      {weatherError && (
                        <div style={{ margin: "20px auto 0", padding: "12px 18px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, color: "#fca5a5", fontSize: 13, display: "inline-block", animation: "fadeIn 0.3s ease" }}>
                          City not found — please check the spelling
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {weatherError && !locationDenied && !loadingWeather && (
                <div style={{ maxWidth: 400, margin: "40px auto", textAlign: "center", padding: "40px 32px", background: "rgba(10, 6, 0, 0.7)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(212,160,50,0.15)", borderRadius: 24 }}>
                  <CloudSun size={36} color="rgba(212,160,50,0.5)" style={{ margin: "0 auto 16px" }} />
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: T1, margin: "0 0 8px" }}>Weather Unavailable</h3>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: T2, lineHeight: 1.6, margin: "0 0 24px" }}>We couldn't connect to the weather service right now.</p>
                  <button 
                    onClick={startGeolocation}
                    style={{
                      padding: "12px 28px", borderRadius: 20, background: "rgba(212,160,50,0.1)",
                      border: `1px solid rgba(212,160,50,0.3)`, color: G, cursor: "pointer", fontWeight: 600,
                      fontFamily: "'Inter', sans-serif", transition: "all 0.2s ease"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,160,50,0.2)"; e.currentTarget.style.transform = "translateY(-2px)" }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(212,160,50,0.1)"; e.currentTarget.style.transform = "none" }}
                  >Try Again</button>
                </div>
              )}

              {weatherData && !loadingWeather && loadingWeatherAI && (
                <div style={{ padding: "60px 0" }}>
                  <Spinner color="#D4A032" label="AI Stylist curating your perfect outfit..." status={loadingStatus} />
                </div>
              )}

              {weatherData && !loadingWeather && !loadingWeatherAI && (
                <div style={{ animation: "fadeIn 0.5s ease-out" }}>
                  <style>{`
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                    .fv-weather-card { position: relative; overflow: hidden; }
                    .fv-weather-card::before { content: ''; position: absolute; inset: -50%; background: radial-gradient(circle at top right, rgba(212,160,50,0.15) 0%, transparent 60%); filter: blur(40px); z-index: 0; pointer-events: none; }
                    .fv-item-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; position: relative; overflow: hidden; }
                    .fv-item-card:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px #D4A032; }
                    .fv-item-card::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%); opacity: 0; transition: opacity 0.3s; pointer-events: none; }
                    .fv-item-card:hover::after { opacity: 1; }
                  `}</style>
                  
                  {/* Premium Weather Header */}
                  <div className="fv-weather-card" style={{
                    background: "rgba(10, 6, 0, 0.6)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid rgba(212,160,50,0.15)", borderRadius: 20, padding: "28px 32px", marginBottom: 32,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
                  }}>
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <MapPin size={16} color="#D4A032" />
                            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#D4A032" }}>
                              {weatherData.city}
                            </span>
                          </div>
                          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 48, fontWeight: 700, color: T1, lineHeight: 1.1, display: "flex", alignItems: "center", gap: 12 }}>
                            {weatherData.temp}°C 
                            <span style={{ fontSize: 40, filter: "drop-shadow(0 4px 12px rgba(255,255,255,0.15))" }}>{weatherEmoji[weatherData.condition] || '☀️'}</span>
                          </div>
                          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: T2, marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
                            <span>Feels like {weatherData.feelsLike}°C</span>
                            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(212,160,50,0.4)" }} />
                            <span>{weatherData.description}</span>
                          </div>
                        </div>
                        
                        <div style={{ textAlign: "right" }}>
                          <button onClick={startGeolocation} style={{ background: "transparent", border: `1px solid rgba(212,160,50,0.3)`, color: "#D4A032", padding: "8px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,160,50,0.1)" }} onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}>
                            <RefreshCcw size={14} /> Update
                          </button>
                        </div>
                      </div>

                      <div style={{ background: "linear-gradient(90deg, rgba(212,160,50,0.15) 0%, transparent 100%)", borderLeft: "4px solid #D4A032", borderRadius: "4px 12px 12px 4px", padding: "16px 20px", marginTop: 24, display: "flex", gap: 16, alignItems: "center" }}>
                        <Sparkles size={24} color="#D4A032" style={{ flexShrink: 0 }} />
                        <div>
                          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "#D4A032", textTransform: "uppercase", marginBottom: 4 }}>Stylist Verdict</div>
                          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: T1, fontStyle: "italic", lineHeight: 1.4 }}>
                            "{weatherAIProfile?.tip || getOutfitProfile(weatherData).tip}"
                          </div>
                        </div>
                      </div>

                      {(weatherAIProfile?.alert || getOutfitProfile(weatherData).alert) && (
                        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "12px 16px", marginTop: 12, fontSize: 13, color: "#fca5a5", display: "flex", alignItems: "center", gap: 8, fontWeight: 500 }}>
                          {weatherAIProfile?.alert || getOutfitProfile(weatherData).alert}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, padding: "0 4px" }}>
                    <div style={{ fontSize: 16, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: T1, letterSpacing: "0.05em" }}>Curated For This Weather</div>
                    <div style={{ fontSize: 12, color: T2, display: "flex", alignItems: "center", gap: 6 }}>
                      <CheckCircle2 size={14} color="#4ade80" /> {weatherProducts.length} items matched
                    </div>
                  </div>

                  {/* Asymmetrical Layout for Products */}
                  {weatherProducts.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gridAutoRows: "240px", gap: 16, marginBottom: 32 }}>
                      {weatherProducts.map((p, i) => (
                        <div key={p.id} className="fv-item-card" onClick={() => handleTryOn(p)} style={{
                          gridColumn: i === 0 ? "1 / span 1" : "auto",
                          gridRow: i === 0 ? "1 / span 2" : "auto",
                          background: CARD, borderRadius: 16, border: `1px solid ${BD}`, display: "flex", flexDirection: "column"
                        }}>
                          <div style={{ flex: 1, position: "relative", overflow: "hidden", borderTopLeftRadius: 16, borderTopRightRadius: 16, background: "#ffffff", padding: "16px" }}>
                            <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "contain", mixBlendMode: "multiply" }} />
                            <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(10,6,0,0.8)", backdropFilter: "blur(8px)", padding: "4px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700, color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)", display: "flex", alignItems: "center", gap: 4 }}>
                              <Zap size={10} /> {p.matchPercent || 92}% Match
                            </div>
                            {i === 0 && (
                              <div style={{ position: "absolute", top: 12, left: 12, background: G, color: "#000", padding: "4px 10px", borderRadius: 12, fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                                Hero Piece
                              </div>
                            )}
                          </div>
                          <div style={{ padding: i === 0 ? "20px" : "14px 16px", background: "linear-gradient(to bottom, transparent, rgba(10,6,0,0.95) 20%)", zIndex: 1, position: "relative", borderTop: `1px solid rgba(212,160,50,0.15)` }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: T2, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{p.category || 'Apparel'}</div>
                            <div style={{ fontSize: i === 0 ? 16 : 14, fontWeight: 600, color: T1, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: i === 0 ? "normal" : "nowrap", display: i === 0 ? "-webkit-box" : "block", WebkitLineClamp: i === 0 ? 2 : 1, WebkitBoxOrient: "vertical", lineHeight: 1.3 }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: i === 0 ? 18 : 15, fontWeight: 700, color: G }}>₹{p.price}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ textAlign: "center", borderTop: `1px solid rgba(212,160,50,0.15)`, marginTop: 8, paddingTop: 32, paddingBottom: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: T2, fontStyle: "italic" }}>
                      Traveling somewhere else?
                    </div>
                    <button 
                      onClick={() => { setLocationDenied(true); setWeatherError(null); }}
                      style={{ 
                        background: "linear-gradient(135deg, rgba(212,160,50,0.15) 0%, rgba(212,160,50,0.05) 100%)", 
                        border: `1px solid rgba(212,160,50,0.3)`, 
                        color: G, padding: "12px 28px", borderRadius: 30, fontSize: 14, fontWeight: 600, 
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", backdropFilter: "blur(8px)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(212,160,50,0.25) 0%, rgba(212,160,50,0.1) 100%)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(212,160,50,0.2)"; e.currentTarget.style.borderColor = "rgba(212,160,50,0.6)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(212,160,50,0.15) 0%, rgba(212,160,50,0.05) 100%)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)"; e.currentTarget.style.borderColor = "rgba(212,160,50,0.3)"; }}
                    >
                      <Search size={16} /> Search City Manually
                    </button>
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
