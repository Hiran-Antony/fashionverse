import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { Eye, Sparkles, Search, ArrowRight } from 'lucide-react';
import { usePrefersReducedMotionStatic } from '../../hooks/useScrollAnimation';
import TextType from '../ui/TextType';

const PANEL_DURATION_MS = 4800;
const FADE_DURATION = 0.42;

const PANELS = [
  {
    id: 'problem',
    className: 'scroll-story-panel--problem',
    title: "Tired of buying clothes that don't fit your vibe?",
    subtitle: 'Endless scrolling. Wrong sizes. Style guesswork.',
  },
  {
    id: 'solution',
    className: 'scroll-story-panel--solution',
    title: 'FashionVerse uses AI to match your exact style',
    subtitle: 'Smart recommendations built around you — not algorithms alone.',
  },
  {
    id: 'features',
    className: 'scroll-story-panel--features',
    title: 'Everything you need, in one place',
    subtitle: '',
    features: [
      { icon: <Eye size={22} />, title: 'AI Try-On', desc: 'See outfits on yourself before you buy.' },
      { icon: <Sparkles size={22} />, title: 'Style Builder', desc: 'Curate complete looks from our catalog.' },
      { icon: <Search size={22} />, title: 'Smart Search', desc: 'Find pieces that match your aesthetic instantly.' },
    ],
  },
  {
    id: 'cta',
    className: 'scroll-story-panel--cta',
    title: 'Your wardrobe, reimagined.',
    subtitle: 'Step into a smarter way to shop fashion.',
    cta: true,
  },
] as const;

export default function ScrollStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const panelsRef = useRef<(HTMLDivElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isVisibleRef = useRef(false);
  const activeRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const reducedMotion = usePrefersReducedMotionStatic();

  const animateToPanel = useCallback((index: number, fromIndex?: number) => {
    const panels = panelsRef.current.filter(Boolean) as HTMLDivElement[];
    const prevIndex = fromIndex ?? activeRef.current;
    const outgoing = prevIndex !== index ? panels[prevIndex] : null;
    const incoming = panels[index];
    if (!incoming) return;

    panels.forEach((p) => {
      gsap.killTweensOf(p);
      gsap.killTweensOf(p.querySelectorAll('.scroll-story-feature-card'));
    });

    const showIncoming = () => {
      incoming.style.pointerEvents = 'auto';
      incoming.style.zIndex = '2';
      const cards = incoming.querySelectorAll('.scroll-story-feature-card');

      gsap.fromTo(
        incoming,
        { opacity: 0, y: 24, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: FADE_DURATION, ease: 'power2.out' },
      );

      if (cards.length) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.32, stagger: 0.07, ease: 'power2.out', delay: 0.1 },
        );
      }
    };

    if (outgoing && outgoing !== incoming) {
      outgoing.style.pointerEvents = 'none';
      outgoing.style.zIndex = '1';
      gsap.to(outgoing, {
        opacity: 0,
        y: -20,
        scale: 0.98,
        duration: 0.26,
        ease: 'power2.in',
        onComplete: showIncoming,
      });
    } else {
      showIncoming();
    }
  }, []);

  const goToNext = useCallback(() => {
    const prev = activeRef.current;
    const next = (prev + 1) % PANELS.length;
    activeRef.current = next;
    setActiveIndex(next);
    animateToPanel(next, prev);
  }, [animateToPanel]);

  const goToPanel = useCallback(
    (index: number) => {
      const prev = activeRef.current;
      activeRef.current = index;
      setActiveIndex(index);
      animateToPanel(index, prev);
    },
    [animateToPanel],
  );

  const startAutoplay = useCallback(() => {
    if (timerRef.current || reducedMotion) return;
    timerRef.current = setInterval(goToNext, PANEL_DURATION_MS);
  }, [goToNext, reducedMotion]);

  const stopAutoplay = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Initial panel setup
  useEffect(() => {
    const panels = panelsRef.current.filter(Boolean) as HTMLDivElement[];
    if (!panels.length) return;

    if (reducedMotion) {
      panels.forEach((p, i) => {
        p.style.opacity = i === 0 ? '1' : '0';
        p.style.pointerEvents = i === 0 ? 'auto' : 'none';
      });
      return;
    }

    gsap.set(panels, { opacity: 0, y: 32, scale: 0.97 });
    gsap.set(panels[0], { opacity: 1, y: 0, scale: 1 });
    panels[0].style.pointerEvents = 'auto';
    panels[0].style.zIndex = '2';
    panels.slice(1).forEach((p) => {
      p.style.pointerEvents = 'none';
      p.style.zIndex = '1';
    });
  }, [reducedMotion]);

  // Start / stop when section enters viewport
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reducedMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          startAutoplay();
        } else {
          stopAutoplay();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      stopAutoplay();
    };
  }, [reducedMotion, startAutoplay, stopAutoplay]);

  return (
    <section ref={sectionRef} className="scroll-story-section" aria-label="FashionVerse journey">
      <div className="scroll-story-stage">
        {PANELS.map((panel, i) => (
          <div
            key={panel.id}
            ref={(el) => { panelsRef.current[i] = el; }}
            className={`scroll-story-panel ${panel.className}`}
            aria-hidden={activeIndex !== i}
            style={{
              opacity: i === 0 ? 1 : 0,
              pointerEvents: i === 0 ? 'auto' : 'none',
              zIndex: i === 0 ? 2 : 1,
            }}
          >
            <div className="scroll-story-panel-inner">
              {'features' in panel && panel.features ? (
                <>
                  <h2 className="scroll-story-title">
                    {activeIndex === i ? (
                      <TextType
                        text={panel.title}
                        typingSpeed={50}
                        showCursor={true}
                        cursorBlinkDuration={0.4}
                        loop={false}
                      />
                    ) : (
                      panel.title
                    )}
                  </h2>
                  <div className="scroll-story-features">
                    {panel.features.map((f) => (
                      <div key={f.title} className="scroll-story-feature-card">
                        <div className="scroll-story-feature-icon">{f.icon}</div>
                        <h3>{f.title}</h3>
                        <p>{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <h2 className="scroll-story-title">
                    {activeIndex === i ? (
                      <TextType
                        text={panel.title}
                        typingSpeed={50}
                        showCursor={true}
                        cursorBlinkDuration={0.4}
                        loop={false}
                      />
                    ) : (
                      panel.title
                    )}
                  </h2>
                  {panel.subtitle && <p className="scroll-story-subtitle">{panel.subtitle}</p>}
                  {'cta' in panel && panel.cta && (
                    <Link to="/products" className="scroll-story-cta-btn no-underline">
                      Shop Now <ArrowRight size={18} />
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {!reducedMotion && (
          <div className="scroll-story-progress" role="tablist" aria-label="Story progress">
            {PANELS.map((panel, i) => (
              <button
                key={panel.id}
                type="button"
                role="tab"
                aria-selected={activeIndex === i}
                aria-label={`Slide ${i + 1}`}
                className={`scroll-story-progress-dot${activeIndex === i ? ' is-active' : ''}`}
                onClick={() => {
                  stopAutoplay();
                  goToPanel(i);
                  if (isVisibleRef.current) {
                    setTimeout(startAutoplay, PANEL_DURATION_MS);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
