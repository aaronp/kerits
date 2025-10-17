/**
 * Unread Badge Component
 *
 * Displays unread message count in top-right corner of conversation items.
 */

interface UnreadBadgeProps {
  count: number;
  className?: string;
}

export function UnreadBadge({ count, className = '' }: UnreadBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <div
      className={`
        absolute top-2 right-2
        min-w-[20px] h-5 px-1.5
        flex items-center justify-center
        bg-primary text-primary-foreground
        rounded-full
        text-xs font-semibold
        ${className}
      `}
      aria-label={`${count} unread message${count === 1 ? '' : 's'}`}
    >
      {displayCount}
    </div>
  );
}
