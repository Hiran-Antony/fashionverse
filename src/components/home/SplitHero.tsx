import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { animateCountUp, usePrefersReducedMotionStatic } from '../../hooks/useScrollAnimation';
import TextType from './TextType';
import HeroVideo from '../HeroVideo';
import useDeviceOptimization from '../../hooks/useDeviceOptimization';

const LOOKBOOK_VIDEOS = [
  { src: '/videos/hero1.mp4', label: 'SS 2025 Lookbook' },
];

const TICKER_ITEMS = [
  'New Collection',
  'Free Shipping above ₹999',
  'Summer Sale 40% Off',
  'Limited Drops',
  'AI-Powered Styling',
  'Virtual Try-On',
];

const STATS: Array<
  | { target: number; suffix: string; label: string; staticText?: never }
  | { staticText: string; label: string; target?: never; suffix?: never }
> = [
  { target: 240, suffix: '+', label: 'Products' },
  { target: 18, suffix: '', label: 'Designers' },
  { staticText: 'Free', label: 'Free Returns' },
];

export function HeroTicker({ direction = 'left' }: { direction?: 'left' | 'right' }) {
  const trackRef = useRef<HTMLDivElement>(null);

  return (
    <div className="ticker-wrapper" aria-hidden="true">
      <div 
        ref={trackRef} 
        className="ticker-track"
        style={{
          animationDirection: direction === 'right' ? 'reverse' : 'normal'
        }}
      >
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <span key={`${item}-${i}`} className="ticker-item">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SplitHero() {
  const leftRef = useRef<HTMLDivElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeVideo, setActiveVideo] = useState(0);
  const [progress, setProgress] = useState(0);
  const reducedMotion = usePrefersReducedMotionStatic();
  const { isMobile } = useDeviceOptimization();

  // GSAP subtext & CTA on load (disabled on mobile to reduce TBT)
  useEffect(() => {
    if (reducedMotion || isMobile) return;

    if (subtextRef.current) gsap.set(subtextRef.current, { opacity: 0, y: 20 });
    if (ctaRef.current) gsap.set(ctaRef.current, { opacity: 0, y: 20 });

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.to(subtextRef.current, { opacity: 1, y: 0, duration: 0.7, delay: 0.3 })
      .to(ctaRef.current, { opacity: 1, y: 0, duration: 0.7 }, '-=0.45');

    return () => {
      tl.kill();
    };
  }, [reducedMotion, isMobile]);

  // Stat counters on scroll into view (disabled scroll trigger animations on mobile)
  useEffect(() => {
    const statsEl = statsRef.current;
    if (!statsEl) return;

    const numberEls = statsEl.querySelectorAll<HTMLElement>('[data-stat-value]');

    if (reducedMotion || isMobile) {
      numberEls.forEach((el) => {
        const target = el.dataset.target;
        const suffix = el.dataset.suffix || '';
        const staticText = el.dataset.static;
        if (staticText) el.textContent = staticText;
        else if (target) el.textContent = `${target}${suffix}`;
      });
      return;
    }

    const trigger = ScrollTrigger.create({
      trigger: statsEl,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        numberEls.forEach((el) => {
          const staticText = el.dataset.static;
          if (staticText) {
            el.textContent = staticText;
            return;
          }
          const target = Number(el.dataset.target);
          const suffix = el.dataset.suffix || '';
          if (!Number.isNaN(target)) animateCountUp(el, target, suffix);
        });
      },
    });

    return () => trigger.kill();
  }, [reducedMotion, isMobile]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = 0.85;
    video.play().catch(() => {});

    const onTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    return () => video.removeEventListener('timeupdate', onTimeUpdate);
  }, [activeVideo]);

  const switchVideo = (index: number) => {
    setActiveVideo(index);
    setProgress(0);
  };

  return (
    <>
      <section className="split-hero hero-section hero-container">
        {/* Full-screen dark gradient overlay — keeps text readable */}
        <div className="hero-bg-overlay" aria-hidden="true" />

        {/* Left panel — text content (z-index: 3) */}
        <div ref={leftRef} className="split-hero-left">
          <div className="split-hero-content">
            <p className="split-hero-tag">AI-DRIVEN STYLE EXPERIENCE</p>

            <h1 className="split-hero-headline" style={{ minHeight: '140px', overflow: 'visible' }}>
              <TextType 
                text={['Discover Your\nPerfect Style', 'Curate Your\nWardrobe', 'Elevate Your\nLook']} 
                typingSpeed={70}
                deletingSpeed={40}
                pauseDuration={2500}
                cursorCharacter="_"
                loop={true}
                className="gradient-text-gold"
                style={{ minHeight: '140px', overflow: 'visible' }}
                aria-live="polite"
              />
            </h1>

            <p ref={subtextRef} className="split-hero-subtext">
              Try on clothes virtually with AI, build complete outfits, and receive
              personalized recommendations — all without leaving your home.
            </p>

            <div ref={ctaRef} className="split-hero-ctas">
              <Link to="/products" className="split-hero-btn split-hero-btn-primary no-underline" data-magnetic>
                Shop Collection
                <ArrowRight size={16} />
              </Link>
              <Link to="/try-on" className="split-hero-btn split-hero-btn-secondary no-underline" data-magnetic>
                Try On Virtually
              </Link>
            </div>

            <div ref={statsRef} className="split-hero-stats">
              {STATS.map((stat, i) => (
                <div key={stat.label} className="split-hero-stat">
                  {i > 0 && <span className="split-hero-stat-divider" aria-hidden="true" />}
                  <div>
                    <p
                      className="split-hero-stat-value"
                      data-stat-value
                      {...('target' in stat && stat.target !== undefined
                        ? { 'data-target': stat.target, 'data-suffix': stat.suffix }
                        : { 'data-static': stat.staticText })}
                    >
                      {'staticText' in stat ? stat.staticText : `0${stat.suffix}`}
                    </p>
                    <p className="split-hero-stat-label">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel — video (absolute positioned, z-index: 1) */}
        <div className="split-hero-right">
          <div className="split-hero-video-wrap hero-video-panel">
            <HeroVideo
              key={LOOKBOOK_VIDEOS[activeVideo].src}
              ref={videoRef}
              src={LOOKBOOK_VIDEOS[activeVideo].src}
              poster="/photos/hero-bg.jpeg"
              className="split-hero-video"
              alt={LOOKBOOK_VIDEOS[activeVideo].label}
              priority={true}
            />

            <div className="split-hero-video-gradient" aria-hidden="true" />

            {LOOKBOOK_VIDEOS.length > 1 && (
              <div className="split-hero-dots" role="tablist" aria-label="Lookbook videos">
                {LOOKBOOK_VIDEOS.map((v, i) => (
                  <button
                    key={v.src}
                    type="button"
                    role="tab"
                    aria-selected={i === activeVideo}
                    aria-label={v.label}
                    className={`split-hero-dot${i === activeVideo ? ' active' : ''}`}
                    onClick={() => switchVideo(i)}
                  />
                ))}
              </div>
            )}

            <div className="split-hero-progress" aria-hidden="true">
              <div className="split-hero-progress-bar" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </section>

      <HeroTicker />
    </>
  );
}
