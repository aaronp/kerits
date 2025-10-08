/**
 * NodeDetails - Reusable component for displaying KERI data structures
 *
 * Displays structured data with proper formatting for:
 * - AIDs/SAIDs (with visual IDs)
 * - Dates
 * - JSON objects
 * - Arrays
 * - Nested structures
 */

import { VisualId } from './visual-id';

interface NodeDetailsProps {
  data: Record<string, any>;
  /** Optional schema to provide field descriptions */
  schema?: Record<string, { type?: string; description?: string }>;
}

export function NodeDetails({ data, schema }: NodeDetailsProps) {
  const renderValue = (key: string, value: any): React.ReactNode => {
    // Null/undefined
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">null</span>;
    }

    // Boolean
    if (typeof value === 'boolean') {
      return (
        <span className={value ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
          {value.toString()}
        </span>
      );
    }

    // Number
    if (typeof value === 'number') {
      return <span className="text-blue-600 dark:text-blue-400">{value}</span>;
    }

    // Date string (ISO 8601)
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return (
        <span className="text-purple-600 dark:text-purple-400">
          {new Date(value).toLocaleString()}
        </span>
      );
    }

    // AID/SAID (starts with capital letter, 44+ chars)
    if (typeof value === 'string' && /^[A-Z][A-Za-z0-9_-]{43,}$/.test(value)) {
      return (
        <div className="flex items-center gap-2">
          <VisualId variant="marble" value={value} size={24} />
          <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
            {value.substring(0, 16)}...
          </code>
        </div>
      );
    }

    // Array
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-muted-foreground italic">[]</span>;
      }

      return (
        <div className="space-y-1 pl-4 border-l-2 border-muted">
          {value.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <span className="text-muted-foreground">[{idx}]</span>
              {typeof item === 'object' ? (
                <div className="flex-1">
                  <NodeDetails data={item} />
                </div>
              ) : (
                renderValue(`${key}[${idx}]`, item)
              )}
            </div>
          ))}
        </div>
      );
    }

    // Object
    if (typeof value === 'object') {
      return (
        <div className="pl-4 border-l-2 border-muted">
          <NodeDetails data={value} />
        </div>
      );
    }

    // String (default)
    return <span className="text-foreground">{value}</span>;
  };

  const getFieldDescription = (key: string): string | undefined => {
    return schema?.[key]?.description;
  };

  return (
    <div className="space-y-3">
      {Object.entries(data).map(([key, value]) => {
        const description = getFieldDescription(key);

        return (
          <div key={key} className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-muted-foreground min-w-[120px]">
                {key}
              </span>
              <div className="flex-1">
                {renderValue(key, value)}
              </div>
            </div>
            {description && (
              <p className="text-xs text-muted-foreground pl-[120px]">
                {description}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
