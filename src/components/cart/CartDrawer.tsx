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
            className="fixed inset-0 z-[999] backdrop-blur-[4px]"
            style={{ background: 'rgba(15, 10, 6, 0.75)' }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed top-0 right-0 bottom-0 z-[999] w-full max-w-md flex flex-col border-l backdrop-blur-xl"
            style={{
              background: 'linear-gradient(180deg, rgba(20, 11, 6, 0.97) 0%, rgba(10, 6, 2, 0.99) 100%)',
              borderColor: 'rgba(201, 151, 58, 0.15)',
              boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.6)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-5 border-b"
              style={{ borderColor: 'rgba(201, 151, 58, 0.15)' }}
            >
              <div className="flex items-center gap-2.5">
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(201, 151, 58, 0.15), rgba(201, 151, 58, 0.05))',
                  border: '1px solid rgba(201, 151, 58, 0.25)'
                }}>
                  <ShoppingBag size={18} style={{ color: '#E8B84B' }} />
                </div>
                <h3
                  className="text-lg font-extrabold uppercase tracking-wider"
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    letterSpacing: '0.08em'
                  }}
                >
                  Your Cart
                </h3>
                <span className="badge-count badge-gold px-2.5 py-0.5 rounded-full text-xs font-bold" style={{
                  background: 'rgba(201, 151, 58, 0.15)',
                  color: '#E8B84B',
                  border: '1px solid rgba(201, 151, 58, 0.3)',
                  marginLeft: '4px'
                }}>
                  {items.length}
                </span>
              </div>
              <motion.button
                whileHover={{ rotate: 90, scale: 1.1, color: '#E8B84B' }}
                whileTap={{ scale: 0.9 }}
                onClick={closeCart}
                className="flex items-center justify-center w-8 h-8 rounded-full border border-transparent transition-colors duration-150"
                style={{
                  color: 'rgba(245, 237, 212, 0.6)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(201, 151, 58, 0.1)'
                }}
                aria-label="Close cart"
                id="cart-close-btn"
              >
                <X size={16} />
              </motion.button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
                    style={{ 
                      background: 'rgba(201, 151, 58, 0.05)',
                      border: '1px dashed rgba(201, 151, 58, 0.2)' 
                    }}
                  >
                    <ShoppingBag size={28} style={{ color: 'rgba(201, 151, 58, 0.4)' }} />
                  </div>
                  <h4 className="font-extrabold text-base mb-2" style={{ color: 'var(--text-primary)' }}>
                    Your cart is empty
                  </h4>
                  <p className="text-xs mb-8 max-w-[240px] mx-auto" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    Add some fashionable items to get started on your style journey!
                  </p>
                  <Link
                    to="/products"
                    className="btn btn-primary btn-sm rounded-xl font-bold py-3 px-6 shadow-lg shadow-gold/20"
                    style={{
                      background: 'linear-gradient(135deg, #C9973A, #E8B84B)',
                      color: '#120a06',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                    onClick={closeCart}
                  >
                    Start Shopping <ArrowRight size={14} className="ml-1" />
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
                style={{ 
                  borderColor: 'rgba(201, 151, 58, 0.15)',
                  background: 'rgba(10, 6, 2, 0.4)'
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Subtotal
                  </span>
                  <span className="text-lg font-black" style={{ color: '#E8B84B' }}>
                    {formatPrice(total)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    ✨ Shipping & taxes calculated at checkout
                  </span>
                </div>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Link
                    to="/checkout"
                    className="btn w-full mb-2 flex items-center justify-center gap-2 transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #C9973A 0%, #E8B84B 50%, #C9973A 100%)',
                      color: '#120a06',
                      borderRadius: '14px',
                      padding: '16px 24px',
                      fontWeight: 800,
                      fontSize: '14px',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      boxShadow: '0 6px 20px rgba(201, 151, 58, 0.25)',
                      border: 'none',
                    }}
                    onClick={closeCart}
                    id="cart-checkout-btn"
                  >
                    Checkout — {formatPrice(total)}
                  </Link>
                </motion.div>
                
                <motion.button
                  whileHover={{ color: '#ef4444', scale: 1.02 }}
                  onClick={clearCart}
                  className="w-full text-xs font-semibold flex items-center justify-center gap-1.5 py-1.5 transition-colors duration-150"
                  style={{ 
                    color: 'rgba(201, 151, 58, 0.5)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={13} /> Clear Cart
                </motion.button>
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      whileHover={{ borderColor: 'rgba(201, 151, 58, 0.25)' }}
      className="flex gap-4 p-3.5 rounded-2xl transition-all duration-200"
      style={{
        background: 'rgba(30, 18, 9, 0.45)',
        border: '1px solid rgba(201, 151, 58, 0.12)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Image */}
      <div className="w-20 h-24 rounded-xl overflow-hidden shrink-0" style={{ border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <img
          src={getOptimizedUrl(item.image_url, 200)}
          alt={item.product_name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          loading="lazy"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <h4
            className="text-sm font-extrabold mb-1 truncate text-white"
            style={{ letterSpacing: '0.015em' }}
          >
            {item.product_name}
          </h4>
          <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
            {item.color_name} / {item.size}
          </p>
        </div>
        <p
          className="text-sm font-black"
          style={{ color: '#E8B84B' }}
        >
          {formatPrice(item.product_price)}
        </p>
      </div>

      {/* Quantity & Remove */}
      <div className="flex flex-col items-end justify-between py-0.5">
        <motion.button
          whileHover={{ scale: 1.15, color: '#ef4444' }}
          whileTap={{ scale: 0.9 }}
          onClick={onRemove}
          className="p-1 rounded-full transition-colors flex items-center justify-center"
          style={{ 
            color: 'rgba(201, 151, 58, 0.4)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
          aria-label="Remove item"
        >
          <X size={15} />
        </motion.button>

        {/* Quantity Selector Capsule */}
        <div
          className="flex items-center rounded-full p-0.5"
          style={{ 
            border: '1px solid rgba(201, 151, 58, 0.25)',
            background: 'rgba(10, 6, 2, 0.6)' 
          }}
        >
          <motion.button
            whileHover={item.quantity > 1 ? { scale: 1.1, backgroundColor: 'rgba(201, 151, 58, 0.15)' } : {}}
            whileTap={item.quantity > 1 ? { scale: 0.9 } : {}}
            onClick={() => onUpdateQuantity(item.quantity - 1)}
            className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
            disabled={item.quantity <= 1}
            style={{
              color: item.quantity <= 1 ? 'rgba(201, 151, 58, 0.25)' : '#F5EDD4',
              background: 'transparent',
              border: 'none',
              cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
            }}
          >
            <Minus size={11} />
          </motion.button>
          
          <span
            className="text-xs font-bold w-6 text-center select-none"
            style={{ color: '#F5EDD4' }}
          >
            {item.quantity}
          </span>
          
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(201, 151, 58, 0.15)' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onUpdateQuantity(item.quantity + 1)}
            className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
            style={{
              color: '#F5EDD4',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Plus size={11} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
