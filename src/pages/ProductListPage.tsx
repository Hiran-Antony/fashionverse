import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ChevronDown, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { CATEGORIES, GROUPED_CATEGORIES, PRICE_RANGES, SORT_OPTIONS } from '../utils/constants';
import { Check } from 'lucide-react';
import CategoryProductCard from '../components/product/CategoryProductCard';
import useDeviceOptimization from '../hooks/useDeviceOptimization';
import { useProducts } from '../hooks/useProducts';

export default function ProductListPage() {
  const { isMobile } = useDeviceOptimization();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const categoryQuery = searchParams.get('category');
  const searchQuery = searchParams.get('search');
  const sortQuery = searchParams.get('sort') || 'newest';
  const activeTypes = useMemo(() => searchParams.get('types')?.split(',').filter(Boolean) || [], [searchParams]);

  const selectedGroupHeader = useMemo(() => {
    if (!categoryQuery || !GROUPED_CATEGORIES[categoryQuery] || activeTypes.length === 0) return null;
    const group = GROUPED_CATEGORIES[categoryQuery].find((g: any) => {
      const groupTypes = g.items.map((item: any) => item.value);
      return groupTypes.length === activeTypes.length && groupTypes.every((t: any) => activeTypes.includes(t));
    });
    return group ? group.heading : null;
  }, [categoryQuery, activeTypes]);

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useProducts({
    category: categoryQuery,
    search: searchQuery,
    sort: sortQuery,
    types: activeTypes,
    priceRange: searchParams.get('priceRange'),
  });

  const filteredProducts = useMemo(() => {
    return data?.pages.flat() || [];
  }, [data]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', e.target.value);
    setSearchParams(newParams);
  };

  const handleCategorySelect = (value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('category', value);
      newParams.delete('types');
    } else {
      newParams.delete('category');
      newParams.delete('types');
    }
    setSearchParams(newParams);
      };

  const handleTypeToggle = (typeValue: string) => {
    const newParams = new URLSearchParams(searchParams);
    let types = searchParams.get('types')?.split(',').filter(Boolean) || [];
    if (types.includes(typeValue)) {
      types = types.filter(t => t !== typeValue);
    } else {
      types.push(typeValue);
    }
    if (types.length > 0) {
      newParams.set('types', types.join(','));
    } else {
      newParams.delete('types');
    }
    setSearchParams(newParams);
  };

  
  const currentPriceRange = searchParams.get('priceRange');
  const handlePriceSelect = (rangeLabel: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (rangeLabel) {
      newParams.set('priceRange', rangeLabel);
    } else {
      newParams.delete('priceRange');
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Cinematic Full-Bleed Page Header */}
      <div className="relative py-16 md:py-24 overflow-hidden flex items-center justify-center text-center mb-8" style={{ background: 'var(--gradient-hero)', borderBottom: '1px solid var(--color-border)' }}>
        {/* Floating Particles for Wow Factor */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-[var(--color-gold-primary)] rounded-full animate-pulse"
              style={{
                width: Math.random() * 4 + 2 + 'px',
                height: Math.random() * 4 + 2 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                animationDuration: Math.random() * 3 + 2 + 's',
                animationDelay: Math.random() * 2 + 's',
                boxShadow: 'var(--glow-gold-soft)',
              }}
            />
          ))}
        </div>
        
        <div className="container relative z-10">
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="uppercase tracking-[0.3em] font-bold text-xs md:text-sm mb-4"
            style={{ color: 'var(--color-gold-primary)' }}
          >
            Explore The Collection
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-5xl md:text-7xl font-bold mb-6"
            style={{ color: 'var(--text-primary)' }}
          >
            {categoryQuery
              ? CATEGORIES.find((c) => c.value === categoryQuery)?.label || 'Collection'
              : searchQuery
              ? `"${searchQuery}"`
              : 'All Products'}
          </motion.h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="h-px w-32 mx-auto"
            style={{ background: 'var(--gradient-accent)' }}
          />
        </div>
      </div>

      <div className="container flex flex-col lg:flex-row gap-8 pb-16">
        {/* Mobile Filter Toggle */}
        <div className="flex items-center justify-between lg:hidden mb-4 gap-4 w-full">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="btn btn-outline flex-1 flex items-center justify-center gap-2"
          >
            <SlidersHorizontal size={18} /> Filters
          </button>
          
          <div className="relative flex-1">
            <select
              value={sortQuery}
              onChange={handleSortChange}
              className="w-full appearance-none rounded-xl px-4 py-2.5 text-sm font-medium border pr-10 focus:outline-none"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* Sidebar Filters (Desktop + Mobile overlay) */}
        <AnimatePresence>
          {(isFilterOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`
                fixed inset-0 z-50 lg:static lg:z-auto lg:block lg:w-64 shrink-0
                ${isFilterOpen ? 'block' : 'hidden'}
              `}
            >
              {/* Mobile overlay background */}
              {isFilterOpen && (
                <div
                  className="absolute inset-0 lg:hidden"
                  style={{ background: 'var(--bg-overlay)' }}
                  onClick={() => setIsFilterOpen(false)}
                />
              )}

              <div
                className="absolute inset-y-0 left-0 w-80 lg:w-full lg:static lg:sticky lg:top-24 h-full lg:h-[calc(100vh-8rem)] overflow-y-auto p-6 lg:p-4 lg:pr-2 flex flex-col gap-8 custom-scrollbar rounded-xl"
                style={{
                  background: 'var(--bg-primary)',
                  borderRight: '1px solid var(--border-color)',
                }}
              >
                {/* Mobile header */}
                <div className="flex items-center justify-between lg:hidden mb-4">
                  <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Filters</h3>
                  <button onClick={() => setIsFilterOpen(false)} className="btn-icon btn-ghost">
                    <X size={20} />
                  </button>
                </div>

                {/* Categories */}
                <div style={{ marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,151,58,0.55)', marginBottom: '10px' }}>
                    Browse
                  </h4>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <li>
                      <button
                        onClick={() => handleCategorySelect(null)}
                        style={{
                          width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: '8px',
                          fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none',
                          background: !categoryQuery ? 'rgba(201,151,58,0.12)' : 'transparent',
                          color: !categoryQuery ? '#E8B84B' : 'rgba(245,237,212,0.6)',
                          transition: 'all 0.15s',
                        }}
                      >
                        All Products
                      </button>
                    </li>
                    {CATEGORIES.map((cat) => (
                      <li key={cat.value}>
                        <button
                          onClick={() => handleCategorySelect(cat.value)}
                          style={{
                            width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: '8px',
                            fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none',
                            background: categoryQuery === cat.value ? 'rgba(201,151,58,0.12)' : 'transparent',
                            color: categoryQuery === cat.value ? '#E8B84B' : 'rgba(245,237,212,0.6)',
                            transition: 'all 0.15s',
                          }}
                        >
                          {cat.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Grouped Type Filters — shown when men/women/kids selected */}
                {categoryQuery && GROUPED_CATEGORIES[categoryQuery] && (
                  <div style={{ borderTop: '1px solid rgba(201,151,58,0.12)', paddingTop: '16px' }}>
                    <h4 style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,151,58,0.55)', marginBottom: '10px' }}>
                      Categories
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {selectedGroupHeader ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {GROUPED_CATEGORIES[categoryQuery]
                            .find(g => g.heading === selectedGroupHeader)?.items.map((item) => {
                              const isActive = activeTypes.includes(item.value);
                              return (
                                <button
                                  key={item.value}
                                  onClick={() => handleTypeToggle(item.value)}
                                  style={{
                                    width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: '6px',
                                    fontSize: '13px', fontWeight: isActive ? 600 : 400, border: 'none', cursor: 'pointer',
                                    background: isActive ? 'rgba(201,151,58,0.12)' : 'transparent',
                                    color: isActive ? '#E8B84B' : 'rgba(245,237,212,0.7)',
                                    borderLeft: isActive ? '2px solid #C9973A' : '2px solid transparent',
                                    transition: 'all 0.15s',
                                  }}
                                >
                                  {item.label}
                                </button>
                              );
                            })}
                        </div>
                      ) : (
                        GROUPED_CATEGORIES[categoryQuery].map((group) => {
                          const isOpen = activeGroup === group.heading;
                          const hasActive = group.items.some(i => activeTypes.includes(i.value));
                          return (
                            <div key={group.heading}>
                              {/* Group heading — clickable to expand */}
                              <button
                                onClick={() => setActiveGroup(isOpen ? null : group.heading)}
                                style={{
                                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                  background: isOpen || hasActive ? 'rgba(201,151,58,0.08)' : 'transparent',
                                  color: isOpen || hasActive ? '#C9973A' : 'rgba(245,237,212,0.75)',
                                  fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                                  transition: 'all 0.15s',
                                }}
                              >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {hasActive && (
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C9973A', flexShrink: 0 }} />
                                  )}
                                  {group.heading}
                                </span>
                                <ChevronRight
                                  size={13}
                                  style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                                />
                              </button>

                              {/* Subcategory items */}
                              <AnimatePresence initial={false}>
                                {isOpen && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.18, ease: 'easeInOut' }}
                                    style={{ overflow: 'hidden' }}
                                  >
                                    <div style={{ paddingLeft: '12px', paddingBottom: '4px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                      {group.items.map((item) => {
                                        const isActive = activeTypes.includes(item.value);
                                        return (
                                          <button
                                            key={item.value}
                                            onClick={() => handleTypeToggle(item.value)}
                                            style={{
                                              width: '100%', textAlign: 'left', padding: '6px 10px', borderRadius: '6px',
                                              fontSize: '13px', fontWeight: isActive ? 600 : 400, border: 'none', cursor: 'pointer',
                                              background: isActive ? 'rgba(201,151,58,0.12)' : 'transparent',
                                              color: isActive ? '#E8B84B' : 'rgba(245,237,212,0.55)',
                                              borderLeft: isActive ? '2px solid #C9973A' : '2px solid transparent',
                                              transition: 'all 0.15s',
                                            }}
                                          >
                                            {item.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                
                {/* Price Range Filter */}
                <div style={{ borderTop: '1px solid rgba(201,151,58,0.12)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,151,58,0.55)', marginBottom: '10px' }}>
                    Price Range
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button
                      onClick={() => handlePriceSelect(null)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: '6px',
                        fontSize: '13px', fontWeight: !currentPriceRange ? 600 : 400, border: 'none', cursor: 'pointer',
                        background: !currentPriceRange ? 'rgba(201,151,58,0.12)' : 'transparent',
                        color: !currentPriceRange ? '#E8B84B' : 'rgba(245,237,212,0.7)',
                        borderLeft: !currentPriceRange ? '2px solid #C9973A' : '2px solid transparent',
                        transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                      }}
                    >
                      All Prices
                      {!currentPriceRange && <Check size={14} />}
                    </button>
                    {PRICE_RANGES.map((range) => {
                      let backendVal = '';
                      if (range.label === 'Under ₹500') backendVal = 'under50';
                      else if (range.label === '₹500 – ₹1,000') backendVal = '50to100';
                      else if (range.label === 'Above ₹5,000') backendVal = 'over100';
                      else backendVal = 'over100';

                      const isActive = currentPriceRange === backendVal;
                      return (
                        <button
                          key={range.label}
                          onClick={() => handlePriceSelect(backendVal)}
                          style={{
                            width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: '6px',
                            fontSize: '13px', fontWeight: isActive ? 600 : 400, border: 'none', cursor: 'pointer',
                            background: isActive ? 'rgba(201,151,58,0.12)' : 'transparent',
                            color: isActive ? '#E8B84B' : 'rgba(245,237,212,0.7)',
                            borderLeft: isActive ? '2px solid #C9973A' : '2px solid transparent',
                            transition: 'all 0.15s',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                          }}
                        >
                          {range.label}
                          {isActive && <Check size={14} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop Sort Options (Premium style) */}
                <div className="hidden lg:block" style={{ borderTop: '1px solid rgba(201,151,58,0.12)', paddingTop: '16px', paddingBottom: '16px' }}>
                   <h4 style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,151,58,0.55)', marginBottom: '10px' }}>
                    Sort By
                  </h4>
                  <div className="flex flex-col gap-1">
                    {[
                      { value: 'newest', label: 'Newest Arrivals' },
                      { value: 'price-asc', label: 'Price: Low to High' },
                      { value: 'price-desc', label: 'Price: High to Low' },
                      { value: 'name-asc', label: 'Name: A to Z' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => handleSortChange({ target: { value: opt.value } } as any)}
                        style={{
                          width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: '6px',
                          fontSize: '13px', fontWeight: sortQuery === opt.value ? 600 : 400, border: 'none', cursor: 'pointer',
                          background: sortQuery === opt.value ? 'rgba(201,151,58,0.12)' : 'transparent',
                          color: sortQuery === opt.value ? '#E8B84B' : 'rgba(245,237,212,0.7)',
                          borderLeft: sortQuery === opt.value ? '2px solid #C9973A' : '2px solid transparent',
                          transition: 'all 0.15s',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}
                      >
                        {opt.label}
                        {sortQuery === opt.value && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        <div className="flex-1">
          {/* Horizontal Subcategory Navigation */}
          {categoryQuery && GROUPED_CATEGORIES[categoryQuery] && (
            <div className="w-full border-y border-[rgba(201,151,58,0.15)] bg-[rgba(18,10,6,0.3)] mb-8 overflow-x-auto hide-scrollbar rounded-lg">
              <div className="flex items-center gap-6 md:gap-10 px-6 min-w-max">
                <button
                  onClick={() => handleGroupHeaderSelect(null)}
                  className={`py-4 text-xs md:text-sm font-bold tracking-widest uppercase border-b-2 transition-colors cursor-pointer ${
                    selectedGroupHeader === null
                      ? 'border-[#C9973A] text-[#E8B84B]'
                      : 'border-transparent text-[rgba(245,237,212,0.6)] hover:text-[#C9973A]'
                  }`}
                >
                  All
                </button>
                {GROUPED_CATEGORIES[categoryQuery].map((group) => (
                  <button
                    key={group.heading}
                    onClick={() => handleGroupHeaderSelect(group.heading)}
                    className={`py-4 text-xs md:text-sm font-bold tracking-widest uppercase border-b-2 transition-colors cursor-pointer ${
                      selectedGroupHeader === group.heading
                        ? 'border-[#C9973A] text-[#E8B84B]'
                        : 'border-transparent text-[rgba(245,237,212,0.6)] hover:text-[#C9973A]'
                    }`}
                  >
                    {group.heading}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="products-grid" style={isMobile ? { gridTemplateColumns: '1fr' } : {}}>
              {[...Array(8)].map((_, i) => (
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
            <>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.05 },
                  },
                }}
                className="products-grid"
                style={isMobile ? { gridTemplateColumns: '1fr' } : {}}
              >
                {filteredProducts.map((product) => (
                  <CategoryProductCard key={product.id} product={product} />
                ))}
              </motion.div>

              {hasNextPage && (
                <div className="flex justify-center mt-12 mb-6">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="btn btn-primary px-8 py-3 rounded-xl font-bold text-sm shadow-[0_4px_14px_rgba(201,151,58,0.25)] hover:shadow-[0_6px_20px_rgba(201,151,58,0.4)] transition-all disabled:opacity-50"
                  >
                    {isFetchingNextPage ? 'Loading more...' : 'Load More Products'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                <Search size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No products found</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Try adjusting your filters or search criteria.
              </p>
              <button
                onClick={() => setSearchParams({})}
                className="btn btn-outline mt-6"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

