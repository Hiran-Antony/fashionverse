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
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/product/ProductCard';
import type { Product, SavedAddress } from '../types';
import toast from 'react-hot-toast';

type Tab = 'profile' | 'orders' | 'wishlist';

const STATUS_STEPS = ['pending', 'packed', 'shipped', 'delivered'];

const STATUS_META: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  pending:   { icon: <Clock size={14} />,        label: 'Order Placed', color: '#E8B84B', bg: 'rgba(201,151,58,0.15)' },
  packed:    { icon: <PackageIcon size={14} />,  label: 'Packed',       color: '#D4A935', bg: 'rgba(201,151,58,0.15)' },
  shipped:   { icon: <Truck size={14} />,        label: 'Shipped',      color: '#C9973A', bg: 'rgba(201,151,58,0.15)' },
  delivered: { icon: <Home size={14} />,         label: 'Delivered',    color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  cancelled: { icon: <XCircle size={14} />,      label: 'Cancelled',    color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
};

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
  type?: string; placeholder?: string; icon?: React.ElementType;
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
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px', fontFamily: 'var(--font-display)' }}>
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
            <div className="account-profile-card mb-4">
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

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {tabs.map(tab => {
                const active = currentTab === tab.id;
                return (
                  <Link key={tab.id} to={`/account/${tab.id}`} className="account-nav-link no-underline" data-active={active}>
                    <span className="shrink-0">{tab.icon}</span>
                    <span style={{ flex: 1 }}>{tab.label}</span>
                    {active && <ChevronRight size={14} />}
                  </Link>
                );
              })}
            </nav>

            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
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
              <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' , fontFamily: 'var(--font-display)' }}>Personal Information</p>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
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
                  background: addr.is_default ? 'linear-gradient(135deg,rgba(201,151,58,0.12),#f3e8ff)' : 'var(--bg-secondary)',
                  border: `2px solid ${addr.is_default ? '#D4A935' : '#e5e7eb'}`,
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

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders').select('*, order_items(*)').eq('user_id', userId).neq('status', 'cancelled')
        .order('created_at', { ascending: false }).limit(30);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000,
  });

  const cancelMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase.from('orders').update({ status: 'cancelled' })
        .eq('id', orderId).eq('user_id', userId).in('status', ['pending', 'packed']);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-orders', userId] }); toast.success('Order cancelled.'); },
    onError: () => toast.error('Could not cancel. Please try again.'),
  });

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
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
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>No orders yet</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px', maxWidth: '320px' }}>Your order history will appear here once you place your first order.</p>
          <Link to="/products" className="btn btn-primary no-underline">Start Shopping</Link>
        </div>
      )}

      {!isLoading && orders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orders.map((order: any, idx: number) => (
            <OrderCard key={order.id} order={order} index={idx}
              onCancel={() => { if (window.confirm('Cancel this order?')) cancelMutation.mutate(order.id); }} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function OrderCard({ order, index, onCancel }: { order: any; index: number; onCancel: () => void }) {
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
            <p style={{ fontSize: '16px', fontWeight: 900, fontFamily: 'monospace', color: '#E8B84B' }}>#{order.id.slice(0, 8).toUpperCase()}</p>
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
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {STATUS_STEPS.map((step, i) => {
              const s = STATUS_META[step];
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
        </div>
      )}

      {/* Items */}
      {order.order_items?.length > 0 && (
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--bg-tertiary)' }}>
          <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Order Items ({order.order_items.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {order.order_items.map((item: any) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', borderRadius: '12px', background: 'var(--bg-secondary)' }}>
                <div style={{ width: '52px', height: '60px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {item.image_url ? <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <PackageIcon size={20} style={{ color: '#D4A935' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product_name || 'Product'}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {item.size && `Size ${item.size}`}{item.size && item.color_name && ' · '}{item.color_name} · Qty {item.quantity}
                  </p>
                </div>
                <p style={{ fontSize: '15px', fontWeight: 900, color: '#E8B84B', flexShrink: 0 }}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        {delivery && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={14} style={{ color: '#C9973A', flexShrink: 0 }} />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
              {typeof delivery === 'object' ? [delivery.line1, delivery.city, delivery.state].filter(Boolean).join(', ') : delivery}
            </p>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CreditCard size={14} style={{ color: 'var(--text-muted)' }} />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online'}</p>
          </div>
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
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>No saved items</h3>
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
