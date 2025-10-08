/**
 * ShowDate - Consistent date formatting component
 *
 * Formats dates in a consistent style across the application
 */

interface ShowDateProps {
  date: string | Date;
  /** Show time in addition to date */
  showTime?: boolean;
}

export function ShowDate({ date, showTime = true }: ShowDateProps) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const formatted = showTime
    ? dateObj.toLocaleString()
    : dateObj.toLocaleDateString();

  return (
    <span className="text-xs text-purple-600 dark:text-purple-400">
      {formatted}
    </span>
  );
}
