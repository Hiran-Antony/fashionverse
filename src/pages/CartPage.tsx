import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ArrowLeft, Tag, Package } from 'lucide-react';
import { useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { getOptimizedUrl } from '../lib/cloudinary';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, getItemCount, appliedCoupon, applyCoupon, removeCoupon } = useCartStore();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState(appliedCoupon?.code || '');

  const subtotal = getTotal();
  const deliveryFee = subtotal >= 999 ? 0 : 99;
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const total = subtotal + deliveryFee - discount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .single();
        
      if (error || !data) {
        toast.error('Invalid coupon code');
        return;
      }
      
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast.error('Coupon has expired');
        return;
      }
      
      if (data.min_order && subtotal < data.min_order) {
        toast.error(`Minimum order amount is ₹${data.min_order}`);
        return;
      }
      
      if (data.max_uses && data.used_count >= data.max_uses) {
        toast.error('Coupon usage limit reached');
        return;
      }
      
      let disc = 0;
      if (data.discount_percent) {
        disc = Math.round(subtotal * (data.discount_percent / 100));
      } else if (data.discount_amount) {
        disc = data.discount_amount;
      }
      
      applyCoupon(couponCode.toUpperCase(), disc);
      toast.success(`Coupon applied! ₹${disc} off`);
    } catch (err) {
      toast.error('Error applying coupon');
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponCode('');
    toast('Coupon removed');
  };

  if (items.length === 0) {
    return (
      <div className="container py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm mx-auto"
        >
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'var(--purple-100)', color: 'var(--purple-600)' }}
          >
            <ShoppingBag size={40} />
          </div>
          <h1
            className="text-3xl font-bold mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            Your Cart is Empty
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            Looks like you haven't added anything yet. Discover our collection and find something you love!
          </p>
          <Link to="/products" className="btn btn-primary">
            <ShoppingBag size={16} /> Start Shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Shopping Cart
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {getItemCount()} {getItemCount() === 1 ? 'item' : 'items'}
          </p>
        </div>
        <Link
          to="/products"
          className="no-underline flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--purple-600)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <ArrowLeft size={16} /> Continue Shopping
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={`${item.product_id}-${item.color_name}-${item.size}`}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -60, transition: { duration: 0.25 } }}
                className="flex gap-4 rounded-2xl p-4 md:p-5"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {/* Image */}
                <Link to={`/product/${item.product_id}`} className="shrink-0">
                  <img
                    src={getOptimizedUrl(item.image_url, 160)}
                    alt={item.product_name}
                    className="rounded-xl object-cover"
                    style={{ width: '90px', height: '112px' }}
                  />
                </Link>

                {/* Details */}
                <div className="flex flex-col flex-1 gap-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <Link
                      to={`/product/${item.product_id}`}
                      className="text-sm font-semibold no-underline line-clamp-2 transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--purple-600)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                    >
                      {item.product_name}
                    </Link>
                    <button
                      onClick={() => {
                        removeItem(item.product_id, item.color_name, item.size);
                        toast('Item removed from cart');
                      }}
                      className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                      style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#ef4444';
                        e.currentTarget.style.background = '#fee2e2';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span
                      className="px-2 py-0.5 rounded-md"
                      style={{ background: 'var(--bg-secondary)' }}
                    >
                      {item.color_name}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-md"
                      style={{ background: 'var(--bg-secondary)' }}
                    >
                      Size: {item.size}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-2">
                    {/* Qty Stepper */}
                    <div
                      className="flex items-center gap-1 rounded-xl overflow-hidden"
                      style={{ border: '1.5px solid var(--border-color)' }}
                    >
                      <button
                        onClick={() =>
                          updateQuantity(item.product_id, item.color_name, item.size, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 flex items-center justify-center transition-colors"
                        style={{
                          background: 'var(--bg-secondary)',
                          color: item.quantity <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                          cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                          border: 'none',
                        }}
                      >
                        <Minus size={13} />
                      </button>
                      <span
                        className="w-8 text-center text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product_id, item.color_name, item.size, item.quantity + 1)
                        }
                        className="w-8 h-8 flex items-center justify-center transition-colors"
                        style={{
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          border: 'none',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--purple-100)';
                          e.currentTarget.style.color = 'var(--purple-600)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--bg-secondary)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    {/* Price */}
                    <span
                      className="text-base font-bold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      ₹{(item.product_price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
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
              className="text-lg font-bold mb-6"
              style={{ color: 'var(--text-primary)' }}
            >
              Order Summary
            </h2>

            {/* Coupon Code */}
            <div className="mb-6 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <input
                      type="text"
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      className="input pl-9 text-sm"
                      style={{ padding: '10px 12px 10px 32px' }}
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    className="btn btn-outline text-sm px-4"
                    style={{ padding: '10px 16px' }}
                  >
                    Apply
                  </button>
                </div>
              ) : (
                <div
                  className="flex items-center justify-between rounded-xl px-4 py-3"
                  style={{ background: '#d1fae5', border: '1px solid #a7f3d0' }}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#065f46' }}>
                    <Tag size={14} />
                    {couponCode} applied
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-xs"
                    style={{ color: '#065f46', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span>Subtotal ({getItemCount()} items)</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span className="flex items-center gap-1">
                  <Package size={13} /> Delivery
                </span>
                {deliveryFee === 0 ? (
                  <span style={{ color: '#059669', fontWeight: 600 }}>FREE</span>
                ) : (
                  <span>₹{deliveryFee}</span>
                )}
              </div>
              {deliveryFee > 0 && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Add ₹{(999 - subtotal).toLocaleString()} more for free delivery
                </p>
              )}
              {appliedCoupon && (
                <div className="flex justify-between text-sm font-medium" style={{ color: '#059669' }}>
                  <span>Coupon Discount</span>
                  <span>−₹{discount.toLocaleString()}</span>
                </div>
              )}
              <div
                className="flex justify-between font-bold text-base pt-3 mt-1"
                style={{
                  color: 'var(--text-primary)',
                  borderTop: '2px solid var(--border-color)',
                }}
              >
                <span>Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => navigate('/checkout')}
              className="btn btn-primary w-full text-sm justify-center"
              style={{ padding: '14px 24px', fontSize: '0.9375rem' }}
            >
              Proceed to Checkout <ArrowRight size={16} />
            </button>

            <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
              🔒 Secure checkout · Free returns · 100% authentic
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

