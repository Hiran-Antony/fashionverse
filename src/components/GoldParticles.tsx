import { useEffect, useRef } from 'react';
import useDeviceOptimization from '../hooks/useDeviceOptimization';

export default function GoldParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const { isMobile, isLowEnd, prefersReducedMotion, prefersReducedData } = useDeviceOptimization();

  useEffect(() => {
    // 1. Accessibility: Honoring reduced motion preference
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = window.innerWidth * DPR;
      canvas.height = window.innerHeight * DPR;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    // Curated elegant gold palette
    const GOLDS = ['#C9973A', '#E8B84B', '#D4A032', '#C08552', '#F3D078'];

    interface Flake {
      x: number;
      y: number;
      type: 'leaf' | 'circle';
      width: number;
      height: number;
      size: number;
      speedY: number;
      swaySpeed: number;
      swayAmplitude: number;
      swayPhase: number;
      rotation: number;
      spinSpeed: number;
      color: string;
      maxAlpha: number;
    }

    // 2. Performance: Dynamic particle density based on device resources
    let COUNT = 40;
    if (isLowEnd || prefersReducedData) {
      COUNT = 8;
    } else if (isMobile) {
      COUNT = 15;
    }

    const flakes: Flake[] = Array.from({ length: COUNT }, () => {
      const isLeaf = Math.random() > 0.4;
      return {
        x: Math.random() * W(),
        y: Math.random() * H(),
        type: isLeaf ? 'leaf' : 'circle',
        width: isLeaf ? Math.random() * 8 + 6 : 0,
        height: isLeaf ? Math.random() * 12 + 8 : 0,
        size: !isLeaf ? Math.random() * 5 + 3 : 0,
        speedY: Math.random() * 0.7 + 0.4,
        swaySpeed: Math.random() * 0.02 + 0.01,
        swayAmplitude: Math.random() * 20 + 10,
        swayPhase: Math.random() * Math.PI * 2,
        rotation: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 0.03,
        color: GOLDS[Math.floor(Math.random() * GOLDS.length)],
        maxAlpha: Math.random() * 0.4 + 0.2,
      };
    });

    // Cache image rects — refresh every 30 frames to avoid layout thrashing
    let cachedRects: DOMRect[] = [];
    let rectFrame = 0;

    const getImageRects = (): DOMRect[] => {
      rectFrame++;
      if (rectFrame % 30 === 0 || cachedRects.length === 0) {
        const wraps = document.querySelectorAll<HTMLElement>('.product-card-image-wrap');
        cachedRects = Array.from(wraps).map(el => el.getBoundingClientRect());
      }
      return cachedRects;
    };

    const draw = () => {
      // 3. Performance: Pause updates if tab is in the background
      if (document.hidden) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const w = W();
      const h = H();
      ctx.clearRect(0, 0, w, h);

      // ── Build clip region: full viewport MINUS all product image rects ──
      const imageRects = getImageRects();

      ctx.save();
      ctx.beginPath();
      // Outer rect = entire viewport (winding: clockwise)
      ctx.rect(0, 0, w, h);
      // Cut out each product image rect (winding: counter-clockwise = hole)
      for (const r of imageRects) {
        ctx.rect(r.left, r.top, r.width, r.height);
      }
      // evenodd rule: overlapping areas (the image rects) become holes
      ctx.clip('evenodd');

      for (const f of flakes) {
        // Update positions & physics
        f.y += f.speedY;
        f.rotation += f.spinSpeed;
        f.swayPhase += f.swaySpeed;

        // Reset when flake exits the screen bottom
        if (f.y > h + 20) {
          f.y = -20;
          f.x = Math.random() * w;
        }

        const renderX = f.x + Math.sin(f.swayPhase) * f.swayAmplitude;

        // Fading edges (fade-in at top, fade-out at bottom)
        let alpha = f.maxAlpha;
        if (f.y < 60) {
          alpha *= f.y / 60;
        } else if (f.y > h - 100) {
          alpha *= Math.max(0, (h - f.y) / 100);
        }

        ctx.save();
        ctx.translate(renderX, f.y);
        ctx.rotate(f.rotation);
        ctx.fillStyle = f.color;
        ctx.globalAlpha = alpha;

        if (f.type === 'leaf') {
          // Draw leaf shape
          ctx.beginPath();
          ctx.moveTo(0, -f.height / 2);
          ctx.quadraticCurveTo(f.width / 2, 0, 0, f.height / 2);
          ctx.quadraticCurveTo(-f.width / 2, 0, 0, -f.height / 2);
          ctx.closePath();
          ctx.fill();
        } else {
          // Draw circle flake
          ctx.beginPath();
          ctx.arc(0, 0, f.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      ctx.restore(); // Remove clip region

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [isMobile, isLowEnd, prefersReducedMotion, prefersReducedData]);

  if (prefersReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 3, // Above all page content; image rects are masked out via canvas clip
      }}
    />
  );
}
