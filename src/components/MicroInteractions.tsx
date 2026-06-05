import { useEffect } from 'react';

/** Global button ripple + magnetic pull on primary controls */
export default function MicroInteractions() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>(
        '.btn, button[data-ripple], [data-ripple]',
      );
      if (!el || el.hasAttribute('disabled')) return;

      const rect = el.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height) * 2;

      ripple.className = 'btn-ripple';
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

      el.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const buttons = document.querySelectorAll<HTMLElement>(
      '.btn:not(:disabled), button.btn-primary, [data-magnetic]',
    );

    const handlers = new Map<
      HTMLElement,
      { move: (e: MouseEvent) => void; leave: () => void }
    >();

    buttons.forEach((el) => {
      const move = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) * 0.2;
        const dy = (e.clientY - cy) * 0.2;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      };
      const leave = () => {
        el.style.transform = '';
      };
      el.addEventListener('mousemove', move);
      el.addEventListener('mouseleave', leave);
      handlers.set(el, { move, leave });
    });

    return () => {
      handlers.forEach(({ move, leave }, el) => {
        el.removeEventListener('mousemove', move);
        el.removeEventListener('mouseleave', leave);
        el.style.transform = '';
      });
    };
  }, []);

  return null;
}
