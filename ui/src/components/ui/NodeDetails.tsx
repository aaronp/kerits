/**
 * NodeDetails - Reusable component for displaying KERI data structures
 *
 * Displays structured data with proper formatting for:
 * - AIDs/SAIDs (show only VisualId, truncated text for links)
 * - Dates
 * - JSON objects
 * - Arrays
 * - Nested structures
 */

import { Link } from 'react-router-dom';
import { VisualId } from './visual-id';
import { ShowDate } from './ShowDate';
import { route } from '@/config';

interface NodeDetailsProps {
  data: Record<string, any>;
  /** Optional schema to provide field descriptions */
  schema?: Record<string, { type?: string; description?: string }>;
  /** Use grid layout (responsive columns) instead of stacked */
  layout?: 'grid' | 'stacked';
}

export function NodeDetails({ data, schema, layout = 'grid' }: NodeDetailsProps) {
  const isAidOrSaid = (value: any): boolean => {
    return typeof value === 'string' && /^[A-Z][A-Za-z0-9_-]{43,}$/.test(value);
  };

  const isSignature = (value: any): boolean => {
    // Signatures are CESR-encoded values that start with digits (like 0B, 0C, etc.)
    return typeof value === 'string' && /^[0-9][A-Za-z0-9_-]{43,}$/.test(value);
  };

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

    // Issued At / Date fields (special handling)
    if ((key.toLowerCase().includes('issued') || key.toLowerCase().includes('date')) && typeof value === 'string') {
      // Try to parse as date
      const dateObj = new Date(value);
      if (!isNaN(dateObj.getTime())) {
        return <ShowDate date={dateObj} />;
      }
    }

    // Date string (ISO 8601)
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return <ShowDate date={value} />;
    }

    // Schema ID (special case - make it a link with just VisualId)
    if ((key.toLowerCase() === 'schema id' || key.toLowerCase() === 'schema') && isAidOrSaid(value)) {
      return (
        <Link
          to={route(`/dashboard/schemas?selected=${value}`)}
          className="inline-flex items-center hover:opacity-80 transition-opacity"
          title={`View schema: ${value}`}
        >
          <VisualId
            label=""
            variant="marble"
            value={value}
            size={20}
            showCopy={false}
            small
          />
        </Link>
      );
    }

    // Issuer/Holder with alias (show alias as text, not ID)
    if ((key.toLowerCase() === 'issuer' || key.toLowerCase() === 'holder') && !isAidOrSaid(value)) {
      return <span className="text-sm font-medium">{value}</span>;
    }

    // Signature (CESR-encoded, show as VisualId)
    if (isSignature(value)) {
      return (
        <VisualId
          label=""
          variant="marble"
          value={value}
          size={20}
          showCopy={false}
          small
        />
      );
    }

    // AID/SAID (show only VisualId avatar, no label or copy button)
    if (isAidOrSaid(value)) {
      return (
        <VisualId
          label=""
          variant="marble"
          value={value}
          size={20}
          showCopy={false}
          small
        />
      );
    }

    // Array
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-muted-foreground italic">[]</span>;
      }

      // Special handling for arrays of AIDs/SAIDs (like Public Keys or Signatures)
      // Show as a simple list without array indices
      if (value.every(item => typeof item === 'string')) {
        return (
          <div className="space-y-1">
            {value.map((item, idx) => (
              <div key={idx}>
                {renderValue(`${key}[${idx}]`, item)}
              </div>
            ))}
          </div>
        );
      }

      // For complex arrays, show with indices
      return (
        <div className="space-y-1 pl-3 border-l border-muted mt-1">
          {value.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <span className="text-muted-foreground text-xs">[{idx}]</span>
              {typeof item === 'object' ? (
                <div className="flex-1">
                  <NodeDetails data={item} layout="stacked" />
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
        <div className="pl-3 border-l border-muted mt-1">
          <NodeDetails data={value} layout="stacked" />
        </div>
      );
    }

    // String (default)
    return <span className="text-foreground">{value}</span>;
  };

  const getFieldDescription = (key: string): string | undefined => {
    return schema?.[key]?.description;
  };

  const containerClass = layout === 'grid'
    ? 'grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2'
    : 'space-y-2';

  return (
    <div className={containerClass}>
      {Object.entries(data).map(([key, value]) => {
        const description = getFieldDescription(key);

        return (
          <div key={key}>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground w-24 shrink-0">
                {key}:
              </span>
              <div className="flex-1 min-w-0 flex items-center">
                {renderValue(key, value)}
              </div>
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5 ml-[7rem]">
                {description}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
