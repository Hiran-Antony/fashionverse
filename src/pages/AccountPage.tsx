import React, { useState, useEffect } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWishlistStore } from '../store/wishlistStore';
import {
  User, Package, LogOut, Edit3,
  CheckCircle2, Truck, Package as PackageIcon, Home, X,
  Heart, Sparkles, Clock, CreditCard, MapPin, ShoppingBag,
  Circle, Shield, Calendar, ArrowRight, Plus, Trash2,
  Save, Phone, Mail, ChevronRight, Star, XCircle,
  Eye, EyeOff, AlertTriangle, Download, MessageCircle,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/product/ProductCard';
import InvoiceTemplate from '../components/InvoiceTemplate';
import { useInvoice } from '../hooks/useInvoice';
import type { Product, SavedAddress } from '../types';
import toast from 'react-hot-toast';

type Tab = 'profile' | 'orders' | 'wishlist';

const STATUS_STEPS = ['pending', 'confirmed', 'packed', 'ready_to_ship', 'out_for_delivery', 'delivered'];

const STATUS_META: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  pending:          { icon: <Clock size={14} />,        label: 'Order Placed',     color: '#E8B84B', bg: 'rgba(201,151,58,0.15)' },
  confirmed:        { icon: <CheckCircle2 size={14}/>,  label: 'Confirmed',        color: '#D4A935', bg: 'rgba(201,151,58,0.15)' },
  packed:           { icon: <PackageIcon size={14} />,  label: 'Being Packed',     color: '#D4A935', bg: 'rgba(201,151,58,0.15)' },
  ready_to_ship:    { icon: <Package size={14} />,      label: 'Ready to Ship',    color: '#C9973A', bg: 'rgba(201,151,58,0.15)' },
  out_for_delivery: { icon: <Truck size={14} />,        label: 'Out for Delivery', color: '#C9973A', bg: 'rgba(201,151,58,0.15)' },
  shipped:          { icon: <Truck size={14} />,        label: 'Shipped',          color: '#C9973A', bg: 'rgba(201,151,58,0.15)' },
  delivered:        { icon: <Home size={14} />,         label: 'Delivered',        color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  cancelled:        { icon: <XCircle size={14} />,      label: 'Cancelled',        color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
};

/* ─── Delivery PIN Card ───────────────────────────────────── */
function DeliveryPinCard({ pin }: { pin: string }) {
  const [revealed, setRevealed] = useState(false);
  const digits = revealed ? pin.split('') : ['•', '•', '•', '•'];
  return (
    <div style={{
      background: 'rgba(201,151,58,0.06)',
      border: '1px solid rgba(201,151,58,0.2)',
      borderRadius: '12px',
      padding: '16px 24px',
      margin: '0 0 0 0',
    }}>
      <p style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(201,151,58,0.6)', fontWeight: 700, marginBottom: '12px' }}>Delivery PIN</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {digits.map((d, i) => (
            <div key={i} style={{
              width: '44px', height: '50px',
              background: 'rgba(10,6,2,0.6)',
              border: '1px solid rgba(201,151,58,0.3)',
              borderRadius: '8px',
              fontSize: '22px', fontWeight: 700,
              color: '#E8B84B',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              letterSpacing: revealed ? '0' : '0.2em',
            }}>{d}</div>
          ))}
        </div>
        <button
          onClick={() => setRevealed(r => !r)}
          style={{ background: 'none', border: '1px solid rgba(201,151,58,0.25)', borderRadius: '8px', color: '#C9973A', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, transition: 'all 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,151,58,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
          {revealed ? 'Hide' : 'Reveal PIN'}
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '10px' }}>
        <AlertTriangle size={11} style={{ color: 'rgba(201,151,58,0.5)', flexShrink: 0 }} />
        <p style={{ fontSize: '11px', color: 'rgba(245,237,212,0.35)' }}>Share this PIN only with your FashionVerse delivery partner</p>
      </div>
    </div>
  );
}

const TAB_META: Record<Tab, { title: string; subtitle: string }> = {
  profile:  { title: 'My Profile',   subtitle: 'Manage your personal information and delivery addresses' },
  orders:   { title: 'My Orders',    subtitle: 'Track your deliveries and view past orders' },
  wishlist: { title: 'My Wishlist',  subtitle: 'Items you have saved for later' },
};

