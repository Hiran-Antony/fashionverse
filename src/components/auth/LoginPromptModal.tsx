import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Heart, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function LoginPromptModal() {
  const { showLoginPrompt, loginPromptReason, closeLoginPrompt, signInWithGoogle } = useAuthStore();

  const handleGoogleSignIn = async () => {
    closeLoginPrompt();
    await signInWithGoogle();
  };

  return (
    <AnimatePresence>
      {showLoginPrompt && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLoginPrompt}
            className="fixed inset-0 z-[100]"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed z-[101] left-1/2 -translate-x-1/2"
            style={{
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              maxWidth: '420px',
              padding: '0 1.25rem',
            }}
          >
            <div
              className="relative rounded-3xl overflow-hidden"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
              }}
            >
              {/* Purple top accent */}
              <div
                style={{
                  height: '4px',
                  background: 'var(--gradient-primary)',
                }}
              />

              {/* Close button */}
              <button
                onClick={closeLoginPrompt}
                className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{
                  background: 'var(--bg-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <X size={16} />
              </button>

              <div style={{ padding: '2.5rem 2rem 2rem' }}>
                {/* Icon */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                  style={{
                    background: 'var(--purple-100)',
                    color: 'var(--purple-600)',
                    marginBottom: '1.5rem',
                  }}
                >
                  <Lock size={28} />
                </div>

                {/* Text */}
                <div className="text-center" style={{ marginBottom: '2rem' }}>
                  <h2
                    className="font-bold"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.4rem',
                      color: 'var(--text-primary)',
                      marginBottom: '0.625rem',
                    }}
                  >
                    Sign in to continue
                  </h2>
                  <p
                    className="text-sm"
                    style={{
                      color: 'var(--text-muted)',
                      lineHeight: 1.7,
                    }}
                  >
                    You need to be signed in to {loginPromptReason}.
                    <br />
                    It only takes a second.
                  </p>
                </div>

                {/* Google Button */}
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 font-semibold text-sm rounded-xl transition-all hover:-translate-y-0.5"
                  style={{
                    padding: '0.9rem 1.5rem',
                    background: 'white',
                    color: '#1a1a1a',
                    border: '1px solid #e0e0e0',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    cursor: 'pointer',
                    marginBottom: '1rem',
                  }}
                >
                  {/* Google SVG */}
                  <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                    <path d="M47.532 24.552c0-1.636-.147-3.2-.422-4.704H24.48v8.898h12.985c-.56 3.02-2.256 5.578-4.804 7.294v6.065h7.776c4.548-4.19 7.093-10.356 7.093-17.553z" fill="#4285F4"/>
                    <path d="M24.48 48c6.515 0 11.985-2.16 15.98-5.855l-7.776-6.065c-2.159 1.446-4.919 2.302-8.204 2.302-6.31 0-11.655-4.262-13.566-9.988H2.867v6.254C6.844 42.858 15.08 48 24.48 48z" fill="#34A853"/>
                    <path d="M10.914 28.394A14.45 14.45 0 0 1 10.15 24c0-1.528.262-3.01.764-4.394v-6.254H2.867A23.952 23.952 0 0 0 .48 24c0 3.862.926 7.52 2.387 10.648l8.047-6.254z" fill="#FBBC05"/>
                    <path d="M24.48 9.618c3.557 0 6.75 1.224 9.263 3.628l6.95-6.95C36.454 2.39 30.989 0 24.48 0 15.08 0 6.844 5.142 2.867 13.352l8.047 6.254c1.911-5.726 7.256-9.988 13.566-9.988z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3" style={{ marginBottom: '1rem' }}>
                  <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
                  <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                </div>

                {/* Continue browsing */}
                <button
                  onClick={closeLoginPrompt}
                  className="w-full text-sm font-medium py-2.5 rounded-xl transition-colors"
                  style={{
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  Continue browsing as guest
                </button>

                {/* What you unlock */}
                <div
                  className="rounded-2xl mt-5"
                  style={{
                    background: 'var(--bg-secondary)',
                    padding: '1.25rem 1.5rem',
                  }}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--text-muted)', marginBottom: '0.875rem' }}
                  >
                    With an account you can
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {[
                      { icon: <ShoppingBag size={14} />, text: 'Add items to your cart and checkout' },
                      { icon: <Heart size={14} />, text: 'Save items to your wishlist' },
                      { icon: <Lock size={14} />, text: 'Track your orders securely' },
                    ].map((item) => (
                      <li
                        key={item.text}
                        className="flex items-center gap-2.5 text-xs"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <span style={{ color: 'var(--purple-500)' }}>{item.icon}</span>
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
