import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import MannequinModel from './MannequinModel';
import { useStudioStore } from '../../store/studioStore';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function MannequinScene() {
  const { isCinematicPreview } = useStudioStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    if (isCinematicPreview) {
      gsap.to(containerRef.current, {
        background: '#050505',
        duration: 2,
        ease: 'power3.inOut'
      });
    } else {
      gsap.to(containerRef.current, {
        background: 'transparent',
        duration: 1,
        ease: 'power2.out'
      });
    }
  }, [isCinematicPreview]);

  return (
    <div ref={containerRef} className="w-full h-full relative flex items-center justify-center rounded-3xl overflow-hidden border border-gold/20">
      <Canvas shadows camera={{ position: [0, 0.5, 7], fov: 45 }}>
        {/* Dark Elegant Studio Background */}
        <color attach="background" args={['#24201C']} />
        
        {/* Balanced studio lighting */}
        <ambientLight intensity={isCinematicPreview ? 0.3 : 0.9} />
        
        {/* Main Overhead Key Light */}
        <spotLight 
          position={[2, 6, 4]} 
          angle={0.4} 
          penumbra={1} 
          intensity={isCinematicPreview ? 4 : 1.5} 
          castShadow 
          color="#ffffff"
        />
        
        {/* Dramatic Left Side Light (Silver/Cool) */}
        <spotLight 
          position={[-6, 1, 1]} 
          angle={0.6} 
          penumbra={0.8} 
          intensity={isCinematicPreview ? 8 : 4} 
          color="#A8C0D8" 
        />

        {/* Dramatic Right Side Light (Brand Gold) */}
        <spotLight 
          position={[6, 2, -1]} 
          angle={0.6} 
          penumbra={0.8} 
          intensity={isCinematicPreview ? 10 : 5} 
          color="#E8B84B" 
        />
        
        {/* Under-glow for mood */}
        <spotLight position={[0, -3, 2]} angle={0.8} penumbra={1} intensity={0.5} color="#C9973A" />

        <MannequinModel />

        {/* Realistic ground shadow */}
        <ContactShadows position={[0, -1.2, 0]} opacity={0.4} scale={5} blur={2} far={2} color="#000000" />
        
        <OrbitControls 
          enablePan={false}
          enableZoom={true}
          minDistance={3}
          maxDistance={10}
          target={[0, 0.5, 0]}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
          autoRotate={isCinematicPreview}
          autoRotateSpeed={2}
        />
      </Canvas>
      
      {/* CSS overlay for the drag-and-drop droppable area if needed */}
    </div>
  );
}
