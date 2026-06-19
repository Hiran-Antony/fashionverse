import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, RefreshCcw, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { geminiCall } from '../lib/gemini';
import type { Product } from '../types';
import ProductPickerModal from '../components/ui/ProductPickerModal';

function getOutfitSlot(product: Product): 'upper' | 'bottom' | 'other' {
  const text = `${product.category} ${product.name} ${product.tags?.join(' ')}`.toLowerCase();
  if (/(top|shirt|t-shirt|sweatshirt|jacket|blazer|blouse|sweater|kurti)/.test(text)) return 'upper';
  if (/(bottom|jeans|trouser|short|skirt|legging|pant|cargo)/.test(text)) return 'bottom';
  return 'other';
}

export default function StyleMatchPage() {
  const [product1, setProduct1] = useState<Product | null>(null);
  const [product2, setProduct2] = useState<Product | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<1 | 2>(1);

  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [recommendedProduct, setRecommendedProduct] = useState<Product | null>(null);

  const openPicker = (target: 1 | 2) => {
    setPickerTarget(target);
    setIsPickerOpen(true);
  };

  const handleSelect = (p: Product) => {
    if (pickerTarget === 1) setProduct1(p);
    else setProduct2(p);
    setIsPickerOpen(false);
    // Reset result if inputs change
    setResult(null);
    setRecommendedProduct(null);
  };

  const handleAnalyze = async () => {
    if (!product1 || !product2) return;
    setLoading(true);
    setResult(null);
    setRecommendedProduct(null);
    setStatusText('Analyzing compatibility...');

    try {
      const slot1 = getOutfitSlot(product1);
      const slot2 = getOutfitSlot(product2);

      const isSameCategory = 
        (slot1 === 'upper' && slot2 === 'upper') || 
        (slot1 === 'bottom' && slot2 === 'bottom') ||
        (slot1 === slot2); // fallback for 'other'

      const systemPrompt = `You are a high-end fashion AI stylist. Analyze the style compatibility of these two items.`;
      const p1Desc = `Item 1: ${product1.name} (Color: ${product1.product_colors?.[0]?.color_name || 'Unknown'}, Category: ${product1.category})`;
      const p2Desc = `Item 2: ${product2.name} (Color: ${product2.product_colors?.[0]?.color_name || 'Unknown'}, Category: ${product2.category})`;
      const userMessage = `${p1Desc}\n${p2Desc}`;

      if (isSameCategory) {
        // MODE A: Same category
        const schemaA = {
          type: "object",
          properties: {
            score: { type: "number", description: "Compatibility score 1-100" },
            reason: { type: "string", description: "Brief stylish explanation of why they match or clash" },
            anchorItemIndex: { type: "number", description: "1 or 2 - which is the stronger anchor piece to build an outfit around" },
            recommendedOppositeCategoryStyle: {
              type: "object",
              properties: {
                color: { type: "string", description: "Recommended color for the opposite category item" },
                style: { type: "string", description: "Recommended style (e.g. 'Slim fit jeans', 'White sneakers')" }
              }
            }
          },
          required: ["score", "reason", "anchorItemIndex", "recommendedOppositeCategoryStyle"]
        };

        const aiResult = (await geminiCall(systemPrompt, userMessage, [], schemaA, setStatusText)) as any;
        setResult({ mode: 'A', ...aiResult });

        // Find a matching opposite piece
        setStatusText('Finding the perfect match...');
        const anchorSlot = slot1; // since both are the same, either is fine for the slot type
        const targetSlot = anchorSlot === 'upper' ? 'bottom' : 'upper';
        
        // Fetch a pool of opposite products from Supabase
        const { data: pool } = await supabase.from('products').select('*, product_colors(image_url, color_name)').limit(50);
        if (pool && pool.length > 0) {
          const oppositeItems = pool.filter(p => getOutfitSlot(p) === targetSlot || getOutfitSlot(p) === 'other');
          
          if (oppositeItems.length > 0) {
            // Ask Gemini to pick the best one
            setStatusText('Selecting the best recommendation...');
            const pickSchema = {
              type: "object",
              properties: {
                selectedId: { type: "string" },
                reason: { type: "string" }
              },
              required: ["selectedId", "reason"]
            };
            
            const anchorName = aiResult.anchorItemIndex === 1 ? product1.name : product2.name;
            const pickMsg = `Anchor piece: ${anchorName}\nRecommended style: ${aiResult.recommendedOppositeCategoryStyle.style}, Color: ${aiResult.recommendedOppositeCategoryStyle.color}\n\nSelect the BEST matching item from this list:\n` + JSON.stringify(oppositeItems.map(p => ({id: p.id, name: p.name, color: p.product_colors?.[0]?.color_name || 'Unknown', category: p.category})));
            
            const pickResult = (await geminiCall("You are a stylist. Pick the best matching item from the list for the anchor piece.", pickMsg, [], pickSchema, setStatusText)) as any;
            
            const bestProduct = oppositeItems.find(p => p.id === pickResult.selectedId) || oppositeItems[0];
            setRecommendedProduct(bestProduct);
          }
        }

      } else {
        // MODE B: Cross category (Complete Outfit)
        const schemaB = {
          type: "object",
          properties: {
            score: { type: "number", description: "Overall outfit compatibility score 1-100" },
            reason: { type: "string", description: "Stylish explanation of how well this outfit works together" }
          },
          required: ["score", "reason"]
        };

        const aiResult = (await geminiCall(systemPrompt, userMessage, [], schemaB, setStatusText)) as any;
        setResult({ mode: 'B', ...aiResult });
      }

    } catch (error: any) {
      console.error(error);
      alert('Failed to analyze compatibility. Please try again.');
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 flex flex-col">
      {/* Header */}
      <div className="relative py-12 md:py-16 overflow-hidden flex items-center justify-center text-center mb-8">
        <div className="container relative z-10">
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="uppercase tracking-[0.3em] font-bold text-xs md:text-sm mb-4"
            style={{ color: 'var(--color-gold-primary)' }}
          >
            AI Stylist
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-4xl md:text-6xl font-bold mb-6"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Style Compatibility
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm md:text-base max-w-2xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            Select two items from our catalog. Our AI will analyze their compatibility and recommend how to complete the look.
          </motion.p>
        </div>
      </div>

      <div className="container max-w-4xl flex-1 flex flex-col items-center">
        {/* Selection Area */}
        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 mb-12">
          
          {/* Slot 1 */}
          <div className="w-full md:w-64 aspect-[4/5] relative group">
            {product1 ? (
              <div className="w-full h-full rounded-2xl overflow-hidden border border-[var(--border-color)] relative">
                {product1.product_colors?.[0]?.image_url && <img src={product1.product_colors[0].image_url} alt={product1.name} className="w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => openPicker(1)} className="btn btn-primary rounded-full px-6">Change</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => openPicker(1)}
                className="w-full h-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all hover:border-[#C9973A] hover:bg-white/5"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                  <Plus size={32} />
                </div>
                <span className="font-semibold tracking-wider text-sm">SELECT ITEM 1</span>
              </button>
            )}
            {product1 && <div className="mt-4 text-center text-sm font-medium truncate px-4">{product1.name}</div>}
          </div>

          <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)]">
            <Plus size={20} style={{ color: 'var(--text-muted)' }} />
          </div>

          {/* Slot 2 */}
          <div className="w-full md:w-64 aspect-[4/5] relative group">
            {product2 ? (
              <div className="w-full h-full rounded-2xl overflow-hidden border border-[var(--border-color)] relative">
                {product2.product_colors?.[0]?.image_url && <img src={product2.product_colors[0].image_url} alt={product2.name} className="w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => openPicker(2)} className="btn btn-primary rounded-full px-6">Change</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => openPicker(2)}
                className="w-full h-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all hover:border-[#C9973A] hover:bg-white/5"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                  <Plus size={32} />
                </div>
                <span className="font-semibold tracking-wider text-sm">SELECT ITEM 2</span>
              </button>
            )}
            {product2 && <div className="mt-4 text-center text-sm font-medium truncate px-4">{product2.name}</div>}
          </div>

        </div>

        {/* Action Button */}
        <div className="mb-12">
          <button
            onClick={handleAnalyze}
            disabled={!product1 || !product2 || loading}
            className={`btn btn-primary px-8 py-4 text-lg rounded-xl flex items-center gap-3 relative overflow-hidden group ${(!product1 || !product2 || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ 
              boxShadow: product1 && product2 ? 'var(--glow-gold)' : 'none',
              background: 'var(--gradient-primary)'
            }}
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
            {loading ? <RefreshCcw size={24} className="animate-spin" /> : <Sparkles size={24} />}
            <span>Analyze Compatibility</span>
          </button>
          
          {loading && statusText && (
            <p className="text-center mt-4 text-sm font-medium animate-pulse" style={{ color: '#C9973A' }}>
              {statusText}
            </p>
          )}
        </div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl p-8 rounded-2xl border mb-16"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex flex-col md:flex-row items-center gap-8 mb-8 pb-8 border-b border-[var(--border-color)]">
                <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center rounded-full border-[4px]" style={{ borderColor: result.score >= 80 ? '#10B981' : result.score >= 50 ? '#F59E0B' : '#EF4444' }}>
                  <span className="text-4xl font-bold font-display">{result.score}%</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">
                    {result.score >= 80 ? 'Perfect Match!' : result.score >= 50 ? 'Good Combination' : 'Style Clash'}
                  </h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed text-sm md:text-base">
                    {result.reason}
                  </p>
                </div>
              </div>

              {result.mode === 'A' && (
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-[#C9973A] mb-6">Stylist Recommendation</h4>
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1 text-sm text-[var(--text-secondary)] leading-relaxed">
                      <p className="mb-4">
                        To complete this look, we recommend building around your <strong className="text-[var(--text-primary)]">{result.anchorItemIndex === 1 ? product1?.name : product2?.name}</strong>.
                      </p>
                      <p>
                        Look for <strong className="text-[var(--text-primary)]">{result.recommendedOppositeCategoryStyle.color} {result.recommendedOppositeCategoryStyle.style}</strong> to balance the outfit perfectly.
                      </p>
                    </div>
                    
                    {recommendedProduct && (
                      <Link 
                        to={`/product/${recommendedProduct.id}`}
                        className="w-full md:w-48 group block relative rounded-xl overflow-hidden border border-[var(--border-color)] hover:border-[#C9973A] transition-all"
                      >
                        <div className="aspect-[4/5] bg-black/20">
                          {recommendedProduct.product_colors?.[0]?.image_url && (
                            <img src={recommendedProduct.product_colors[0].image_url} alt={recommendedProduct.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          )}
                        </div>
                        <div className="absolute bottom-0 inset-x-0 p-3 bg-black/80 backdrop-blur-md translate-y-full group-hover:translate-y-0 transition-transform">
                          <p className="text-xs font-bold text-white truncate">{recommendedProduct.name}</p>
                          <p className="text-[#C9973A] text-xs font-semibold mt-1">Shop Now <ArrowRight size={12} className="inline" /></p>
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <ProductPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleSelect}
        excludeProductId={pickerTarget === 1 ? product2?.id : product1?.id}
      />
    </div>
  );
}
