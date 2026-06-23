import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import CategoryProductCard from '../product/CategoryProductCard';


interface ProductCarouselProps {
  title: string;
  subtitle: string;
  filter: 'featured' | 'trending' | 'new';
  viewAllLink?: string;
  accentColor?: 'purple' | 'gold' | 'sapphire';
}

export default function ProductCarousel({
  title,
  subtitle,
  filter,
  viewAllLink = '/products',
  accentColor = 'purple',
}: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-carousel', filter],
    queryFn: async () => {
      const query = supabase
        .from('products')
        .select(`
          *,
          colors:product_colors (*),
          sizes:product_sizes (*)
        `)
        .eq(`is_${filter}`, true)
        .eq('is_active', true)
        .limit(10);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as any[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Only show real products from the database — no mock fallback
  const displayProducts = products;

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const accentVar =
    accentColor === 'gold' || accentColor === 'sapphire' ? '#E8B84B' : 'var(--purple-600)';

  return (
    <section style={{ padding: '5rem 0', background: 'var(--bg-primary)', contentVisibility: 'auto', containIntrinsicSize: '500px' }}>
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between"
          style={{ marginBottom: '3.5rem' }}
        >
          <div>
            <p
              className="text-xs md:text-sm font-bold uppercase mb-4"
              style={{ color: accentVar, letterSpacing: '0.15em' }}
            >
              {subtitle}
            </p>
            <h2
              style={{
                fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                letterSpacing: '0',
              }}
            >
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Scroll arrows */}
            <button
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--purple-100)';
                e.currentTarget.style.color = 'var(--purple-600)';
                e.currentTarget.style.borderColor = 'var(--purple-300)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--purple-100)';
                e.currentTarget.style.color = 'var(--purple-600)';
                e.currentTarget.style.borderColor = 'var(--purple-300)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <ChevronRight size={18} />
            </button>

            <Link
              to={viewAllLink}
              className="no-underline hidden sm:inline-flex items-center gap-2 text-sm font-semibold transition-all"
              style={{ color: accentVar }}
              onMouseEnter={(e) => (e.currentTarget.style.gap = '10px')}
              onMouseLeave={(e) => (e.currentTarget.style.gap = '8px')}
            >
              View All <ArrowRight size={15} />
            </Link>
          </div>
        </motion.div>

        {/* Carousel */}
        {isLoading ? (
          <div className="flex gap-6 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="shrink-0 rounded-2xl overflow-hidden"
                style={{ width: '260px', border: '1px solid var(--border-color)' }}
              >
                <div className="skeleton" style={{ width: '100%', paddingTop: '125%' }} />
                <div className="p-4 space-y-3">
                  <div className="skeleton h-3 w-1/3 rounded" />
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-4 w-1/4 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : displayProducts.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            No products added yet. Add products from the Admin Dashboard.
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {displayProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="shrink-0"
                style={{ width: '260px' }}
              >
                <CategoryProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
        {/* Mobile View All */}
        <div className="text-center sm:hidden" style={{ marginTop: '42px' }}>
          <Link to={viewAllLink} className="btn btn-outline">
            View All <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

