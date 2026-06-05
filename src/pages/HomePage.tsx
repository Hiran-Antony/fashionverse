import SplitHero from '../components/home/SplitHero';
import CollectionsSection from '../components/home/CollectionsSection';
import ScrollStory from '../components/home/ScrollStory';
import { FeaturesSection, CTABanner } from '../components/home/HeroSection';
import ProductCarousel from '../components/home/ProductCarousel';
import BrandsSection from '../components/home/BrandsSection';

export default function HomePage() {
  return (
    <>
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
        <FeaturesSection />
      </div>
      <div data-reveal="zoom-in">
        <CTABanner />
      </div>
    </>
  );
}
