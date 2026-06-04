import React from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWishlistStore } from '../store/wishlistStore';
import {
  User, Package, LogOut, Settings, Edit3,
  ChevronRight, CheckCircle2, Truck, Package as PackageIcon, Home, X,
  Star, Heart, Sparkles, Clock, CreditCard, MapPin, ShoppingBag,
  Circle, Shield, Calendar, ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/product/ProductCard';
import type { Product } from '../types';
import toast from 'react-hot-toast';

type Tab = 'profile' | 'orders' | 'wishlist';

const STATUS_STEPS = ['pending', 'packed', 'shipped', 'delivered'];

const STATUS_META: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  pending:   { icon: <Clock size={14} />,        label: 'Order Placed', color: '#F59E0B', bg: '#FFFBEB' },
  packed:    { icon: <PackageIcon size={14} />,  label: 'Packed',       color: '#8B5CF6', bg: '#F5F3FF' },
  shipped:   { icon: <Truck size={14} />,        label: 'Shipped',      color: '#3B82F6', bg: '#EFF6FF' },
  delivered: { icon: <Home size={14} />,         label: 'Delivered',    color: '#10B981', bg: '#ECFDF5' },
  cancelled: { icon: <X size={14} />,            label: 'Cancelled',    color: '#EF4444', bg: '#FEF2F2' },
};

const TAB_META: Record<Tab, { title: string; subtitle: string }> = {
  profile:  { title: 'Profile Details', subtitle: 'Manage your personal information and rewards' },
  orders:   { title: 'My Orders',       subtitle: 'Track deliveries and view order history' },
  wishlist: { title: 'My Wishlist',     subtitle: 'Items you have saved for later' },
};

