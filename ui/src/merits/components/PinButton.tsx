/**
 * Pin Button Component
 *
 * Shows pin icon and drag handle on hover for pinning/unpinning conversations.
 */

import { Pin, GripVertical } from 'lucide-react';

interface PinButtonProps {
  isPinned: boolean;
  onTogglePin: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  className?: string;
}

export function PinButton({
  isPinned,
  onTogglePin,
  onDragStart,
  onDragEnd,
  className = '',
}: PinButtonProps) {
  return (
    <div
      className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${className}`}
    >
      {/* Drag Handle (always visible on hover) */}
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted/50 rounded"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Pin Icon */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin();
        }}
        className={`p-1 hover:bg-muted/50 rounded transition-colors ${
          isPinned ? 'text-primary' : 'text-muted-foreground'
        }`}
        aria-label={isPinned ? 'Unpin conversation' : 'Pin conversation'}
      >
        <Pin className="w-4 h-4" fill={isPinned ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}
