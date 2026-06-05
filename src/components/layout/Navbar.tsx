import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  X,
  Sun,
  Moon,
  LogOut,
  Package,
  MapPin,
  ChevronDown,
} from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';
import { CATEGORIES } from '../../utils/constants';
import BrandLogo from './BrandLogo';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { getItemCount, openCart } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const { user, profile, signOut } = useAuthStore();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const prevCartCount = useRef(0);
  const [cartBounce, setCartBounce] = useState(false);
  const cartCount = getItemCount();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (cartCount > prevCartCount.current) {
      setCartBounce(true);
      const t = setTimeout(() => setCartBounce(false), 650);
      prevCartCount.current = cartCount;
      return () => clearTimeout(t);
    }
    prevCartCount.current = cartCount;
  }, [cartCount]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const isHomePage = location.pathname === '/';

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={`cinematic-nav fixed top-0 left-0 right-0 z-50${isScrolled || !isHomePage ? ' cinematic-nav--scrolled' : ''}`}
      >
        <div className="container h-full flex items-center justify-between">

          <BrandLogo
            size="md"
            showWordmark={false}
            className="brand-logo-link--spin"
          />

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-10">
            <NavLink
              to="/"
              label="Home"
              isActive={location.pathname === '/'}
              isLight={!isScrolled && isHomePage}
            />

            {/* Categories Dropdown */}
            <div className="relative group">
              <button
                className="flex items-center gap-1.5 text-sm font-medium tracking-wide transition-colors"
                style={{
                  color: !isScrolled && isHomePage ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem 0',
                }}
              >
                Categories
                <ChevronDown size={13} className="transition-transform duration-200 group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
                <div
                  className="rounded-2xl overflow-hidden shadow-2xl"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-color)',
                    minWidth: '180px',
                    padding: '0.5rem',
                  }}
                >
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.value}
                      to={`/products?category=${cat.value}`}
                      className="flex items-center px-4 py-3 rounded-xl text-sm font-medium no-underline transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                        e.currentTarget.style.color = 'var(--purple-600)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      {cat.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <NavLink
              to="/products"
              label="Shop All"
              isActive={location.pathname === '/products'}
              isLight={!isScrolled && isHomePage}
            />
            <NavLink
              to="/try-on"
              label="Try On"
              isActive={location.pathname === '/try-on'}
              isLight={!isScrolled && isHomePage}
            />
            <NavLink
              to="/style-builder"
              label="Style Builder"
              isActive={location.pathname === '/style-builder'}
              isLight={!isScrolled && isHomePage}
            />
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            <IconBtn
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              label="Search"
              isLight={!isScrolled && isHomePage}
            >
              <Search size={19} />
            </IconBtn>

            <IconBtn
              onClick={toggleTheme}
              label="Toggle theme"
              isLight={!isScrolled && isHomePage}
              className="hidden sm:flex"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
                </motion.div>
              </AnimatePresence>
            </IconBtn>

            <Link
              to="/wishlist"
              className="relative hidden sm:flex w-10 h-10 items-center justify-center rounded-xl transition-colors no-underline"
              style={{ color: !isScrolled && isHomePage ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = !isScrolled && isHomePage ? 'rgba(255,255,255,0.1)' : 'var(--bg-secondary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
              aria-label="Wishlist"
            >
              <Heart size={19} />
              {wishlistItems.length > 0 && (
                <span
                  className="absolute top-1 right-1 w-4 h-4 rounded-full text-white text-[0.6rem] font-bold flex items-center justify-center"
                  style={{ background: 'var(--error)' }}
                >
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            <button
              id="nav-cart-btn"
              onClick={openCart}
              className={`cinematic-nav-icon relative${cartBounce ? ' cart-bounce' : ''}`}
              data-light={!isScrolled && isHomePage ? 'true' : 'false'}
              aria-label="Cart"
            >
              <ShoppingBag size={19} />
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="cinematic-nav-badge"
                >
                  {cartCount}
                </motion.span>
              )}
            </button>

            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                  aria-label="User menu"
                >
                  {(profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture) ? (
                    <img
                      src={profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture}
                      alt="Avatar"
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover border-2"
                      style={{ borderColor: 'var(--purple-400)' }}
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ background: 'var(--gradient-primary)' }}
                    >
                      {profile?.name?.charAt(0)?.toUpperCase() || user.user_metadata?.full_name?.charAt(0)?.toUpperCase() || user.user_metadata?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </button>
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 rounded-2xl overflow-hidden"
                      style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-xl)',
                      }}
                    >
                      <div
                        className="px-5 py-4"
                        style={{ borderBottom: '1px solid var(--border-color)' }}
                      >
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {profile?.name || user.user_metadata?.full_name || 'User'}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {user.email}
                        </p>
                      </div>
                      <div className="p-2">
                        <UserMenuItem to="/account" icon={<User size={15} />} label="My Account" />
                        <UserMenuItem to="/account/orders" icon={<Package size={15} />} label="My Orders" />
                        <UserMenuItem to="/account/addresses" icon={<MapPin size={15} />} label="Saved Addresses" />
                        <UserMenuItem to="/wishlist" icon={<Heart size={15} />} label="Wishlist" />
                        <div style={{ height: '1px', background: 'var(--border-light)', margin: '0.375rem 0.5rem' }} />
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                          style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <LogOut size={15} />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/auth"
                className="hidden sm:flex btn btn-primary btn-sm no-underline ml-2"
              >
                Sign In
              </Link>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`cinematic-hamburger lg:hidden${isMobileMenuOpen ? ' is-open' : ''}`}
              data-light={!isScrolled && isHomePage ? 'true' : 'false'}
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="cinematic-hamburger-line" />
              <span className="cinematic-hamburger-line" />
              <span className="cinematic-hamburger-line" />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Search Bar */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed z-40 left-0 right-0 px-6 py-4 shadow-xl"
            style={{
              top: 'var(--nav-height)',
              background: 'var(--bg-elevated)',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <form onSubmit={handleSearch} className="container max-w-2xl mx-auto">
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  size={18}
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for shirts, dresses, shoes..."
                  className="input pl-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <X size={17} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu — full-screen dark overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="cinematic-mobile-backdrop lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="cinematic-mobile-menu lg:hidden"
            >
            <div className="p-8 flex flex-col gap-1">
              <MobileNavLink to="/" label="Home" onClick={() => setIsMobileMenuOpen(false)} />

              <div style={{ paddingTop: '1.5rem', paddingBottom: '0.5rem' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
                  Categories
                </p>
                <div className="flex flex-col gap-1">
                  {CATEGORIES.map((cat) => (
                    <MobileNavLink
                      key={cat.value}
                      to={`/products?category=${cat.value}`}
                      label={cat.label}
                      onClick={() => setIsMobileMenuOpen(false)}
                      secondary
                    />
                  ))}
                </div>
              </div>

              <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.75rem 0' }} />
              <MobileNavLink to="/products" label="Shop All" onClick={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink to="/try-on" label="Virtual Try-On" onClick={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink to="/style-builder" label="Style Builder" onClick={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink to="/wishlist" label="Wishlist" onClick={() => setIsMobileMenuOpen(false)} />

              <div
                style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}
                className="flex items-center justify-between"
              >
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                </span>
                <button
                  onClick={toggleTheme}
                  className="w-10 h-10 flex items-center justify-center rounded-xl"
                  style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer' }}
                >
                  {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
                </button>
              </div>

              {!user && (
                <Link
                  to="/auth"
                  className="btn btn-primary w-full no-underline mt-4"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────────

function NavLink({
  to,
  label,
  isActive,
  isLight = false,
}: {
  to: string;
  label: string;
  isActive: boolean;
  isLight?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`cinematic-nav-link${isActive ? ' is-active' : ''}${isLight ? ' is-light' : ''}`}
    >
      {label}
    </Link>
  );
}

function IconBtn({
  onClick,
  label,
  children,
  isLight = false,
  className = '',
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  isLight?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${className}`}
      style={{
        color: isLight ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isLight ? 'rgba(255,255,255,0.1)' : 'var(--bg-secondary)';
        e.currentTarget.style.color = isLight ? 'white' : 'var(--text-primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = isLight ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)';
      }}
    >
      {children}
    </button>
  );
}

function MobileNavLink({
  to,
  label,
  onClick,
  secondary = false,
}: {
  to: string;
  label: string;
  onClick: () => void;
  secondary?: boolean;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center px-4 py-3 rounded-xl text-base font-medium no-underline transition-colors"
      style={{
        color: secondary ? 'var(--text-secondary)' : 'var(--text-primary)',
        fontSize: secondary ? '0.9375rem' : '1rem',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {label}
    </Link>
  );
}

function UserMenuItem({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium no-underline transition-colors"
      style={{ color: 'var(--text-secondary)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg-secondary)';
        e.currentTarget.style.color = 'var(--text-primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
    >
      {icon}
      {label}
    </Link>
  );
}
