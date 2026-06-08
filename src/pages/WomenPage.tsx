import CategoryPage from './CategoryPage';
import { SUB_CATEGORIES } from '../utils/constants';

export default function WomenPage() {
  return (
    <div className="women-page-wrapper">
      <style>{`
        .women-page-wrapper .cat-hero {
          background-image: linear-gradient(to bottom, rgba(10, 6, 2, 0.2), rgba(18, 10, 6, 1)), url('/photos/women-hero.jpg');
          background-size: cover;
          background-position: center 15%;
          min-height: 480px;
          border-bottom: 1px solid rgba(201, 151, 58, 0.1);
        }
        .women-page-wrapper .cat-hero-title {
          color: #F5EDD4;
          text-shadow: 0 8px 32px rgba(0, 0, 0, 0.9);
          font-size: clamp(3.5rem, 8vw, 5.5rem);
        }
        .women-page-wrapper .cat-hero-eyebrow {
          color: #E8B84B;
          font-weight: 800;
          letter-spacing: 0.2em;
          text-shadow: 0 4px 16px rgba(0, 0, 0, 0.9);
        }
        .women-page-wrapper .cat-hero-meta {
          color: rgba(245, 237, 212, 0.95);
          text-shadow: 0 4px 16px rgba(0, 0, 0, 0.9);
          font-weight: 500;
        }
      `}</style>
      <CategoryPage
        category="women"
        heroTitle="Women's Collection"
        heroSubtitle="SS 2025 — New Arrivals"
        subTabs={SUB_CATEGORIES.women}
        heroAccentColor="transparent"
      />
    </div>
  );
}
