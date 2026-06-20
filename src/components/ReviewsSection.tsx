import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Star, MessageSquare } from 'lucide-react';
export default function ReviewsSection({ productId }: { productId: string }) {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profile:profiles(name, avatar_url)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setReviews(data);
    }
    setLoading(false);
  };

  if (loading) return null;

  return (
    <div style={{ marginTop: '64px', borderTop: '1px solid var(--border-color)', paddingTop: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '24px' }}>
        <MessageSquare size={24} color="#C9973A" />
        <h3 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>Customer Reviews</h3>
      </div>



      {reviews.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No reviews yet. Be the first to review this product!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {reviews.map((review) => (
            <div key={review.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                  {review.profile?.avatar_url ? (
                    <img src={review.profile.avatar_url} alt={review.profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '18px', fontWeight: 600 }}>
                      {review.profile?.name?.[0] || '?'}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{review.profile?.name || 'Anonymous User'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(review.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={14} fill={star <= review.rating ? '#C9973A' : 'none'} color={star <= review.rating ? '#C9973A' : 'var(--border-color)'} />
                ))}
              </div>
              {review.comment && <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{review.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
