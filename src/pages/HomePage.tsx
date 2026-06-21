import { lazy, Suspense, useEffect } from 'react';
import SplitHero from '../components/home/SplitHero';
import CollectionsSection from '../components/home/CollectionsSection';
import HomeReviewsSection from '../components/home/HomeReviewsSection';
import LazySection from '../components/LazySection';
import { queryClient } from '../main';
import { supabase } from '../lib/supabase';

// ─── DEFERRED COMPONENTS (Loaded after initial render) ─────────────
const ScrollStory = lazy(() => import('../components/home/ScrollStory'));
const ProductCarousel = lazy(() => import('../components/home/ProductCarousel'));
const BrandsSection = lazy(() => import('../components/home/BrandsSection'));

// ─── LAZY ON SCROLL COMPONENTS (Loaded on viewport intersection) ───
const FeaturesSectionLazy = lazy(() =>
  import('../components/home/HeroSection').then((module) => ({ default: module.FeaturesSection }))
);
const CTABannerLazy = lazy(() =>
  import('../components/home/HeroSection').then((module) => ({ default: module.CTABanner }))
);

// ─── Placeholder Skeletons ─────────────────────────────────────────
function CarouselSkeleton() {
  return (
    <div className="container py-12 animate-pulse">
      <div className="h-4 w-28 bg-[rgba(201,168,76,0.15)] rounded mb-4" />
      <div className="h-8 w-64 bg-[rgba(201,168,76,0.2)] rounded mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="aspect-[3/4] bg-[rgba(201,168,76,0.1)] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  useEffect(() => {
    // Defer prefetching slightly to give First Paint maximum main thread availability
    const timer = setTimeout(() => {
      // Eagerly prefetch featured products carousel
      queryClient.prefetchQuery({
        queryKey: ['products-carousel', 'featured'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('products')
            .select(`
              id, name, price, original_price, category, brand, rating, review_count, tags, is_featured, is_trending, is_active, created_at,
              product_colors(id, color_name, hex_code, image_url),
              product_sizes(id, size, stock, is_out_of_stock)
            `)
            .eq('is_featured', true)
            .eq('is_active', true)
            .limit(10);
          if (error) throw error;
          return data || [];
        },
      }).catch(err => console.error('Prefetch featured failed', err));

      // Eagerly prefetch trending products carousel
      queryClient.prefetchQuery({
        queryKey: ['products-carousel', 'trending'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('products')
            .select(`
              id, name, price, original_price, category, brand, rating, review_count, tags, is_featured, is_trending, is_active, created_at,
              product_colors(id, color_name, hex_code, image_url),
              product_sizes(id, size, stock, is_out_of_stock)
            `)
            .eq('is_trending', true)
            .eq('is_active', true)
            .limit(10);
          if (error) throw error;
          return data || [];
        },
      }).catch(err => console.error('Prefetch trending failed', err));
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* 1. IMMEDIATE RENDER (First Paint priority) */}
      <SplitHero />
      <CollectionsSection />
      <ScrollStory />
      <div data-reveal="fade-up">
        <ProductCarousel
          title="New Arrivals"
          subtitle="Just Dropped"
          filter="featured"
          viewAllLink="/products?sort=newest"
          accentColor="gold"
        />
      </div>
      <div data-reveal="fade-up" data-reveal-delay="100">
        <ProductCarousel
          title="Trending Now"
          subtitle="Most Popular"
          filter="trending"
          viewAllLink="/products?sort=popular"
          accentColor="gold"
        />
      </div>
      <div data-reveal="fade-up">
        <BrandsSection />
      </div>
      <div data-reveal="fade-up">
        <LazySection>
          <FeaturesSectionLazy />
        </LazySection>
      </div>
      <div data-reveal="fade-up">
        <LazySection minHeight="400px">
          <HomeReviewsSection />
        </LazySection>
      </div>
      <div data-reveal="zoom-in">
        <LazySection>
          <CTABannerLazy />
        </LazySection>
      </div>
    </>
  );
}
