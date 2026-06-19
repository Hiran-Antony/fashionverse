import React, { useState, useEffect, forwardRef } from 'react';
import { Camera } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  ...props
}, ref) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state if src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#1A0F08] border border-[rgba(201,151,58,0.15)] rounded-xl text-[rgba(245,237,212,0.45)] p-4 text-center select-none ${className}`}
        style={{ width: width || '100%', height: height || '100%', minHeight: '150px' }}
      >
        <Camera size={24} className="text-[#C9973A]/45 mb-2" />
        <span className="text-xs font-bold tracking-widest uppercase text-[#E8B84B]/60">Image unavailable</span>
      </div>
    );
  }

  // Generate responsive src urls based on the provider
  const getResponsiveSrc = (url: string, targetWidth: number) => {
    if (!url) return '';
    if (url.includes('supabase') || url.includes('unsplash')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}width=${targetWidth}`;
    }
    return url;
  };

  const srcSet = [
    `${getResponsiveSrc(src, 400)} 400w`,
    `${getResponsiveSrc(src, 800)} 800w`,
    `${getResponsiveSrc(src, 1200)} 1200w`,
  ].join(', ');

  const loadingMode = priority ? 'eager' : 'lazy';
  const decodingMode = priority ? 'sync' : 'async';

  return (
    <img
      ref={ref}
      src={getResponsiveSrc(src, 800) || src}
      srcSet={srcSet}
      sizes="(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px"
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={loadingMode}
      decoding={decodingMode}
      {...({ fetchPriority: priority ? 'high' : undefined } as any)}
      onError={() => setHasError(true)}
      {...props}
    />
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
