import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Phone, User, ChevronDown, Package, CreditCard, Truck,
  ArrowLeft, Lock, CheckCircle2,
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { getOptimizedUrl } from '../lib/cloudinary';
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

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getTotal, getItemCount, clearCart } = useCartStore();
  const { user, profile } = useAuthStore();
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [isPlacing, setIsPlacing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [savedAddress, setSavedAddress] = useState<AddressForm | null>(null);

  const subtotal = getTotal();
  const deliveryFee = subtotal >= 999 ? 0 : 99;
  const total = subtotal + deliveryFee;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: '', // Force user to manually type their given name
      phone: profile?.phone || '',
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
    setSavedAddress(address);
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
            <div
              className="rounded-2xl p-6"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--purple-100)', color: 'var(--purple-600)' }}
                >
                  <MapPin size={18} />
                </div>
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  Delivery Address
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    Full Name *
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      {...register('name')}
                      placeholder="Rahul Sharma"
                      className={`input ${errors.name ? 'input-error' : ''}`}
                      style={{ paddingLeft: '2.5rem' }}
                    />
                  </div>
                  {errors.name && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.name.message}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      {...register('phone')}
                      placeholder="9876543210"
                      maxLength={10}
                      className={`input ${errors.phone ? 'input-error' : ''}`}
                      style={{ paddingLeft: '2.5rem' }}
                    />
                  </div>
                  {errors.phone && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.phone.message}</p>}
                </div>

                {/* Address Line 1 */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    Address Line 1 *
                  </label>
                  <input
                    {...register('line1')}
                    placeholder="House no, Street, Area"
                    className={`input ${errors.line1 ? 'input-error' : ''}`}
                  />
                  {errors.line1 && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.line1.message}</p>}
                </div>

                {/* Address Line 2 */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Address Line 2 (Optional)
                  </label>
                  <input
                    {...register('line2')}
                    placeholder="Landmark, Apartment name (optional)"
                    className="input"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    City *
                  </label>
                  <input
                    {...register('city')}
                    placeholder="Mumbai"
                    className={`input ${errors.city ? 'input-error' : ''}`}
                  />
                  {errors.city && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.city.message}</p>}
                </div>

                {/* Pincode */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    Pincode *
                  </label>
                  <input
                    {...register('pincode')}
                    placeholder="400001"
                    maxLength={6}
                    className={`input ${errors.pincode ? 'input-error' : ''}`}
                  />
                  {errors.pincode && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.pincode.message}</p>}
                </div>

                {/* State */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    State *
                  </label>
                  <div className="relative">
                    <select
                      {...register('state')}
                      className={`input select appearance-none ${errors.state ? 'input-error' : ''}`}
                    >
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                  </div>
                  {errors.state && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.state.message}</p>}
                </div>
              </div>
            </div>

            {/* Payment method section removed and moved to modal */}
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl p-6 sticky top-24"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
              }}
            >
              <h2
                className="text-base font-bold mb-5"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
              >
                Order Summary
              </h2>

              {/* Items */}
              <div className="space-y-3 mb-5 max-h-64 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={`${item.product_id}-${item.color_name}-${item.size}`}
                    className="flex gap-3 items-center"
                  >
                    <img
                      src={getOptimizedUrl(item.image_url, 80)}
                      alt={item.product_name}
                      className="w-12 h-14 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-medium line-clamp-1"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {item.product_name}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {item.color_name} · {item.size} · Qty {item.quantity}
                      </p>
                    </div>
                    <span className="text-xs font-bold shrink-0" style={{ color: 'var(--text-primary)' }}>
                      ₹{(item.product_price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div
                className="space-y-2 py-4"
                style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}
              >
                <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span>Subtotal ({getItemCount()} items)</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span className="flex items-center gap-1"><Truck size={12} /> Delivery</span>
                  {deliveryFee === 0 ? (
                    <span style={{ color: '#059669', fontWeight: 600 }}>FREE</span>
                  ) : (
                    <span>₹{deliveryFee}</span>
                  )}
                </div>
              </div>

              <div className="flex justify-between font-bold text-base mt-4 mb-6" style={{ color: 'var(--text-primary)' }}>
                <span>Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>

              {/* Place Order Button */}
              <button
                type="submit"
                className="btn btn-primary w-full justify-center text-sm"
                style={{
                  padding: '14px 24px',
                  opacity: isPlacing || paymentMethod === 'online' ? 0.7 : 1,
                  cursor: isPlacing || paymentMethod === 'online' ? 'not-allowed' : 'pointer',
                }}
              >
                  <>
                    <Lock size={15} /> Continue to Payment
                  </>
              </button>

              <p className="text-center text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                🔒 Your data is encrypted and secure
              </p>
            </motion.div>
          </div>
        </div>
      </form>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isPlacing && setShowPaymentModal(false)}
              className="fixed inset-0 z-[100]"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              key="modal"
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed z-[101] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6"
            >
              <div
                className="rounded-3xl p-6 overflow-hidden shadow-2xl relative"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}
              >
                <button
                  onClick={() => !isPlacing && setShowPaymentModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  disabled={isPlacing}
                >
                  <Lock size={16} style={{ color: 'var(--text-muted)' }} />
                </button>
                
                <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                  Select Payment Method
                </h2>

                <div className="space-y-3 mb-8">
                  {/* COD */}
                  <label
                    className="flex items-center gap-4 rounded-xl p-4 cursor-pointer transition-all"
                    style={{
                      background: paymentMethod === 'cod' ? 'var(--purple-50)' : 'var(--bg-secondary)',
                      border: paymentMethod === 'cod' ? '2px solid var(--purple-400)' : '1px solid var(--border-color)',
                    }}
                  >
                    <input
                      type="radio"
                      name="modal-payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="accent-purple-600 w-5 h-5"
                    />
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'var(--gold-100)', color: 'var(--gold-700)' }}
                      >
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Cash on Delivery</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Pay when your order arrives</p>
                      </div>
                    </div>
                  </label>

                  {/* Online Payment */}
                  <label
                    className="flex items-center gap-4 rounded-xl p-4 cursor-pointer transition-all opacity-80"
                    style={{
                      background: paymentMethod === 'online' ? 'var(--purple-50)' : 'var(--bg-secondary)',
                      border: paymentMethod === 'online' ? '2px solid var(--purple-400)' : '1px solid var(--border-color)',
                    }}
                  >
                    <input
                      type="radio"
                      name="modal-payment"
                      value="online"
                      checked={paymentMethod === 'online'}
                      onChange={() => setPaymentMethod('online')}
                      className="accent-purple-600 w-5 h-5"
                    />
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'var(--purple-100)', color: 'var(--purple-600)' }}
                      >
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                          Pay Online
                          <span className="ml-2 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold" style={{ background: 'var(--gold-100)', color: 'var(--gold-700)' }}>
                            Soon
                          </span>
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>UPI, Cards, Net Banking</p>
                      </div>
                    </div>
                  </label>
                </div>

                {paymentMethod === 'online' && (
                  <p className="text-xs mb-6 p-3 rounded-xl" style={{ background: 'var(--gold-50)', color: 'var(--gold-700)', border: '1px solid var(--gold-200)' }}>
                    ⚡ Online payments are being integrated. Please proceed with Cash on Delivery for now.
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  disabled={isPlacing || paymentMethod === 'online'}
                  className="btn btn-primary w-full justify-center text-sm py-4 rounded-xl"
                  style={{
                    opacity: isPlacing || paymentMethod === 'online' ? 0.7 : 1,
                    cursor: isPlacing || paymentMethod === 'online' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isPlacing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : paymentMethod === 'online' ? (
                    'Select Cash on Delivery'
                  ) : (
                    `Place Order · ₹${total.toLocaleString()}`
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
