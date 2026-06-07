import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ShoppingBag, Heart, Sparkles, Shield, Mail, Lock, User, Eye, EyeOff, Loader, ArrowRight } from 'lucide-react';
import BrandLogo from '../components/layout/BrandLogo';
import { supabase } from '../lib/supabase';

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
  
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isGoogleError, setIsGoogleError] = useState(false);

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setIsGoogleError(false);

    const cleanEmail = email.trim();

    try {
      if (mode === 'signUp') {
        // Step 1: Check if an account with this email already exists
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', cleanEmail)
          .single();

        if (existingUser) {
          setError('An account with this email already exists. Please sign in instead.');
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });
        if (error) throw error;
        if (data.user && !data.session) {
          setSuccess('Registration successful! Please check your email to confirm your account.');
          setIsLoading(false);
          return;
        }
      } else {
        // Step 1: Check if this email was registered via Google OAuth
        const { data: userData } = await supabase
          .from('profiles')
          .select('provider')
          .eq('email', cleanEmail)
          .single();

        // Step 2: If Google user tries to use email/password — show friendly message
        if (userData?.provider === 'google') {
          setIsGoogleError(true);
          setError(
            'This account was created with Google. Please use "Continue with Google" to sign in.'
          );
          setIsLoading(false);
          return;
        }

        // Step 3: Otherwise proceed with normal email/password sign in
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>

      {/* ── LEFT PANEL ─────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #120a06 0%, #A07828 45%, #1a0f08 100%)' }}
      >
        {/* Decorative orb top-right */}
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.55, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: '-80px', right: '-80px',
            width: '420px', height: '420px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(96,165,250,0.35) 0%, transparent 70%)',
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
            background: 'radial-gradient(circle, rgba(201,151,58,0.25) 0%, transparent 70%)',
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
                background: 'linear-gradient(135deg, #D4A935 0%, #E8B84B 100%)',
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

          <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: '0.75rem', letterSpacing: '0.04em' }}>
            Trusted by 50,000+ shoppers across India
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────── */}
      <div
        className="flex-1 flex flex-col items-center justify-center relative"
        style={{ padding: '3rem 2rem', background: 'var(--bg-primary)' }}
      >
        <div className="lg:hidden" style={{ marginBottom: '2.5rem' }}>
          <BrandLogo size="md" showWordmark={false} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="auth-card"
        >
          {/* Mode Toggle */}
          <div className="auth-toggle-wrapper">
            <button
              onClick={() => { setMode('signIn'); setError(null); setSuccess(null); setIsGoogleError(false); }}
              className={`auth-toggle-btn ${mode === 'signIn' ? 'active' : ''}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signUp'); setError(null); setSuccess(null); setIsGoogleError(false); }}
              className={`auth-toggle-btn ${mode === 'signUp' ? 'active' : ''}`}
            >
              Create Account
            </button>
          </div>

          <div>
            <h2 className="auth-heading">
              {mode === 'signIn' ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="auth-subheading">
              {mode === 'signIn' 
                ? 'Sign in to your account to continue shopping.' 
                : 'Enter your details below to join FashionVerse.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="popLayout">
              {mode === 'signUp' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="auth-input-wrapper"
                >
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="auth-input"
                  />
                  <div className="auth-input-icon">
                    <User size={18} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="auth-input-wrapper">
              <input
                type="email"
                required
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
              />
              <div className="auth-input-icon">
                <Mail size={18} />
              </div>
            </div>

            <div className="auth-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="auth-password-toggle"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {mode === 'signIn' && (
              <div className="auth-forgot-link">
                <a href="#">
                  Forgot Password?
                </a>
              </div>
            )}

            {error && (
              <div className={isGoogleError ? "auth-error-google" : "auth-error-msg"}>
                {isGoogleError && (
                   <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                    <path d="M47.532 24.552c0-1.636-.147-3.2-.422-4.704H24.48v8.898h12.985c-.56 3.02-2.256 5.578-4.804 7.294v6.065h7.776c4.548-4.19 7.093-10.356 7.093-17.553z" fill="#4285F4"/>
                    <path d="M24.48 48c6.515 0 11.985-2.16 15.98-5.855l-7.776-6.065c-2.159 1.446-4.919 2.302-8.204 2.302-6.31 0-11.655-4.262-13.566-9.988H2.867v6.254C6.844 42.858 15.08 48 24.48 48z" fill="#34A853"/>
                    <path d="M10.914 28.394A14.45 14.45 0 0 1 10.15 24c0-1.528.262-3.01.764-4.394v-6.254H2.867A23.952 23.952 0 0 0 .48 24c0 3.862.926 7.52 2.387 10.648l8.047-6.254z" fill="#FBBC05"/>
                    <path d="M24.48 9.618c3.557 0 6.75 1.224 9.263 3.628l6.95-6.95C36.454 2.39 30.989 0 24.48 0 15.08 0 6.844 5.142 2.867 13.352l8.047 6.254c1.911-5.726 7.256-9.988 13.566-9.988z" fill="#EA4335"/>
                  </svg>
                )}
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="auth-success-msg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="auth-submit-btn"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {isLoading ? (
                <Loader className="animate-spin" size={20} />
              ) : (
                <>
                  {mode === 'signIn' ? 'Sign In' : 'Create Account'}
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">or continue with</span>
            <div className="auth-divider-line" />
          </div>

          {/* Google Sign-In */}
          <button
            onClick={signInWithGoogle}
            className={`auth-google-btn ${isGoogleError ? 'highlighted' : ''}`}
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
          <div className="auth-terms">
            By continuing, you agree to our{' '}
            <a href="#">Terms of Service</a>
            {' '}and{' '}
            <a href="#">Privacy Policy</a>.
          </div>

          {/* Guest link */}
          <a href="/" className="auth-guest-link">
            Continue browsing as guest
          </a>
        </motion.div>
      </div>
    </div>
  );
}
