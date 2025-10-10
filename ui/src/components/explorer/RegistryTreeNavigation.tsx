/**
 * RegistryTreeNavigation - Sidebar tree view for registry hierarchy
 *
 * Displays registries in a hierarchical tree structure with:
 * - Recursive nesting for sub-registries
 * - Visual tree connectors
 * - Click to navigate (updates URL)
 * - Depth-based visual styling
 */

import { useState, useEffect, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { route } from '@/config';
import { CreateRegistryDialog } from './CreateRegistryDialog';
import { buildRegistryTree, type RegistryNode } from '@/lib/registry-tree';
import { useTheme } from '@/lib/theme-provider';
import type { KeritsDSL, RegistryDSL } from '@kerits/app/dsl';

const EXPANDED_REGISTRIES_PREF_KEY = 'explorer.expandedRegistries';
const LAST_SELECTED_REGISTRY_PREF_KEY = 'explorer.lastSelectedRegistry';

interface RegistryTreeNavigationProps {
  dsl: KeritsDSL | null;
  accountAlias: string;
  selectedRegistryId: string | null;
  onRegistryCreated?: () => void;
}

export function RegistryTreeNavigation({ dsl, accountAlias, selectedRegistryId, onRegistryCreated }: RegistryTreeNavigationProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [registryTree, setRegistryTree] = useState<RegistryNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedParentRegistry, setSelectedParentRegistry] = useState<RegistryDSL | null>(null);

  // Load expanded state from preferences on mount
  useEffect(() => {
    async function loadExpandedState() {
      if (!dsl || !accountAlias) return;

      try {
        const appData = dsl.appData();
        const savedState = await appData.get<Record<string, string[]>>(EXPANDED_REGISTRIES_PREF_KEY);

        if (savedState && savedState[accountAlias]) {
          setExpandedNodes(new Set(savedState[accountAlias]));
        }
      } catch (error) {
        console.error('[RegistryTreeNavigation] Failed to load expanded state:', error);
      }
    }

    loadExpandedState();
  }, [dsl, accountAlias]);

  // Auto-expand parent registries when a registry is selected
  useEffect(() => {
    async function expandParentsOfSelected() {
      if (!dsl || !accountAlias || !selectedRegistryId || registryTree.length === 0) return;

      try {
        // Find all parent registry IDs by traversing up the parent chain
        const parentIds: string[] = [];
        const accountDsl = await dsl.account(accountAlias);
        if (!accountDsl) return;

        let currentId: string | undefined = selectedRegistryId;

        while (currentId) {
          const registryAliases = await accountDsl.listRegistries();
          let foundParent = false;

          for (const alias of registryAliases) {
            const regDsl = await accountDsl.registry(alias);
            if (regDsl && regDsl.registry.registryId === currentId) {
              // Check if this registry has a parent
              if (regDsl.registry.parentRegistryId) {
                parentIds.push(regDsl.registry.parentRegistryId);
                currentId = regDsl.registry.parentRegistryId;
                foundParent = true;
                break;
              }
            }
          }

          if (!foundParent) break;
        }

        if (parentIds.length > 0) {
          setExpandedNodes(prev => {
            const newSet = new Set(prev);
            parentIds.forEach(id => newSet.add(id));

            // Save to preferences
            saveExpandedState(newSet);

            return newSet;
          });
        }
      } catch (error) {
        console.error('[RegistryTreeNavigation] Failed to expand parents:', error);
      }
    }

    expandParentsOfSelected();
  }, [selectedRegistryId, registryTree, dsl, accountAlias]);

  // Build registry hierarchy from DSL using KERI parent traversal
  useEffect(() => {
    async function buildHierarchy() {
      if (!dsl) {
        setLoading(true);
        return;
      }

      try {
        setLoading(true);

        const accountDsl = await dsl.account(accountAlias);
        if (!accountDsl) {
          console.error('[RegistryTreeNavigation] Account not found:', accountAlias);
          setRegistryTree([]);
          setLoading(false);
          return;
        }

        const registryAliases = await accountDsl.listRegistries();

        // Use tree builder that calculates depth via parent chain traversal
        const tree = await buildRegistryTree(
          registryAliases,
          (alias) => accountDsl.registry(alias)
        );

        setRegistryTree(tree);
      } catch (error) {
        console.error('[RegistryTreeNavigation] Failed to build registry hierarchy:', error);
        setRegistryTree([]);
      } finally {
        setLoading(false);
      }
    }

    buildHierarchy();
  }, [dsl, accountAlias]);

  // Save expanded state to preferences
  const saveExpandedState = async (expandedSet: Set<string>) => {
    if (!dsl || !accountAlias) return;

    try {
      const appData = dsl.appData();
      const currentState = await appData.get<Record<string, string[]>>(EXPANDED_REGISTRIES_PREF_KEY) || {};
      currentState[accountAlias] = Array.from(expandedSet);
      await appData.set(EXPANDED_REGISTRIES_PREF_KEY, currentState);
    } catch (error) {
      console.error('[RegistryTreeNavigation] Failed to save expanded state:', error);
    }
  };

  const toggleNode = (registryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(registryId)) {
        newSet.delete(registryId);
      } else {
        newSet.add(registryId);
      }

      // Save to preferences
      saveExpandedState(newSet);

      return newSet;
    });
  };

  const handleNodeClick = async (registryId: string, registryPath: string[]) => {
    // Save last selected registry to preferences
    if (dsl) {
      try {
        const appData = dsl.appData();
        const lastSelected = await appData.get<Record<string, { registryId: string; path: string[] }>>(LAST_SELECTED_REGISTRY_PREF_KEY) || {};
        lastSelected[accountAlias] = { registryId, path: registryPath };
        await appData.set(LAST_SELECTED_REGISTRY_PREF_KEY, lastSelected);
      } catch (error) {
        console.error('[RegistryTreeNavigation] Failed to save last selected registry:', error);
      }
    }

    // Navigate to registry detail view with path in URL
    const pathParam = registryPath.join('/');
    navigate(route(`/explorer/${accountAlias}/${pathParam}`));
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

    // Get selected state styling based on current theme
    const getSelectedClasses = () => {
      if (!isSelected) return 'hover:bg-muted/50';

      if (theme === 'dark') {
        // Dark theme: use slate colors
        return 'bg-slate-800 border-slate-600 border';
      } else {
        // Light theme: use depth-based colors
        const lightColors = ['bg-blue-100', 'bg-indigo-100', 'bg-purple-100', 'bg-pink-100'];
        const lightBorders = ['border-blue-300', 'border-indigo-300', 'border-purple-300', 'border-pink-300'];
        const idx = node.depth % lightColors.length;
        return `${lightColors[idx]} ${lightBorders[idx]} border`;
      }
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

          {isExpanded && hasChildren ? (
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
