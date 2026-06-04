import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const BRANDS = [
  { name: 'FashionVerse', tagline: 'Premium Essentials', color: '#7c3aed' },
  { name: 'Bloom', tagline: 'Floral & Feminine', color: '#ec4899' },
  { name: 'StepUp', tagline: 'Footwear First', color: '#f59e0b' },
  { name: 'Heritage', tagline: 'Ethnic Luxury', color: '#dc2626' },
  { name: 'LuxCarry', tagline: 'Bags & Accessories', color: '#059669' },
  { name: 'TinyTrend', tagline: 'Kids Fashion', color: '#3b82f6' },
];

export default function BrandsSection() {
  return (
    <section style={{ padding: '5rem 0', background: 'var(--bg-secondary)' }}>
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'var(--gold-600)' }}
          >
            Curated Selection
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            Top Brands, All in One Place
          </h2>
          <p className="mt-3 text-sm max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
            Discover your favourite labels and explore their latest collections
          </p>
        </motion.div>

        {/* Brand Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {BRANDS.map((brand, i) => (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                to={`/products?brand=${encodeURIComponent(brand.name)}`}
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl no-underline transition-all duration-300"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
                  e.currentTarget.style.borderColor = brand.color + '55';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                {/* Brand Logo Placeholder */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{
                    background: brand.color + '18',
                    color: brand.color,
                  }}
                >
                  {brand.name.charAt(0)}
                </div>
                <div className="text-center">
                  <p
                    className="text-xs font-bold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {brand.name}
                  </p>
                  <p
                    className="text-[10px] mt-0.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {brand.tagline}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View All Brands CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link to="/products" className="btn btn-outline inline-flex gap-2">
            Browse All Brands <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
