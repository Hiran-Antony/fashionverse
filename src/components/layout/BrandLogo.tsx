import { useState } from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
  lightText?: boolean;
}

const SIZES = {
  sm: { height: 36 },
  md: { height: 48 },
  lg: { height: 64 },
};

export default function BrandLogo({
  size = 'md',
  showWordmark = true,
  className = '',
  lightText = false,
}: BrandLogoProps) {
  const dim = SIZES[size];
  const [logoSrc, setLogoSrc] = useState('/brand-logo.png');

  return (
    <Link to="/" className={`brand-logo-link no-underline shrink-0 ${className}`}>
      <img
        src={logoSrc}
        alt="FashionVerse"
        className="brand-logo-img"
        style={{ height: dim.height, width: 'auto' }}
        draggable={false}
        onError={() => setLogoSrc('/brand-logo.svg')}
      />
      {showWordmark && (
        <div className="brand-logo-wordmark hidden sm:block">
          <span
            className="brand-logo-name"
            style={{ color: lightText ? '#f5f5f0' : 'var(--text-primary)' }}
          >
            FashionVerse
          </span>
          <span
            className="brand-logo-tagline"
            style={{ color: lightText ? 'rgba(245,245,240,0.55)' : 'var(--color-accent-gold)' }}
          >
            Where Style Meets Intelligence
          </span>
        </div>
      )}
    </Link>
  );
}
