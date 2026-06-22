import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

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
    <section className="py-24 relative" style={{ background: 'var(--bg-primary)', overflow: 'hidden' }}>
      <style>{`
        .testimonial-swiper {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          padding-bottom: 60px; /* Space for pagination dots */
        }
        .testimonial-swiper .swiper-slide {
          opacity: 0.15;
          transform: scale(0.85);
          transition: all 0.4s ease;
          height: auto;
          display: flex;
        }
        .testimonial-swiper .swiper-slide-active {
          opacity: 1;
          transform: scale(1);
        }
        .testimonial-swiper .swiper-pagination-bullet {
          background: rgba(255,255,255,0.2);
          opacity: 1;
        }
        .testimonial-swiper .swiper-pagination-bullet-active {
          background: #D4A032;
          width: 24px;
          border-radius: 4px;
        }
        .testi-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          width: 44px; height: 44px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.5);
          color: rgba(255,255,255,0.6); transition: all 0.3s ease;
          cursor: pointer;
          backdrop-filter: blur(8px);
        }
        .testi-nav-btn:hover {
          border-color: rgba(201,151,58,0.5); color: #C9973A;
        }
        .testi-prev { left: 16px; }
        .testi-next { right: 16px; }
        @media (min-width: 768px) {
          .testi-prev { left: -60px; }
          .testi-next { right: -60px; }
        }
        @media (max-width: 640px) {
          .testi-nav-btn { display: none; }
        }
      `}</style>
      
      <div className="container relative z-10" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Header section matching reference design */}
        <div className="text-center mb-16 flex flex-col items-center">
          <div 
            className="inline-flex items-center gap-2 rounded-full mb-6"
            style={{ background: 'rgba(201, 151, 58, 0.1)', border: '1px solid rgba(201, 151, 58, 0.2)', padding: '8px 20px', marginTop: '40px' }}
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

        {/* Swiper Carousel */}
        <div style={{ position: 'relative', margin: '0 auto', maxWidth: '900px' }}>
          
          {/* Custom Navigation */}
          <button className="testi-nav-btn testi-prev" aria-label="Previous review">
            <ChevronLeft size={24} />
          </button>
          <button className="testi-nav-btn testi-next" aria-label="Next review">
            <ChevronRight size={24} />
          </button>

          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            slidesPerView={1}
            breakpoints={{
              640: {
                slidesPerView: 1.3,
                spaceBetween: 32,
              }
            }}
            centeredSlides={true}
            spaceBetween={16}
            loop={true}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            pagination={{ clickable: true }}
            navigation={{
              prevEl: '.testi-prev',
              nextEl: '.testi-next',
            }}
            className="testimonial-swiper"
          >
            {reviews.map((review, idx) => (
              <SwiperSlide key={review.id || idx}>
                <div
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '24px',
                    padding: '40px 48px',
                    border: '1px solid rgba(201,151,58,0.15)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(20px)',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative'
                  }}
                >
                  <Quote size={54} color="rgba(201,151,58,0.08)" style={{ position: 'absolute', top: 24, left: 32 }} />
                  
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={20} 
                        fill={i < review.rating ? '#C9973A' : 'none'} 
                        color={i < review.rating ? '#C9973A' : 'rgba(255,255,255,0.1)'} 
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
                    "{review.comment}"
                  </p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-card)', border: '2px solid rgba(201,151,58,0.3)' }}>
                      {review.profile?.avatar_url ? (
                        <img src={review.profile.avatar_url} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontWeight: 700, fontSize: '18px' }}>
                          {review.profile?.name?.[0] || 'A'}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {review.profile?.name || 'Anonymous'}
                      </p>
                      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                        Verified Buyer
                      </p>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
