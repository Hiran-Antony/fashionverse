import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Star, Shield, Truck, RotateCcw, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';

const TRUST_BADGES = [
  { icon: <Truck size={18} />, label: 'Free delivery', sub: 'On orders above ₹999' },
  { icon: <RotateCcw size={18} />, label: 'Easy returns', sub: '30-day return policy' },
  { icon: <Shield size={18} />, label: '100% Authentic', sub: 'Verified products only' },
  { icon: <Award size={18} />, label: 'Premium quality', sub: 'Satisfaction guaranteed' },
];

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);

  const { addItem, openCart } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, colors:product_colors(*), sizes:product_sizes(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--purple-200)', borderTopColor: 'var(--purple-600)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          Loading product...
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: 18, marginBottom: 16 }}>Product not found.</p>
        <Link to="/products" style={{ color: 'var(--purple-600)' }}>← Browse Products</Link>
      </div>
    );
  }

  const colors: any[] = product.colors || [];
  const sizes: any[] = product.sizes || [];

  // Default to first color
  const selectedColor = colors.find((c: any) => c.id === selectedColorId) || colors[0];
  const inWishlist = isInWishlist(product.id);

  const discount = product.original_price && product.original_price > product.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2500);
      return;
    }
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
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <div className="container mx-auto px-4 py-8" style={{ maxWidth: '1300px' }}>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-8 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Link to="/" className="no-underline hover:underline" style={{ color: 'var(--text-muted)' }}>Home</Link>
          <span>/</span>
          <Link to="/products" className="no-underline hover:underline" style={{ color: 'var(--text-muted)' }}>Products</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{product.name}</span>
        </nav>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

          {/* ── LEFT: Image Gallery ─────────────────────────── */}
          <div>
            {/* Main Image */}
            <div
              className="relative rounded-3xl overflow-hidden mb-4"
              style={{ aspectRatio: '3/4', background: 'var(--bg-secondary)' }}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedColor?.image_url}
                  src={selectedColor?.image_url || ''}
                  alt={`${product.name} in ${selectedColor?.color_name || ''}`}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </AnimatePresence>

              {/* Discount Badge */}
              {discount > 0 && (
                <div
                  className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-white text-xs font-bold"
                  style={{ background: 'var(--error)' }}
                >
                  -{discount}% OFF
                </div>
              )}

              {/* Wishlist button on image */}
              <button
                onClick={() => toggleItem(product.id)}
                className="absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(8px)',
                  border: 'none',
                  cursor: 'pointer',
                  color: inWishlist ? '#ef4444' : 'var(--text-secondary)',
                }}
              >
                <Heart size={18} fill={inWishlist ? '#ef4444' : 'none'} />
              </button>
            </div>

            {/* Color Thumbnails */}
            {colors.length > 0 && (
              <div className="flex gap-3">
                {colors.map((color: any) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColorId(color.id)}
                    className="relative rounded-2xl overflow-hidden transition-all"
                    style={{
                      width: '80px',
                      height: '100px',
                      border: (selectedColor?.id === color.id)
                        ? '2.5px solid var(--purple-600)'
                        : '2.5px solid transparent',
                      outline: (selectedColor?.id === color.id) ? '2px solid var(--purple-200)' : 'none',
                      cursor: 'pointer',
                      padding: 0,
                      background: 'var(--bg-secondary)',
                    }}
                  >
                    <img
                      src={color.image_url}
                      alt={color.color_name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Product Info ─────────────────────────── */}
          <div className="flex flex-col gap-6">

            {/* Brand & Title */}
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--purple-600)' }}>
                {product.brand}
              </p>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  lineHeight: 1.25,
                  letterSpacing: '-0.02em',
                  marginBottom: '0.75rem',
                }}
              >
                {product.name}
              </h1>

              {/* Rating */}
              {product.rating > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={15}
                        fill={star <= Math.round(product.rating) ? '#f59e0b' : 'none'}
                        color={star <= Math.round(product.rating) ? '#f59e0b' : 'var(--border-color)'}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {product.rating}
                  </span>
                  {product.review_count > 0 && (
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      ({product.review_count.toLocaleString()} reviews)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center gap-4">
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                }}
              >
                ₹{product.price.toLocaleString()}
              </span>
              {product.original_price && product.original_price > product.price && (
                <>
                  <span className="text-lg line-through" style={{ color: 'var(--text-muted)' }}>
                    ₹{product.original_price.toLocaleString()}
                  </span>
                  <span
                    className="text-sm font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(16,185,129,0.12)', color: '#059669' }}
                  >
                    Save ₹{(product.original_price - product.price).toLocaleString()}
                  </span>
                </>
              )}
            </div>

            {/* Color Selection */}
            {colors.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Color: <span style={{ color: 'var(--purple-600)', fontWeight: 700 }}>{selectedColor?.color_name}</span>
                </p>
                <div className="flex items-center gap-3">
                  {colors.map((color: any) => (
                    <button
                      key={color.id}
                      onClick={() => setSelectedColorId(color.id)}
                      title={color.color_name}
                      className="w-8 h-8 rounded-full transition-all"
                      style={{
                        background: color.hex_code || '#ccc',
                        border: (selectedColor?.id === color.id)
                          ? '3px solid var(--purple-600)'
                          : '3px solid transparent',
                        outline: (selectedColor?.id === color.id) ? '2px solid var(--purple-300)' : 'none',
                        outlineOffset: '2px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {sizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Size:{' '}
                    {selectedSize && (
                      <span style={{ color: 'var(--purple-600)', fontWeight: 700 }}>{selectedSize}</span>
                    )}
                  </p>
                  <button
                    className="text-xs font-medium underline"
                    style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Size guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {sizes.map((s: any) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        if (!s.is_out_of_stock) {
                          setSelectedSize(s.size);
                          setSizeError(false);
                        }
                      }}
                      disabled={s.is_out_of_stock}
                      className="relative w-14 h-12 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: selectedSize === s.size ? 'var(--purple-600)' : 'var(--bg-secondary)',
                        color: selectedSize === s.size ? 'white' : s.is_out_of_stock ? 'var(--text-muted)' : 'var(--text-primary)',
                        border: selectedSize === s.size
                          ? '2px solid var(--purple-600)'
                          : sizeError
                            ? '2px solid var(--error)'
                            : '2px solid var(--border-color)',
                        cursor: s.is_out_of_stock ? 'not-allowed' : 'pointer',
                        opacity: s.is_out_of_stock ? 0.45 : 1,
                      }}
                    >
                      {s.size}
                    </button>
                  ))}
                </div>
                {sizeError && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-medium mt-2"
                    style={{ color: 'var(--error)' }}
                  >
                    Please select a size to continue.
                  </motion.p>
                )}
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm font-bold transition-all"
                style={{
                  background: 'var(--gradient-primary)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
                  fontSize: '0.9375rem',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(124,58,237,0.45)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.35)'; }}
              >
                <ShoppingBag size={18} />
                Add to Bag
              </button>
              <button
                onClick={() => toggleItem(product.id)}
                className="w-14 h-14 flex items-center justify-center rounded-2xl transition-all"
                style={{
                  background: 'var(--bg-secondary)',
                  border: inWishlist ? '2px solid #ef4444' : '2px solid var(--border-color)',
                  color: inWishlist ? '#ef4444' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <Heart size={20} fill={inWishlist ? '#ef4444' : 'none'} />
              </button>
            </div>

            {/* Trust Badges */}
            <div
              className="grid grid-cols-2 gap-3 p-5 rounded-2xl"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
            >
              {TRUST_BADGES.map((badge) => (
                <div key={badge.label} className="flex items-start gap-3">
                  <div style={{ color: 'var(--purple-600)', marginTop: '2px', flexShrink: 0 }}>
                    {badge.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)', marginBottom: '2px' }}>
                      {badge.label}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {badge.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h3
                  className="text-base font-bold mb-3"
                  style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
                >
                  Product Details
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', lineHeight: 1.85 }}>
                  {product.description}
                </p>
                {product.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {product.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                        style={{
                          background: 'var(--purple-50)',
                          color: 'var(--purple-700)',
                          border: '1px solid var(--purple-100)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
