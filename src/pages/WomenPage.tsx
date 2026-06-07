import CategoryPage from './CategoryPage';
import { SUB_CATEGORIES } from '../utils/constants';

export default function WomenPage() {
  return (
    <CategoryPage
      category="women"
      heroTitle="Women's Collection"
      heroSubtitle="SS 2025 — New Arrivals"
      subTabs={SUB_CATEGORIES.women}
      heroAccentColor="rgba(201, 151, 58, 0.10)"
    />
  );
}
