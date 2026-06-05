import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Sparkles,
  ShoppingBag,
  Layers,
  Footprints,
  Watch,
  ArrowRight,
} from 'lucide-react';

const SLOTS = [
  { id: 'top', label: 'Top', icon: <Layers size={22} />, placeholder: 'Add shirt or jacket' },
  { id: 'bottom', label: 'Bottom', icon: <Layers size={22} />, placeholder: 'Add pants or skirt' },
  { id: 'shoes', label: 'Footwear', icon: <Footprints size={22} />, placeholder: 'Add shoes' },
  { id: 'accessory', label: 'Accessory', icon: <Watch size={22} />, placeholder: 'Bag, watch, hat' },
];

const MOCK_PRODUCTS = [
  { id: '1', name: 'Linen Overshirt', price: '₹2,499', img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200&q=80' },
  { id: '2', name: 'Wide Leg Trouser', price: '₹1,899', img: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=200&q=80' },
  { id: '3', name: 'Leather Sneaker', price: '₹4,299', img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200&q=80' },
  { id: '4', name: 'Gold Chain', price: '₹899', img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=200&q=80' },
];

export default function StyleBuilderPage() {
  const [activeSlot, setActiveSlot] = useState<string | null>('top');
  const [filled, setFilled] = useState<Record<string, (typeof MOCK_PRODUCTS)[0] | null>>({
    top: null,
    bottom: null,
    shoes: null,
    accessory: null,
  });

  const addMockItem = (product: (typeof MOCK_PRODUCTS)[0]) => {
    if (!activeSlot) return;
    setFilled((prev) => ({ ...prev, [activeSlot]: product }));
  };

  const filledCount = Object.values(filled).filter(Boolean).length;
  const totalPrice = Object.values(filled).reduce((sum, item) => {
    if (!item) return sum;
    const n = parseInt(item.price.replace(/[^\d]/g, ''), 10);
    return sum + (Number.isNaN(n) ? 0 : n);
  }, 0);

  return (
    <div className="style-builder-page">
      <div className="container style-builder-container">
        <header className="style-builder-header" data-reveal="fade-up">
          <p className="style-builder-eyebrow">Outfit Composer</p>
          <h1 className="style-builder-title">Style Builder</h1>
          <p className="style-builder-subtitle">
            Curate a complete look from our catalog. Save outfits and add everything to bag —
            full builder logic coming soon.
          </p>
          <span className="style-builder-badge">Preview · UI Only</span>
        </header>

        <div className="style-builder-layout">
          {/* Canvas */}
          <div className="style-builder-canvas" data-reveal="fade-up" data-reveal-delay="100">
            <div className="style-builder-mannequin">
              <div className="style-builder-figure" aria-hidden="true">
                <div className={`style-slot style-slot--top${filled.top ? ' is-filled' : ''}`}>
                  {filled.top ? (
                    <img src={filled.top.img} alt={filled.top.name} />
                  ) : (
                    <span>Top</span>
                  )}
                </div>
                <div className={`style-slot style-slot--bottom${filled.bottom ? ' is-filled' : ''}`}>
                  {filled.bottom ? (
                    <img src={filled.bottom.img} alt={filled.bottom.name} />
                  ) : (
                    <span>Bottom</span>
                  )}
                </div>
                <div className={`style-slot style-slot--shoes${filled.shoes ? ' is-filled' : ''}`}>
                  {filled.shoes ? (
                    <img src={filled.shoes.img} alt={filled.shoes.name} />
                  ) : (
                    <span>Shoes</span>
                  )}
                </div>
              </div>
            </div>

            <div className="style-builder-slots">
              {SLOTS.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  className={`style-builder-slot-btn${activeSlot === slot.id ? ' is-active' : ''}${filled[slot.id] ? ' has-item' : ''}`}
                  onClick={() => setActiveSlot(slot.id)}
                >
                  {slot.icon}
                  <span>{slot.label}</span>
                  {filled[slot.id] && <span className="style-slot-dot" />}
                </button>
              ))}
            </div>

            <div className="style-builder-summary">
              <div>
                <p className="style-summary-label">{filledCount}/4 pieces selected</p>
                <p className="style-summary-price">
                  {totalPrice > 0 ? `₹${totalPrice.toLocaleString()}` : '—'}
                </p>
              </div>
              <button type="button" className="btn btn-primary style-add-all" data-magnetic disabled>
                <ShoppingBag size={18} />
                Add Outfit to Bag
              </button>
            </div>
          </div>

          {/* Product picker */}
          <aside className="style-builder-picker" data-reveal="fade-up" data-reveal-delay="200">
            <div className="style-picker-head">
              <Sparkles size={16} />
              <h2>
                Pick a {SLOTS.find((s) => s.id === activeSlot)?.label ?? 'item'}
              </h2>
            </div>

            <div className="style-picker-grid">
              {MOCK_PRODUCTS.map((product, i) => (
                <motion.button
                  key={product.id}
                  type="button"
                  className="style-picker-card"
                  data-reveal="fade-up"
                  data-reveal-delay={String(80 + i * 60)}
                  onClick={() => addMockItem(product)}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <img src={product.img} alt={product.name} loading="lazy" decoding="async" />
                  <div className="style-picker-card-info">
                    <p>{product.name}</p>
                    <span>{product.price}</span>
                  </div>
                  <span className="style-picker-add">
                    <Plus size={14} />
                  </span>
                </motion.button>
              ))}
            </div>

            <Link to="/products" className="style-picker-link no-underline" data-magnetic>
              Browse full catalog
              <ArrowRight size={16} />
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
