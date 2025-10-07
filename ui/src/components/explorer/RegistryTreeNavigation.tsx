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
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { route } from '@/config';
import { CreateRegistryDialog } from './CreateRegistryDialog';
import { buildRegistryTree, type RegistryNode } from '@/lib/registry-tree';
import type { KeritsDSL } from '@kerits/app/dsl';

interface RegistryTreeNavigationProps {
  dsl: KeritsDSL | null;
  accountAlias: string;
  selectedRegistryId: string | null;
  onRegistryCreated?: () => void;
}

export function RegistryTreeNavigation({ dsl, accountAlias, selectedRegistryId, onRegistryCreated }: RegistryTreeNavigationProps) {
  const navigate = useNavigate();
  const [registryTree, setRegistryTree] = useState<RegistryNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedParentRegistry, setSelectedParentRegistry] = useState<RegistryDSL | null>(null);

  // Build registry hierarchy from DSL using KERI parent traversal
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

        // Use tree builder that calculates depth via parent chain traversal
        const tree = await buildRegistryTree(
          registryAliases,
          (alias) => accountDsl.registry(alias)
        );

        setRegistryTree(tree);
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

  const handleAddSubRegistry = async (node: RegistryNode, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!dsl) return;

    try {
      // Get the registry DSL for this node using its alias
      const accountDsl = await dsl.account(accountAlias);
      if (!accountDsl) return;

      const regDsl = await accountDsl.registry(node.alias);
      if (regDsl) {
        console.log('Setting parent registry for sub-registry creation:', regDsl.registry);
        setSelectedParentRegistry(regDsl);
        setShowCreateDialog(true);
      }
    } catch (error) {
      console.error('Failed to load registry for adding sub-registry:', error);
    }
  };

  const renderNode = (node: RegistryNode, path: string[] = []): JSX.Element => {
    const isExpanded = expandedNodes.has(node.registryId);
    const isSelected = selectedRegistryId === node.registryId;
    const isHovered = hoveredNodeId === node.registryId;
    const hasChildren = node.children.length > 0;
    const currentPath = [...path, node.registryId];

    // Get selected state styling - use explicit classes for Tailwind JIT
    const getSelectedClasses = () => {
      if (!isSelected) return 'hover:bg-muted/50';

      // Depth-based colors for selected state
      const lightColors = ['bg-blue-100', 'bg-indigo-100', 'bg-purple-100', 'bg-pink-100'];
      const lightBorders = ['border-blue-300', 'border-indigo-300', 'border-purple-300', 'border-pink-300'];

      const idx = node.depth % lightColors.length;
      return `${lightColors[idx]} dark:bg-slate-800 ${lightBorders[idx]} dark:border-slate-600 border`;
    };

    return (
      <div key={node.registryId} className="select-none">
        <div
          className={`
            group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer
            transition-colors duration-150 relative
            ${getSelectedClasses()}
          `}
          style={{ paddingLeft: `${node.depth * 16 + 8}px` }}
          onClick={() => handleNodeClick(node.registryId, currentPath)}
          onMouseEnter={() => setHoveredNodeId(node.registryId)}
          onMouseLeave={() => setHoveredNodeId(null)}
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

          <span className={`text-sm ${isSelected ? 'font-medium' : ''} flex-1`}>
            {node.alias}
          </span>

          {/* Fade-in action buttons on hover */}
          <div className={`
            flex items-center gap-1 transition-opacity duration-200
            ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-primary/10"
              onClick={(e) => handleAddSubRegistry(node, e)}
              title="Add sub-registry"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {!isHovered && node.children.length > 0 && (
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
      <div className="p-3 text-sm text-muted-foreground">
        Loading registries...
      </div>
    );
  }

  if (registryTree.length === 0) {
    return (
      <div className="p-3 text-sm text-muted-foreground">
        No registries found. Create one to get started.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-0.5 p-3">
        {registryTree.map(node => renderNode(node))}
      </div>

      {/* Create Sub-Registry Dialog */}
      <CreateRegistryDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) {
            setSelectedParentRegistry(null);
          }
        }}
        parentRegistryDsl={selectedParentRegistry || undefined}
        onSuccess={onRegistryCreated}
      />
    </>
  );
}
