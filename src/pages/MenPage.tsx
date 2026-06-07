import CategoryPage from './CategoryPage';
import { SUB_CATEGORIES } from '../utils/constants';

export default function MenPage() {
  return (
    <CategoryPage
      category="men"
      heroTitle="Men's Collection"
      heroSubtitle="SS 2025 — New Arrivals"
      subTabs={SUB_CATEGORIES.men}
      heroAccentColor="rgba(201, 151, 58, 0.08)"
    />
  );
}
