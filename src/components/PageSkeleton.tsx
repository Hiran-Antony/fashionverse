export default function PageSkeleton() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#120a06] text-[#f5f0e8] select-none">
      <div className="flex flex-col items-center gap-4">
        {/* Spinning ring */}
        <div className="w-12 h-12 rounded-full border-4 border-[rgba(201,151,58,0.15)] border-t-[#C9973A] animate-spin" />
        {/* Pulsing text */}
        <p className="text-sm font-bold tracking-[0.2em] uppercase text-[#E8B84B] animate-pulse">
          Loading FashionVerse...
        </p>
      </div>
    </div>
  );
}
