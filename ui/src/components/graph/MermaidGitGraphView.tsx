import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import type { VisualizationData } from '@/lib/indexer-to-graph';

interface MermaidGitGraphProps {
  data: VisualizationData;
}

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  gitGraph: {
    mainBranchName: 'main'
  }
});

export default function MermaidGitGraphView({ data }: MermaidGitGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const renderGraph = async () => {
      try {
        setError(null);

        // Convert JSON data to Mermaid gitGraph syntax
        const mermaidCode = jsonToMermaidGitGraph(data);

        // Clear previous content
        containerRef.current!.innerHTML = '';

        // Create a unique ID for this graph
        const id = `mermaid-${Date.now()}`;

        // Render the graph
        const { svg } = await mermaid.render(id, mermaidCode);
        containerRef.current!.innerHTML = svg;
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render graph');
      }
    };

    renderGraph();
  }, [data]);

  return (
    <div>
      {error && <div className="text-red-500 p-4">Error: {error}</div>}
      <div ref={containerRef} style={{ padding: '1rem' }} />
    </div>
  );
}

function jsonToMermaidGitGraph(data: VisualizationData): string {
  // Check if data has identities array (KERI format)
  if (!data || !data.identities || !Array.isArray(data.identities)) {
    return `gitGraph
  commit id: "No data"
`;
  }

  let mermaid = 'gitGraph\n';

  // Create a common KERI root
  mermaid += `  commit id: "KERI"\n`;

  // Process each identity
  data.identities.forEach((identity, identityIdx) => {
    const identityName = (identity.alias || `User${identityIdx}`).replace(/[^a-zA-Z0-9]/g, '_');
    const events = identity.events || [];

    // Branch each identity's KEL from the common KERI root
    const mainBranch = `${identityName}_KEL`;
    const branches = new Map<string, { name: string; parentBranch?: string }>();

    mermaid += `  checkout main\n`;
    mermaid += `  branch ${mainBranch}\n`;
    mermaid += `  checkout ${mainBranch}\n`;

    let currentBranch = mainBranch;
    branches.set('KEL', { name: currentBranch });

    // Group events by registry first, then sort by sequence number
    const registryGroups = new Map<string, any[]>();
    events.forEach((event) => {
      const registry = event.registry || 'KEL';
      if (!registryGroups.has(registry)) {
        registryGroups.set(registry, []);
      }
      registryGroups.get(registry)!.push(event);
    });

    // Sort registries: KEL first, then alphabetically
    const sortedRegistries = Array.from(registryGroups.keys()).sort((a, b) => {
      if (a === 'KEL') return -1;
      if (b === 'KEL') return 1;
      return a.localeCompare(b);
    });

    // Process each registry
    sortedRegistries.forEach(registry => {
      const registryEvents = registryGroups.get(registry)!;

      // Sort events within registry by sequence number
      registryEvents.sort((a, b) => (a.sn || 0) - (b.sn || 0));

      // Create branch for non-KEL registries
      if (registry !== 'KEL') {
        const branchName = `${identityName}_${registry.replace(/[^a-zA-Z0-9]/g, '_')}`;

        if (!branches.has(registry)) {
          // Checkout parent branch first
          const parentRegistry = getParentRegistry(registry);
          const parentBranch = branches.get(parentRegistry)?.name || mainBranch;

          mermaid += `  checkout ${parentBranch}\n`;
          mermaid += `  branch ${branchName}\n`;

          branches.set(registry, { name: branchName, parentBranch });
        }

        mermaid += `  checkout ${branchName}\n`;
        currentBranch = branchName;
      } else {
        mermaid += `  checkout ${mainBranch}\n`;
        currentBranch = mainBranch;
      }

      // Add commits for this registry
      registryEvents.forEach((event) => {
        const eventType = event.type || 'unknown';
        // Sanitize label - remove quotes and limit length
        const rawLabel = event.label || event.type || '';
        const label = rawLabel.replace(/"/g, "'").substring(0, 30);
        const eventIdShort = event.id.substring(0, 8);

        mermaid += `  commit id: "${eventIdShort}" tag: "${eventType}"\n`;
      });
    });
  });

  return mermaid;
}

function getParentRegistry(registry: string): string {
  if (registry === 'KEL') return 'KEL';
  const parts = registry.split('/');
  if (parts.length === 1) return 'KEL';
  return parts.slice(0, -1).join('/');
}
