// ═══════════════════════════════════════════════════════════════
// FASHIONVERSE DELIVERY HUB — Progress Tracker (3-node)
// ═══════════════════════════════════════════════════════════════

import { Check } from 'lucide-react';

interface ProgressTrackerProps {
  /** 0 = assigned, 1 = picked, 2 = in_transit, 3 = delivered */
  step: number;
}

const STEPS = ['PICKED', 'IN TRANSIT', 'DELIVERED'];

export default function ProgressTracker({ step }: ProgressTrackerProps) {
  return (
    <div className="dh-progress-tracker" style={{ paddingBottom: '36px' }}>
      {STEPS.map((label, i) => {
        const isCompleted = i < step;
        const isActive = i === step;
        const isPending = i > step;

        return (
          <div key={label} style={{ display: 'contents' }}>
            {/* Connector line before (skip first) */}
            {i > 0 && (
              <div className="dh-progress-line">
                <div
                  className="dh-progress-line-fill"
                  style={{ transform: `scaleX(${isCompleted || isActive ? 1 : 0})` }}
                />
              </div>
            )}

            {/* Node */}
            <div
              className={`dh-progress-node ${
                isCompleted ? 'completed' : isActive ? 'active' : 'pending'
              }`}
            >
              {isCompleted ? (
                <Check size={14} strokeWidth={3} />
              ) : (
                <span style={{ fontSize: '10px', fontWeight: 700 }}>{i + 1}</span>
              )}

              {/* Label */}
              <span className="dh-progress-label">{label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
