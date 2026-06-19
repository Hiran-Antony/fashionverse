import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { Product } from '../../types';

interface ProductPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
  excludeProductId?: string;
}

export default function ProductPickerModal({ isOpen, onClose, onSelect, excludeProductId }: ProductPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-picker', searchQuery],
    queryFn: async () => {
      let query = supabase.from('products').select('*, product_colors(image_url)');
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Product[];
    },
    enabled: isOpen
  });

  const filteredProducts = products.filter(p => p.id !== excludeProductId);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col"
            style={{ 
              background: 'var(--bg-elevated)', 
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-xl)'
            }}
          >
            {/* Header */}
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                Select a Product
              </h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 transition-colors">
                <X size={20} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            {/* Search */}
            <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search catalog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/20 border rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-[#C9973A] transition-colors"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-2 border-[#C9973A] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProducts.map(product => (
                    <motion.button
                      key={product.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onSelect(product)}
                      className="flex items-center gap-4 p-3 rounded-xl border text-left transition-all hover:border-[#C9973A] group"
                      style={{ 
                        background: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)'
                      }}
                    >
                      <div className="w-16 h-16 rounded-lg bg-black/30 overflow-hidden flex-shrink-0">
                        {product.product_colors?.[0]?.image_url ? (
                          <img src={product.product_colors[0].image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-white/30">No Img</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold truncate text-sm" style={{ color: 'var(--text-primary)' }}>{product.name}</h4>
                        <p className="text-xs truncate mt-1" style={{ color: 'var(--text-secondary)' }}>
                          {product.category}
                        </p>
                        <p className="text-sm font-semibold mt-1" style={{ color: '#C9973A' }}>${product.price.toFixed(2)}</p>
                      </div>
                      <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#C9973A' }} />
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
                  No products found. Try a different search.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
