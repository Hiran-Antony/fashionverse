import type { ReactNode } from 'react';
import { useRef } from 'react';
import { Baby, Footprints, Shirt, Sparkles, Watch } from 'lucide-react';
import { CATEGORIES } from '../../utils/constants';
import type { ProductCategory } from '../../types';
import Product3DCard from './Product3DCard';
import { useTitleReveal } from '../../hooks/useScrollAnimation';

const CATEGORY_ICONS: Record<ProductCategory, ReactNode> = {
  men: <Shirt size={28} strokeWidth={1.5} />,
  women: <Sparkles size={28} strokeWidth={1.5} />,
  kids: <Baby size={28} strokeWidth={1.5} />,
  footwear: <Footprints size={28} strokeWidth={1.5} />,
  accessories: <Watch size={28} strokeWidth={1.5} />,
};

export default function CollectionsSection() {
  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useTitleReveal(headerRef, titleRef);

  return (
    <section className="collections-section" data-reveal="fade-up">
      <div className="container">
        <div ref={headerRef} className="collections-section-header">
          <p className="collections-eyebrow">Shop By Category</p>
          <h2 ref={titleRef} className="collections-title">
            Explore Our Collections
          </h2>
        </div>

        <div className="collections-grid">
          {CATEGORIES.map((cat, index) => (
            <Product3DCard
              key={cat.value}
              to={`/products?category=${cat.value}`}
              label={cat.label}
              icon={CATEGORY_ICONS[cat.value]}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
