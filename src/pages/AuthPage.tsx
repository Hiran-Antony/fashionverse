import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ShoppingBag, Heart, Sparkles, Shield } from 'lucide-react';
import BrandLogo from '../components/layout/BrandLogo';

const PERKS = [
  {
    icon: <ShoppingBag size={18} />,
    title: 'One-click checkout',
    desc: 'Saved addresses and payment methods for a seamless buying experience.',
  },
  {
    icon: <Heart size={18} />,
    title: 'Personal wishlist',
    desc: 'Save items and get notified when they go on sale.',
  },
  {
    icon: <Sparkles size={18} />,
    title: 'AI style profile',
    desc: 'The more you shop, the smarter our recommendations become.',
  },
  {
    icon: <Shield size={18} />,
    title: 'Secure & private',
    desc: 'Your data is encrypted and never shared with third parties.',
  },
];

export default function AuthPage() {
  const { user, signInWithGoogle } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>

      {/* ── LEFT PANEL ─────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #5b21b6 0%, #7c3aed 50%, #4c1d95 100%)' }}
      >
        {/* Decorative orb top-right */}
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.55, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: '-80px', right: '-80px',
            width: '420px', height: '420px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(167,139,250,0.45) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        {/* Decorative orb bottom-left */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.45, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          style={{
            position: 'absolute', bottom: '-60px', left: '-60px',
            width: '340px', height: '340px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Subtle dot grid */}
        <div
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 10, padding: '3rem 3.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>

          <div style={{ marginBottom: 'auto' }}>
            <BrandLogo size="lg" showWordmark={false} />
          </div>

          {/* Main copy — vertically centred */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem 0' }}
          >
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 3.5vw, 2.875rem)',
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.18,
              letterSpacing: '-0.025em',
              marginBottom: '1.125rem',
            }}>
              Your style journey<br />
              <span style={{
                background: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                starts here.
              </span>
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '1rem',
              lineHeight: 1.85,
              maxWidth: '400px',
              marginBottom: '2.75rem',
            }}>
              Join FashionVerse and discover a smarter way to shop — powered by AI, personalised just for you.
            </p>

            {/* Perks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {PERKS.map((perk, i) => (
                <motion.div
                  key={perk.title}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}
                >
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white',
                  }}>
                    {perk.icon}
                  </div>
                  <div>
                    {/* ← This was the broken line — now explicitly white */}
                    <p style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.9375rem', margin: '0 0 3px', lineHeight: 1.3 }}>
                      {perk.title}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.58)', fontSize: '0.8125rem', margin: 0, lineHeight: 1.65 }}>
                      {perk.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Bottom trust badge */}
          <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: '0.75rem', letterSpacing: '0.04em' }}>
            Trusted by 50,000+ shoppers across India
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────── */}
      <div
        className="flex-1 flex flex-col items-center justify-center"
        style={{ padding: '3rem 2rem', background: 'var(--bg-primary)' }}
      >
        <div className="lg:hidden" style={{ marginBottom: '3rem' }}>
          <BrandLogo size="md" showWordmark={false} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ width: '100%', maxWidth: '360px' }}
        >
          {/* Heading */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: '0.5rem',
            }}>
              Welcome back
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', lineHeight: 1.65 }}>
              Sign in to your account to continue shopping.
            </p>
          </div>

          {/* Google Sign-In */}
          <button
            onClick={signInWithGoogle}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.875rem',
              padding: '0.9375rem 1.5rem',
              background: 'white',
              color: '#1f1f1f',
              border: '1.5px solid #e2e2e2',
              borderRadius: '14px',
              fontSize: '0.9375rem', fontWeight: 600,
              boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '1.25rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.13)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.07)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
              <path d="M47.532 24.552c0-1.636-.147-3.2-.422-4.704H24.48v8.898h12.985c-.56 3.02-2.256 5.578-4.804 7.294v6.065h7.776c4.548-4.19 7.093-10.356 7.093-17.553z" fill="#4285F4"/>
              <path d="M24.48 48c6.515 0 11.985-2.16 15.98-5.855l-7.776-6.065c-2.159 1.446-4.919 2.302-8.204 2.302-6.31 0-11.655-4.262-13.566-9.988H2.867v6.254C6.844 42.858 15.08 48 24.48 48z" fill="#34A853"/>
              <path d="M10.914 28.394A14.45 14.45 0 0 1 10.15 24c0-1.528.262-3.01.764-4.394v-6.254H2.867A23.952 23.952 0 0 0 .48 24c0 3.862.926 7.52 2.387 10.648l8.047-6.254z" fill="#FBBC05"/>
              <path d="M24.48 9.618c3.557 0 6.75 1.224 9.263 3.628l6.95-6.95C36.454 2.39 30.989 0 24.48 0 15.08 0 6.844 5.142 2.867 13.352l8.047 6.254c1.911-5.726 7.256-9.988 13.566-9.988z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Privacy note */}
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: '12px',
            padding: '0.875rem 1.125rem', marginBottom: '2rem',
          }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78125rem', lineHeight: 1.7, textAlign: 'center', margin: 0 }}>
              By continuing, you agree to our{' '}
              <a href="#" style={{ color: 'var(--purple-600)', textDecoration: 'none', fontWeight: 600 }}>Terms of Service</a>
              {' '}and{' '}
              <a href="#" style={{ color: 'var(--purple-600)', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>.
              <br />We never post without your permission.
            </p>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 500 }}>
              No account needed to browse
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          </div>

          {/* Guest link */}
          <a
            href="/"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '100%', padding: '0.875rem',
              color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500,
              border: '1.5px solid var(--border-color)', borderRadius: '14px',
              textDecoration: 'none', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-secondary)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            Continue browsing as guest
          </a>
        </motion.div>
      </div>
    </div>
  );
}
