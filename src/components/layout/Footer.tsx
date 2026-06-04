import { Link, useLocation } from 'react-router-dom';
import { Mail, Phone, MapPin, Globe, Share2, MessageCircle, AtSign } from 'lucide-react';
import { APP_NAME, CATEGORIES } from '../../utils/constants';

const QUICK_LINKS = [
  { to: '/products', label: 'Shop All' },
  { to: '/try-on', label: 'Virtual Try-On' },
  { to: '/style-builder', label: 'Style Builder' },
  { to: '/products?sort=newest', label: 'New Arrivals' },
  { to: '/account/orders', label: 'Track My Order' },
];

const COMPANY_LINKS = [
  { to: '/', label: 'About Us' },
  { to: '/', label: 'Careers' },
  { to: '/', label: 'Press' },
  { to: '/', label: 'Blog' },
];

const SOCIALS = [
  { icon: <AtSign size={16} />, href: '#', label: 'Instagram' },
  { icon: <MessageCircle size={16} />, href: '#', label: 'Twitter/X' },
  { icon: <Share2 size={16} />, href: '#', label: 'YouTube' },
  { icon: <Globe size={16} />, href: '#', label: 'LinkedIn' },
];

// Pages where we show ONLY a slim copyright bar, not the full footer
// Full footer only shows on the Home page (/)
const SLIM_FOOTER_PATHS = [
  '/products',
  '/product',
  '/account',
  '/cart',
  '/checkout',
  '/wishlist',
  '/order-confirmation',
  '/try-on',
  '/style-builder',
  '/admin-dashboard',
];

function SlimFooter() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-primary)',
        padding: '1.25rem 0',
      }}
    >
      <div className="container">
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
              style={{ background: 'var(--gradient-primary)' }}
            >
              FV
            </div>
            <span
              className="text-sm font-semibold"
              style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}
            >
              {APP_NAME}
            </span>
          </Link>

          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            {['Privacy', 'Terms', 'Refunds'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-xs no-underline transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--purple-600)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FullFooter() {
  return (
    <footer style={{ background: 'var(--gradient-dark)' }}>

      {/* ── TOP: Logo + Nav columns ─────────────────────── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="container">
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-16"
            style={{ paddingTop: '4rem', paddingBottom: '4rem' }}
          >
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-3 no-underline mb-5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  FV
                </div>
                <div>
                  <span
                    className="block text-lg font-bold"
                    style={{ color: 'white', fontFamily: 'var(--font-display)' }}
                  >
                    {APP_NAME}
                  </span>
                  <span className="block text-[10px] tracking-widest uppercase" style={{ color: 'var(--purple-300)' }}>
                    Where Style Meets Intelligence
                  </span>
                </div>
              </Link>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: 'rgba(255,255,255,0.4)', lineHeight: '1.85' }}
              >
                AI-powered fashion discovery with virtual try-on, curated collections, and style that understands you.
              </p>
              {/* Socials */}
              <div className="flex items-center gap-3">
                {SOCIALS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all no-underline"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.5)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--purple-600)';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.borderColor = 'var(--purple-600)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Shop Column */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Shop
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {CATEGORIES.map((cat) => (
                  <li key={cat.value}>
                    <Link
                      to={`/products?category=${cat.value}`}
                      className="text-sm no-underline transition-colors"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
                    >
                      {cat.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Links Column */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Quick Links
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {QUICK_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm no-underline transition-colors"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company + Contact Column */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Company
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '2rem' }}>
                {COMPANY_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm no-underline transition-colors"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Contact mini-block */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <a
                  href="tel:+919876543210"
                  className="flex items-center gap-2 no-underline text-xs transition-colors"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                >
                  <Phone size={12} /> +91 98765 43210
                </a>
                <a
                  href="mailto:hello@fashionverse.in"
                  className="flex items-center gap-2 no-underline text-xs transition-colors"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                >
                  <Mail size={12} /> hello@fashionverse.in
                </a>
                <span className="flex items-start gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <MapPin size={12} style={{ marginTop: '2px', flexShrink: 0 }} />
                  Mumbai, Maharashtra
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Newsletter Banner ────────────────────────────── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="container">
          <div
            className="flex flex-col md:flex-row items-center justify-between gap-6"
            style={{ paddingTop: '2.5rem', paddingBottom: '2.5rem' }}
          >
            <div>
              <p className="font-bold text-base text-white mb-1">
                Get exclusive drops & style tips 💌
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Join 50,000+ fashion-forward subscribers. No spam, ever.
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-64 text-sm rounded-xl px-4 py-3"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'white',
                  outline: 'none',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--purple-400)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
              />
              <button
                className="shrink-0 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ background: 'var(--gradient-primary)', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ────────────────────────────────────── */}
      <div className="container">
        <div
          className="flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}
        >
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved. Made with ❤️ in India.
          </p>
          <div className="flex items-center gap-6">
            {['Privacy Policy', 'Terms of Service', 'Refund Policy'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-xs no-underline transition-colors"
                style={{ color: 'rgba(255,255,255,0.2)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
              >
                {item}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {/* Payment badges */}
            {['Visa', 'MC', 'UPI', 'RuPay'].map((p) => (
              <span
                key={p}
                className="text-[10px] px-2 py-1 rounded font-semibold"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Footer() {
  const { pathname } = useLocation();

  // Show slim footer on utility/app pages, full footer on content pages
  const isSlimPage = SLIM_FOOTER_PATHS.some((p) => pathname.startsWith(p));

  return isSlimPage ? <SlimFooter /> : <FullFooter />;
}
