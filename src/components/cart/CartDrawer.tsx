import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore, type LocalCartItem } from '../../store/cartStore';
import { formatPrice } from '../../utils/formatters';
import { getOptimizedUrl } from '../../lib/cloudinary';

export default function CartDrawer() {
  const { items, isCartOpen, closeCart, removeItem, updateQuantity, getTotal, clearCart } =
    useCartStore();

  const total = getTotal();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-50"
            style={{ background: 'var(--bg-overlay)' }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md flex flex-col border-l"
            style={{
              background: 'var(--bg-primary)',
              borderColor: 'var(--border-color)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} style={{ color: 'var(--purple-600)' }} />
                <h3
                  className="text-lg font-bold"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Your Cart
                </h3>
                <span className="badge badge-purple">{items.length}</span>
              </div>
              <button
                onClick={closeCart}
                className="btn-icon btn-ghost"
                aria-label="Close cart"
                id="cart-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                    style={{ background: 'var(--bg-secondary)' }}
                  >
                    <ShoppingBag size={32} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Your cart is empty
                  </p>
                  <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                    Add some fashionable items to get started!
                  </p>
                  <Link
                    to="/products"
                    className="btn btn-primary btn-sm"
                    onClick={closeCart}
                  >
                    Start Shopping <ArrowRight size={16} />
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {items.map((item) => (
                    <CartItemCard
                      key={`${item.product_id}-${item.color_name}-${item.size}`}
                      item={item}
                      onRemove={() =>
                        removeItem(item.product_id, item.color_name, item.size)
                      }
                      onUpdateQuantity={(qty) =>
                        updateQuantity(item.product_id, item.color_name, item.size, qty)
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div
                className="px-6 py-4 border-t"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Subtotal
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {formatPrice(total)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Shipping & taxes calculated at checkout
                  </span>
                </div>
                <Link
                  to="/checkout"
                  className="btn btn-primary w-full mb-2"
                  onClick={closeCart}
                  id="cart-checkout-btn"
                >
                  Checkout — {formatPrice(total)}
                </Link>
                <button
                  onClick={clearCart}
                  className="btn btn-ghost w-full text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Trash2 size={14} /> Clear Cart
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CartItemCard({
  item,
  onRemove,
  onUpdateQuantity,
}: {
  item: LocalCartItem;
  onRemove: () => void;
  onUpdateQuantity: (qty: number) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex gap-4 p-3 rounded-xl"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-light)',
      }}
    >
      {/* Image */}
      <div className="w-20 h-24 rounded-lg overflow-hidden shrink-0">
        <img
          src={getOptimizedUrl(item.image_url, 200)}
          alt={item.product_name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold mb-0.5 truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {item.product_name}
        </p>
        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
          {item.color_name} / {item.size}
        </p>
        <p
          className="text-sm font-bold"
          style={{ color: 'var(--purple-600)' }}
        >
          {formatPrice(item.product_price)}
        </p>
      </div>

      {/* Quantity & Remove */}
      <div className="flex flex-col items-end justify-between">
        <button
          onClick={onRemove}
          className="p-1 rounded-md transition-colors"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Remove item"
        >
          <X size={16} />
        </button>

        <div
          className="flex items-center gap-1 rounded-lg"
          style={{ border: '1px solid var(--border-color)' }}
        >
          <button
            onClick={() => onUpdateQuantity(item.quantity - 1)}
            className="p-1.5"
            disabled={item.quantity <= 1}
            style={{
              color: item.quantity <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
              background: 'transparent',
              border: 'none',
              cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
            }}
          >
            <Minus size={14} />
          </button>
          <span
            className="text-sm font-semibold w-6 text-center"
            style={{ color: 'var(--text-primary)' }}
          >
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.quantity + 1)}
            className="p-1.5"
            style={{
              color: 'var(--text-primary)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
