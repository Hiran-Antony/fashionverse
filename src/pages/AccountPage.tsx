import { Navigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWishlistStore } from '../store/wishlistStore';
import {
  User, Package, LogOut, Settings, Edit3,
  ChevronRight, CheckCircle2, Truck, Package as PackageIcon, Home, X,
  Star, Heart, Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { ORDER_STATUSES } from '../utils/constants';
import toast from 'react-hot-toast';

type Tab = 'profile' | 'orders' | 'wishlist';

const ORDER_STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <PackageIcon size={15} />,
  packed: <CheckCircle2 size={15} />,
  shipped: <Truck size={15} />,
  delivered: <Home size={15} />,
  cancelled: <X size={15} />,
};

export default function AccountPage() {
  const { user, profile, signOut, isLoading } = useAuthStore();
  const location = useLocation();
  const pathParts = location.pathname.split('/');
  const activeTab: Tab = (pathParts[pathParts.length - 1] as Tab) || 'profile';
  
  // Default to profile if it's just /account
  const currentTab = ['orders', 'wishlist'].includes(activeTab) ? activeTab : 'profile';

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
    { id: 'profile', label: 'Profile', icon: <User size={17} /> },
    { id: 'orders', label: 'My Orders', icon: <Package size={17} /> },
    { id: 'wishlist', label: 'Wishlist', icon: <Heart size={17} /> },
  ];

  return (
    <div className="container py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div
            className="rounded-2xl p-6 text-center mb-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold"
              style={{
                background: 'var(--gradient-primary)',
                color: 'white',
              }}
            >
              {profile?.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <h2 className="font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
              {profile?.name || 'Customer'}
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {user.email}
            </p>
            {profile?.role === 'admin' && (
              <span
                className="inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{ background: 'var(--purple-100)', color: 'var(--purple-700)' }}
              >
                Admin
              </span>
            )}
            <div
              className="mt-4 pt-4 flex items-center justify-center gap-2 text-xs font-medium"
              style={{
                borderTop: '1px solid var(--border-color)',
                color: 'var(--gold-600)',
              }}
            >
              <Star size={12} fill="currentColor" />
              {profile?.loyalty_points || 0} loyalty points
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const toPath = tab.id === 'profile' ? '/account' : `/account/${tab.id}`;
              const isActive = currentTab === tab.id;
              
              return (
                <Link
                  key={tab.id}
                  to={toPath}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left no-underline"
                  style={{
                    background: isActive ? 'var(--purple-100)' : 'transparent',
                    color: isActive ? 'var(--purple-700)' : 'var(--text-secondary)',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                  {isActive && (
                    <ChevronRight size={14} className="ml-auto" />
                  )}
                </Link>
              );
            })}

            {profile?.role === 'admin' && (
              <Link
                to="/admin-dashboard"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium no-underline"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-secondary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <Settings size={17} /> Admin Dashboard
              </Link>
            )}

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
              style={{
                color: 'var(--error)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#fee2e2')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <LogOut size={17} /> Sign Out
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl p-6 lg:p-8 border min-h-[500px]" style={{ borderColor: 'var(--border-color)' }}>
          <AnimatePresence mode="wait">
            {currentTab === 'profile' && <ProfileTab key="profile" />}
            {currentTab === 'orders' && <OrdersTab key="orders" userId={user.id} />}
            {currentTab === 'wishlist' && <WishlistTab key="wishlist" />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────
function ProfileTab() {
  const { user, profile } = useAuthStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
        Profile Details
      </h2>

      <div
        className="rounded-2xl p-6 mb-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { label: 'Full Name', value: profile?.name || '—', icon: <User size={15} /> },
            { label: 'Email', value: user?.email || '—', icon: <Settings size={15} /> },
            { label: 'Phone', value: profile?.phone || 'Not added', icon: <Settings size={15} /> },
            { label: 'Account Type', value: profile?.role === 'admin' ? 'Administrator' : 'Customer', icon: <Star size={15} /> },
          ].map((field) => (
            <div key={field.label}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
                {field.label}
              </p>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {field.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
          <button
            className="btn btn-outline btn-sm flex items-center gap-2"
            onClick={() => toast('Profile editing coming soon!')}
          >
            <Edit3 size={14} /> Edit Profile
          </button>
        </div>
      </div>

      {/* Loyalty Points */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: 'var(--gradient-hero)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-30%',
            right: '-10%',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'rgba(245,158,11,0.2)',
            filter: 'blur(40px)',
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} color="#fbbf24" />
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Loyalty Rewards
            </p>
          </div>
          <p className="text-4xl font-bold text-white mb-1">
            {profile?.loyalty_points || 0}
          </p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            points available · Earn 1 point per ₹10 spent
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────
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
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
        My Orders
      </h2>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5 skeleton h-24" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <Package size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>No orders yet</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Your order history will appear here once you make your first purchase.
          </p>
          <Link to="/products" className="btn btn-primary no-underline">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => {
            const statusInfo = ORDER_STATUSES.find((s) => s.value === order.status);
            return (
              <div
                key={order.id}
                className="rounded-2xl p-5"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-mono font-bold" style={{ color: 'var(--purple-600)' }}>
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{
                        background: (statusInfo?.color || '#6b7280') + '20',
                        color: statusInfo?.color || 'var(--text-muted)',
                      }}
                    >
                      {ORDER_STATUS_ICONS[order.status]}
                      {statusInfo?.label || order.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {order.order_items?.length || 0} item(s)
                    </p>
                    <p className="font-bold text-base mt-0.5" style={{ color: 'var(--text-primary)' }}>
                      ₹{order.total_amount?.toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs capitalize px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                    {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ─── Wishlist Tab ─────────────────────────────────────────────
function WishlistTab() {
  const { items } = useWishlistStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
        My Wishlist
      </h2>
      {items.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <Heart size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>No saved items</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Heart a product to save it here.</p>
          <Link to="/products" className="btn btn-primary no-underline">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {items.map((id) => (
            <Link
              key={id}
              to={`/product/${id}`}
              className="no-underline rounded-xl p-4 flex items-center gap-3 transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--purple-300)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#fee2e2', color: '#ef4444' }}>
                <Heart size={16} fill="currentColor" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  Saved Product
                </p>
                <p className="text-[10px] font-mono mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                  {id.slice(0, 12)}...
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  );
}
