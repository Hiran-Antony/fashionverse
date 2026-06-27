import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const BRANDS = [
  { name: 'US Polo Assn', image: '/photos/1.jpeg', type: 'light' },
  { name: 'Rare Rabbit', image: '/photos/2.jpeg', type: 'dark' },
  { name: 'Lacoste', image: '/photos/3.jpeg', type: 'light' },
  { name: 'Indian Terrain', image: '/photos/4.jpeg', type: 'light' },
  { name: 'Lee Cooper', image: '/photos/5.jpeg', type: 'light' },
  { name: 'Zara', image: '/photos/6.png', type: 'light' },
];

// Top Brands curated selection showcase
export default function BrandsSection() {
  return (
    <section className="brands-section" style={{ paddingTop: '60px', paddingBottom: '70px', background: 'var(--bg-primary)' }}>
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center text-center mb-10 gap-3"
        >
          <p
            className="text-xs font-semibold uppercase m-0"
            style={{ color: '#E8B84B', fontFamily: 'Inter, sans-serif', letterSpacing: '0.15em' }}
          >
            Curated Selection
          </p>
          <h2
            className="m-0"
            style={{
              fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}
          >
            Top Brands, All in One Place
          </h2>
          <p className="text-base font-medium m-0 text-center max-w-xl" style={{ color: '#E8B84B', fontFamily: 'Inter, sans-serif', letterSpacing: '0.01em', lineHeight: 1.5 }}>Discover your favourite labels and explore their latest collections</p>
        </motion.div>

        {/* Infinite Marquee Grid */}
        <div className="relative w-full overflow-hidden" style={{ marginBottom: '48px', padding: '10px 0' }}>
          {/* Edge fade masks for premium marquee look */}
          <div className="absolute inset-y-0 left-0 w-[5%] sm:w-[10%] z-20 pointer-events-none" style={{
            background: 'linear-gradient(to right, var(--bg-secondary) 0%, transparent 100%)'
          }} />
          <div className="absolute inset-y-0 right-0 w-[5%] sm:w-[10%] z-20 pointer-events-none" style={{
            background: 'linear-gradient(to left, var(--bg-secondary) 0%, transparent 100%)'
          }} />
          
          <motion.div
            className="flex w-max gap-4 sm:gap-6 lg:gap-8"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ ease: "linear", duration: 20, repeat: Infinity }}
            whileHover={{ animationPlayState: "paused" }} 
          >
            {[...BRANDS, ...BRANDS].map((brand, i) => (
              <div
                key={`${brand.name}-${i}`}
                className="w-[120px] sm:w-[145px] lg:w-[175px] flex-shrink-0 h-full flex flex-col"
              >
                <motion.div
                  whileHover={{ 
                    y: -8, 
                    scale: 1.02,
                    transition: { duration: 0.4, ease: "easeOut" }
                  }}
                  className="h-full flex flex-col"
                >
                  <Link
                    to={`/products?brand=${encodeURIComponent(brand.name)}`}
                    className="group flex flex-col items-center flex-1 no-underline transition-all duration-500 relative"
                    style={{
                      background: 'linear-gradient(135deg, rgba(40, 25, 15, 0.4) 0%, rgba(15, 8, 4, 0.6) 100%)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      borderRadius: '20px',
                      padding: '16px 16px',
                      boxShadow: '0 15px 35px rgba(0,0,0,0.4), inset 0 2px 20px rgba(232,184,75,0.05)',
                    }}
                  >
                    {/* Dynamic inner glow effect on hover (matching feature card) */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                         style={{
                           borderRadius: '20px',
                           background: 'radial-gradient(circle at 50% 50%, rgba(201, 168, 76, 0.12) 0%, transparent 70%)',
                         }}
                    />
                    
                    {/* Premium Glassy Border - Thicker and metallic */}
                    <div className="absolute inset-0 rounded-[20px] pointer-events-none transition-all duration-500 z-0 group-hover:opacity-100 opacity-70 group-hover:shadow-[0_0_25px_rgba(232,184,75,0.2)]"
                         style={{
                           border: '2px solid transparent',
                           background: 'linear-gradient(135deg, rgba(232,184,75,0.6) 0%, rgba(232,184,75,0.1) 50%, rgba(232,184,75,0.6) 100%) border-box',
                           WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                           WebkitMaskComposite: 'destination-out',
                           maskComposite: 'exclude',
                         }}
                    />

                    {/* Inner Light Container for Logo - Enhanced Hover Translate */}
                    <div 
                      className="w-full aspect-square rounded-[14px] flex items-center justify-center p-3 sm:p-4 mb-4 relative z-10 transition-all duration-500 group-hover:bg-white group-hover:-translate-y-2 group-hover:shadow-[0_12px_30px_rgba(201,151,58,0.2)] overflow-hidden"
                      style={{ background: '#F8F6F0' }}
                    >
                      {/* Logo continuous breathing animation - Original Functionality Preserved */}
                      <motion.div
                        animate={{ y: [0, -3, 0], scale: [1, 1.02, 1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
                        className="w-full h-full flex items-center justify-center z-10"
                      >
                        <img
                          src={brand.image}
                          alt={brand.name}
                          className={`max-w-full max-h-full w-auto h-auto object-contain transition-all duration-700 group-hover:scale-105 brand-logo-img brand-logo-img--${brand.type}`}
                        />
                      </motion.div>
                      
                      {/* Golden Fill Animation Overlay on Hover */}
                      {!['Lacoste', 'Lee Cooper'].includes(brand.name) && (
                        <div className="absolute bottom-0 left-0 right-0 bg-[#E8B84B] mix-blend-screen transition-all duration-700 ease-in-out h-0 group-hover:h-full z-20 pointer-events-none opacity-90" />
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-end w-full relative z-10">
                      <p
                        className="transition-all duration-500 group-hover:text-[#F3D37A] group-hover:-translate-y-0.5"
                        style={{
                          fontFamily: 'Syne, sans-serif',
                          fontSize: '14px',
                          fontWeight: 700,
                          color: 'rgba(245, 237, 212, 0.95)',
                          margin: 0,
                          textAlign: 'center',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase'
                        }}
                      >
                        {brand.name}
                      </p>
                      
                      {/* Premium Glassy Metallic Underline */}
                      <div className="h-[2px] w-[85%] mx-auto mt-2.5 transition-all duration-500 rounded-full group-hover:w-full"
                           style={{
                             background: 'linear-gradient(90deg, rgba(232,184,75,0) 0%, rgba(232,184,75,0.9) 50%, rgba(232,184,75,0) 100%)',
                             boxShadow: '0 2px 10px rgba(232,184,75,0.3)'
                           }}
                      />
                    </div>
                  </Link>
                </motion.div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Style moved to index.css for global reuse */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
          style={{ marginTop: '40px' }}
        >
          <Link to="/products" className="clean-premium-btn">
            <div className="clean-premium-btn-bg" />
            <span 
              className="clean-premium-text font-bold uppercase"
              style={{ letterSpacing: '0.15em', fontSize: '13px' }}
            >
              Browse All Brands
            </span>
            <ArrowRight size={16} className="clean-premium-icon" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
