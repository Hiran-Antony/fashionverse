import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Package, Truck, CheckCircle, User as UserIcon,
  Bell, MapPin, Phone, ShieldCheck, ChevronRight,
  LogOut, Clock, IndianRupee, X, Zap, Star,
  TrendingUp, WifiOff, Map as MapIcon, Navigation, LocateFixed
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

// ── Theme tokens ─────────────────────────────────────────────────
const C = {
  bg:      '#0A0A0A',
  card:    '#141414',
  card2:   '#1C1C1C',
  green:   '#00C853',
  greenDim:'rgba(0,200,83,0.12)',
  greenBrd:'rgba(0,200,83,0.25)',
  orange:  '#FF6B00',
  orangeDim:'rgba(255,107,0,0.12)',
  orangeBrd:'rgba(255,107,0,0.3)',
  blue:    '#2979FF',
  blueDim: 'rgba(41,121,255,0.12)',
  text:    '#FFFFFF',
  muted:   '#888888',
  border:  '#2A2A2A',
  red:     '#FF3D3D',
};

// Fix leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

type DriverTab = 'available' | 'my-orders' | 'map' | 'completed' | 'profile';

interface Order {
  id: string;
  status: string;
  total_amount: number;
  delivery_pin?: string;
  driver_id?: string;
  pin_verified?: boolean;
  pin_attempts?: number;
  claimed_at?: string;
  delivered_at?: string;
  created_at: string;
  address: any;
  order_items?: any[];
}

// Default fallback coordinates (Coimbatore)
const DEFAULT_HUB_LAT = 11.0168;
const DEFAULT_HUB_LNG = 76.9558;

function getOrderCoords(orderId: string, hubLat: number, hubLng: number): [number, number] {
  let hash = 0;
  for (let i = 0; i < orderId.length; i++) {
    hash = (hash * 31 + orderId.charCodeAt(i)) & 0xffffffff;
  }
  const latOffset = ((hash & 0xff) / 255 - 0.5) * 0.12;
  const lngOffset = (((hash >> 8) & 0xff) / 255 - 0.5) * 0.12;
  return [hubLat + latOffset, hubLng + lngOffset];
}

const hubIcon = L.divIcon({
  html: `<div style="background:${C.green};width:36px;height:36px;border-radius:50%;border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,200,83,0.5);font-size:16px;line-height:1">📍</div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const deliveryIcon = L.divIcon({
  html: `<div style="background:${C.orange};width:30px;height:30px;border-radius:50%;border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(255,107,0,0.5);font-size:13px;line-height:1">📦</div>`,
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const availableIcon = L.divIcon({
  html: `<div style="background:${C.blue};width:28px;height:28px;border-radius:50%;border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(41,121,255,0.5);font-size:12px;line-height:1">🟢</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function FitBounds({ coords, hubLocation }: { coords: [number, number][], hubLocation: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) {
      const bounds = L.latLngBounds([hubLocation, ...coords]);
      map.fitBounds(bounds, { padding: [30, 30] });
    } else {
      map.setView(hubLocation, 13);
    }
  }, [coords, map, hubLocation]);
  return null;
}

// ── Delivery Map ──────────────────────────────────────────────────
function DeliveryMap({ myOrders, availableOrders, optimizedRoute, isOptimizing, hubLocation }: {
  myOrders: Order[];
  availableOrders: Order[];
  optimizedRoute: [number, number][];
  isOptimizing: boolean;
  hubLocation: [number, number];
}) {
  const activeCoords = myOrders.map(o => getOrderCoords(o.id, hubLocation[0], hubLocation[1]));
  const availCoords = availableOrders.map(o => getOrderCoords(o.id, hubLocation[0], hubLocation[1]));
  const allCoords = [...activeCoords, ...availCoords];

  return (
    <div style={{ height: '340px', borderRadius: '16px', overflow: 'hidden', border: `1px solid ${C.border}`, position: 'relative' }}>
      {isOptimizing && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,10,0.85)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '16px' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '40px', height: '40px', border: `3px solid ${C.greenDim}`, borderTop: `3px solid ${C.green}`, borderRadius: '50%', marginBottom: '14px' }} />
          <p style={{ color: C.green, fontWeight: 700, fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>Optimizing Route...</p>
        </div>
      )}
      <MapContainer center={hubLocation} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <FitBounds coords={allCoords} hubLocation={hubLocation} />
        <Marker position={hubLocation} icon={hubIcon}>
          <Popup><strong>Your Location</strong><br />Current Position</Popup>
        </Marker>
        {myOrders.map(o => {
          const [lat, lng] = getOrderCoords(o.id, hubLocation[0], hubLocation[1]);
          return (
            <Marker key={o.id} position={[lat, lng]} icon={deliveryIcon}>
              <Popup>
                <strong>#{o.id.slice(0, 8).toUpperCase()}</strong><br />
                {o.address?.city || 'Customer'}<br />
                ₹{o.total_amount?.toLocaleString('en-IN')}
              </Popup>
            </Marker>
          );
        })}
        {availableOrders.map(o => {
          const [lat, lng] = getOrderCoords(o.id, hubLocation[0], hubLocation[1]);
          return (
            <Marker key={o.id} position={[lat, lng]} icon={availableIcon}>
              <Popup>
                <strong>Available: #{o.id.slice(0, 8).toUpperCase()}</strong><br />
                {o.address?.city || 'City'}<br />
                ₹{o.total_amount?.toLocaleString('en-IN')}
              </Popup>
            </Marker>
          );
        })}
        {optimizedRoute.length > 1 && (
          <Polyline
            positions={optimizedRoute}
            pathOptions={{ color: C.green, weight: 3, opacity: 0.85, dashArray: '8, 6' }}
          />
        )}
      </MapContainer>
      <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(10,10,10,0.92)', borderRadius: '10px', padding: '8px 12px', zIndex: 500, display: 'flex', gap: '12px', border: `1px solid ${C.border}` }}>
        <span style={{ fontSize: '11px', color: C.green, display: 'flex', alignItems: 'center', gap: '4px' }}>📍 You</span>
        <span style={{ fontSize: '11px', color: C.orange, display: 'flex', alignItems: 'center', gap: '4px' }}>📦 Active</span>
        <span style={{ fontSize: '11px', color: C.blue, display: 'flex', alignItems: 'center', gap: '4px' }}>🔵 Available</span>
      </div>
    </div>
  );
}

