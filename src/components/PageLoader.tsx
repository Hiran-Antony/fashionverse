import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MIN_DISPLAY_MS = 750;

export default function PageLoader() {
  const [visible, setVisible] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const start = Date.now();

    const hide = () => {
      const elapsed = Date.now() - start;
      const wait = Math.max(0, MIN_DISPLAY_MS - elapsed);
      setTimeout(() => {
        setVisible(false);
        setTimeout(() => setDone(true), 500);
      }, wait);
    };

    if (document.readyState === 'complete') {
      // Force it to wait at least MIN_DISPLAY_MS even if the document is already loaded
      hide();
    } else {
      window.addEventListener('load', hide);
      return () => window.removeEventListener('load', hide);
    }
  }, []);

  if (done) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="page-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden={!visible}
        >
          <div className="page-loader-inner">
            <svg
              className="page-loader-logo"
              viewBox="0 0 120 80"
              fill="none"
              aria-label="FashionVerse"
            >
              <path
                className="page-loader-stroke"
                d="M20 15 L20 55 M20 15 L50 15 M20 35 L42 35 M60 15 L75 55 L90 15"
                stroke="url(#loaderGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="loaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E8B4A0" />
                  <stop offset="100%" stopColor="#C9973A" />
                </linearGradient>
              </defs>
            </svg>
            <p className="page-loader-text">FashionVerse</p>
            <div className="page-loader-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
