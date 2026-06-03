import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Search, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { CATEGORIES } from '../utils/constants';
import ProductCard from '../components/product/ProductCard';

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const categoryQuery = searchParams.get('category');
  const searchQuery = searchParams.get('search');
  const sortQuery = searchParams.get('sort') || 'newest';

  // Fetch products (mock for now, or real if Supabase is connected)
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', categoryQuery, searchQuery],
    queryFn: async () => {
      let query = supabase.from('products').select(`
        *,
        colors:product_colors (
          *,
          sizes:product_sizes (*)
        )
      `);

      if (categoryQuery) {
        query = query.eq('category', categoryQuery);
      }
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Product[];
    },
  });

  // Client-side sorting & filtering
  const filteredProducts = useMemo(() => {
    let sorted = [...products];

    // Basic active filters
    const activeFilters = {
      priceRange: searchParams.get('priceRange'), // 'under50', '50to100', 'over100'
      // Add more as needed
    };

    if (activeFilters.priceRange) {
      if (activeFilters.priceRange === 'under50') sorted = sorted.filter(p => p.price < 50);
      else if (activeFilters.priceRange === '50to100') sorted = sorted.filter(p => p.price >= 50 && p.price <= 100);
      else if (activeFilters.priceRange === 'over100') sorted = sorted.filter(p => p.price > 100);
    }

    switch (sortQuery) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        // Mock newness by ID or created_at
        sorted.sort((a, b) => (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0));
        break;
    }

    return sorted;
  }, [products, sortQuery, searchParams]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', e.target.value);
    setSearchParams(newParams);
  };

  const handleCategorySelect = (value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('category', value);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
  };

  return (
    <div className="container py-8 md:py-12">
      {/* Page Header */}
      <div className="mb-8 md:mb-12 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            {categoryQuery
              ? CATEGORIES.find((c) => c.value === categoryQuery)?.label || 'Collection'
              : searchQuery
              ? `Search Results: "${searchQuery}"`
              : 'All Products'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {filteredProducts.length} items found
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Mobile Filter Toggle */}
        <div className="flex items-center justify-between lg:hidden mb-4 gap-4">
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
          {(isFilterOpen || window.innerWidth >= 1024) && (
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
                className="absolute inset-y-0 left-0 w-80 lg:w-full lg:static h-full overflow-y-auto lg:overflow-visible p-6 lg:p-0 flex flex-col gap-8"
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
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>
                    Categories
                  </h4>
                  <ul className="space-y-2">
                    <li>
                      <button
                        onClick={() => handleCategorySelect(null)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          !categoryQuery ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        style={{
                          background: !categoryQuery ? 'var(--purple-50)' : 'transparent',
                          color: !categoryQuery ? 'var(--purple-600)' : 'var(--text-secondary)'
                        }}
                      >
                        All Categories
                      </button>
                    </li>
                    {CATEGORIES.map((cat) => (
                      <li key={cat.value}>
                        <button
                          onClick={() => handleCategorySelect(cat.value)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            categoryQuery === cat.value ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:bg-gray-100'
                          }`}
                          style={{
                            background: categoryQuery === cat.value ? 'var(--purple-50)' : 'transparent',
                            color: categoryQuery === cat.value ? 'var(--purple-600)' : 'var(--text-secondary)'
                          }}
                        >
                          {cat.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Sort (Desktop only, mobile is above grid) */}
                <div className="hidden lg:block">
                   <h4 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>
                    Sort By
                  </h4>
                  <div className="relative">
                    <select
                      value={sortQuery}
                      onChange={handleSortChange}
                      className="w-full appearance-none rounded-xl px-4 py-3 text-sm font-medium border pr-10 focus:outline-none"
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

              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="w-full pt-[125%] skeleton" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 w-1/3 skeleton rounded" />
                    <div className="h-5 w-3/4 skeleton rounded" />
                    <div className="h-5 w-1/4 skeleton rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
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
