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
  Home,
  Shirt,
  Sparkles,
  Baby,
  Camera,
  Bot,
  ChevronRight,
} from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';
import BrandLogo from './BrandLogo';


// ─── Main Navbar ─────────────────────────────────────────────────



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
    if (isMobileMenuOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.classList.add('menu-open');
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.body.classList.remove('menu-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.body.classList.remove('menu-open');
    };
  }, [isMobileMenuOpen]);

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
        className={`cinematic-nav fixed top-0 left-0 right-0 z-[100]${isScrolled || !isHomePage ? ' cinematic-nav--scrolled' : ''}`}
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

            {/* Direct Category Links */}
            <NavLink
              to="/men"
              label="Men"
              isActive={location.pathname === '/men'}
              isLight={!isScrolled && isHomePage}
            />
            <NavLink
              to="/women"
              label="Women"
              isActive={location.pathname === '/women'}
              isLight={!isScrolled && isHomePage}
            />
            <NavLink
              to="/kids"
              label="Kids"
              isActive={location.pathname === '/kids'}
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
              label="FashionVerse AI"
              isActive={location.pathname === '/style-builder'}
              isLight={!isScrolled && isHomePage}
            />
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <IconBtn
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              label="Search"
              isLight={!isScrolled && isHomePage}
              className="w-8 h-8 sm:w-10 sm:h-10"
            >
              <Search size={18} className="sm:w-[19px] sm:h-[19px]" />
            </IconBtn>

            <IconBtn
              onClick={toggleTheme}
              label="Toggle theme"
              isLight={!isScrolled && isHomePage}
              className="w-8 h-8 sm:w-10 sm:h-10 flex"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === 'light' ? <Moon size={18} className="sm:w-[19px] sm:h-[19px]" /> : <Sun size={18} className="sm:w-[19px] sm:h-[19px]" />}
                </motion.div>
              </AnimatePresence>
            </IconBtn>

            <Link
              to="/wishlist"
              className="relative flex w-8 h-8 sm:w-10 sm:h-10 items-center justify-center rounded-xl transition-colors no-underline"
              style={{ color: !isScrolled && isHomePage ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = !isScrolled && isHomePage ? 'rgba(255,255,255,0.1)' : 'var(--bg-secondary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
              aria-label="Wishlist"
            >
              <Heart size={18} className="sm:w-[19px] sm:h-[19px]" />
              {wishlistItems.length > 0 && (
                <span
                  className="absolute top-0 right-0 sm:top-1 sm:right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full text-white text-[0.55rem] sm:text-[0.6rem] font-bold flex items-center justify-center"
                  style={{ background: 'var(--error)' }}
                >
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            <button
              id="nav-cart-btn"
              onClick={openCart}
              className={`cinematic-nav-icon relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center${cartBounce ? ' cart-bounce' : ''}`}
              data-light={!isScrolled && isHomePage ? 'true' : 'false'}
              aria-label="Cart"
            >
              <ShoppingBag size={18} className="sm:w-[19px] sm:h-[19px]" />
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="cinematic-nav-badge absolute top-0 right-0 sm:top-1 sm:right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full text-white text-[0.55rem] sm:text-[0.6rem] font-bold flex items-center justify-center"
                >
                  {cartCount}
                </motion.span>
              )}
            </button>

            {user ? (
              <div className="relative hidden sm:block" ref={userMenuRef}>
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
                      className="profile-dropdown"
                    >
                      <div className="profile-dropdown-header">
                        <p className="profile-dropdown-name">
                          {profile?.name || user.user_metadata?.full_name || 'User'}
                          {profile?.role === 'admin' && <span className="profile-admin-badge ml-2">Admin</span>}
                        </p>
                        <p className="profile-dropdown-email">
                          {user.email}
                        </p>
                      </div>
                      <div className="profile-dropdown-menu">
                        <UserMenuItem to="/account" icon={<User />} label="My Account" />
                        <UserMenuItem to="/account/orders" icon={<Package />} label="My Orders" />
                        <UserMenuItem to="/account/addresses" icon={<MapPin />} label="Saved Addresses" />
                        <UserMenuItem to="/wishlist" icon={<Heart />} label="Wishlist" />
                        <div className="profile-dropdown-divider" />
                        <button
                          onClick={handleSignOut}
                          className="profile-dropdown-signout"
                        >
                          <LogOut />
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
                className="hidden sm:flex btn btn-primary px-3 py-1.5 text-xs sm:btn-sm sm:px-4 sm:py-2 no-underline ml-1 sm:ml-2"
              >
                Sign In
              </Link>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`hamburger-btn cinematic-hamburger lg:hidden ml-1 sm:ml-2${isMobileMenuOpen ? ' open' : ''}`}
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
            className="fixed z-40 left-0 right-0 bottom-0 px-6 py-10 search-overlay"
            style={{ top: 'var(--nav-height)' }}
          >
            <form onSubmit={handleSearch} className="container max-w-2xl mx-auto">
              <p className="search-recent-label">Search FASHIONVERSE</p>
              <div className="search-input-wrapper">
                <Search className="search-input-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for shirts, dresses, shoes..."
                  className="search-input"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="search-close-btn flex items-center justify-center p-1"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-5">
                <button type="button" className="search-chip" onClick={() => { setSearchQuery('Summer Collection'); handleSearch(new Event('submit') as any); }}>Summer Collection</button>
                <button type="button" className="search-chip" onClick={() => { setSearchQuery('Sneakers'); handleSearch(new Event('submit') as any); }}>Sneakers</button>
                <button type="button" className="search-chip" onClick={() => { setSearchQuery('Dresses'); handleSearch(new Event('submit') as any); }}>Dresses</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <div
              className="mobile-menu-overlay lg:hidden"
              onWheel={(e) => e.stopPropagation()}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="mobile-menu-panel lg:hidden" onWheel={(e) => e.stopPropagation()}>
              <div className="menu-panel-header">
                <div className="menu-panel-logo">
                  <span className="menu-panel-logo-text">FASHIONVERSE</span>
                </div>
                <button className="menu-close-btn" onClick={() => setIsMobileMenuOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col flex-1 pb-6">
                <div className="menu-section-label">MAIN NAVIGATION</div>
                
                <Link to="/" className={`menu-nav-item ${location.pathname === '/' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="menu-item-icon"><Home size={20} /></div>
                  <div className="menu-item-text">
                    <span className="menu-item-label">Home</span>
                    <span className="menu-item-desc">Back to homepage</span>
                  </div>
                  <ChevronRight className="menu-item-arrow" size={16} />
                </Link>
                
                <Link to="/men" className={`menu-nav-item ${location.pathname === '/men' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="menu-item-icon"><Shirt size={20} /></div>
                  <div className="menu-item-text">
                    <span className="menu-item-label">Men</span>
                    <span className="menu-item-desc">Men's collection</span>
                  </div>
                  <ChevronRight className="menu-item-arrow" size={16} />
                </Link>

                <Link to="/women" className={`menu-nav-item ${location.pathname === '/women' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="menu-item-icon"><Sparkles size={20} /></div>
                  <div className="menu-item-text">
                    <span className="menu-item-label">Women</span>
                    <span className="menu-item-desc">Women's collection</span>
                  </div>
                  <ChevronRight className="menu-item-arrow" size={16} />
                </Link>

                <Link to="/kids" className={`menu-nav-item ${location.pathname === '/kids' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="menu-item-icon"><Baby size={20} /></div>
                  <div className="menu-item-text">
                    <span className="menu-item-label">Kids</span>
                    <span className="menu-item-desc">Kids collection</span>
                  </div>
                  <ChevronRight className="menu-item-arrow" size={16} />
                </Link>

                <div className="menu-divider" />
                <div className="menu-section-label">FEATURES</div>

                <Link to="/try-on" className={`menu-nav-item ${location.pathname === '/try-on' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="menu-item-icon"><Camera size={20} /></div>
                  <div className="menu-item-text">
                    <span className="menu-item-label">Try On</span>
                    <span className="menu-item-desc">Virtual fitting room</span>
                  </div>
                  <ChevronRight className="menu-item-arrow" size={16} />
                </Link>

                <Link to="/style-builder" className={`menu-nav-item ${location.pathname === '/style-builder' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="menu-item-icon"><Bot size={20} /></div>
                  <div className="menu-item-text">
                    <span className="menu-item-label">FashionVerse AI</span>
                    <span className="menu-item-desc">AI style assistant</span>
                  </div>
                  <ChevronRight className="menu-item-arrow" size={16} />
                </Link>

                <Link to="/wishlist" className={`menu-nav-item ${location.pathname === '/wishlist' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="menu-item-icon"><Heart size={20} /></div>
                  <div className="menu-item-text">
                    <span className="menu-item-label">Wishlist</span>
                    <span className="menu-item-desc">Saved items</span>
                  </div>
                  <ChevronRight className="menu-item-arrow" size={16} />
                </Link>

                <div className="menu-divider" />
                <div className="menu-section-label">ACCOUNT</div>

                <Link to={user ? "/account" : "/auth"} className={`menu-nav-item ${location.pathname === '/account' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="menu-item-icon"><User size={20} /></div>
                  <div className="menu-item-text">
                    <span className="menu-item-label">{user ? "My Account" : "Sign In"}</span>
                    <span className="menu-item-desc">{user ? "Profile & orders" : "Login or create account"}</span>
                  </div>
                  <ChevronRight className="menu-item-arrow" size={16} />
                </Link>

                <button className="menu-nav-item w-full text-left" onClick={() => { setIsMobileMenuOpen(false); openCart(); }} style={{ background: 'transparent', border: 'none' }}>
                  <div className="menu-item-icon relative">
                    <ShoppingBag size={20} />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center bg-[var(--gold-500)] text-black">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <div className="menu-item-text">
                    <span className="menu-item-label">Cart</span>
                    <span className="menu-item-desc">{cartCount} items</span>
                  </div>
                  <ChevronRight className="menu-item-arrow" size={16} />
                </button>

                <div className="menu-divider" />
                <div className="menu-theme-row">
                  <div className="menu-theme-label">
                    <div className="icon">
                      {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
                    </div>
                    <span>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="w-12 h-6 rounded-full relative transition-colors"
                    style={{ background: 'rgba(201,151,58,0.2)', border: '1px solid rgba(201,151,58,0.3)', cursor: 'pointer' }}
                  >
                    <motion.div
                      className="absolute top-[3px] left-[3px] w-[16px] h-[16px] rounded-full"
                      style={{ background: '#C9973A' }}
                      animate={{ x: theme === 'dark' ? 24 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </div>

              <div className="menu-panel-footer">
                <p className="menu-footer-text">FASHIONVERSE © 2026</p>
              </div>
            </div>
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
      className="profile-dropdown-item"
    >
      {icon}
      {label}
    </Link>
  );
}
