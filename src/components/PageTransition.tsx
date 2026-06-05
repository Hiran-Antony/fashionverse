import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { usePrefersReducedMotion } from '../hooks/useMagnet';

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const prevPath = useRef(location.pathname);
  const isFirstRender = useRef(true);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    if (reducedMotion) {
      gsap.set(overlay, { yPercent: -100, display: 'none' });
      prevPath.current = location.pathname;
      return;
    }

    if (isFirstRender.current) {
      isFirstRender.current = false;
      gsap.set(overlay, { yPercent: -100 });
      prevPath.current = location.pathname;
      return;
    }

    if (prevPath.current === location.pathname) return;
    prevPath.current = location.pathname;

    gsap.set(overlay, { yPercent: -100, display: 'block' });

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(overlay, { display: 'none' });
      },
    });

    tl.to(overlay, {
      yPercent: 0,
      duration: 0.6,
      ease: 'power3.inOut',
    }).to(overlay, {
      yPercent: -100,
      duration: 0.6,
      ease: 'power3.inOut',
    });
  }, [location.pathname, reducedMotion]);

  return (
    <>
      <div ref={overlayRef} className="page-transition-overlay" aria-hidden="true" />
      {children}
    </>
  );
}
