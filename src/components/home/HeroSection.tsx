import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Eye, Shirt } from 'lucide-react';

// ─── Features Section ─────────────────────────────────────────

export function FeaturesSection() {
  const features = [
    {
      icon: <Eye size={26} />,
      title: 'Virtual Try-On',
      desc: 'Upload a photo and see exactly how any garment looks on your body before purchasing.',
      link: '/try-on',
    },
    {
      icon: <Shirt size={26} />,
      title: 'FashionVerse AI',
      desc: 'Curate complete outfits from our catalog and visualize every combination.',
      link: '/style-builder',
    },
    {
      icon: <Sparkles size={26} />,
      title: 'AI Fashion Assistant',
      desc: 'Chat with our AI stylist for personalized outfit ideas based on your taste.',
      link: '/style-builder',
    },
    {
      icon: <Zap size={26} />,
      title: 'Smart Size Guide',
      desc: 'Enter your measurements once — our AI recommends the perfect size every time.',
      link: '/style-builder',
    },
  ];

  return (
    <section style={{ padding: '6rem 0', background: 'var(--bg-secondary)', borderTop: '1px solid rgba(201, 151, 58, 0.15)' }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '3.5rem' }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: '#C08552', marginBottom: '1rem' }}
          >
            Powered by AI
          </p>
          <h2
            style={{
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
            >
              <Link
                to={feature.link}
                className="rounded-2xl transition-all duration-300 block h-full"
                style={{
                  padding: '2.5rem 2rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-xl)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-glow)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--glow-gold-soft)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: 'rgba(192,133,82,0.15)', color: '#C08552', boxShadow: 'var(--glow-gold-soft)' }}
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
              </Link>
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
          background: 'radial-gradient(circle, rgba(96,165,250,0.2) 0%, transparent 65%)',
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
          background: 'radial-gradient(circle, rgba(201,151,58,0.35) 0%, transparent 65%)',
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
                  background: 'linear-gradient(135deg, #D4A935, #E8B84B)',
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
                      style={{ background: 'rgba(192,133,82,0.2)', fontSize: '0.6rem', color: '#C08552' }}
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
                  background: 'linear-gradient(135deg, #C9973A, #A07828)',
                  color: '#F0F8FF',
                  boxShadow: '0 8px 32px rgba(201,151,58,0.5)',
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

