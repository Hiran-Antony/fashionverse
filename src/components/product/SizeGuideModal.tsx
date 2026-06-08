import { useEffect, useState } from 'react';
import { X, Ruler } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MEN_SIZE_DATA = [
  { size: 'XS', chest: '34', waist: '28', hips: '34', shoulder: '15.5' },
  { size: 'S', chest: '36', waist: '30', hips: '36', shoulder: '16.5' },
  { size: 'M', chest: '38-40', waist: '32-34', hips: '38-40', shoulder: '17.5' },
  { size: 'L', chest: '42-44', waist: '36-38', hips: '42-44', shoulder: '18.5' },
  { size: 'XL', chest: '46-48', waist: '40-42', hips: '46-48', shoulder: '19.5' },
  { size: 'XXL', chest: '50-52', waist: '44-46', hips: '50-52', shoulder: '20.5' },
];

const WOMEN_SIZE_DATA = [
  { size: 'XS', chest: '32', waist: '24', hips: '34', shoulder: '14' },
  { size: 'S', chest: '34', waist: '26', hips: '36', shoulder: '14.5' },
  { size: 'M', chest: '36-38', waist: '28-30', hips: '38-40', shoulder: '15.5' },
  { size: 'L', chest: '40-42', waist: '32-34', hips: '42-44', shoulder: '16.5' },
  { size: 'XL', chest: '44-46', waist: '36-38', hips: '46-48', shoulder: '17.5' },
  { size: 'XXL', chest: '48-50', waist: '40-42', hips: '50-52', shoulder: '18.5' },
];

export default function SizeGuideModal({ isOpen, onClose }: SizeGuideModalProps) {
  const [activeTab, setActiveTab] = useState<'MEN' | 'WOMEN'>('MEN');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeData = activeTab === 'MEN' ? MEN_SIZE_DATA : WOMEN_SIZE_DATA;

  return (
    <div className="size-guide-overlay" onClick={onClose}>
      <div className="size-guide-modal" onClick={e => e.stopPropagation()}>
        <div className="size-guide-header">
          <div>
            <h2 className="size-guide-title">Size Guide</h2>
            <p className="size-guide-subtitle">Find your perfect fit</p>
          </div>
          <button className="size-guide-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="size-guide-body">
          {/* Left column — size chart table */}
          <div className="size-guide-left">
            <div className="size-tabs">
              <button
                className={`size-tab ${activeTab === 'MEN' ? 'active' : ''}`}
                onClick={() => setActiveTab('MEN')}
              >
                MEN
              </button>
              <button
                className={`size-tab ${activeTab === 'WOMEN' ? 'active' : ''}`}
                onClick={() => setActiveTab('WOMEN')}
              >
                WOMEN
              </button>
            </div>

            <table className="size-table">
              <thead>
                <tr>
                  <th>SIZE</th>
                  <th>CHEST (IN)</th>
                  <th>WAIST (IN)</th>
                  <th>HIPS (IN)</th>
                  <th>SHOULDER (IN)</th>
                </tr>
              </thead>
              <tbody>
                {sizeData.map((row) => (
                  <tr key={row.size}>
                    <td>{row.size}</td>
                    <td>{row.chest}</td>
                    <td>{row.waist}</td>
                    <td>{row.hips}</td>
                    <td>{row.shoulder}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="size-tip">
              💡 If you are between sizes, we recommend sizing up for a more comfortable fit.
            </div>
          </div>

          {/* Right column — measurement video */}
          <div className="size-guide-right">
            <div style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              borderRadius: '0 0 20px 0',
            }}>
              {/* Video perfectly blended */}
              <video
                src="/videos/size-guide.mp4"
                autoPlay
                muted
                loop
                playsInline
                disablePictureInPicture
                controlsList="nodownload nofullscreen noremoteplayback"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scale(0.90)',
                  display: 'block',
                  pointerEvents: 'none',
                  WebkitMaskImage: 'radial-gradient(ellipse at center, black 50%, transparent 95%)',
                  maskImage: 'radial-gradient(ellipse at center, black 50%, transparent 95%)',
                }}
              />

              {/* Vignette overlay to fade out video borders */}
              <div style={{
                position: 'absolute',
                inset: 0,
                boxShadow: 'inset 0 0 80px 40px #120a06',
                pointerEvents: 'none',
                zIndex: 4,
              }} />

              {/* Soft blurred cover for watermark */}
              <div style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                width: '100px',
                height: '50px',
                background: '#000',
                filter: 'blur(15px)',
                zIndex: 2,
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
