import HeroSection, {
  CategorySection,
  FeaturesSection,
  CTABanner,
} from '../components/home/HeroSection';
import ProductCarousel from '../components/home/ProductCarousel';
import BrandsSection from '../components/home/BrandsSection';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CategorySection />
      <ProductCarousel
        title="New Arrivals"
        subtitle="Just Dropped"
        filter="featured"
        viewAllLink="/products?sort=newest"
        accentColor="purple"
      />
      <ProductCarousel
        title="Trending Now"
        subtitle="Most Popular"
        filter="trending"
        viewAllLink="/products?sort=popular"
        accentColor="gold"
      />
      <BrandsSection />
      <FeaturesSection />
      <CTABanner />
    </>
  );
}
