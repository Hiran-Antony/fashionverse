import { useState, useEffect, useRef } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard, Package, ShoppingBag, Users, LogOut,
  Plus, Edit2, Trash2, X, Upload, ChevronDown, Search,
  Home as HomeIcon, Eye, Image as ImageIcon,
  Star, IndianRupee, ShoppingCart, Bell, TrendingUp,
  TrendingDown, Crown, CheckCircle, Clock, Truck,
  ArrowUpRight, BarChart3, Filter, ChevronLeft, ChevronRight, AlertTriangle,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar,
} from 'recharts';
import { supabase } from '../lib/supabase';
import { uploadImage, getOptimizedUrl } from '../lib/cloudinary';
import { useAuthStore } from '../store/authStore';
import { CATEGORIES, SIZES, ORDER_STATUSES, SUB_CATEGORIES, GROUPED_CATEGORIES } from '../utils/constants';
import toast from 'react-hot-toast';

// ── Design Tokens ─────────────────────────────────────────────
const T = {
  bgDark:    '#0F0A06',
  sidebar:   '#130C05',
  card:      'rgba(30,18,9,0.85)',
  cardHover: 'rgba(45,26,14,0.95)',
  gold:      '#C9A84C',
  lightGold: '#E8C97A',
  accentGold:'#F0D080',
  textPrim:  '#F5EDD6',
  textMuted: '#A89070',
  success:   '#4CAF7D',
  warning:   '#E8943A',
  danger:    '#E05555',
  border:    'rgba(201,168,76,0.15)',
  glass:     'rgba(201,168,76,0.07)',
  teal:      '#4ECDC4',
  purple:    '#9B59B6',
  blue:      '#3498DB',
};

const SHADOW_MD  = '0 8px 24px rgba(0,0,0,0.4)';
const SHADOW_LG  = '0 20px 60px rgba(0,0,0,0.5)';
const SHADOW_GOLD= '0 0 20px rgba(201,168,76,0.2)';

// ── Types ─────────────────────────────────────────────────────
type AdminTab = 'overview' | 'products' | 'orders' | 'customers';
interface SizeStock { size: string; stock: number; }
interface ColorEntry { color_name: string; hex_code: string; image_url: string; imageFile?: File; }
interface ProductForm {
  name: string; description: string; price: string; original_price: string;
  brand: string; category: string; sub_category: string; group_category: string; is_featured: boolean; is_trending: boolean;
  tags: string; sizes: SizeStock[]; colors: ColorEntry[];
}
const BLANK_FORM: ProductForm = {
  name:'',description:'',price:'',original_price:'',brand:'',
  category:'men',sub_category:'',group_category:'',is_featured:false,is_trending:false,tags:'',
  sizes:SIZES.map(s=>({size:s as string,stock:0})),colors:[],
};

// ── Nav items ─────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'overview'  as AdminTab, label: 'Overview',   icon: LayoutDashboard },
  { id: 'products'  as AdminTab, label: 'Products',   icon: Package },
  { id: 'orders'    as AdminTab, label: 'Orders',     icon: ShoppingBag },
  { id: 'customers' as AdminTab, label: 'Users',      icon: Users },
];

const PAGE_TITLES: Record<AdminTab, string> = {
  overview:  'Dashboard Overview',
  products:  'Product Catalog',
  orders:    'Order Management',
  customers: 'User Management',
};

