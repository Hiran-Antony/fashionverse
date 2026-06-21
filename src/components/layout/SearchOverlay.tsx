import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronRight, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../utils/formatters';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchProduct {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  image_url: string | null;
}

// NLP Engine to extract intent
function parseSearchIntent(query: string) {
  const normalized = query.toLowerCase();
  let targetCategory = null;
  let cleanQuery = query;

  if (/\b(men|mens|male|boys)\b/.test(normalized)) {
    targetCategory = 'men';
    cleanQuery = query.replace(/\b(for\s+)?(men|mens|male|boys)\b/ig, '').trim();
  } else if (/\b(women|womens|female|ladies|girls)\b/.test(normalized)) {
    targetCategory = 'women';
    cleanQuery = query.replace(/\b(for\s+)?(women|womens|female|ladies|girls)\b/ig, '').trim();
  } else if (/\b(kids|children|baby)\b/.test(normalized)) {
    targetCategory = 'kids';
    cleanQuery = query.replace(/\b(for\s+)?(kids|children|baby)\b/ig, '').trim();
  }

  return { targetCategory, cleanQuery };
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSearchQuery('');
    }
  }, [isOpen]);

  // Fetch lightweight search index
  useEffect(() => {
    if (isOpen && products.length === 0) {
      setIsLoading(true);
      supabase
        .from('products')
        .select(`
          id, name, category, brand, price,
          product_colors(image_url)
        `)
        .eq('is_active', true)
        .limit(1000)
        .then(({ data }) => {
          if (data) {
            const formatted = data.map((p: any) => ({
              id: p.id,
              name: p.name,
              category: p.category,
              brand: p.brand,
              price: p.price,
              image_url: p.product_colors?.[0]?.image_url || null
            }));
            setProducts(formatted);
          }
          setIsLoading(false);
        });
    }
  }, [isOpen, products.length]);

  // Initialize Fuse.js for fuzzy matching
  const fuse = useMemo(() => new Fuse(products, {
    keys: [
      { name: 'name', weight: 0.6 },
      { name: 'brand', weight: 0.3 },
      { name: 'category', weight: 0.1 }
    ],
    threshold: 0.4, // Tolerate typos
    ignoreLocation: true,
  }), [products]);

  const { targetCategory, cleanQuery } = parseSearchIntent(searchQuery);

  const results = useMemo(() => {
    if (!searchQuery) return [];
    
    // If there's a clean query, fuzzy search it. Otherwise show all to be filtered.
    let fuzzyResults = cleanQuery 
      ? fuse.search(cleanQuery).map(r => r.item)
      : products;
      
    // NLP: Filter by extracted category
    if (targetCategory) {
      fuzzyResults = fuzzyResults.filter(p => p.category.toLowerCase() === targetCategory);
    }
    
    return fuzzyResults.slice(0, 8); // Top 8 results
  }, [searchQuery, fuse, products, cleanQuery, targetCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Option B: Do nothing on enter, force user to click a product
  };

  const handleProductClick = (id: string) => {
    navigate(`/product/${id}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999]"
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)'
            }}
            onClick={onClose}
          />
          
          {/* Centering Wrapper to protect backdrop-filter context */}
          <div 
            className="fixed inset-0 z-[1000] flex justify-center items-start pointer-events-none"
            style={{ paddingTop: '100px' }}
          >
            {/* Search Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="pointer-events-auto flex flex-col"
              style={{
                width: '90vw',
                maxWidth: '480px',
                background: 'rgba(20, 14, 8, 0.45)',
                backdropFilter: 'blur(20px) saturate(160%)',
                WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                maxHeight: '80vh',
                overflow: 'hidden'
              }}
            >
              {/* SEARCH FASHIONVERSE Label */}
              <div style={{ paddingTop: '16px', paddingLeft: '20px', paddingRight: '20px', paddingBottom: '10px' }}>
                <p style={{
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  color: 'rgba(212, 175, 55, 0.7)',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>
                  Search Fashionverse
                </p>
              </div>

              {/* Search Header */}
              <form onSubmit={handleSubmit} className="relative border-b border-[rgba(212,175,55,0.1)]" style={{ paddingLeft: '20px', paddingRight: '20px', paddingBottom: '12px' }}>
                <div className="relative flex items-center">
                  <Search className="absolute text-[rgba(212,175,55,0.5)]" size={16} style={{ left: '12px' }} />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Try 'shoes for men' or 'summer dress'..."
                    className="w-full focus:outline-none focus:ring-0 text-[var(--text-primary)]"
                    style={{
                      padding: '0 40px 0 36px',
                      height: '44px',
                      background: 'transparent',
                      border: '1px solid rgba(212, 175, 55, 0.2)',
                      borderRadius: '12px',
                      fontSize: '14px',
                    }}
                  />
                  {/* Embedded styles */}
                  <style>{`
                    input::placeholder { color: rgba(212, 175, 55, 0.5) !important; }
                    .glass-chip {
                      padding: 6px 14px;
                      font-size: 13px;
                      background: rgba(255, 255, 255, 0.04);
                      border: 1px solid rgba(212, 175, 55, 0.2);
                      backdrop-filter: blur(10px);
                      -webkit-backdrop-filter: blur(10px);
                      border-radius: 999px;
                      color: var(--text-primary);
                      transition: all 0.2s ease;
                      white-space: nowrap;
                    }
                    .glass-chip:hover {
                      background: rgba(212, 175, 55, 0.12);
                      border-color: rgba(212, 175, 55, 0.45);
                      transform: translateY(-1px);
                    }
                    .glass-close-btn {
                      width: 24px;
                      height: 24px;
                      border-radius: 50%;
                      background: rgba(255, 255, 255, 0.05);
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      color: var(--text-muted);
                      transition: all 0.2s ease;
                      flex-shrink: 0;
                    }
                    .glass-close-btn:hover {
                      background: rgba(212, 175, 55, 0.15);
                      color: var(--color-gold-primary);
                    }
                  `}</style>
                  <button
                    type="button"
                    onClick={onClose}
                    className="absolute glass-close-btn"
                    style={{ right: '10px' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </form>

              {/* Search Results & NLP Feedback */}
              <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px' }}>
                {searchQuery && (
                  <div className="mb-4 flex items-center gap-2 text-[12px] text-[rgba(255,255,255,0.6)]">
                    <Tag size={12} className="text-[var(--color-gold-primary)]" />
                    <span>
                      Searching for <strong>"{cleanQuery || '*'}"</strong>
                      {targetCategory && (
                        <span> in <strong className="text-[var(--color-gold-primary)] capitalize">{targetCategory}</strong></span>
                      )}
                    </span>
                  </div>
                )}

                {isLoading && products.length === 0 ? (
                  <div className="py-6 text-center text-[rgba(255,255,255,0.5)] animate-pulse text-[13px]">
                    Loading search index...
                  </div>
                ) : !searchQuery ? (
                  <div className="py-1">
                    <p className="text-[12px] text-[rgba(255,255,255,0.5)] mb-3">Popular searches</p>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="glass-chip" onClick={() => setSearchQuery('Summer Collection')}>Summer Collection</button>
                      <button type="button" className="glass-chip" onClick={() => setSearchQuery('Sneakers')}>Sneakers</button>
                      <button type="button" className="glass-chip" onClick={() => setSearchQuery('Dresses')}>Dresses</button>
                    </div>
                  </div>
                ) : results.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {results.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleProductClick(product.id)}
                        className="flex items-center gap-3 p-2 rounded-[12px] hover:bg-[rgba(255,255,255,0.03)] transition-colors text-left group border border-transparent hover:border-[rgba(212,175,55,0.15)] w-full"
                      >
                        <div className="w-10 h-10 rounded-lg bg-[rgba(0,0,0,0.5)] overflow-hidden flex-shrink-0 relative">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-[rgba(255,255,255,0.3)]">No Img</div>
                          )}
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[13px] text-[var(--text-primary)] font-medium truncate group-hover:text-[var(--color-gold-primary)] transition-colors">{product.name}</h4>
                          <p className="text-[11px] text-[rgba(255,255,255,0.5)] mt-0.5 truncate">{product.brand} &bull; <span className="capitalize">{product.category}</span></p>
                        </div>
                        <div className="text-right pl-2 pr-1 flex-shrink-0">
                          <p className="text-[13px] text-[var(--color-gold-primary)] font-medium">{formatPrice(product.price)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-[13px] text-[rgba(255,255,255,0.5)]">No products found matching your search.</p>
                  </div>
                )}
              </div>
              
              {/* Command Palette Footer */}
              <div className="flex flex-wrap justify-between items-center gap-2 text-[10px] text-[rgba(255,255,255,0.4)]" style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 20px' }}>
                <span>Type to search across thousands of products</span>
                <span>Select with <kbd style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>Enter</kbd> or Click</span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
