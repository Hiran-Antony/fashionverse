import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { animateCountUp, usePrefersReducedMotionStatic } from '../../hooks/useScrollAnimation';

gsap.registerPlugin(ScrollTrigger);

const HEADLINE_WORDS = ['Discover', 'Your', 'Perfect', 'Style'];

const LOOKBOOK_VIDEOS = [
  { src: '/videos/hero.mp4', label: 'SS 2025 Lookbook' },
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

function HeroTicker() {
  const trackRef = useRef<HTMLDivElement>(null);

  return (
    <div className="hero-ticker" aria-hidden="true">
      <div ref={trackRef} className="hero-ticker-track">
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <span key={`${item}-${i}`} className="hero-ticker-item">
            {item}
            <span className="hero-ticker-dot">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SplitHero() {
  const leftRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeVideo, setActiveVideo] = useState(0);
  const [progress, setProgress] = useState(0);
  const reducedMotion = usePrefersReducedMotionStatic();

  // GSAP headline + subtext on load
  useEffect(() => {
    if (reducedMotion) return;

    const words = wordsRef.current.filter(Boolean);
    if (!words.length) return;

    gsap.set(words, { y: 80, opacity: 0 });
    if (subtextRef.current) gsap.set(subtextRef.current, { opacity: 0, y: 20 });
    if (ctaRef.current) gsap.set(ctaRef.current, { opacity: 0, y: 20 });

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.to(words, { y: 0, opacity: 1, duration: 0.9, stagger: 0.12 })
      .to(subtextRef.current, { opacity: 1, y: 0, duration: 0.7 }, '-=0.35')
      .to(ctaRef.current, { opacity: 1, y: 0, duration: 0.7 }, '-=0.45');

    return () => {
      tl.kill();
    };
  }, [reducedMotion]);

  // Stat counters on scroll into view
  useEffect(() => {
    const statsEl = statsRef.current;
    if (!statsEl) return;

    const numberEls = statsEl.querySelectorAll<HTMLElement>('[data-stat-value]');

    if (reducedMotion) {
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
  }, [reducedMotion]);

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
      <section className="split-hero">
        {/* Left panel — text */}
        <div ref={leftRef} className="split-hero-left">
          <div className="split-hero-content">
            <p className="split-hero-tag">SS 2025 — AI-POWERED FASHION</p>

            <h1 className="split-hero-headline">
              {HEADLINE_WORDS.map((word, i) => (
                <span
                  key={word}
                  ref={(el) => { wordsRef.current[i] = el; }}
                  className="split-hero-word"
                >
                  {word}{' '}
                </span>
              ))}
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

        {/* Right panel — video */}
        <div className="split-hero-right">
          <div className="split-hero-video-wrap">
            <video
              key={LOOKBOOK_VIDEOS[activeVideo].src}
              ref={videoRef}
              className="split-hero-video"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-label={LOOKBOOK_VIDEOS[activeVideo].label}
            >
              <source src={LOOKBOOK_VIDEOS[activeVideo].src} type="video/mp4" />
            </video>

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
