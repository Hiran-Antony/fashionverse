import React, { useState, useEffect, useRef } from 'react';

interface LazySectionProps {
  children: React.ReactNode;
  minHeight?: string;
  rootMargin?: string;
}

export default function LazySection({
  children,
  minHeight = '400px',
  rootMargin = '200px',
}: LazySectionProps) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [rootMargin]);

  return (
    <div ref={sectionRef} style={{ minHeight: isIntersecting ? 'auto' : minHeight }}>
      {isIntersecting ? (
        <React.Suspense fallback={<div className="w-full bg-[rgba(26,15,8,0.03)] animate-pulse rounded-3xl" style={{ height: minHeight }} />}>
          {children}
        </React.Suspense>
      ) : (
        <div 
          className="w-full bg-[rgba(26,15,8,0.03)] animate-pulse rounded-3xl"
          style={{ height: minHeight }}
        />
      )}
    </div>
  );
}
