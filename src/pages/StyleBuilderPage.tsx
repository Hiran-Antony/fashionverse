import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, ShoppingBag, User, Camera, RefreshCcw, Wand2, Star, CheckCircle2, History, X, Clock, Trash2, ImagePlus, Palette, Tag, ScanLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../store/cartStore';
import { useTryOnStore } from '../store/tryOnStore';
import { useStylistStore } from '../store/stylistStore';
import type {
  Message,
  StylistItem,
  StylistResponse,
  AIFeatureResponse,
  AIColorAdvisor,
  AIDressCode,
  AIStyleChat,
  AIFabricScanner
} from '../store/stylistStore';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import StandaloneFashionTools from '../components/StandaloneFashionTools';
import { geminiFetch } from '../lib/gemini';
import useDeviceOptimization from '../hooks/useDeviceOptimization';

// ─── BRAND TOKENS ─────────────────────────────────────────────────
const GOLD    = '#D4A032';
const GOLD_MU = '#C08552';
const BG_BASE = '#0d0600';
const SURFACE = '#160c03';
const BORDER  = '#2a1a08';
const TEXT_PRI = '#f5edd6';
const TEXT_SEC = '#8a7560';

// ─── TYPES ────────────────────────────────────────────────────────
interface CatalogItem {
  id: string; name: string; brand: string; price: number;
  category: string; image: string; color_name: string;
}


// ─── SESSION HISTORY (localStorage) ───────────────────────────────
const SESSION_KEY = 'fv_sessions_v1';
interface ChatSession { id: string; title: string; ts: number; messages: Message[]; }

