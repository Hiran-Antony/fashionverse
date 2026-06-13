import type { InvoiceOrder } from '../hooks/useInvoice';

interface Props {
  order: InvoiceOrder | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function InvoiceTemplate({ order }: Props) {
  if (!order) return null;

  const addr = order.address || {};
  const items = order.order_items || [];
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = order.total_amount - subtotal;
  const customerName = addr.name || order.profiles?.name || 'Customer';
  const email = order.profiles?.email || '';

  return (
    <div className="invoice-wrapper">
      <div className="invoice-page">

        {/* Watermark */}
        <div className="invoice-watermark">FashionVerse</div>

        {/* ── HEADER ──────────────────────────────── */}
        <div className="invoice-header">
          <div className="invoice-brand">
            {/* Logo text (no image dependency) */}
            <div className="invoice-brand-logo">FV</div>
            <div>
              <h1 className="invoice-brand-name">FashionVerse</h1>
              <p className="invoice-brand-tagline">Where Style Meets Intelligence</p>
              <p className="invoice-brand-url">fashionverse.com</p>
            </div>
          </div>

          <div className="invoice-meta">
            <h2 className="invoice-title">INVOICE</h2>
            <table className="invoice-meta-table">
              <tbody>
                <tr>
                  <td>Invoice No:</td>
                  <td><strong>#FV-{order.id.slice(0, 8).toUpperCase()}</strong></td>
                </tr>
                <tr>
                  <td>Date:</td>
                  <td>{formatDate(order.created_at)}</td>
                </tr>
                <tr>
                  <td>Payment:</td>
                  <td>{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online'}</td>
                </tr>
                <tr>
                  <td>Status:</td>
                  <td><span className="invoice-status-badge">{formatStatus(order.status)}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Gold divider */}
        <div className="invoice-divider" />

        {/* ── CUSTOMER & DELIVERY DETAILS ─────────── */}
        <div className="invoice-details-row">
          <div className="invoice-bill-to">
            <h3>BILL TO</h3>
            <p className="invoice-detail-name">{customerName}</p>
            {addr.phone && <p>{addr.phone}</p>}
            {email && <p>{email}</p>}
          </div>

          <div className="invoice-ship-to">
            <h3>SHIP TO</h3>
            {addr.line1 && <p>{addr.line1}</p>}
            {addr.line2 && <p>{addr.line2}</p>}
            {(addr.city || addr.state) && (
              <p>{[addr.city, addr.state].filter(Boolean).join(', ')}</p>
            )}
            {addr.pincode && <p>PIN: {addr.pincode}</p>}
          </div>

          {order.delivery_pin && (
            <div className="invoice-delivery-pin-section">
              <h3>DELIVERY PIN</h3>
              <div className="invoice-delivery-pin-display">{order.delivery_pin}</div>
              <p className="invoice-pin-note">Share only with your delivery partner</p>
            </div>
          )}
        </div>

        {/* Gold divider */}
        <div className="invoice-divider" />

        {/* ── ITEMS TABLE ─────────────────────────── */}
        <table className="invoice-items-table">
          <thead>
            <tr>
              <th style={{ width: '5%' }}>#</th>
              <th style={{ width: '30%' }}>Item</th>
              <th style={{ width: '15%' }}>Brand</th>
              <th style={{ width: '10%' }}>Size</th>
              <th style={{ width: '10%' }}>Color</th>
              <th style={{ width: '10%', textAlign: 'center' }}>Qty</th>
              <th style={{ width: '10%', textAlign: 'right' }}>Unit Price</th>
              <th style={{ width: '10%', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id || index}>
                <td>{index + 1}</td>
                <td className="invoice-item-name">{item.products?.name || item.product_name || 'Product'}</td>
                <td>{item.products?.brand || '—'}</td>
                <td>{item.size || '—'}</td>
                <td>{item.color_name || '—'}</td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>₹{item.price.toLocaleString('en-IN')}</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── TOTALS ──────────────────────────────── */}
        <div className="invoice-totals">
          <table>
            <tbody>
              <tr>
                <td>Subtotal:</td>
                <td>₹{subtotal.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Delivery:</td>
                <td>{deliveryFee <= 0 ? 'FREE' : `₹${deliveryFee.toLocaleString('en-IN')}`}</td>
              </tr>
              <tr className="invoice-total-row">
                <td>GRAND TOTAL:</td>
                <td>₹{order.total_amount?.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Gold divider */}
        <div className="invoice-divider" />

        {/* ── FOOTER ──────────────────────────────── */}
        <div className="invoice-footer">
          <div className="invoice-thank-you">
            <p className="invoice-thank-msg">✦ Thank you for shopping with FashionVerse</p>
            <p>For support: support@fashionverse.com</p>
            <p>Returns accepted within 14 days of delivery</p>
          </div>
          <div className="invoice-legal">
            <p>This is a computer-generated invoice.</p>
            <p>No signature required.</p>
            <p>Generated on {new Date().toLocaleString('en-IN')}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
