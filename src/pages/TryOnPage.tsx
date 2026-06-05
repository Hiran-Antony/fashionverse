import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, Sparkles, ArrowRight, Shirt } from 'lucide-react';

type TryOnPhase = 'idle' | 'active' | 'analyzing' | 'result';

const TYPEWRITER_LINES = [
  'Mapping body proportions...',
  'Matching fabric drape...',
  'Calibrating lighting...',
  'Rendering fit preview...',
];

const DEMO_RESULT =
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80';

export default function TryOnPage() {
  const [phase, setPhase] = useState<TryOnPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [typeLine, setTypeLine] = useState(0);
  const [typeText, setTypeText] = useState('');

  useEffect(() => {
    if (phase !== 'analyzing') return;

    setProgress(0);
    const progressTimer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(progressTimer);
          setTimeout(() => setPhase('result'), 400);
          return 100;
        }
        return p + 2;
      });
    }, 60);

    return () => clearInterval(progressTimer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'analyzing') return;

    const full = TYPEWRITER_LINES[typeLine] ?? '';
    let i = 0;
    setTypeText('');

    const tick = setInterval(() => {
      i += 1;
      setTypeText(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(tick);
        setTimeout(() => setTypeLine((l) => (l + 1) % TYPEWRITER_LINES.length), 500);
      }
    }, 35);

    return () => clearInterval(tick);
  }, [phase, typeLine]);

  const startDemo = () => {
    setTypeLine(0);
    setPhase('active');
    setTimeout(() => setPhase('analyzing'), 800);
  };

  return (
    <div className="tryon-page">
      <div className="container tryon-container">
        <header className="tryon-header" data-reveal="fade-up">
          <p className="tryon-eyebrow">AI-Powered Fitting Room</p>
          <h1 className="tryon-title">Virtual Try-On</h1>
          <p className="tryon-subtitle">
            Upload a photo or use your camera — our AI maps your silhouette and previews
            how each garment fits. Full functionality coming soon.
          </p>
        </header>

        <div className="tryon-split">
          {/* Left — capture / upload */}
          <div className="tryon-panel tryon-panel--capture" data-reveal="fade-up" data-reveal-delay="100">
            <div className="tryon-panel-label">
              <Camera size={16} />
              Capture Zone
            </div>

            <div
              className={`tryon-viewport${phase === 'active' || phase === 'analyzing' ? ' is-live' : ''}`}
            >
              <div className="tryon-viewport-inner">
                {phase === 'idle' && (
                  <div className="tryon-viewport-placeholder">
                    <Upload size={40} strokeWidth={1.2} />
                    <p>Drop your photo here</p>
                    <span>or use camera when live</span>
                  </div>
                )}

                {(phase === 'active' || phase === 'analyzing') && (
                  <div className="tryon-viewport-active">
                    <div className="tryon-silhouette" aria-hidden="true" />
                    <p className="tryon-scan-label">SCANNING</p>
                  </div>
                )}

                {phase === 'result' && (
                  <motion.img
                    initial={{ clipPath: 'inset(0 100% 0 0)' }}
                    animate={{ clipPath: 'inset(0 0% 0 0)' }}
                    transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                    src={DEMO_RESULT}
                    alt="Try-on preview"
                    className="tryon-result-preview"
                  />
                )}
              </div>
              <div className="tryon-scanlines" aria-hidden="true" />
            </div>

            <div className="tryon-actions">
              <button
                type="button"
                className="btn btn-primary tryon-btn"
                data-magnetic
                onClick={startDemo}
                disabled={phase === 'analyzing'}
              >
                <Camera size={18} />
                {phase === 'idle' ? 'Start Camera Demo' : 'Re-scan'}
              </button>
              <button type="button" className="btn btn-outline tryon-btn" data-magnetic disabled>
                <Upload size={18} />
                Upload Photo
              </button>
            </div>

            <p className="tryon-disclaimer">
              Demo mode — connect AI pipeline later. Your images stay private.
            </p>
          </div>

          {/* Right — results */}
          <div className="tryon-panel tryon-panel--results" data-reveal="fade-up" data-reveal-delay="200">
            <div className="tryon-panel-label">
              <Sparkles size={16} />
              AI Output
            </div>

            <AnimatePresence mode="wait">
              {phase === 'analyzing' && (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="tryon-analyzing"
                >
                  <p className="tryon-analyzing-label">AI ANALYZING</p>
                  <div className="tryon-progress-track">
                    <motion.div
                      className="tryon-progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="tryon-typewriter">
                    <span className="tryon-typewriter-cursor">▋</span>
                    {typeText}
                  </p>
                  <p className="tryon-progress-pct">{progress}%</p>
                </motion.div>
              )}

              {phase === 'result' && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="tryon-result-card"
                >
                  <div className="tryon-result-wipe">
                    <img src={DEMO_RESULT} alt="Styled look" />
                  </div>
                  <div className="tryon-result-meta">
                    <p className="tryon-result-title">Fit Score: 94%</p>
                    <p className="tryon-result-desc">
                      Excellent drape on shoulders. Slight ease at waist — size M recommended.
                    </p>
                  </div>
                  <Link to="/products" className="btn btn-gold tryon-btn no-underline" data-magnetic>
                    Shop This Look
                    <ArrowRight size={16} />
                  </Link>
                </motion.div>
              )}

              {(phase === 'idle' || phase === 'active') && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="tryon-results-empty"
                >
                  <Shirt size={48} strokeWidth={1} />
                  <p>Results will appear here</p>
                  <span>Run the camera demo to preview the AI flow</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="tryon-tips">
              <p>Tips for best results</p>
              <ul>
                <li>Stand against a plain background</li>
                <li>Good front-facing lighting</li>
                <li>Arms slightly away from body</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