function getSessions(): ChatSession[] {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || '[]'); } catch { return []; }
}
function saveSession(id: string, title: string, messages: Message[]) {
  const all = getSessions();
  const idx = all.findIndex(s => s.id === id);
  const entry: ChatSession = { id, title, ts: Date.now(), messages };
  if (idx > -1) all[idx] = entry; else all.unshift(entry);
  localStorage.setItem(SESSION_KEY, JSON.stringify(all.slice(0, 20)));
}
function deleteSession(id: string) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(getSessions().filter(s => s.id !== id)));
}
function makeSessionId() { return 'fv_' + Date.now(); }
function timeAgo(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ─── FETCH WITH RETRY ─────────────────────────────────────────────
const fetchWithRetry = geminiFetch;



// ─── TYPING INDICATOR ─────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '14px 0 2px' }}>
      {[0, 0.18, 0.36].map((delay, i) => (
        <motion.span key={i}
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: idx * 0.08, ease: 'easeOut' }}
      style={{ borderBottom: `1px solid ${BORDER}` }} className="product-row">
      <div style={{ display: 'flex', gap: 14, padding: '16px 0', transition: 'background 150ms ease' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#1e1005')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
        <div style={{ width: 72, height: 88, flexShrink: 0, borderRadius: 8, overflow: 'hidden', background: '#110800', border: `1px solid ${BORDER}`, position: 'relative' }}>
          {item.image_url ? (
            <img src={item.image_url} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={20} color={BORDER} />
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(13,6,0,0.85))', padding: '4px 5px 3px', fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD }}>
            {item.slot}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: TEXT_SEC, margin: 0 }}>{item.brand}</p>
          <p style={{ fontSize: 14, fontWeight: 500, color: TEXT_PRI, margin: '2px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.45 }}>{item.product_name}</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: GOLD, margin: '2px 0' }}>₹{(item.price || 0).toLocaleString('en-IN')}</p>
          {item.reason && <p style={{ fontSize: 12, color: TEXT_SEC, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: '2px 0' }}>{item.reason}</p>}
          {item.image_url && (
            <button onClick={onTryOn} className="tryon-btn"
              style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5, height: 28, padding: '0 10px', border: `1px solid ${GOLD}`, borderRadius: 4, background: 'transparent', color: GOLD, cursor: 'pointer', fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', transition: 'background 200ms ease, color 200ms ease', alignSelf: 'flex-start' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = GOLD; (e.currentTarget as HTMLButtonElement).style.color = BG_BASE; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = GOLD; }}>
              <Camera size={11} /> Try On
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── OUTFIT CARD ──────────────────────────────────────────────────
function OutfitCard({ outfit, onAddToCart, onTryOn }: { outfit: StylistResponse; onAddToCart: () => void; onTryOn: (item: StylistItem) => void; }) {
  const validItems = outfit.items.filter(i => i.product_name);
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      style={{ width: '100%', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden', marginTop: 10 }}
      whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(212,160,50,0.08)' }}>
      <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, border: `1px solid ${GOLD}`, borderRadius: 20, padding: '3px 10px' }}>{outfit.dress_code_level}</span>
          <span className="match-badge" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4ade80', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 20, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={10} /> {outfit.confidence_score}% Match
          </span>
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: TEXT_PRI, margin: '0 0 8px', lineHeight: 1.25, letterSpacing: '-0.01em' }}>{outfit.outfit_name}</h2>
        {outfit.analysis && <p style={{ fontSize: 13, color: TEXT_SEC, lineHeight: 1.7, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{outfit.analysis}</p>}
      </div>
      <div style={{ padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 16, marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Sparkles size={10} /> Curated Selection
          </span>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${GOLD}40, transparent)` }} />
        </div>
        {validItems.map((item, i) => <ProductRow key={i} item={item} idx={i} onTryOn={() => onTryOn(item)} />)}
      </div>
      {(outfit.mediator_note || outfit.style_tip) && (
        <div style={{ margin: '12px 24px', padding: '12px 16px', background: 'rgba(212,160,50,0.06)', borderLeft: `2px solid ${GOLD}`, borderRadius: '0 4px 4px 0' }}>
          {outfit.mediator_note && <p style={{ fontSize: 12, color: TEXT_SEC, fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 4px' }}>"{outfit.mediator_note}"</p>}
          {outfit.style_tip && <p style={{ fontSize: 12, color: TEXT_SEC, lineHeight: 1.6, margin: 0, display: 'flex', alignItems: 'flex-start', gap: 5 }}><span style={{ fontSize: 13 }}>💡</span>{outfit.style_tip}</p>}
        </div>
      )}
      <div style={{ padding: '14px 24px 20px', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: TEXT_SEC }}>Total</span>
          <span style={{ fontSize: 18, fontWeight: 600, color: GOLD }}>₹{(outfit.total_price || 0).toLocaleString('en-IN')}</span>
        </div>
        <motion.button whileHover={{ filter: 'brightness(1.12)', scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={onAddToCart}
          style={{ width: '100%', height: 44, background: GOLD, color: BG_BASE, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <ShoppingBag size={15} /> Add to Cart
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── AI FEATURE CARDS ─────────────────────────────────────────────
function Pill({ label, color = GOLD }: { label: string; color?: string }) {
  return <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color, border: `1px solid ${color}55`, borderRadius: 20, padding: '2px 9px', background: `${color}0d` }}>{label}</span>;
}

function FeatureCard({ children, accent = GOLD }: { children: React.ReactNode; accent?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: 'easeOut' }}
      style={{ width: '100%', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden', marginTop: 10, borderTop: `2px solid ${accent}` }}>
      {children}
    </motion.div>
  );
}

// Shared product row with image thumbnail from catalog
function ProductPickRow({ name, price, why, occasion, catalog, onAddItem, onTryOn, isLast = false }: {
  name: string; price: string; why: string; occasion?: string;
  catalog: CatalogItem[]; onAddItem: (name: string) => void;
  onTryOn?: (imageUrl: string, productName: string) => void; isLast?: boolean;
}) {
  const cleanStr = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const n = cleanStr(name);
  const match = catalog.find(p => {
    const pn = cleanStr(p.name);
    return pn === n || pn.includes(n) || n.includes(pn);
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: !isLast ? `1px solid ${BORDER}` : 'none' }}>
      {/* Product image */}
      <div style={{ width: 56, height: 68, flexShrink: 0, borderRadius: 7, overflow: 'hidden', background: '#110800', border: `1px solid ${BORDER}`, position: 'relative' }}>
        {match?.image ? (
          <img src={match.image} alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBag size={16} color={BORDER} />
          </div>
        )}
      </div>
      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRI, margin: '0 0 2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.35 }}>{name}</p>
        {occasion && <p style={{ fontSize: 9, color: GOLD, margin: '0 0 2px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{occasion}</p>}
        <p style={{ fontSize: 11, color: TEXT_SEC, margin: '0 0 3px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{why}</p>
        <p style={{ fontSize: 13, color: GOLD, margin: 0 }}>{price}</p>
      </div>
      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
        {match?.image && onTryOn && (
          <button onClick={() => onTryOn(match.image, name)}
            title="Try On"
            style={{ height: 28, padding: '0 10px', border: `1px solid ${BORDER}`, borderRadius: 6, background: 'transparent', color: TEXT_SEC, cursor: 'pointer', fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 150ms ease' }}
            onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = GOLD; b.style.color = GOLD; }}
            onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = BORDER; b.style.color = TEXT_SEC; }}>
            <Camera size={10} /> Try
          </button>
        )}
        <button onClick={() => onAddItem(name)}
          style={{ height: 28, padding: '0 10px', border: `1px solid ${GOLD}`, borderRadius: 6, background: 'transparent', color: GOLD, cursor: 'pointer', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', transition: 'all 150ms ease' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = GOLD; (e.currentTarget as HTMLButtonElement).style.color = BG_BASE; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = GOLD; }}>
          Add
        </button>
      </div>
    </div>
  );
}

function ColorAdvisorCard({ data, catalog, onAddItem, onTryOn }: { data: AIColorAdvisor; catalog: CatalogItem[]; onAddItem: (name: string) => void; onTryOn: (imageUrl: string, name: string) => void }) {
  const toneColor: Record<string, string> = { Fair: '#f9e4c8', Wheatish: '#d4a373', Dusky: '#9c6b3a', Deep: '#5c3d1e' };
  return (
    <FeatureCard accent="#c084fc">
      <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Palette size={14} color="#c084fc" />
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c084fc' }}>Color Advisor</span>
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: toneColor[data.skin_tone] || '#d4a373', border: '1px solid #3a2a18', marginLeft: 4 }} />
          <span style={{ fontSize: 10, color: TEXT_SEC }}>{data.skin_tone} Skin Tone</span>
        </div>
        <p style={{ fontSize: 13, color: TEXT_SEC, lineHeight: 1.65, margin: 0 }}>{data.reason}</p>
      </div>
      <div style={{ padding: '14px 22px' }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4ade80', margin: '0 0 8px' }}>✓ Your Best Colors</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {data.best_colors.map(c => <Pill key={c} label={c} color="#4ade80" />)}
        </div>
        {data.avoid_colors.length > 0 && <>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f87171', margin: '0 0 8px' }}>✕ Avoid</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {data.avoid_colors.map(c => <Pill key={c} label={c} color="#f87171" />)}
          </div>
        </>}
        {data.catalog_matches.length > 0 && <>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6 }}><Sparkles size={10} /> Catalog Picks</p>
          {data.catalog_matches.map((item, i) => (
            <ProductPickRow key={i} name={item.name} price={item.price} why={item.why} catalog={catalog} onAddItem={onAddItem} onTryOn={onTryOn} isLast={i === 0 && data.catalog_matches.length === 1} />
          ))}
        </>}
      </div>
    </FeatureCard>
  );
}

function DressCodeCard({ data, catalog, onAddItem, onTryOn }: { data: AIDressCode; catalog: CatalogItem[]; onAddItem: (name: string) => void; onTryOn: (imageUrl: string, name: string) => void }) {
  return (
    <FeatureCard accent={GOLD}>
      <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Tag size={14} color={GOLD} />
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD }}>Dress Code</span>
          <Pill label={data.dress_code} />
        </div>
        <p style={{ fontSize: 15, color: TEXT_PRI, margin: '0 0 6px', fontStyle: 'italic' }}>{data.vibe_summary}</p>
        <p style={{ fontSize: 12, color: TEXT_SEC, margin: 0, lineHeight: 1.6 }}>{data.indian_context}</p>
      </div>
      <div style={{ padding: '14px 22px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4ade80', margin: '0 0 6px' }}>✓ Wear</p>
            {data.wear.map((item, i) => <p key={i} style={{ fontSize: 11, color: TEXT_SEC, margin: '2px 0' }}>• {item}</p>)}
          </div>
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#f87171', margin: '0 0 6px' }}>✕ Avoid</p>
            {data.avoid.map((item, i) => <p key={i} style={{ fontSize: 11, color: TEXT_SEC, margin: '2px 0' }}>• {item}</p>)}
          </div>
        </div>
        {data.catalog_picks.length > 0 && <>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6 }}><Sparkles size={10} /> From Your Catalog</p>
          {data.catalog_picks.map((pick, i) => (
            <ProductPickRow key={i} name={pick.name} price={pick.price} why={pick.why} catalog={catalog} onAddItem={onAddItem} onTryOn={onTryOn} isLast={i === 0 && data.catalog_picks.length === 1} />
          ))}
        </>}
      </div>
    </FeatureCard>
  );
}

function StyleChatCard({ data, catalog, onAddItem, onTryOn }: { data: AIStyleChat; catalog: CatalogItem[]; onAddItem: (name: string) => void; onTryOn: (imageUrl: string, name: string) => void }) {
  return (
    <FeatureCard accent={GOLD}>
      {data.catalog_recommendations.length > 0 && (
        <div style={{ padding: '14px 22px 18px' }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6 }}><Sparkles size={10} /> {data.confidence}</p>
          {data.catalog_recommendations.map((item, i) => (
            <ProductPickRow key={i} name={item.name} price={item.price} why={item.why} occasion={item.occasion} catalog={catalog} onAddItem={onAddItem} onTryOn={onTryOn} isLast={i === 0 && data.catalog_recommendations.length === 1} />
          ))}
        </div>
      )}
    </FeatureCard>
  );
}

// ─── AI RESPONSE RENDERER ─────────────────────────────────────────
function FabricScannerCard({ data, catalog, onAddItem, onTryOn }: { data: AIFabricScanner; catalog: CatalogItem[]; onAddItem: (name: string) => void; onTryOn: (imageUrl: string, name: string) => void }) {
  return (
    <FeatureCard accent="#38bdf8">
      <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <ScanLine size={14} color="#38bdf8" />
          <span style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#38bdf8' }}>Fabric Scanner</span>
          <Pill label={data.fabric_type} />
        </div>
        <p style={{ fontFamily: 'Inter', fontSize: 13, color: TEXT_SEC, lineHeight: 1.65, margin: 0 }}><strong>Care Instructions:</strong> {data.care_instructions}</p>
        <p style={{ fontFamily: 'Inter', fontSize: 13, color: TEXT_SEC, lineHeight: 1.65, margin: '6px 0 0' }}><strong>Season:</strong> {data.season_suitability}</p>
      </div>
      {data.catalog_matches.length > 0 && (
        <div style={{ padding: '14px 22px' }}>
          <p style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6 }}><Sparkles size={10} /> Catalog Picks</p>
          {data.catalog_matches.map((item, i) => (
            <ProductPickRow key={i} name={item.name} price={item.price} why={item.why} catalog={catalog} onAddItem={onAddItem} onTryOn={onTryOn} isLast={i === 0 && data.catalog_matches.length === 1} />
          ))}
        </div>
      )}
    </FeatureCard>
  );
}

function AIResponseRenderer({ aiResponse, catalog, onAddItem, onTryOn }: { aiResponse: AIFeatureResponse; catalog: CatalogItem[]; onAddItem: (name: string) => void; onTryOn: (imageUrl: string, name: string) => void }) {
  switch (aiResponse.feature) {
    case 'color_advisor': return <ColorAdvisorCard data={aiResponse} catalog={catalog} onAddItem={onAddItem} onTryOn={onTryOn} />;
    case 'dress_code_explainer': return <DressCodeCard data={aiResponse} catalog={catalog} onAddItem={onAddItem} onTryOn={onTryOn} />;
    case 'fabric_scanner': return <FabricScannerCard data={aiResponse} catalog={catalog} onAddItem={onAddItem} onTryOn={onTryOn} />;
    case 'style_chat': return aiResponse.catalog_recommendations.length > 0 ? <StyleChatCard data={aiResponse} catalog={catalog} onAddItem={onAddItem} onTryOn={onTryOn} /> : null;
    default: return null;
  }
}

// ─── HISTORY DRAWER ───────────────────────────────────────────────
function HistoryDrawer({ open, onClose, onLoadSession, onNewChat }: {
  open: boolean; onClose: () => void;
  onLoadSession: (s: ChatSession) => void; onNewChat: () => void;
}) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  useEffect(() => { if (open) setSessions(getSessions()); }, [open]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSession(id);
    setSessions(getSessions());
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', zIndex: 40 }} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 320, background: '#0f0803', borderLeft: `1px solid ${BORDER}`, boxShadow: '-8px 0 40px rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', flexDirection: 'column', }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 18px 14px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <History size={15} color={GOLD} />
                <span style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRI }}>Chat History</span>
              </div>
              <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${BORDER}`, background: 'transparent', color: TEXT_SEC, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 180ms ease' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = GOLD; (e.currentTarget as HTMLButtonElement).style.color = GOLD; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BORDER; (e.currentTarget as HTMLButtonElement).style.color = TEXT_SEC; }}>
                <X size={12} />
              </button>
            </div>
            {/* New Chat */}
            <div style={{ padding: '12px 14px 8px', flexShrink: 0 }}>
              <motion.button whileHover={{ filter: 'brightness(1.1)' }} whileTap={{ scale: 0.98 }}
                onClick={() => { onNewChat(); onClose(); }}
                style={{ width: '100%', height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_MU})`, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: BG_BASE }}>
                <RefreshCcw size={12} /> New Conversation
              </motion.button>
            </div>
            {/* Count */}
            <div style={{ padding: '2px 14px 8px', flexShrink: 0 }}>
              <span style={{ fontSize: 9, color: TEXT_SEC, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {sessions.length === 0 ? 'No saved chats yet' : `${sessions.length} saved conversation${sessions.length > 1 ? 's' : ''}`}
              </span>
            </div>
            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 14px' }} className="fv-chat-log">
              {sessions.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '55%', gap: 10 }}>
                  <Clock size={28} color={BORDER} />
                  <p style={{ fontSize: 12, color: TEXT_SEC, textAlign: 'center', lineHeight: 1.6, margin: 0 }}>Your past conversations<br />will appear here.</p>
                </div>
              ) : sessions.map(s => (
                <motion.div key={s.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 9, marginBottom: 7, overflow: 'hidden', transition: 'border-color 180ms ease', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = `${GOLD}55`}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = BORDER}
                  onClick={() => { onLoadSession(s); onClose(); }}>
                  <div style={{ padding: '10px 12px 6px' }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRI, margin: '0 0 4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>{s.title}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={9} color={TEXT_SEC} />
                        <span style={{ fontSize: 10, color: TEXT_SEC }}>{timeAgo(s.ts)}</span>
                        <span style={{ fontSize: 10, color: BORDER }}>·</span>
                        <span style={{ fontSize: 10, color: TEXT_SEC }}>{s.messages.filter(m => m.role === 'user').length} msgs</span>
                      </div>
                      <button onClick={(e) => handleDelete(s.id, e)}
                        style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 4, padding: '2px 7px', cursor: 'pointer', fontSize: 8, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b4f3a', transition: 'all 150ms ease' }}
                        onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = '#f87171'; b.style.color = '#f87171'; }}
                        onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = BORDER; b.style.color = '#6b4f3a'; }}>
                        <Trash2 size={8} /> Del
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div style={{ padding: '10px 14px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
              <p style={{ fontSize: 9, color: '#3a2a18', letterSpacing: '0.14em', textTransform: 'uppercase', margin: 0, textAlign: 'center' }}>FashionVerse AI · History</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function StyleBuilderPage() {
  useDeviceOptimization();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const { messages, setMessages, clearMessages } = useStylistStore();
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>(makeSessionId());
  const [sessionTitle, setSessionTitle] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'chat' | 'tools'>('chat');

  // Photo state
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoMime, setPhotoMime] = useState<string>('image/jpeg');
  const [photoThumb, setPhotoThumb] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);



  const { user, profile } = useAuthStore();
  const chatLogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const { addItem, openCart } = useCartStore();
  const { setUpperwearFile, setBottomwearFile } = useTryOnStore();

  // Load catalog
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

  // Auto-scroll
  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTo({ top: chatLogRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isGenerating]);

  // Photo upload handler
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoMime(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const b64 = dataUrl.split(',')[1];
      setPhotoBase64(b64);
      setPhotoThumb(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearPhoto = () => { setPhotoBase64(null); setPhotoThumb(null); };



  // Add single item to cart
  const addSingleItemToCart = (name: string) => {
    const p = catalog.find(c => c.name === name);
    if (p) {
      addItem({ product_id: p.id, color_name: p.color_name, size: 'M', quantity: 1, product_name: p.name, product_price: p.price, image_url: p.image });
      toast.success(`${p.name} added to cart!`);
      openCart();
    } else {
      toast.error('Could not find this item in the catalog.');
    }
  };

  const handleSendMessage = async (text?: string) => {
    const msgText = (text ?? inputValue).trim();
    if (!msgText && !photoBase64) return;
    if (isGenerating) return;
    if (!catalogLoaded) { toast.error('Catalog is loading. Please wait a moment.'); return; }

    const userText = msgText || (photoBase64 ? '[Shared a photo for styling advice]' : '');
    setInputValue('');
    const thumb = photoThumb;
    const b64 = photoBase64;
    const mime = photoMime;
    clearPhoto();

    const newMsg: Message = { id: Date.now().toString(), role: 'user', text: userText, photoThumb: thumb || undefined };
    const newMessages = [...messages, newMsg];
    setMessages(newMessages);
    setIsGenerating(true);

    // Set session title from first user message
    if (!sessionTitle) {
      const title = userText.split(' ').slice(0, 6).join(' ') + (userText.split(' ').length > 6 ? '…' : '');
      setSessionTitle(title);
    }

    try {
      const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      const catalogString = catalog.slice(0, 50).map((p, i) =>
        `${i + 1}. [${p.category.toUpperCase()}] ${p.name} | Brand: ${p.brand} | Price: ₹${p.price} | Color: ${p.color_name} | Image: ${p.image}`
      ).join('\n');

      const recentHistory = newMessages.slice(-8).map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n');

      const systemInstruction = `You are FashionVerse AI — an elite personal style consultant for an Indian fashion e-commerce platform.
Speak in a highly professional, polite, and respectful manner, treating the user as a valued customer. Be warm and helpful but maintain a professional distance (do NOT use overly familiar terms like "my dear", "babe", etc.).
You CAN see images. If a photo is attached, analyze it directly. Never say you cannot see or scan images.
Use ₹ for all pricing. Be direct, specific, and never robotic.
Know Indian occasions deeply: weddings, mehendi, sangeet, puja, office, festive, casual, first dates, family functions.
Reference chat history naturally without announcing it.

RECENT CHAT HISTORY (use for context, never re-recommend already suggested products):
${recentHistory}

AVAILABLE CATALOG (ONLY recommend from this list):
${catalogString}

═══ AUTO-DETECTION RULES — pick ONE feature ═══
- IF message contains [PHOTO_ATTACHED: true] AND user asks about colors/skin tone → feature: "color_advisor"
- IF message contains [PHOTO_ATTACHED: true] AND user asks about fabric/texture/material → feature: "fabric_scanner"
- IF message contains [PHOTO_ATTACHED: true] AND no specific color query → feature: "color_advisor" (analyze photo for skin tone)
- IF user asks what a dress code means OR what to wear to a named event/party → feature: "dress_code_explainer"
- IF user needs a full outfit curated (clear event + needs complete look) → feature: "outfit"
- IF none of the above → feature: "style_chat"

═══ RESPONSE RULES ═══
- Return ONLY valid raw JSON — zero markdown, zero backticks, zero extra text
- Always include the correct "feature" field
- Only use products from the catalog; if no match, return feature structure with empty arrays
- Max 3 catalog recommendations per response. Always include "why" for every recommendation
- All prices in ₹ format. Never re-recommend products already shown this session

═══ FEATURE SCHEMAS ═══

feature: "fabric_scanner":
{"feature":"fabric_scanner","chat_response":"conversational reply max 2 sentences","fabric_type":"<fabric>","care_instructions":"1 sentence","season_suitability":"Summer|Winter...","catalog_matches":[{"name":"<exact product name>","price":"₹<price>","why":"1 line"}]}

feature: "color_advisor":
{"feature":"color_advisor","chat_response":"conversational reply max 2 sentences","skin_tone":"Fair|Wheatish|Dusky|Deep","best_colors":["color1","color2","color3","color4"],"avoid_colors":["color1","color2"],"borderline_colors":["color1"],"reason":"1 sentence why","catalog_matches":[{"name":"<exact product name>","color":"<color>","price":"₹<price>","why":"1 line"}]}

feature: "dress_code_explainer":
{"feature":"dress_code_explainer","chat_response":"conversational reply max 2 sentences","dress_code":"<name>","vibe_summary":"1 sentence mood","wear":["item1","item2","item3"],"avoid":["item1","item2"],"borderline":["item1"],"indian_context":"1 sentence","catalog_picks":[{"name":"<exact product name>","price":"₹<price>","why":"fits because..."}]}

feature: "outfit":
{"feature":"outfit","chat_response":"conversational reply max 2 sentences","is_outfit_curated":true,"outfit_name":"name","analysis":"analysis","dress_code_level":"level","items":[{"slot":"Top","product_name":"exact name","brand":"brand","price":1799,"image_url":"exact url from catalog","reason":"why"}],"total_price":0,"style_tip":"tip","mediator_note":"note","confidence_score":90}

feature: "style_chat":
{"feature":"style_chat","chat_response":"conversational reply warm direct Indian context aware max 3 sentences","style_tags":["tag1","tag2"],"confidence":"Perfect Match|Strong Match|Close Option","catalog_recommendations":[{"name":"<exact product name>","price":"₹<price>","occasion":"occasion","why":"1 line reason"}]}`;

      // Build API contents — handle photo
      type ApiPart = { text: string } | { inline_data: { mime_type: string; data: string } };
      const apiContents: { role: string; parts: ApiPart[] }[] = newMessages.map((m, idx) => {
        if (m.role === 'user' && idx === newMessages.length - 1 && b64) {
          return {
            role: 'user',
            parts: [
              { inline_data: { mime_type: mime, data: b64 } } as ApiPart,
              { text: `${m.text} [PHOTO_ATTACHED: true]` } as ApiPart
            ]
          };
        }
        return { role: m.role, parts: [{ text: m.text } as ApiPart] };
      });

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

      let displayMessage = "Here's what I found for you!";
      let parsedOutfit: StylistResponse | undefined;
      let aiResponse: AIFeatureResponse | undefined;

      try {
        const aiData = JSON.parse(rawText);
        displayMessage = aiData.chat_response || displayMessage;
        const feature = aiData.feature;

        if (feature === 'outfit' && aiData.is_outfit_curated && Array.isArray(aiData.items) && aiData.items.length > 0) {
          const enrichedItems: StylistItem[] = aiData.items.filter((i: StylistItem) => i.product_name).map((item: StylistItem) => {
            const match = catalog.find(p => p.name === item.product_name);
            return { ...item, image_url: match?.image || item.image_url || '', brand: match?.brand || item.brand, price: match?.price ?? item.price };
          });
          if (enrichedItems.length > 0) {
            parsedOutfit = {
              outfit_name: aiData.outfit_name || 'Curated Look', analysis: aiData.analysis || '',
              dress_code_level: aiData.dress_code_level || 'Custom', items: enrichedItems,
              total_price: enrichedItems.reduce((s, i) => s + (i.price || 0), 0),
              style_tip: aiData.style_tip || '', mediator_note: aiData.mediator_note || '',
              confidence_score: aiData.confidence_score || 90
            };
          }
        } else if (feature === 'color_advisor' || feature === 'dress_code_explainer' || feature === 'style_chat' || feature === 'fabric_scanner') {
          aiResponse = aiData as AIFeatureResponse;
        }
      } catch (parseErr) {
        console.error('JSON parse failed:', parseErr, rawText);
        displayMessage = 'My styling engine had a hiccup. Please try again!';
      }

      const modelMsg: Message = { id: Date.now().toString(), role: 'model', text: displayMessage, outfit: parsedOutfit, aiResponse };
      const finalMessages = [...newMessages, modelMsg];
      setMessages(finalMessages);

      // Save to history
      const title = sessionTitle || userText.split(' ').slice(0, 6).join(' ');
      saveSession(sessionId, title, finalMessages);

    } catch (err: any) {
      toast.error(err.message || 'Failed to connect. Please try again.', { duration: 5000 });
      let errorText = "I'm sorry, there was a temporary issue. Please try again in a moment.";
      if (err.message?.toLowerCase().includes('quota')) {
        errorText = `I'm currently receiving too many requests. Please wait a few seconds and try again.`;
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

  // Try On for feature card products (takes imageUrl + productName directly)
  const handleFeatureTryOn = async (imageUrl: string, productName: string) => {
    if (!imageUrl) { toast.error('No image available for this product.'); return; }
    const tid = toast.loading(`Loading ${productName} into Try-On Studio…`);
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], 'garment.jpg', { type: blob.type });
      const isBottom = /bottom|pant|jean|trouser|skirt|shorts/i.test(productName.toLowerCase());
      if (isBottom) setBottomwearFile(file, imageUrl);
      else setUpperwearFile(file, imageUrl);
      toast.success('Ready! Launching Try-On Studio.', { id: tid });
      navigate('/try-on');
    } catch { toast.error('Could not load product image.', { id: tid }); }
  };

  const handleNewChat = () => {
    clearMessages();
    setSessionId(makeSessionId());
    setSessionTitle(null);
    clearPhoto();
  };

  const handleLoadSession = (s: ChatSession) => {
    setMessages(s.messages);
    setSessionId(s.id);
    setSessionTitle(s.title);
  };

  return (
    <>
      <style>{`
        ::selection { background: rgba(212,160,50,0.28); }
        .fv-chat-log::-webkit-scrollbar { width: 4px; }
        .fv-chat-log::-webkit-scrollbar-track { background: transparent; }
        .fv-chat-log::-webkit-scrollbar-thumb { background: #D4A032; border-radius: 4px; }
        .ai-bubble { border-left: 3px solid ${GOLD}; padding-left: 14px; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .match-badge { background-size: 200% auto; }
        .fv-input:focus-within { border-color: ${GOLD} !important; box-shadow: 0 0 0 3px rgba(212,160,50,0.10) !important; }
        @keyframes ripple { to { transform: scale(2.6); opacity: 0; } }
        .send-btn { position: relative; overflow: hidden; }
        .send-btn::after { content: ''; position: absolute; width: 100%; height: 100%; top: 0; left: 0; background: rgba(212,160,50,0.4); border-radius: 50%; transform: scale(0); opacity: 1; pointer-events: none; }
        .send-btn:active::after { animation: ripple 300ms ease-out forwards; }
      `}</style>

      {/* Hidden file input */}
      <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoSelect} />

      {/* History Drawer */}
      <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} onLoadSession={handleLoadSession} onNewChat={handleNewChat} />

      <div className="fv-page" style={{ height: '100vh', background: BG_BASE, color: TEXT_PRI, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

        <div style={{ maxWidth: 860, margin: '0 auto', width: '100%', padding: '0 16px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, position: 'relative', zIndex: 1 }}>

          {/* ── HEADER ── */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0 14px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${SURFACE}, #1e1005)`, border: `1px solid ${BORDER}`, boxShadow: `0 0 14px rgba(212,160,50,0.15)`, overflow: 'hidden' }}>
                  <img src="/logo.png" alt="FV Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8] }} transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                  style={{ position: 'absolute', top: -1, right: -1, width: 10, height: 10, borderRadius: '50%', background: '#4ade80', border: `2px solid ${BG_BASE}` }} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: GOLD, letterSpacing: '-0.01em', lineHeight: 1 }}>FashionVerse AI</div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: TEXT_SEC, marginTop: 2 }}>Elite Style Consultant</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', border: `1px solid ${BORDER}`, borderRadius: 20, fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: catalogLoaded ? '#4ade80' : TEXT_SEC }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: catalogLoaded ? '#4ade80' : TEXT_SEC, flexShrink: 0 }} />
                {catalogLoaded ? `${catalog.length} Products` : 'Loading…'}
              </div>
              {/* Mode Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', background: `rgba(212,160,50,0.08)`, borderRadius: 20, padding: 2, marginRight: 8, border: `1px solid ${BORDER}` }}>
                <button onClick={() => setViewMode('chat')} style={{ padding: '6px 14px', borderRadius: 18, border: 'none', background: viewMode === 'chat' ? GOLD : 'transparent', color: viewMode === 'chat' ? BG_BASE : TEXT_SEC, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}>
                  Chat
                </button>
                <button onClick={() => setViewMode('tools')} style={{ padding: '6px 14px', borderRadius: 18, border: 'none', background: viewMode === 'tools' ? GOLD : 'transparent', color: viewMode === 'tools' ? BG_BASE : TEXT_SEC, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}>
                  Tools
                </button>
              </div>

              {/* History button */}
              <motion.button whileHover={{ borderColor: GOLD, color: GOLD }} whileTap={{ scale: 0.96 }}
                onClick={() => setHistoryOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', border: `1px solid ${BORDER}`, borderRadius: 20, background: 'transparent', color: TEXT_SEC, cursor: 'pointer', fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', transition: 'border-color 200ms ease, color 200ms ease' }}>
                <History size={12} /> History
              </motion.button>
              {/* New Chat */}
              {messages.length > 1 && viewMode === 'chat' && (
                <motion.button initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ borderColor: GOLD, color: GOLD }} whileTap={{ scale: 0.96 }}
                  onClick={handleNewChat}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', border: `1px solid ${BORDER}`, borderRadius: 20, background: 'transparent', color: TEXT_SEC, cursor: 'pointer', fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', transition: 'border-color 200ms ease, color 200ms ease' }}>
                  <RefreshCcw size={12} /> New Chat
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* ── CHAT LOG OR TOOLS ── */}
          {viewMode === 'tools' ? (
            <div className="fv-elegant-scroll" onWheel={(e) => e.stopPropagation()} style={{ flex: 1, overflowY: 'auto', padding: '20px 8px 20px 0', minHeight: 0 }}>
              <StandaloneFashionTools />
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}
              ref={chatLogRef} className="fv-chat-log fv-elegant-scroll"
            onWheel={(e) => e.stopPropagation()}
            style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 220px)', padding: '28px 8px 12px 0', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>

                  {/* AI Message */}
                  {msg.role === 'model' && (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', maxWidth: '85%' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: SURFACE, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2, overflow: 'hidden' }}>
                        <img src="/logo.png" alt="FV Bot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ width: '100%' }}>
                        {msg.text && (
                          <div className="ai-bubble" style={{ paddingTop: 2, paddingBottom: 2 }}>
                            <p style={{ fontSize: 14, color: TEXT_PRI, lineHeight: 1.75, margin: 0, fontWeight: 400 }}>
                              {msg.text.split('**').map((part, i) =>
                                i % 2 === 1 ? <strong key={i} style={{ color: GOLD, fontWeight: 700 }}>{part}</strong> : <span key={i}>{part}</span>
                              )}
                            </p>
                          </div>
                        )}
                        {msg.outfit && (
                          <OutfitCard outfit={msg.outfit} onAddToCart={() => addOutfitToCart(msg.outfit!)} onTryOn={handleTryOn} />
                        )}
                        {msg.aiResponse && (
                          <AIResponseRenderer aiResponse={msg.aiResponse} catalog={catalog} onAddItem={addSingleItemToCart} onTryOn={handleFeatureTryOn} />
                        )}
                      </div>
                    </div>
                  )}

                  {/* User Message */}
                  {msg.role === 'user' && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: 'row-reverse', maxWidth: '72%' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_MU})`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2, boxShadow: `0 0 12px rgba(212,160,50,0.25)`, overflow: 'hidden' }}>
                        {(profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture) ? (
                          <img src={profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <User size={14} color={BG_BASE} />
                        )}
                      </div>
                      <div>
                        {msg.photoThumb && (
                          <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'flex-end' }}>
                            <img src={msg.photoThumb} alt="Uploaded" style={{ height: 60, borderRadius: 8, border: `1px solid ${GOLD}55`, objectFit: 'cover' }} />
                          </div>
                        )}
                        <div style={{ background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_MU} 100%)`, borderRadius: '16px 16px 4px 16px', padding: '12px 16px', boxShadow: `0 4px 16px rgba(212,160,50,0.2)` }}>
                          <p style={{ fontSize: 14, color: BG_BASE, fontWeight: 500, lineHeight: 1.65, margin: 0 }}>{msg.text}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isGenerating && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: SURFACE, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <img src="/logo.png" alt="FV Bot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div className="ai-bubble" style={{ paddingTop: 4, paddingBottom: 4 }}>
                    <TypingDots />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          )}

          {/* ── BOTTOM INPUT AREA ── */}
          {viewMode === 'chat' && (
            <div style={{ position: 'sticky', bottom: 0, zIndex: 10, background: BG_BASE, flexShrink: 0, paddingTop: 10, paddingBottom: 14 }}>

            {/* Photo preview */}
            <AnimatePresence>
              {photoThumb && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '8px 12px', background: 'rgba(212,160,50,0.06)', border: `1px solid rgba(212,160,50,0.2)`, borderRadius: 10 }}>
                  <img src={photoThumb} alt="Photo" style={{ height: 40, borderRadius: 6, border: `1px solid ${GOLD}55`, objectFit: 'cover' }} />
                  <span style={{ fontSize: 11, color: TEXT_SEC, flex: 1 }}>📸 Photo attached — I'll analyze it for you!</span>
                  <button onClick={clearPhoto}
                    style={{ background: 'transparent', border: 'none', color: TEXT_SEC, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── FEATURE QUICK-ACCESS CHIPS ── */}
            {!isGenerating && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {[
                  { icon: Palette, label: 'Color Advisor', prompt: 'I want to know which colors suit me best. Analyze my skin tone.', color: '#c084fc' },
                  { icon: ScanLine, label: 'Fabric Scanner', prompt: 'I want to know what fabric this is. Please scan the attached photo.', color: '#38bdf8' },
                  { icon: Tag, label: 'Decode Dress Code', prompt: 'I have a formal wedding this weekend with a black-tie dress code. What should I wear?', color: GOLD },
                  { icon: Star, label: 'Festive Outfit', prompt: 'I need a festive outfit for Diwali celebrations. Style me!', color: GOLD },
                  { icon: Wand2, label: 'Office Look', prompt: 'Give me a smart business casual outfit for office. Something modern and sharp.', color: GOLD },
                  { icon: Camera, label: 'Upload Photo', prompt: '', color: GOLD, isPhoto: true },
                ].map((chip, i) => (
                  <motion.button key={i}
                    whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      if ((chip as { isPhoto?: boolean }).isPhoto) { photoInputRef.current?.click(); return; }
                      handleSendMessage(chip.prompt);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      height: 32, padding: '0 14px',
                      background: 'rgba(10,6,0,0.82)',
                      border: `1px solid rgba(212,160,50,0.28)`,
                      borderRadius: 20, cursor: 'pointer',
                      fontSize: 11, fontWeight: 500,
                      color: TEXT_PRI, backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
                      transition: 'border-color 160ms, box-shadow 160ms',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = `${chip.color}88`;
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 2px 14px rgba(0,0,0,0.5), 0 0 0 1px ${chip.color}33`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(212,160,50,0.28)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 10px rgba(0,0,0,0.4)';
                    }}>
                    <chip.icon size={12} color={chip.color} />
                    {chip.label}
                  </motion.button>
                ))}
              </div>
            )}
            <div style={{ background: 'rgba(22,12,3,0.75)', border: `1px solid rgba(212,160,50,0.18)`, borderRadius: 16, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', boxShadow: '0 4px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(212,160,50,0.08)', padding: '12px 12px 10px 18px', transition: 'border-color 200ms ease, box-shadow 200ms ease' }}
              onFocusCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(212,160,50,0.55)`; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 32px rgba(0,0,0,0.45), 0 0 0 2px rgba(212,160,50,0.10), inset 0 1px 0 rgba(212,160,50,0.12)`; }}
              onBlurCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(212,160,50,0.18)`; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(212,160,50,0.08)`; }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                {/* Photo upload button */}
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.93 }}
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isGenerating}
                  title="Upload photo for style analysis"
                  style={{ width: 36, height: 36, flexShrink: 0, borderRadius: '50%', border: `1px solid ${photoThumb ? GOLD : BORDER}`, background: photoThumb ? `rgba(212,160,50,0.12)` : 'transparent', color: photoThumb ? GOLD : TEXT_SEC, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 200ms ease', marginBottom: 4 }}>
                  <ImagePlus size={15} />
                </motion.button>



                <textarea ref={inputRef} value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  placeholder={catalogLoaded ? 'Ask about outfit, dress code, color advice, or share a photo…' : 'Loading catalog…'}
                  disabled={isGenerating || !catalogLoaded}
                  rows={1}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontSize: 14, color: TEXT_PRI, lineHeight: 1.65, fontWeight: 400, padding: '2px 0 4px', maxHeight: 110, caretColor: GOLD }}
                  onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 110) + 'px'; }} />

                <motion.button className="send-btn" whileHover={{ scale: 1.07, boxShadow: `0 0 22px rgba(212,160,50,0.45)` }} whileTap={{ scale: 0.94 }}
                  onClick={() => handleSendMessage()}
                  disabled={(!inputValue.trim() && !photoBase64) || isGenerating || !catalogLoaded}
                  style={{ width: 44, height: 44, flexShrink: 0, borderRadius: '50%', border: 'none', background: (inputValue.trim() || photoBase64) && !isGenerating ? `linear-gradient(135deg, #e8b840 0%, ${GOLD_MU} 100%)` : `rgba(212,160,50,0.15)`, cursor: (inputValue.trim() || photoBase64) && !isGenerating ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 220ms ease', boxShadow: (inputValue.trim() || photoBase64) && !isGenerating ? '0 2px 12px rgba(212,160,50,0.25)' : 'none' }}>
                  {isGenerating
                    ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }} style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid rgba(212,160,50,0.3)`, borderTopColor: GOLD }} />
                    : <Send size={17} color={(inputValue.trim() || photoBase64) ? BG_BASE : GOLD_MU} />
                  }
                </motion.button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: `1px solid rgba(212,160,50,0.08)` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: catalogLoaded ? '#4ade80' : '#f59e0b' }} />
                    <span style={{ fontSize: 10, color: '#4a3a28', letterSpacing: '0.1em' }}>
                      {catalogLoaded ? `${catalog.length} items in catalog` : 'Loading catalog…'}
                    </span>
                  </div>
                  <span style={{ color: '#2a1a08', fontSize: 10 }}>·</span>
                  <span style={{ fontSize: 10, color: '#4a3a28', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Enter to send &middot; <span style={{ position: 'relative', top: '-1px', fontSize: 11 }}>📸</span> for photo analysis
                  </span>
                </div>
                <span style={{ fontSize: 10, color: inputValue.length > 400 ? '#f59e0b' : '#4a3a28', letterSpacing: '0.06em', transition: 'color 200ms' }}>
                  {inputValue.length}/500
                </span>
              </div>
            </div>

            <p style={{ textAlign: 'center', fontSize: 9.5, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#3a2a18', margin: '10px 0 0' }}>
              FashionVerse AI · Recommendations sourced from your live catalog
            </p>
            </div>
          )}
          
        </div>
      </div>
    </>
  );
}
