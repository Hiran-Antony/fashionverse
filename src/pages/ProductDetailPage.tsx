import { useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { Heart, ShoppingBag, Star, Shield, Truck, RotateCcw, Award, Rotate3D, Ruler } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';

import CategoryProductCard from '../components/product/CategoryProductCard';
import SizeGuideModal from '../components/product/SizeGuideModal';
import ReviewsSection from '../components/ReviewsSection';
import OptimizedImage from '../components/OptimizedImage';
import { useProductDetail } from '../hooks/useProductDetail';

const MotionOptimizedImage = motion(OptimizedImage);

const TRUST_BADGES = [
  { icon: <Truck size={18} />, label: 'Free delivery', sub: 'On orders above ₹999' },
  { icon: <RotateCcw size={18} />, label: 'Easy returns', sub: '30-day return policy' },
  { icon: <Shield size={18} />, label: '100% Authentic', sub: 'Verified products only' },
  { icon: <Award size={18} />, label: 'Premium quality', sub: 'Satisfaction guaranteed' },
];

function MagneticSwatch({
  color,
  isSelected,
  onClick,
}: {
  color: any;
  isSelected: boolean;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - rect.left - rect.width / 2) * 0.35;
    const dy = (e.clientY - rect.top - rect.height / 2) * 0.35;
    el.style.transform = `translate(${dx}px, ${dy}px) scale(1.12)`;
  };

  const handleLeave = () => {
    if (ref.current) ref.current.style.transform = '';
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      title={color.color_name}
      className={`pdp-color-swatch${isSelected ? ' is-selected' : ''}`}
      style={{ background: color.hex_code || '#888' }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      aria-label={`Color ${color.color_name}`}
    />
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [is360Active, setIs360Active] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const mainImageRef = useRef<HTMLImageElement>(null);

  const { addItem, openCart } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();

  const { data: product, isLoading, isError } = useProductDetail(id);

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['product-related', id, product?.category],
    queryFn: async () => {
      if (!product?.category) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*, product_colors(*), product_sizes(*)')
        .eq('category', product.category)
        .eq('is_active', true)
        .neq('id', id)
        .limit(3);
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        colors: p.product_colors,
        sizes: p.product_sizes,
      }));
    },
    enabled: !!product?.category && !!id,
  });

  if (isLoading) {
    return (
      <div className="pdp-loading">
        <div className="spinner" />
        <p>Loading product...</p>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="pdp-not-found">
        <p>Product not found.</p>
        <Link to="/products">← Browse Products</Link>
      </div>
    );
  }

  const colors: any[] = product.colors || [];
  const sizes: any[] = product.sizes || [];
  const selectedColor = colors.find((c: any) => c.id === selectedColorId) || colors[0];
  const activeColorIndex = Math.max(0, colors.findIndex((c: any) => c.id === (selectedColor?.id)));
  const inWishlist = isInWishlist(product.id);

  const discount = product.original_price && product.original_price > product.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const flyToCart = () => {
    const img = mainImageRef.current;
    const cartBtn = document.getElementById('nav-cart-btn');
    if (!img || !cartBtn) return;

    const imgRect = img.getBoundingClientRect();
    const cartRect = cartBtn.getBoundingClientRect();
    const clone = img.cloneNode(true) as HTMLImageElement;

    Object.assign(clone.style, {
      position: 'fixed',
      left: `${imgRect.left}px`,
      top: `${imgRect.top}px`,
      width: `${imgRect.width}px`,
      height: `${imgRect.height}px`,
      objectFit: 'cover',
      borderRadius: '12px',
      zIndex: '99999',
      pointerEvents: 'none',
    });

    document.body.appendChild(clone);
    gsap.to(clone, {
      left: cartRect.left + cartRect.width / 2 - 20,
      top: cartRect.top + cartRect.height / 2 - 20,
      width: 40,
      height: 40,
      opacity: 0.15,
      duration: 0.65,
      ease: 'power2.in',
      onComplete: () => clone.remove(),
    });
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2500);
      return;
    }
    flyToCart();
    addItem({
      product_id: product.id,
      color_name: selectedColor?.color_name || '',
      size: selectedSize,
      quantity: 1,
      product_name: product.name,
      product_price: product.price,
      image_url: selectedColor?.image_url || '',
    });
    openCart();
  };

  return (
    <div className="pdp-page">
      <div className="container pdp-container">
        <nav className="pdp-breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/products">Products</Link>
          <span>/</span>
          <span>{product.name}</span>
        </nav>

        <div className="pdp-layout">
          {/* Left — sticky gallery (60%) */}
          <div className="pdp-gallery-col">
            <div className={`pdp-gallery-main${is360Active ? ' is-rotating' : ''}`}>
              <AnimatePresence mode="wait">
                <MotionOptimizedImage
                  ref={mainImageRef}
                  key={selectedColor?.image_url}
                  src={selectedColor?.image_url || ''}
                  alt={`${product.name} in ${selectedColor?.color_name || ''}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="pdp-gallery-image"
                />
              </AnimatePresence>

              {discount > 0 && <span className="pdp-discount-badge">-{discount}% OFF</span>}

              <button
                type="button"
                onClick={() => toggleItem(product.id)}
                className="pdp-wishlist-btn"
                aria-label="Toggle wishlist"
              >
                <Heart size={18} fill={inWishlist ? '#ef4444' : 'none'} />
              </button>

              <button
                type="button"
                className={`pdp-360-btn${is360Active ? ' is-active' : ''}`}
                onClick={() => setIs360Active((v) => !v)}
              >
                <Rotate3D size={14} />
                360° View
              </button>
            </div>

            {colors.length > 0 && (
              <div className="pdp-gallery-dots" role="tablist" aria-label="Product images">
                {colors.map((color: any) => (
                  <button
                    key={color.id}
                    type="button"
                    role="tab"
                    aria-selected={selectedColor?.id === color.id}
                    className={`pdp-gallery-dot${selectedColor?.id === color.id ? ' is-active' : ''}`}
                    onClick={() => setSelectedColorId(color.id)}
                    title={color.color_name}
                  >
                    <OptimizedImage src={color.image_url} alt="" />
                  </button>
                ))}
                <span className="pdp-dot-counter">{activeColorIndex + 1} / {colors.length}</span>
              </div>
            )}
          </div>

          {/* Right — scrollable info (40%) */}
          <div className="pdp-info-col">
            <p className="pdp-brand">{product.brand}</p>
            <h1 className="pdp-title">{product.name}</h1>

            {product.rating > 0 && (
              <div className="pdp-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={15}
                    fill={star <= Math.round(product.rating) ? '#f59e0b' : 'none'}
                    color={star <= Math.round(product.rating) ? '#f59e0b' : 'var(--border-color)'}
                  />
                ))}
                <span>{product.rating}</span>
                {product.review_count > 0 && <span className="pdp-review-count">({product.review_count} reviews)</span>}
              </div>
            )}

            <div className="pdp-price-row">
              <span className="pdp-price">₹{product.price.toLocaleString()}</span>
              {product.original_price && product.original_price > product.price && (
                <>
                  <span className="pdp-price-old">₹{product.original_price.toLocaleString()}</span>
                  <span className="pdp-save">Save ₹{(product.original_price - product.price).toLocaleString()}</span>
                </>
              )}
            </div>

            {colors.length > 0 && (
              <div className="pdp-section">
                <p className="pdp-label">
                  Color: <strong>{selectedColor?.color_name}</strong>
                </p>
                <div className="pdp-colors">
                  {colors.map((color: any) => (
                    <MagneticSwatch
                      key={color.id}
                      color={color}
                      isSelected={selectedColor?.id === color.id}
                      onClick={() => setSelectedColorId(color.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {sizes.length > 0 && (
              <div className="pdp-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <p className="pdp-label" style={{ marginBottom: 0 }}>
                    Size {selectedSize && <strong>{selectedSize}</strong>}
                  </p>
                  <button type="button" className="size-guide-btn" onClick={() => setIsSizeGuideOpen(true)}>
                    <Ruler size={14} /> Size Guide
                  </button>
                </div>
                <div className="pdp-sizes">
                  {sizes.map((s: any) => (
                    <button
                      key={s.id || s.size}
                      type="button"
                      disabled={s.is_out_of_stock || s.stock <= 0}
                      onClick={() => {
                        if (!s.is_out_of_stock && s.stock > 0) {
                          setSelectedSize(s.size);
                          setSizeError(false);
                        }
                      }}
                      className={`pdp-size-pill${selectedSize === s.size ? ' is-selected' : ''}${sizeError && !selectedSize ? ' has-error' : ''}`}
                    >
                      {s.size}
                    </button>
                  ))}
                </div>
                {sizeError && <p className="pdp-size-error">Please select a size to continue.</p>}
              </div>
            )}

            <div className="pdp-cta-row">
              <button type="button" onClick={handleAddToCart} className="pdp-add-btn" id="pdp-add-btn">
                <ShoppingBag size={18} />
                Add to Bag
              </button>
              <button type="button" onClick={() => toggleItem(product.id)} className="pdp-wishlist-secondary">
                <Heart size={20} fill={inWishlist ? '#ef4444' : 'none'} />
              </button>
            </div>

            <div className="pdp-trust-grid">
              {TRUST_BADGES.map((badge) => (
                <div key={badge.label} className="pdp-trust-item">
                  <div className="pdp-trust-icon">{badge.icon}</div>
                  <div>
                    <p>{badge.label}</p>
                    <span>{badge.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {product.description && (
              <div className="pdp-section">
                <h3 className="pdp-details-title">Product Details</h3>
                <p className="pdp-description">{product.description}</p>
                {product.tags && product.tags.length > 0 && (
                  <div className="pdp-tags">
                    {product.tags.map((tag: string) => (
                      <span key={tag} className="pdp-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <ReviewsSection productId={product.id} />
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="pdp-complete-look">
            <p className="pdp-complete-eyebrow">Styled For You</p>
            <h2 className="pdp-complete-title">Complete the Look</h2>
            <div className="products-grid">
              {relatedProducts.map((p: any) => (
                <CategoryProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
      
      <SizeGuideModal 
        isOpen={isSizeGuideOpen} 
        onClose={() => setIsSizeGuideOpen(false)} 
      />
    </div>
  );
}
