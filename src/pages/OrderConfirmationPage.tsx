import { useSearchParams, Link } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';
import { CheckCircle2, Package, Truck, Home, ShoppingBag, ArrowRight, Mail } from 'lucide-react';
import { useEffect, useRef } from 'react';

// ─── Gold-only confetti ───────────────────────────────────────────
function GoldConfetti() {
  const colors = ['#C9973A', '#E8B84B', '#D4A935', '#F5EDD4', '#A07828', '#E8C97A'];
  const pieces = Array.from({ length: 36 }, (_, i) => {
    const color = colors[i % colors.length];
    const left = 5 + Math.random() * 90;
    const delay = Math.random() * 1.2;
    const size = Math.random() * 7 + 4;
    const duration = Math.random() * 2 + 2;
    const isCircle = Math.random() > 0.5;
    return { color, left, delay, size, duration, isCircle };
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <motion.div
          key={i}
          initial={{ y: -20, x: `${p.left}vw`, opacity: 1, rotate: 0 }}
          animate={{
            y: '110vh',
            opacity: [1, 1, 0],
            rotate: Math.random() * 540 - 270,
            x: `${p.left + (Math.random() * 12 - 6)}vw`,
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{
            position: 'fixed',
            top: 0,
            width: p.size,
            height: p.size,
            borderRadius: p.isCircle ? '50%' : '2px',
            background: p.color,
            zIndex: 100,
          }}
        />
      ))}
    </div>
  );
}

// ─── Tracking step data ───────────────────────────────────────────
const ORDER_STEPS = [
  { icon: <CheckCircle2 size={16} />, label: 'Order\nPlaced', active: true },
  { icon: <Package size={16} />, label: 'Being\nPacked', active: false },
  { icon: <Truck size={16} />, label: 'Out for\nDelivery', active: false },
  { icon: <Home size={16} />, label: 'Delivered', active: false },
];

