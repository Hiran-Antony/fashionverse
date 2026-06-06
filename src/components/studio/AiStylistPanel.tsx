import { useState } from 'react';
import { Bot, Sparkles, TrendingUp, Palette, Target, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudioStore } from '../../store/studioStore';
import { supabase } from '../../lib/supabase';
import type { Product } from '../../lib/supabase';

export default function AiStylistPanel() {
  const { outfit, budget, setAiScore, aiScore, setBudget, equipItem, activeMannequin } = useStudioStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const filledSlots = Object.values(outfit).filter(Boolean).length;

  const analyzeOutfit = () => {
    if (filledSlots < 2) return;
    setIsAnalyzing(true);
    // Fake AI delay
    setTimeout(() => {
      setAiScore(Math.floor(Math.random() * 15) + 85); // 85-99 score
      setIsAnalyzing(false);
    }, 2000);
  };

  const generateBudgetOutfit = async () => {
    if (!budget) return;
    setIsGenerating(true);
    
    try {
      // Very naive budget allocation just for the prototype
      const allocations = {
        top: budget * 0.3,
        bottom: budget * 0.3,
        shoes: budget * 0.3,
        accessory: budget * 0.1
      };

      const { data: allProducts } = await supabase.from('products').select('*');
      
      if (allProducts) {
        const tops = allProducts.filter(p => p.category === 'Men' && p.sub_category === 'T-Shirts' && p.price <= allocations.top);
        const bottoms = allProducts.filter(p => p.category === 'Men' && p.sub_category === 'Jeans' && p.price <= allocations.bottom);
        const shoes = allProducts.filter(p => p.category === 'Men' && p.sub_category === 'Sneakers' && p.price <= allocations.shoes);
        
        if (tops.length > 0) equipItem('top', tops[Math.floor(Math.random() * tops.length)]);
        if (bottoms.length > 0) equipItem('bottom', bottoms[Math.floor(Math.random() * bottoms.length)]);
        if (shoes.length > 0) equipItem('shoes', shoes[Math.floor(Math.random() * shoes.length)]);
        
        // Auto analyze after generation
        setTimeout(analyzeOutfit, 1000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-[#1A0F08]/80 backdrop-blur-xl border border-gold/15 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
          <Bot size={20} />
        </div>
        <div>
          <h3 className="text-lg font-black text-primary">AI Stylist</h3>
          <p className="text-xs text-muted">Powered by FashionVerse AI</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Budget Generator */}
        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Budget Constraint</label>
          <div className="flex gap-2">
            <select 
              value={budget || ''} 
              onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : null)}
              className="flex-1 bg-black/50 border border-gold/20 rounded-xl px-4 py-2.5 text-sm font-medium text-primary focus:outline-none focus:border-gold/50"
            >
              <option value="">No Budget Limit</option>
              <option value="5000">Under ₹5,000</option>
              <option value="10000">Under ₹10,000</option>
              <option value="20000">Under ₹20,000</option>
            </select>
            <button 
              onClick={generateBudgetOutfit}
              disabled={!budget || isGenerating}
              className="bg-gold/10 text-gold border border-gold/20 px-4 rounded-xl hover:bg-gold/20 disabled:opacity-50 transition-colors"
            >
              <Sparkles size={18} className={isGenerating ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Style Analyzer */}
        <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-wider">Overall Style Score</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-gold">
                  {isAnalyzing ? '--' : aiScore ? aiScore : '0'}
                </span>
                <span className="text-sm font-bold text-muted">/100</span>
              </div>
            </div>
            
            <button
              onClick={analyzeOutfit}
              disabled={filledSlots < 2 || isAnalyzing}
              className="text-xs font-bold bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/10 hover:text-gold transition-colors disabled:opacity-50"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Look'}
            </button>
          </div>

          <AnimatePresence>
            {aiScore && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <Palette size={14} className="text-gold" />
                  <div className="flex-1">
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-primary">Color Harmony</span>
                      <span className="text-gold">Excellent</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: '92%' }} className="h-full bg-gradient-to-r from-gold/50 to-gold rounded-full" />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <TrendingUp size={14} className="text-gold" />
                  <div className="flex-1">
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-primary">Trend Match</span>
                      <span className="text-gold">Very High</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: '88%' }} className="h-full bg-gradient-to-r from-gold/50 to-gold rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Target size={14} className="text-gold" />
                  <div className="flex-1">
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-primary">Occasion Fit</span>
                      <span className="text-gold">Perfect</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: '96%' }} className="h-full bg-gradient-to-r from-gold/50 to-gold rounded-full" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
