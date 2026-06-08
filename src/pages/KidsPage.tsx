import CategoryPage from './CategoryPage';
import { SUB_CATEGORIES } from '../utils/constants';

export default function KidsPage() {
  return (
    <CategoryPage
      category="kids"
      heroTitle="Kids' Collection"
      heroSubtitle="SS 2025 — New Arrivals"
      subTabs={SUB_CATEGORIES.kids}
      heroAccentColor="rgba(201, 151, 58, 0.06)"
    />
  );
}
