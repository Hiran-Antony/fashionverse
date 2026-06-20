import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Star, Quote } from 'lucide-react';
import { getOptimizedUrl } from '../../lib/cloudinary';

export default function HomeReviewsSection() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <section className="py-24" style={{ background: 'var(--bg-card)' }}>
      <div className="container" style={{ padding: '0 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Loved by Our Customers
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            See what FashionVerse shoppers have to say about their new favorite outfits.
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {reviews.map((r) => {
            const productImageUrl = r.product?.product_colors?.[0]?.image_url;
            return (
              <div key={r.id} style={{
                background: 'var(--bg-secondary)',
                borderRadius: '24px',
                padding: '24px',
                border: '1px solid rgba(201,151,58,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                position: 'relative'
              }}>
                <Quote size={40} color="rgba(201,151,58,0.1)" style={{ position: 'absolute', top: 20, right: 20 }} />
                
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill={i < r.rating ? '#C9973A' : 'none'} color={i < r.rating ? '#C9973A' : 'var(--border-color)'} />
                  ))}
                </div>
                
                <p style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.6, flex: 1, fontStyle: 'italic' }}>
                  "{r.comment}"
                </p>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-card)' }}>
                    {r.profile?.avatar_url ? (
                      <img src={r.profile.avatar_url} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontWeight: 700 }}>
                        {r.profile?.name?.[0] || 'A'}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{r.profile?.name || 'Anonymous'}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Verified Buyer</p>
                  </div>
                  {productImageUrl && (
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                      <img src={getOptimizedUrl(productImageUrl, 60)} alt={r.product?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
