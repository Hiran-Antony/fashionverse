import { forwardRef, useState, useEffect } from 'react';

interface HeroVideoProps {
  src: string;
  poster: string;
  alt?: string;
  className?: string;
  priority?: boolean;
}

const HeroVideo = forwardRef<HTMLVideoElement, HeroVideoProps>(({
  src,
  poster,
  alt = 'FashionVerse Collection Hero',
  className = '',
  priority = false,
}, ref) => {
  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      className={className}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      controlsList="nodownload noplaybackrate nofullscreen"
      style={{ width: '100%', height: '100%', objectFit: 'cover', background: 'transparent' }}
      aria-label={alt}
      {...({ fetchPriority: priority ? 'high' : undefined } as any)}
    />
  );
});

HeroVideo.displayName = 'HeroVideo';

export default HeroVideo;
