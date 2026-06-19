// @ts-ignore
import VirtualTryOn from "../components/VirtualTryOn";
import useDeviceOptimization from "../hooks/useDeviceOptimization";

export default function TryOnPage() {
  const { isMobile } = useDeviceOptimization();

  if (isMobile) {
    return (
      <div className="p-4 text-center bg-[#0d0b07] min-h-screen text-[#f5f0e8] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-3 text-[#c9a84c] uppercase">AI Try-On</h1>
        <p className="text-xs text-[#8a7a5a] max-w-sm mb-6">
          The interactive AI fitting room is optimized for mobile. Use the features below to upload snapshots and generate your customized outfits.
        </p>
        <div className="w-full max-w-xs rounded-xl overflow-hidden border border-[rgba(201,168,76,0.15)] bg-[rgba(26,15,8,0.5)] mb-6 p-3">
          <img 
            src="/photos/hero-bg.jpeg" 
            alt="AI Try-On Mobile Showcase" 
            className="w-full aspect-[4/5] object-cover rounded-lg" 
            loading="eager"
          />
        </div>
        <VirtualTryOn />
      </div>
    );
  }

  return <VirtualTryOn />;
}
