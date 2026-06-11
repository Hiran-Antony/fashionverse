import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Bot, Send, ShoppingBag, User, Camera, RefreshCcw, Wand2, Star, Zap, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../store/cartStore';
import { useTryOnStore } from '../store/tryOnStore';
import { useStylistStore } from '../store/stylistStore';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

// ─── BRAND TOKENS ─────────────────────────────────────────────────
const GOLD    = '#D4A032';
const GOLD_MU = '#9a7020';
const BG_BASE = '#0d0600';
const SURFACE = '#160c03';
const BORDER  = '#2a1a08';
const TEXT_PRI = '#f5edd6';
const TEXT_SEC = '#8a7560';

interface CatalogItem {
  id: string; name: string; brand: string; price: number;
  category: string; image: string; color_name: string;
}
interface StylistItem {
  slot: string; product_name: string; brand: string;
  price: number; image_url: string; reason: string;
}
interface StylistResponse {
  outfit_name: string; analysis: string; dress_code_level: string;
  items: StylistItem[]; total_price: number; style_tip: string;
  mediator_note: string; confidence_score: number;
}
interface Message {
  id: string; role: 'user' | 'model'; text: string; outfit?: StylistResponse;
}

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    if ((res.status === 429 || res.status === 503) && attempt < maxRetries) {
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1500 + Math.random() * 500));
      continue;
    }
    return res;
  }
  throw new Error('API is busy. Please try again in a few seconds.');
}

const SUGGESTED_PROMPTS = [
  { icon: Star,  label: 'Decode Dress Code',   prompt: 'I have a formal wedding in Mumbai this weekend with a black-tie dress code. What should I wear?' },
  { icon: Zap,   label: 'Negotiate Style',      prompt: 'My family wants traditional sherwani but I prefer something modern. Help me find a fusion look.' },
  { icon: Wand2, label: 'Office Party Look',    prompt: "I need a smart-casual fusion outfit for my company's annual office party." },
];

