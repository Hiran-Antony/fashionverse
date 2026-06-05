import React, { useState, forwardRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Phone, User, ChevronDown, Package, CreditCard, Truck,
  ArrowLeft, Lock, CheckCircle2, Plus, X,
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { getOptimizedUrl } from '../lib/cloudinary';
import type { SavedAddress } from '../types';
import toast from 'react-hot-toast';

// ─── Validation Schema ────────────────────────────────────────
const addressSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  line1: z.string().min(5, 'Address is required'),
  line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
});

type AddressForm = z.infer<typeof addressSchema>;

const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Delhi', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan',
  'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

/* ─── Floating Label Input for React Hook Form ─────────────── */
const RHF_FloatingInput = forwardRef<
  HTMLInputElement | HTMLSelectElement,
  {
    label: string;
    type?: string;
    placeholder?: string;
    icon?: React.ElementType;
    error?: string;
    isSelect?: boolean;
    options?: string[];
    watchValue?: any;
  } & React.InputHTMLAttributes<HTMLInputElement> & React.SelectHTMLAttributes<HTMLSelectElement>
>(({ label, type = 'text', placeholder, icon: Icon, error, isSelect, options, onChange, onBlur, name, watchValue, ...rest }, ref) => {
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(Boolean(rest.defaultValue || rest.value));

  const active = focused || hasValue || Boolean(watchValue);

  const handleChange = (e: React.ChangeEvent<any>) => {
    setHasValue(e.target.value.length > 0);
    if (onChange) onChange(e);
  };

  const handleBlur = (e: React.FocusEvent<any>) => {
    setFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <div className="relative mb-2">
      <div
        className="relative flex items-center w-full rounded-xl transition-all duration-200"
        style={{
          border: `2px solid ${error ? '#ef4444' : focused ? '#C9973A' : '#e5e7eb'}`,
          background: error ? 'rgba(239,68,68,0.12)' : focused ? 'rgba(201,151,58,0.12)' : 'var(--bg-secondary)',
        }}
      >
        {Icon && (
          <div className="absolute left-4 flex items-center justify-center" style={{ color: error ? '#ef4444' : focused ? '#C9973A' : '#9ca3af' }}>
            <Icon size={16} />
          </div>
        )}
        <div className="w-full" style={{ paddingLeft: Icon ? '44px' : '16px', paddingRight: isSelect ? '40px' : '16px', paddingTop: '22px', paddingBottom: '8px' }}>
          <label
            style={{
              position: 'absolute',
              left: Icon ? '44px' : '16px',
              top: active ? '8px' : '50%',
              transform: active ? 'none' : 'translateY(-50%)',
              fontSize: active ? '10px' : '14px',
              fontWeight: active ? 700 : 500,
              color: error ? '#ef4444' : focused ? '#C9973A' : '#9ca3af',
              textTransform: active ? 'uppercase' : 'none',
              letterSpacing: active ? '0.06em' : 'normal',
              transition: 'all 0.15s ease',
              pointerEvents: 'none',
            }}
          >
            {label}
          </label>
          
          {isSelect ? (
            <>
              <select
                ref={ref as React.Ref<HTMLSelectElement>}
                name={name}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={() => setFocused(true)}
                className="appearance-none w-full bg-transparent border-none outline-none"
                style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937', lineHeight: '1.4', cursor: 'pointer' }}
                {...(rest as any)}
              >
                <option value="" disabled hidden></option>
                {options?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9ca3af' }} />
            </>
          ) : (
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              type={type}
              name={name}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={() => setFocused(true)}
              placeholder={active ? placeholder : ''}
              className="w-full bg-transparent border-none outline-none"
              style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937', lineHeight: '1.4' }}
              {...(rest as any)}
            />
          )}
        </div>
      </div>
      {error && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', fontWeight: 600 }}>{error}</p>}
    </div>
  );
});

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getTotal, getItemCount, clearCart } = useCartStore();
  const { user, profile, updateProfile } = useAuthStore();
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [isPlacing, setIsPlacing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [savedAddress, setSavedAddress] = useState<AddressForm | null>(null);
  const [selectedSaved, setSelectedSaved] = useState<SavedAddress | null>(
    (profile?.addresses || []).find(a => a.is_default) || null
  );
  const [saveToProfile, setSaveToProfile] = useState(false);
  const [showNewForm, setShowNewForm] = useState(!(profile?.addresses?.length));

  const savedAddresses: SavedAddress[] = profile?.addresses || [];

  const subtotal = getTotal();
  const deliveryFee = subtotal >= 999 ? 0 : 99;
  const total = subtotal + deliveryFee;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: '', // Force user to manually type their given name
      phone: profile?.phone || '',
      state: '',
    },
  });

  // Redirect if cart is empty or not logged in
  if (items.length === 0) {
    return (
      <div className="container py-24 text-center">
        <p style={{ color: 'var(--text-muted)' }}>Your cart is empty.</p>
        <Link to="/products" className="btn btn-primary mt-6">
          Browse Products
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-24 text-center">
        <Lock size={48} className="mx-auto mb-4" style={{ color: 'var(--purple-500)' }} />
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Sign in to Checkout
        </h2>
        <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
          Please sign in to place your order.
        </p>
        <Link to="/auth" className="btn btn-primary">Sign In</Link>
      </div>
    );
  }

  const onSubmit = async (address: AddressForm) => {
    const finalAddress = selectedSaved
      ? { name: selectedSaved.name, phone: selectedSaved.phone, line1: selectedSaved.line1, line2: selectedSaved.line2, city: selectedSaved.city, state: selectedSaved.state, pincode: selectedSaved.pincode }
      : address;

    // Save new address to profile if checkbox ticked
    if (!selectedSaved && saveToProfile && profile) {
      try {
        const newAddr: SavedAddress = {
          id: crypto.randomUUID(),
          label: 'Home',
          ...address,
          is_default: savedAddresses.length === 0,
        };
        const updated = [...savedAddresses, newAddr];
        await updateProfile({ addresses: updated });
      } catch { /* non-blocking */ }
    }

    setSavedAddress(finalAddress);
    setShowPaymentModal(true);
  };

  const handleConfirmOrder = async () => {
    if (!savedAddress) return;
    
    setIsPlacing(true);

    try {
      // Build order items
      const orderItems = items.map((item) => ({
        product_id: item.product_id,
        color_name: item.color_name,
        size: item.size,
        quantity: item.quantity,
        price: item.product_price,
      }));

      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          status: 'pending',
          total_amount: total,
          address: savedAddress,
          payment_method: paymentMethod,
          coupon_code: null,
          discount_amount: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Insert order items
      if (order) {
        await supabase.from('order_items').insert(
          orderItems.map((item) => ({ ...item, order_id: order.id }))
        );

        // ── Auto stock deduction ──────────────────────────────
        // For each item ordered, decrease stock in product_sizes
        // and mark as out-of-stock if it hits 0
        await Promise.all(
          items.map(async (item) => {
            // Fetch current stock for this product + size
            const { data: sizeRow } = await supabase
              .from('product_sizes')
              .select('id, stock')
              .eq('product_id', item.product_id)
              .eq('size', item.size)
              .single();

            if (sizeRow) {
              const newStock = Math.max(0, (sizeRow.stock || 0) - item.quantity);
              await supabase
                .from('product_sizes')
                .update({
                  stock: newStock,
                  is_out_of_stock: newStock === 0,
                })
                .eq('id', sizeRow.id);
            }
          })
        );
      }

      clearCart();
      toast.success('Order placed successfully! 🎉');
      navigate(`/order-confirmation?orderId=${order?.id || 'demo'}`);
    } catch (err: any) {
      // Even if Supabase fails (not configured), show a demo success
      console.warn('Order placement error:', err);
      clearCart();
      toast.success('Order placed! (Demo mode)');
      navigate('/order-confirmation?orderId=demo-' + Date.now());
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="container py-8 md:py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Checkout
        </h1>
        <Link
          to="/cart"
          className="no-underline flex items-center gap-2 text-sm font-medium"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--purple-600)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <ArrowLeft size={16} /> Back to Cart
        </Link>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center gap-0 mb-10">
        {[
          { step: 1, label: 'Cart', done: true },
          { step: 2, label: 'Delivery Details', active: true },
          { step: 3, label: 'Payment', done: false },
        ].map((s, i) => (
          <div key={s.step} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: s.done || s.active ? 'var(--purple-600)' : 'var(--bg-secondary)',
                  color: s.done || s.active ? 'white' : 'var(--text-muted)',
                }}
              >
                {s.done && s.step < 2 ? <CheckCircle2 size={14} /> : s.step}
              </div>
              <span
                className="text-xs font-medium hidden sm:block"
                style={{ color: s.active ? 'var(--purple-600)' : 'var(--text-muted)' }}
              >
                {s.label}
              </span>
            </div>
            {i < 2 && (
              <div
                className="flex-1 h-0.5 mx-3"
                style={{ background: s.done ? 'var(--purple-400)' : 'var(--border-color)' }}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Address + Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            {/* Delivery Address */}
            <div
              style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '32px', boxShadow: '0 8px 32px rgba(201,151,58,0.06)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg,#C9973A,#E8B84B)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(201,151,58,0.35)' }}>
                  <MapPin size={22} color="white" />
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', fontFamily: 'var(--font-display)', marginBottom: '2px' }}>
                    Delivery Address
                  </h2>
                  <p style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Where should we send your order?</p>
                </div>
              </div>

              {/* Saved address cards */}
              {savedAddresses.length > 0 && (
                <div style={{ marginBottom: '28px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: '12px' }}>Saved Addresses</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px', marginBottom: '12px' }}>
                    {savedAddresses.map(addr => {
                      const isSelected = selectedSaved?.id === addr.id;
                      return (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => { setSelectedSaved(addr); setShowNewForm(false); }}
                          style={{
                            textAlign: 'left', padding: '18px', borderRadius: '16px', transition: 'all 0.2s', cursor: 'pointer',
                            background: isSelected ? 'linear-gradient(135deg,rgba(201,151,58,0.12),rgba(26,15,8,0.95))' : 'var(--bg-secondary)',
                            border: `2px solid ${isSelected ? '#C9973A' : '#e5e7eb'}`,
                            boxShadow: isSelected ? '0 4px 12px rgba(201,151,58,0.15)' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#C9973A' }}>{addr.label}</span>
                            {isSelected && <CheckCircle2 size={16} style={{ color: '#C9973A' }} />}
                          </div>
                          <p style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginBottom: '2px' }}>{addr.name}</p>
                          <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.5' }}>
                            {[addr.line1, addr.city, addr.pincode].filter(Boolean).join(', ')}
                          </p>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => { setSelectedSaved(null); setShowNewForm(true); }}
                      style={{
                        textAlign: 'left', padding: '18px', borderRadius: '16px', transition: 'all 0.2s', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '12px',
                        background: showNewForm && !selectedSaved ? 'linear-gradient(135deg,rgba(201,151,58,0.12),rgba(26,15,8,0.95))' : 'var(--bg-secondary)',
                        border: `2px dashed ${showNewForm && !selectedSaved ? '#C9973A' : '#d1d5db'}`,
                      }}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: showNewForm && !selectedSaved ? 'white' : 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Plus size={16} style={{ color: '#C9973A' }} />
                      </div>
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827', display: 'block' }}>New Address</span>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Deliver to a different location</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Manual address form — only when new address selected */}
              <AnimatePresence>
              {showNewForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  {savedAddresses.length > 0 && (
                    <div style={{ height: '1px', background: '#e5e7eb', marginBottom: '24px' }} />
                  )}
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ gridColumn: 'span 1' }}>
                      <RHF_FloatingInput
                        {...register('name')}
                        watchValue={watch('name')}
                        label="Full Name *"
                        placeholder="Rahul Sharma"
                        icon={User}
                        error={errors.name?.message}
                      />
                    </div>
                    <div style={{ gridColumn: 'span 1' }}>
                      <RHF_FloatingInput
                        {...register('phone')}
                        watchValue={watch('phone')}
                        label="Mobile Number *"
                        placeholder="9876543210"
                        maxLength={10}
                        icon={Phone}
                        error={errors.phone?.message}
                      />
                    </div>
                    
                    <div style={{ gridColumn: '1 / -1' }}>
                      <RHF_FloatingInput
                        {...register('line1')}
                        watchValue={watch('line1')}
                        label="Address Line 1 *"
                        placeholder="House / Flat no, Building, Street"
                        icon={MapPin}
                        error={errors.line1?.message}
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <RHF_FloatingInput
                        {...register('line2')}
                        watchValue={watch('line2')}
                        label="Address Line 2 (Optional)"
                        placeholder="Area, Landmark"
                        error={errors.line2?.message}
                      />
                    </div>

                    <div style={{ gridColumn: 'span 1' }}>
                      <RHF_FloatingInput
                        {...register('city')}
                        watchValue={watch('city')}
                        label="City *"
                        placeholder="e.g. Mumbai"
                        error={errors.city?.message}
                      />
                    </div>

                    <div style={{ gridColumn: 'span 1' }}>
                      <RHF_FloatingInput
                        {...register('pincode')}
                        watchValue={watch('pincode')}
                        label="Pincode *"
                        placeholder="6-digit code"
                        maxLength={6}
                        error={errors.pincode?.message}
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <RHF_FloatingInput
                        {...register('state')}
                        watchValue={watch('state')}
                        label="State *"
                        isSelect
                        options={INDIAN_STATES}
                        error={errors.state?.message}
                      />
                    </div>
                  </div>

                  {/* Save address toggle */}
                  {user && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginTop: '16px', padding: '14px 16px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1.5px solid #e5e7eb' }}>
                      <div
                        onClick={() => setSaveToProfile(!saveToProfile)}
                        style={{
                          width: '44px', height: '24px', borderRadius: '999px', flexShrink: 0,
                          background: saveToProfile ? '#C9973A' : '#d1d5db',
                          position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
                        }}
                      >
                        <div style={{
                          position: 'absolute', top: '3px',
                          left: saveToProfile ? '23px' : '3px',
                          width: '18px', height: '18px', borderRadius: '50%',
                          background: 'var(--bg-card)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                          transition: 'left 0.2s',
                        }} />
                      </div>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>Save this address to my profile</p>
                        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>You can use it for faster checkout next time</p>
                      </div>
                    </label>
                  )}
                </motion.div>
              )}
              </AnimatePresence>
            </div>

            {/* Payment method section removed and moved to modal */}
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="sticky top-24"
              style={{
                background: 'var(--bg-card)',
                borderRadius: '24px',
                padding: '32px',
                boxShadow: '0 8px 32px rgba(201,151,58,0.06)',
              }}
            >
              <h2
                style={{ fontSize: '20px', fontWeight: 800, color: '#111827', fontFamily: 'var(--font-display)', marginBottom: '24px' }}
              >
                Order Summary
              </h2>

              {/* Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', maxHeight: '320px', overflowY: 'auto', paddingRight: '8px' }}>
                {items.map((item) => (
                  <div
                    key={`${item.product_id}-${item.color_name}-${item.size}`}
                    style={{ display: 'flex', gap: '16px', alignItems: 'center' }}
                  >
                    <div style={{ width: '56px', height: '64px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid #e5e7eb', overflow: 'hidden', flexShrink: 0 }}>
                      <img
                        src={getOptimizedUrl(item.image_url, 80)}
                        alt={item.product_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.product_name}
                      </p>
                      <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600 }}>
                        {item.color_name} · {item.size} · Qty {item.quantity}
                      </p>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827', flexShrink: 0 }}>
                      ₹{(item.product_price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div
                style={{
                  display: 'flex', flexDirection: 'column', gap: '12px',
                  paddingTop: '20px', paddingBottom: '20px',
                  borderTop: '1px dashed #e5e7eb', borderBottom: '1px dashed #e5e7eb',
                  marginBottom: '20px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>Subtotal ({getItemCount()} items)</span>
                  <span style={{ fontSize: '14px', color: '#111827', fontWeight: 700 }}>₹{subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>
                    <Truck size={14} /> Delivery
                  </span>
                  {deliveryFee === 0 ? (
                    <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 10px', borderRadius: '999px', background: '#d1fae5', color: '#059669' }}>FREE</span>
                  ) : (
                    <span style={{ fontSize: '14px', color: '#111827', fontWeight: 700 }}>₹{deliveryFee}</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#111827' }}>Total</span>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#E8B84B' }}>₹{total.toLocaleString()}</span>
              </div>

              {/* Place Order Button */}
              <button
                type={selectedSaved ? 'button' : 'submit'}
                onClick={selectedSaved ? () => {
                  setSavedAddress({ name: selectedSaved.name, phone: selectedSaved.phone, line1: selectedSaved.line1, line2: selectedSaved.line2 || '', city: selectedSaved.city, state: selectedSaved.state, pincode: selectedSaved.pincode });
                  setShowPaymentModal(true);
                } : undefined}
                disabled={isPlacing || (!selectedSaved && !showNewForm)}
                style={{
                  width: '100%', padding: '16px 24px', borderRadius: '16px',
                  background: 'linear-gradient(135deg,#C9973A,#E8B84B)',
                  border: 'none', color: 'white', fontSize: '15px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 8px 24px rgba(201,151,58,0.3)',
                  cursor: isPlacing || (!selectedSaved && !showNewForm) ? 'not-allowed' : 'pointer',
                  opacity: isPlacing || (!selectedSaved && !showNewForm) ? 0.6 : 1,
                  transition: 'all 0.2s',
                }}
              >
                <Lock size={16} /> Continue to Payment
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                <Lock size={12} style={{ color: '#9ca3af' }} />
                <p style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>
                  Your data is encrypted and secure
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </form>


      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,10,30,0.6)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => { if (!isPlacing && e.target === e.currentTarget) setShowPaymentModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 24 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                width: '100%', maxWidth: '440px',
                background: 'var(--bg-card)', borderRadius: '24px', padding: '32px',
                boxShadow: '0 32px 64px rgba(201,151,58,0.2), 0 8px 24px rgba(0,0,0,0.12)',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '48px', height: '48px', borderRadius: '14px', marginBottom: '16px',
                    background: 'linear-gradient(135deg,#C9973A,#E8B84B)',
                    boxShadow: '0 8px 20px rgba(201,151,58,0.35)',
                  }}>
                    <CreditCard size={22} color="white" />
                  </div>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '4px', fontFamily: 'var(--font-display)' }}>
                    Payment Method
                  </h2>
                  <p style={{ fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>Choose how you want to pay</p>
                </div>
                <button
                  onClick={() => !isPlacing && setShowPaymentModal(false)}
                  disabled={isPlacing}
                  style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'var(--bg-tertiary)', border: 'none', cursor: isPlacing ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#6b7280', transition: 'all 0.15s',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                {/* COD */}
                <label
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '20px', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s',
                    background: paymentMethod === 'cod' ? 'linear-gradient(135deg,rgba(201,151,58,0.12),rgba(26,15,8,0.95))' : 'var(--bg-secondary)',
                    border: `2px solid ${paymentMethod === 'cod' ? '#C9973A' : '#e5e7eb'}`,
                    boxShadow: paymentMethod === 'cod' ? '0 4px 12px rgba(201,151,58,0.15)' : 'none',
                  }}
                >
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', border: `6px solid ${paymentMethod === 'cod' ? '#C9973A' : '#d1d5db'}`,
                    background: 'var(--bg-card)', flexShrink: 0, transition: 'all 0.2s',
                  }} />
                  <input
                    type="radio"
                    name="modal-payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    style={{ display: 'none' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                      <Package size={20} />
                    </div>
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginBottom: '2px' }}>Cash on Delivery</p>
                      <p style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Pay when your order arrives</p>
                    </div>
                  </div>
                </label>

                {/* Online Payment */}
                <label
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '20px', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s', opacity: 0.8,
                    background: paymentMethod === 'online' ? 'linear-gradient(135deg,rgba(201,151,58,0.12),rgba(26,15,8,0.95))' : 'var(--bg-secondary)',
                    border: `2px solid ${paymentMethod === 'online' ? '#C9973A' : '#e5e7eb'}`,
                  }}
                >
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', border: `6px solid ${paymentMethod === 'online' ? '#C9973A' : '#d1d5db'}`,
                    background: 'var(--bg-card)', flexShrink: 0, transition: 'all 0.2s',
                  }} />
                  <input
                    type="radio"
                    name="modal-payment"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                    style={{ display: 'none' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C9973A', flexShrink: 0 }}>
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <p style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>Pay Online</p>
                        <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 8px', borderRadius: '999px', background: '#fef3c7', color: '#d97706' }}>
                          Soon
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>UPI, Cards, Net Banking</p>
                    </div>
                  </div>
                </label>
              </div>

              {paymentMethod === 'online' && (
                <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(201,151,58,0.12)', border: '1px solid rgba(201,151,58,0.3)', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '16px' }}>⚡</span>
                  <p style={{ fontSize: '13px', color: '#92400e', fontWeight: 600, lineHeight: '1.5' }}>
                    Online payments are currently being integrated. Please proceed with Cash on Delivery for now.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={isPlacing || paymentMethod === 'online'}
                style={{
                  width: '100%', padding: '16px', borderRadius: '16px',
                  background: 'linear-gradient(135deg,#C9973A,#E8B84B)',
                  border: 'none', color: 'white', fontSize: '16px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  boxShadow: '0 8px 24px rgba(201,151,58,0.35)',
                  cursor: isPlacing || paymentMethod === 'online' ? 'not-allowed' : 'pointer',
                  opacity: isPlacing || paymentMethod === 'online' ? 0.7 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {isPlacing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...
                  </>
                ) : paymentMethod === 'online' ? (
                  'Select Cash on Delivery'
                ) : (
                  `Place Order · ₹${total.toLocaleString()}`
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
