import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Package, Truck, Home, ShoppingBag, ArrowRight } from 'lucide-react';

// Confetti burst animation using CSS
function ConfettiBurst() {
  const colors = ['#7c3aed', '#f59e0b', '#ec4899', '#10b981', '#3b82f6', '#ef4444'];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {[...Array(30)].map((_, i) => {
        const color = colors[i % colors.length];
        const left = Math.random() * 100;
        const delay = Math.random() * 0.8;
        const size = Math.random() * 8 + 4;
        const duration = Math.random() * 1.5 + 1.5;
        return (
          <motion.div
            key={i}
            initial={{ y: -20, x: `${left}vw`, opacity: 1, rotate: 0 }}
            animate={{
              y: '110vh',
              opacity: [1, 1, 0],
              rotate: Math.random() * 720 - 360,
              x: `${left + (Math.random() * 10 - 5)}vw`,
            }}
            transition={{ duration, delay, ease: 'easeIn' }}
            style={{
              position: 'fixed',
              top: 0,
              width: size,
              height: size,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              background: color,
              zIndex: 100,
            }}
          />
        );
      })}
    </div>
  );
}

const ORDER_STEPS = [
  { icon: <CheckCircle2 size={18} />, label: 'Order Placed', done: true },
  { icon: <Package size={18} />, label: 'Being Packed', done: false },
  { icon: <Truck size={18} />, label: 'Out for Delivery', done: false },
  { icon: <Home size={18} />, label: 'Delivered', done: false },
];

export default function OrderConfirmationPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || '—';
  const shortId = orderId.length > 12 ? orderId.slice(0, 8).toUpperCase() : orderId.toUpperCase();

  // Estimated delivery: 3-5 business days
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 4);
  const formattedDate = deliveryDate.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center py-16 px-4 relative"
      style={{ background: 'var(--bg-primary)' }}
    >
      <ConfettiBurst />

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 160, damping: 18 }}
        className="w-full max-w-md text-center"
        style={{ position: 'relative', zIndex: 10 }}
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{
            background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
            border: '4px solid #34d399',
          }}
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <CheckCircle2 size={48} color="#059669" fill="#059669" strokeWidth={1.5} />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h1
            className="text-3xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Order Confirmed! 🎉
          </h1>
          <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
            Thank you for shopping with FashionVerse
          </p>
        </motion.div>

        {/* Order ID card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl p-5 my-6 text-left"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
                Order ID
              </p>
              <p className="text-lg font-bold font-mono" style={{ color: 'var(--purple-600)' }}>
                #{shortId}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
                Est. Delivery
              </p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {formattedDate}
              </p>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="flex items-center justify-between">
            {ORDER_STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{
                      background: step.done ? '#d1fae5' : 'var(--bg-secondary)',
                      color: step.done ? '#059669' : 'var(--text-muted)',
                      border: step.done ? '2px solid #34d399' : '2px solid var(--border-color)',
                    }}
                  >
                    {step.icon}
                  </div>
                  <span
                    className="text-[9px] font-semibold text-center leading-tight"
                    style={{ color: step.done ? '#059669' : 'var(--text-muted)', maxWidth: '50px' }}
                  >
                    {step.label}
                  </span>
                </div>
                {i < ORDER_STEPS.length - 1 && (
                  <div
                    className="flex-1 h-0.5 mx-1 mb-5"
                    style={{ background: step.done ? '#34d399' : 'var(--border-color)' }}
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Info message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl px-4 py-3 mb-6 text-sm"
          style={{
            background: 'var(--purple-50)',
            border: '1px solid var(--purple-200)',
            color: 'var(--purple-700)',
          }}
        >
          📧 A confirmation email has been sent. Track your order in <strong>My Account → Orders</strong>.
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Link
            to="/account/orders"
            className="btn btn-primary flex-1 justify-center no-underline"
          >
            Track Order <ArrowRight size={15} />
          </Link>
          <Link
            to="/products"
            className="btn btn-outline flex-1 justify-center no-underline"
          >
            <ShoppingBag size={15} /> Continue Shopping
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
