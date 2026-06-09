import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';
import type { ProductCategory } from '../types';
import CategoryProductCard from '../components/product/CategoryProductCard';
import { Search, ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { PRICE_RANGES, SIZES, GROUPED_CATEGORIES } from '../utils/constants';

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

// ─── Filter Section Component ────────────────────────────────

function FilterSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="filter-section">
      <button
        className="filter-section-title w-full flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="pt-1 pb-2 flex flex-col gap-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
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
  const [selectedSubItems, setSelectedSubItems] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<number[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedDiscount, setSelectedDiscount] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const subNavRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Scroll active tab into view on tab change
  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    setSelectedSubItems([]); // Reset inner items when main tab changes
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

  // ── Extract unique colors from products ───────────────────
  const availableColors = useMemo(() => {
    const colorMap = new Map<string, string>();
    products.forEach((p) => {
      const pColors = (p.colors || p.product_colors || []) as any[];
      pColors.forEach((c: any) => {
        if (c.color_name && !colorMap.has(c.color_name)) {
          colorMap.set(c.color_name, c.hex_code || '#888');
        }
      });
    });
    return Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex }));
  }, [products]);

  // ── Extract unique sizes from products ───────────────────
  const availableSizes = useMemo(() => {
    const sizeSet = new Set<string>();
    products.forEach((p) => {
      const pSizes = (p.sizes || p.product_sizes || []) as any[];
      pSizes.forEach((s: any) => {
        if (s.size && s.stock > 0) sizeSet.add(s.size);
      });
    });
    // Sort by SIZES constant order
    const sizeOrder = [...SIZES];
    return Array.from(sizeSet).sort(
      (a, b) => sizeOrder.indexOf(a as any) - sizeOrder.indexOf(b as any)
    );
  }, [products]);

  // ── Extract unique brands from products ───────────────────
  const availableBrands = useMemo(() => {
    const brandSet = new Set<string>();
    products.forEach((p) => {
      if (p.brand) brandSet.add(p.brand.trim());
    });
    return Array.from(brandSet).sort();
  }, [products]);

  // ── Discount filter options ────────────────────────────────
  const discountOptions = [
    { label: '10% and above', value: 10 },
    { label: '20% and above', value: 20 },
    { label: '30% and above', value: 30 },
    { label: '50% and above', value: 50 },
  ];

  // ── Count active filters ──────────────────────────────────
  const activeFilterCount =
    (activeTab !== 'all' ? 1 : 0) +
    selectedPriceRanges.length +
    selectedSizes.length +
    selectedColors.length +
    selectedBrands.length +
    (selectedDiscount !== null ? 1 : 0);

  // ── Clear all filters ─────────────────────────────────────
  const clearAllFilters = useCallback(() => {
    setActiveTab('all');
    setSelectedSubItems([]);
    setSelectedPriceRanges([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedBrands([]);
    setSelectedDiscount(null);
  }, []);

  // ── Toggle helpers ─────────────────────────────────────────
  const toggleSubItem = (item: string) =>
    setSelectedSubItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );

  const togglePriceRange = (idx: number) =>
    setSelectedPriceRanges((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );

  const toggleSize = (size: string) =>
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );

  const toggleColor = (color: string) =>
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );

  const toggleBrand = (brand: string) =>
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );

  // ── Client-side filtering ─────────────────────────────────
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Sub-tab / Category filter
    if (activeTab !== 'all') {
      if (selectedSubItems.length > 0) {
        result = result.filter(
          (p: any) => selectedSubItems.includes(p.product_type) || (p.tags && p.tags.some((t: string) => selectedSubItems.includes(t)))
        );
      } else {
        const groupItems = GROUPED_CATEGORIES[category]?.find(g => g.heading === activeTab)?.items.map(i => i.value) || [];
        result = result.filter(
          (p: any) => 
            p.product_group === activeTab ||
            p.product_type === activeTab ||
            groupItems.includes(p.product_type) ||
            (p.tags && p.tags.some((t: string) => t === activeTab || groupItems.includes(t)))
        );
      }
    }

    // Price range filter
    if (selectedPriceRanges.length > 0) {
      result = result.filter((p) =>
        selectedPriceRanges.some((idx) => {
          const range = PRICE_RANGES[idx];
          return p.price >= range.min && p.price < (range.max === Infinity ? 999999 : range.max);
        })
      );
    }

    // Size filter
    if (selectedSizes.length > 0) {
      result = result.filter((p) => {
        const pSizes = (p.product_sizes || []) as any[];
        return pSizes.some(
          (s: any) => selectedSizes.includes(s.size) && s.stock > 0
        );
      });
    }

    // Color filter
    if (selectedColors.length > 0) {
      result = result.filter((p) => {
        const pColors = (p.colors || p.product_colors || []) as any[];
        return pColors.some((c: any) => selectedColors.includes(c.color_name));
      });
    }

    // Brand filter
    if (selectedBrands.length > 0) {
      result = result.filter((p) => p.brand && selectedBrands.includes(p.brand.trim()));
    }

    // Discount filter
    if (selectedDiscount !== null) {
      result = result.filter((p) => {
        if (!p.original_price || p.original_price <= p.price) return false;
        const discountPct =
          ((p.original_price - p.price) / p.original_price) * 100;
        return discountPct >= selectedDiscount;
      });
    }

    // Sorting
    switch (sortBy) {
      case 'price_low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'popular':
        result.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
        break;
      default: // newest
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
    }

    return result;
  }, [products, activeTab, selectedSubItems, selectedPriceRanges, selectedSizes, selectedColors, selectedBrands, selectedDiscount, sortBy]);

  // ── Skeleton placeholders ──────────────────────────────────
  const skeletons = Array.from({ length: 8 });

  // ── Filter Sidebar Content (reused in desktop & mobile) ───
  const filterContent = (
    <>
      {/* Category Section (Nested Accordion) */}
      <FilterSection title="Categories" defaultOpen={true}>
        <label
          className={`cat-filter-checkbox-label${activeTab === 'all' ? ' is-checked' : ''}`}
          style={{ marginBottom: '1rem' }}
        >
          <input
            type="radio"
            name="subcategory"
            checked={activeTab === 'all'}
            onChange={() => setActiveTab('all')}
            className="cat-filter-radio"
          />
          <span className="cat-filter-radio-custom" />
          <span className="cat-filter-label-text">
            All
            <span className="cat-filter-count">({products.length})</span>
          </span>
        </label>
        
        {GROUPED_CATEGORIES[category]?.map((group) => {
          // Check if this group or any of its items is active
          const isGroupActive = activeTab === group.heading || group.items.some(i => i.value === activeTab);
          
          return (
            <div key={group.heading} className="cat-sidebar-group">
              <label
                className={`cat-filter-checkbox-label${activeTab === group.heading ? ' is-checked' : ''}`}
                style={{ fontWeight: 600, color: 'var(--color-gold-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                onClick={(e) => { e.preventDefault(); setActiveTab(group.heading); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-gold-primary)' }} />
                  {group.heading}
                </div>
                <ChevronDown size={14} style={{ transform: isGroupActive ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
              </label>
              
              <AnimatePresence>
                {isGroupActive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '1.5rem', marginBottom: '1rem' }}
                  >
                    {group.items.map(item => {
                      const count = products.filter((p: any) => p.product_type === item.value || (p.tags && p.tags.includes(item.value))).length;
                      const isSelected = selectedSubItems.includes(item.value);
                      return (
                        <button
                          key={item.value}
                          onClick={() => toggleSubItem(item.value)}
                          className={`cat-sidebar-subitem${isSelected ? ' is-active' : ''}`}
                        >
                          <span className="cat-sidebar-subitem-label">{item.label}</span>
                          {count > 0 && <span className="cat-sidebar-subitem-count">({count})</span>}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </FilterSection>

      {/* Brand Section */}
      <FilterSection title="Brand" defaultOpen={false}>
        {availableBrands.map((brand) => {
          const count = products.filter((p) => p.brand?.trim() === brand).length;
          return (
            <label
              key={brand}
              className={`cat-filter-checkbox-label${selectedBrands.includes(brand) ? ' is-checked' : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand)}
                onChange={() => toggleBrand(brand)}
                className="cat-filter-checkbox"
              />
              <span className="cat-filter-check-custom" />
              <span className="cat-filter-label-text">
                {brand}
                <span className="cat-filter-count">({count})</span>
              </span>
            </label>
          );
        })}
      </FilterSection>

      {/* Price Section */}
      <FilterSection title="Price" defaultOpen={false}>
        {PRICE_RANGES.map((range, idx) => {
          const count = products.filter(
            (p) => p.price >= range.min && p.price < (range.max === Infinity ? 999999 : range.max)
          ).length;
          return (
            <label
              key={idx}
              className={`cat-filter-checkbox-label${selectedPriceRanges.includes(idx) ? ' is-checked' : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedPriceRanges.includes(idx)}
                onChange={() => togglePriceRange(idx)}
                className="cat-filter-checkbox"
              />
              <span className="cat-filter-check-custom" />
              <span className="cat-filter-label-text">
                {range.label}
                {count > 0 && (
                  <span className="cat-filter-count">({count})</span>
                )}
              </span>
            </label>
          );
        })}
      </FilterSection>

      {/* Size Section */}
      <FilterSection title="Size" defaultOpen={false}>
        <div className="cat-filter-size-grid">
          {availableSizes.map((size) => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={`cat-filter-size-btn${selectedSizes.includes(size) ? ' is-active' : ''}`}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Colour Section */}
      <FilterSection title="Colour" defaultOpen={false}>
        <div className="cat-filter-color-grid">
          {availableColors.map((color) => (
            <button
              key={color.name}
              onClick={() => toggleColor(color.name)}
              className={`cat-filter-color-btn${selectedColors.includes(color.name) ? ' is-active' : ''}`}
              title={color.name}
            >
              <span
                className="cat-filter-color-swatch"
                style={{ backgroundColor: color.hex }}
              />
              <span className="cat-filter-color-name">{color.name}</span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Discount Section */}
      <FilterSection title="Discount" defaultOpen={false}>
        {discountOptions.map((opt) => (
          <label
            key={opt.value}
            className={`cat-filter-checkbox-label${selectedDiscount === opt.value ? ' is-checked' : ''}`}
          >
            <input
              type="radio"
              name="discount"
              checked={selectedDiscount === opt.value}
              onChange={() =>
                setSelectedDiscount(
                  selectedDiscount === opt.value ? null : opt.value
                )
              }
              className="cat-filter-radio"
            />
            <span className="cat-filter-radio-custom" />
            <span className="cat-filter-label-text">{opt.label}</span>
          </label>
        ))}
      </FilterSection>
    </>
  );

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

            {subTabs.map((tab) => {
              const isGroupActive = activeTab === tab.value || GROUPED_CATEGORIES[category]?.find(g => g.heading === tab.value)?.items.some(i => i.value === activeTab);
              return (
                <button
                  key={tab.value}
                  ref={isGroupActive ? activeTabRef : undefined}
                  onClick={() => setActiveTab(tab.value)}
                  className={`cat-sub-nav-tab${isGroupActive ? ' is-active' : ''}`}
                  aria-current={isGroupActive ? 'true' : undefined}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* ── Main Content: Sidebar + Products ─────────────────── */}
      <div className="cat-content-layout container">
        {/* ── Desktop Filter Sidebar ─────────────────────────── */}
        <aside 
          className="cat-filter-sidebar" 
          aria-label="Filters"
          onWheel={(e) => e.stopPropagation()}
          style={{
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 180px)',
            position: 'sticky',
            top: 180,
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <div className="cat-filter-sidebar-header">
            <h2 className="filter-heading">
              <SlidersHorizontal size={16} />
              Filters
            </h2>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="cat-filter-clear-btn"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Active filter tags */}
          {activeFilterCount > 0 && (
            <div className="cat-filter-active-tags">
              {activeTab !== 'all' && (
                <span className="cat-filter-tag">
                  {subTabs.find((t) => t.value === activeTab)?.label || activeTab}
                  <button onClick={() => setActiveTab('all')} className="cat-filter-tag-remove">
                    <X size={12} />
                  </button>
                </span>
              )}
              {selectedPriceRanges.map((idx) => (
                <span key={`price-${idx}`} className="cat-filter-tag">
                  {PRICE_RANGES[idx].label}
                  <button onClick={() => togglePriceRange(idx)} className="cat-filter-tag-remove">
                    <X size={12} />
                  </button>
                </span>
              ))}
              {selectedSizes.map((size) => (
                <span key={`size-${size}`} className="cat-filter-tag">
                  Size: {size}
                  <button onClick={() => toggleSize(size)} className="cat-filter-tag-remove">
                    <X size={12} />
                  </button>
                </span>
              ))}
              {selectedBrands.map((brand) => (
                <span key={`brand-${brand}`} className="cat-filter-tag">
                  {brand}
                  <button onClick={() => toggleBrand(brand)} className="cat-filter-tag-remove">
                    <X size={12} />
                  </button>
                </span>
              ))}
              {selectedColors.map((color) => (
                <span key={`color-${color}`} className="cat-filter-tag">
                  {color}
                  <button onClick={() => toggleColor(color)} className="cat-filter-tag-remove">
                    <X size={12} />
                  </button>
                </span>
              ))}
              {selectedDiscount !== null && (
                <span className="cat-filter-tag">
                  {selectedDiscount}%+ off
                  <button onClick={() => setSelectedDiscount(null)} className="cat-filter-tag-remove">
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>
          )}

          <div className="mb-4">{filterContent}</div>
        </aside>

        {/* ── Mobile Filter Toggle ───────────────────────────── */}
        <button
          className="cat-mobile-filter-toggle"
          onClick={() => setMobileFilterOpen(true)}
        >
          <SlidersHorizontal size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span className="cat-mobile-filter-badge">{activeFilterCount}</span>
          )}
        </button>

        {/* ── Mobile Filter Overlay ──────────────────────────── */}
        <AnimatePresence>
          {mobileFilterOpen && (
            <>
              <motion.div
                className="cat-mobile-filter-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileFilterOpen(false)}
              />
              <motion.aside
                className="cat-mobile-filter-panel"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              >
                <div className="cat-mobile-filter-header">
                  <h2 className="filter-heading">
                    <SlidersHorizontal size={16} />
                    Filters
                  </h2>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="cat-mobile-filter-close"
                  >
                    <X size={20} />
                  </button>
                </div>
                {activeFilterCount > 0 && (
                  <div className="cat-filter-active-tags" style={{ padding: '0 20px 12px' }}>
                    <button
                      onClick={clearAllFilters}
                      className="cat-filter-clear-btn"
                    >
                      Clear All
                    </button>
                  </div>
                )}
                <div className="mb-4">{filterContent}</div>
                <div className="cat-mobile-filter-footer">
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="cat-mobile-filter-apply"
                  >
                    Show {filteredProducts.length} Results
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── Product Grid Section ─────────────────────────────── */}
        <section className="cat-product-main" aria-label="Products">
          {/* Sort bar + Results count */}
          <div className="cat-sort-bar">
            {!isLoading && (
              <motion.p
                className="cat-results-count"
                key={`${activeTab}-${selectedPriceRanges.join()}-${selectedSizes.join()}-${selectedColors.join()}-${selectedDiscount}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {filteredProducts.length === 0
                  ? 'No products found'
                  : `${filteredProducts.length} item${filteredProducts.length !== 1 ? 's' : ''}`}
              </motion.p>
            )}
            <div className="cat-sort-select-wrap">
              <label className="cat-sort-label" htmlFor="cat-sort">Sort by:</label>
              <select
                id="cat-sort"
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            /* Loading skeletons */
            <div className="products-grid">
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
                key={`${activeTab}-${sortBy}`}
                className="products-grid"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {filteredProducts.map((product, index) => (
                  <CategoryProductCard key={product.id} product={product} />
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
              <h3 className="cat-empty-title">No products match your filters</h3>
              <p className="cat-empty-sub">
                Try adjusting your filters or clearing them to see more results.
              </p>
              <button
                onClick={clearAllFilters}
                className="btn btn-outline mt-6"
              >
                Clear All Filters
              </button>
            </motion.div>
          )}
        </section>
      </div>
    </div>
  );
}