// ── PIN Bottom Sheet ──────────────────────────────────────────────
function PinSheet({ order, onClose, onDelivered }: { order: Order; onClose: () => void; onDelivered: () => void }) {
  const [pins, setPins] = useState(['', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pinState, setPinState] = useState<'idle' | 'error' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const verifyPin = async (code: string) => {
    if (isVerifying) return;
    setIsVerifying(true);
    setErrorMsg('');
    try {
      const { data: orderData } = await supabase.from('orders').select('delivery_pin, pin_attempts').eq('id', order.id).single();
      if (!orderData) { setErrorMsg('Order not found.'); return; }
      if ((orderData.pin_attempts || 0) >= 3) { setErrorMsg('Too many wrong attempts. Contact admin.'); setIsVerifying(false); return; }
      if (orderData.delivery_pin === code) {
        await supabase.from('orders').update({ status: 'delivered', pin_verified: true, delivered_at: new Date().toISOString() }).eq('id', order.id);
        setPinState('success');
        setTimeout(() => { onDelivered(); onClose(); }, 1500);
      } else {
        const attempts = (orderData.pin_attempts || 0) + 1;
        await supabase.from('orders').update({ pin_attempts: attempts }).eq('id', order.id);
        const remaining = 3 - attempts;
        setErrorMsg(remaining > 0 ? `Wrong PIN. ${remaining} attempt${remaining !== 1 ? 's' : ''} left.` : 'Too many attempts. Contact admin.');
        setPinState('error');
        setTimeout(() => { setPinState('idle'); }, 600);
      }
    } catch { setErrorMsg('Something went wrong. Try again.'); }
    finally { setIsVerifying(false); }
  };

  const handleChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...pins]; next[idx] = digit; setPins(next); setErrorMsg(''); setPinState('idle');
    if (digit && idx < 3) inputRefs.current[idx + 1]?.focus();
    if (next.every(d => d !== '') && next.join('').length === 4) verifyPin(next.join(''));
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pins[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
  };

  const boxStyle = (idx: number): React.CSSProperties => ({
    width: '60px', height: '68px',
    background: pinState === 'success' ? 'rgba(0,200,83,0.1)' : pinState === 'error' ? 'rgba(255,61,61,0.08)' : pins[idx] ? '#1C1C1C' : '#141414',
    border: `2px solid ${pinState === 'success' ? C.green : pinState === 'error' ? C.red : pins[idx] ? 'rgba(0,200,83,0.5)' : C.border}`,
    borderRadius: '14px', fontSize: '28px', fontWeight: 700,
    color: pinState === 'success' ? C.green : C.text, textAlign: 'center', outline: 'none',
    fontFamily: 'Inter, sans-serif', caretColor: C.green, transition: 'all 0.2s',
    animation: pinState === 'error' ? 'pinShake 0.3s ease' : 'none',
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{ width: '100%', maxWidth: '480px', margin: '0 auto', background: C.card, borderTop: `2px solid ${C.green}`, borderRadius: '20px 20px 0 0', padding: '28px 24px 48px', boxShadow: `0 -20px 60px rgba(0,200,83,0.15)` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: C.greenDim, border: `1px solid ${C.greenBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={22} style={{ color: C.green }} /></div>
            <div>
              <p style={{ fontSize: '18px', fontWeight: 700, color: C.text, fontFamily: 'Inter, sans-serif' }}>Enter Customer PIN</p>
              <p style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>Ask the customer for their 4-digit delivery PIN</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', margin: '8px 0 20px' }}>
          {pins.map((digit, idx) => (
            <input key={idx} ref={el => { inputRefs.current[idx] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit} autoFocus={idx === 0}
              onChange={e => handleChange(idx, e.target.value)} onKeyDown={e => handleKeyDown(idx, e)}
              onFocus={e => { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.greenDim}`; }}
              onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }} style={boxStyle(idx)} />
          ))}
        </div>
        {errorMsg && <div style={{ background: 'rgba(255,61,61,0.08)', border: '1px solid rgba(255,61,61,0.2)', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: C.red, textAlign: 'center', marginBottom: '16px' }}>{errorMsg}</div>}
        {pinState === 'success' && <div style={{ background: C.greenDim, border: `1px solid ${C.greenBrd}`, borderRadius: '10px', padding: '12px 16px', fontSize: '14px', color: C.green, textAlign: 'center', fontWeight: 700, marginBottom: '16px' }}>✓ Delivery Confirmed!</div>}
        <button onClick={() => { const code = pins.join(''); if (code.length === 4) verifyPin(code); }} disabled={isVerifying || pins.join('').length < 4}
          style={{ width: '100%', padding: '15px', background: pins.join('').length < 4 ? '#1C1C1C' : C.green, border: 'none', borderRadius: '12px', color: pins.join('').length < 4 ? C.muted : '#000', fontSize: '15px', fontWeight: 700, cursor: pins.join('').length < 4 ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {isVerifying ? (<><div style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTop: '2px solid #000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Verifying...</>) : 'Confirm Delivery'}
        </button>
      </motion.div>
      <style>{`@keyframes pinShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </motion.div>
  );
}

// ── Incoming Ping Modal ───────────────────────────────────────────
function IncomingPing({ order, timeLeft, onAccept, onReject }: { order: Order; timeLeft: number; onAccept: () => void; onReject: () => void }) {
  const addr = order.address || {};
  const itemCount = order.order_items?.length || 0;
  const earnings = Math.round((order.total_amount || 0) * 0.1);
  const [lat, lng] = getOrderCoords(order.id, DEFAULT_HUB_LAT, DEFAULT_HUB_LNG);
  const dist = distanceKm(DEFAULT_HUB_LAT, DEFAULT_HUB_LNG, lat, lng).toFixed(1);
  const progress = (timeLeft / 30) * 100;
  const circumference = 2 * Math.PI * 26;
  const strokeDash = (progress / 100) * circumference;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: '20px' }}>
      <motion.div initial={{ scale: 0.8, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{ width: '100%', maxWidth: '380px', background: C.card, border: `2px solid ${C.orange}`, borderRadius: '24px', padding: '28px 24px', boxShadow: `0 0 60px rgba(255,107,0,0.3)` }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}
              style={{ width: '48px', height: '48px', borderRadius: '14px', background: C.orangeDim, border: `1px solid ${C.orangeBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={24} color={C.orange} />
            </motion.div>
            <div>
              <p style={{ fontSize: '11px', letterSpacing: '0.15em', color: C.orange, fontWeight: 700, textTransform: 'uppercase' }}>New Order!</p>
              <p style={{ fontSize: '20px', fontWeight: 800, color: C.text, fontFamily: 'Inter, sans-serif' }}>{addr.city || 'New Delivery'}</p>
            </div>
          </div>

          {/* Circular countdown */}
          <div style={{ position: 'relative', width: '60px', height: '60px' }}>
            <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="30" cy="30" r="26" fill="none" stroke={C.border} strokeWidth="4" />
              <circle cx="30" cy="30" r="26" fill="none" stroke={timeLeft > 10 ? C.green : C.red} strokeWidth="4"
                strokeDasharray={`${strokeDash} ${circumference}`} strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1s linear, stroke 0.3s' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: timeLeft > 10 ? C.green : C.red, fontFamily: 'Inter, sans-serif' }}>{timeLeft}</span>
            </div>
          </div>
        </div>

        {/* Route row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#111', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', border: `1px solid ${C.border}` }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: C.green, flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: C.muted, flex: 1 }}>FASHIONVERSE Hub</span>
          <span style={{ fontSize: '12px', color: C.muted }}>→</span>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: C.orange, flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: C.muted }}>{addr.city || 'Customer'}, {addr.state || ''}</span>
        </div>

        {/* Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '24px' }}>
          {[
            { label: 'Distance', val: `${dist} km`, color: C.blue },
            { label: 'Earning', val: `₹${earnings}`, color: C.green },
            { label: 'Items', val: `${itemCount}`, color: C.orange },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background: '#111', borderRadius: '10px', padding: '12px 8px', textAlign: 'center', border: `1px solid ${C.border}` }}>
              <p style={{ fontSize: '18px', fontWeight: 800, color, lineHeight: 1 }}>{val}</p>
              <p style={{ fontSize: '10px', color: C.muted, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <button onClick={onAccept}
          style={{ width: '100%', padding: '16px', background: C.green, border: 'none', borderRadius: '14px', color: '#000', fontSize: '16px', fontWeight: 800, cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: `0 6px 24px rgba(0,200,83,0.4)`, marginBottom: '10px' }}>
          ACCEPT
        </button>
        <button onClick={onReject}
          style={{ width: '100%', padding: '10px', background: 'transparent', border: 'none', color: C.muted, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          REJECT
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Available Order Card ──────────────────────────────────────────
function AvailableOrderCard({ order, onPickup }: { order: Order; onPickup: (o: Order) => void }) {
  const addr = order.address || {};
  const itemCount = order.order_items?.length || 0;
  const timeSince = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
  const [lat, lng] = getOrderCoords(order.id, DEFAULT_HUB_LAT, DEFAULT_HUB_LNG);
  const dist = distanceKm(DEFAULT_HUB_LAT, DEFAULT_HUB_LNG, lat, lng).toFixed(1);
  const earnings = Math.round((order.total_amount || 0) * 0.1);

  return (
    <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '18px', marginBottom: '12px', position: 'relative', overflow: 'hidden' }}>
      {/* Orange top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${C.orange}, transparent)` }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div>
          <p style={{ fontSize: '10px', letterSpacing: '0.12em', color: C.orange, fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
            #{order.id.slice(0, 8).toUpperCase()}
          </p>
          <p style={{ fontSize: '16px', fontWeight: 700, color: C.text, fontFamily: 'Inter, sans-serif' }}>
            {addr.name || addr.city || 'Customer'}
          </p>
          <p style={{ fontSize: '12px', color: C.muted, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={11} /> {timeSince} min ago · {itemCount} item{itemCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '22px', fontWeight: 800, color: C.green, fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>₹{earnings}</p>
          <p style={{ fontSize: '10px', color: C.muted, marginTop: '2px' }}>est. earning</p>
        </div>
      </div>

      {/* Route */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: '#111', borderRadius: '10px', marginBottom: '14px', border: `1px solid ${C.border}` }}>
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: C.green, flexShrink: 0 }} />
        <span style={{ fontSize: '11px', color: C.muted, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>FASHIONVERSE Hub</span>
        <span style={{ fontSize: '11px', color: C.muted, flexShrink: 0 }}>→ {dist} km →</span>
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: C.orange, flexShrink: 0 }} />
        <span style={{ fontSize: '11px', color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{addr.city || 'Customer'}</span>
      </div>

      <button onClick={() => onPickup(order)}
        style={{ width: '100%', padding: '13px', background: C.green, border: 'none', borderRadius: '10px', color: '#000', fontSize: '14px', fontWeight: 800, cursor: 'pointer', fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em' }}>
        ACCEPT
      </button>
      <button
        style={{ width: '100%', padding: '8px', background: 'transparent', border: 'none', color: C.muted, fontSize: '12px', cursor: 'pointer', marginTop: '4px' }}
        onClick={() => toast('Order skipped', { icon: '⏭️' })}>
        REJECT
      </button>
    </div>
  );
}

// ── Active Order Card ─────────────────────────────────────────────
function ActiveOrderCard({ order, onConfirmDelivery, hubLocation }: { order: Order; onConfirmDelivery: (o: Order) => void; hubLocation: [number, number] }) {
  const addr = order.address || {};
  const [lat, lng] = getOrderCoords(order.id, hubLocation[0], hubLocation[1]);
  const dist = distanceKm(hubLocation[0], hubLocation[1], lat, lng).toFixed(1);

  return (
    <div style={{ background: C.card2, border: `1px solid rgba(0,200,83,0.25)`, borderRadius: '16px', padding: '18px', marginBottom: '12px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${C.green}, transparent)` }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div>
          <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '3px 10px', borderRadius: '20px', background: C.greenDim, color: C.green, border: `1px solid ${C.greenBrd}`, display: 'inline-block', marginBottom: '6px' }}>● Active</span>
          <p style={{ fontSize: '16px', fontWeight: 700, color: C.text, fontFamily: 'Inter, sans-serif' }}>{addr.name || 'Customer'}</p>
          <p style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>#{order.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '20px', fontWeight: 800, color: C.green, lineHeight: 1 }}>₹{Math.round((order.total_amount || 0) * 0.1)}</p>
          <p style={{ fontSize: '11px', color: C.muted, marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
            <MapPin size={10} /> {dist} km away
          </p>
        </div>
      </div>

      {addr.line1 && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '10px', padding: '10px', background: '#111', borderRadius: '10px', border: `1px solid ${C.border}` }}>
          <MapPin size={14} style={{ color: C.orange, flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '13px', color: C.muted, lineHeight: 1.5 }}>{[addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}</p>
        </div>
      )}

      {addr.phone && (
        <a href={`tel:${addr.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '10px', background: C.greenDim, border: `1px solid ${C.greenBrd}`, textDecoration: 'none', marginBottom: '14px' }}>
          <Phone size={14} style={{ color: C.green }} /><span style={{ fontSize: '13px', fontWeight: 600, color: C.green }}>Call: {addr.phone}</span>
        </a>
      )}

      <button onClick={() => onConfirmDelivery(order)}
        style={{ width: '100%', padding: '15px', background: 'transparent', border: `2px solid ${C.green}`, borderRadius: '12px', color: C.green, fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        🔐 Enter Delivery PIN
      </button>
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────
function ConfirmModal({ order, onConfirm, onCancel }: { order: Order; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '28px', maxWidth: '360px', width: '100%' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 700, color: C.text, fontFamily: 'Inter, sans-serif', marginBottom: '8px' }}>Confirm Pickup</h3>
        <p style={{ fontSize: '14px', color: C.muted, marginBottom: '24px', lineHeight: 1.6 }}>
          Claim Order <strong style={{ color: C.green }}>#{order.id.slice(0, 8).toUpperCase()}</strong>? It will be assigned to you.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '13px', borderRadius: '12px', background: 'none', border: `1px solid ${C.border}`, color: C.muted, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 2, padding: '13px', borderRadius: '12px', background: C.green, border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Confirm Pickup</button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Offline Screen ────────────────────────────────────────────────
function OfflineScreen({ onGoOnline }: { onGoOnline: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ position: 'fixed', inset: 0, background: C.bg, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
      <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 3 }}
        style={{ width: '110px', height: '110px', borderRadius: '50%', background: '#141414', border: `2px dashed ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px' }}>
        <WifiOff size={44} style={{ color: C.muted }} />
      </motion.div>
      <h3 style={{ fontSize: '28px', fontWeight: 800, color: C.text, fontFamily: 'Inter, sans-serif', marginBottom: '10px' }}>You are Offline</h3>
      <p style={{ fontSize: '15px', color: C.muted, lineHeight: 1.7, marginBottom: '40px', maxWidth: '280px' }}>Go online to start receiving new orders and earning today.</p>
      <button onClick={onGoOnline}
        style={{ padding: '18px 48px', background: C.green, border: 'none', borderRadius: '50px', color: '#000', fontSize: '17px', fontWeight: 800, cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: `0 8px 32px rgba(0,200,83,0.4)`, letterSpacing: '0.04em' }}>
        GO ONLINE
      </button>
    </motion.div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────
export default function DeliveryDashboard() {
  const navigate = useNavigate();
  const { user, profile, signOut, isDeliveryApproved } = useAuthStore();
  const [activeTab, setActiveTab] = useState<DriverTab>('available');
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pickupModal, setPickupModal] = useState<Order | null>(null);
  const [pinSheet, setPinSheet] = useState<Order | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [incomingPing, setIncomingPing] = useState<Order | null>(null);
  const [pingTimeLeft, setPingTimeLeft] = useState(30);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevAvailableIds = useRef<Set<string>>(new Set());
  const [optimizedRoute, setOptimizedRoute] = useState<[number, number][]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [hubLocation, setHubLocation] = useState<[number, number]>([DEFAULT_HUB_LAT, DEFAULT_HUB_LNG]);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/delivery/apply', { replace: true }); return; }
    if (profile && !isDeliveryApproved) { navigate('/delivery/apply', { replace: true }); }
  }, [user, profile, isDeliveryApproved, navigate]);

  // Override global body background so the store's golden gradient doesn't bleed through
  useEffect(() => {
    const prevBg = document.body.style.background;
    const prevBgImg = document.body.style.backgroundImage;
    const prevBgColor = document.body.style.backgroundColor;
    document.body.style.background = '#0A0A0A';
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '#0A0A0A';
    return () => {
      document.body.style.background = prevBg;
      document.body.style.backgroundImage = prevBgImg;
      document.body.style.backgroundColor = prevBgColor;
    };
  }, []);

  const locateUser = () => {
    if (!('geolocation' in navigator)) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setHubLocation([pos.coords.latitude, pos.coords.longitude]);
        setIsLocating(false);
        toast.success('Location updated', { icon: '📍' });
      },
      (err) => {
        setIsLocating(false);
        console.error(err);
        toast.error('Could not get location. Using default.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => { locateUser(); }, []);

  const fetchOrders = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data: avail, error: availError } = await supabase.from('orders').select('*, order_items(*)').eq('status', 'packed').is('driver_id', null).order('created_at', { ascending: true });
      let availList: Order[] = [];
      if (availError) {
        const { data: fallback } = await supabase.from('orders').select('*, order_items(*)').eq('status', 'packed').order('created_at', { ascending: true });
        availList = fallback || [];
      } else { availList = avail || []; }
      setAvailableOrders(availList);
      if (isOnline && !incomingPing) {
        const newOrder = availList.find(o => !prevAvailableIds.current.has(o.id));
        if (newOrder) triggerPing(newOrder);
      }
      prevAvailableIds.current = new Set(availList.map(o => o.id));
      const { data: mine } = await supabase.from('orders').select('*, order_items(*)').eq('driver_id', user.id).eq('status', 'out_for_delivery').order('claimed_at', { ascending: false });
      const { data: done } = await supabase.from('orders').select('*, order_items(*)').eq('driver_id', user.id).eq('status', 'delivered').order('delivered_at', { ascending: false }).limit(20);
      setMyOrders(mine || []);
      setCompletedOrders(done || []);
    } catch { }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [user]);

  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [isOnline, user]);

  const triggerPing = (order: Order) => {
    setIncomingPing(order);
    setPingTimeLeft(30);
    pingTimerRef.current = setInterval(() => {
      setPingTimeLeft(prev => {
        if (prev <= 1) { clearPing(); toast('Ping expired', { icon: '⏰' }); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const clearPing = () => {
    if (pingTimerRef.current) clearInterval(pingTimerRef.current);
    setIncomingPing(null);
    setPingTimeLeft(30);
  };

  const handlePingAccept = () => { if (!incomingPing) return; const o = incomingPing; clearPing(); setPickupModal(o); };
  const handlePingReject = () => { clearPing(); toast('Order rejected', { icon: '🚫' }); };

  const handlePickupConfirm = async () => {
    if (!pickupModal || !user) return;
    try {
      const { error } = await supabase.from('orders').update({ driver_id: user.id, status: 'out_for_delivery', claimed_at: new Date().toISOString() }).eq('id', pickupModal.id).eq('status', 'packed');
      if (error) {
        const { error: e2 } = await supabase.from('orders').update({ status: 'out_for_delivery' }).eq('id', pickupModal.id);
        if (e2) throw e2;
      }
      toast.success('Order claimed!');
      setPickupModal(null); fetchOrders(); setActiveTab('my-orders');
    } catch (err: any) { toast.error(`Error: ${err.message || 'Failed to claim order'}`); }
  };

  const handleDelivered = () => { toast.success('Delivery confirmed!'); fetchOrders(); setActiveTab('completed'); };

  const handleOptimizeRoute = () => {
    if (myOrders.length === 0) { toast('No active orders to optimize!', { icon: '📦' }); return; }
    setIsOptimizing(true);
    setTimeout(() => {
      const sorted = [...myOrders].sort((a, b) => {
        const [aLat, aLng] = getOrderCoords(a.id, hubLocation[0], hubLocation[1]);
        const [bLat, bLng] = getOrderCoords(b.id, hubLocation[0], hubLocation[1]);
        return distanceKm(hubLocation[0], hubLocation[1], aLat, aLng) - distanceKm(hubLocation[0], hubLocation[1], bLat, bLng);
      });
      const route: [number, number][] = [hubLocation, ...sorted.map(o => getOrderCoords(o.id, hubLocation[0], hubLocation[1]))];
      setOptimizedRoute(route);
      setMyOrders(sorted);
      setIsOptimizing(false);
      toast.success(`Route optimized! ${sorted.length} stops sorted by distance.`, { icon: '🗺️' });
    }, 2000);
  };

  const weeklyData = (() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    return days.map((day, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1) + i);
      const ds = d.toDateString();
      const amt = completedOrders.filter(o => o.delivered_at && new Date(o.delivered_at).toDateString() === ds).reduce((s, o) => s + (o.total_amount || 0), 0);
      const count = completedOrders.filter(o => o.delivered_at && new Date(o.delivered_at).toDateString() === ds).length;
      return { day, amt, count };
    });
  })();

  const today = new Date().toDateString();
  const todayEarnings = completedOrders.filter(o => o.delivered_at && new Date(o.delivered_at).toDateString() === today).reduce((s, o) => s + (o.total_amount || 0) * 0.1, 0);
  const todayDeliveries = completedOrders.filter(o => o.delivered_at && new Date(o.delivered_at).toDateString() === today).length;
  const totalDeliveries = completedOrders.length;
  const totalEarnings = completedOrders.reduce((s, o) => s + (o.total_amount || 0) * 0.1, 0);
  const driverTier = totalDeliveries >= 50 ? 'Gold' : totalDeliveries >= 20 ? 'Silver' : 'Bronze';
  const tierColors: Record<string, string> = { Gold: '#FFD700', Silver: '#b0b0b0', Bronze: '#cd7f32' };

  const TABS: { id: DriverTab; label: string; icon: React.ReactNode }[] = [
    { id: 'available', label: 'ORDERS', icon: <Package size={24} /> },
    { id: 'my-orders', label: 'ACTIVE', icon: <Truck size={24} /> },
    { id: 'map', label: 'MAP', icon: <MapIcon size={24} /> },
    { id: 'completed', label: 'DONE', icon: <CheckCircle size={24} /> },
    { id: 'profile', label: 'PROFILE', icon: <UserIcon size={24} /> },
  ];

  return (
    <div
      className="delivery-dashboard-page"
      data-lenis-prevent="true"
      style={{
        position: 'fixed', inset: 0,
        width: '100vw', height: '100vh',
        background: '#0A0A0A',
        zIndex: 9999,
        overflowY: 'auto',
        overflowX: 'hidden',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#0A0A0A', position: 'relative' }}>

      {/* ── HEADER ── */}
      <header style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: '#111111', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg, ${C.green}, #009624)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: '#000' }}>
          {profile?.name?.charAt(0)?.toUpperCase() || 'D'}
        </div>
        <span style={{ fontSize: '16px', fontWeight: 800, color: C.text, letterSpacing: '0.02em' }}>Delivery Hub</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Bell size={22} style={{ color: C.muted, cursor: 'pointer' }} />
            {availableOrders.length > 0 && (
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: C.orange }} />
            )}
          </div>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: C.card2, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: '13px', fontWeight: 800 }}>
            {profile?.name?.charAt(0)?.toUpperCase() || 'D'}
          </div>
        </div>
      </header>

      {/* ── ONLINE/OFFLINE TOGGLE ── */}
      <div style={{ padding: '12px 16px', background: '#0D0D0D', borderBottom: `1px solid ${C.border}` }}>
        <div
          onClick={() => setIsOnline(p => !p)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.3s',
            background: isOnline ? 'rgba(0,200,83,0.08)' : 'rgba(255,61,61,0.06)',
            border: `1.5px solid ${isOnline ? C.greenBrd : 'rgba(255,61,61,0.25)'}`,
            boxShadow: isOnline ? `0 0 20px rgba(0,200,83,0.1)` : 'none',
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <motion.div
              animate={{ scale: isOnline ? [1, 1.4, 1] : 1, opacity: isOnline ? [0.7, 1, 0.7] : 0.5 }}
              transition={{ repeat: isOnline ? Infinity : 0, duration: 2 }}
              style={{ width: '12px', height: '12px', borderRadius: '50%', background: isOnline ? C.green : C.red, boxShadow: isOnline ? `0 0 10px ${C.green}` : 'none' }} />
            <div>
              <p style={{ fontSize: '15px', fontWeight: 700, color: isOnline ? C.green : C.red, lineHeight: 1 }}>
                {isOnline ? '● You are Online' : '● You are Offline'}
              </p>
              <p style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>
                {isOnline ? 'Tap to go offline' : 'Tap to go online'}
              </p>
            </div>
          </div>
          <div style={{ width: '52px', height: '28px', borderRadius: '14px', background: isOnline ? C.green : '#333', position: 'relative', transition: 'all 0.3s', flexShrink: 0 }}>
            <motion.div animate={{ x: isOnline ? 26 : 2 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{ position: 'absolute', top: '4px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
          </div>
        </div>
      </div>

      {/* ── STATS BANNER (3 cards) ── */}
      {isOnline && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', padding: '12px 16px 0' }}>
          {[
            { label: "Today's earnings", val: `₹${Math.round(todayEarnings)}`, color: C.green, border: C.green },
            { label: 'Deliveries done', val: String(todayDeliveries), color: C.orange, border: C.orange },
            { label: 'In progress', val: String(myOrders.length), color: C.blue, border: C.blue },
          ].map(({ label, val, color, border }) => (
            <div key={label} style={{ background: C.card2, borderRadius: '14px', padding: '14px 10px', textAlign: 'center', borderTop: `3px solid ${border}`, boxShadow: `0 4px 16px rgba(0,0,0,0.4)` }}>
              <p style={{ fontSize: '22px', fontWeight: 800, color, lineHeight: 1, fontFamily: 'Inter, sans-serif' }}>{val}</p>
              <p style={{ fontSize: '9px', color: C.muted, marginTop: '5px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div style={{ padding: '16px 16px 90px' }}>
        {!isOnline ? (
          <OfflineScreen onGoOnline={() => setIsOnline(true)} />
        ) : isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            {[...Array(3)].map((_, i) => <div key={i} style={{ height: '150px', borderRadius: '16px', background: C.card2, border: `1px solid ${C.border}`, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
          </div>
        ) : (
          <AnimatePresence mode="wait">

            {/* Available Orders */}
            {activeTab === 'available' && (
              <motion.div key="available" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', marginTop: '4px' }}>
                  <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{ width: '8px', height: '8px', borderRadius: '50%', background: C.green, boxShadow: `0 0 8px ${C.green}` }} />
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.text }}>Available Orders</h2>
                  {availableOrders.length > 0 && (
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: C.orangeDim, color: C.orange, border: `1px solid ${C.orangeBrd}` }}>{availableOrders.length} NEW</span>
                  )}
                </div>
                {availableOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', borderRadius: '16px', border: `1px dashed ${C.border}` }}>
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }}>
                      <Package size={44} style={{ color: C.muted, margin: '0 auto 12px' }} />
                    </motion.div>
                    <p style={{ color: C.muted, fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>No orders right now</p>
                    <p style={{ color: '#555', fontSize: '13px', marginBottom: '20px' }}>New orders will appear here automatically</p>
                    <button onClick={fetchOrders} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: '8px', color: C.muted, padding: '8px 20px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>Refresh</button>
                  </div>
                ) : availableOrders.map(o => <AvailableOrderCard key={o.id} order={o} onPickup={setPickupModal} />)}
              </motion.div>
            )}

            {/* My Active Orders */}
            {activeTab === 'my-orders' && (
              <motion.div key="my" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', marginTop: '4px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.text }}>Active Deliveries</h2>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={handleOptimizeRoute}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: C.greenDim, border: `1px solid ${C.greenBrd}`, borderRadius: '10px', color: C.green, fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                    <Navigation size={14} /> Optimize
                  </motion.button>
                </div>
                {myOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', borderRadius: '16px', border: `1px dashed ${C.border}` }}>
                    <Truck size={44} style={{ color: C.muted, margin: '0 auto 12px' }} />
                    <p style={{ color: C.muted, fontSize: '14px' }}>No active deliveries. Pick up an order!</p>
                    <button onClick={() => setActiveTab('available')} style={{ marginTop: '16px', background: 'none', border: `1px solid ${C.border}`, borderRadius: '8px', color: C.muted, padding: '8px 20px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>
                      View Available <ChevronRight size={13} style={{ display: 'inline' }} />
                    </button>
                  </div>
                ) : myOrders.map(o => <ActiveOrderCard key={o.id} order={o} onConfirmDelivery={setPinSheet} hubLocation={hubLocation} />)}
              </motion.div>
            )}

            {/* Map Tab */}
            {activeTab === 'map' && (
              <motion.div key="map" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', marginTop: '4px' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.text }}>Live Map</h2>
                    <p style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>{myOrders.length} active · {availableOrders.length} available</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={locateUser} disabled={isLocating}
                      style={{ width: '38px', height: '38px', background: C.card2, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <LocateFixed size={18} />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={handleOptimizeRoute} disabled={isOptimizing}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: C.green, border: 'none', borderRadius: '10px', color: '#000', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                      <Navigation size={14} /> Optimize
                    </motion.button>
                  </div>
                </div>
                <DeliveryMap myOrders={myOrders} availableOrders={availableOrders} optimizedRoute={optimizedRoute} isOptimizing={isOptimizing} hubLocation={hubLocation} />
                {optimizedRoute.length > 1 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ marginTop: '14px', background: C.card2, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '14px' }}>
                    <p style={{ fontSize: '12px', color: C.green, fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Navigation size={14} /> Optimized Stop Order
                    </p>
                    {myOrders.map((o, idx) => {
                      const [lat, lng] = getOrderCoords(o.id, hubLocation[0], hubLocation[1]);
                      const dist = distanceKm(hubLocation[0], hubLocation[1], lat, lng).toFixed(1);
                      return (
                        <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: '#000', flexShrink: 0 }}>{idx + 1}</div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '12px', color: C.text, fontWeight: 600 }}>#{o.id.slice(0, 8).toUpperCase()}</p>
                            <p style={{ fontSize: '11px', color: C.muted }}>{o.address?.city || 'City'} · {dist} km</p>
                          </div>
                          <span style={{ fontSize: '12px', color: C.green, fontWeight: 700 }}>₹{Math.round((o.total_amount || 0) * 0.1)}</span>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Completed */}
            {activeTab === 'completed' && (
              <motion.div key="completed" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.text, marginBottom: '16px', marginTop: '4px' }}>Completed</h2>
                {completedOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', borderRadius: '16px', border: `1px dashed ${C.border}` }}>
                    <CheckCircle size={44} style={{ color: C.muted, margin: '0 auto 12px' }} />
                    <p style={{ color: C.muted, fontSize: '14px' }}>Your completed deliveries appear here</p>
                  </div>
                ) : completedOrders.map(o => (
                  <div key={o.id} style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>#{o.id.slice(0, 8).toUpperCase()}</p>
                      <p style={{ fontSize: '13px', color: C.muted }}>{o.delivered_at ? new Date(o.delivered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '16px', fontWeight: 700, color: C.green }}>₹{Math.round((o.total_amount || 0) * 0.1)}</p>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: C.green, background: C.greenDim, border: `1px solid ${C.greenBrd}`, borderRadius: '20px', padding: '2px 8px' }}>✓ Delivered</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Profile */}
            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.text, marginBottom: '16px', marginTop: '4px' }}>Driver Cockpit</h2>

                {/* Avatar card */}
                <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '24px', marginBottom: '14px', textAlign: 'center' }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: `linear-gradient(135deg, ${C.green}, #009624)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: '28px', fontWeight: 800, color: '#000' }}>
                    {profile?.name?.charAt(0)?.toUpperCase() || 'D'}
                  </div>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: C.text, marginBottom: '4px' }}>{profile?.name || 'Driver'}</p>
                  <p style={{ fontSize: '12px', color: C.muted, marginBottom: '12px' }}>{user?.email}</p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 12px', borderRadius: '20px', background: C.greenDim, color: C.green, border: `1px solid ${C.greenBrd}` }}>✓ Approved Partner</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', color: tierColors[driverTier], border: `1px solid ${tierColors[driverTier]}44`, background: `${tierColors[driverTier]}15` }}>
                      <Star size={10} fill={tierColors[driverTier]} style={{ color: tierColors[driverTier] }} /> {driverTier} Partner
                    </span>
                  </div>
                </div>

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  {[
                    { icon: <Package size={18} style={{ color: C.orange }} />, val: totalDeliveries, label: 'Total Deliveries', color: C.orange },
                    { icon: <IndianRupee size={18} style={{ color: C.green }} />, val: `₹${Math.round(totalEarnings).toLocaleString('en-IN')}`, label: 'Total Earned', color: C.green },
                    { icon: <TrendingUp size={18} style={{ color: C.green }} />, val: todayDeliveries, label: "Today's Drops", color: C.green },
                    { icon: <Star size={18} style={{ color: '#FFD700' }} fill="#FFD700" />, val: '4.9', label: 'Rating', color: '#FFD700' },
                  ].map(({ icon, val, label, color }) => (
                    <div key={label} style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '18px', textAlign: 'center' }}>
                      <div style={{ marginBottom: '8px' }}>{icon}</div>
                      <p style={{ fontSize: '24px', fontWeight: 800, color, lineHeight: 1 }}>{val}</p>
                      <p style={{ fontSize: '10px', color: C.muted, marginTop: '4px' }}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Weekly chart */}
                <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '18px', marginBottom: '14px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: C.text, marginBottom: '4px' }}>Weekly Earnings</p>
                  <p style={{ fontSize: '12px', color: C.muted, marginBottom: '16px' }}>Delivery earnings this week</p>
                  <ResponsiveContainer width="100%" height={130}>
                    <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="day" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '12px' }}
                        formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Earnings']}
                        cursor={{ fill: 'rgba(0,200,83,0.06)' }} />
                      <Bar dataKey="amt" radius={[6, 6, 0, 0]}>
                        {weeklyData.map((entry, index) => (
                          <Cell key={index} fill={entry.day === ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] ? C.green : '#2A2A2A'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Sign out */}
                <button onClick={async () => { await signOut(); navigate('/delivery/apply'); }}
                  style={{ width: '100%', padding: '14px', border: '1px solid rgba(255,61,61,0.3)', borderRadius: '12px', background: 'rgba(255,61,61,0.06)', color: C.red, fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'Inter, sans-serif' }}>
                  <LogOut size={16} /> Sign Out
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </div>

      {/* ── BOTTOM TAB BAR ── */}
      <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', height: '70px', background: '#111111', borderTop: `1px solid ${C.border}`, display: 'flex', zIndex: 100 }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          const badge = tab.id === 'available' ? availableOrders.length : tab.id === 'my-orders' ? myOrders.length : 0;
          const activeColor = tab.id === 'available' ? C.orange : tab.id === 'my-orders' ? C.green : tab.id === 'map' ? C.blue : tab.id === 'completed' ? C.green : C.muted;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ flex: 1, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: active ? activeColor : '#444', position: 'relative', transition: 'all 0.2s' }}>
              {/* Active underline */}
              {active && <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px', background: activeColor, borderRadius: '0 0 2px 2px' }} />}
              {/* Badge */}
              {badge > 0 && (
                <span style={{ position: 'absolute', top: '8px', right: '14%', background: C.orange, color: '#000', borderRadius: '10px', padding: '1px 5px', fontSize: '9px', fontWeight: 800, minWidth: '15px', textAlign: 'center' }}>{badge}</span>
              )}
              {tab.icon}
              <span style={{ fontSize: '9px', fontWeight: active ? 700 : 500, letterSpacing: '0.04em' }}>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── MODALS ── */}
      <AnimatePresence>
        {incomingPing && <IncomingPing order={incomingPing} timeLeft={pingTimeLeft} onAccept={handlePingAccept} onReject={handlePingReject} />}
        {pickupModal && <ConfirmModal order={pickupModal} onConfirm={handlePickupConfirm} onCancel={() => setPickupModal(null)} />}
        {pinSheet && <PinSheet order={pinSheet} onClose={() => setPinSheet(null)} onDelivered={handleDelivered} />}
      </AnimatePresence>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}.leaflet-container{background:#0A0A0A!important;font-family:'Inter',sans-serif}.delivery-dashboard-page canvas{display:none!important}`}</style>
    </div>
    </div>
  );
}