// ─── ANIMATED BACKGROUND ────────────────────────────────────────────
function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);

  // Lock body scroll on this page to kill the right-side scrollbar
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const isMobile = window.innerWidth < 768;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width  = window.innerWidth  * DPR;
      canvas.height = window.innerHeight * DPR;
      canvas.style.width  = window.innerWidth  + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    const GR = '212, 160, 50'; // gold
    const CR = '245, 237, 214'; // cream

    // ── 1. Particles (small glowing dots + constellation lines) ──────
    type Particle = {
      x:number; y:number; vx:number; vy:number;
      size:number; alpha:number; phase:number; ps:number;
    };
    const COUNT = isMobile ? 45 : 80;
    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random()*W(), y: Math.random()*H(),
      vx: (Math.random()-0.5)*0.28, vy: (Math.random()-0.5)*0.28,
      size: 0.8 + Math.random()*1.8,
      alpha: 0.15 + Math.random()*0.5,
      phase: Math.random()*Math.PI*2,
      ps: 0.012 + Math.random()*0.016,
    }));

    // ── 2. Diagonal light beams ───────────────────────────────────
    type Beam = { x:number;y:number;len:number;angle:number;speed:number;alpha:number;width:number;phase:number };
    const BEAM_N = isMobile ? 2 : 4;
    const beams: Beam[] = Array.from({ length: BEAM_N }, () => ({
      x: Math.random()*W()*1.5 - W()*0.25,
      y: -150 - Math.random()*400,
      len: 200 + Math.random()*250,
      angle: 0.28 + Math.random()*0.5,
      speed: 0.06 + Math.random()*0.09,
      alpha: 0.010 + Math.random()*0.012,
      width: 0.7 + Math.random()*1.5,
      phase: Math.random()*Math.PI*2,
    }));

    // ── 3. Mouse ripples ──────────────────────────────────────────
    const ripples: { x:number;y:number;r:number;a:number }[] = [];

    const onMove = (x:number, y:number) => {
      mouse.current = { x, y };
      if (ripples.length < 3) ripples.push({ x, y, r: 0, a: 0.20 });
    };
    const onLeave = () => { mouse.current = { x:-9999, y:-9999 }; };

    const CONNECT_DIST = isMobile ? 85 : 120;
    const PUSH_DIST    = isMobile ? 70 : 110;

    const draw = () => {
      const w=W(), h=H();
      ctx.clearRect(0,0,w,h);

      // ── Particles: move + mouse repulsion ──
      for (const p of particles) {
        p.phase += p.ps;
        const mdx = p.x - mouse.current.x;
        const mdy = p.y - mouse.current.y;
        const md  = Math.sqrt(mdx*mdx + mdy*mdy);
        if (md < PUSH_DIST && md > 0) {
          const f = ((PUSH_DIST-md)/PUSH_DIST) * 0.3;
          p.vx += (mdx/md)*f; p.vy += (mdy/md)*f;
        }
        p.vx *= 0.97; p.vy *= 0.97;
        const sp = Math.sqrt(p.vx*p.vx+p.vy*p.vy);
        if (sp > 1.4) { p.vx=p.vx/sp*1.4; p.vy=p.vy/sp*1.4; }
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x=w; if (p.x > w) p.x=0;
        if (p.y < 0) p.y=h; if (p.y > h) p.y=0;
      }

      // ── Constellation lines ──
      for (let i=0; i<particles.length; i++) {
        for (let j=i+1; j<particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx*dx+dy*dy);
          if (dist < CONNECT_DIST) {
            const opacity = (1 - dist/CONNECT_DIST) * 0.15;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${GR},${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // ── Particle dots ──
      for (const p of particles) {
        const a = p.alpha * (0.5 + 0.5*Math.sin(p.phase));
        // Soft glow
        const grd = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size*3.5);
        grd.addColorStop(0, `rgba(${GR},${a})`);
        grd.addColorStop(1, `rgba(${GR},0)`);
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size*3.5,0,Math.PI*2);
        ctx.fillStyle=grd; ctx.fill();
        // Core
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
        ctx.fillStyle=`rgba(${GR},${Math.min(1,a*1.8)})`; ctx.fill();
      }

      // ── Light beams ──
      for (const b of beams) {
        b.phase += 0.004; b.y += b.speed;
        if (b.y > h+300) { b.y=-300; b.x=Math.random()*w*1.5-w*0.25; }
        const ba = b.alpha*(0.5+0.5*Math.sin(b.phase));
        const bx2 = b.x + Math.cos(b.angle+Math.PI/2)*b.len;
        const by2 = b.y + Math.sin(b.angle+Math.PI/2)*b.len;
        const lg = ctx.createLinearGradient(b.x,b.y,bx2,by2);
        lg.addColorStop(0,`rgba(${GR},0)`);
        lg.addColorStop(0.4,`rgba(${GR},${ba})`);
        lg.addColorStop(0.6,`rgba(${CR},${ba*0.5})`);
        lg.addColorStop(1,`rgba(${GR},0)`);
        ctx.save();
        ctx.translate(b.x,b.y); ctx.rotate(b.angle);
        ctx.beginPath(); ctx.rect(-b.width/2,0,b.width,b.len);
        ctx.fillStyle=lg; ctx.fill();
        ctx.restore();
      }

      // ── Mouse ripples ──
      for (let i=ripples.length-1; i>=0; i--) {
        const rp=ripples[i];
        rp.r += 2.0; rp.a -= 0.006;
        if (rp.a <= 0) { ripples.splice(i,1); continue; }
        ctx.beginPath(); ctx.arc(rp.x,rp.y,rp.r,0,Math.PI*2);
        ctx.strokeStyle=`rgba(${GR},${rp.a})`; ctx.lineWidth=0.7; ctx.stroke();
      }

      // ── Vignette ──
      const vg = ctx.createRadialGradient(w/2,h/2,h*0.28,w/2,h/2,h*0.9);
      vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(13,6,0,0.65)');
      ctx.fillStyle=vg; ctx.fillRect(0,0,w,h);

      rafRef.current = requestAnimationFrame(draw);
    };

    const handleMouse = (e:MouseEvent) => onMove(e.clientX,e.clientY);
    const handleTouch = (e:TouchEvent) => { if(e.touches[0]) onMove(e.touches[0].clientX,e.touches[0].clientY); };
    window.addEventListener('mousemove',  handleMouse, { passive:true });
    window.addEventListener('mouseleave', onLeave,     { passive:true });
    window.addEventListener('touchmove',  handleTouch, { passive:true });
    window.addEventListener('touchend',   onLeave,     { passive:true });
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize',     resize);
      window.removeEventListener('mousemove',  handleMouse);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('touchmove',  handleTouch);
      window.removeEventListener('touchend',   onLeave);
    };

  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position:'fixed', top:0, left:0, width:'100%', height:'100%',
      pointerEvents:'none', zIndex:0, willChange:'transform',
    }} />
  );
}

