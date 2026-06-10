import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Package, Truck, CheckCircle, User as UserIcon,
  Bell, MapPin, Phone, ShieldCheck, ChevronRight,
  LogOut, Clock, IndianRupee, X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import BrandLogo from '../components/layout/BrandLogo';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────
type DriverTab = 'available' | 'my-orders' | 'completed' | 'profile';

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

// ─── PIN Bottom Sheet ──────────────────────────────────────────
function PinSheet({
  order,
  onClose,
  onDelivered,
}: {
  order: Order;
  onClose: () => void;
  onDelivered: () => void;
}) {
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
      const { data: orderData } = await supabase
        .from('orders')
        .select('delivery_pin, pin_attempts')
        .eq('id', order.id)
        .single();

      if (!orderData) { setErrorMsg('Order not found.'); return; }

      if ((orderData.pin_attempts || 0) >= 3) {
        setErrorMsg('Too many wrong attempts. Contact admin.');
        setIsVerifying(false);
        return;
      }

      if (orderData.delivery_pin === code) {
        // Correct PIN
        await supabase.from('orders').update({
          status: 'delivered',
          pin_verified: true,
          delivered_at: new Date().toISOString(),
        }).eq('id', order.id);

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
    } catch {
      setErrorMsg('Something went wrong. Try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...pins];
    next[idx] = digit;
    setPins(next);
    setErrorMsg('');
    setPinState('idle');
    if (digit && idx < 3) inputRefs.current[idx + 1]?.focus();
    if (next.every(d => d !== '') && next.join('').length === 4) {
      verifyPin(next.join(''));
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pins[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const boxStyle = (idx: number): React.CSSProperties => ({
    width: '60px', height: '68px',
    background: pinState === 'success' ? 'rgba(201,151,58,0.15)' : pinState === 'error' ? 'rgba(220,60,60,0.08)' : pins[idx] ? 'rgba(40,25,10,0.9)' : 'rgba(26,15,8,0.8)',
    border: `2px solid ${pinState === 'success' ? '#C9973A' : pinState === 'error' ? 'rgba(220,60,60,0.6)' : pins[idx] ? 'rgba(201,151,58,0.5)' : 'rgba(201,151,58,0.2)'}`,
    borderRadius: '14px',
    fontSize: '28px', fontWeight: 700,
    color: pinState === 'success' ? '#E8B84B' : '#F5EDD4',
    textAlign: 'center', outline: 'none',
    fontFamily: "'Syne', sans-serif",
    caretColor: '#E8B84B',
    transition: 'all 0.2s',
    animation: pinState === 'error' ? 'pinShake 0.3s ease' : 'none',
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{
          width: '100%', maxWidth: '480px', margin: '0 auto',
          background: 'rgba(18,10,6,0.99)',
          borderTop: '1px solid rgba(201,151,58,0.25)',
          borderRadius: '20px 20px 0 0',
          padding: '28px 24px 48px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(201,151,58,0.1)', border: '1px solid rgba(201,151,58,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={22} style={{ color: '#C9973A' }} />
            </div>
            <div>
              <p style={{ fontSize: '18px', fontWeight: 700, color: '#F5EDD4', fontFamily: "'Playfair Display', serif" }}>Enter Customer PIN</p>
              <p style={{ fontSize: '12px', color: 'rgba(245,237,212,0.45)', marginTop: '2px' }}>Ask the customer for their 4-digit delivery PIN</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(245,237,212,0.4)', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* 4 PIN boxes */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', margin: '8px 0 20px' }}>
          {pins.map((digit, idx) => (
            <input
              key={idx}
              ref={el => { inputRefs.current[idx] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              autoFocus={idx === 0}
              onChange={e => handleChange(idx, e.target.value)}
              onKeyDown={e => handleKeyDown(idx, e)}
              onFocus={e => { e.currentTarget.style.borderColor = '#C9973A'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,151,58,0.15)'; }}
              onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
              style={boxStyle(idx)}
            />
          ))}
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(220,60,60,0.08)', border: '1px solid rgba(220,60,60,0.2)', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#ff8a7a', textAlign: 'center', marginBottom: '16px' }}>
            {errorMsg}
          </div>
        )}

        {pinState === 'success' && (
          <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '10px', padding: '12px 16px', fontSize: '14px', color: '#4ade80', textAlign: 'center', fontWeight: 700, marginBottom: '16px' }}>
            ✓ Delivery Confirmed!
          </div>
        )}

        <button
          onClick={() => { const code = pins.join(''); if (code.length === 4) verifyPin(code); }}
          disabled={isVerifying || pins.join('').length < 4}
          style={{
            width: '100%', padding: '15px',
            background: pins.join('').length < 4 ? 'rgba(201,151,58,0.3)' : 'linear-gradient(135deg, #C9973A, #E8B84B)',
            border: 'none', borderRadius: '12px',
            color: '#120a06', fontSize: '15px', fontWeight: 700,
            cursor: pins.join('').length < 4 ? 'not-allowed' : 'pointer',
            fontFamily: "'Syne', sans-serif",
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          {isVerifying ? (
            <><div style={{ width: 16, height: 16, border: '2px solid rgba(18,10,6,0.3)', borderTop: '2px solid #120a06', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Verifying...</>
          ) : 'Confirm Delivery →'}
        </button>
      </motion.div>
      <style>{`
        @keyframes pinShake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </motion.div>
  );
}

// ─── Order Card (Available) ────────────────────────────────────
function AvailableOrderCard({ order, onPickup }: { order: Order; onPickup: (o: Order) => void }) {
  const addr = order.address || {};
  const itemCount = order.order_items?.length || 0;
  const timeSince = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);

  return (
    <div style={{ background: 'rgba(22,14,6,0.95)', border: '1px solid rgba(201,151,58,0.15)', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <p style={{ fontSize: '11px', letterSpacing: '0.1em', color: '#C9973A', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
            #{order.id.slice(0, 8).toUpperCase()}
          </p>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#F5EDD4' }}>{addr.city || 'Unknown City'}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '18px', fontWeight: 800, color: '#E8B84B' }}>₹{order.total_amount?.toLocaleString('en-IN')}</p>
          <p style={{ fontSize: '11px', color: 'rgba(245,237,212,0.4)', marginTop: '2px' }}>{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={13} style={{ color: 'rgba(245,237,212,0.4)' }} />
          <span style={{ fontSize: '12px', color: 'rgba(245,237,212,0.4)' }}>Ready since {timeSince} min ago</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={13} style={{ color: 'rgba(245,237,212,0.4)' }} />
          <span style={{ fontSize: '12px', color: 'rgba(245,237,212,0.4)' }}>{addr.state || '—'}</span>
        </div>
      </div>
      <button
        onClick={() => onPickup(order)}
        style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #C9973A, #E8B84B)', border: 'none', borderRadius: '10px', color: '#120a06', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne', sans-serif" }}
      >
        Pickup Order
      </button>
    </div>
  );
}

// ─── Order Card (Active) ───────────────────────────────────────
function ActiveOrderCard({ order, onConfirmDelivery }: { order: Order; onConfirmDelivery: (o: Order) => void }) {
  const addr = order.address || {};

  return (
    <div style={{ background: 'rgba(22,14,6,0.95)', border: '1px solid rgba(201,151,58,0.25)', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <p style={{ fontSize: '11px', letterSpacing: '0.1em', color: '#C9973A', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
            #{order.id.slice(0, 8).toUpperCase()}
          </p>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#F5EDD4' }}>{addr.name || 'Customer'}</p>
        </div>
        <p style={{ fontSize: '18px', fontWeight: 800, color: '#E8B84B' }}>₹{order.total_amount?.toLocaleString('en-IN')}</p>
      </div>

      {addr.line1 && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px', padding: '10px', background: 'rgba(201,151,58,0.05)', borderRadius: '10px', border: '1px solid rgba(201,151,58,0.1)' }}>
          <MapPin size={14} style={{ color: '#C9973A', flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '13px', color: 'rgba(245,237,212,0.7)', lineHeight: 1.5 }}>
            {[addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
          </p>
        </div>
      )}

      {addr.phone && (
        <a href={`tel:${addr.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '10px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', textDecoration: 'none', marginBottom: '14px' }}>
          <Phone size={14} style={{ color: '#4ade80' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#4ade80' }}>Call Customer: {addr.phone}</span>
        </a>
      )}

      <button
        onClick={() => onConfirmDelivery(order)}
        style={{ width: '100%', padding: '16px', background: 'rgba(201,151,58,0.08)', border: '2px solid #C9973A', borderRadius: '12px', color: '#E8B84B', fontSize: '16px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne', sans-serif" }}
      >
        🔐 Confirm Delivery (Enter PIN)
      </button>
    </div>
  );
}

// ─── Confirmation Modal ────────────────────────────────────────
function ConfirmModal({ order, onConfirm, onCancel }: { order: Order; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ background: '#1a0f08', border: '1px solid rgba(201,151,58,0.25)', borderRadius: '20px', padding: '28px', maxWidth: '360px', width: '100%' }}
      >
        <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#F5EDD4', fontFamily: "'Playfair Display', serif", marginBottom: '8px' }}>Confirm Pickup</h3>
        <p style={{ fontSize: '14px', color: 'rgba(245,237,212,0.55)', marginBottom: '24px', lineHeight: 1.6 }}>
          Are you sure you want to claim Order <strong style={{ color: '#E8B84B' }}>#{order.id.slice(0, 8).toUpperCase()}</strong>? This order will be assigned to you.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '13px', borderRadius: '12px', background: 'none', border: '1px solid rgba(201,151,58,0.25)', color: 'rgba(245,237,212,0.6)', cursor: 'pointer', fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 2, padding: '13px', borderRadius: '12px', background: 'linear-gradient(135deg, #C9973A, #E8B84B)', border: 'none', color: '#120a06', fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne', sans-serif" }}>Confirm Pickup</button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────
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

  // Route protection
  useEffect(() => {
    if (!user) { navigate('/delivery/apply', { replace: true }); return; }
    if (profile && !isDeliveryApproved) { navigate('/delivery/apply', { replace: true }); }
  }, [user, profile, isDeliveryApproved, navigate]);

  const fetchOrders = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Available: ready_to_ship and no driver claimed
      const { data: avail } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('status', 'ready_to_ship')
        .is('driver_id', null)
        .order('created_at', { ascending: true });

      // My active orders
      const { data: mine } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('driver_id', user.id)
        .eq('status', 'out_for_delivery')
        .order('claimed_at', { ascending: false });

      // Completed
      const { data: done } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('driver_id', user.id)
        .eq('status', 'delivered')
        .order('delivered_at', { ascending: false })
        .limit(20);

      setAvailableOrders(avail || []);
      setMyOrders(mine || []);
      setCompletedOrders(done || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [user]);

  const handlePickupConfirm = async () => {
    if (!pickupModal || !user) return;
    try {
      const { error } = await supabase.from('orders').update({
        driver_id: user.id,
        status: 'out_for_delivery',
        claimed_at: new Date().toISOString(),
      }).eq('id', pickupModal.id).is('driver_id', null);

      if (error) throw error;
      toast.success('Order claimed! Head to the customer.');
      setPickupModal(null);
      fetchOrders();
      setActiveTab('my-orders');
    } catch {
      toast.error('Failed to claim order. Try again.');
    }
  };

  const handleDelivered = () => {
    toast.success('Delivery confirmed successfully!');
    fetchOrders();
    setActiveTab('completed');
  };

  const TABS: { id: DriverTab; label: string; icon: React.ReactNode }[] = [
    { id: 'available', label: 'Available', icon: <Package size={20} /> },
    { id: 'my-orders', label: 'My Orders', icon: <Truck size={20} /> },
    { id: 'completed', label: 'Completed', icon: <CheckCircle size={20} /> },
    { id: 'profile', label: 'Profile', icon: <UserIcon size={20} /> },
  ];

  const totalDeliveries = completedOrders.length;
  const totalEarnings = completedOrders.reduce((s, o) => s + (o.total_amount || 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: '#120a06', maxWidth: '480px', margin: '0 auto', position: 'relative', fontFamily: "'Syne', sans-serif" }}>

      {/* Custom Navbar */}
      <nav style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: 'rgba(12,8,3,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(201,151,58,0.15)', position: 'sticky', top: 0, zIndex: 100 }}>
        <BrandLogo size="sm" showWordmark={false} />
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#E8B84B', letterSpacing: '0.06em' }}>Delivery Hub</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Bell size={20} style={{ color: 'rgba(245,237,212,0.5)', cursor: 'pointer' }} />
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(201,151,58,0.2)', border: '1px solid rgba(201,151,58,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E8B84B', fontSize: '13px', fontWeight: 800 }}>
            {profile?.name?.charAt(0)?.toUpperCase() || 'D'}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div style={{ padding: '16px 16px 96px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ height: '160px', borderRadius: '16px', background: 'rgba(201,151,58,0.05)', border: '1px solid rgba(201,151,58,0.1)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">

            {/* ── Available Orders ────────────────────── */}
            {activeTab === 'available' && (
              <motion.div key="available" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#F5EDD4', fontFamily: "'Playfair Display', serif" }}>Available Orders</h2>
                  <p style={{ fontSize: '13px', color: 'rgba(245,237,212,0.45)', marginTop: '2px' }}>
                    {availableOrders.length} order{availableOrders.length !== 1 ? 's' : ''} ready to ship
                  </p>
                </div>
                {availableOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', borderRadius: '16px', border: '1px dashed rgba(201,151,58,0.2)' }}>
                    <Package size={40} style={{ color: 'rgba(201,151,58,0.3)', margin: '0 auto 12px' }} />
                    <p style={{ color: 'rgba(245,237,212,0.35)', fontSize: '14px' }}>No orders available right now</p>
                    <button onClick={fetchOrders} style={{ marginTop: '16px', background: 'none', border: '1px solid rgba(201,151,58,0.3)', borderRadius: '8px', color: '#C9973A', padding: '8px 20px', cursor: 'pointer', fontSize: '13px' }}>Refresh</button>
                  </div>
                ) : (
                  availableOrders.map(o => (
                    <AvailableOrderCard key={o.id} order={o} onPickup={setPickupModal} />
                  ))
                )}
              </motion.div>
            )}

            {/* ── My Orders ───────────────────────────── */}
            {activeTab === 'my-orders' && (
              <motion.div key="my" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#F5EDD4', fontFamily: "'Playfair Display', serif" }}>My Active Deliveries</h2>
                  <p style={{ fontSize: '13px', color: 'rgba(245,237,212,0.45)', marginTop: '2px' }}>
                    {myOrders.length} active order{myOrders.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {myOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', borderRadius: '16px', border: '1px dashed rgba(201,151,58,0.2)' }}>
                    <Truck size={40} style={{ color: 'rgba(201,151,58,0.3)', margin: '0 auto 12px' }} />
                    <p style={{ color: 'rgba(245,237,212,0.35)', fontSize: '14px' }}>No active deliveries. Pick up an order!</p>
                    <button onClick={() => setActiveTab('available')} style={{ marginTop: '16px', background: 'none', border: '1px solid rgba(201,151,58,0.3)', borderRadius: '8px', color: '#C9973A', padding: '8px 20px', cursor: 'pointer', fontSize: '13px' }}>
                      View Available Orders <ChevronRight size={13} style={{ display: 'inline' }} />
                    </button>
                  </div>
                ) : (
                  myOrders.map(o => (
                    <ActiveOrderCard key={o.id} order={o} onConfirmDelivery={setPinSheet} />
                  ))
                )}
              </motion.div>
            )}

            {/* ── Completed ───────────────────────────── */}
            {activeTab === 'completed' && (
              <motion.div key="completed" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#F5EDD4', fontFamily: "'Playfair Display', serif" }}>Completed Deliveries</h2>
                  <p style={{ fontSize: '13px', color: 'rgba(245,237,212,0.45)', marginTop: '2px' }}>{completedOrders.length} total deliveries</p>
                </div>
                {completedOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', borderRadius: '16px', border: '1px dashed rgba(201,151,58,0.2)' }}>
                    <CheckCircle size={40} style={{ color: 'rgba(201,151,58,0.3)', margin: '0 auto 12px' }} />
                    <p style={{ color: 'rgba(245,237,212,0.35)', fontSize: '14px' }}>Your completed deliveries appear here</p>
                  </div>
                ) : (
                  completedOrders.map(o => (
                    <div key={o.id} style={{ background: 'rgba(22,14,6,0.95)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '16px', padding: '16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '11px', color: '#C9973A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>#{o.id.slice(0, 8).toUpperCase()}</p>
                        <p style={{ fontSize: '13px', color: 'rgba(245,237,212,0.6)' }}>
                          {o.delivered_at ? new Date(o.delivered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '16px', fontWeight: 700, color: '#E8B84B' }}>₹{o.total_amount?.toLocaleString('en-IN')}</p>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#4ade80', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '20px', padding: '2px 10px' }}>Delivered ✓</span>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {/* ── Profile ─────────────────────────────── */}
            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#F5EDD4', fontFamily: "'Playfair Display', serif" }}>Driver Profile</h2>
                </div>
                {/* Avatar card */}
                <div style={{ background: 'rgba(22,14,6,0.95)', border: '1px solid rgba(201,151,58,0.2)', borderRadius: '20px', padding: '24px', marginBottom: '16px', textAlign: 'center' }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #C9973A, #E8B84B)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: '28px', fontWeight: 800, color: '#120a06' }}>
                    {profile?.name?.charAt(0)?.toUpperCase() || 'D'}
                  </div>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: '#F5EDD4', marginBottom: '4px' }}>{profile?.name || 'Driver'}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(245,237,212,0.45)' }}>{user?.email}</p>
                  <span style={{ display: 'inline-block', marginTop: '10px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 12px', borderRadius: '20px', background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}>
                    ✓ Approved Partner
                  </span>
                </div>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ background: 'rgba(22,14,6,0.95)', border: '1px solid rgba(201,151,58,0.15)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
                    <Package size={22} style={{ color: '#C9973A', margin: '0 auto 8px' }} />
                    <p style={{ fontSize: '28px', fontWeight: 800, color: '#E8B84B', lineHeight: 1 }}>{totalDeliveries}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(245,237,212,0.45)', marginTop: '4px' }}>Total Deliveries</p>
                  </div>
                  <div style={{ background: 'rgba(22,14,6,0.95)', border: '1px solid rgba(201,151,58,0.15)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
                    <IndianRupee size={22} style={{ color: '#C9973A', margin: '0 auto 8px' }} />
                    <p style={{ fontSize: '20px', fontWeight: 800, color: '#E8B84B', lineHeight: 1 }}>₹{totalEarnings.toLocaleString('en-IN')}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(245,237,212,0.45)', marginTop: '4px' }}>Total Value Delivered</p>
                  </div>
                </div>
                <button
                  onClick={async () => { await signOut(); navigate('/delivery/apply'); }}
                  style={{ width: '100%', padding: '14px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', color: '#f87171', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: "'Syne', sans-serif" }}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </div>

      {/* Bottom Tab Bar */}
      <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', height: '64px', background: 'rgba(12,8,3,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(201,151,58,0.15)', display: 'flex', zIndex: 100 }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          const badge = tab.id === 'available' ? availableOrders.length : tab.id === 'my-orders' ? myOrders.length : 0;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, border: 'none', background: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
                color: active ? '#E8B84B' : 'rgba(245,237,212,0.3)',
                borderTop: active ? '2px solid #C9973A' : '2px solid transparent',
                transition: 'all 0.2s',
                position: 'relative',
              }}
            >
              {badge > 0 && (
                <span style={{ position: 'absolute', top: '8px', right: '20%', background: '#C9973A', color: '#120a06', borderRadius: '10px', padding: '1px 5px', fontSize: '9px', fontWeight: 800, minWidth: '16px', textAlign: 'center' }}>
                  {badge}
                </span>
              )}
              {tab.icon}
              <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Modals */}
      <AnimatePresence>
        {pickupModal && (
          <ConfirmModal
            order={pickupModal}
            onConfirm={handlePickupConfirm}
            onCancel={() => setPickupModal(null)}
          />
        )}
        {pinSheet && (
          <PinSheet
            order={pinSheet}
            onClose={() => setPinSheet(null)}
            onDelivered={handleDelivered}
          />
        )}
      </AnimatePresence>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
