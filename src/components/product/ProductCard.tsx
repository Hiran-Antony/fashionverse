import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
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
  const activeColor = colors[activeColorIndex] || colors[0];
  const sizes: any[] = product.sizes || product.product_sizes || [];
  const availableSizes = sizes.filter((s: any) => s.stock > 0);
  const inWishlist = isInWishlist(product.id);
  const onSale = product.original_price != null && product.original_price > product.price;
  const rating = product.rating || 4.5;
  const reviewCount = product.review_count || Math.floor(Math.random() * 150) + 10;
  const isOutOfStock = availableSizes.length === 0;

  const handleAddToCart = (e: React.MouseEvent, selectedSize?: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock && activeColor) {
      const sizeToUse = selectedSize || (availableSizes[0]?.size || 'M');
      addItem({
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        color_name: activeColor.color_name || 'Default',
        size: sizeToUse,
        image_url: activeColor.image_url || product.image_url,
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

  const discountPct = onSale && product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  return (
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
      }}
      className={`group relative flex transition-all duration-500 ease-out hover:scale-[1.01] hover:-translate-y-1.5 ${
        featured 
          ? 'flex-col md:flex-row h-auto md:h-[480px] md:col-span-2 rounded-xl overflow-hidden' 
          : 'flex-col h-[420px] md:h-[480px]'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: featured ? 'rgba(45, 26, 0, 0.45)' : 'transparent',
        border: featured ? '1px solid rgba(201, 168, 76, 0.15)' : 'none',
        boxShadow: featured && isHovered ? 'var(--glow-card)' : 'none',
      }}
    >
      {/* 1. PRODUCT IMAGE CONTAINER */}
      <div className={`relative overflow-hidden bg-[#f3f4f6] ${
        featured 
          ? 'w-full h-[320px] md:w-[50%] md:h-full border-b md:border-b-0 md:border-r border-[rgba(201,168,76,0.1)]' 
          : 'w-full h-[68%] rounded-2xl border border-[rgba(201,168,76,0.08)]'
      }`}>
        <Link to={`/product/${product.id}`} className="block w-full h-full">
          {/* Subtle Radial Glow behind the product to simulate studio photoshoot lighting */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.08)_0%,transparent_75%)] pointer-events-none" />

          {activeColor?.image_url || product.image_url ? (
            <img
              src={activeColor?.image_url || product.image_url}
              alt={product.name}
              className="w-full h-full object-contain p-3 transition-transform duration-[1.2s] ease-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium tracking-widest uppercase text-xs">No Image</div>
          )}
        </Link>

        {/* SALE Badge */}
        {onSale && (
          <div className="absolute top-4 left-4 font-bold text-[9px] py-1.5 px-3 z-10 tracking-[0.15em] rounded shadow-md uppercase" style={{ background: 'var(--color-gold-primary)', color: 'var(--text-inverse)' }}>
            -{discountPct}% OFF
          </div>
        )}

        {/* Wishlist Button */}
        <motion.button
          type="button"
          onClick={handleWishlistToggle}
          className="absolute top-4 right-4 w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center z-10 transition-colors shadow-md animate-none"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--color-border)' }}
          animate={heartPop ? { scale: [1, 1.45, 1] } : { scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          whileHover={{ borderColor: 'var(--color-gold-primary)', boxShadow: 'var(--glow-gold-soft)' }}
          aria-label="Toggle wishlist"
        >
          <Heart size={16} fill={inWishlist ? 'var(--color-gold-primary)' : 'none'} color={inWishlist ? 'var(--color-gold-primary)' : 'var(--text-primary)'} className="transition-colors" />
        </motion.button>

        {/* OUT OF STOCK Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 backdrop-blur-[4px] flex flex-col items-center justify-center z-20" style={{ background: 'rgba(26, 15, 0, 0.75)' }}>
            <Bell size={24} className="mb-2" style={{ color: 'var(--color-gold-primary)' }} />
            <span className="font-bold tracking-widest text-xs uppercase" style={{ color: 'var(--text-primary)' }}>OUT OF STOCK</span>
            <span className="text-[9px] mt-1 uppercase tracking-wider opacity-80" style={{ color: 'var(--text-secondary)' }}>Notify me when available</span>
          </div>
        )}

        {/* Size Selection Overlay on Hover (Only for standard vertical card, and not out of stock) */}
        {!featured && !isOutOfStock && (
          <div 
            className={`absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-20 flex flex-col gap-2 border-t border-[rgba(201,168,76,0.15)]`}
            style={{ background: 'rgba(20, 11, 0, 0.75)', backdropFilter: 'blur(16px)' }}
          >
            <p className="text-[9px] text-center font-bold tracking-widest text-[var(--color-gold-primary)] uppercase">
              Quick Add Size
            </p>
            <div className="flex gap-1.5 justify-center flex-wrap">
              {['XS', 'S', 'M', 'L', 'XL'].map((sizeLabel) => {
                const sizeObj = sizes.find(s => s.size === sizeLabel);
                const isAvailable = sizeObj && sizeObj.stock > 0;
                
                return (
                  <button
                    key={sizeLabel}
                    type="button"
                    disabled={!isAvailable}
                    onClick={(e) => handleAddToCart(e, sizeLabel)}
                    className={`text-[10px] font-bold w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isAvailable 
                        ? 'border border-[rgba(201,168,76,0.3)] text-[var(--color-text-secondary)] hover:border-[var(--color-gold-bright)] hover:bg-[var(--color-gold-primary)] hover:text-black active:scale-95 cursor-pointer hover:shadow-[0_0_12px_rgba(201,168,76,0.4)]' 
                        : 'border border-transparent text-[var(--text-muted)] opacity-30 cursor-not-allowed'
                    }`}
                  >
                    {sizeLabel}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2a. STANDARD INFO SECTION (Not featured) */}
      {!featured && (
        <div className="flex flex-col flex-1 py-3.5 px-0.5 relative justify-between bg-transparent">
          <div>
            {/* Brand and Rating */}
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[9px] uppercase tracking-[0.25em] font-bold text-[var(--color-gold-primary)]">
                {product.brand || 'FashionVerse'}
              </p>
              <div className="flex items-center gap-1">
                <Star size={10} fill="var(--color-gold-primary)" className="text-[var(--color-gold-primary)]" />
                <span className="text-[10px] font-semibold text-[var(--text-secondary)]">{rating.toFixed(1)}</span>
              </div>
            </div>
            
            {/* Title */}
            <Link to={`/product/${product.id}`} className="no-underline block mb-2">
              <div className="font-bold text-[14px] leading-tight line-clamp-2 min-h-[38px] hover:text-[var(--color-gold-primary)] transition-colors" style={{ color: 'var(--text-primary)' }}>
                {product.name}
              </div>
            </Link>
          </div>

          {/* Price and Colors */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-[rgba(201,168,76,0.06)]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-[var(--text-primary)]">{formatPrice(product.price)}</span>
              {onSale && (
                <span className="text-xs line-through text-[var(--text-muted)]">{formatPrice(product.original_price!)}</span>
              )}
            </div>

            {/* Color Swatches */}
            {colors.length > 0 && (
              <div className="flex gap-1.5">
                {colors.slice(0, 4).map((color: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveColorIndex(idx);
                    }}
                    className={`w-3.5 h-3.5 rounded-full border border-[var(--color-border)] transition-all cursor-pointer ${
                      activeColorIndex === idx ? 'scale-125 border-[var(--color-gold-primary)] ring-1 ring-[var(--color-gold-primary)]' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color.hex_code || '#888' }}
                    title={color.color_name}
                  />
                ))}
                {colors.length > 4 && (
                  <span className="text-[9px] text-[var(--text-muted)] font-bold self-center">+{colors.length - 4}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2b. FEATURED HORIZONTAL INFO SECTION */}
      {featured && (
        <div className="flex flex-col flex-1 p-6 md:p-8 justify-between bg-[var(--bg-card)]">
          {/* Top block */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[var(--color-gold-primary)]">
                {product.brand || 'FashionVerse'} — Spotlight
              </span>
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={11} 
                      fill={i < Math.floor(rating) ? "var(--color-gold-primary)" : "none"} 
                      color="var(--color-gold-primary)" 
                    />
                  ))}
                </div>
                <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  {rating.toFixed(1)} <span className="opacity-60">({reviewCount})</span>
                </span>
              </div>
            </div>

            {/* Product Title */}
            <Link to={`/product/${product.id}`} className="no-underline block mb-3">
              <h2 className="text-xl md:text-2xl font-bold leading-tight hover:text-[var(--color-gold-primary)] transition-colors" style={{ color: 'var(--text-primary)', }}>
                {product.name}
              </h2>
            </Link>

            {/* Product Description */}
            {product.description && (
              <p className="text-xs text-[var(--text-secondary)] opacity-85 line-clamp-3 mb-4 leading-relaxed font-sans">
                {product.description}
              </p>
            )}

            {/* Price Section */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>{formatPrice(product.price)}</span>
              {onSale && (
                <>
                  <span className="text-sm line-through" style={{ color: 'var(--text-muted)' }}>{formatPrice(product.original_price!)}</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-gold-primary)] bg-[rgba(201,168,76,0.1)] px-2 py-0.5 rounded">
                    -{discountPct}% OFF
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Configuration and Actions */}
          <div className="space-y-6 pt-4 border-t border-[rgba(201,168,76,0.1)]">
            {/* Color Selection */}
            {colors.length > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)] w-12">Colors</span>
                <div className="flex gap-2">
                  {colors.map((color: any, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveColorIndex(idx);
                      }}
                      className={`w-5 h-5 rounded-full border border-[var(--color-border)] transition-all cursor-pointer ${
                        activeColorIndex === idx ? 'scale-125 border-[var(--color-gold-primary)] ring-2 ring-[rgba(201,168,76,0.3)]' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color.hex_code || '#888' }}
                      title={color.color_name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {sizes.length > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)] w-12">Sizes</span>
                <div className="flex gap-2 flex-wrap">
                  {['XS', 'S', 'M', 'L', 'XL'].map((sizeLabel) => {
                    const sizeObj = sizes.find(s => s.size === sizeLabel);
                    const isAvailable = sizeObj && sizeObj.stock > 0;
                    return (
                      <span
                        key={sizeLabel}
                        className={`text-[10px] font-bold px-3 py-1 rounded transition-colors`}
                        style={{
                          border: isAvailable ? '1px solid var(--color-border-hover)' : '1px solid var(--color-border)',
                          color: isAvailable ? 'var(--text-primary)' : 'var(--text-muted)',
                          opacity: isAvailable ? 1 : 0.35,
                          background: isAvailable ? 'rgba(201, 168, 76, 0.03)' : 'transparent'
                        }}
                      >
                        {sizeLabel}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add to Cart Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={(e) => handleAddToCart(e)}
                disabled={isOutOfStock}
                className="w-full md:w-auto md:px-8 py-3.5 font-bold text-[11px] tracking-[0.2em] rounded uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 hover:brightness-110 cursor-pointer"
                style={{ 
                  background: 'var(--gradient-button)', 
                  color: 'var(--text-inverse)',
                  boxShadow: 'var(--glow-button)'
                }}
              >
                <ShoppingBag size={14} />
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.article>
  );
}

