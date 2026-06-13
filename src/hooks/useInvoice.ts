import { useState, useCallback } from 'react';

// ─── Types ─────────────────────────────────────────────────────
export interface InvoiceOrder {
  id: string;
  created_at: string;
  status: string;
  payment_method: string;
  total_amount: number;
  delivery_pin?: string;
  address?: {
    name?: string;
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  order_items?: Array<{
    id?: string;
    product_name?: string;
    color_name?: string;
    size?: string;
    quantity: number;
    price: number;
    products?: {
      id?: string;
      name?: string;
      brand?: string;
      category?: string;
      product_type?: string;
    };
  }>;
  profiles?: { name?: string; email?: string };
}

// ─── Hook ──────────────────────────────────────────────────────
export function useInvoice() {
  const [invoiceOrder, setInvoiceOrder] = useState<InvoiceOrder | null>(null);

  const downloadInvoice = useCallback((order: InvoiceOrder) => {
    setInvoiceOrder(order);
    // Slight delay to ensure the component renders with the new order data
    setTimeout(() => {
      const originalTitle = document.title;
      document.title = `FashionVerse-Invoice-FV-${order.id.slice(0, 8).toUpperCase()}`;
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }, 300);
  }, []);

  const sendWhatsAppBill = useCallback((order: InvoiceOrder) => {
    const addr = order.address;
    const customerName = addr?.name || order.profiles?.name || 'Customer';
    const phone = addr?.phone || '';

    const itemLines = (order.order_items || [])
      .map(item => {
        const name = item.products?.name || item.product_name || 'Item';
        const brand = item.products?.brand;
        const details = [item.size && `Size ${item.size}`, item.color_name].filter(Boolean).join(', ');
        return `  • ${name}${brand ? ` [${brand}]` : ''}${details ? ` (${details})` : ''} × ${item.quantity} — ₹${(item.price * item.quantity).toLocaleString('en-IN')}`;
      })
      .join('\n');

    const subtotal = (order.order_items || []).reduce(
      (s, i) => s + i.price * i.quantity,
      0
    );
    const delivery = order.total_amount > subtotal ? order.total_amount - subtotal : 0;
    const deliveryText = delivery === 0 ? 'FREE' : `₹${delivery}`;

    const pinBlock = order.delivery_pin
      ? `\n🔐 *Delivery PIN:* ${order.delivery_pin}\n_(Share only with your delivery partner)_`
      : '';

    const msg = `✦ *FashionVerse Invoice*

*Invoice No:* #FV-${order.id.slice(0, 8).toUpperCase()}
*Date:* ${new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
*Status:* ${order.status.replace(/_/g, ' ').toUpperCase()}

─────────────────────
*Items Ordered:*
${itemLines}

─────────────────────
Subtotal: ₹${subtotal.toLocaleString('en-IN')}
Delivery: ${deliveryText}
*Total: ₹${order.total_amount?.toLocaleString('en-IN')}*
*Payment:* ${order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online'}${pinBlock}

Thank you for shopping with FashionVerse! 🛍️
_Where Style Meets Intelligence_`;

    const encoded = encodeURIComponent(msg);
    // If phone available, open direct chat; else open share dialog
    const url = phone
      ? `https://wa.me/91${phone.replace(/\D/g, '')}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  return { invoiceOrder, setInvoiceOrder, downloadInvoice, sendWhatsAppBill };
}
