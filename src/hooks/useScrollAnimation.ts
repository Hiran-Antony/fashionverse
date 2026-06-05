import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function usePrefersReducedMotionStatic(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Horizontal reveal wipe for section titles */
export function useTitleReveal(
  containerRef: RefObject<HTMLElement | null>,
  titleRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const container = containerRef.current;
    const title = titleRef.current;
    if (!container || !title) return;

    const reduced = usePrefersReducedMotionStatic();
    if (reduced) return;

    const wipe = document.createElement('div');
    wipe.className = 'title-reveal-wipe';
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    container.appendChild(wipe);

    gsap.set(title, { opacity: 0, x: -24 });
    gsap.set(wipe, { scaleX: 1, transformOrigin: 'left center' });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top 80%',
        once: true,
      },
    });

    tl.to(wipe, { scaleX: 0, duration: 0.7, ease: 'power3.inOut' })
      .to(title, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' }, '-=0.35');

    return () => {
      tl.kill();
      wipe.remove();
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === container) st.kill();
      });
    };
  }, [containerRef, titleRef]);
}

/** Count-up numbers when element enters viewport */
export function animateCountUp(
  el: HTMLElement,
  target: number,
  suffix = '',
  duration = 2,
) {
  const obj = { val: 0 };
  gsap.to(obj, {
    val: target,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      el.textContent = `${Math.round(obj.val)}${suffix}`;
    },
  });
}
