// ═══════════════════════════════════════════════════════════════
// FASHIONVERSE DELIVERY HUB — Stats Row Component
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';

interface StatsRowProps {
  earnings: number;
  done: number;
  inProgress: number;
}

function CountUp({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (target === 0) { setDisplay(0); return; }
    const duration = 600;
    const steps = 20;
    const stepTime = duration / steps;
    const increment = target / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), target);
      setDisplay(current);
      if (step >= steps) clearInterval(timer);
    }, stepTime);

    return () => clearInterval(timer);
  }, [target]);

  return <>{prefix}{display.toLocaleString('en-IN')}{suffix}</>;
}

export default function StatsRow({ earnings, done, inProgress }: StatsRowProps) {
  return (
    <div className="stats-row">
      <div className="stat-card green">
        <div className="stat-value">₹{earnings}</div>
        <div className="stat-label">TODAY'S EARNINGS</div>
      </div>
      <div className="stat-card orange">
        <div className="stat-value">{done}</div>
        <div className="stat-label">DELIVERIES DONE</div>
      </div>
      <div className="stat-card blue">
        <div className="stat-value">{inProgress}</div>
        <div className="stat-label">IN PROGRESS</div>
      </div>
    </div>
  );
}
