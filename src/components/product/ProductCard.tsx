import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Eye, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '../../types';
import { formatPrice } from '../../utils/formatters';
import { getOptimizedUrl } from '../../lib/cloudinary';
import { useWishlistStore } from '../../store/wishlistStore';
import { useCartStore } from '../../store/cartStore';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [activeColorIndex, setActiveColorIndex] = useState(0);

  const { toggleItem, isInWishlist } = useWishlistStore();
  const { openCart, addItem } = useCartStore();

  const colors: any[] = product.colors || product.product_colors || [];
  const activeColor = colors[activeColorIndex] as any;
  // Sizes are attached to the product, not individual colors
  const sizes: any[] = product.sizes || product.product_sizes || [];
  const availableSizes = sizes.filter((s: any) => s.stock > 0);
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (availableSizes.length > 0 && activeColor) {
      // Add first available size by default when clicking quick add
      addItem({
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        color_name: activeColor.color_name,
        size: availableSizes[0].size,
        image_url: activeColor.image_url,
        quantity: 1,
      });
      openCart();
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleItem(product.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {(product.is_new || product.is_featured) && (
          <span className="badge badge-purple text-[10px] font-bold shadow-sm">NEW</span>
        )}
        {product.original_price && product.original_price > product.price && (
          <span className="badge badge-gold text-[10px] font-bold shadow-sm">SALE</span>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        onClick={handleWishlistToggle}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md"
        style={{
          background: inWishlist ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
          color: inWishlist ? 'var(--error)' : 'var(--gray-700)',
          border: '1px solid rgba(255,255,255,0.5)',
        }}
        aria-label="Toggle wishlist"
      >
        <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
      </button>

      {/* Image Gallery Link */}
      <Link
        to={`/product/${product.id}`}
        className="relative block w-full overflow-hidden"
        style={{ background: '#ffffff', aspectRatio: '3/4' }}
      >
        {activeColor?.image_url ? (
          <img
            src={activeColor.image_url}
            alt={`${product.name} - ${activeColor?.color_name || ''}`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-contain transition-transform duration-700 ease-out"
            style={{
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              padding: '8px',
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            No Image
          </div>
        )}

        {/* Quick Actions Overlay (Desktop) */}
        <div
          className={`absolute inset-x-0 bottom-0 p-4 flex gap-2 transition-transform duration-300 ${
            isHovered ? 'translate-y-0' : 'translate-y-full'
          } hidden md:flex`}
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
          }}
        >
          <button
            onClick={handleAddToCart}
            disabled={availableSizes.length === 0}
            className="flex-1 btn btn-sm border-0 font-semibold"
            style={{
              background: availableSizes.length > 0 ? 'white' : 'var(--gray-300)',
              color: availableSizes.length > 0 ? 'var(--gray-900)' : 'var(--gray-500)',
              cursor: availableSizes.length > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            {availableSizes.length > 0 ? (
              <>
                <ShoppingBag size={14} /> Quick Add
              </>
            ) : (
              'Out of Stock'
            )}
          </button>
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center backdrop-blur-md cursor-pointer transition-colors"
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.4)',
              color: 'white',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = 'var(--purple-600)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.color = 'white';
            }}
          >
            <Eye size={16} />
          </div>
        </div>
      </Link>

      {/* Product Details */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-1">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            {product.brand}
          </p>
          {/* Rating placeholder */}
          <div className="flex items-center gap-1 text-[10px] font-medium" style={{ color: 'var(--gold-500)' }}>
            <Star size={10} fill="currentColor" /> 4.8
          </div>
        </div>

        <Link
          to={`/product/${product.id}`}
          className="text-sm font-semibold mb-2 line-clamp-1 no-underline transition-colors"
          style={{ color: 'var(--text-primary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--purple-600)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        >
          {product.name}
        </Link>

        <div className="flex items-center gap-2 mb-4 mt-auto">
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {formatPrice(product.price)}
          </span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-xs line-through" style={{ color: 'var(--text-muted)' }}>
              {formatPrice(product.original_price)}
            </span>
          )}
        </div>

        {/* Color Swatches */}
        {colors.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {colors.map((color: any, idx: number) => (
              <button
                key={color.color_name}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveColorIndex(idx);
                }}
                className="w-5 h-5 rounded-full border transition-all"
                style={{
                  backgroundColor: color.hex_code,
                  borderColor: activeColorIndex === idx ? 'var(--purple-600)' : 'var(--border-color)',
                  boxShadow: activeColorIndex === idx ? '0 0 0 2px var(--bg-primary), 0 0 0 3px var(--purple-400)' : 'none',
                  transform: activeColorIndex === idx ? 'scale(1.1)' : 'scale(1)',
                }}
                aria-label={`Select ${color.color_name}`}
                title={color.color_name}
              />
            ))}
            <span className="text-[10px] ml-1 flex items-center" style={{ color: 'var(--text-muted)' }}>
              {colors.length} colors
            </span>
          </div>
        )}

        {/* Mobile Quick Add (visible only on small screens) */}
        <button
          onClick={handleAddToCart}
          disabled={availableSizes.length === 0}
          className="md:hidden mt-4 btn btn-outline btn-sm w-full py-2"
        >
          {availableSizes.length > 0 ? (
            <>
              <ShoppingBag size={14} /> Add to Cart
            </>
          ) : (
            'Out of Stock'
          )}
        </button>
      </div>
    </motion.div>
  );
}
