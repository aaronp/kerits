/**
 * RegistryTreeNavigation - Sidebar tree view for registry hierarchy
 *
 * Displays registries in a hierarchical tree structure with:
 * - Recursive nesting for sub-registries
 * - Visual tree connectors
 * - Click to navigate (updates URL)
 * - Depth-based visual styling
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { Button } from '../ui/button';
import { route } from '@/config';
import type { KeritsDSL } from '@/../src/app/dsl/types';

interface RegistryNode {
  registryId: string;
  alias: string;
  issuerAid: string;
  parentRegistryId?: string;
  depth: number;
  children: RegistryNode[];
}

interface RegistryTreeNavigationProps {
  dsl: KeritsDSL | null;
  accountAlias: string;
  selectedRegistryId: string | null;
}

export function RegistryTreeNavigation({ dsl, accountAlias, selectedRegistryId }: RegistryTreeNavigationProps) {
  const navigate = useNavigate();
  const [registryTree, setRegistryTree] = useState<RegistryNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Build registry hierarchy from DSL
  useEffect(() => {
    async function buildHierarchy() {
      if (!dsl) return;

      try {
        setLoading(true);
        const accountDsl = await dsl.account(accountAlias);
        if (!accountDsl) {
          setRegistryTree([]);
          return;
        }

        // Get all registries for this account
        const registryAliases = await accountDsl.listRegistries();

        // Build flat list with parent relationships
        const registryMap = new Map<string, RegistryNode>();

        for (const alias of registryAliases) {
          const registryDsl = await accountDsl.registry(alias);
          if (registryDsl) {
            const registry = registryDsl.registry;
            registryMap.set(registry.registryId, {
              registryId: registry.registryId,
              alias: registry.alias,
              issuerAid: registry.issuerAid,
              parentRegistryId: registry.parentRegistryId,
              depth: 0,
              children: [],
            });
          }
        }

        // Build tree structure
        const rootNodes: RegistryNode[] = [];

        for (const node of registryMap.values()) {
          if (node.parentRegistryId) {
            const parent = registryMap.get(node.parentRegistryId);
            if (parent) {
              node.depth = parent.depth + 1;
              parent.children.push(node);
            } else {
              // Parent not found, treat as root
              rootNodes.push(node);
            }
          } else {
            rootNodes.push(node);
          }
        }

        // Sort children by alias
        const sortChildren = (nodes: RegistryNode[]) => {
          nodes.sort((a, b) => a.alias.localeCompare(b.alias));
          nodes.forEach(node => sortChildren(node.children));
        };
        sortChildren(rootNodes);

        setRegistryTree(rootNodes);
      } catch (error) {
        console.error('Failed to build registry hierarchy:', error);
        setRegistryTree([]);
      } finally {
        setLoading(false);
      }
    }

    buildHierarchy();
  }, [dsl, accountAlias]);

  const toggleNode = (registryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(registryId)) {
        newSet.delete(registryId);
      } else {
        newSet.add(registryId);
      }
      return newSet;
    });
  };

  const handleNodeClick = (registryId: string, registryPath: string[]) => {
    // Navigate to registry detail view with path in URL
    const pathParam = registryPath.join('/');
    navigate(route(`/dashboard/explorer/${accountAlias}/${pathParam}`));
  };

  const renderNode = (node: RegistryNode, path: string[] = []): JSX.Element => {
    const isExpanded = expandedNodes.has(node.registryId);
    const isSelected = selectedRegistryId === node.registryId;
    const hasChildren = node.children.length > 0;
    const currentPath = [...path, node.registryId];

    // Depth-based styling
    const depthColors = [
      'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
      'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800',
      'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800',
      'bg-pink-50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-800',
    ];
    const depthColor = depthColors[node.depth % depthColors.length];

    return (
      <div key={node.registryId} className="select-none">
        <div
          className={`
            flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer
            transition-colors duration-150
            ${isSelected ? `${depthColor} border` : 'hover:bg-muted/50'}
          `}
          style={{ paddingLeft: `${node.depth * 16 + 8}px` }}
          onClick={() => handleNodeClick(node.registryId, currentPath)}
        >
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 hover:bg-transparent"
              onClick={(e) => toggleNode(node.registryId, e)}
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          {!hasChildren && <div className="w-5" />}

          {isExpanded || hasChildren ? (
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground" />
          )}

          <span className={`text-sm ${isSelected ? 'font-medium' : ''}`}>
            {node.alias}
          </span>

          {node.children.length > 0 && (
            <span className="text-xs text-muted-foreground ml-auto">
              ({node.children.length})
            </span>
          )}
        </div>

        {isExpanded && node.children.length > 0 && (
          <div className="space-y-0.5">
            {node.children.map(child => renderNode(child, currentPath))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Loading registries...
      </div>
    );
  }

  if (registryTree.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No registries found. Create one to get started.
      </div>
    );
  }

  return (
    <div className="space-y-0.5 p-2">
      {registryTree.map(node => renderNode(node))}
    </div>
  );
}
