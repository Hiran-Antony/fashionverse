import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import OptimizedImage from '../OptimizedImage';

const BRANDS = [
  { name: 'US Polo Assn', image: '/photos/1.jpeg', type: 'light' },
  { name: 'Rare Rabbit', image: '/photos/2.jpeg', type: 'dark' },
  { name: 'Lacoste', image: '/photos/3.jpeg', type: 'light' },
  { name: 'Indian Terrain', image: '/photos/4.jpeg', type: 'light' },
  { name: 'Lee Cooper', image: '/photos/5.jpeg', type: 'light' },
  { name: 'Zara', image: '/photos/6.png', type: 'light' },
];

export default function BrandsSection() {
  return (
    <section className="brands-section" style={{ paddingTop: '60px', paddingBottom: '70px', background: 'var(--bg-secondary)' }}>
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center text-center mb-12 gap-3"
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest m-0"
            style={{ color: '#E8B84B' }}
          >
            Curated Selection
          </p>
          <h2
            className="m-0"
            style={{
              fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}
          >
            Top Brands, All in One Place
          </h2>
          <p className="text-sm max-w-md mx-auto m-0" style={{ color: 'var(--text-muted)' }}>
            Discover your favourite labels and explore their latest collections
          </p>
        </motion.div>

        {/* Brand Grid */}
        <div className="brands-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4" style={{ marginBottom: '48px' }}>
          {BRANDS.map((brand, i) => (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6, ease: 'easeOut' }}
            >
              <Link
                to={`/products?brand=${encodeURIComponent(brand.name)}`}
                className="group flex flex-col items-center justify-center no-underline transition-all duration-300"
                style={{
                  background: 'rgba(26, 15, 8, 0.8)',
                  border: '1px solid rgba(201, 151, 58, 0.15)',
                  borderRadius: '16px',
                  padding: '24px 20px',
                  height: '100%',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(201,151,58,0.15)';
                  e.currentTarget.style.borderColor = 'rgba(201, 151, 58, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'rgba(201, 151, 58, 0.15)';
                }}
              >
                <OptimizedImage
                  src={brand.image}
                  alt={brand.name}
                  className={`brand-logo-img brand-logo-img--${brand.type}`}
                />
                
                <p
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#F5EDD4',
                    marginTop: '14px',
                    textAlign: 'center',
                  }}
                >
                  {brand.name}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View All Brands CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
          style={{ marginTop: '40px' }}
        >
          <Link to="/products" className="btn btn-outline inline-flex gap-2">
            Browse All Brands <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

