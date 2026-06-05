import { useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { usePrefersReducedMotionStatic } from '../../hooks/useScrollAnimation';

interface Product3DCardProps {
  to: string;
  label: string;
  icon: ReactNode;
  index?: number;
}

export default function Product3DCard({ to, label, icon, index = 0 }: Product3DCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const reducedMotion = usePrefersReducedMotionStatic();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), {
    stiffness: 260,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), {
    stiffness: 260,
    damping: 22,
  });

  const handleMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (reducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.08, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <motion.div
        className="collection-3d-card-perspective"
        style={
          reducedMotion
            ? undefined
            : { rotateX, rotateY, transformStyle: 'preserve-3d' }
        }
        whileHover={reducedMotion ? undefined : { y: -16, scale: 1.03 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      >
        <Link
          ref={cardRef}
          to={to}
          className="collection-3d-card no-underline block"
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
        >
          <div className="collection-3d-card-inner" style={{ transformStyle: 'preserve-3d' }}>
            <div
              className="collection-3d-icon"
              style={{ transform: reducedMotion ? undefined : 'translateZ(50px)' }}
            >
              {icon}
            </div>
            <h3
              className="collection-3d-label"
              style={{ transform: reducedMotion ? undefined : 'translateZ(30px)' }}
            >
              {label}
            </h3>
            <p
              className="collection-3d-cta"
              style={{ transform: reducedMotion ? undefined : 'translateZ(20px)' }}
            >
              Explore <ArrowRight size={12} />
            </p>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}
