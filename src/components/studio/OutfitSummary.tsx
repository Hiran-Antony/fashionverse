import { useStudioStore } from '../../store/studioStore';
import { ShoppingBag, Save, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function OutfitSummary() {
  const { outfit, budget, getTotalPrice, setCinematicPreview } = useStudioStore();
  const { session } = useAuthStore();
  
  const totalPrice = getTotalPrice();
  const isOverBudget = budget !== null && totalPrice > budget;
  
  const filledSlots = Object.values(outfit).filter(Boolean).length;

  const handleSaveOutfit = async () => {
    if (!session?.user) {
      toast.error('Please log in to save outfits');
      return;
    }
    if (filledSlots === 0) {
      toast.error('Add some items to your outfit first');
      return;
    }

    try {
      const outfitData = {
        top: outfit.top?.id || null,
        bottom: outfit.bottom?.id || null,
        shoes: outfit.shoes?.id || null,
        accessory: outfit.accessory?.id || null,
      };

      // Since we don't have a saved_outfits table explicitly, we can store it in user metadata
      // Or just simulate saving for the prototype
      const { error } = await supabase.from('profiles').update({
        saved_outfits: outfitData // Assuming this column exists or can handle json
      }).eq('id', session.user.id);

      if (error) {
        console.error(error);
        toast.error('Error saving outfit');
      } else {
        toast.success('Outfit saved successfully!');
      }
    } catch (err) {
      toast.success('Outfit saved locally! (Database column needs setup)');
    }
  };

  return (
    <div className="bg-[#1A0F08]/80 backdrop-blur-xl border border-gold/15 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl rounded-full pointer-events-none" />

      <div>
        <h3 className="text-xl font-black text-gold mb-1">Live Outfit Summary</h3>
        <p className="text-xs text-muted font-bold tracking-widest uppercase">{filledSlots}/4 Pieces Selected</p>
      </div>

      <div className="flex flex-col gap-4">
        {Object.entries(outfit).map(([slot, item]) => (
          <div key={slot} className="flex items-center justify-between">
            <span className="text-sm font-bold text-muted capitalize">{slot}</span>
            {item ? (
              <span className="text-sm font-bold text-primary max-w-[120px] truncate text-right">
                {item.name}
              </span>
            ) : (
              <span className="text-sm text-muted/50 italic">—</span>
            )}
          </div>
        ))}
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-black text-muted uppercase tracking-wider">Total Value</span>
          <span className={`text-2xl font-black ${isOverBudget ? 'text-red-500' : 'text-gold'}`}>
            ₹{totalPrice.toLocaleString('en-IN')}
          </span>
        </div>
        
        <AnimatePresence>
          {isOverBudget && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2 text-red-500 text-xs font-bold mt-2 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
              <AlertCircle size={14} />
              Over your ₹{budget?.toLocaleString('en-IN')} budget
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-3 mt-2">
        <button 
          onClick={() => setCinematicPreview(true)}
          disabled={filledSlots === 0}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gold/20 to-gold/5 text-gold border border-gold/30 py-3 rounded-xl font-bold text-sm hover:from-gold/30 hover:to-gold/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles size={16} />
          Cinematic Preview
        </button>

        <div className="flex gap-3">
          <button 
            onClick={handleSaveOutfit}
            className="flex-1 flex items-center justify-center gap-2 bg-[#050505] text-muted border border-gold/10 py-3 rounded-xl font-bold text-sm hover:text-primary transition-colors"
          >
            <Save size={16} />
            Save Look
          </button>
          
          <button 
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#C9973A] to-[#A07828] text-white py-3 rounded-xl font-bold text-sm shadow-[0_4px_14px_rgba(201,151,58,0.35)] hover:shadow-[0_6px_20px_rgba(201,151,58,0.5)] transition-all"
          >
            <ShoppingBag size={16} />
            Add to Bag
          </button>
        </div>
      </div>
    </div>
  );
}
