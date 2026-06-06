import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStudioStore } from '../../store/studioStore';
import type { MannequinType } from '../../store/studioStore';
import { getDominantColorFromImage } from '../../utils/colorExtractor';

export default function MannequinModel() {
  const groupRef = useRef<THREE.Group>(null);
  const { activeMannequin, outfit } = useStudioStore();

  const [topColor, setTopColor] = useState('#AAAAAA');
  const [bottomColor, setBottomColor] = useState('#AAAAAA');
  const [shoesColor, setShoesColor] = useState('#AAAAAA');

  useEffect(() => {
    const topImg = outfit.top?.product_colors?.[0]?.image_url || outfit.top?.images?.[0];
    const topHex = outfit.top?.product_colors?.[0]?.hex_code || '#AAAAAA';
    if (topImg) {
      getDominantColorFromImage(topImg, 'top').then(color => setTopColor(color !== '#AAAAAA' ? color : topHex));
    } else {
      setTopColor(topHex);
    }
  }, [outfit.top]);

  useEffect(() => {
    const bottomImg = outfit.bottom?.product_colors?.[0]?.image_url || outfit.bottom?.images?.[0];
    const bottomHex = outfit.bottom?.product_colors?.[0]?.hex_code || '#AAAAAA';
    if (bottomImg) {
      getDominantColorFromImage(bottomImg, 'bottom').then(color => setBottomColor(color !== '#AAAAAA' ? color : bottomHex));
    } else {
      setBottomColor(bottomHex);
    }
  }, [outfit.bottom]);

  useEffect(() => {
    const shoesImg = outfit.shoes?.product_colors?.[0]?.image_url || outfit.shoes?.images?.[0];
    const shoesHex = outfit.shoes?.product_colors?.[0]?.hex_code || '#AAAAAA';
    if (shoesImg) {
      getDominantColorFromImage(shoesImg, 'shoes').then(color => setShoesColor(color !== '#AAAAAA' ? color : shoesHex));
    } else {
      setShoesColor(shoesHex);
    }
  }, [outfit.shoes]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.02 - 0.5;
    }
  });

  // Materials
  const baseMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#AAAAAA'),
    metalness: 0.1,
    roughness: 0.4,
  });

  const topMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(topColor),
    metalness: 0.05,
    roughness: 0.8, // Fabric feel
  });

  const bottomMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(bottomColor),
    metalness: 0.05,
    roughness: 0.9, // Denim/fabric feel
  });

  const shoesMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(shoesColor),
    metalness: 0.2,
    roughness: 0.6,
  });

  // Decide if we should render "clothes" meshes or "bare" meshes based on equipped items.
  // Actually, we just color the body parts! This is the most robust way to do color matching.

  return (
    <group ref={groupRef} position={[0, -0.5, 0]} scale={[1.1, 1.1, 1.1]}>
      {/* --- HEAD & NECK --- */}
      <mesh position={[0, 2.3, 0]} material={baseMat}>
        <sphereGeometry args={[0.22, 32, 32]} />
      </mesh>
      <mesh position={[0, 2.05, 0]} material={baseMat}>
        <cylinderGeometry args={[0.08, 0.09, 0.2, 16]} />
      </mesh>

      {/* --- TORSO (Shirt Color) --- */}
      {/* Upper Chest (Wide) */}
      <mesh position={[0, 1.7, 0]} material={topMat}>
        <boxGeometry args={[0.7, 0.55, 0.35]} />
      </mesh>
      {/* Abdomen / Waist (Narrower) */}
      <mesh position={[0, 1.25, 0]} material={topMat}>
        <boxGeometry args={[0.55, 0.45, 0.3]} />
      </mesh>

      {/* --- ARMS --- */}
      {/* Left Shoulder (Shirt Color) */}
      <mesh position={[-0.45, 1.85, 0]} material={topMat}>
        <sphereGeometry args={[0.15, 16, 16]} />
      </mesh>
      {/* Right Shoulder (Shirt Color) */}
      <mesh position={[0.45, 1.85, 0]} material={topMat}>
        <sphereGeometry args={[0.15, 16, 16]} />
      </mesh>

      {/* Left Bicep (Shirt Color - acts like short sleeve) */}
      <mesh position={[-0.55, 1.55, 0]} rotation={[0, 0, 0.15]} material={topMat}>
        <cylinderGeometry args={[0.13, 0.11, 0.5, 16]} />
      </mesh>
      {/* Right Bicep (Shirt Color) */}
      <mesh position={[0.55, 1.55, 0]} rotation={[0, 0, -0.15]} material={topMat}>
        <cylinderGeometry args={[0.13, 0.11, 0.5, 16]} />
      </mesh>

      {/* Left Forearm (Base Color / Skin) */}
      <mesh position={[-0.65, 1.1, 0]} rotation={[0, 0, 0.1]} material={baseMat}>
        <cylinderGeometry args={[0.1, 0.08, 0.5, 16]} />
      </mesh>
      {/* Right Forearm (Base Color / Skin) */}
      <mesh position={[0.65, 1.1, 0]} rotation={[0, 0, -0.1]} material={baseMat}>
        <cylinderGeometry args={[0.1, 0.08, 0.5, 16]} />
      </mesh>

      {/* Hands (Base Color) */}
      <mesh position={[-0.7, 0.8, 0]} material={baseMat}>
        <sphereGeometry args={[0.09, 16, 16]} />
      </mesh>
      <mesh position={[0.7, 0.8, 0]} material={baseMat}>
        <sphereGeometry args={[0.09, 16, 16]} />
      </mesh>

      {/* --- LEGS --- */}
      {/* Pelvis / Hips (Pants Color) */}
      <mesh position={[0, 0.95, 0]} material={bottomMat}>
        <boxGeometry args={[0.58, 0.25, 0.32]} />
      </mesh>

      {/* Left Thigh (Pants Color) */}
      <mesh position={[-0.18, 0.5, 0]} material={bottomMat}>
        <cylinderGeometry args={[0.14, 0.12, 0.7, 16]} />
      </mesh>
      {/* Right Thigh (Pants Color) */}
      <mesh position={[0.18, 0.5, 0]} material={bottomMat}>
        <cylinderGeometry args={[0.14, 0.12, 0.7, 16]} />
      </mesh>

      {/* Left Knee (Pants Color) */}
      <mesh position={[-0.18, 0.15, 0]} material={bottomMat}>
        <sphereGeometry args={[0.12, 16, 16]} />
      </mesh>
      {/* Right Knee (Pants Color) */}
      <mesh position={[0.18, 0.15, 0]} material={bottomMat}>
        <sphereGeometry args={[0.12, 16, 16]} />
      </mesh>

      {/* Left Calf (Pants Color) */}
      <mesh position={[-0.18, -0.25, 0]} material={bottomMat}>
        <cylinderGeometry args={[0.11, 0.09, 0.7, 16]} />
      </mesh>
      {/* Right Calf (Pants Color) */}
      <mesh position={[0.18, -0.25, 0]} material={bottomMat}>
        <cylinderGeometry args={[0.11, 0.09, 0.7, 16]} />
      </mesh>

      {/* --- FEET / SHOES --- */}
      {/* Left Shoe */}
      <mesh position={[-0.18, -0.65, 0.05]} material={shoesMat}>
        <boxGeometry args={[0.16, 0.15, 0.28]} />
      </mesh>
      {/* Right Shoe */}
      <mesh position={[0.18, -0.65, 0.05]} material={shoesMat}>
        <boxGeometry args={[0.16, 0.15, 0.28]} />
      </mesh>

    </group>
  );
}