/* ─── Floating Label Input ──────────────────────────────────── */
function FloatingInput({
  label, value, onChange, type = 'text', placeholder, icon: Icon,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; icon?: React.ComponentType<any>;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;
  return (
    <div className="relative" style={{ marginBottom: '20px' }}>
      <div
        className="relative flex items-center w-full rounded-xl transition-all duration-200"
        style={{
          border: `2px solid ${focused ? '#C9973A' : '#e5e7eb'}`,
          background: focused ? 'rgba(201,151,58,0.12)' : 'var(--bg-secondary)',
        }}
      >
        {Icon && (
          <div className="absolute left-4 flex items-center justify-center" style={{ color: focused ? '#C9973A' : 'var(--text-muted)' }}>
            <Icon size={16} />
          </div>
        )}
        <div className="w-full" style={{ paddingLeft: Icon ? '44px' : '16px', paddingRight: '16px', paddingTop: '22px', paddingBottom: '8px' }}>
          <label
            style={{
              position: 'absolute',
              left: Icon ? '44px' : '16px',
              top: active ? '8px' : '50%',
              transform: active ? 'none' : 'translateY(-50%)',
              fontSize: active ? '10px' : '14px',
              fontWeight: active ? 700 : 500,
              color: focused ? '#C9973A' : 'var(--text-muted)',
              textTransform: active ? 'uppercase' : 'none',
              letterSpacing: active ? '0.06em' : 'normal',
              transition: 'all 0.15s ease',
              pointerEvents: 'none',
            }}
          >
            {label}
          </label>
          <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={active ? placeholder : ''}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              lineHeight: '1.4',
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Edit Profile Modal ─────────────────────────────────────── */
function EditProfileModal({ onClose }: { onClose: () => void }) {
  const { profile, updateProfile } = useAuthStore();
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name cannot be empty'); return; }
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim() || null });
      toast.success('Profile updated successfully!');
      onClose();
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,10,30,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 24 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{
          width: '100%', maxWidth: '440px',
          background: 'var(--bg-card)',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 32px 64px rgba(201,151,58,0.2), 0 8px 24px rgba(0,0,0,0.12)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '48px', height: '48px', borderRadius: '14px', marginBottom: '12px',
              background: 'linear-gradient(135deg,#C9973A,#C9973A)',
              boxShadow: '0 8px 20px rgba(201,151,58,0.35)',
            }}>
              <User size={22} color="white" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px', }}>
              Edit Profile
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Update your personal information</p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'var(--bg-tertiary)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Fields */}
        <FloatingInput label="Full Name" value={name} onChange={setName} placeholder="Enter your full name" icon={User} />
        <FloatingInput label="Phone Number" value={phone} onChange={setPhone} type="tel" placeholder="+91 99999 99999" icon={Phone} />

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '13px', borderRadius: '12px',
              border: '2px solid #e5e7eb', background: 'var(--bg-card)',
              fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#d1d5db'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1, padding: '13px', borderRadius: '12px',
              background: 'linear-gradient(135deg,#C9973A,#C9973A)',
              border: 'none', fontSize: '14px', fontWeight: 700,
              color: 'white', cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.8 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: '0 4px 14px rgba(201,151,58,0.4)',
              transition: 'all 0.15s',
            }}
          >
            {saving ? <div className="spinner" style={{ width: '16px', height: '16px' }} /> : <Save size={15} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Address Form Modal ─────────────────────────────────────── */
function AddressFormModal({ existing, onClose, onSave }: {
  existing?: SavedAddress; onClose: () => void; onSave: (addr: SavedAddress) => void;
}) {
  const [label, setLabel] = useState(existing?.label || 'Home');
  const [name, setName] = useState(existing?.name || '');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [line1, setLine1] = useState(existing?.line1 || '');
  const [line2, setLine2] = useState(existing?.line2 || '');
  const [city, setCity] = useState(existing?.city || '');
  const [state, setState] = useState(existing?.state || '');
  const [pincode, setPincode] = useState(existing?.pincode || '');
  const [isDefault, setIsDefault] = useState(existing?.is_default || false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, []);

  const handleSave = () => {
    if (!name || !phone || !line1 || !city || !state || !pincode) {
      toast.error('Please fill all required fields'); return;
    }
    onSave({ id: existing?.id || crypto.randomUUID(), label, name, phone, line1, line2, city, state, pincode, is_default: isDefault });
  };

  const LABELS = ['Home', 'Work', 'Other'];

  return (
    <div
      className="new-address-overlay"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15,10,30,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="new-address-modal"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.93, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 24 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* Header */}
        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <div className="modal-icon-wrap">
            <MapPin className="modal-icon" />
          </div>
          <h2 className="modal-title">{existing ? 'Edit Address' : 'New Address'}</h2>
          <p className="modal-subtitle">{existing ? 'Update your delivery address' : 'Add a new delivery address'}</p>
          
          <button className="modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Label Pills */}
        <div>
          <p className="address-type-label">Address Type</p>
          <div className="address-type-pills">
            {LABELS.map(l => (
              <button
                key={l}
                onClick={() => setLabel(l)}
                className={`address-type-pill ${label === l ? 'active' : ''}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Fields */}
        <div className="address-input-group">
          <div className="address-input-wrap">
            <User className="address-input-icon" />
            <input className="address-input" value={name} onChange={e => setName(e.target.value)} placeholder="Recipient's full name" />
          </div>
        </div>
        
        <div className="address-input-group">
          <div className="address-input-wrap">
            <Phone className="address-input-icon" />
            <input className="address-input" value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="10-digit mobile number" />
          </div>
        </div>

        <div className="address-input-group">
          <div className="address-input-wrap">
            <MapPin className="address-input-icon" />
            <input className="address-input" value={line1} onChange={e => setLine1(e.target.value)} placeholder="House / Flat, Building, Street" />
          </div>
        </div>

        <div className="address-input-group">
          <div className="address-input-wrap">
            <input className="address-input no-icon" value={line2} onChange={e => setLine2(e.target.value)} placeholder="Area, Landmark (Optional)" />
          </div>
        </div>

        <div className="address-input-row">
          <div className="address-input-wrap">
            <input className="address-input no-icon" value={city} onChange={e => setCity(e.target.value)} placeholder="City (e.g. Chennai)" />
          </div>
          <div className="address-input-wrap">
            <input className="address-input no-icon" value={pincode} onChange={e => setPincode(e.target.value)} placeholder="Pincode (6-digits)" />
          </div>
        </div>
        
        <div className="address-input-group">
          <div className="address-input-wrap">
            <input className="address-input no-icon" value={state} onChange={e => setState(e.target.value)} placeholder="State (e.g. Tamil Nadu)" />
          </div>
        </div>

        {/* Default toggle */}
        <div className="default-address-wrap" onClick={() => setIsDefault(!isDefault)} style={{ cursor: 'pointer' }}>
          <div className="default-address-text">
            <h4>Set as default address</h4>
            <p>Use this address by default at checkout</p>
          </div>
          <div className={`toggle-switch ${isDefault ? 'on' : ''}`}>
            <div className="toggle-knob" />
          </div>
        </div>

        {/* Actions */}
        <div className="modal-buttons">
          <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="modal-save-btn" onClick={handleSave}>
            <Save size={15} /> Save Address
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main AccountPage ───────────────────────────────────────── */
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
  if (!user) return <Navigate to="/auth" replace />;

  const handleSignOut = async () => { await signOut(); toast('Signed out successfully'); };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile',  label: 'Profile',   icon: <User size={17} /> },
    { id: 'orders',   label: 'My Orders', icon: <Package size={17} /> },
    { id: 'wishlist', label: 'Wishlist',  icon: <Heart size={17} /> },
  ];

  const initial = profile?.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?';
  const meta = TAB_META[currentTab];

  return (
    <div className="account-page">
      <div className="account-shell">
        <div className="account-layout">

          {/* ── Sidebar ───────────────────────── */}
          <aside className="account-sidebar">
            {/* Avatar card */}
            <div className="account-profile-card hidden lg:block mb-4">
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 14px',
                background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '28px', fontWeight: 800, color: 'white',
                overflow: 'hidden', boxShadow: '0 8px 24px rgba(201,151,58,0.35)',
              }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initial}
              </div>
              <p style={{ fontSize: '15px', fontWeight: 800, textAlign: 'center', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.name || 'Customer'}
              </p>
              <p style={{ fontSize: '12px', textAlign: 'center', color: 'var(--text-muted)', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </p>
              {profile?.role === 'admin' && (
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 12px', borderRadius: '999px', background: 'rgba(201,151,58,0.15)', color: '#D4A935' }}>
                    Admin
                  </span>
                </div>
              )}
            </div>

            <nav className="flex overflow-x-auto lg:flex-col gap-2 pb-2 mb-4 lg:mb-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style>{`.account-sidebar nav::-webkit-scrollbar { display: none; }`}</style>
              {tabs.map(tab => {
                const active = currentTab === tab.id;
                return (
                  <Link key={tab.id} to={`/account/${tab.id}`} className="account-nav-link no-underline whitespace-nowrap" data-active={active}>
                    <span className="shrink-0">{tab.icon}</span>
                    <span className="lg:flex-1">{tab.label}</span>
                    {active && <ChevronRight size={14} className="hidden lg:block" />}
                  </Link>
                );
              })}
              <div className="lg:hidden" style={{ width: '1px', background: 'var(--border-color)', margin: '0 4px', flexShrink: 0 }} />
              <button onClick={handleSignOut} className="account-nav-link lg:!hidden whitespace-nowrap" style={{ color: '#ef4444' }}>
                <LogOut size={17} /> Sign Out
              </button>
            </nav>

            <div className="hidden lg:block" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button onClick={handleSignOut} className="account-nav-link w-full text-left" style={{ color: '#ef4444' }}>
                <LogOut size={17} /> Sign Out
              </button>
            </div>
          </aside>

          {/* ── Main Content ───────────────────── */}
          <div className="account-main">
            <header style={{ marginBottom: '28px' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C9973A', marginBottom: '6px' }}>My Account</p>
              <h1 className="account-page-title">{meta.title}</h1>
              <p className="account-page-subtitle">{meta.subtitle}</p>
            </header>

            <AnimatePresence mode="wait">
              {currentTab === 'profile'  && <ProfileTab  key="profile" />}
              {currentTab === 'orders'   && <OrdersTab   key="orders" userId={user.id} />}
              {currentTab === 'wishlist' && <WishlistTab key="wishlist" />}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ─── Profile Tab ───────────────────────────────────────────── */
function ProfileTab() {
  const { user, profile, updateProfile } = useAuthStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | undefined>();

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '—';

  const addresses: SavedAddress[] = profile?.addresses || [];

  const saveAddresses = async (list: SavedAddress[]) => {
    try { await updateProfile({ addresses: list }); toast.success('Saved!'); }
    catch { toast.error('Failed to save address.'); }
  };

  const handleAddressSave = async (addr: SavedAddress) => {
    let list = [...addresses];
    if (addr.is_default) list = list.map(a => ({ ...a, is_default: false }));
    const idx = list.findIndex(a => a.id === addr.id);
    if (idx >= 0) list[idx] = addr; else list.push(addr);
    await saveAddresses(list);
    setShowAddressForm(false); setEditingAddress(undefined);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this address?')) return;
    await saveAddresses(addresses.filter(a => a.id !== id));
  };

  const handleSetDefault = async (id: string) => {
    await saveAddresses(addresses.map(a => ({ ...a, is_default: a.id === id })));
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    borderRadius: '20px',
    padding: '28px',
    border: '1px solid rgba(201,151,58,0.15)',
    boxShadow: '0 2px 12px rgba(201,151,58,0.07)',
    marginBottom: '20px',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

      {/* ── Personal Info Card ─── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg,#C9973A,#C9973A)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(201,151,58,0.3)' }}>
              <User size={18} color="white" />
            </div>
            <div>
              <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' , }}>Personal Information</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Your basic profile details</p>
            </div>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px',
              borderRadius: '10px', border: '1.5px solid #e5e7eb', background: 'var(--bg-card)',
              fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9973A'; e.currentTarget.style.color = '#C9973A'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <Edit3 size={13} /> Edit
          </button>
        </div>

        <div className="account-info-grid">
          {[
            { label: 'Full Name',    value: profile?.name || '—',                                  icon: User,    iconBg: '#f5f3ff', iconColor: '#C9973A' },
            { label: 'Email Address', value: user?.email || '—',                                   icon: Mail,    iconBg: 'rgba(201,151,58,0.15)', iconColor: '#C9973A' },
            { label: 'Phone Number', value: profile?.phone || 'Not added yet',                     icon: Phone,   iconBg: '#f0fdf4', iconColor: '#10b981' },
            { label: 'Account Type', value: profile?.role === 'admin' ? 'Administrator' : 'Customer', icon: Shield, iconBg: 'rgba(232,184,75,0.15)', iconColor: '#E8B84B' },
          ].map(f => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', borderRadius: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--bg-tertiary)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: f.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <f.icon size={16} style={{ color: f.iconColor }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '5px' }}>{f.label}</p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-word' }}>{f.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats Row ─── */}
      <div className="account-stats-grid">
        {/* Loyalty */}
        <div style={{
          borderRadius: '20px', padding: '22px 20px', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg,#C9973A,#A07828)',
          boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
        }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <Sparkles size={18} color="#fbbf24" style={{ marginBottom: '10px' }} />
          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.65)', marginBottom: '6px' }}>Points</p>
          <p style={{ fontSize: '32px', fontWeight: 900, color: 'white', lineHeight: 1 }}>{profile?.loyalty_points || 0}</p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '6px' }}>1 pt per ₹10</p>
        </div>
        {/* Member Since */}
        <div style={{ borderRadius: '20px', padding: '22px 20px', background: 'var(--bg-card)', border: '1px solid rgba(201,151,58,0.15)', boxShadow: '0 2px 12px rgba(201,151,58,0.06)' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <Calendar size={18} style={{ color: '#C9973A' }} />
          </div>
          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>Member Since</p>
          <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>{memberSince}</p>
        </div>
        {/* Status */}
        <div style={{ borderRadius: '20px', padding: '22px 20px', background: 'var(--bg-card)', border: '1px solid rgba(201,151,58,0.15)', boxShadow: '0 2px 12px rgba(201,151,58,0.06)' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <Shield size={18} style={{ color: '#10b981' }} />
          </div>
          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>Status</p>
          <p style={{ fontSize: '14px', fontWeight: 800, color: '#10b981' }}>✓ Verified</p>
        </div>
      </div>

      {/* ── Saved Addresses ─── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
              <MapPin size={18} color="white" />
            </div>
            <div>
              <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>Saved Addresses</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Manage your delivery locations</p>
            </div>
          </div>
          <button
            onClick={() => { setEditingAddress(undefined); setShowAddressForm(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px',
              borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg,#C9973A,#C9973A)',
              fontSize: '13px', fontWeight: 700, color: 'white', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(201,151,58,0.3)', transition: 'all 0.15s',
            }}
          >
            <Plus size={13} /> Add New
          </button>
        </div>

        {addresses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', borderRadius: '16px', background: 'var(--bg-secondary)', border: '2px dashed #e5e7eb' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MapPin size={26} style={{ color: '#C9973A' }} />
            </div>
            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>No addresses saved</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Add an address to speed up checkout</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
            {addresses.map(addr => (
              <div
                key={addr.id}
                style={{
                  borderRadius: '16px', padding: '18px',
                  background: addr.is_default ? 'linear-gradient(135deg, rgba(201,151,58,0.15), rgba(201,151,58,0.03))' : 'var(--bg-secondary)',
                  border: `1px solid ${addr.is_default ? 'rgba(201,151,58,0.5)' : 'var(--glass-border)'}`,
                  position: 'relative', transition: 'all 0.2s',
                }}
              >
                {addr.is_default && (
                  <span style={{
                    position: 'absolute', top: '12px', right: '12px',
                    fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                    padding: '3px 9px', borderRadius: '999px',
                    background: '#C9973A', color: 'white',
                  }}>Default</span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <MapPin size={13} style={{ color: '#C9973A' }} />
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#C9973A' }}>{addr.label}</span>
                </div>
                <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '3px' }}>{addr.name}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '3px' }}>{addr.phone}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  {[addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                  <button onClick={() => { setEditingAddress(addr); setShowAddressForm(true); }}
                    style={{ fontSize: '12px', fontWeight: 700, color: '#C9973A', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Edit3 size={11} /> Edit
                  </button>
                  {!addr.is_default && (
                    <button onClick={() => handleSetDefault(addr.id)}
                      style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={11} /> Default
                    </button>
                  )}
                  <button onClick={() => handleDelete(addr.id)}
                    style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showEditModal && <EditProfileModal onClose={() => setShowEditModal(false)} />}
        {showAddressForm && (
          <AddressFormModal
            existing={editingAddress}
            onClose={() => { setShowAddressForm(false); setEditingAddress(undefined); }}
            onSave={handleAddressSave}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Orders Tab ───────────────────────────────────────────── */
function OrdersTab({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [cancelModal, setCancelModal] = useState<{ id: string; amount: number } | null>(null);
  const [reviewModal, setReviewModal] = useState<{ productId: string; productName: string } | null>(null);
  const { invoiceOrder, downloadInvoice, sendWhatsAppBill } = useInvoice();
  const { user, profile } = useAuthStore();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders').select('*, order_items(*, products(*, product_colors(*)))').eq('user_id', userId).neq('status', 'cancelled')
        .order('created_at', { ascending: false }).limit(30);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000,
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ orderId, reason, comment }: { orderId: string; reason: string; comment: string }) => {
      const { error } = await supabase.from('orders').update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancellation_category: comment || null,
        cancelled_at: new Date().toISOString(),
      }).eq('id', orderId).eq('user_id', userId).in('status', ['pending', 'packed']);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-orders', userId] }); toast.success('Order cancelled successfully'); },
    onError: () => toast.error('Could not cancel. Please try again.'),
  });

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      {/* Cancellation Modal */}
      <AnimatePresence>
        {cancelModal && (
          <CancellationModal
            orderId={cancelModal.id}
            amount={cancelModal.amount}
            onClose={() => setCancelModal(null)}
            onConfirm={(reason, comment) => {
              cancelMutation.mutate({ orderId: cancelModal.id, reason, comment });
              setCancelModal(null);
            }}
          />
        )}
        {reviewModal && (
          <WriteReviewModal
            productId={reviewModal.productId}
            productName={reviewModal.productName}
            onClose={() => setReviewModal(null)}
          />
        )}
      </AnimatePresence>

      {!isLoading && orders.length > 0 && (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', marginTop: '-8px' }}>
          {orders.length} order{orders.length !== 1 ? 's' : ''} ·{' '}
          <Link to="/products" style={{ color: '#E8B84B', fontWeight: 700, textDecoration: 'none' }}>
            Continue Shopping <ArrowRight size={11} style={{ display: 'inline' }} />
          </Link>
        </p>
      )}

      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[...Array(2)].map((_, i) => <div key={i} className="rounded-2xl skeleton w-full" style={{ height: 200 }} />)}
        </div>
      )}

      {!isLoading && orders.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center', borderRadius: '20px', background: 'var(--bg-card)', border: '1px solid rgba(201,151,58,0.15)' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg,#C9973A,#C9973A)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 12px 28px rgba(201,151,58,0.35)' }}>
            <ShoppingBag size={36} color="white" strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', }}>No orders yet</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px', maxWidth: '320px' }}>Your order history will appear here once you place your first order.</p>
          <Link to="/products" className="btn btn-primary no-underline">Start Shopping</Link>
        </div>
      )}

      {!isLoading && orders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orders.map((order: any, idx: number) => (
            <OrderCard key={order.id} order={order} index={idx}
              onCancel={() => setCancelModal({ id: order.id, amount: order.total_amount })}
              onWriteReview={(productId, productName) => setReviewModal({ productId, productName })}
              onDownloadInvoice={() => downloadInvoice({ ...order, profiles: { name: profile?.name, email: user?.email } })}
              onWhatsApp={() => sendWhatsAppBill({ ...order, profiles: { name: profile?.name, email: user?.email } })} />
          ))}
        </div>
      )}

      {/* Hidden Invoice Template — only visible when printing */}
      <InvoiceTemplate order={invoiceOrder} />
    </motion.div>
  );
}

/* ─── Cancellation Modal ────────────────────────────────────── */
const CANCEL_REASONS = [
  'Changed my mind',
  'Found a better price elsewhere',
  'Ordered by mistake',
  'Delivery time is too long',
  'Item no longer needed',
  'Incorrect item ordered',
  'Payment issue',
  'Other',
];

function CancellationModal({ orderId, amount, onClose, onConfirm }: {
  orderId: string;
  amount: number;
  onClose: () => void;
  onConfirm: (reason: string, comment: string) => void;
}) {
  const [selected, setSelected] = useState('');
  const [comment, setComment] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', damping: 26, stiffness: 260 }}
        style={{ background: 'rgba(18,10,6,0.98)', border: '1px solid rgba(201,151,58,0.25)', borderRadius: '20px', padding: '32px', maxWidth: '480px', width: '100%' }}
      >
        {/* Icon */}
        <div style={{ width: 56, height: 56, background: 'rgba(220,60,60,0.1)', border: '1px solid rgba(220,60,60,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <AlertTriangle size={24} color="#f87171" />
        </div>
        <h3 style={{ fontSize: '24px', color: '#F5EDD4', textAlign: 'center', margin: '0 0 8px' }}>Cancel Order?</h3>
        <p style={{ fontSize: '13px', color: 'rgba(245,237,212,0.45)', textAlign: 'center', marginBottom: '24px' }}>
          Order #{orderId.slice(0, 8).toUpperCase()} · ₹{amount?.toLocaleString('en-IN')}
        </p>

        {/* Reason label */}
        <p style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(201,151,58,0.6)', textTransform: 'uppercase', marginBottom: '12px' }}>Why are you cancelling?</p>

        {/* Reason pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '4px' }}>
          {CANCEL_REASONS.map((reason) => (
            <button key={reason} onClick={() => setSelected(reason)} style={{
              padding: '9px 16px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: selected === reason ? '1px solid #C9973A' : '1px solid rgba(201,151,58,0.18)',
              background: selected === reason ? 'rgba(201,151,58,0.12)' : 'transparent',
              color: selected === reason ? '#E8B84B' : 'rgba(245,237,212,0.55)',
              fontWeight: selected === reason ? 500 : 400,
            }}>
              {reason}
            </button>
          ))}
        </div>

        {/* Comment textarea */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 200))}
          placeholder="Tell us more (optional)..."
          rows={3}
          style={{
            width: '100%', boxSizing: 'border-box', marginTop: '12px',
            background: 'rgba(26,15,8,0.7)', border: '1px solid rgba(201,151,58,0.18)',
            borderRadius: '10px', color: '#F5EDD4', fontSize: '13px',
            padding: '12px 14px', resize: 'none', outline: 'none',
          }}
        />
        <p style={{ fontSize: '11px', color: 'rgba(245,237,212,0.3)', textAlign: 'right', marginTop: '4px' }}>{comment.length}/200</p>

        {/* Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px' }}>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid rgba(201,151,58,0.25)', borderRadius: '10px',
            color: 'rgba(245,237,212,0.7)', padding: '13px', fontSize: '13px', cursor: 'pointer', }}>
            Keep Order
          </button>
          <button
            disabled={!selected}
            onClick={() => selected && onConfirm(selected, comment)}
            style={{
              background: 'rgba(220,60,60,0.15)', border: '1px solid rgba(220,60,60,0.3)', borderRadius: '10px',
              color: '#f87171', padding: '13px', fontSize: '13px', fontWeight: 600, cursor: selected ? 'pointer' : 'not-allowed',
              opacity: selected ? 1 : 0.4, transition: 'all 0.2s ease',
            }}
          >
            Confirm Cancellation
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function OrderCard({ order, index, onCancel, onWriteReview, onDownloadInvoice, onWhatsApp }: {
  order: any;
  index: number;
  onCancel: () => void;
  onWriteReview: (productId: string, productName: string) => void;
  onDownloadInvoice?: () => void;
  onWhatsApp?: () => void;
}) {
  const meta = STATUS_META[order.status] || STATUS_META.pending;
  const stepIdx = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const delivery = order.shipping_address || order.address || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}
      style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid rgba(201,151,58,0.15)', boxShadow: '0 2px 12px rgba(201,151,58,0.07)', overflow: 'hidden' }}
    >
      {/* Header */}
      <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--bg-tertiary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div>
            <p style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>Order ID</p>
            <p style={{ fontSize: '16px', fontWeight: 900, color: '#E8B84B' }}>#{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div style={{ width: '1px', height: '40px', background: 'var(--bg-tertiary)' }} />
          <div>
            <p style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>Order Date</p>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {(order.status === 'pending' || order.status === 'packed') && (
            <button onClick={onCancel}
              style={{
                padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1.5px solid rgba(239,68,68,0.3)', cursor: 'pointer',
              }}>
              Cancel
            </button>
          )}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 700,
            background: meta.bg, color: meta.color, border: `1.5px solid ${meta.color}`,
          }}>
            {meta.icon} {meta.label}
          </span>
        </div>
      </div>

      {/* Progress */}
      {!isCancelled && (
        <div style={{ padding: '24px', borderBottom: '1px solid var(--bg-tertiary)', background: 'var(--bg-secondary)' }}>
          {/* Desktop Tracker */}
          <div className="order-progress-desktop" style={{ alignItems: 'center', width: '100%' }}>
            {STATUS_STEPS.map((step, i) => {
              const s = STATUS_META[step] || STATUS_META.pending;
              const done = i <= stepIdx;
              const active = i === stepIdx;
              const isLast = i === STATUS_STEPS.length - 1;
              return (
                <div key={step} style={{ flex: 1, display: 'flex', alignItems: 'center', minWidth: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flexShrink: 0, minWidth: '56px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: done ? (active ? meta.color : '#10b981') : '#e5e7eb',
                      color: done ? 'white' : 'var(--text-muted)',
                      boxShadow: active ? `0 0 0 5px ${meta.color}25` : 'none',
                      transform: active ? 'scale(1.15)' : 'scale(1)',
                      transition: 'all 0.3s',
                    }}>
                      {done && !active ? <CheckCircle2 size={17} strokeWidth={2.5} /> : done && active ? <span style={{ display: 'flex' }}>{s.icon}</span> : <Circle size={17} strokeWidth={2} />}
                    </div>
                    <p style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center', color: done ? 'var(--text-primary)' : 'var(--text-muted)', lineHeight: '1.3', maxWidth: '56px' }}>{s.label}</p>
                  </div>
                  {!isLast && <div style={{ flex: 1, height: '3px', margin: '0 4px', borderRadius: '999px', background: i < stepIdx ? '#10b981' : '#e5e7eb', marginBottom: '20px' }} />}
                </div>
              );
            })}
          </div>
          
          {/* Mobile Tracker */}
          <div className="order-progress-mobile">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', color: meta.color }}>{meta.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{meta.label}</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Step {Math.max(1, stepIdx + 1)} of 6</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${((Math.max(0, stepIdx) + 1) / STATUS_STEPS.length) * 100}%`, background: meta.color === '#10B981' ? '#10b981' : '#C9973A', height: '100%', borderRadius: '3px', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      {order.order_items?.length > 0 && (
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--bg-tertiary)' }}>
          <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Order Items ({order.order_items.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {order.order_items.map((item: any) => {
              const product = item.products;
              const colorImg = product?.product_colors?.find((c: any) => c.color_name === item.color_name)?.image_url;
              const imageUrl = colorImg || product?.product_colors?.[0]?.image_url || product?.image_url;
              
              return (
              <div key={item.id} className="order-item-card">
                
                {/* Product Image */}
                <div className="order-item-image-wrap">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.products?.name || item.product_name || 'Product'}
                      loading="lazy"
                    />
                  ) : (
                    <div className="image-fallback">
                      <ShoppingBag size={24} />
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="order-item-details">
                  <span className="order-item-brand">
                    {item.products?.brand || 'FashionVerse'}
                  </span>
                  <p className="order-item-name">
                    {item.products?.name || item.product_name || 'Product'}
                  </p>
                  <div className="order-item-meta">
                    {item.size && (
                      <span>Size {item.size}</span>
                    )}
                    {item.color_name && (
                      <>
                        <span>·</span>
                        <span>{item.color_name}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>Qty {item.quantity}</span>
                    {item.products?.category && (
                      <>
                        <span>·</span>
                        <span>{item.products.category}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Price and Actions */}
                <div className="order-item-price" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <div style={{ textAlign: 'right' }}>
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    <div className="order-item-price-unit">
                      ₹{item.price.toLocaleString('en-IN')} each
                    </div>
                  </div>
                  
                  {['delivered', 'shipped', 'out_for_delivery'].includes(order.status) && (
                    <button
                      onClick={() => onWriteReview(item.product_id, item.products?.name || item.product_name)}
                      style={{
                        padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                        background: 'transparent', border: '1px solid #C9973A', color: '#C9973A',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                        whiteSpace: 'nowrap', marginTop: 'auto'
                      }}
                    >
                      <Star size={12} /> Write Review
                    </button>
                  )}
                </div>

              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delivery PIN Card — shown for active non-delivered orders */}
      {!isCancelled && order.status !== 'delivered' && order.delivery_pin && (
        <div style={{ padding: '0 24px 16px' }}>
          <DeliveryPinCard pin={order.delivery_pin} />
        </div>
      )}

        <div className="order-card-footer">
          {delivery && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={14} style={{ color: '#C9973A', flexShrink: 0 }} />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                {typeof delivery === 'object' ? [delivery.line1, delivery.city, delivery.state].filter(Boolean).join(', ') : delivery}
              </p>
            </div>
          )}
          <div className="order-card-footer-actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CreditCard size={14} style={{ color: 'var(--text-muted)' }} />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online'}</p>
            </div>
            {onDownloadInvoice && (
              <button className="btn-invoice-small" onClick={onDownloadInvoice}>
                <Download size={11} /> Invoice
              </button>
            )}
            {onWhatsApp && (
              <button className="btn-whatsapp-small" onClick={onWhatsApp}>
                <MessageCircle size={11} /> WhatsApp
              </button>
            )}
            <div style={{ padding: '6px 16px', borderRadius: '999px', background: 'linear-gradient(135deg,#C9973A,#C9973A)' }}>
              <p style={{ fontSize: '14px', fontWeight: 900, color: 'white' }}>₹{order.total_amount?.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
    </motion.div>
  );
}

/* ─── Wishlist Tab ─────────────────────────────────────────── */
function WishlistTab() {
  const { items } = useWishlistStore();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['wishlist-products', items],
    queryFn: async () => {
      if (items.length === 0) return [];
      const { data, error } = await supabase.from('products').select('*, product_colors(*), product_sizes(*)').in('id', items);
      if (error) throw error;
      return (data || []) as Product[];
    },
    enabled: items.length > 0,
    staleTime: 60 * 1000,
  });

  if (items.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center', borderRadius: '20px', background: 'var(--bg-card)', border: '1px solid rgba(201,151,58,0.15)' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <Heart size={36} style={{ color: '#ef4444' }} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', }}>No saved items</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px', maxWidth: '300px' }}>Heart a product while browsing to save it here.</p>
          <Link to="/products" className="btn btn-primary no-underline">Browse Products</Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', marginTop: '-8px' }}>
        {items.length} saved {items.length === 1 ? 'item' : 'items'}
      </p>
      {isLoading ? (
        <div className="product-grid">{[...Array(Math.min(items.length, 4))].map((_, i) => <div key={i} className="rounded-2xl skeleton" style={{ aspectRatio: '3/4' }} />)}</div>
      ) : products.length > 0 ? (
        <div className="product-grid">{products.map(p => <ProductCard key={p.id} product={p} />)}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {items.map(id => (
            <Link key={id} to={`/product/${id}`} className="no-underline rounded-2xl p-4 flex flex-col gap-3 transition-all" style={{ background: 'var(--bg-card)', border: '1px solid rgba(201,151,58,0.15)' }}>
              <div className="w-full aspect-square rounded-xl flex items-center justify-center" style={{ background: '#f5f3ff' }}><Heart size={28} style={{ color: '#ef4444' }} /></div>
              <span className="text-xs font-semibold" style={{ color: '#C9973A' }}>View →</span>
            </Link>
          ))}
        </div>
      )}
      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <Link to="/products" className="btn btn-outline inline-flex items-center gap-2 no-underline"><ShoppingBag size={16} /> Continue Shopping</Link>
      </div>
    </motion.div>
  );
}

/* ─── Write Review Modal ─────────────────────────────────────── */
function WriteReviewModal({ productId, productName, onClose }: { productId: string; productName: string; onClose: () => void }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkReview() {
      if (!user) return;
      const { data } = await supabase.from('reviews').select('id').eq('product_id', productId).eq('user_id', user.id).single();
      if (data) setHasReviewed(true);
      setLoading(false);
    }
    checkReview();
  }, [productId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    
    const { error } = await supabase.from('reviews').insert({
      product_id: productId,
      user_id: user.id,
      rating,
      comment,
    });
      
    setIsSubmitting(false);
    
    if (error) {
      toast.error('Failed to submit review');
      console.error(error);
    } else {
      toast.success('Review submitted successfully!');
      queryClient.invalidateQueries();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,10,30,0.6)', backdropFilter: 'blur(8px)', paddingTop: '60px' }} onClick={(e) => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ width: '100%', maxWidth: '440px', background: 'var(--bg-card)', borderRadius: '24px', padding: '32px', border: '1px solid var(--border-color)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>Write a Review</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20}/></button>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
          How was your experience with <strong>{productName}</strong>?
        </p>

        {hasReviewed ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: '12px', textAlign: 'center' }}>
            <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>You've already reviewed this item.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Thank you for your feedback!</p>
          </motion.div>
        ) : (
          <motion.form initial={{ opacity: 0 }} animate={{ opacity: loading ? 0 : 1 }} transition={{ duration: 0.2 }} onSubmit={handleSubmit} style={{ pointerEvents: loading ? 'none' : 'auto' }}>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>Tap to Rate</p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '16px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setRating(star)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}>
                    <Star size={32} fill={star <= rating && rating > 0 ? '#C9973A' : 'none'} color={star <= rating && rating > 0 ? '#C9973A' : 'var(--text-muted)'} />
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>Add a comment (Optional)</p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you like or dislike?"
                rows={4}
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', color: 'var(--text-primary)', fontSize: '14px', resize: 'vertical' }}
              />
            </div>

            <button type="submit" disabled={isSubmitting || rating === 0} className="btn w-full" style={{ background: rating > 0 ? 'linear-gradient(135deg, #C9973A, #E8B84B)' : 'var(--bg-tertiary)', color: rating > 0 ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: '999px', padding: '14px', fontWeight: 700, fontSize: '16px', opacity: (isSubmitting || rating === 0) ? 0.7 : 1, cursor: (isSubmitting || rating === 0) ? 'not-allowed' : 'pointer' }}>
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
}
