import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import { useWishlistStore } from '../../store/wishlistStore';
import { useCartStore } from '../../store/cartStore';
import type { Product } from '../../types';
import OptimizedImage from '../OptimizedImage';
import useDeviceOptimization from '../../hooks/useDeviceOptimization';

interface Props {
  product: Product;
}

export default function CategoryProductCard({ product }: Props) {
  const navigate = useNavigate();
  const { isMobile } = useDeviceOptimization();
  const [activeColorIndex, setActiveColorIndex] = useState(0);
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

  const discountPct = onSale && product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(product.id);
  };

  const handleAddToCart = (e: React.MouseEvent, sizeLabel: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock && activeColor) {
      addItem({
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        color_name: activeColor.color_name || 'Default',
        size: sizeLabel,
        image_url: activeColor.image_url || product.image_url,
        quantity: 1,
      });
      openCart();
    }
  };

  return (
    <div className="product-card" onClick={() => navigate(`/product/${product.id}`)}>
      <div className="product-card-image-wrap">
        <OptimizedImage 
          src={activeColor?.image_url || product.image_url} 
          alt={product.name} 
          sizes={isMobile ? "400px" : "(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px"}
        />
        
        {onSale && (
          <div className="product-sale-badge">-{discountPct}% OFF</div>
        )}

        <button 
          className={`product-wishlist-btn ${inWishlist ? 'active' : ''}`}
          onClick={handleWishlistToggle}
        >
          <Heart />
        </button>

        {!isOutOfStock && (
          <div className="quick-add-bar">
            <span className="quick-add-label">Quick Add Size</span>
            {['XS', 'S', 'M', 'L', 'XL'].map((sizeLabel) => {
              const sizeObj = sizes.find(s => s.size === sizeLabel);
              if (sizeObj && sizeObj.stock > 0) {
                return (
                  <button 
                    key={sizeLabel}
                    className="quick-size-btn"
                    onClick={(e) => handleAddToCart(e, sizeLabel)}
                  >
                    {sizeLabel}
                  </button>
                );
              }
              return null;
            })}
          </div>
        )}
      </div>

      <div className="product-card-info">
        <span className="product-brand">{product.brand || 'FashionVerse'}</span>
        <span className="product-name">{product.name}</span>
        
        <div className="product-price-row">
          <span className="product-price">₹{product.price.toLocaleString()}</span>
          {onSale && (
            <span className="product-price-original">₹{product.original_price?.toLocaleString()}</span>
          )}
        </div>

        <div className="product-rating-row">
          <div className="product-stars">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className="product-star" 
                fill={i < Math.floor(rating) ? "#C9973A" : "none"}
              />
            ))}
          </div>
          <span className="product-rating-number">({reviewCount})</span>
        </div>

        {colors.length > 0 && (
          <div className="product-color-swatches">
            {colors.slice(0, 4).map((color: any, idx: number) => (
              <button
                key={idx}
                className={`color-swatch ${activeColorIndex === idx ? 'active' : ''}`}
                style={{ backgroundColor: color.hex_code || '#888' }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveColorIndex(idx);
                }}
                title={color.color_name}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
