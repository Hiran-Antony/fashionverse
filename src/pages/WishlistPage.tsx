import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlistStore } from '../store/wishlistStore';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const { items, removeItem } = useWishlistStore();

  // items are product IDs — we'll show a meaningful UI
  const isEmpty = items.length === 0;

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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        <AnimatePresence>
          {items.map((productId, index) => (
            <motion.div
              key={productId}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05 }}
              className="relative rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
              }}
            >
              {/* Placeholder image */}
              <div
                className="w-full pt-[125%] relative"
                style={{ background: 'var(--bg-secondary)' }}
              >
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Heart size={28} style={{ color: '#ef4444' }} fill="#ef4444" />
                  <span className="text-xs font-medium">Saved Item</span>
                </div>

                {/* Remove from wishlist */}
                <button
                  onClick={() => {
                    removeItem(productId);
                    toast('Removed from wishlist');
                  }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.9)',
                    color: '#ef4444',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Info */}
              <div className="p-3 flex flex-col gap-2 flex-1">
                <p
                  className="text-xs font-medium line-clamp-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Saved Product
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  ID: {productId.slice(0, 8)}...
                </p>
                <div className="flex flex-col gap-2 mt-auto pt-2">
                  <Link
                    to={`/product/${productId}`}
                    className="btn btn-outline btn-sm text-xs text-center justify-center no-underline"
                  >
                    View Product
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Continue Shopping */}
      <div className="mt-12 text-center">
        <Link to="/products" className="btn btn-outline inline-flex gap-2">
          <ShoppingBag size={16} /> Continue Shopping <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

