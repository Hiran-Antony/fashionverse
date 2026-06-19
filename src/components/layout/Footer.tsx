import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, Phone, MapPin, AtSign, MessageCircle, Share2, Globe } from 'lucide-react';
import { APP_NAME, CATEGORIES } from '../../utils/constants';
import BrandLogo from './BrandLogo';

const QUICK_LINKS = [
  { to: '/products', label: 'Shop All' },
  { to: '/try-on', label: 'Virtual Try-On' },
  { to: '/style-builder', label: 'FashionVerse AI' },
  { to: '/products?sort=newest', label: 'New Arrivals' },
  { to: '/account/orders', label: 'Track My Order' },
];

const HELP_LINKS = [
  { to: '/account', label: 'My Account' },
  { to: '/account/orders', label: 'Order Help' },
  { to: '/', label: 'Shipping & Returns' },
  { to: '/', label: 'Size Guide' },
  { to: '/', label: 'Contact Us' },
];

const SOCIALS = [
  { icon: <AtSign size={16} />, href: '#', label: 'Instagram', className: 'social--instagram' },
  { icon: <MessageCircle size={16} />, href: '#', label: 'Twitter', className: 'social--twitter' },
  { icon: <Share2 size={16} />, href: '#', label: 'YouTube', className: 'social--youtube' },
  { icon: <Globe size={16} />, href: '#', label: 'LinkedIn', className: 'social--linkedin' },
];

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
    <footer className="footer-slim">
      <div className="container">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <BrandLogo size="sm" showWordmark={false} />
          <p className="text-xs footer-slim-copy">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {['Privacy', 'Terms', 'Refunds'].map((item) => (
              <a key={item} href="#" className="footer-slim-link">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function EditorialFooter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  };

  return (
    <footer className="editorial-footer">
      <p className="editorial-footer-watermark" aria-hidden="true">
        FashionVerse
      </p>

      <div className="container editorial-footer-main">
        <div className="editorial-footer-grid">
          {/* Brand */}
          <div className="editorial-footer-brand" data-reveal="fade-up">
            <BrandLogo size="md" showWordmark={false} className="mb-5" />
            <p className="editorial-footer-story">
              AI-powered fashion discovery with virtual try-on, curated collections, and
              style that understands you — digital couture for the modern wardrobe.
            </p>
            <div className="editorial-footer-socials">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className={`editorial-social ${s.className}`}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div data-reveal="fade-up" data-reveal-delay="80">
            <p className="editorial-footer-heading">Shop</p>
            <ul className="editorial-footer-links">
              {CATEGORIES.map((cat) => (
                <li key={cat.value}>
                  <Link to={['men', 'women', 'kids'].includes(cat.value) ? `/${cat.value}` : `/products?category=${cat.value}`}>{cat.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore */}
          <div data-reveal="fade-up" data-reveal-delay="120">
            <p className="editorial-footer-heading">Explore</p>
            <ul className="editorial-footer-links">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div data-reveal="fade-up" data-reveal-delay="160">
            <p className="editorial-footer-heading">Help</p>
            <ul className="editorial-footer-links">
              {HELP_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
            <div className="editorial-footer-contact">
              <a href="tel:+919876543210">
                <Phone size={12} /> +91 98765 43210
              </a>
              <a href="mailto:hello@fashionverse.in">
                <Mail size={12} /> hello@fashionverse.in
              </a>
              <span>
                <MapPin size={12} /> Mumbai, Maharashtra
              </span>
            </div>
          </div>

          {/* Newsletter */}
          <div className="editorial-footer-newsletter" data-reveal="fade-up" data-reveal-delay="200">
            <p className="editorial-footer-heading">Newsletter</p>
            <p className="editorial-footer-newsletter-desc">
              Exclusive drops, style tips, and early access. Join 50,000+ subscribers.
            </p>
            <form className="editorial-newsletter" onSubmit={handleNewsletter}>
              <div className="input-float-wrap">
                <input
                  id="footer-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=" "
                  required
                  className="input-float editorial-newsletter-input"
                />
                <label htmlFor="footer-email">Your email</label>
              </div>
              <button
                type="submit"
                className="btn btn-gold editorial-newsletter-btn"
                data-magnetic
                disabled={submitted}
              >
                {submitted ? 'Subscribed ✓' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="editorial-footer-bottom">
        <div className="container editorial-footer-bottom-inner">
          <p className="editorial-footer-copy">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <p className="editorial-footer-made">Made with ♥ in India</p>
          <div className="editorial-footer-payments">
            {['Visa', 'MC', 'UPI', 'RuPay'].map((p) => (
              <span key={p}>{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Footer() {
  const { pathname } = useLocation();
  const isSlimPage = SLIM_FOOTER_PATHS.some((p) => pathname.startsWith(p));
  return isSlimPage ? <SlimFooter /> : <EditorialFooter />;
}
