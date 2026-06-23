import { useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import useDeviceOptimization from '../../hooks/useDeviceOptimization';

interface Product3DCardProps {
  to: string;
  label: string;
  icon: ReactNode;
  index?: number;
}

import BorderGlow from '../animations/BorderGlow';

export default function Product3DCard({ to, label, icon, index = 0 }: Product3DCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const { isMobile, prefersReducedMotion: reducedMotion } = useDeviceOptimization();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), {
    stiffness: 260,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), {
    stiffness: 260,
    damping: 22,
  });

  const handleMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (reducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.08, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ minHeight: 'var(--card-min-height, 220px)', display: 'flex', flexDirection: 'column' }}
    >
      <div className="card-wrapper w-full" style={{ flex: 1, display: 'flex' }}>
        <Link
          ref={cardRef}
          to={to}
          className="block w-full no-underline group card-inner"
          style={{
            flex: 1,
            background: 'linear-gradient(145deg, #2e1e14 0%, #170e0a 60%, #0d0705 100%)',
            borderRadius: '16px',
            padding: 'var(--card-padding, 40px 24px)',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 20px rgba(212, 160, 50, 0.45), 0 0 40px rgba(212, 160, 50, 0.15)';
            e.currentTarget.style.transform = 'translateY(-4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div className="flex flex-col items-center justify-center w-full h-full relative z-10">
            {/* ICON CIRCLE */}
            <div
              className="card-icon-wrapper transition-all duration-500 ease-out"
              style={{
                width: 'var(--card-icon-size, 68px)',
                height: 'var(--card-icon-size, 68px)',
                borderRadius: '50%',
                border: '1px solid rgba(212, 160, 50, 0.3)',
                color: '#D4A032',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--card-icon-margin, 24px)',
                backgroundColor: 'rgba(212, 160, 50, 0.03)',
                position: 'relative',
              }}
            >
              <div className="icon-inner relative z-10 transition-transform duration-500">{icon}</div>
              {/* Spinning Ring */}
              <div className="spinning-ring"></div>
              {/* Glow Aura */}
              <div className="icon-aura"></div>
            </div>

            {/* TITLE TEXT */}
            <h3
              className="card-title transition-all duration-500 ease-out"
              style={{
                fontFamily: 'Inter, var(--font-sans)',
                fontWeight: 700,
                letterSpacing: '0.15em',
                color: '#FFFFFF',
                fontSize: 'var(--card-title-size, 14px)',
                textTransform: 'uppercase',
                margin: 'var(--card-title-margin, 0 0 20px 0)',
              }}
            >
              {label}
            </h3>

            {/* EXPLORE PILL */}
            <div 
              className="explore-wrapper transition-all duration-500 ease-out flex items-center justify-center gap-2"
            >
              <span 
                style={{
                  fontFamily: 'Inter, var(--font-sans)',
                  fontWeight: 600,
                  fontSize: 'var(--card-explore-size, 11px)',
                  letterSpacing: '0.15em',
                  color: '#D4A032',
                  textTransform: 'uppercase',
                }}
              >
                Explore
              </span>
              <ArrowRight 
                size={14} 
                className="arrow-icon transition-transform duration-500 ease-out" 
                style={{ color: '#D4A032' }}
              />
            </div>
          </div>
        </Link>
      </div>

      <style>{`
        @keyframes golden-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes card-border-spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        .card-wrapper {
          position: relative;
          border-radius: 17px;
          padding: 1.5px;
          background: rgba(212, 160, 50, 0.15);
          overflow: hidden;
          transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.4s ease, background 0.4s ease;
          transform: translateZ(0);
          will-change: transform;
        }

        .card-wrapper::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 150%;
          height: 150%;
          background: conic-gradient(from 0deg, transparent 0%, rgba(212, 160, 50, 0.1) 20%, #D4A032 45%, #FFE5A3 50%, #D4A032 55%, rgba(212, 160, 50, 0.1) 80%, transparent 100%);
          animation: card-border-spin 4s linear infinite;
          pointer-events: none;
        }

        .group:hover .card-wrapper {
          transform: translateY(-8px) translateZ(0);
          box-shadow: 0 16px 40px -10px rgba(212, 160, 50, 0.25);
          background: rgba(212, 160, 50, 0.1); /* Dim base border so spinning light shines */
        }

        .group:hover .card-wrapper::before {
          opacity: 1;
        }
        
        .spinning-ring {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 1px dashed rgba(212, 160, 50, 0.8);
          opacity: 1; /* Always visible */
          transform: scale(1); /* Always full size */
          animation: golden-spin 6s linear infinite; /* Always spinning */
          transition: border-color 0.5s ease-out;
        }

        .icon-aura {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(212, 160, 50, 0.4) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.5s ease-out;
          filter: blur(8px);
          z-index: 0;
        }

        .group:hover .spinning-ring {
          border: 1.5px dashed rgba(212, 160, 50, 1);
        }

        .group:hover .icon-aura {
          opacity: 1;
        }

        .group:hover .card-icon-wrapper {
          transform: translateY(-6px);
          border-color: rgba(212, 160, 50, 0.8);
          background-color: rgba(212, 160, 50, 0.1);
        }

        .group:hover .icon-inner {
          transform: scale(1.1);
        }

        .explore-wrapper {
          opacity: 0.6;
          transform: translateY(0);
          padding: 6px 16px;
          border-radius: 100px;
          border: 1px solid transparent;
          background: transparent;
          position: relative;
          overflow: hidden;
        }

        @keyframes button-shimmer {
          0% { left: -100%; }
          100% { left: 200%; }
        }

        @keyframes button-pulse {
          0% { transform: scale(1); opacity: 0.8; }
          70% { transform: scale(1.15, 1.4); opacity: 0; }
          100% { transform: scale(1.15, 1.4); opacity: 0; }
        }

        .explore-wrapper::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
          transform: skewX(-20deg);
        }

        .explore-wrapper::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          border: 1px solid rgba(212, 160, 50, 0.8);
          opacity: 0;
          pointer-events: none;
        }

        .group:hover .explore-wrapper {
          opacity: 1;
          border-color: rgba(212, 160, 50, 0.5);
          background: rgba(212, 160, 50, 0.1);
          transform: translateY(-2px) translateZ(0);
          will-change: transform;
        }

        .group:hover .explore-wrapper::before {
          animation: button-pulse 2s infinite;
        }

        .group:hover .explore-wrapper::after {
          animation: button-shimmer 2.5s infinite;
        }

        .group:hover .arrow-icon {
          transform: translateX(4px);
        }
      `}</style>
    </motion.div>
  );
}
