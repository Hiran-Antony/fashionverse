import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ShoppingBag, Sparkles, Zap, Eye, Shirt } from 'lucide-react';
import { CATEGORIES } from '../../utils/constants';

// ─── Hero Section ────────────────────────────────────────────

export default function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.75;
    }
  }, []);

  return (
    <section
      className="relative w-full overflow-hidden flex items-center"
      style={{
        /* Extend behind the fixed navbar so its transparent bg shows the gradient */
        marginTop: 'calc(-1 * var(--nav-height))',
        paddingTop: 'var(--nav-height)',
        minHeight: '100vh',
      }}
    >
      {/* Background */}
      <div className="absolute inset-0" style={{ background: 'var(--gradient-hero)' }} />

      {/* Floating ambient orbs */}
      <motion.div
        animate={{ y: [0, -40, 0], x: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute opacity-25 pointer-events-none"
        style={{
          top: '20%',
          left: '15%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--purple-400) 0%, transparent 65%)',
          filter: 'blur(80px)',
        }}
      />
      <motion.div
        animate={{ y: [0, 30, 0], x: [0, -25, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        className="absolute opacity-20 pointer-events-none"
        style={{
          bottom: '10%',
          right: '10%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--gold-400) 0%, transparent 65%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 container w-full">
        <div className="max-w-3xl">

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{ marginBottom: '2rem' }}
          >
            <span
              className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
                color: 'var(--gold-300)',
                border: '1px solid rgba(245,158,11,0.25)',
                letterSpacing: '0.12em',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: 'var(--gold-400)' }}
              />
              AI-Powered Fashion Experience
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15 }}
            style={{
              color: 'white',
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              fontWeight: 800,
              lineHeight: 1.18,
              letterSpacing: '-0.02em',
              marginBottom: '2rem',
            }}
          >
            Discover Your{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, var(--gold-300) 0%, var(--gold-500) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Perfect Style
            </span>
            <br />
            Before You Buy
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: '1.125rem',
              lineHeight: 2,
              maxWidth: '500px',
              marginBottom: '3rem',
            }}
          >
            Try on clothes virtually with AI, build complete outfits, and receive
            personalized recommendations — all without leaving your home.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="flex flex-wrap items-center"
            style={{ gap: '1rem', marginBottom: '4rem' }}
          >
            {/* Primary Button */}
            <Link
              to="/products"
              className="no-underline inline-flex items-center gap-3 font-bold text-sm transition-all"
              style={{
                background: 'white',
                color: '#3b0764',
                borderRadius: '100px',
                padding: '1rem 2rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 14px 40px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.22)';
              }}
            >
              Shop Collection
              <ArrowRight size={16} />
            </Link>

            {/* Secondary Ghost Button */}
            <Link
              to="/try-on"
              className="no-underline inline-flex items-center gap-2.5 font-semibold text-sm transition-all"
              style={{
                background: 'transparent',
                color: 'rgba(255,255,255,0.9)',
                borderRadius: '100px',
                padding: '1rem 2rem',
                border: '1.5px solid rgba(255,255,255,0.35)',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Try On Virtually
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.65 }}
            className="flex flex-wrap items-center"
            style={{ gap: '2.5rem' }}
          >
            {[
              { value: '1,000+', label: 'Products' },
              { value: '50K+', label: 'Happy Customers' },
              { value: '100+', label: 'Brands' },
            ].map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-4">
                {i > 0 && (
                  <div
                    className="hidden sm:block w-px h-8"
                    style={{ background: 'rgba(255,255,255,0.15)' }}
                  />
                )}
                <div>
                  <p
                    className="font-bold"
                    style={{ color: 'white', fontSize: '1.375rem', lineHeight: 1 }}
                  >
                    {stat.value}
                  </p>
                  <p
                    className="text-xs font-medium tracking-wide uppercase"
                    style={{ color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}
                  >
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5"
      >
        <span
          className="text-xs font-medium uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          Scroll
        </span>
        <div
          className="flex items-start justify-center rounded-full pt-2"
          style={{
            width: '24px',
            height: '38px',
            border: '1.5px solid rgba(255,255,255,0.2)',
          }}
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="rounded-full"
            style={{ width: '4px', height: '4px', background: 'rgba(255,255,255,0.55)' }}
          />
        </div>
      </motion.div>
    </section>
  );
}

// ─── Category Section ─────────────────────────────────────────

export function CategorySection() {
  return (
    <section style={{ padding: '6rem 0', background: 'var(--bg-primary)' }}>
      <div className="container">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '3.5rem' }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--purple-500)', marginBottom: '1rem' }}
          >
            Shop By Category
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.875rem, 4vw, 2.75rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            Explore Our Collections
          </h2>
        </motion.div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORIES.map((cat, index) => (
            <motion.div
              key={cat.value}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <Link
                to={`/products?category=${cat.value}`}
                className="group block rounded-2xl text-center no-underline transition-all duration-300"
                style={{
                  padding: '2.5rem 1.5rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
                  e.currentTarget.style.borderColor = 'var(--purple-300)';
                  e.currentTarget.style.background = 'var(--bg-card)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = 'var(--bg-secondary)';
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-5 transition-colors duration-300"
                  style={{
                    background: 'var(--purple-100)',
                    color: 'var(--purple-600)',
                  }}
                >
                  <ShoppingBag size={22} />
                </div>
                <h3
                  className="font-semibold text-sm tracking-wide"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {cat.label}
                </h3>
                <p
                  className="text-xs font-medium tracking-widest uppercase mt-2 flex items-center justify-center gap-1"
                  style={{ color: 'var(--purple-500)' }}
                >
                  Explore
                  <ArrowRight size={11} />
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features Section ─────────────────────────────────────────

export function FeaturesSection() {
  const features = [
    {
      icon: <Eye size={26} />,
      title: 'Virtual Try-On',
      desc: 'Upload a photo and see exactly how any garment looks on your body before purchasing.',
    },
    {
      icon: <Shirt size={26} />,
      title: 'Style Builder',
      desc: 'Curate complete outfits from our catalog and visualize every combination.',
    },
    {
      icon: <Sparkles size={26} />,
      title: 'AI Fashion Assistant',
      desc: 'Chat with our AI stylist for personalized outfit ideas based on your taste.',
    },
    {
      icon: <Zap size={26} />,
      title: 'Smart Size Guide',
      desc: 'Enter your measurements once — our AI recommends the perfect size every time.',
    },
  ];

  return (
    <section style={{ padding: '6rem 0', background: 'var(--bg-secondary)' }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '3.5rem' }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--gold-600)', marginBottom: '1rem' }}
          >
            Powered by AI
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.875rem, 4vw, 2.75rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            Shopping, Reimagined
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl transition-all duration-300"
              style={{
                padding: '2.5rem 2rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-xl)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--purple-200)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: 'var(--purple-100)', color: 'var(--purple-600)' }}
              >
                {feature.icon}
              </div>
              <h3
                className="font-bold mb-3"
                style={{
                  color: 'var(--text-primary)',
                  fontSize: '1.0625rem',
                  letterSpacing: '-0.01em',
                }}
              >
                {feature.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}
              >
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────

export function CTABanner() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: 'var(--gradient-hero)' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-20%',
          right: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 65%)',
          filter: 'blur(80px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-30%',
          left: '-5%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 65%)',
          filter: 'blur(80px)',
        }}
      />

      <div
        className="container relative z-10"
        style={{ paddingTop: '7rem', paddingBottom: '7rem' }}
      >
        <div
          className="grid grid-cols-1 lg:grid-cols-2"
          style={{ gap: '5rem', alignItems: 'center' }}
        >
          {/* Left — Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.45)', marginBottom: '1.5rem', letterSpacing: '0.14em' }}
            >
              Virtual Fitting Room
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 5vw, 3.25rem)',
                fontWeight: 800,
                color: 'white',
                lineHeight: 1.15,
                letterSpacing: '-0.025em',
                marginBottom: '1.75rem',
              }}
            >
              Find your perfect outfit{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, var(--gold-300), var(--gold-500))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                before you buy it.
              </span>
            </h2>
            <p
              style={{
                color: 'rgba(255,255,255,0.55)',
                fontSize: '1.0625rem',
                lineHeight: 1.95,
                maxWidth: '460px',
              }}
            >
              Our AI analyses your body shape, skin tone, and personal style to recommend
              outfits that look great — and shows you exactly how they fit, virtually.
            </p>
          </motion.div>

          {/* Right — Action Panel */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            {/* Feature checklist */}
            <div
              className="rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '2.5rem',
                marginBottom: '2rem',
                backdropFilter: 'blur(12px)',
              }}
            >
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {[
                  'Try any garment on a photo of yourself',
                  'See colour variants on your actual skin tone',
                  'Build full outfits — shirt, trousers, shoes',
                  'AI-powered size recommendation',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm"
                    style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}
                  >
                    <span
                      className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                      style={{ background: 'rgba(255,255,255,0.12)', fontSize: '0.6rem', color: 'var(--gold-300)' }}
                    >
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/try-on"
                className="no-underline flex items-center justify-center gap-2.5 font-semibold text-sm rounded-xl px-8 py-4 transition-all hover:-translate-y-0.5 flex-1 text-center"
                style={{
                  background: 'white',
                  color: 'var(--purple-900)',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
                }}
              >
                Start Virtual Try-On
              </Link>
              <Link
                to="/products"
                className="no-underline flex items-center justify-center gap-2.5 font-semibold text-sm rounded-xl px-8 py-4 transition-all hover:-translate-y-0.5 flex-1 text-center"
                style={{
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.85)',
                  border: '1px solid rgba(255,255,255,0.25)',
                }}
              >
                Browse Products
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
