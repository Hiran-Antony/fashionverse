import { useDraggable } from '@dnd-kit/core';
import type { Product } from '../../lib/supabase';
import { GripVertical } from 'lucide-react';
import { CSS } from '@dnd-kit/utilities';
import OptimizedImage from '../OptimizedImage';

interface Props {
  product: Product;
  slotType: 'top' | 'bottom' | 'shoes' | 'accessory';
}

export default function ProductDraggable({ product, slotType }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${slotType}-${product.id}`,
    data: { product, slotType }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`group relative flex items-center gap-4 p-3 rounded-2xl border transition-all duration-300 ${isDragging ? 'bg-[#1A0F08] border-gold shadow-[0_10px_40px_rgba(201,151,58,0.3)] scale-105 cursor-grabbing' : 'bg-[#1A0F08]/40 border-gold/10 hover:border-gold/30 hover:bg-[#1A0F08]/60 cursor-grab'}`}
      {...attributes} 
      {...listeners}
    >
      <div className="w-16 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-black/50">
        <OptimizedImage 
          src={product.product_colors?.[0]?.image_url || product.images?.[0] || 'https://via.placeholder.com/150'} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-primary truncate group-hover:text-gold transition-colors">
          {product.name}
        </h4>
        <p className="text-xs text-muted mt-1 font-medium">{product.brand}</p>
        <p className="text-sm font-black text-gold mt-2">
          ₹{(product.price || 0).toLocaleString('en-IN')}
        </p>
      </div>

      <div className="flex-shrink-0 opacity-20 group-hover:opacity-100 text-gold transition-opacity">
        <GripVertical size={20} />
      </div>
    </div>
  );
}
