import { useCallback, useEffect, type RefObject } from 'react';

const MAGNETIC_SELECTORS = 'button, .btn, a.btn, [data-magnetic]';

export function getMagneticPoint(
  clientX: number,
  clientY: number,
  radius = 80,
): { x: number; y: number } | null {
  const elements = document.querySelectorAll<HTMLElement>(MAGNETIC_SELECTORS);
  let best: { x: number; y: number } | null = null;
  let minDist = radius;

  elements.forEach((el) => {
    if (el instanceof HTMLButtonElement && el.disabled) return;
    if (el.getAttribute('aria-disabled') === 'true') return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.hypot(clientX - cx, clientY - cy);
    if (dist < minDist) {
      minDist = dist;
      best = { x: cx, y: cy };
    }
  });

  return best;
}

/** Subtle magnetic pull on an element toward the cursor (optional enhancement). */
export function useMagnet(ref: RefObject<HTMLElement | null>, strength = 0.35) {
  const onMove = useCallback(
    (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    },
    [ref, strength],
  );

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = '';
  }, [ref]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [ref, onMove, onLeave]);
}

export function usePrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useIsTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}
