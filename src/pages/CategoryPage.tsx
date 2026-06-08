import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';
import type { ProductCategory } from '../types';
import ProductCard from '../components/product/ProductCard';
import { Search } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────

export interface SubTab {
  label: string;
  value: string;
}

export interface CategoryPageConfig {
  /** Supabase category value */
  category: ProductCategory;
  /** Hero title text */
  heroTitle: string;
  /** Hero subtitle/collection label */
  heroSubtitle?: string;
  /** Sub-navigation tabs */
  subTabs: SubTab[];
  /** Decorative gradient overlay color (for hero differentiation) */
  heroAccentColor?: string;
}

// ─── Shared Category Page ────────────────────────────────────

export default function CategoryPage({
  category,
  heroTitle,
  heroSubtitle = 'SS 2025 Collection',
  subTabs,
  heroAccentColor = 'rgba(201, 151, 58, 0.12)',
}: CategoryPageConfig) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const subNavRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Scroll active tab into view on tab change
  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeTab]);

  // ── Fetch products for this category ──────────────────────
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['category-products', category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          colors:product_colors (*),
          sizes:product_sizes (*)
        `)
        .eq('category', category)
        .eq('is_active', true);

      if (error) throw error;
      return (data || []) as Product[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // ── Client-side sub-tab filtering ─────────────────────────
  const filteredProducts = useMemo(() => {
    if (activeTab === 'all') return products;
    return products.filter(
      (p) => p.tags && p.tags.some((t) => t === activeTab)
    );
  }, [products, activeTab]);

  // ── Skeleton placeholders ──────────────────────────────────
  const skeletons = Array.from({ length: 8 });

  return (
    <div className="cat-page" style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* ── Hero Banner ─────────────────────────────────────── */}
      <section className="cat-hero" aria-label={`${heroTitle} hero`}>
        {/* Decorative accent overlay */}
        <div
          className="cat-hero-accent"
          style={{ background: heroAccentColor }}
          aria-hidden="true"
        />
        <div className="cat-hero-content container">
          <motion.p
            className="cat-hero-eyebrow"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {heroSubtitle}
          </motion.p>
          <motion.h1
            className="cat-hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {heroTitle}
          </motion.h1>
          <motion.div
            className="cat-hero-line"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            aria-hidden="true"
          />
          <motion.p
            className="cat-hero-meta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {isLoading ? '—' : `${products.length} styles available`}
          </motion.p>
        </div>
        {/* Bottom fade */}
        <div className="cat-hero-fade" aria-hidden="true" />
      </section>

      {/* ── Sticky Sub-Nav Bar ───────────────────────────────── */}
      <div className="cat-sub-nav-wrapper" ref={subNavRef}>
        <nav className="cat-sub-nav" aria-label="Product sub-categories">
          <div className="cat-sub-nav-inner container">
            {/* "All" tab */}
            <button
              ref={activeTab === 'all' ? activeTabRef : undefined}
              onClick={() => setActiveTab('all')}
              className={`cat-sub-nav-tab${activeTab === 'all' ? ' is-active' : ''}`}
              aria-current={activeTab === 'all' ? 'true' : undefined}
            >
              All
            </button>

            {/* Divider */}
            <span className="cat-sub-nav-sep" aria-hidden="true" />

            {subTabs.map((tab) => (
              <button
                key={tab.value}
                ref={activeTab === tab.value ? activeTabRef : undefined}
                onClick={() => setActiveTab(tab.value)}
                className={`cat-sub-nav-tab${activeTab === tab.value ? ' is-active' : ''}`}
                aria-current={activeTab === tab.value ? 'true' : undefined}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* ── Product Grid Section ─────────────────────────────── */}
      <section className="cat-product-section container" aria-label="Products">

        {/* Results count */}
        {!isLoading && (
          <motion.p
            className="cat-results-count"
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {filteredProducts.length === 0
              ? 'No products found'
              : `${filteredProducts.length} item${filteredProducts.length !== 1 ? 's' : ''}`}
          </motion.p>
        )}

        {isLoading ? (
          /* Loading skeletons */
          <div className="cat-product-grid">
            {skeletons.map((_, i) => (
              <div key={i} className="editorial-product-card editorial-skeleton">
                <div className="editorial-product-image-wrap skeleton" />
                <div className="p-4 space-y-3">
                  <div className="h-3 w-1/3 skeleton rounded" />
                  <div className="h-4 w-3/4 skeleton rounded" />
                  <div className="h-4 w-1/4 skeleton rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              className="cat-product-grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  featured={(index + 1) % 5 === 0}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          /* Empty state */
          <motion.div
            className="cat-empty-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="cat-empty-icon">
              <Search size={36} />
            </div>
            <h3 className="cat-empty-title">No products in this category yet</h3>
            <p className="cat-empty-sub">
              Check back soon — new styles drop every week.
            </p>
            <button
              onClick={() => setActiveTab('all')}
              className="btn btn-outline mt-6"
            >
              View All {heroTitle.split("'")[0].split(' ')[0]} Styles
            </button>
          </motion.div>
        )}
      </section>
    </div>
  );
}
