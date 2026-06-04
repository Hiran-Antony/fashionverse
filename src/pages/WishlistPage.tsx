import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import { useWishlistStore } from '../store/wishlistStore';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const { items, removeItem } = useWishlistStore();

  // items are product IDs — we'll show a meaningful UI
  const isEmpty = items.length === 0;

  if (isEmpty) {
    return (
      <div className="container py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm mx-auto"
        >
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: '#fee2e2', color: '#ef4444' }}
          >
            <Heart size={40} />
          </div>
          <h1
            className="text-3xl font-bold mb-3"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Your Wishlist is Empty
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            Save your favourite items here and come back to them anytime!
          </p>
          <Link to="/products" className="btn btn-primary">
            <Sparkles size={16} /> Discover Products
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
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
