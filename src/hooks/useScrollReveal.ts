import { useEffect } from 'react';

const REVEAL_MAP: Record<string, string> = {
  'fade-up': 'scroll-reveal--fade-up',
  'zoom-in': 'scroll-reveal--zoom-in',
};

export function useScrollReveal(routeKey = '') {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const elements = document.querySelectorAll<HTMLElement>('[data-reveal]');

    if (prefersReduced) {
      elements.forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    elements.forEach((el) => {
      const type = el.getAttribute('data-reveal') || 'fade-up';
      el.classList.add('scroll-reveal', REVEAL_MAP[type] || REVEAL_MAP['fade-up']);
      const delay = el.getAttribute('data-reveal-delay');
      if (delay) el.style.transitionDelay = `${delay}ms`;
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [routeKey]);
}
