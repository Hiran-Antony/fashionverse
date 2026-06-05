import { useEffect, useRef } from 'react';

export default function GoldParticles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const particles: HTMLDivElement[] = [];
    const count = 25;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      const isLeaf = Math.random() > 0.5;

      particle.style.cssText = `
        position: absolute;
        width: ${isLeaf ? Math.random() * 8 + 4 : Math.random() * 4 + 2}px;
        height: ${isLeaf ? Math.random() * 12 + 6 : Math.random() * 4 + 2}px;
        background: ${Math.random() > 0.5 ? '#C9973A' : '#E8B84B'};
        border-radius: ${isLeaf ? '50% 0 50% 0' : '50%'};
        opacity: ${Math.random() * 0.5 + 0.15};
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: floatParticle${i % 5} ${Math.random() * 8 + 6}s ease-in-out infinite;
        animation-delay: ${Math.random() * 5}s;
        pointer-events: none;
        transform: rotate(${Math.random() * 360}deg);
      `;

      container.appendChild(particle);
      particles.push(particle);
    }

    return () => {
      particles.forEach((p) => p.remove());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    />
  );
}
