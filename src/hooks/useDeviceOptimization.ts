import { useState, useEffect } from 'react';

export interface DeviceOptimization {
  isMobile: boolean;
  isTablet: boolean;
  prefersReducedMotion: boolean;
  isLowEnd: boolean;
  prefersReducedData: boolean;
}

export default function useDeviceOptimization(): DeviceOptimization {
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [isTablet, setIsTablet] = useState(() => 
    typeof window !== 'undefined' ? (window.innerWidth >= 768 && window.innerWidth < 1024) : false
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
  );
  const [isLowEnd, setIsLowEnd] = useState(false);
  const [prefersReducedData, setPrefersReducedData] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Resize Check for Mobile and Tablet
    const checkDimensions = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    checkDimensions();
    window.addEventListener('resize', checkDimensions);

    // 2. Reduced Motion Check
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);
    const motionListener = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    motionQuery.addEventListener('change', motionListener);

    // 3. Low-End / Data Check
    const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
    let connection: any = null;

    const checkDeviceState = () => {
      if (nav) {
        connection = nav.connection || nav.mozConnection || nav.webkitConnection;
        // Check reduced data
        if (connection) {
          setPrefersReducedData(connection.saveData === true);
        }

        // Check low end CPU (<= 4 cores) or low RAM (<= 4 GB) or slow network
        const lowCpu = nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 4;
        const lowRam = nav.deviceMemory !== undefined && nav.deviceMemory <= 4;
        const slowNetwork = connection ? ['slow-2g', '2g', '3g'].includes(connection.effectiveType) : false;

        setIsLowEnd(lowCpu || lowRam || slowNetwork);
      }
    };

    checkDeviceState();

    if (connection) {
      connection.addEventListener('change', checkDeviceState);
    }

    return () => {
      window.removeEventListener('resize', checkDimensions);
      motionQuery.removeEventListener('change', motionListener);
      if (connection) {
        connection.removeEventListener('change', checkDeviceState);
      }
    };
  }, []);

  return { isMobile, isTablet, prefersReducedMotion, isLowEnd, prefersReducedData };
}

// Named export for backwards compatibility
export { useDeviceOptimization };
