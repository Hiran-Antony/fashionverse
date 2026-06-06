import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, DragOverlay, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useStudioStore } from '../store/studioStore';
import { supabase } from '../lib/supabase';
import type { Product } from '../lib/supabase';
import { Layers, Footprints, Watch, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

import MannequinScene from '../components/studio/MannequinScene';
import OutfitSummary from '../components/studio/OutfitSummary';
import AiStylistPanel from '../components/studio/AiStylistPanel';
import ProductDraggable from '../components/studio/ProductDraggable';
import DroppableSlot from '../components/studio/DroppableSlot';

const CATEGORIES = [
  { id: 'top', label: 'Tops', icon: <Layers size={16} /> },
  { id: 'bottom', label: 'Bottoms', icon: <Layers size={16} /> },
  { id: 'shoes', label: 'Shoes', icon: <Footprints size={16} /> },
];

export default function StyleBuilderPage() {
  const { equipItem, isCinematicPreview, setCinematicPreview, activeMannequin, setMannequin } = useStudioStore();
  const [activeCategory, setActiveCategory] = useState<'top' | 'bottom' | 'shoes'>('top');
  const [products, setProducts] = useState<Product[]>([]);
  const [activeDragItem, setActiveDragItem] = useState<{product: Product, slotType: string} | null>(null);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let query = supabase.from('products').select('*, product_colors(image_url, hex_code, color_name)');
        if (activeCategory === 'top') {
          query = query.overlaps('tags', ['T-Shirts', 'Formal Shirts', 'Casual Shirts', 'Shirts', 'Tops & T-Shirts', 'Jackets']);
        }
        if (activeCategory === 'bottom') {
          query = query.overlaps('tags', ['Jeans', 'Trousers', 'Cargo', 'Track Pants', 'Shorts']);
        }
        if (activeCategory === 'shoes') {
          query = query.eq('category', 'footwear');
        }
        
        const { data } = await query.limit(20);
        
        if (data) {
          setProducts(data);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Failed to fetch products", err);
        setProducts([]);
      }
    };
    fetchProducts();
  }, [activeCategory]);

  const handleDragStart = (event: any) => {
    const { active } = event;
    setActiveDragItem(active.data.current);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (over && active.data.current) {
      const { product, slotType } = active.data.current;
      equipItem(slotType, product);
      toast.success(`Equipped ${product.name}`, {
        icon: '✨',
        style: {
          borderRadius: '10px',
          background: '#1A0F08',
          color: '#E8B84B',
          border: '1px solid rgba(232,184,75,0.2)'
        }
      });
    }
    
    setActiveDragItem(null);
  };

  // Enable scrolling by requiring an 8px movement before drag starts
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
    >
      <div className="min-h-screen bg-[#050505] text-primary pt-24 pb-12 relative overflow-hidden">
        
        {/* Cinematic Preview Overlay */}
        <AnimatePresence>
          {isCinematicPreview && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-between py-20"
            >
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
              
              <motion.div 
                initial={{ y: -50, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                transition={{ delay: 0.5 }}
                className="z-10 text-center"
              >
                <h2 className="text-5xl font-black text-white tracking-widest uppercase mb-4" style={{ textShadow: '0 0 40px rgba(201,151,58,0.5)' }}>FashionVerse</h2>
                <p className="text-gold tracking-[0.3em] uppercase text-sm font-bold">Virtual Studio Collection</p>
              </motion.div>

              <motion.button 
                initial={{ y: 50, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                transition={{ delay: 1 }}
                onClick={() => setCinematicPreview(false)}
                className="z-10 pointer-events-auto flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-full font-bold uppercase tracking-wider text-xs transition-all"
              >
                <X size={16} /> Exit Runway Mode
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-[1600px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-[380px_1fr_400px] gap-8 h-[calc(100vh-140px)]">
          
          {/* Left Panel: Inventory */}
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: isCinematicPreview ? 0 : 1 }}
            className={`flex flex-col gap-6 h-full min-h-0 ${isCinematicPreview ? 'pointer-events-none' : ''}`}
          >
            <div className="flex-shrink-0">
              <h1 className="text-3xl font-black text-primary mb-2">Virtual Studio</h1>
              <p className="text-sm text-muted">Drag items onto the mannequin to build your luxury outfit.</p>
            </div>

            {/* Model Selector */}
            <div className="bg-[#1A0F08]/60 p-2 rounded-2xl flex gap-2 border border-gold/10 flex-shrink-0">
              {['male', 'female', 'kids'].map(type => (
                <button
                  key={type}
                  onClick={() => setMannequin(type as any)}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${activeMannequin === type ? 'bg-gold text-black shadow-[0_0_15px_rgba(201,151,58,0.4)]' : 'text-muted hover:text-primary hover:bg-white/5'}`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-4 flex-shrink-0">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`flex-1 flex flex-col items-center gap-2 pb-2 border-b-2 transition-all ${activeCategory === cat.id ? 'border-gold text-gold' : 'border-transparent text-muted hover:text-primary'}`}
                >
                  {cat.icon}
                  <span className="text-[10px] font-bold uppercase tracking-wider">{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 style-scroll">
              {products.length === 0 ? (
                <div className="text-center py-10 text-muted">
                  <Search className="mx-auto mb-3 opacity-20" size={32} />
                  <p className="text-sm font-medium">No premium pieces found.</p>
                  <p className="text-[10px] opacity-50 mt-1">Check your Supabase database.</p>
                </div>
              ) : (
                products.map(product => (
                  <ProductDraggable key={product.id} product={product} slotType={activeCategory} />
                ))
              )}
            </div>
          </motion.div>

          {/* Center Panel: 3D Mannequin */}
          <div className="relative rounded-3xl overflow-hidden border border-white/5 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] bg-gradient-to-b from-[#111] to-[#050505]">
            <DroppableSlot id="mannequin-zone" className="absolute inset-0 w-full h-full z-0" />
            <div className="absolute inset-0 w-full h-full pointer-events-auto z-10">
              <MannequinScene />
            </div>
            
            {/* Instruction Overlay */}
            {!isCinematicPreview && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none opacity-50 text-center">
                <p className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Drag to Rotate • Scroll to Zoom</p>
                <p className="text-[10px] text-gold uppercase tracking-[0.1em] mt-1">Drop items anywhere on model</p>
              </div>
            )}
          </div>

          {/* Right Panel: Summary & AI */}
          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: isCinematicPreview ? 0 : 1 }}
            className={`flex flex-col gap-6 ${isCinematicPreview ? 'pointer-events-none' : ''}`}
          >
            <OutfitSummary />
            <AiStylistPanel />
          </motion.div>

        </div>
      </div>

      {/* Drag Overlay for smooth dragging visual */}
      <DragOverlay dropAnimation={{ duration: 300, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeDragItem ? (
          <div className="w-48 bg-[#1A0F08] border border-gold/50 rounded-2xl p-3 flex items-center gap-4 shadow-[0_20px_50px_rgba(201,151,58,0.3)] opacity-90 scale-105 rotate-3">
            <div className="w-12 h-16 rounded-lg overflow-hidden bg-black/50">
              <img src={activeDragItem.product.images?.[0]} className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-primary truncate max-w-[100px]">{activeDragItem.product.name}</h4>
              <p className="text-xs font-black text-gold mt-1">₹{activeDragItem.product.price.toLocaleString('en-IN')}</p>
            </div>
          </div>
        ) : null}
      </DragOverlay>

    </DndContext>
  );
}
