/**
 * RegistryBreadcrumbs - Path navigation for registry hierarchy
 *
 * Displays:
 * - Account name as root
 * - Chain of registry names leading to current registry
 * - Clickable navigation to parent registries
 */

import { ChevronRight, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { route } from '@/config';

interface RegistryBreadcrumbsProps {
  accountAlias: string;
  registryPath: string[];
  registryAliases: Map<string, string>;
}

export function RegistryBreadcrumbs({
  accountAlias,
  registryPath,
  registryAliases,
}: RegistryBreadcrumbsProps) {
  const navigate = useNavigate();

  const handleNavigate = (depth: number) => {
    if (depth === 0) {
      // Navigate to account root (no registry selected)
      navigate(route(`/dashboard/explorer/${accountAlias}`));
    } else {
      // Navigate to registry at this depth
      const pathSegment = registryPath.slice(0, depth).join('/');
      navigate(route(`/dashboard/explorer/${accountAlias}/${pathSegment}`));
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
      <button
        onClick={() => handleNavigate(0)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted transition-colors text-sm"
      >
        <Home className="h-4 w-4" />
        <span className="font-medium">{accountAlias}</span>
      </button>

      {registryPath.map((registryId, index) => {
        const alias = registryAliases.get(registryId) || registryId.substring(0, 12) + '...';
        const isLast = index === registryPath.length - 1;

        return (
          <div key={registryId} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <button
              onClick={() => handleNavigate(index + 1)}
              disabled={isLast}
              className={`
                px-2 py-1 rounded-md text-sm transition-colors
                ${isLast
                  ? 'font-medium text-foreground cursor-default'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
              `}
            >
              {alias}
            </button>
          </div>
        );
      })}
    </div>
  );
}
