import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HomeReviewsSection() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function fetchTopReviews() {
      const { data } = await supabase
        .from('reviews')
        .select(`
          id, rating, comment, created_at,
          profile:profiles(name, avatar_url),
          product:products(name, product_colors(image_url))
        `)
        .gte('rating', 4)
        .not('comment', 'is', null)
        .order('created_at', { ascending: false })
        .limit(6);
        
      if (data) setReviews(data);
      setLoading(false);
    }
    fetchTopReviews();
  }, []);

  if (loading || reviews.length === 0) return null;

  const nextReview = () => {
    setCurrentIndex((prev) => (prev === reviews.length - 1 ? 0 : prev + 1));
  };

  const prevReview = () => {
    setCurrentIndex((prev) => (prev === 0 ? reviews.length - 1 : prev - 1));
  };

  return (
    <section className="py-24 relative" style={{ background: 'var(--bg-primary)', overflow: 'hidden' }}>
      <div className="container relative z-10" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Header section matching reference design */}
        <div className="text-center mb-16 flex flex-col items-center">
          <div 
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6"
            style={{ background: 'rgba(201, 151, 58, 0.1)', border: '1px solid rgba(201, 151, 58, 0.2)' }}
          >
            <Quote size={14} color="#D4A032" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#D4A032', letterSpacing: '0.05em' }}>
              Trusted by Fashion Enthusiasts
            </span>
          </div>
          
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', lineHeight: 1.1 }}>
            What <span style={{ color: '#D4A032' }}>Shoppers</span> Say
          </h2>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)', maxWidth: '600px', margin: '0 auto' }}>
            Join thousands of users who have transformed their wardrobe and simplified their daily styling routines.
          </p>
        </div>

        {/* Fading Review Slider */}
        <div style={{ position: 'relative', minHeight: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{
                width: '100%',
                maxWidth: '800px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '24px',
                padding: '40px 48px',
                border: '1px solid rgba(201,151,58,0.15)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                backdropFilter: 'blur(20px)',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <Quote size={54} color="rgba(201,151,58,0.08)" style={{ position: 'absolute', top: 24, left: 32 }} />
              
              <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={20} 
                    fill={i < reviews[currentIndex].rating ? '#C9973A' : 'none'} 
                    color={i < reviews[currentIndex].rating ? '#C9973A' : 'rgba(255,255,255,0.1)'} 
                  />
                ))}
              </div>
              
              <p style={{ 
                fontSize: 'clamp(16px, 3vw, 22px)', 
                color: 'rgba(255,255,255,0.9)', 
                lineHeight: 1.7, 
                marginBottom: '32px',
                maxWidth: '640px'
              }}>
                "{reviews[currentIndex].comment}"
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-card)', border: '2px solid rgba(201,151,58,0.3)' }}>
                  {reviews[currentIndex].profile?.avatar_url ? (
                    <img src={reviews[currentIndex].profile.avatar_url} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontWeight: 700, fontSize: '18px' }}>
                      {reviews[currentIndex].profile?.name?.[0] || 'A'}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                    {reviews[currentIndex].profile?.name || 'Anonymous'}
                  </p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                    Verified Buyer
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', marginTop: '32px' }}>
          <button 
            onClick={prevReview}
            className="group"
            style={{ 
              width: '40px', height: '40px', borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
              color: 'rgba(255,255,255,0.6)', transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'rgba(201,151,58,0.5)'; e.currentTarget.style.color = '#C9973A'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
            aria-label="Previous review"
          >
            <ChevronLeft size={20} />
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                style={{
                  width: i === currentIndex ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: i === currentIndex ? '#D4A032' : 'rgba(255,255,255,0.1)',
                  transition: 'all 0.4s ease',
                  cursor: 'pointer',
                  border: 'none',
                  padding: 0
                }}
                aria-label={`Go to review ${i + 1}`}
              />
            ))}
          </div>

          <button 
            onClick={nextReview}
            className="group"
            style={{ 
              width: '40px', height: '40px', borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
              color: 'rgba(255,255,255,0.6)', transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'rgba(201,151,58,0.5)'; e.currentTarget.style.color = '#C9973A'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
            aria-label="Next review"
          >
            <ChevronRight size={20} />
          </button>
        </div>

      </div>
    </section>
  );
}