// ─── TYPING INDICATOR ─────────────────────────────────────────────

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '14px 0 2px' }}>
      {[0, 0.18, 0.36].map((delay, i) => (
        <motion.span
          key={i}
          style={{ width: 7, height: 7, borderRadius: '50%', background: GOLD, display: 'block' }}
          animate={{ scale: [0.6, 1.15, 0.6], opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 0.9, delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ─── PRODUCT ROW ──────────────────────────────────────────────────
function ProductRow({ item, idx, onTryOn }: { item: StylistItem; idx: number; onTryOn: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: idx * 0.08, ease: 'easeOut' }}
      style={{ borderBottom: `1px solid ${BORDER}` }}
      className="product-row"
    >
      <div style={{ display: 'flex', gap: 14, padding: '16px 0', transition: 'background 150ms ease' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#1e1005')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        {/* Image */}
        <div style={{
          width: 72, height: 88, flexShrink: 0, borderRadius: 8, overflow: 'hidden',
          background: '#110800', border: `1px solid ${BORDER}`, position: 'relative'
        }}>
          {item.image_url ? (
            <img src={item.image_url} alt={item.product_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={20} color={BORDER} />
            </div>
          )}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(transparent, rgba(13,6,0,0.85))',
            padding: '4px 5px 3px',
            fontSize: 8, fontFamily: 'Inter', fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD
          }}>{item.slot}</div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
          <p style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: TEXT_SEC, margin: 0 }}>{item.brand}</p>
          <p style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: 500, color: TEXT_PRI, margin: '2px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.45 }}>{item.product_name}</p>
          <p style={{ fontFamily: 'Playfair Display', fontSize: 15, fontWeight: 600, color: GOLD, margin: '2px 0' }}>₹{(item.price || 0).toLocaleString('en-IN')}</p>
          {item.reason && (
            <p style={{ fontFamily: 'Inter', fontSize: 12, color: TEXT_SEC, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: '2px 0' }}>{item.reason}</p>
          )}
          {item.image_url && (
            <button
              onClick={onTryOn}
              className="tryon-btn"
              style={{
                marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5,
                height: 28, padding: '0 10px', border: `1px solid ${GOLD}`, borderRadius: 4,
                background: 'transparent', color: GOLD, cursor: 'pointer',
                fontFamily: 'Inter', fontSize: 10, fontWeight: 600,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                transition: 'background 200ms ease, color 200ms ease',
                alignSelf: 'flex-start'
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = GOLD;
                (e.currentTarget as HTMLButtonElement).style.color = BG_BASE;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = GOLD;
              }}
            >
              <Camera size={11} /> Try On
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── OUTFIT CARD ──────────────────────────────────────────────────
function OutfitCard({ outfit, onAddToCart, onTryOn }: {
  outfit: StylistResponse;
  onAddToCart: () => void;
  onTryOn: (item: StylistItem) => void;
}) {
  const validItems = outfit.items.filter(i => i.product_name);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      style={{
        width: '100%', background: SURFACE, border: `1px solid ${BORDER}`,
        borderRadius: 12, overflow: 'hidden', marginTop: 10
      }}
      whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(212,160,50,0.08)' }}
    >
      {/* Card Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          {/* Dress code pill */}
          <span style={{
            fontFamily: 'Inter', fontSize: 9, fontWeight: 600, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: GOLD, border: `1px solid ${GOLD}`,
            borderRadius: 20, padding: '3px 10px'
          }}>{outfit.dress_code_level}</span>

          {/* Match badge with shimmer */}
          <span className="match-badge" style={{
            fontFamily: 'Inter', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: '#4ade80', background: 'rgba(74,222,128,0.08)',
            border: '1px solid rgba(74,222,128,0.25)', borderRadius: 20, padding: '3px 10px',
            display: 'flex', alignItems: 'center', gap: 4
          }}>
            <CheckCircle2 size={10} /> {outfit.confidence_score}% Match
          </span>
        </div>

        <h2 style={{
          fontFamily: 'Playfair Display', fontSize: 26, fontWeight: 700,
          color: TEXT_PRI, margin: '0 0 8px', lineHeight: 1.25, letterSpacing: '-0.01em'
        }}>{outfit.outfit_name}</h2>

        {outfit.analysis && (
          <p style={{
            fontFamily: 'Inter', fontSize: 13, color: TEXT_SEC, lineHeight: 1.7,
            margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
          }}>{outfit.analysis}</p>
        )}
      </div>

      {/* Items */}
      <div style={{ padding: '0 24px' }}>
        {/* Section label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 16, marginBottom: 4 }}>
          <span style={{
            fontFamily: 'Inter', fontSize: 10, fontWeight: 600, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: GOLD, flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 5
          }}>
            <Sparkles size={10} /> Curated Selection
          </span>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${GOLD}40, transparent)` }} />
        </div>

        {validItems.map((item, i) => (
          <ProductRow key={i} item={item} idx={i} onTryOn={() => onTryOn(item)} />
        ))}
      </div>

      {/* Insight / Stylist Note */}
      {(outfit.mediator_note || outfit.style_tip) && (
        <div style={{
          margin: '12px 24px', padding: '12px 16px',
          background: 'rgba(212,160,50,0.06)', borderLeft: `2px solid ${GOLD}`,
          borderRadius: '0 4px 4px 0'
        }}>
          {outfit.mediator_note && (
            <p style={{ fontFamily: 'Inter', fontSize: 12, color: TEXT_SEC, fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 4px' }}>
              "{outfit.mediator_note}"
            </p>
          )}
          {outfit.style_tip && (
            <p style={{ fontFamily: 'Inter', fontSize: 12, color: TEXT_SEC, lineHeight: 1.6, margin: 0, display: 'flex', alignItems: 'flex-start', gap: 5 }}>
              <span style={{ fontSize: 13 }}>💡</span>{outfit.style_tip}
            </p>
          )}
        </div>
      )}

      {/* Cart Footer */}
      <div style={{ padding: '14px 24px 20px', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: TEXT_SEC }}>Total</span>
          <span style={{ fontFamily: 'Playfair Display', fontSize: 18, fontWeight: 600, color: GOLD }}>
            ₹{(outfit.total_price || 0).toLocaleString('en-IN')}
          </span>
        </div>
        <motion.button
          whileHover={{ filter: 'brightness(1.12)', scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onAddToCart}
          style={{
            width: '100%', height: 44, background: GOLD, color: BG_BASE,
            border: 'none', borderRadius: 8, cursor: 'pointer',
            fontFamily: 'Inter', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'filter 200ms ease, transform 200ms ease'
          }}
        >
          <ShoppingBag size={15} /> Add to Cart
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function StyleBuilderPage() {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const { messages, setMessages, clearMessages } = useStylistStore();
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const { user, profile } = useAuthStore();
  const chatLogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const { addItem, openCart } = useCartStore();
  const { setUpperwearFile, setBottomwearFile } = useTryOnStore();

  useEffect(() => {
    const fetchCatalog = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, brand, price, category, product_colors(image_url, color_name)')
        .eq('is_active', true).limit(60);
      if (error) { console.error('Catalog fetch error:', error); return; }
      if (data) {
        setCatalog(data.map(p => ({
          id: p.id, name: p.name, brand: p.brand || 'FashionVerse',
          price: p.price, category: p.category,
          image: p.product_colors?.[0]?.image_url || '',
          color_name: p.product_colors?.[0]?.color_name || 'Standard'
        })));
        setCatalogLoaded(true);
      }
    };
    fetchCatalog();
  }, []);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTo({ top: chatLogRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isGenerating]);

  const handleSendMessage = async (text?: string) => {
    const msgText = (text ?? inputValue).trim();
    if (!msgText || isGenerating) return;
    if (!catalogLoaded) { toast.error('Catalog is loading. Please wait a moment.'); return; }

    setInputValue('');
    const newMessages: Message[] = [...messages, { id: Date.now().toString(), role: 'user', text: msgText }];
    setMessages(newMessages);
    setIsGenerating(true);

    try {
      const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      const catalogString = catalog.slice(0, 50).map((p, i) =>
        `${i + 1}. [${p.category.toUpperCase()}] ${p.name} | Brand: ${p.brand} | Price: ₹${p.price} | Image: ${p.image}`
      ).join('\n');

      const systemInstruction = `You are FashionVerse AI — an elite Indian fashion stylist embedded in a luxury e-commerce platform.
You engage in natural conversation to understand the user's needs, then curate a perfect outfit from the catalog.

YOUR TWO MODES:
1. DRESS CODE DECODER: Decode event invites — analyze the event, venue, culture, season. Recommend an outfit from the catalog.
2. STYLE NEGOTIATOR: When the user has conflicting style expectations (e.g., family wants traditional but user wants modern), find a creative fusion solution from the catalog.

AVAILABLE CATALOG (use ONLY these products):
${catalogString}

CRITICAL RULES:
- ALWAYS respond in pure valid JSON only. No markdown, no backticks, no text outside JSON.
- Only select products that EXIST in the catalog above with the EXACT same name and image URL.
- For outfit items, copy the image URL EXACTLY as it appears in the catalog.
- Try to include both a Top (upperwear) AND a Bottom (bottomwear) from the catalog.
- If a slot has no suitable product, set product_name to null.
- If you need more info, set is_outfit_curated to false and ask in chat_response.

JSON RESPONSE FORMAT (always return exactly this structure):
{
  "chat_response": "Your conversational message to the user",
  "is_outfit_curated": false,
  "outfit_name": null,
  "analysis": null,
  "dress_code_level": null,
  "items": [],
  "total_price": 0,
  "style_tip": null,
  "mediator_note": null,
  "confidence_score": null
}

When curating, set is_outfit_curated to true and fill all fields. Items:
{ "slot": "Top", "product_name": "exact name", "brand": "exact brand", "price": 1799, "image_url": "exact url", "reason": "why" }`;

      const apiContents = newMessages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));

      const response = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: apiContents,
            generationConfig: { temperature: 0.75, maxOutputTokens: 4096, responseMimeType: 'application/json' }
          })
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error.message || 'API Error');
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from AI');

      let displayMessage = "I'm thinking...";
      let parsedOutfit: StylistResponse | undefined;

      try {
        const aiData = JSON.parse(rawText);
        displayMessage = aiData.chat_response || 'Here is what I found for you!';
        if (aiData.is_outfit_curated && Array.isArray(aiData.items) && aiData.items.length > 0) {
          const enrichedItems: StylistItem[] = aiData.items.filter((i: StylistItem) => i.product_name).map((item: StylistItem) => {
            const match = catalog.find(p => p.name === item.product_name);
            return { ...item, image_url: match?.image || item.image_url || '', brand: match?.brand || item.brand, price: match?.price ?? item.price };
          });
          if (enrichedItems.length > 0) {
            parsedOutfit = {
              outfit_name: aiData.outfit_name || 'Curated Look',
              analysis: aiData.analysis || '',
              dress_code_level: aiData.dress_code_level || 'Custom',
              items: enrichedItems,
              total_price: enrichedItems.reduce((s, i) => s + (i.price || 0), 0),
              style_tip: aiData.style_tip || '',
              mediator_note: aiData.mediator_note || '',
              confidence_score: aiData.confidence_score || 90
            };
          }
        }
      } catch (parseErr) {
        console.error('JSON parse failed:', parseErr, rawText);
        displayMessage = 'My styling engine had a hiccup. Please try again!';
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: displayMessage, outfit: parsedOutfit }]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to connect. Please try again.', { duration: 5000 });
      
      let errorText = 'I\'m sorry, there was a temporary issue. Please try again in a moment.';
      if (err.message && err.message.toLowerCase().includes('quota')) {
        errorText = `I'm currently receiving too many requests (${err.message.split('.')[0]}). Please wait a few seconds and try again.`;
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: errorText }]);
    } finally {
      setIsGenerating(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const addOutfitToCart = (outfit: StylistResponse) => {
    let count = 0;
    outfit.items.forEach(item => {
      if (!item.product_name) return;
      const p = catalog.find(c => c.name === item.product_name);
      if (p) { addItem({ product_id: p.id, color_name: p.color_name, size: 'M', quantity: 1, product_name: p.name, product_price: p.price, image_url: p.image }); count++; }
    });
    if (count > 0) { toast.success(`${count} items added!`); openCart(); }
    else toast.error('Could not match items to catalog.');
  };

  const handleTryOn = async (item: StylistItem) => {
    if (!item.image_url) { toast.error('No image available.'); return; }
    const tid = toast.loading('Loading into Try-On Studio…');
    try {
      const res = await fetch(item.image_url);
      const blob = await res.blob();
      const file = new File([blob], 'garment.jpg', { type: blob.type });
      const isBottom = /bottom|pant|jean|trouser|skirt|shorts/i.test(item.slot + ' ' + item.product_name);
      if (isBottom) setBottomwearFile(file, item.image_url);
      else setUpperwearFile(file, item.image_url);
      toast.success('Ready! Launching Try-On Studio.', { id: tid });
      navigate('/try-on');
    } catch { toast.error('Could not load image.', { id: tid }); }
  };

  return (
    <>
      <style>{`
        /* ── Global selection ── */
        ::selection { background: rgba(212,160,50,0.28); }
        /* ── Scrollbar ── */
        .fv-chat-log::-webkit-scrollbar { width: 4px; }
        .fv-chat-log::-webkit-scrollbar-track { background: transparent; }
        .fv-chat-log::-webkit-scrollbar-thumb { background: #D4A032; border-radius: 4px; }


        /* ── AI bubble left-bar accent ── */
        .ai-bubble { border-left: 3px solid ${GOLD}; padding-left: 14px; }

        /* ── Match badge shimmer ── */
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        .match-badge {
          background-size: 200% auto;
        }

        /* ── Input focus ring ── */
        .fv-input:focus-within {
          border-color: ${GOLD} !important;
          box-shadow: 0 0 0 3px rgba(212,160,50,0.10) !important;
        }

        /* ── Send ripple ── */
        @keyframes ripple {
          to { transform: scale(2.6); opacity: 0; }
        }
        .send-btn { position: relative; overflow: hidden; }
        .send-btn::after {
          content: '';
          position: absolute; width: 100%; height: 100%; top: 0; left: 0;
          background: rgba(212,160,50,0.4); border-radius: 50%;
          transform: scale(0); opacity: 1; pointer-events: none;
        }
        .send-btn:active::after { animation: ripple 300ms ease-out forwards; }
      `}</style>

      <div
        className="fv-page"
        style={{
          height: 'calc(100vh - 80px)', background: BG_BASE, color: TEXT_PRI,
          fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column',
          position: 'relative', overflow: 'hidden'
        }}
      >
        {/* Interactive animated background */}
        <AnimatedBackground />


        <div style={{
          maxWidth: 860, margin: '0 auto', width: '100%',
          padding: '0 16px', display: 'flex', flexDirection: 'column',
          flex: 1, minHeight: 0, position: 'relative', zIndex: 1
        }}>

          {/* ── HEADER ── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 0 14px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0
            }}
          >
            {/* Left: Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', background: `linear-gradient(135deg, ${SURFACE}, #1e1005)`,
                  border: `1px solid ${BORDER}`, boxShadow: `0 0 14px rgba(212,160,50,0.15)`, overflow: 'hidden'
                }}>
                  <img src="/logo.png" alt="FV Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute', top: -1, right: -1, width: 10, height: 10,
                    borderRadius: '50%', background: '#4ade80', border: `2px solid ${BG_BASE}`
                  }}
                />
              </div>
              <div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: GOLD, letterSpacing: '-0.01em', lineHeight: 1 }}>
                  FashionVerse AI
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: TEXT_SEC, marginTop: 2 }}>
                  Elite Style Consultant
                </div>
              </div>
            </div>

            {/* Right: controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Catalog count */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                border: `1px solid ${BORDER}`, borderRadius: 20,
                fontFamily: 'Inter', fontSize: 10, fontWeight: 600,
                letterSpacing: '0.16em', textTransform: 'uppercase',
                color: catalogLoaded ? '#4ade80' : TEXT_SEC
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: catalogLoaded ? '#4ade80' : TEXT_SEC, flexShrink: 0 }} />
                {catalogLoaded ? `${catalog.length} Products` : 'Loading…'}
              </div>

              {/* New Chat */}
              {messages.length > 1 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ borderColor: GOLD, color: GOLD }}
                  whileTap={{ scale: 0.96 }}
                  onClick={clearMessages}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                    border: `1px solid ${BORDER}`, borderRadius: 20, background: 'transparent',
                    color: TEXT_SEC, cursor: 'pointer',
                    fontFamily: 'Inter', fontSize: 10, fontWeight: 600,
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                    transition: 'border-color 200ms ease, color 200ms ease'
                  }}
                >
                  <RefreshCcw size={12} /> New Chat
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* ── CHAT LOG ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            ref={chatLogRef}
            className="fv-chat-log"
            style={{ flex: 1, overflowY: 'auto', padding: '28px 0 12px', display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
                >
                  {/* AI Message */}
                  {msg.role === 'model' && (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', maxWidth: '85%' }}>
                      {/* Avatar */}
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        background: SURFACE, border: `1px solid ${BORDER}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2, overflow: 'hidden'
                      }}>
                        <img src="/logo.png" alt="FV Bot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      {/* Text with gold bar */}
                      <div>
                        {msg.text && (
                          <div className="ai-bubble" style={{ paddingTop: 2, paddingBottom: 2 }}>
                            <p style={{
                              fontFamily: 'Inter', fontSize: 14, color: TEXT_PRI,
                              lineHeight: 1.75, margin: 0, fontWeight: 400
                            }}>
                              {msg.text.split('**').map((part, i) =>
                                i % 2 === 1
                                  ? <strong key={i} style={{ color: GOLD, fontWeight: 700 }}>{part}</strong>
                                  : <span key={i}>{part}</span>
                              )}
                            </p>
                          </div>
                        )}
                        {msg.outfit && (
                          <OutfitCard
                            outfit={msg.outfit}
                            onAddToCart={() => addOutfitToCart(msg.outfit!)}
                            onTryOn={handleTryOn}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* User Message */}
                  {msg.role === 'user' && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: 'row-reverse', maxWidth: '72%' }}>
                      {/* Avatar */}
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        background: `linear-gradient(135deg, ${GOLD}, ${GOLD_MU})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2,
                        boxShadow: `0 0 12px rgba(212,160,50,0.25)`, overflow: 'hidden'
                      }}>
                        {(profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture) ? (
                          <img 
                            src={profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture} 
                            alt="User" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        ) : (
                          <User size={14} color={BG_BASE} />
                        )}
                      </div>
                      {/* Bubble */}
                      <div style={{
                        background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_MU} 100%)`,
                        borderRadius: '16px 16px 4px 16px',
                        padding: '12px 16px',
                        boxShadow: `0 4px 16px rgba(212,160,50,0.2)`
                      }}>
                        <p style={{ fontFamily: 'Inter', fontSize: 14, color: BG_BASE, fontWeight: 500, lineHeight: 1.65, margin: 0 }}>
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: SURFACE, border: `1px solid ${BORDER}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                  }}>
                    <img src="/logo.png" alt="FV Bot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div className="ai-bubble" style={{ paddingTop: 4, paddingBottom: 4 }}>
                    <TypingDots />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── BOTTOM INPUT AREA ── */}
          <div style={{ flexShrink: 0, paddingTop: 10, paddingBottom: 14 }}>

            {/* Suggested prompts */}
            <AnimatePresence>
              {messages.length === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}
                >
                  {SUGGESTED_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                    <motion.button
                      key={label}
                      whileHover={{ borderColor: GOLD, color: GOLD, background: 'rgba(212,160,50,0.06)' }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSendMessage(prompt)}
                      disabled={!catalogLoaded}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 13px',
                        border: `1px solid rgba(212,160,50,0.25)`,
                        borderRadius: 20, background: 'rgba(212,160,50,0.03)', cursor: 'pointer',
                        fontFamily: 'Inter', fontSize: 11, fontWeight: 500,
                        letterSpacing: '0.06em', color: TEXT_SEC,
                        transition: 'all 180ms ease',
                        opacity: catalogLoaded ? 1 : 0.4,
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      <Icon size={10} color={GOLD} style={{ flexShrink: 0 }} /> {label}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input panel — glassy, professional */}
            <div style={{
              background: 'rgba(22,12,3,0.75)',
              border: `1px solid rgba(212,160,50,0.18)`,
              borderRadius: 16,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 4px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(212,160,50,0.08)',
              padding: '12px 12px 10px 18px',
              transition: 'border-color 200ms ease, box-shadow 200ms ease',
            }}
              onFocusCapture={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(212,160,50,0.55)`;
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 32px rgba(0,0,0,0.45), 0 0 0 2px rgba(212,160,50,0.10), inset 0 1px 0 rgba(212,160,50,0.12)`;
              }}
              onBlurCapture={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(212,160,50,0.18)`;
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(212,160,50,0.08)`;
              }}
            >
              {/* Textarea row */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  placeholder={catalogLoaded ? 'Describe your event, dress code, or style challenge…' : 'Loading catalog…'}
                  disabled={isGenerating || !catalogLoaded}
                  rows={1}
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none',
                    fontFamily: 'Inter', fontSize: 14, color: TEXT_PRI, lineHeight: 1.65,
                    fontWeight: 400, padding: '2px 0 4px', maxHeight: 110, caretColor: GOLD,
                  }}
                  onInput={e => {
                    const el = e.currentTarget;
                    el.style.height = 'auto';
                    el.style.height = Math.min(el.scrollHeight, 110) + 'px';
                  }}
                />

                {/* Send button */}
                <motion.button
                  className="send-btn"
                  whileHover={{ scale: 1.07, boxShadow: `0 0 22px rgba(212,160,50,0.45)` }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isGenerating || !catalogLoaded}
                  style={{
                    width: 44, height: 44, flexShrink: 0, borderRadius: '50%', border: 'none',
                    background: inputValue.trim() && !isGenerating
                      ? `linear-gradient(135deg, #e8b840 0%, ${GOLD_MU} 100%)`
                      : `rgba(212,160,50,0.15)`,
                    cursor: inputValue.trim() && !isGenerating ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 220ms ease',
                    boxShadow: inputValue.trim() && !isGenerating
                      ? '0 2px 12px rgba(212,160,50,0.25)'
                      : 'none',
                  }}
                >
                  {isGenerating
                    ? <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                        style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid rgba(212,160,50,0.3)`, borderTopColor: GOLD }}
                      />
                    : <Send size={17} color={inputValue.trim() ? BG_BASE : GOLD_MU} />
                  }
                </motion.button>
              </div>

              {/* Bottom meta row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: `1px solid rgba(212,160,50,0.08)` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: catalogLoaded ? '#4ade80' : '#f59e0b' }} />
                    <span style={{ fontFamily: 'Inter', fontSize: 10, color: '#4a3a28', letterSpacing: '0.1em' }}>
                      {catalogLoaded ? `${catalog.length} items in catalog` : 'Loading catalog…'}
                    </span>
                  </div>
                  <span style={{ color: '#2a1a08', fontSize: 10 }}>·</span>
                  <span style={{ fontFamily: 'Inter', fontSize: 10, color: '#4a3a28', letterSpacing: '0.06em' }}>
                    Enter to send, Shift+Enter for new line
                  </span>
                </div>
                <span style={{
                  fontFamily: 'Inter', fontSize: 10, color: inputValue.length > 400 ? '#f59e0b' : '#4a3a28',
                  letterSpacing: '0.06em', transition: 'color 200ms'
                }}>
                  {inputValue.length}/500
                </span>
              </div>
            </div>

            {/* Footer */}
            <p style={{
              textAlign: 'center', fontFamily: 'Inter', fontSize: 9.5, fontWeight: 500,
              letterSpacing: '0.18em', textTransform: 'uppercase', color: '#3a2a18',
              margin: '10px 0 0'
            }}>
              FashionVerse AI · Recommendations sourced from your live catalog
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
