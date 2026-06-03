import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { APP_NAME, CATEGORIES } from '../../utils/constants';

const QUICK_LINKS = [
  { to: '/products', label: 'Shop All' },
  { to: '/try-on', label: 'Virtual Try-On' },
  { to: '/style-builder', label: 'Style Builder' },
  { to: '/products?sort=newest', label: 'New Arrivals' },
  { to: '/account/orders', label: 'Track My Order' },
  { to: '/auth', label: 'My Account' },
];

const COMPANY_LINKS = [
  { to: '/', label: 'About Us' },
  { to: '/', label: 'Careers' },
  { to: '/', label: 'Press' },
  { to: '/', label: 'Blog' },
];

export default function Footer() {
  return (
    <footer style={{ background: 'var(--gradient-dark)' }}>

      {/* ── TOP NAV STRIP ─────────────────────────────── */}
      {/* Full-width strip: Logo left, nav links centered, tagline right */}
      <div
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="container">
          <div
            className="flex flex-col lg:flex-row lg:items-center justify-between"
            style={{ paddingTop: '3.5rem', paddingBottom: '3.5rem', gap: '2.5rem' }}
          >
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 no-underline shrink-0">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                style={{ background: 'var(--gradient-primary)' }}
              >
                FV
              </div>
              <div>
                <span
                  className="block text-xl font-bold tracking-tight"
                  style={{ color: 'white', fontFamily: 'var(--font-display)' }}
                >
                  {APP_NAME}
                </span>
                <span className="block text-xs tracking-widest uppercase" style={{ color: 'var(--purple-300)', marginTop: '2px' }}>
                  Where Style Meets Intelligence
                </span>
              </div>
            </Link>

            {/* Categories Navigation */}
            <nav>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                Shop By Category
              </p>
              <div className="flex flex-wrap gap-x-8 gap-y-3">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.value}
                    to={`/products?category=${cat.value}`}
                    className="text-sm font-medium no-underline tracking-wide transition-colors"
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            </nav>

            {/* Quick Links Navigation */}
            <nav>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                Quick Links
              </p>
              <div className="flex flex-wrap gap-x-8 gap-y-3">
                {QUICK_LINKS.map((link) => (
                  <Link
                    key={link.to + link.label}
                    to={link.to}
                    className="text-sm font-medium no-underline tracking-wide transition-colors"
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* ── MIDDLE SECTION: Brand info + Contact ─────── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="container">
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            style={{ paddingTop: '4rem', paddingBottom: '4rem', gap: '4rem' }}
          >
            {/* Brand Description */}
            <div style={{ maxWidth: '320px' }}>
              <h3
                className="font-bold"
                style={{
                  color: 'white',
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.5rem',
                  lineHeight: '1.3',
                  marginBottom: '1.25rem',
                }}
              >
                The future of fashion is personal.
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.45)', lineHeight: '1.9' }}
              >
                FashionVerse combines AI-powered recommendations, a virtual try-on studio, and curated collections to give you a shopping experience that truly understands your style.
              </p>
            </div>

            {/* Contact Details */}
            <div>
              <h4
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.35)', marginBottom: '1.5rem' }}
              >
                Contact Us
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '1px',
                    }}
                  >
                    <MapPin size={14} style={{ color: 'var(--purple-300)' }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '3px' }}>Location</p>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>
                      123 Fashion Street<br />Mumbai, Maharashtra 400001
                    </p>
                  </div>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Phone size={14} style={{ color: 'var(--purple-300)' }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '3px' }}>Phone</p>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>+91 98765 43210</p>
                  </div>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Mail size={14} style={{ color: 'var(--purple-300)' }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '3px' }}>Email</p>
                    <a
                      href="mailto:hello@fashionverse.in"
                      className="text-sm no-underline transition-colors"
                      style={{ color: 'rgba(255,255,255,0.6)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                    >
                      hello@fashionverse.in
                    </a>
                  </div>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.35)', marginBottom: '1.5rem' }}
              >
                Company
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM BAR ────────────────────────────────── */}
      <div className="container">
        <div
          className="flex flex-col md:flex-row items-center justify-between"
          style={{ paddingTop: '1.75rem', paddingBottom: '1.75rem', gap: '1rem' }}
        >
          <p
            className="text-xs tracking-wide"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-8">
            {['Privacy Policy', 'Terms of Service', 'Refund Policy'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-xs tracking-wide no-underline transition-colors"
                style={{ color: 'rgba(255,255,255,0.25)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
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
