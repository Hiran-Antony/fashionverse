import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useWishlistStore } from '../store/wishlistStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import CategoryProductCard from '../components/product/CategoryProductCard';

export default function WishlistPage() {
  const { items } = useWishlistStore();

  const isEmpty = items.length === 0;

  const { data: products, isLoading } = useQuery({
    queryKey: ['wishlist-products', items],
    queryFn: async () => {
      if (!items.length) return [];
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, price, original_price, description, category, brand, rating, review_count, tags, is_featured,
          product_colors (id, product_id, color_name, hex_code, image_url),
          product_sizes (id, size, stock, is_out_of_stock)
        `)
        .in('id', items);
      
      if (error) throw error;
      return data;
    },
    enabled: items.length > 0,
  });

  if (isEmpty) {
    return (
      <div className="wishlist-empty">
        <div className="float-dot" style={{ top: '20%', left: '15%', animationDelay: '0s' }}></div>
        <div className="float-dot" style={{ top: '25%', right: '20%', animationDelay: '1s' }}></div>
        <div className="float-dot" style={{ bottom: '30%', left: '20%', animationDelay: '2s' }}></div>
        <div className="float-dot" style={{ bottom: '25%', right: '15%', animationDelay: '1.5s' }}></div>

        <div className="wishlist-empty-icon">
          <Heart />
        </div>

        <span className="wishlist-empty-tag">✦ YOUR COLLECTION</span>
        
        <h1 className="wishlist-empty-title">
          Your Wishlist<br />
          Awaits You
        </h1>
        
        <p className="wishlist-empty-subtitle">
          Save your favourite pieces here<br />
          and return to them anytime.<br />
          Your perfect style is waiting.
        </p>

        <div className="wishlist-hints">
          <div className="wishlist-hint-item">
            <div className="wishlist-hint-icon">❤️</div> Save favourites
          </div>
          <div className="wishlist-hint-item">
            <div className="wishlist-hint-icon">🔔</div> Price drop alerts
          </div>
          <div className="wishlist-hint-item">
            <div className="wishlist-hint-icon">🛍️</div> Quick add to cart
          </div>
        </div>

        <Link to="/" className="wishlist-discover-btn">
          Discover Products ✦
        </Link>
        
        <Link to="/men" className="wishlist-browse-link">
          Browse new arrivals →
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          My Wishlist
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {items.length} saved {items.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      {/* Wishlist Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="loading loading-spinner text-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
          <AnimatePresence>
            {products?.map((product, index) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                className="wishlist-custom-card"
              >
                <CategoryProductCard product={product as any} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Continue Shopping */}
      <div className="mt-12 text-center">
        <Link to="/products" className="btn btn-outline inline-flex gap-2">
          <ShoppingBag size={16} /> Continue Shopping <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