// ── GlassCard ─────────────────────────────────────────────────
function GlassCard({ children, style, className, onClick, onMouseEnter, onMouseLeave }: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      className={className}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        background: T.card,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${T.border}`,
        borderRadius: 20,
        boxShadow: `${SHADOW_MD}, ${SHADOW_GOLD}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── ModalParticles ─────────────────────────────────────────────
// Same gold particles as GoldParticles.tsx but contained inside the modal
function ModalParticles() {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const particles: HTMLDivElement[] = [];
    const count = 18;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      const isLeaf = Math.random() > 0.5;
      p.style.cssText = `
        position: absolute;
        width: ${isLeaf ? Math.random() * 8 + 4 : Math.random() * 4 + 2}px;
        height: ${isLeaf ? Math.random() * 12 + 6 : Math.random() * 4 + 2}px;
        background: ${Math.random() > 0.5 ? '#C9973A' : '#E8B84B'};
        border-radius: ${isLeaf ? '50% 0 50% 0' : '50%'};
        opacity: ${Math.random() * 0.4 + 0.1};
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: floatParticle${i % 5} ${Math.random() * 8 + 6}s ease-in-out infinite;
        animation-delay: ${Math.random() * 5}s;
        pointer-events: none;
        transform: rotate(${Math.random() * 360}deg);
      `;
      container.appendChild(p);
      particles.push(p);
    }
    return () => { particles.forEach(p => p.remove()); };
  }, []);
  return (
    <div ref={containerRef} aria-hidden="true" style={{
      position: 'absolute', inset: 0,
      pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
    }} />
  );
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, sub, color, trend }: {
  label: string; value: string | number; icon: React.ComponentType<any>;
  sub?: string; color: string; trend?: number;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <GlassCard
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: 24, position: 'relative', overflow: 'hidden', cursor: 'default',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? `${SHADOW_LG}, 0 0 32px ${color}30` : `${SHADOW_MD}, ${SHADOW_GOLD}`,
        borderColor: hovered ? `${color}40` : T.border,
      }}
    >
      {/* Geometric bg pattern */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 120, height: 120, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}25 0%, transparent 70%)`,
        pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', bottom: -20, left: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`,
        pointerEvents: 'none',
      }}/>

      {/* Icon */}
      <div style={{
        width: 48, height: 48, borderRadius: 14, marginBottom: 16,
        background: `linear-gradient(135deg, ${color}30, ${color}15)`,
        border: `1px solid ${color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 16px ${color}20`,
      }}>
        <Icon size={22} color={color} />
      </div>

      {/* Value */}
      <div style={{
        fontSize: 36, fontWeight: 800, color: T.accentGold, lineHeight: 1,
        marginBottom: 6, fontFamily: "'Space Grotesk', 'Inter', monospace",
        letterSpacing: '-0.02em',
      }}>
        {value}
      </div>

      {/* Label */}
      <div style={{
        fontSize: 13, fontWeight: 600, color: T.textPrim,
        fontFamily: "'Inter', sans-serif", marginBottom: 4,
      }}>
        {label}
      </div>

      {/* Sub + trend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {sub && <div style={{ fontSize: 11, color: T.textMuted }}>{sub}</div>}
        {trend !== undefined && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700,
            color: trend >= 0 ? T.success : T.danger,
          }}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </GlassCard>
  );
}

// ── Custom Tooltip ─────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(19,12,5,0.97)', border: `1px solid ${T.border}`,
      borderRadius: 12, padding: '10px 14px', boxShadow: SHADOW_LG,
    }}>
      <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4, fontFamily: "'Inter', sans-serif" }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ fontSize: 14, fontWeight: 700, color: T.accentGold, fontFamily: "'Space Grotesk', monospace" }}>
          {typeof p.value === 'number' && label !== undefined && String(label).match(/[A-Z]/) ? p.value : `₹${p.value?.toLocaleString('en-IN')}`}
        </div>
      ))}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────
function Skeleton({ w, h, r = 8, style }: { w?: string|number; h: number; r?: number; style?: React.CSSProperties }) {
  return (
    <div style={{
      width: w || '100%', height: h, borderRadius: r,
      background: `linear-gradient(90deg, rgba(45,26,14,0.6) 25%, rgba(71,44,20,0.6) 50%, rgba(45,26,14,0.6) 75%)`,
      backgroundSize: '200% 100%',
      animation: 'adminShimmer 1.6s ease-in-out infinite',
      ...style,
    }}/>
  );
}

// ── Section Divider ───────────────────────────────────────────
function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 20px' }}>
      <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, ${T.gold}40, transparent)` }}/>
      <span style={{
        fontSize: 9, fontWeight: 800, color: T.textMuted,
        textTransform: 'uppercase', letterSpacing: '0.18em',
        fontFamily: "'Inter', sans-serif",
      }}>
        {label}
      </span>
      <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, transparent, ${T.gold}40)` }}/>
    </div>
  );
}

// ── Status Badge ─────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const st = ORDER_STATUSES.find(s => s.value === status);
  const cfg: Record<string, { color: string; bg: string; label: string }> = {
    pending:   { color: T.gold,    bg: `${T.gold}18`,    label: 'Order Placed' },
    packed:    { color: T.teal,    bg: `${T.teal}18`,    label: 'Packed' },
    shipped:   { color: T.blue,    bg: `${T.blue}18`,    label: 'Shipped' },
    delivered: { color: T.success, bg: `${T.success}18`, label: 'Delivered' },
    cancelled: { color: T.danger,  bg: `${T.danger}18`,  label: 'Cancelled' },
  };
  const c = cfg[status] || { color: T.textMuted, bg: T.glass, label: status };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 12px', borderRadius: 999,
      background: c.bg, color: c.color,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
      border: `1px solid ${c.color}30`,
      fontFamily: "'Inter', sans-serif",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.color, display: 'inline-block' }}/>
      {st?.label || c.label}
    </span>
  );
}

// ── Input style helper ────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', padding: '13px 16px',
  borderRadius: 12, border: `1.5px solid ${T.border}`,
  background: 'rgba(20,12,5,0.8)', color: T.textPrim,
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
  fontFamily: "'Inter', sans-serif",
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const focusInp = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.target.style.borderColor = T.gold;
  e.target.style.boxShadow = `0 0 0 3px ${T.gold}20`;
};
const blurInp = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.target.style.borderColor = T.border;
  e.target.style.boxShadow = 'none';
};

// ══════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const qc = useQueryClient();
  const { user, profile, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['admin-pending-orders'],
    queryFn: async () => {
      const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      return count || 0;
    },
  });

  useEffect(() => {
    const sub = supabase.channel('pending-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        qc.invalidateQueries({ queryKey: ['admin-pending-orders'] });
        qc.invalidateQueries({ queryKey: ['admin-recent-orders'] });
        qc.invalidateQueries({ queryKey: ['admin-cancelled-orders'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [qc]);

  useEffect(() => {
    const html = document.documentElement;
    const prev = html.getAttribute('data-theme') || 'dark';
    html.setAttribute('data-theme', 'dark');
    return () => html.setAttribute('data-theme', prev);
  }, []);

  if (isLoading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background: T.bgDark }}>
        <div style={{ textAlign:'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            border: `3px solid ${T.border}`, borderTopColor: T.gold,
            animation: 'adminSpin 0.8s linear infinite', margin: '0 auto 16px',
          }}/>
          <div style={{ color: T.textMuted, fontSize: 13, fontFamily:"'Inter', sans-serif" }}>Loading dashboard…</div>
        </div>
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') return <Navigate to="/" replace />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700;800&display=swap');
        @keyframes adminSpin { to { transform: rotate(360deg); } }
        @keyframes adminShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes adminFadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes adminGlow { 0%,100% { box-shadow: 0 0 16px rgba(201,168,76,0.2); } 50% { box-shadow: 0 0 28px rgba(201,168,76,0.4); } }
        .admin-nav-btn:hover { background: rgba(201,168,76,0.12) !important; color: ${T.lightGold} !important; }
        .admin-nav-btn:hover svg { color: ${T.gold} !important; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: ${T.bgDark}; }
        ::-webkit-scrollbar-thumb { background: ${T.gold}60; border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: ${T.lightGold}; }
        /* Dot-grid background pattern */
        .admin-bg { background-image: radial-gradient(circle, rgba(201,168,76,0.07) 1px, transparent 1px); background-size: 28px 28px; }
      `}</style>

      <div className="admin-bg" style={{
        display: 'flex', minHeight: '100vh',
        background: T.bgDark,
        fontFamily: "'Inter', sans-serif",
      }}>

        {/* ── SIDEBAR ──────────────────────────────────── */}
        <aside style={{
          width: sidebarCollapsed ? 68 : 240, minWidth: sidebarCollapsed ? 68 : 240,
          background: T.sidebar,
          borderRight: `1px solid ${T.border}`,
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
          flexShrink: 0,
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
          zIndex: 30,
        }}>
          {/* Logo */}
          <div style={{ padding: sidebarCollapsed ? '24px 12px 20px' : '28px 20px 20px', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(20,12,5,0.9)',
              border: `2px solid ${T.gold}50`,
              boxShadow: `0 0 24px ${T.gold}35, 0 0 48px ${T.gold}15, inset 0 0 16px ${T.gold}10`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px', overflow: 'hidden',
              animation: 'adminGlow 3s ease-in-out infinite',
            }}>
              <img src="/logo.png" alt="FV" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
            </div>
            {!sidebarCollapsed && (
              <div style={{
                fontSize: 9, fontWeight: 800, color: T.gold,
                textTransform: 'uppercase', letterSpacing: '0.22em',
                fontFamily: "'Inter', sans-serif",
              }}>
                Admin Panel
              </div>
            )}
          </div>

          <div style={{ height: 1, background: T.border, margin: '0 16px 16px' }}/>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '0 10px' }}>
            {!sidebarCollapsed && (
              <div style={{
                fontSize: 9, fontWeight: 800, color: T.textMuted,
                textTransform: 'uppercase', letterSpacing: '0.18em',
                padding: '0 10px', marginBottom: 10,
              }}>
                Main Menu
              </div>
            )}

            {NAV_ITEMS.map(item => {
              const active = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className="admin-nav-btn"
                  onClick={() => setActiveTab(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: sidebarCollapsed ? 0 : 12,
                    padding: sidebarCollapsed ? '12px 0' : '12px 14px',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    borderRadius: 12, marginBottom: 4,
                    background: active ? `rgba(201,168,76,0.14)` : 'transparent',
                    borderLeft: active ? `3px solid ${T.gold}` : '3px solid transparent',
                    borderRight: 'none', borderTop: 'none', borderBottom: 'none',
                    color: active ? T.lightGold : T.textMuted,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    textAlign: 'left', transition: 'all 0.2s',
                    boxShadow: active ? `inset 0 0 20px ${T.gold}08` : 'none',
                  }}
                >
                  <Icon size={17} color={active ? T.gold : T.textMuted} style={{ flexShrink: 0 }}/>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                  {!sidebarCollapsed && active && (
                    <ArrowUpRight size={12} style={{ marginLeft: 'auto', color: T.gold }}/>
                  )}
                </button>
              );
            })}

            <div style={{ height: 1, background: T.border, margin: '14px 6px' }}/>
            {!sidebarCollapsed && (
              <div style={{
                fontSize: 9, fontWeight: 800, color: T.textMuted,
                textTransform: 'uppercase', letterSpacing: '0.18em',
                padding: '0 10px', marginBottom: 10,
              }}>
                Store
              </div>
            )}
            <Link to="/" title={sidebarCollapsed ? 'Back to Store' : undefined} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: sidebarCollapsed ? '12px 0' : '12px 14px',
              borderRadius: 12, color: T.textMuted, fontSize: 13, fontWeight: 600,
              textDecoration: 'none', transition: 'color 0.2s',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              borderLeft: '3px solid transparent',
            }}>
              <HomeIcon size={17} color={T.textMuted}/>
              {!sidebarCollapsed && 'Back to Store'}
            </Link>
          </nav>

          {/* Profile card */}
          {!sidebarCollapsed && (
            <div style={{
              margin: 12, padding: 16,
              border: `1px solid ${T.border}`,
              borderRadius: 16,
              background: `linear-gradient(135deg, rgba(201,168,76,0.08), rgba(30,18,9,0.6))`,
              boxShadow: `inset 0 0 20px ${T.gold}05`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${T.gold}, ${T.lightGold})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: T.bgDark, fontWeight: 800, fontSize: 14,
                  border: `2px solid ${T.gold}60`,
                }}>
                  {profile?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 700, color: T.textPrim,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {profile?.name || 'Admin'}
                  </div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>Administrator</div>
                </div>
              </div>
              <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/'; }} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px', borderRadius: 10, background: `${T.danger}15`,
                border: `1px solid ${T.danger}30`, color: T.danger,
                fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              }}>
                <LogOut size={12}/> Sign Out
              </button>
            </div>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(c => !c)}
            style={{
              margin: '8px 12px 16px', padding: '8px',
              borderRadius: 10, border: `1px solid ${T.border}`,
              background: 'transparent', color: T.textMuted,
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.2s',
            }}
          >
            <Filter size={13}/>
            {!sidebarCollapsed && 'Collapse'}
          </button>
        </aside>

        {/* ── CONTENT AREA ─────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Topbar */}
          <header style={{
            height: 70, background: 'rgba(15,10,6,0.9)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${T.border}`,
            padding: '0 32px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
            <div>
              <div style={{
                fontSize: 10, fontWeight: 700, color: T.textMuted,
                textTransform: 'uppercase', letterSpacing: '0.16em',
                fontFamily: "'Inter', sans-serif", marginBottom: 2,
              }}>
                FashionVerse / {PAGE_TITLES[activeTab]}
              </div>
              <div style={{
                fontSize: 26, fontWeight: 700, color: T.lightGold,
                fontFamily: "'Playfair Display', serif",
                letterSpacing: '-0.02em', lineHeight: 1,
              }}>
                {PAGE_TITLES[activeTab]}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Bell */}
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setActiveTab('orders')}
                  style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: T.glass, border: `1px solid ${T.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = T.gold}
                  onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
                >
                  <Bell size={16} color={T.textMuted}/>
                </button>
                <AnimatePresence>
                  {pendingCount > 0 && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      style={{
                        position: 'absolute', top: -6, right: -6,
                        minWidth: 20, height: 20, padding: '0 6px', borderRadius: 10,
                        background: T.danger, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 800, fontFamily: "'Inter', sans-serif",
                        border: '2px solid #0F0A06', zIndex: 10, pointerEvents: 'none'
                      }}
                    >
                      {pendingCount}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* Avatar */}
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: `linear-gradient(135deg, ${T.gold}, ${T.lightGold})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: T.bgDark, fontWeight: 800, fontSize: 14,
                border: `2px solid ${T.gold}60`,
                boxShadow: `0 0 12px ${T.gold}40`,
              }}>
                {profile?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            </div>
          </header>

          {/* Page body */}
          <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
            <AnimatePresence mode="wait">
              {activeTab === 'overview'  && <OverviewTab  key="overview" />}
              {activeTab === 'products'  && <ProductsTab  key="products" />}
              {activeTab === 'orders'    && <OrdersTab    key="orders" />}
              {activeTab === 'customers' && <CustomersTab key="customers" />}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ══════════════════════════════════════════════════════════════
function OverviewTab() {
  const [calendarDate, setCalendarDate] = useState(new Date());

  const currentMonth = calendarDate.toLocaleString('default', { month: 'long' });
  const currentYear = calendarDate.getFullYear();
  const daysInMonth = new Date(currentYear, calendarDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, calendarDate.getMonth(), 1).getDay();
  const calendarGrid = Array.from({ length: firstDayOfMonth }).map(() => null).concat(
    Array.from({ length: daysInMonth }).map((_, i) => i + 1)
  );
  
  const handlePrevMonth = () => setCalendarDate(new Date(currentYear, calendarDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCalendarDate(new Date(currentYear, calendarDate.getMonth() + 1, 1));
  const today = new Date();
  
  const { data: lowStockAlerts = [] } = useQuery({
    queryKey: ['admin-low-stock'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('name, product_sizes(size, stock), product_colors(image_url)').eq('is_active', true);
      const alerts: any[] = [];
      (data || []).forEach((p: any) => {
        const image = p.product_colors?.[0]?.image_url || '';
        (p.product_sizes || []).forEach((s: any) => {
          if (s.stock < 5) alerts.push({ name: p.name, size: s.size, stock: s.stock, image });
        });
      });
      return alerts.sort((a, b) => a.stock - b.stock).slice(0, 6);
    }
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [products, orders, customers] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id,total_amount,created_at,status'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      ]);
      const orderData = orders.data || [];
      const validOrders = orderData.filter((o: any) => o.status !== 'cancelled');
      const revenue = validOrders.reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
      return { products: products.count ?? 0, orders: validOrders.length, revenue, customers: customers.count ?? 0, orderData: validOrders };
    },
    placeholderData: { products: 0, orders: 0, revenue: 0, customers: 0, orderData: [] },
  });

  const { data: recentOrders = [] } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('id,total_amount,status,created_at,address')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(6);
      return data || [];
    },
  });

  const { data: cancelledOrders = [] } = useQuery({
    queryKey: ['admin-cancelled-orders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('id,total_amount,created_at,profiles:user_id(name)')
        .eq('status', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(4);
      return data || [];
    },
  });

  // Weekly sales data from real orders
  const weeklySales = (() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const totals: Record<string, number> = {};
    days.forEach(d => (totals[d] = 0));
    (stats?.orderData || []).forEach((o: any) => {
      const dayIdx = new Date(o.created_at).getDay();
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIdx];
      if (totals[dayName] !== undefined) totals[dayName] += o.total_amount || 0;
    });
    return days.map(d => ({ day: d, revenue: totals[d] }));
  })();

  // Monthly revenue (last 6 months)
  const monthlyRevenue = (() => {
    const months: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        month: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        revenue: 0,
      });
    }
    (stats?.orderData || []).forEach((o: any) => {
      const d = new Date(o.created_at);
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      const entry = months.find(m => m.month === label);
      if (entry) entry.revenue += o.total_amount || 0;
    });
    return months;
  })();

  // Calculate explicit clean ticks based on actual data
  const calcTicks = (maxVal: number): number[] => {
    if (maxVal === 0) return [0];
    // Find a nice round step so we get ~4-5 ticks
    const rawStep = maxVal / 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const step = Math.ceil(rawStep / magnitude) * magnitude;
    const count = Math.ceil(maxVal / step);
    return Array.from({ length: count + 1 }, (_, i) => i * step);
  };

  const weeklyMax = Math.max(...weeklySales.map(d => d.revenue), 0);
  const weeklyTicks = calcTicks(weeklyMax);

  const monthlyMax = Math.max(...monthlyRevenue.map(d => d.revenue), 0);
  const monthlyTicks = calcTicks(monthlyMax);

  const fmtTick = (v: number) => {
    if (v === 0) return '₹0';
    if (v >= 1000) return `₹${(v / 1000).toFixed(0)}k`;
    return `₹${v}`;
  };

  // Category donut
  const { data: catData } = useQuery({
    queryKey: ['admin-category-counts'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('category').eq('is_active', true);
      const counts: Record<string, number> = {};
      (data || []).forEach((p: any) => { counts[p.category] = (counts[p.category] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  });

  const PIE_COLORS = [T.gold, T.teal, T.purple, T.warning, T.blue];
  const totalCatProducts = (catData || []).reduce((s, c) => s + c.value, 0);

  const STATS_CFG = [
    { label: 'Total Revenue',   value: `₹${(stats?.revenue || 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: T.gold,    sub: 'All-time earnings',  trend: 12 },
    { label: 'Total Orders',    value: stats?.orders || 0,   icon: ShoppingCart, color: T.teal,   sub: 'Customer orders',    trend: 8 },
    { label: 'Customers',       value: stats?.customers || 0, icon: Users,        color: T.purple, sub: 'Registered users',   trend: 5 },
    { label: 'Active Products', value: stats?.products || 0,  icon: Package,      color: T.warning,sub: 'In your catalog',    trend: -2 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 28 }}
    >
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
        {STATS_CFG.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            {statsLoading ? <Skeleton h={160} r={20}/> : <StatCard {...s}/>}
          </motion.div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }}>
        {/* Area chart */}
        <GlassCard style={{ padding: 24 }}>
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrim, fontFamily: "'Playfair Display', serif" }}>
                Weekly Sales Overview
              </div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Revenue by day of week</div>
            </div>
            <div style={{
              padding: '4px 12px', borderRadius: 999,
              background: `${T.gold}15`, color: T.gold, fontSize: 11, fontWeight: 700,
              border: `1px solid ${T.gold}30`,
            }}>
              This Week
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklySales} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={T.gold} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={T.gold} stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.08)" vertical={false}/>
              <XAxis dataKey="day" tick={{ fill: T.textMuted, fontSize: 11, fontFamily: "'Inter', sans-serif" }} axisLine={false} tickLine={false}/>
              <YAxis ticks={weeklyTicks} domain={[0, weeklyTicks[weeklyTicks.length - 1]]} tick={{ fill: T.textMuted, fontSize: 10, fontFamily: "'Space Grotesk', monospace" }} axisLine={false} tickLine={false}
                tickFormatter={fmtTick}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Area type="monotone" dataKey="revenue" stroke={T.gold} strokeWidth={2.5}
                fill="url(#goldGrad)" dot={{ fill: T.gold, strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: T.lightGold }}/>
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Calendar Widget */}
        <GlassCard style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrim, fontFamily: "'Playfair Display', serif" }}>
                Calendar
              </div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{currentMonth} {currentYear}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handlePrevMonth} style={{ background: 'rgba(201,168,76,0.1)', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 4, cursor: 'pointer', color: T.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronLeft size={16} />
              </button>
              <button onClick={handleNextMonth} style={{ background: 'rgba(201,168,76,0.1)', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 4, cursor: 'pointer', color: T.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center', marginBottom: 12 }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} style={{ fontSize: 11, fontWeight: 800, color: T.textMuted, fontFamily: "'Inter', sans-serif" }}>{day}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px 4px', textAlign: 'center' }}>
            {calendarGrid.map((day, i) => {
              const isToday = day === today.getDate() && calendarDate.getMonth() === today.getMonth() && calendarDate.getFullYear() === today.getFullYear();
              return (
                <div key={i} style={{ 
                  height: 32, width: 32, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: 13, background: isToday ? T.gold : (day ? 'rgba(255,255,255,0.02)' : 'transparent'),
                  color: isToday ? '#000' : (day ? T.textPrim : 'transparent'),
                  border: day && !isToday ? `1px solid ${T.border}40` : 'none',
                  borderRadius: '50%', fontWeight: isToday ? 800 : 500,
                  fontFamily: "'Space Grotesk', monospace", transition: 'all 0.2s', cursor: day ? 'pointer' : 'default'
                }}>
                  {day || ''}
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* Bar chart - Monthly Revenue */}
      <GlassCard style={{ padding: 24 }}>
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrim, fontFamily: "'Playfair Display', serif" }}>
              Monthly Revenue Trend
            </div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Last 6 months performance</div>
          </div>
          <BarChart3 size={18} color={T.textMuted}/>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyRevenue} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="barGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={T.accentGold} stopOpacity={1}/>
                <stop offset="100%" stopColor={T.gold}       stopOpacity={0.6}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.08)" vertical={false}/>
            <XAxis dataKey="month" tick={{ fill: T.textMuted, fontSize: 11, fontFamily: "'Inter', sans-serif" }} axisLine={false} tickLine={false}/>
            <YAxis ticks={monthlyTicks} domain={[0, monthlyTicks[monthlyTicks.length - 1]]} tick={{ fill: T.textMuted, fontSize: 10, fontFamily: "'Space Grotesk', monospace" }} axisLine={false} tickLine={false}
              tickFormatter={fmtTick}/>
            <Tooltip content={<ChartTooltip/>} cursor={{ fill: 'transparent' }}/>
            <Bar 
              dataKey="revenue" 
              fill="url(#barGold)" 
              radius={[8, 8, 0, 0]} 
              maxBarSize={52}
              activeBar={{ fill: '#E8B84B', filter: 'drop-shadow(0px 0px 10px rgba(232,184,75,0.5))' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Bottom Section (Alerts + Orders) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Recent Orders Table */}
        <GlassCard style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '20px 24px 16px', borderBottom: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrim, fontFamily: "'Playfair Display', serif" }}>
                Recent Orders
              </div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Latest transactions</div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 999,
              background: `${T.gold}15`, color: T.gold, border: `1px solid ${T.gold}30`,
            }}>
              {recentOrders.length} orders
            </span>
          </div>
          <div style={{ overflowX: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(20,12,5,0.6)' }}>
                  {['Order ID', 'Customer', 'Amount', 'Status', 'Date'].map(h => (
                    <th key={h} style={{
                      padding: '12px 20px', textAlign: 'left',
                      fontSize: 9, fontWeight: 800, color: T.textMuted,
                      textTransform: 'uppercase', letterSpacing: '0.14em',
                      fontFamily: "'Inter', sans-serif", fontVariant: 'small-caps',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '60px 20px', textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
                    No orders yet
                  </td></tr>
                ) : (
                  recentOrders.map((order: any, i: number) => {
                    const orderNum = 100 + recentOrders.length - i;
                    return (
                      <tr key={order.id}
                        style={{ borderBottom: `1px solid ${T.border}30`, transition: 'all 0.15s' }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLTableRowElement).style.background = `${T.gold}06`;
                          (e.currentTarget as HTMLTableRowElement).style.borderLeft = `3px solid ${T.gold}40`;
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                          (e.currentTarget as HTMLTableRowElement).style.borderLeft = 'none';
                        }}
                      >
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: T.gold, fontFamily: "'Space Grotesk', monospace" }}>
                            #{orderNum}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600, color: T.textPrim }}>
                          {order.address?.name || 'Customer'}
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 800, color: T.accentGold, fontFamily: "'Space Grotesk', monospace" }}>
                          ₹{order.total_amount?.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <StatusBadge status={order.status}/>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 12, color: T.textMuted }}>
                          {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Alerts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Low Stock Alerts */}
          <GlassCard style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrim, fontFamily: "'Playfair Display', serif" }}>
                  Inventory Alerts
                </div>
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Low stock items</div>
              </div>
              <AlertTriangle size={18} color={T.danger} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1, paddingRight: 4 }}>
              {lowStockAlerts.length === 0 ? (
                <div style={{ color: T.textMuted, fontSize: 13, textAlign: 'center', padding: '40px 0' }}>All stock levels are healthy!</div>
              ) : (
                lowStockAlerts.map((alert: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: i < lowStockAlerts.length - 1 ? `1px solid ${T.border}30` : 'none' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', flexShrink: 0 }}>
                      <img src={getOptimizedUrl(alert.image, 80)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{alert.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                        <span style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(201,168,76,0.1)', color: T.gold, borderRadius: 4, fontFamily: "'Space Grotesk', monospace", fontWeight: 700 }}>Size {alert.size}</span>
                        <span style={{ fontSize: 11, color: T.danger, fontWeight: 700 }}>{alert.stock} left</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>

          {/* Cancelled Orders Notifications */}
          <GlassCard style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${T.danger}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={20} color={T.danger}/>
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.textPrim, fontFamily: "'Playfair Display', serif" }}>
                  Cancelled Orders
                </h3>
                <p style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Customer cancellation alerts</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              {cancelledOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: T.textMuted, fontSize: 13 }}>No recent cancellations.</div>
              ) : (
                cancelledOrders.map((co: any, i: number) => (
                  <div key={co.id} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: i < cancelledOrders.length - 1 ? `1px solid ${T.border}30` : 'none' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: T.textPrim }}>Order #{co.id.slice(0,6).toUpperCase()}</p>
                      <p style={{ fontSize: 12, color: T.textMuted }}>{co.profiles?.name || 'Customer'} cancelled</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: T.danger }}>-₹{co.total_amount?.toLocaleString()}</p>
                      <p style={{ fontSize: 10, color: T.textMuted }}>{new Date(co.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// PRODUCTS TAB
// ══════════════════════════════════════════════════════════════
function ProductsTab() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>({ ...BLANK_FORM, sizes: SIZES.map(s => ({ size: s as string, stock: 0 })) });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*, product_colors(*), product_sizes(*)').eq('is_active', true).order('created_at', { ascending: false });
      return data || [];
    },
  });

  const filtered = products.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || (p.brand || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.name || !form.price || !form.category) { toast.error('Name, Price and Category are required'); return; }
    if (form.colors.length === 0) { toast.error('Add at least one color with an image'); return; }
    setSaving(true);
    try {
      const tagsArray = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const payload = {
        name: form.name.trim(), description: form.description.trim(), price: parseFloat(form.price),
        original_price: form.original_price ? parseFloat(form.original_price) : null,
        brand: form.brand.trim(), category: form.category, is_featured: form.is_featured,
        is_trending: form.is_trending, tags: tagsArray, is_active: true,
        product_group: form.group_category || null,
        product_type: form.sub_category || null,
      };
      let productId = editingId;
      if (editingId) {
        await supabase.from('products').update(payload).eq('id', editingId);
      } else {
        const { data, error } = await supabase.from('products').insert(payload).select().single();
        if (error) throw error;
        productId = data.id;
      }
      if (!productId) throw new Error('No product ID');
      if (!editingId) {
        const colorData = await Promise.all(form.colors.map(async c => {
          let imageUrl = c.image_url;
          if (c.imageFile) imageUrl = await uploadImage(c.imageFile, 'products');
          return { product_id: productId, color_name: c.color_name, hex_code: c.hex_code, image_url: imageUrl };
        }));
        await supabase.from('product_colors').insert(colorData);
        const sizeData = form.sizes.filter(s => s.stock > 0).map(s => ({ product_id: productId, size: s.size, stock: s.stock, is_out_of_stock: false }));
        if (sizeData.length > 0) await supabase.from('product_sizes').insert(sizeData);
      }
      toast.success(editingId ? 'Product updated!' : 'Product added! 🎉');
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      setShowModal(false);
      setForm({ ...BLANK_FORM, sizes: SIZES.map(s => ({ size: s as string, stock: 0 })) });
      setEditingId(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try {
      // First delete dependent records to avoid foreign key constraint errors
      await supabase.from('product_sizes').delete().eq('product_id', id);
      await supabase.from('product_colors').delete().eq('product_id', id);
      
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        if (error.message.includes('foreign key constraint')) {
          // Fallback to soft delete if attached to existing orders
          await supabase.from('products').update({ is_active: false }).eq('id', id);
          toast.success('Product archived (attached to past orders)');
        } else {
          throw error;
        }
      } else {
        toast.success('Product deleted');
      }
      
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    } catch (err: any) {
      toast.error('Failed to delete: ' + err.message);
      console.error(err);
    }
  };

  const addColor = () => setForm(f => ({ ...f, colors: [...f.colors, { color_name: '', hex_code: '#C9A84C', image_url: '' }] }));
  const removeColor = (i: number) => setForm(f => ({ ...f, colors: f.colors.filter((_, idx) => idx !== i) }));

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.textMuted }}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or brand…"
            style={{ ...inp, paddingLeft: 42 }} onFocus={focusInp} onBlur={blurInp}/>
        </div>
        <button onClick={() => { setShowModal(true); setEditingId(null); setForm({ ...BLANK_FORM, sizes: SIZES.map(s => ({ size: s as string, stock: 0 })) }); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 22px', borderRadius: 999,
            background: `linear-gradient(135deg, ${T.gold}, ${T.lightGold})`,
            color: T.bgDark, fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer',
            boxShadow: `0 4px 20px ${T.gold}50`, flexShrink: 0, transition: 'all 0.2s',
          }}>
          <Plus size={15}/> Add Product
        </button>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {[...Array(8)].map((_, i) => <Skeleton key={i} h={300} r={20}/>)}
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard style={{ padding: '80px 0', textAlign: 'center' }}>
          <Package size={40} color={T.gold} style={{ margin: '0 auto 16px', display: 'block' }}/>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrim, marginBottom: 6 }}>No products yet</div>
          <div style={{ fontSize: 13, color: T.textMuted }}>Click "Add Product" to get started</div>
        </GlassCard>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {filtered.map((p: any) => {
            const totalStock = (p.product_sizes || []).reduce((s: number, sz: any) => s + (sz.stock || 0), 0);
            const img = p.product_colors?.[0]?.image_url;
            const stockColor = totalStock > 10 ? T.success : totalStock > 0 ? T.warning : T.danger;
            return (
              <motion.div key={p.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <GlassCard style={{ overflow: 'hidden', transition: 'all 0.3s' }}>
                  {/* Image */}
                  <div style={{ position: 'relative', aspectRatio: '3/4', background: 'rgba(20,12,5,0.8)', overflow: 'hidden' }}>
                    {img ? (
                      <img src={getOptimizedUrl(img, 300)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ImageIcon size={32} color={T.gold}/>
                      </div>
                    )}
                    {/* Labels */}
                    <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {p.is_featured && <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: T.gold, color: T.bgDark }}>NEW</span>}
                      {p.is_trending && <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: T.teal, color: T.bgDark }}>HOT</span>}
                    </div>
                    {/* Actions */}
                    <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <button onClick={() => {
                        setEditingId(p.id);
                        setForm({
                          name: p.name, description: p.description || '', price: String(p.price),
                          original_price: String(p.original_price || ''), brand: p.brand || '',
                          category: p.category, is_featured: p.is_featured, is_trending: p.is_trending,
                          tags: (p.tags || []).join(', '),
                          group_category: p.product_group || '',
                          sub_category: p.product_type || '',
                          sizes: SIZES.map(s => { const f = (p.product_sizes || []).find((ps: any) => ps.size === s); return { size: s as string, stock: f?.stock || 0 }; }),
                          colors: (p.product_colors || []).map((c: any) => ({ color_name: c.color_name, hex_code: c.hex_code || '#000', image_url: c.image_url })),
                        });
                        setShowModal(true);
                      }} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(0,0,0,0.7)', border: `1px solid ${T.gold}40`, color: T.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                        <Edit2 size={13}/>
                      </button>
                      <button onClick={() => handleDelete(p.id)} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(0,0,0,0.7)', border: `1px solid ${T.danger}40`, color: T.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                        <Trash2 size={13}/>
                      </button>
                    </div>
                    {/* Stock dot */}
                    <div style={{ position: 'absolute', bottom: 10, left: 10, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', padding: '3px 8px', borderRadius: 999, border: `1px solid ${stockColor}30` }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: stockColor, boxShadow: `0 0 6px ${stockColor}` }}/>
                      <span style={{ fontSize: 10, color: stockColor, fontWeight: 700 }}>{totalStock} in stock</span>
                    </div>
                  </div>
                  {/* Info */}
                  <div style={{ padding: '14px 16px' }}>
                    {p.brand && <div style={{ fontSize: 9, fontWeight: 800, color: T.gold, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 4 }}>{p.brand}</div>}
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrim, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: T.glass, color: T.textMuted, textTransform: 'capitalize', border: `1px solid ${T.border}` }}>{p.category}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: T.accentGold, fontFamily: "'Space Grotesk', monospace" }}>₹{p.price?.toLocaleString('en-IN')}</span>
                      {p.original_price && <span style={{ fontSize: 11, color: T.textMuted, textDecoration: 'line-through' }}>₹{p.original_price?.toLocaleString('en-IN')}</span>}
                    </div>
                    {p.created_at && (
                      <div style={{ 
                        fontSize: 11, fontWeight: 600, color: T.textMuted, 
                        marginTop: 12, paddingTop: 10, borderTop: `1px dashed ${T.border}`,
                        display: 'flex', alignItems: 'center', gap: 6 
                      }}>
                        <Clock size={12} />
                        Added {new Date(p.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 1000, overflow: 'hidden' }}/>
            <motion.div key="md" initial={{ opacity: 0, scale: 0.95, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => { if (e.target === e.currentTarget && !saving) setShowModal(false); }}
              style={{ position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
              {/* Outer shell — clips particles to rounded corners, NOT scrollable */}
              <div style={{
                  position: 'relative',
                  width: '100%', maxWidth: 700,
                  borderRadius: 24,
                  background: 'linear-gradient(135deg, #1a0f00 0%, #2d1a00 50%, #1a0f00 100%)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  boxShadow: `${SHADOW_LG}, 0 0 60px rgba(201, 168, 76, 0.08)`,
                  overflow: 'hidden',          /* clips particles */
                  maxHeight: 'calc(100vh - 100px)',
                }}>
                {/* Floating particles layer — inside the outer shell so they're clipped */}
                <ModalParticles />

                {/* Inner scrollable layer */}
                <div
                  onWheel={e => e.stopPropagation()}
                  style={{
                    position: 'relative', zIndex: 1,
                    overflowY: 'auto',
                    maxHeight: 'calc(100vh - 100px)',
                    overscrollBehavior: 'contain',
                    WebkitOverflowScrolling: 'touch',
                  }}>

                {/* Modal Header */}
                <div style={{
                  position: 'sticky', top: 0,
                  background: 'linear-gradient(135deg, rgba(26,15,0,0.97) 0%, rgba(45,26,0,0.97) 100%)',
                  backdropFilter: 'blur(16px)',
                  padding: '22px 28px 18px', borderBottom: '1px solid rgba(212,175,55,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10,
                }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: T.lightGold, fontFamily: "'Playfair Display', serif", letterSpacing: '0.02em' }}>
                      {editingId ? '✦ Edit Product' : '✦ Add New Product'}
                    </div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Fill in all details carefully before saving</div>
                  </div>
                  <button onClick={() => !saving && setShowModal(false)} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(201,168,76,0.07)', border: `1px solid ${T.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={16} color={T.textMuted}/>
                  </button>
                </div>

                <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 32, position: 'relative', zIndex: 1 }}>
                  {/* BASIC INFO */}
                  <section>
                    <SectionDivider label="Basic Info"/>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div style={{ gridColumn: '1/-1' }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Product Name *</label>
                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Premium Slim Fit Oxford Shirt"
                          style={inp} onFocus={focusInp} onBlur={blurInp}/>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Brand *</label>
                        <input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="e.g. Louis Philippe"
                          style={inp} onFocus={focusInp} onBlur={blurInp}/>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Category *</label>
                        <div style={{ position: 'relative' }}>
                          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value, group_category: '', sub_category: '' }))}
                            style={{ ...inp, appearance: 'none', paddingRight: 36 }} onFocus={focusInp} onBlur={blurInp}>
                            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>
                          <ChevronDown size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, pointerEvents: 'none' }}/>
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Product Group</label>
                        <div style={{ position: 'relative' }}>
                          <select value={form.group_category} onChange={e => setForm(f => ({ ...f, group_category: e.target.value, sub_category: '' }))}
                            style={{ ...inp, appearance: 'none', paddingRight: 36 }} onFocus={focusInp} onBlur={blurInp}>
                            <option value="">Select Group</option>
                            {(GROUPED_CATEGORIES[form.category] || []).map(g => <option key={g.heading} value={g.heading}>{g.heading}</option>)}
                          </select>
                          <ChevronDown size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, pointerEvents: 'none' }}/>
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Product Type</label>
                        <div style={{ position: 'relative' }}>
                          <select value={form.sub_category} onChange={e => setForm(f => ({ ...f, sub_category: e.target.value }))}
                            style={{ ...inp, appearance: 'none', paddingRight: 36 }} onFocus={focusInp} onBlur={blurInp}
                            disabled={!form.group_category}>
                            <option value="">{form.group_category ? 'Select Type' : 'Select Group first'}</option>
                            {(GROUPED_CATEGORIES[form.category]?.find(g => g.heading === form.group_category)?.items || []).map(item =>
                              <option key={item.value} value={item.value}>{item.label}</option>
                            )}
                          </select>
                          <ChevronDown size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, pointerEvents: 'none' }}/>
                        </div>
                      </div>
                      <div style={{ gridColumn: '1/-1' }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Description</label>
                        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the product…" rows={3}
                          style={{ ...inp, resize: 'none' }} onFocus={focusInp} onBlur={blurInp}/>
                      </div>
                      <div style={{ gridColumn: '1/-1' }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tags (comma separated)</label>
                        <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="casual, summer, cotton"
                          style={inp} onFocus={focusInp} onBlur={blurInp}/>
                      </div>
                    </div>
                  </section>

                  {/* PRICING */}
                  <section>
                    <SectionDivider label="Pricing"/>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sale Price (₹) *</label>
                        <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="1499" type="number"
                          style={inp} onFocus={focusInp} onBlur={blurInp}/>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Original MRP (₹)</label>
                        <input value={form.original_price} onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))} placeholder="2499" type="number"
                          style={inp} onFocus={focusInp} onBlur={blurInp}/>
                      </div>
                    </div>

                    {/* Labels */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
                      {[
                        { key: 'is_featured' as const, label: '⭐ New Arrival', desc: 'Shows in New Arrivals section' },
                        { key: 'is_trending' as const, label: '🔥 Trending',   desc: 'Shows in Trending section' },
                      ].map(({ key, label, desc }) => (
                        <label key={key} style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, cursor: 'pointer',
                          border: `1.5px solid ${form[key] ? T.gold : T.border}`,
                          background: form[key] ? `${T.gold}10` : 'rgba(20,12,5,0.6)', transition: 'all 0.2s',
                        }}>
                          <input type="checkbox" checked={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                            style={{ width: 16, height: 16, accentColor: T.gold }}/>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: T.textPrim }}>{label}</div>
                            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* Stock */}
                    <div style={{ marginTop: 20 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Stock Per Size</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                        {form.sizes.map((s, i) => (
                          <div key={s.size} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 10, fontWeight: 800, marginBottom: 8, padding: '4px 8px', borderRadius: 8, background: s.stock > 0 ? `${T.gold}20` : 'rgba(20,12,5,0.6)', color: s.stock > 0 ? T.gold : T.textMuted, display: 'inline-block' }}>{s.size}</div>
                            <input type="number" min="0" value={s.stock}
                              onChange={e => { const n = [...form.sizes]; n[i] = { ...n[i], stock: parseInt(e.target.value) || 0 }; setForm(f => ({ ...f, sizes: n })); }}
                              style={{ ...inp, textAlign: 'center', padding: '10px 4px' }} onFocus={focusInp} onBlur={blurInp}/>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* MEDIA */}
                  <section>
                    <SectionDivider label="Media"/>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ fontSize: 12, color: T.textMuted }}>Add product colors and images</div>
                      <button type="button" onClick={addColor} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 999, background: `${T.gold}18`, color: T.gold, border: `1px solid ${T.gold}40`, cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.2s' }}>
                        <Plus size={12}/> Add Color
                      </button>
                    </div>
                    {form.colors.length === 0 ? (
                      <div style={{ borderRadius: 16, border: `2px dashed ${T.gold}30`, padding: '48px 0', textAlign: 'center', background: `${T.gold}04` }}>
                        <Upload size={28} color={T.textMuted} style={{ margin: '0 auto 10px', display: 'block' }}/>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.textMuted }}>No colors added yet</div>
                        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>Click "Add Color" to upload product photos</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {form.colors.map((c, i) => (
                          <div key={i} style={{ display: 'flex', gap: 14, padding: 16, borderRadius: 16, background: 'rgba(20,12,5,0.6)', border: `1px solid ${T.border}` }}>
                            <div onClick={() => document.getElementById(`cimg-${i}`)?.click()}
                              style={{ width: 70, height: 84, borderRadius: 14, overflow: 'hidden', flexShrink: 0, cursor: 'pointer', border: `2px dashed ${T.gold}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(12,7,3,0.8)', transition: 'border-color 0.2s' }}>
                              {c.image_url ? <img src={c.image_url} alt="color" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : (
                                <div style={{ textAlign: 'center' }}>
                                  <Upload size={16} color={T.textMuted} style={{ margin: '0 auto 4px', display: 'block' }}/>
                                  <span style={{ fontSize: 9, color: T.textMuted }}>Upload</span>
                                </div>
                              )}
                              <input id={`cimg-${i}`} type="file" accept="image/*" style={{ display: 'none' }}
                                onChange={e => { if (e.target.files?.[0]) { const file = e.target.files[0]; const n = [...form.colors]; n[i] = { ...n[i], imageFile: file, image_url: URL.createObjectURL(file) }; setForm(f => ({ ...f, colors: n })); } }}/>
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                              <input value={c.color_name} onChange={e => { const n = [...form.colors]; n[i] = { ...n[i], color_name: e.target.value }; setForm(f => ({ ...f, colors: n })); }} placeholder="e.g. Midnight Blue"
                                style={{ ...inp, padding: '9px 12px', fontSize: 12 }} onFocus={focusInp} onBlur={blurInp}/>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <input type="color" value={c.hex_code} onChange={e => { const n = [...form.colors]; n[i] = { ...n[i], hex_code: e.target.value }; setForm(f => ({ ...f, colors: n })); }}
                                  style={{ width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${T.border}`, cursor: 'pointer', padding: 2, background: 'rgba(12,7,3,0.8)' }}/>
                                <span style={{ fontSize: 11, fontFamily: 'monospace', color: T.textMuted }}>{c.hex_code}</span>
                              </div>
                            </div>
                            <button onClick={() => removeColor(i)} style={{ width: 28, height: 28, borderRadius: 8, background: `${T.danger}15`, color: T.danger, border: `1px solid ${T.danger}30`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-start' }}>
                              <X size={12}/>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>

                {/* Modal Footer */}
                <div style={{
                  padding: '20px 28px 24px', borderTop: '1px solid rgba(212,175,55,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12,
                }}>
                  <button onClick={() => !saving && setShowModal(false)} disabled={saving} style={{
                    padding: '11px 22px', borderRadius: 999, background: 'transparent',
                    color: T.textMuted, fontWeight: 700, fontSize: 13,
                    border: `1px solid ${T.border}`, cursor: 'pointer',
                  }}>
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '11px 28px', borderRadius: 999,
                    background: saving ? T.textMuted : `linear-gradient(135deg, ${T.gold}, ${T.lightGold})`,
                    color: T.bgDark, fontWeight: 800, fontSize: 13, border: 'none',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: saving ? 'none' : `0 4px 20px ${T.gold}50`,
                    transition: 'all 0.2s',
                  }}>
                    {saving ? (
                      <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', animation: 'adminSpin 0.8s linear infinite' }}/> Saving…</>
                    ) : editingId ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// ORDERS TAB
// ══════════════════════════════════════════════════════════════
function OrdersTab() {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, profiles(name,email), order_items(*, products(name))')
        .order('created_at', { ascending: false });
      if (error) {
        const { data: fb } = await supabase.from('orders').select('*, order_items(*, products(name))').order('created_at', { ascending: false });
        return fb || [];
      }
      return data || [];
    },
  });

  const getCustomerName = (o: any) => o.address?.name || o.profiles?.name || 'Customer';

  const filtered = orders.filter((o: any) => {
    const name = getCustomerName(o).toLowerCase();
    const q = search.toLowerCase();
    const matchSearch = q === '' || name.includes(q);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const updateStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    toast.success('Status updated');
    qc.invalidateQueries({ queryKey: ['admin-orders'] });
    qc.invalidateQueries({ queryKey: ['admin-stats'] });
  };

  const statusCounts = {
    pending:   orders.filter((o: any) => o.status === 'pending').length,
    shipped:   orders.filter((o: any) => o.status === 'shipped').length,
    delivered: orders.filter((o: any) => o.status === 'delivered').length,
  };

  const STATUS_TABS = [
    { value: 'all',       label: 'All',       count: orders.length },
    { value: 'pending',   label: 'Pending',   count: statusCounts.pending },
    { value: 'packed',    label: 'Packed',    count: orders.filter((o: any) => o.status === 'packed').length },
    { value: 'shipped',   label: 'Shipped',   count: statusCounts.shipped },
    { value: 'delivered', label: 'Delivered', count: statusCounts.delivered },
    { value: 'cancelled', label: 'Cancelled', count: orders.filter((o: any) => o.status === 'cancelled').length },
  ];

  const MINI_STATS = [
    { label: 'Total Orders',  value: orders.length,              icon: ShoppingBag, color: T.gold },
    { label: 'Pending',       value: statusCounts.pending,        icon: Clock,       color: T.warning },
    { label: 'Shipped',       value: statusCounts.shipped,        icon: Truck,       color: T.blue },
    { label: 'Delivered',     value: statusCounts.delivered,      icon: CheckCircle, color: T.success },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Mini stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {MINI_STATS.map(s => (
          <GlassCard key={s.label} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${s.color}30`, flexShrink: 0 }}>
              <s.icon size={18} color={s.color}/>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.accentGold, fontFamily: "'Space Grotesk', monospace" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>{s.label}</div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Filter bar */}
      <GlassCard style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 380 }}>
            <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.textMuted }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer name…"
              style={{ ...inp, paddingLeft: 42 }} onFocus={focusInp} onBlur={blurInp}/>
          </div>
          {/* Status tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STATUS_TABS.map(tab => (
              <button key={tab.value} onClick={() => setStatusFilter(tab.value)} style={{
                padding: '7px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${statusFilter === tab.value ? T.gold : T.border}`,
                background: statusFilter === tab.value ? `${T.gold}18` : 'transparent',
                color: statusFilter === tab.value ? T.gold : T.textMuted,
                transition: 'all 0.2s',
              }}>
                {tab.label} <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.7 }}>({tab.count})</span>
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Orders */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(3)].map((_, i) => <Skeleton key={i} h={120} r={20}/>)}
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard style={{ padding: '80px 0', textAlign: 'center' }}>
          <ShoppingBag size={40} color={T.gold} style={{ margin: '0 auto 16px', display: 'block' }}/>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrim }}>No orders found</div>
        </GlassCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((order: any, idx: number) => {
            const orderNum = orders.length - orders.indexOf(order) + 100;
            const accentColor = { pending: T.gold, packed: T.teal, shipped: T.blue, delivered: T.success, cancelled: T.danger }[order.status as string] || T.textMuted;
            const customerName = getCustomerName(order);
            const isExp = expandedId === order.id;

            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                <GlassCard style={{ overflow: 'hidden', borderLeft: `4px solid ${accentColor}50`, transition: 'border-color 0.2s' }}>
                  <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'auto 1fr auto auto auto auto auto', gap: 20, alignItems: 'center' }}>
                    {/* Order # */}
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Order</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: T.gold, fontFamily: "'Space Grotesk', monospace" }}>#{orderNum}</div>
                    </div>

                    {/* Customer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                        background: `linear-gradient(135deg, ${T.gold}, ${T.lightGold})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: T.bgDark, fontWeight: 800, fontSize: 15,
                      }}>
                        {customerName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customerName}</div>
                        <div style={{ fontSize: 11, color: T.textMuted }}>{order.profiles?.email || order.address?.phone || ''}</div>
                      </div>
                    </div>

                    {/* Amount */}
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Amount</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: T.accentGold, fontFamily: "'Space Grotesk', monospace" }}>₹{order.total_amount?.toLocaleString('en-IN')}</div>
                    </div>

                    {/* Items */}
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Items</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrim }}>{order.order_items?.length || 0}</div>
                    </div>

                    {/* Status dropdown */}
                    <div style={{ position: 'relative' }}>
                      <select value={order.status} onChange={e => updateStatus(order.id, e.target.value)} style={{
                        fontSize: 12, fontWeight: 700, padding: '8px 32px 8px 12px',
                        borderRadius: 999, border: `1.5px solid ${accentColor}40`, outline: 'none',
                        cursor: 'pointer', background: `${accentColor}15`, color: accentColor,
                        appearance: 'none', fontFamily: "'Inter', sans-serif",
                      }}>
                        {ORDER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                      <ChevronDown size={11} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: accentColor, pointerEvents: 'none' }}/>
                    </div>

                    {/* Date */}
                    <div style={{ fontSize: 12, color: T.textMuted, whiteSpace: 'nowrap' }}>
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>

                    {/* Expand */}
                    <button onClick={() => setExpandedId(isExp ? null : order.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                      borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      border: `1px solid ${isExp ? T.gold : T.border}`,
                      background: isExp ? `${T.gold}15` : 'transparent',
                      color: isExp ? T.gold : T.textMuted, flexShrink: 0, transition: 'all 0.2s',
                    }}>
                      <Eye size={13}/>{isExp ? 'Hide' : 'Details'}
                    </button>
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExp && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        style={{ borderTop: `1px solid ${T.border}`, overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', background: 'rgba(15,10,6,0.4)' }}>
                          {/* Order items */}
                          <div style={{ fontSize: 9, fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>Order Items</div>
                          {(order.order_items || []).length === 0 ? (
                            <div style={{ fontSize: 13, color: T.textMuted, padding: '8px 0' }}>No items data available</div>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, marginBottom: 16 }}>
                              {(order.order_items || []).map((item: any) => (
                                <div key={item.id} style={{
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                                  padding: '12px 16px', background: T.glass, border: `1px solid ${T.border}`, borderRadius: 14,
                                }}>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrim }}>{item.products?.name || 'Product'}</div>
                                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>
                                      {[item.color_name, item.size && `Size ${item.size}`, `Qty ${item.quantity}`].filter(Boolean).join(' · ')}
                                    </div>
                                  </div>
                                  <div style={{ fontSize: 14, fontWeight: 800, color: T.accentGold, fontFamily: "'Space Grotesk', monospace", flexShrink: 0 }}>
                                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Address */}
                          {order.address && (
                            <div style={{ padding: '14px 16px', background: T.glass, border: `1px solid ${T.border}`, borderRadius: 14 }}>
                              <div style={{ fontSize: 9, fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8 }}>Delivery Address</div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrim }}>{order.address.name} · {order.address.phone}</div>
                              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>
                                {order.address.line1}, {order.address.city}, {order.address.state} — {order.address.pincode}
                              </div>
                            </div>
                          )}
                          {/* Status timeline */}
                          <div style={{ marginTop: 16 }}>
                            <div style={{ fontSize: 9, fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>Order Timeline</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                              {['pending', 'packed', 'shipped', 'delivered'].map((step, i, arr) => {
                                const stepIdx = ['pending', 'packed', 'shipped', 'delivered'].indexOf(order.status);
                                const done = i <= stepIdx && order.status !== 'cancelled';
                                return (
                                  <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < arr.length - 1 ? 1 : undefined }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                      <div style={{
                                        width: 28, height: 28, borderRadius: '50%',
                                        background: done ? `linear-gradient(135deg, ${T.gold}, ${T.lightGold})` : 'rgba(30,18,9,0.8)',
                                        border: `2px solid ${done ? T.gold : T.border}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: done ? `0 0 10px ${T.gold}40` : 'none',
                                        transition: 'all 0.3s',
                                      }}>
                                        {done && <CheckCircle size={13} color={T.bgDark}/>}
                                      </div>
                                      <span style={{ fontSize: 9, color: done ? T.gold : T.textMuted, textTransform: 'capitalize', whiteSpace: 'nowrap', fontWeight: done ? 700 : 400 }}>{ORDER_STATUSES.find(s => s.value === step)?.label || step}</span>
                                    </div>
                                    {i < arr.length - 1 && (
                                      <div style={{ flex: 1, height: 2, background: done && i < stepIdx ? `linear-gradient(90deg, ${T.gold}, ${T.lightGold})` : T.border, margin: '0 4px', marginBottom: 20, transition: 'background 0.3s' }}/>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// CUSTOMERS TAB
// ══════════════════════════════════════════════════════════════
function CustomersTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'customer'>('all');

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*, orders(id, total_amount, address)')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const getDisplayName = (c: any) => {
    const addressName = (c.orders || []).map((o: any) => o.address?.name).find((n: string) => n && n.length > 1);
    return addressName || c.name || 'Customer';
  };
  const getPhone = (c: any) => {
    const addressPhone = (c.orders || []).map((o: any) => o.address?.phone).find((p: string) => p && p.length > 5);
    return addressPhone || c.phone || '—';
  };

  const makeAdmin = async (id: string, name: string, isCurrentlyAdmin: boolean) => {
    const newRole = isCurrentlyAdmin ? 'customer' : 'admin';
    const msg = isCurrentlyAdmin
      ? `Remove ${name} as Admin? They will lose dashboard access.`
      : `Make ${name} an Admin? They will have full dashboard access.`;
    if (!confirm(msg)) return;
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id);
    if (error) toast.error('Failed to update role');
    else {
      toast.success(isCurrentlyAdmin ? `${name} is no longer Admin.` : `${name} is now Admin!`);
      qc.invalidateQueries({ queryKey: ['admin-customers'] });
    }
  };

  const admins    = customers.filter((c: any) => c.role === 'admin');
  const regular   = customers.filter((c: any) => c.role !== 'admin');

  const filtered = customers.filter((c: any) => {
    const display = getDisplayName(c).toLowerCase();
    const q = search.toLowerCase();
    const matchSearch = q === '' || display.includes(q) || (c.name || '').toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || (roleFilter === 'admin' ? c.role === 'admin' : c.role !== 'admin');
    return matchSearch && matchRole;
  });

  const ROLE_PILLS = [
    { value: 'all'      as const, label: 'All Users',   count: customers.length },
    { value: 'admin'    as const, label: 'Admins',       count: admins.length },
    { value: 'customer' as const, label: 'Customers',    count: regular.length },
  ];

  const USER_MINI_STATS = [
    { label: 'Total Users',    value: customers.length, icon: Users,  color: T.gold },
    { label: 'Admins',         value: admins.length,    icon: Crown,  color: T.warning },
    { label: 'Customers',      value: regular.length,   icon: Users,  color: T.teal },
    { label: 'Active Today',   value: Math.min(customers.length, 1), icon: TrendingUp, color: T.success },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Mini stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {USER_MINI_STATS.map(s => (
          <GlassCard key={s.label} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${s.color}30`, flexShrink: 0 }}>
              <s.icon size={18} color={s.color}/>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.accentGold, fontFamily: "'Space Grotesk', monospace" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>{s.label}</div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Filter bar */}
      <GlassCard style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 360 }}>
            <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.textMuted }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
              style={{ ...inp, paddingLeft: 42 }} onFocus={focusInp} onBlur={blurInp}/>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {ROLE_PILLS.map(pill => (
              <button key={pill.value} onClick={() => setRoleFilter(pill.value)} style={{
                padding: '7px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${roleFilter === pill.value ? T.gold : T.border}`,
                background: roleFilter === pill.value ? `${T.gold}18` : 'transparent',
                color: roleFilter === pill.value ? T.gold : T.textMuted, transition: 'all 0.2s',
              }}>
                {pill.label} ({pill.count})
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Users table */}
      <GlassCard style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(4)].map((_, i) => <Skeleton key={i} h={60} r={12}/>)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <Users size={40} color={T.gold} style={{ margin: '0 auto 16px', display: 'block' }}/>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrim }}>No users found</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(15,10,6,0.6)' }}>
                  {['User', 'Phone', 'Total Spent', 'Orders', 'Loyalty', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '12px 20px', textAlign: 'left',
                      fontSize: 9, fontWeight: 800, color: T.textMuted,
                      textTransform: 'uppercase', letterSpacing: '0.14em',
                      fontVariant: 'small-caps', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c: any, idx: number) => {
                  const totalSpent = (c.orders || []).reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
                  const displayName = getDisplayName(c);
                  const isAdmin = c.role === 'admin';
                  // Gradient based on index
                  const avatarColors = [`linear-gradient(135deg, ${T.gold}, ${T.lightGold})`, `linear-gradient(135deg, ${T.teal}, #2ea89e)`, `linear-gradient(135deg, ${T.purple}, #7d3a9e)`, `linear-gradient(135deg, ${T.blue}, #2573b8)`];
                  return (
                    <tr key={c.id}
                      style={{ borderBottom: `1px solid ${T.border}30`, transition: 'all 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = `${T.gold}04`}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: avatarColors[idx % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.bgDark, fontWeight: 800, fontSize: 14 }}>
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrim }}>{displayName}</div>
                              {isAdmin && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: `${T.gold}20`, color: T.gold, border: `1px solid ${T.gold}40` }}>
                                  <Crown size={8}/> ADMIN
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 10, color: T.textMuted }}>{c.email || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: 12, color: T.textMuted }}>{getPhone(c)}</td>
                      <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 800, color: totalSpent > 0 ? T.accentGold : T.textMuted, fontFamily: "'Space Grotesk', monospace" }}>
                        {totalSpent > 0 ? `₹${totalSpent.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: T.textPrim }}>{c.orders?.length || 0}</span>
                        <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 4 }}>orders</span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: T.warning }}>
                          <Star size={12} fill="currentColor"/>{c.loyalty_points || 0} pts
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: 12, color: T.textMuted, whiteSpace: 'nowrap' }}>
                        {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <button onClick={() => makeAdmin(c.id, displayName, isAdmin)} style={{
                          padding: '7px 14px', borderRadius: 999, fontWeight: 700, fontSize: 11,
                          border: `1px solid ${isAdmin ? T.danger : T.gold}40`,
                          background: 'transparent',
                          color: isAdmin ? T.danger : T.gold,
                          cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                        }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = isAdmin ? `${T.danger}18` : `${T.gold}18`; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                          {isAdmin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
