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

  return (
    <Link to="/" className={`brand-logo-link no-underline shrink-0 ${className}`}>
      <div 
        className="brand-logo-img"
        style={{
          width: dim.height, 
          height: dim.height, 
          borderRadius: '50%', 
          overflow: 'hidden', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          flexShrink: 0, 
          background: '#fff'
      }}>
        <img
          src="/logo.png"
          alt="FashionVerse"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          draggable={false}
        />
      </div>
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