// ─── Animated tracking line ───────────────────────────────────────
function TrackingLine() {
  return (
    <div style={{ position: 'absolute', top: 18, left: 36, right: 36, height: 1, zIndex: 0 }}>
      {/* Background line */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(201,151,58,0.12)' }} />
      {/* Animated gold line */}
      <motion.div
        initial={{ width: '0%' }}
        animate={{ width: '8%' }}
        transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          top: 0, left: 0, height: '100%',
          background: 'linear-gradient(90deg, #C9973A, #E8B84B)',
        }}
      />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────
export default function OrderConfirmationPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || '—';
  const shortId = orderId.length > 12
    ? orderId.slice(0, 8).toUpperCase()
    : orderId.toUpperCase();

  // Estimated delivery: 4 business days
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 4);
  const formattedDate = deliveryDate.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  // Stagger variants
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div
      style={{
        background: '#2c1b10',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Gold confetti */}
      <GoldConfetti />

      {/* Ambient radial glow */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,151,58,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Center card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: 'rgba(22, 14, 6, 0.97)',
          border: '1px solid rgba(201,151,58,0.2)',
          borderRadius: 24,
          padding: '32px 32px',
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,151,58,0.08)',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 10,
        }}
      >
        {/* Card top glow */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: -60,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 300,
            height: 300,
            background: 'radial-gradient(circle, rgba(201,151,58,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <motion.div variants={container} initial="hidden" animate="show">

          {/* ── Success icon ─────────────────────────────── */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            style={{
              width: 80,
              height: 80,
              background: 'linear-gradient(135deg, rgba(201,151,58,0.15), rgba(232,184,75,0.08))',
              border: '1.5px solid rgba(201,151,58,0.4)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              position: 'relative',
              animation: 'iconPulse 2s ease infinite',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <CheckCircle2 size={36} color="#E8B84B" strokeWidth={2} />
            </motion.div>
          </motion.div>

          {/* ── Heading ─────────────────────────────────── */}
          <motion.div variants={fadeUp}>
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#C9973A',
              marginBottom: 12,
              display: 'block',
              fontFamily: "'Inter', sans-serif",
            }}>
              ✦ ORDER CONFIRMED
            </span>

            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 42,
              fontWeight: 700,
              color: '#F5EDD4',
              lineHeight: 1.15,
              marginBottom: 10,
            }}>
              Your Order<br />is Confirmed
            </h1>

            <p style={{
              fontSize: 14,
              color: 'rgba(245,237,212,0.5)',
              marginBottom: 20,
              lineHeight: 1.6,
              fontFamily: "'Inter', sans-serif",
            }}>
              Thank you for shopping with FashionVerse.{' '}
              We'll get your order ready right away.
            </p>
          </motion.div>

          {/* ── Order info grid ─────────────────────────── */}
          <motion.div
            variants={fadeUp}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginBottom: 16,
              textAlign: 'left',
            }}
          >
            {/* Order ID */}
            <div style={{
              background: 'rgba(10,6,2,0.5)',
              border: '1px solid rgba(201,151,58,0.12)',
              borderRadius: 12,
              padding: 16,
            }}>
              <span style={{
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(201,151,58,0.55)',
                marginBottom: 6,
                display: 'block',
                fontFamily: "'Inter', sans-serif",
              }}>
                Order ID
              </span>
              <span style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#E8B84B',
                fontFamily: "'Space Grotesk', monospace",
                letterSpacing: '0.04em',
              }}>
                #{shortId}
              </span>
            </div>

            {/* Est. Delivery */}
            <div style={{
              background: 'rgba(10,6,2,0.5)',
              border: '1px solid rgba(201,151,58,0.12)',
              borderRadius: 12,
              padding: 16,
            }}>
              <span style={{
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(201,151,58,0.55)',
                marginBottom: 6,
                display: 'block',
                fontFamily: "'Inter', sans-serif",
              }}>
                Est. Delivery
              </span>
              <span style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#E8B84B',
                fontFamily: "'Syne', sans-serif",
              }}>
                {formattedDate}
              </span>
            </div>
          </motion.div>

          {/* ── Order tracking steps ─────────────────────── */}
          <motion.div
            variants={fadeUp}
            style={{
              marginBottom: 16,
              padding: 20,
              background: 'rgba(10,6,2,0.4)',
              border: '1px solid rgba(201,151,58,0.1)',
              borderRadius: 14,
            }}
          >
            <p style={{
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(201,151,58,0.55)',
              marginBottom: 20,
              textAlign: 'left',
              fontFamily: "'Inter', sans-serif",
            }}>
              Order Status
            </p>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
              <TrackingLine />

              {ORDER_STEPS.map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    position: 'relative',
                    zIndex: 2,
                    flex: 1,
                  }}
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: step.active ? '1.5px solid #C9973A' : '1.5px solid rgba(201,151,58,0.2)',
                    background: step.active
                      ? 'linear-gradient(135deg, rgba(201,151,58,0.2), rgba(232,184,75,0.1))'
                      : 'rgba(10,6,2,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: step.active ? '#E8B84B' : 'rgba(201,151,58,0.25)',
                    boxShadow: step.active ? '0 0 12px rgba(201,151,58,0.25)' : 'none',
                    transition: 'all 0.3s',
                  }}>
                    {step.icon}
                  </div>
                  <span style={{
                    fontSize: 10,
                    textAlign: 'center',
                    color: step.active ? 'rgba(245,237,212,0.75)' : 'rgba(245,237,212,0.3)',
                    letterSpacing: '0.04em',
                    maxWidth: 60,
                    lineHeight: 1.4,
                    whiteSpace: 'pre-line',
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Email notice ─────────────────────────────── */}
          <motion.div
            variants={fadeUp}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 16px',
              background: 'rgba(201,151,58,0.05)',
              border: '1px solid rgba(201,151,58,0.12)',
              borderRadius: 10,
              marginBottom: 20,
              textAlign: 'left',
            }}
          >
            <Mail size={18} color="#C9973A" style={{ flexShrink: 0 }} />
            <p style={{
              fontSize: 13,
              color: 'rgba(245,237,212,0.6)',
              lineHeight: 1.5,
              fontFamily: "'Inter', sans-serif",
              margin: 0,
            }}>
              A confirmation email has been sent. Track your order in{' '}
              <Link
                to="/account/orders"
                style={{ color: '#C9973A', textDecoration: 'none', fontWeight: 500 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#E8B84B')}
                onMouseLeave={e => (e.currentTarget.style.color = '#C9973A')}
              >
                My Account → Orders
              </Link>
            </p>
          </motion.div>

          {/* ── Action buttons ──────────────────────────── */}
          <motion.div
            variants={fadeUp}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
          >
            <Link
              to="/account/orders"
              style={{
                padding: '15px 20px',
                background: 'linear-gradient(135deg, #C9973A, #E8B84B)',
                border: 'none',
                borderRadius: 12,
                color: '#120a06',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.04em',
                boxShadow: '0 8px 28px rgba(201,151,58,0.35)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontFamily: "'Syne', sans-serif",
                textDecoration: 'none',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 12px 36px rgba(201,151,58,0.5)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 8px 28px rgba(201,151,58,0.35)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Track Order <ArrowRight size={15} />
            </Link>

            <Link
              to="/products"
              style={{
                padding: '15px 20px',
                background: 'transparent',
                border: '1px solid rgba(201,151,58,0.25)',
                borderRadius: 12,
                color: 'rgba(245,237,212,0.75)',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontFamily: "'Syne', sans-serif",
                textDecoration: 'none',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(201,151,58,0.5)';
                e.currentTarget.style.color = '#F5EDD4';
                e.currentTarget.style.background = 'rgba(201,151,58,0.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(201,151,58,0.25)';
                e.currentTarget.style.color = 'rgba(245,237,212,0.75)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <ShoppingBag size={15} /> Continue Shopping
            </Link>
          </motion.div>

        </motion.div>
      </motion.div>

      {/* Keyframes for icon pulse */}
      <style>{`
        @keyframes iconPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201,151,58,0.2); }
          50%       { box-shadow: 0 0 0 12px rgba(201,151,58,0); }
        }
      `}</style>
    </div>
  );
}