export default function AccountPage() {
  const { user, profile, signOut, isLoading } = useAuthStore();
  const location = useLocation();
  const pathParts = location.pathname.split('/');
  const activeTab: Tab = (pathParts[pathParts.length - 1] as Tab) || 'profile';
  const currentTab: Tab = (['orders', 'wishlist'] as Tab[]).includes(activeTab) ? activeTab : 'profile';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
    toast('Signed out successfully');
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile',  label: 'Profile',    icon: <User size={17} /> },
    { id: 'orders',   label: 'My Orders',  icon: <Package size={17} /> },
    { id: 'wishlist', label: 'Wishlist',   icon: <Heart size={17} /> },
  ];

  const displayName = profile?.name || 'Customer';
  const initial = profile?.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?';
  const meta = TAB_META[currentTab];

  return (
    <div className="account-page">
      <div className="account-shell">
        <div className="account-layout">

          {/* Sidebar */}
          <aside className="account-sidebar">
            <div className="account-profile-card mb-4">
              <div
                className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold"
                style={{ background: 'var(--gradient-primary)', color: 'white' }}
              >
                {initial}
              </div>
              <h2 className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                {displayName}
              </h2>
              <p className="text-sm truncate px-2" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
              {profile?.role === 'admin' && (
                <span
                  className="inline-block mt-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: 'var(--purple-100)', color: 'var(--purple-700)' }}
                >
                  Admin
                </span>
              )}
              <div
                className="mt-4 pt-4 flex items-center justify-center gap-2 text-sm font-semibold"
                style={{ borderTop: '1px solid var(--border-color)', color: 'var(--gold-600)' }}
              >
                <Star size={14} fill="currentColor" />
                {profile?.loyalty_points || 0} loyalty points
              </div>
            </div>

            <nav
              className="rounded-2xl p-2 space-y-1"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
            >
              {tabs.map((tab) => {
                const toPath = tab.id === 'profile' ? '/account' : `/account/${tab.id}`;
                const isActive = currentTab === tab.id;
                return (
                  <Link
                    key={tab.id}
                    to={toPath}
                    className={`account-nav-link ${isActive ? 'active' : ''}`}
                  >
                    {tab.icon}
                    {tab.label}
                    {isActive && <ChevronRight size={14} className="ml-auto" />}
                  </Link>
                );
              })}

              {profile?.role === 'admin' && (
                <Link to="/admin-dashboard" className="account-nav-link">
                  <Settings size={17} /> Admin Dashboard
                </Link>
              )}

              <button
                onClick={handleSignOut}
                className="account-nav-link w-full"
                style={{ color: 'var(--error)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#fee2e2')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <LogOut size={17} /> Sign Out
              </button>
            </nav>
          </aside>

          {/* Main content — flex-1 fills remaining width */}
          <div className="account-main">
            <div className="account-panel min-h-[520px]">
              <header className="mb-2">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2"
                  style={{ color: 'var(--purple-600)' }}
                >
                  My Account
                </p>
                <h1 className="account-page-title">{meta.title}</h1>
                <p className="account-page-subtitle">{meta.subtitle}</p>
              </header>

              <AnimatePresence mode="wait">
                {currentTab === 'profile'  && <ProfileTab  key="profile" />}
                {currentTab === 'orders'   && <OrdersTab   key="orders"  userId={user.id} />}
                {currentTab === 'wishlist' && <WishlistTab key="wishlist" />}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Profile Tab ───────────────────────────────────────────── */
function ProfileTab() {
  const { user, profile } = useAuthStore();
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-1 xl:grid-cols-3 gap-6"
    >
      <div className="xl:col-span-2 space-y-6">
        <div className="account-field-card">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
            {[
              { label: 'Full Name',    value: profile?.name || '—' },
              { label: 'Email',        value: user?.email || '—' },
              { label: 'Phone',        value: profile?.phone || 'Not added' },
              { label: 'Account Type', value: profile?.role === 'admin' ? 'Administrator' : 'Customer' },
            ].map((field) => (
              <div key={field.label}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  {field.label}
                </p>
                <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{field.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 flex flex-wrap gap-3" style={{ borderTop: '1px solid var(--border-color)' }}>
            <button
              className="btn btn-outline flex items-center gap-2"
              onClick={() => toast('Profile editing coming soon!')}
            >
              <Edit3 size={16} /> Edit Profile
            </button>
            <Link to="/products" className="btn btn-primary flex items-center gap-2 no-underline">
              <ShoppingBag size={16} /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="account-loyalty-card">
          <div
            className="absolute pointer-events-none"
            style={{ top: '-20%', right: '-15%', width: 160, height: 160, borderRadius: '50%', background: 'rgba(245,158,11,0.25)', filter: 'blur(40px)' }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} color="#fbbf24" />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Loyalty Rewards
              </p>
            </div>
            <p className="text-5xl font-bold text-white mb-2">{profile?.loyalty_points || 0}</p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
              points available
            </p>
            <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Earn 1 point for every ₹10 spent
            </p>
          </div>
        </div>

        <div className="account-stat-row">
          <div className="account-stat-chip">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--purple-100)' }}>
              <Calendar size={18} style={{ color: 'var(--purple-600)' }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Member Since</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{memberSince}</p>
            </div>
          </div>
          <div className="account-stat-chip">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--gold-100)' }}>
              <Shield size={18} style={{ color: 'var(--gold-600)' }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Account Status</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--success)' }}>Verified &amp; Active</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Orders Tab ────────────────────────────────────────────── */
function OrdersTab({ userId }: { userId: string }) {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      {!isLoading && orders.length > 0 && (
        <p className="text-sm mb-6 -mt-4" style={{ color: 'var(--text-muted)' }}>
          {orders.length} order{orders.length !== 1 ? 's' : ''} ·{' '}
          <Link to="/products" className="font-semibold no-underline" style={{ color: 'var(--purple-600)' }}>
            Continue Shopping <ArrowRight size={12} className="inline" />
          </Link>
        </p>
      )}

      {isLoading && (
        <div className="space-y-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-2xl skeleton w-full" style={{ height: 220 }} />
          ))}
        </div>
      )}

      {!isLoading && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl" style={{ background: 'var(--bg-secondary)' }}>
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
            style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow)' }}
          >
            <ShoppingBag size={40} color="white" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            No orders yet
          </h3>
          <p className="text-sm mb-8 max-w-md" style={{ color: 'var(--text-muted)' }}>
            Your order history will appear here once you place your first order.
          </p>
          <Link to="/products" className="btn btn-primary no-underline">Start Shopping</Link>
        </div>
      )}

      {!isLoading && orders.length > 0 && (
        <div className="space-y-6">
          {orders.map((order: any, idx: number) => (
            <OrderCard key={order.id} order={order} index={idx} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function getOrderAddress(order: any) {
  return order.shipping_address || order.address || null;
}

function OrderCard({ order, index }: { order: any; index: number }) {
  const meta = STATUS_META[order.status] || STATUS_META.pending;
  const stepIdx = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const delivery = getOrderAddress(order);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="account-order-card"
    >
      <div className="account-order-card-header">
        <div className="account-order-card-header-meta">
          <div>
            <p className="account-order-label">Order ID</p>
            <p className="text-lg font-black font-mono leading-tight" style={{ color: 'var(--purple-700)' }}>
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <div className="hidden sm:block w-px self-stretch min-h-[48px]" style={{ background: 'var(--border-color)' }} />
          <div>
            <p className="account-order-label">Order Date</p>
            <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
              {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        <span
          className="account-order-status-badge"
          style={{ background: meta.bg, color: meta.color, border: `2px solid ${meta.color}` }}
        >
          {meta.icon}
          {meta.label}
        </span>
      </div>

      <div className="account-order-card-body">
      {!isCancelled && (
        <div className="px-6 sm:px-8 py-8" style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center w-full">
            {STATUS_STEPS.map((step, i) => {
              const s = STATUS_META[step];
              const done = i <= stepIdx;
              const active = i === stepIdx;
              const isLast = i === STATUS_STEPS.length - 1;
              return (
                <div key={step} className="flex-1 flex items-center min-w-0">
                  <div className="flex flex-col items-center gap-2 relative z-10 shrink-0" style={{ minWidth: 64 }}>
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500"
                      style={{
                        background: done ? (active ? meta.color : 'var(--success)') : 'var(--gray-200)',
                        color: done ? 'white' : 'var(--gray-400)',
                        boxShadow: active ? `0 0 0 5px ${meta.color}22` : 'none',
                        transform: active ? 'scale(1.1)' : 'scale(1)',
                      }}
                    >
                      {done && !active ? (
                        <CheckCircle2 size={18} strokeWidth={2.5} />
                      ) : done && active ? (
                        <span className="flex items-center justify-center [&_svg]:w-[18px] [&_svg]:h-[18px]">{s.icon}</span>
                      ) : (
                        <Circle size={18} strokeWidth={2} />
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-center uppercase leading-tight" style={{ color: done ? 'var(--text-primary)' : 'var(--text-muted)', maxWidth: 72 }}>
                      {s.label}
                    </p>
                  </div>
                  {!isLast && (
                    <div
                      className="flex-1 h-1 mx-1 sm:mx-2 rounded-full min-w-[8px]"
                      style={{ background: i < stepIdx ? 'var(--success)' : 'var(--gray-200)' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {order.order_items && order.order_items.length > 0 && (
        <div className="px-6 sm:px-8 py-5" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>
            Order Items ({order.order_items.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {order.order_items.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-3 rounded-xl"
                style={{ background: 'var(--bg-secondary)' }}
              >
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                  style={{ background: 'white', border: '1px solid var(--border-color)' }}
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                  ) : (
                    <PackageIcon size={22} style={{ color: 'var(--purple-300)' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {item.product_name || 'Product'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {item.size && `Size ${item.size}`}
                    {item.size && item.color && ' · '}
                    {item.color}
                    {' · '}Qty {item.quantity}
                  </p>
                </div>
                <p className="text-base font-black shrink-0" style={{ color: 'var(--purple-700)' }}>
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`account-order-summary${delivery ? '' : ' account-order-summary--two'}`}>
        {delivery && (
          <div className="account-order-summary-item">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--purple-100)' }}>
              <MapPin size={16} style={{ color: 'var(--purple-600)' }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Delivery</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {typeof delivery === 'object'
                  ? [delivery.line1, delivery.city, delivery.state].filter(Boolean).join(', ') || 'On file'
                  : delivery}
              </p>
            </div>
          </div>
        )}
        <div className="account-order-summary-item">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--gold-100)' }}>
            <CreditCard size={16} style={{ color: 'var(--gold-600)' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Payment</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
            </p>
          </div>
        </div>
        <div className="account-order-summary-item account-order-summary-total">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Total Amount</p>
            <p
              className="text-2xl font-black"
              style={{
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              ₹{order.total_amount?.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>
      </div>
    </motion.div>
  );
}

/* ── Wishlist Tab ──────────────────────────────────────────── */
function WishlistTab() {
  const { items } = useWishlistStore();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['wishlist-products', items],
    queryFn: async () => {
      if (items.length === 0) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*, product_colors(*), product_sizes(*)')
        .in('id', items);
      if (error) throw error;
      return (data || []) as Product[];
    },
    enabled: items.length > 0,
    staleTime: 60 * 1000,
  });

  if (items.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <div
          className="flex flex-col items-center justify-center py-20 text-center rounded-2xl"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: '#fee2e2' }}>
            <Heart size={36} style={{ color: '#ef4444' }} />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            No saved items
          </h3>
          <p className="text-sm mb-8 max-w-sm" style={{ color: 'var(--text-muted)' }}>
            Heart a product while browsing to save it here for later.
          </p>
          <Link to="/products" className="btn btn-primary no-underline">Browse Products</Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <p className="text-sm mb-6 -mt-4" style={{ color: 'var(--text-muted)' }}>
        {items.length} saved {items.length === 1 ? 'item' : 'items'}
      </p>

      {isLoading ? (
        <div className="product-grid">
          {[...Array(Math.min(items.length, 4))].map((_, i) => (
            <div key={i} className="rounded-2xl skeleton" style={{ aspectRatio: '3/4' }} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((id) => (
            <Link
              key={id}
              to={`/product/${id}`}
              className="no-underline rounded-xl p-4 flex flex-col gap-3 transition-all"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
            >
              <div className="w-full aspect-square rounded-lg flex items-center justify-center" style={{ background: 'white' }}>
                <Heart size={28} style={{ color: '#ef4444' }} />
              </div>
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>Saved Product</p>
              <span className="text-xs font-medium" style={{ color: 'var(--purple-600)' }}>View →</span>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10 text-center">
        <Link to="/products" className="btn btn-outline inline-flex items-center gap-2 no-underline">
          <ShoppingBag size={16} /> Continue Shopping
        </Link>
      </div>
    </motion.div>
  );
}
