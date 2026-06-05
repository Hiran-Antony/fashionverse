import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '../../types';
import { formatPrice } from '../../utils/formatters';
import { useWishlistStore } from '../../store/wishlistStore';
import { useCartStore } from '../../store/cartStore';

interface ProductCardProps {
  product: Product;
  featured?: boolean;
}

export default function ProductCard({ product, featured = false }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [activeColorIndex, setActiveColorIndex] = useState(0);
  const [heartPop, setHeartPop] = useState(false);

  const { toggleItem, isInWishlist } = useWishlistStore();
  const { openCart, addItem } = useCartStore();

  const colors: any[] = product.colors || product.product_colors || [];
  const activeColor = colors[activeColorIndex] as any;
  const sizes: any[] = product.product_sizes || [];
  const availableSizes = sizes.filter((s: any) => s.stock > 0);
  const inWishlist = isInWishlist(product.id);
  const onSale = product.original_price != null && product.original_price > product.price;
  const rating = product.rating || 4.5;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (availableSizes.length > 0 && activeColor) {
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
    e.stopPropagation();
    setHeartPop(true);
    toggleItem(product.id);
    setTimeout(() => setHeartPop(false), 400);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`editorial-product-card${featured ? ' editorial-product-card--featured' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {onSale && <span className="editorial-sale-ribbon">SALE</span>}

      <motion.button
        type="button"
        onClick={handleWishlistToggle}
        className="editorial-wishlist-btn"
        animate={heartPop ? { scale: [1, 1.45, 1] } : { scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        aria-label="Toggle wishlist"
      >
        <Heart size={15} fill={inWishlist ? 'currentColor' : 'none'} />
      </motion.button>

      <Link to={`/product/${product.id}`} className="editorial-product-image-link no-underline">
        <div className="editorial-product-image-wrap">
          {activeColor?.image_url ? (
            <img
              src={activeColor.image_url}
              alt={`${product.name} — ${activeColor.color_name || ''}`}
              loading="lazy"
              decoding="async"
              className={`editorial-product-image${isHovered ? ' is-zoomed' : ''}`}
            />
          ) : (
            <div className="editorial-product-no-image">No Image</div>
          )}
        </div>

        <AnimatePresence>
          {isHovered && colors.length > 1 && (
            <motion.div
              className="editorial-color-swatches"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
              }}
            >
              {colors.slice(0, 6).map((color: any, idx: number) => (
                <motion.button
                  key={color.color_name + idx}
                  type="button"
                  variants={{ hidden: { opacity: 0, y: 8, scale: 0.6 }, visible: { opacity: 1, y: 0, scale: 1 } }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveColorIndex(idx);
                  }}
                  className={`editorial-color-swatch${activeColorIndex === idx ? ' active' : ''}`}
                  style={{ backgroundColor: color.hex_code || '#888' }}
                  aria-label={`Color ${color.color_name}`}
                  title={color.color_name}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </Link>

      <div className="editorial-product-info">
        <div className={`editorial-product-meta${isHovered ? ' is-visible' : ''}`}>
          <p className="editorial-product-brand">{product.brand || 'FashionVerse'}</p>
          <Link to={`/product/${product.id}`} className="editorial-product-name no-underline">
            {product.name}
          </Link>
          <div className="editorial-product-price-row">
            <span className="editorial-product-price">{formatPrice(product.price)}</span>
            {onSale && (
              <span className="editorial-product-price-old">{formatPrice(product.original_price!)}</span>
            )}
          </div>
          <div className="editorial-product-rating">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                size={11}
                className={`editorial-star${i <= Math.round(rating) ? ' filled' : ''}`}
                fill={i <= Math.round(rating) ? 'currentColor' : 'none'}
              />
            ))}
            <span className="editorial-rating-value">{rating.toFixed(1)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={availableSizes.length === 0}
          className={`editorial-add-bar${isHovered ? ' is-visible' : ''}`}
        >
          <ShoppingBag size={14} />
          {availableSizes.length > 0 ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </motion.article>
  );
}
