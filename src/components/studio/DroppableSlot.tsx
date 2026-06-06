import { useDroppable } from '@dnd-kit/core';

interface Props {
  id: string;
  className?: string;
  children?: React.ReactNode;
}

export default function DroppableSlot({ id, className = '', children }: Props) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <div 
      ref={setNodeRef} 
      className={`relative ${className} ${isOver ? 'ring-2 ring-gold ring-inset bg-gold/5' : ''}`}
    >
      {children}
    </div>
  );
}
