import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Eye, Shirt } from 'lucide-react';

// ─── Features Section ─────────────────────────────────────────

const particleConfig = [
  { id: 1, left: '5%', top: '-5%', delay: '0s', duration: '3.5s', size: '12px' },
  { id: 2, left: '85%', top: '20%', delay: '0.8s', duration: '4s', size: '16px' },
  { id: 3, left: '90%', top: '80%', delay: '1.2s', duration: '3.5s', size: '14px' },
  { id: 4, left: '15%', top: '75%', delay: '1.8s', duration: '4.5s', size: '18px' },
  { id: 5, left: '45%', top: '-10%', delay: '0.5s', duration: '3s', size: '12px' },
  { id: 6, left: '50%', top: '100%', delay: '2.2s', duration: '3.5s', size: '14px' },
  { id: 7, left: '-5%', top: '40%', delay: '0.3s', duration: '4.2s', size: '16px' },
  { id: 8, left: '105%', top: '50%', delay: '1.5s', duration: '3.8s', size: '12px' },
];

export function FeaturesSection() {
  const features = [
    {
      icon: <Eye size={24} />,
      title: 'Virtual Try-On',
      desc: 'Upload a photo and see exactly how any garment looks on your body before purchasing.',
      backDesc: 'Experience our state-of-the-art virtual fitting room. See the fit, drape, and style on your own body instantly.',
      path: '/try-on'
    },
    {
      icon: <Shirt size={24} />,
      title: 'FashionVerse AI',
      desc: 'Curate complete outfits from our catalog and visualize every combination.',
      backDesc: 'Mix and match items across our entire catalog to build your dream wardrobe effortlessly.',
      path: '/style-builder'
    },
    {
      icon: <Sparkles size={24} />,
      title: 'AI Fashion Assistant',
      desc: 'Chat with our AI stylist for personalized outfit ideas based on your taste.',
      backDesc: 'Get professional styling advice, trend recommendations, and custom outfit combinations.',
      path: '/style-builder#tools'
    },
    {
      icon: <Zap size={24} />,
      title: 'Smart Size Guide',
      desc: 'Enter your measurements once — our AI recommends the perfect size every time.',
      backDesc: 'No more returns. Find your exact fit across all brands using our intelligent sizing algorithm.',
      path: '/account/sizing'
    },
  ];

  return (
    <section style={{ padding: '6rem 0', background: 'var(--bg-secondary)' }}>
      <style>{`
        /* --- 3D FLIP ANIMATION STYLES --- */
        .fv-card-perspective-wrapper {
          perspective: 1500px;
          background: transparent;
          height: 100%; /* Ensure it fills grid cell */
        }

        .fv-card-flipper {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.15); /* Sleek springy flip */
          transform-style: preserve-3d;
        }

        .fv-card-perspective-wrapper:hover .fv-card-flipper {
          transform: rotateY(180deg);
        }

        .fv-card-front, .fv-card-back {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          width: 100%;
          border-radius: 20px;
        }

        .fv-card-front {
          position: relative;
          height: 100%;
        }

        .fv-card-back {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          transform: rotateY(180deg);
          background: #050201;
        }

        .fv-back-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 2.5rem 2rem;
          height: 100%;
        }

        .fv-back-btn {
          margin-top: auto;
          padding: 0.8rem 2.5rem;
          border-radius: 100px;
          background: transparent;
          border: 1px solid rgba(232, 184, 75, 0.5);
          color: #E8B84B;
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 1.1rem;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          line-height: 1;
        }

        .fv-back-btn:hover {
          background: #E8B84B;
          color: #120a06;
          border-color: #E8B84B;
          box-shadow: 0 8px 25px rgba(232, 184, 75, 0.3);
          transform: translateY(-2px);
        }

        /* Base Card Styles */
        .fv-feature-card {
          position: relative;
          border-radius: 20px;
          padding: 3rem 2rem;
          background: linear-gradient(145deg, #2e1e14 0%, #170e0a 60%, #0d0705 100%);
          box-shadow: 
            0 10px 40px rgba(0, 0, 0, 0.9), 
            0 0 8px rgba(255, 240, 180, 0.5),
            0 0 15px rgba(243, 204, 112, 0.4), 
            0 0 40px rgba(243, 204, 112, 0.25),
            0 0 70px rgba(200, 150, 50, 0.15);
          overflow: visible; 
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          text-align: center;
        }

        /* Vibrant, thicker glowing liquid gradient border */
        .fv-feature-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 20px;
          padding: 3px; /* Thicker border */
          background: linear-gradient(180deg, 
            rgba(255, 240, 180, 1) 0%, 
            rgba(243, 204, 112, 0.8) 15%, 
            rgba(243, 204, 112, 0) 35%, 
            rgba(243, 204, 112, 0) 65%, 
            rgba(243, 204, 112, 0.8) 85%, 
            rgba(255, 240, 180, 1) 100%
          );
          background-size: 100% 300%;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          z-index: 10;
          animation: shift-border-flowing 5s linear infinite;
        }

        .fv-card-perspective-wrapper:hover .fv-card-front {
          /* Massive multi-layered crisp glow on hover */
          box-shadow: 
            0 10px 40px rgba(0, 0, 0, 0.9), 
            0 0 10px rgba(255, 240, 180, 0.8),
            0 0 25px rgba(243, 204, 112, 0.6), 
            0 0 50px rgba(243, 204, 112, 0.4),
            0 0 90px rgba(200, 150, 50, 0.25);
        }

        .fv-card-perspective-wrapper:hover .fv-card-front::after {
          animation: shift-border-flowing 2s linear infinite;
        }

        @keyframes shift-border-flowing {
          0% { background-position: 50% 0%; }
          50% { background-position: 50% 100%; }
          100% { background-position: 50% 0%; }
        }

        /* Ambient massive breathing glow */
        .fv-card-perspective-wrapper::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 20px;
          pointer-events: none;
          z-index: -2;
          box-shadow: 0 0 25px rgba(255, 255, 255, 0.6), 0 0 55px rgba(243, 204, 112, 0.4), 0 0 95px rgba(200, 150, 50, 0.25);
          animation: breathe-glow-opacity 4s ease-in-out infinite;
          will-change: opacity;
        }

        .fv-card-perspective-wrapper:hover::before {
          animation: breathe-glow-hover-opacity 2s ease-in-out infinite;
        }

        @keyframes breathe-glow-opacity {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }

        @keyframes breathe-glow-hover-opacity {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }



        .fv-particles-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          opacity: 0.8;
        }

        @media (max-width: 768px) {
          .fv-particles-container {
            display: none;
          }
        }

        .fv-particle {
          position: absolute;
          background: #E8B84B;
          opacity: 0;
          border-radius: 50%;
          filter: blur(0.5px);
          animation: float-dust var(--duration, 4s) infinite ease-in-out alternate;
          animation-delay: var(--delay, 0s);
        }

        @keyframes float-dust {
          0% { transform: translate(0, 0) scale(0.5); opacity: 0; }
          40% { opacity: 0.4; }
          100% { transform: translate(calc(var(--random-x, 15px)), calc(var(--random-y, -25px))) scale(1.2); opacity: 0; }
        }

        .fv-icon-container {
          position: relative;
          width: 4rem;
          height: 4rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          background: transparent;
          border: 1px solid rgba(232, 184, 75, 0.4);
          color: #E8B84B;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 2;
        }

        .fv-feature-card:hover .fv-icon-container {
          transform: scale(1.1);
          border-color: rgba(232, 184, 75, 0.8);
          box-shadow: 0 0 20px rgba(232, 184, 75, 0.2);
        }

        .fv-content {
          position: relative;
          z-index: 2;
        }
      `}</style>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center text-center"
          style={{ marginBottom: '4rem', width: '100%' }}
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
              letterSpacing: '-0.02em'
            }}
          >
            Redefining Your
            <br />
            Shopping Experience
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
              className="fv-card-perspective-wrapper"
            >
              <div className="fv-card-flipper">
                
                {/* --- FRONT OF CARD --- */}
                <div className="fv-card-front fv-feature-card">
                  <div className="fv-particles-container">
                    {particleConfig.map((p) => {
                      const randX = (p.id * 13 % 20) - 10;
                      const randY = (p.id * 7 % 20) - 10;
                      return (
                        <div
                          key={p.id}
                          className="fv-particle"
                          style={{
                            left: p.left,
                            top: p.top,
                            width: p.size,
                            height: p.size,
                            '--delay': p.delay,
                            '--duration': p.duration,
                            '--random-x': randX + 'px',
                            '--random-y': randY + 'px',
                          } as React.CSSProperties}
                        />
                      );
                    })}
                  </div>
                  <div className="fv-content">
                    <div className="fv-icon-container">
                      {feature.icon}
                    </div>
                    <h3
                      className="font-bold mb-3"
                      style={{
                        color: '#f5f5f0',
                        fontSize: '1.125rem',
                        fontFamily: 'var(--font-display)',
                        letterSpacing: '0.02em'
                      }}
                    >
                      {feature.title}
                    </h3>
                    <p
                      style={{
                        color: 'rgba(245, 245, 240, 0.7)',
                        fontSize: '0.875rem',
                        lineHeight: 1.7,
                        fontFamily: 'var(--font-sans)',
                        margin: 0
                      }}
                    >
                      {feature.desc}
                    </p>
                  </div>
                </div>

                {/* --- BACK OF CARD --- */}
                <div className="fv-card-back">
                  <div className="fv-back-content">
                    <div className="fv-icon-container" style={{ transform: 'scale(1.1)', boxShadow: 'none', background: 'transparent' }}>
                      {feature.icon}
                    </div>
                    <h3
                      className="font-bold mb-3"
                      style={{
                        color: '#f5f5f0',
                        fontSize: '1.125rem',
                        fontFamily: 'var(--font-display)',
                        letterSpacing: '0.02em'
                      }}
                    >
                      {feature.title}
                    </h3>
                    <p
                      className="mb-6"
                      style={{
                        color: 'rgba(245, 245, 240, 0.7)',
                        fontSize: '0.875rem',
                        lineHeight: 1.7,
                        fontFamily: 'var(--font-sans)'
                      }}
                    >
                      {feature.backDesc}
                    </p>
                    <Link to={feature.path} className="fv-back-btn">
                      Get Started
                    </Link>
                  </div>
                </div>

              </div>
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
            <div className="flex flex-col sm:flex-row gap-5 mt-6">
              <Link
                to="/try-on"
                className="no-underline flex items-center justify-center gap-2.5 font-bold text-[14px] rounded-full px-6 py-2.5 flex-1 text-center"
                style={{
                  background: 'linear-gradient(135deg, #E8B84B 0%, #C9973A 100%)',
                  color: '#050201',
                  boxShadow: '0 8px 32px rgba(201,151,58,0.25)',
                  fontFamily: 'Inter, var(--font-sans)',
                  letterSpacing: '0.02em',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #FAD673 0%, #E8B84B 100%)';
                  e.currentTarget.style.boxShadow = '0 10px 36px rgba(232, 184, 75, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #E8B84B 0%, #C9973A 100%)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(201,151,58,0.25)';
                }}
              >
                Start Virtual Try-On
              </Link>
              <Link
                to="/products"
                className="clean-premium-btn flex-1 no-underline justify-center text-center"
                style={{
                  fontFamily: 'Inter, var(--font-sans)',
                  letterSpacing: '0.02em',
                  padding: '10px 24px',
                }}
              >
                <div className="clean-premium-btn-bg" />
                <span className="clean-premium-text font-bold text-[14px]">
                  Browse Products
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

